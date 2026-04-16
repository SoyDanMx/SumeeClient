-- =========================================================================
-- TRIGGERS COMPLETOS: Sincronización professional_stats → profiles
-- =========================================================================
-- Este script crea triggers completos para sincronizar TODOS los campos
-- desde professional_stats (actualizado por SumeePros) a profiles (leído por SumeeClient)
--
-- Arquitectura:
--   SumeePros → professional_stats → [TRIGGERS] → profiles → SumeeClient/Web
--
-- Principio: SumeePros es la fuente de verdad para expediente/documentación
--
-- Fecha: 2025-01-XX
-- =========================================================================

-- =========================================================================
-- PARTE 1: FUNCIÓN AUXILIAR - Construir URL completa desde path
-- =========================================================================
CREATE OR REPLACE FUNCTION build_storage_url(path_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Si ya es una URL completa, retornarla
    IF path_text LIKE 'http%' THEN
        RETURN path_text;
    END IF;
    
    -- Construir URL de Supabase Storage
    -- Nota: Reemplazar 'YOUR_SUPABASE_URL' con tu URL real o usar variable de entorno
    RETURN CONCAT(
        'https://', 
        COALESCE(
            current_setting('app.supabase_url', true),
            'YOUR_SUPABASE_URL'  -- Reemplazar con tu URL real
        ),
        '/storage/v1/object/public/sumee-expedientes/',
        path_text
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =========================================================================
-- PARTE 2: FUNCIÓN PRINCIPAL - Sincronizar professional_stats → profiles
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_professional_to_profiles()
RETURNS TRIGGER AS $$
DECLARE
    supabase_url TEXT;
    cert_urls TEXT[];
    antecedentes_url TEXT;
BEGIN
    -- Obtener URL de Supabase (puede estar en variable de entorno o config)
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := NULL; -- Usar build_storage_url que maneja NULL
    END;
    
    -- =====================================================================
    -- SINCRONIZAR AVATAR
    -- =====================================================================
    -- Avatar: professional_stats.avatar_url → profiles.avatar_url
    -- Solo actualizar si hay un nuevo avatar o cambió
    IF NEW.avatar_url IS NOT NULL 
       AND NEW.avatar_url != '' 
       AND (OLD.avatar_url IS NULL OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url) THEN
        
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Avatar sincronizado: user_id=%, avatar_url=%', NEW.user_id, NEW.avatar_url;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR NOMBRE COMPLETO
    -- =====================================================================
    -- Full Name: professional_stats.full_name → profiles.full_name
    IF NEW.full_name IS NOT NULL 
       AND NEW.full_name != '' 
       AND (OLD.full_name IS NULL OR OLD.full_name IS DISTINCT FROM NEW.full_name) THEN
        
        UPDATE profiles
        SET 
            full_name = NEW.full_name,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Nombre sincronizado: user_id=%, full_name=%', NEW.user_id, NEW.full_name;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR ESPECIALIDAD
    -- =====================================================================
    -- Specialty: professional_stats.specialty → profiles.profession
    -- Solo si profiles.profession está vacío o es diferente
    IF NEW.specialty IS NOT NULL 
       AND NEW.specialty != '' THEN
        
        UPDATE profiles
        SET 
            profession = COALESCE(NULLIF(profiles.profession, ''), NEW.specialty),
            updated_at = NOW()
        WHERE user_id = NEW.user_id
          AND (profiles.profession IS NULL OR profiles.profession = '');
        
        RAISE NOTICE 'Especialidad sincronizada: user_id=%, specialty=%', NEW.user_id, NEW.specialty;
    END IF;
    
    -- =====================================================================
    -- EXTRAER CERTIFICACIONES DESDE expediente_data
    -- =====================================================================
    -- Certificaciones: expediente_data->>'certificaciones' → profiles.certificaciones_urls
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'certificaciones'
       AND jsonb_typeof(NEW.expediente_data->'certificaciones') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'certificaciones') > 0 THEN
        
        -- Extraer array de URLs de certificaciones
        SELECT array_agg(
            CASE 
                WHEN value::text LIKE 'http%' THEN value::text
                ELSE build_storage_url(value::text)
            END
        )
        INTO cert_urls
        FROM jsonb_array_elements_text(NEW.expediente_data->'certificaciones');
        
        -- Actualizar profiles solo si hay certificaciones nuevas
        IF cert_urls IS NOT NULL AND array_length(cert_urls, 1) > 0 THEN
            UPDATE profiles
            SET 
                certificaciones_urls = cert_urls,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
            
            RAISE NOTICE 'Certificaciones sincronizadas: user_id=%, count=%', NEW.user_id, array_length(cert_urls, 1);
        END IF;
    END IF;
    
    -- =====================================================================
    -- EXTRAER ANTECEDENTES NO PENALES DESDE expediente_data
    -- =====================================================================
    -- Antecedentes: expediente_data->>'no_penales' → profiles.antecedentes_no_penales_url
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'no_penales'
       AND jsonb_typeof(NEW.expediente_data->'no_penales') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'no_penales') > 0 THEN
        
        -- Tomar el primer archivo de antecedentes
        SELECT CASE 
            WHEN value::text LIKE 'http%' THEN value::text
            ELSE build_storage_url(value::text)
        END
        INTO antecedentes_url
        FROM jsonb_array_elements_text(NEW.expediente_data->'no_penales')
        LIMIT 1;
        
        -- Actualizar profiles
        IF antecedentes_url IS NOT NULL THEN
            UPDATE profiles
            SET 
                antecedentes_no_penales_url = antecedentes_url,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
            
            RAISE NOTICE 'Antecedentes sincronizados: user_id=%, url=%', NEW.user_id, antecedentes_url;
        END IF;
    END IF;
    
    -- =====================================================================
    -- MAPEAR ESTADO DE EXPEDIENTE A ONBOARDING STATUS
    -- =====================================================================
    -- Expediente Status: professional_stats.expediente_status → profiles.onboarding_status
    IF NEW.expediente_status IS NOT NULL 
       AND (OLD.expediente_status IS NULL OR OLD.expediente_status IS DISTINCT FROM NEW.expediente_status) THEN
        
        UPDATE profiles
        SET 
            onboarding_status = CASE 
                WHEN NEW.expediente_status = 'approved' THEN 'approved'
                WHEN NEW.expediente_status = 'pending_approval' THEN 'pending_review'
                WHEN NEW.expediente_status = 'rejected' THEN 'rejected'
                WHEN NEW.expediente_status = 'not_uploaded' THEN 'pending_review'
                ELSE profiles.onboarding_status
            END,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Estado de onboarding sincronizado: user_id=%, expediente_status=%, onboarding_status=%', 
            NEW.user_id, 
            NEW.expediente_status,
            CASE 
                WHEN NEW.expediente_status = 'approved' THEN 'approved'
                WHEN NEW.expediente_status = 'pending_approval' THEN 'pending_review'
                WHEN NEW.expediente_status = 'rejected' THEN 'rejected'
                WHEN NEW.expediente_status = 'not_uploaded' THEN 'pending_review'
                ELSE 'sin_cambios'
            END;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR CALIFICACIÓN PROMEDIO (Opcional)
    -- =====================================================================
    -- Average Rating: professional_stats.average_rating → profiles.calificacion_promedio
    -- Solo si cambió significativamente (diferencia > 0.1)
    IF NEW.average_rating IS NOT NULL 
       AND (OLD.average_rating IS NULL 
            OR ABS(NEW.average_rating - OLD.average_rating) > 0.1) THEN
        
        UPDATE profiles
        SET 
            calificacion_promedio = NEW.average_rating,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Calificación sincronizada: user_id=%, rating=%', NEW.user_id, NEW.average_rating;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- PARTE 3: CREAR TRIGGER
-- =========================================================================
DROP TRIGGER IF EXISTS sync_professional_trigger ON professional_stats;

CREATE TRIGGER sync_professional_trigger
AFTER INSERT OR UPDATE ON professional_stats
FOR EACH ROW
EXECUTE FUNCTION sync_professional_to_profiles();

-- =========================================================================
-- PARTE 4: MIGRACIÓN DE DATOS EXISTENTES (One-time)
-- =========================================================================
-- Ejecutar una vez para sincronizar todos los datos existentes
-- Solo actualiza si hay diferencias

DO $$
DECLARE
    supabase_url TEXT;
BEGIN
    -- Obtener URL de Supabase
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := 'YOUR_SUPABASE_URL'; -- Reemplazar con tu URL real
    END;
    
    -- Sincronizar avatares
    UPDATE profiles p
    SET 
        avatar_url = ps.avatar_url,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.avatar_url IS NOT NULL
      AND ps.avatar_url != ''
      AND (p.avatar_url IS NULL OR p.avatar_url = '' OR p.avatar_url != ps.avatar_url);
    
    -- Sincronizar nombres
    UPDATE profiles p
    SET 
        full_name = ps.full_name,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.full_name IS NOT NULL
      AND ps.full_name != ''
      AND (p.full_name IS NULL OR p.full_name = '' OR p.full_name != ps.full_name);
    
    -- Sincronizar especialidades (solo si profiles.profession está vacío)
    UPDATE profiles p
    SET 
        profession = ps.specialty,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.specialty IS NOT NULL
      AND ps.specialty != ''
      AND (p.profession IS NULL OR p.profession = '');
    
    -- Sincronizar certificaciones
    UPDATE profiles p
    SET 
        certificaciones_urls = (
            SELECT array_agg(
                CASE 
                    WHEN value::text LIKE 'http%' THEN value::text
                    ELSE CONCAT('https://', supabase_url, '/storage/v1/object/public/sumee-expedientes/', value::text)
                END
            )
            FROM jsonb_array_elements_text(ps.expediente_data->'certificaciones')
        ),
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.expediente_data IS NOT NULL
      AND ps.expediente_data ? 'certificaciones'
      AND jsonb_typeof(ps.expediente_data->'certificaciones') = 'array'
      AND jsonb_array_length(ps.expediente_data->'certificaciones') > 0;
    
    -- Sincronizar antecedentes
    UPDATE profiles p
    SET 
        antecedentes_no_penales_url = (
            SELECT CASE 
                WHEN value::text LIKE 'http%' THEN value::text
                ELSE CONCAT('https://', supabase_url, '/storage/v1/object/public/sumee-expedientes/', value::text)
            END
            FROM jsonb_array_elements_text(ps.expediente_data->'no_penales')
            LIMIT 1
        ),
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.expediente_data IS NOT NULL
      AND ps.expediente_data ? 'no_penales'
      AND jsonb_typeof(ps.expediente_data->'no_penales') = 'array'
      AND jsonb_array_length(ps.expediente_data->'no_penales') > 0;
    
    -- Sincronizar estado de onboarding
    UPDATE profiles p
    SET 
        onboarding_status = CASE 
            WHEN ps.expediente_status = 'approved' THEN 'approved'
            WHEN ps.expediente_status = 'pending_approval' THEN 'pending_review'
            WHEN ps.expediente_status = 'rejected' THEN 'rejected'
            WHEN ps.expediente_status = 'not_uploaded' THEN 'pending_review'
            ELSE p.onboarding_status
        END,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.expediente_status IS NOT NULL
      AND p.onboarding_status IS DISTINCT FROM (
          CASE 
              WHEN ps.expediente_status = 'approved' THEN 'approved'
              WHEN ps.expediente_status = 'pending_approval' THEN 'pending_review'
              WHEN ps.expediente_status = 'rejected' THEN 'rejected'
              WHEN ps.expediente_status = 'not_uploaded' THEN 'pending_review'
              ELSE p.onboarding_status
          END
      );
    
    -- Sincronizar calificación promedio
    UPDATE profiles p
    SET 
        calificacion_promedio = ps.average_rating,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.average_rating IS NOT NULL
      AND (p.calificacion_promedio IS NULL OR ABS(p.calificacion_promedio - ps.average_rating) > 0.1);
    
    RAISE NOTICE 'Migración de datos existentes completada';
END $$;

-- =========================================================================
-- PARTE 5: VERIFICACIÓN (Ejecutar después de crear los triggers)
-- =========================================================================
-- Query para verificar que la sincronización funciona correctamente

SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    p.profession as profiles_profession,
    ps.specialty as stats_specialty,
    p.onboarding_status as profiles_onboarding,
    ps.expediente_status as stats_expediente,
    p.calificacion_promedio as profiles_rating,
    ps.average_rating as stats_rating,
    CASE 
        WHEN p.avatar_url = ps.avatar_url 
             AND COALESCE(p.full_name, '') = COALESCE(ps.full_name, '')
             AND p.onboarding_status = CASE 
                 WHEN ps.expediente_status = 'approved' THEN 'approved'
                 WHEN ps.expediente_status = 'pending_approval' THEN 'pending_review'
                 WHEN ps.expediente_status = 'rejected' THEN 'rejected'
                 WHEN ps.expediente_status = 'not_uploaded' THEN 'pending_review'
                 ELSE p.onboarding_status
             END
        THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 20;

-- =========================================================================
-- PARTE 6: VERIFICAR TRIGGERS ACTIVOS
-- =========================================================================
-- Query para verificar que los triggers están creados y activos

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'professional_stats'
  AND trigger_name LIKE 'sync%'
ORDER BY trigger_name;

-- =========================================================================
-- NOTAS IMPORTANTES
-- =========================================================================
-- 1. Reemplazar 'YOUR_SUPABASE_URL' con tu URL real de Supabase
--    Ejemplo: 'abcdefghijklmnop.supabase.co'
--
-- 2. El trigger se ejecuta automáticamente después de cada INSERT/UPDATE
--    en professional_stats
--
-- 3. La función build_storage_url() maneja URLs completas y paths relativos
--
-- 4. Los logs (RAISE NOTICE) aparecen en los logs de Supabase
--
-- 5. Para verificar que funciona, actualiza un registro en professional_stats
--    y verifica que profiles se actualiza automáticamente
--
-- =========================================================================

