-- =========================================================================
-- TRIGGERS FINALES: Sincronización professional_stats → profiles
-- =========================================================================
-- VERSIÓN OPTIMIZADA: Basada en la estructura real de profiles
-- 
-- IMPORTANTE: Ejecuta primero CREAR_ONBOARDING_STATUS.sql
--
-- Arquitectura:
--   SumeePros → professional_stats → [TRIGGERS] → profiles → SumeeClient/Web
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
    -- Nota: Reemplazar 'YOUR_SUPABASE_URL' con tu URL real
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
    -- Obtener URL de Supabase
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := NULL;
    END;
    
    -- =====================================================================
    -- SINCRONIZAR AVATAR
    -- =====================================================================
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
    -- Solo actualizar si profession está vacío
    IF NEW.specialty IS NOT NULL 
       AND NEW.specialty != '' THEN
        
        UPDATE profiles
        SET 
            profession = COALESCE(NULLIF(profession, ''), NEW.specialty),
            updated_at = NOW()
        WHERE user_id = NEW.user_id
          AND (profession IS NULL OR profession = '');
        
        RAISE NOTICE 'Especialidad sincronizada: user_id=%, specialty=%', NEW.user_id, NEW.specialty;
    END IF;
    
    -- =====================================================================
    -- EXTRAER CERTIFICACIONES DESDE expediente_data
    -- =====================================================================
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'certificaciones'
       AND jsonb_typeof(NEW.expediente_data->'certificaciones') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'certificaciones') > 0 THEN
        
        SELECT array_agg(
            CASE 
                WHEN value::text LIKE 'http%' THEN value::text
                ELSE build_storage_url(value::text)
            END
        )
        INTO cert_urls
        FROM jsonb_array_elements_text(NEW.expediente_data->'certificaciones');
        
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
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'no_penales'
       AND jsonb_typeof(NEW.expediente_data->'no_penales') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'no_penales') > 0 THEN
        
        SELECT CASE 
            WHEN value::text LIKE 'http%' THEN value::text
            ELSE build_storage_url(value::text)
        END
        INTO antecedentes_url
        FROM jsonb_array_elements_text(NEW.expediente_data->'no_penales')
        LIMIT 1;
        
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
    -- Solo si la columna onboarding_status existe
    IF NEW.expediente_status IS NOT NULL 
       AND (OLD.expediente_status IS NULL OR OLD.expediente_status IS DISTINCT FROM NEW.expediente_status) THEN
        
        -- Verificar si la columna existe antes de actualizar
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'onboarding_status'
        ) THEN
            UPDATE profiles
            SET 
                onboarding_status = CASE 
                    WHEN NEW.expediente_status = 'approved' THEN 'approved'
                    WHEN NEW.expediente_status = 'pending_approval' THEN 'pending_review'
                    WHEN NEW.expediente_status = 'rejected' THEN 'rejected'
                    WHEN NEW.expediente_status = 'not_uploaded' THEN 'pending_review'
                    ELSE onboarding_status
                END,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
            
            RAISE NOTICE 'Estado de onboarding sincronizado: user_id=%, expediente_status=%', 
                NEW.user_id, NEW.expediente_status;
        END IF;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR CALIFICACIÓN PROMEDIO
    -- =====================================================================
    -- Nota: calificacion_promedio es smallint, average_rating es NUMERIC
    IF NEW.average_rating IS NOT NULL 
       AND (OLD.average_rating IS NULL OR ABS(NEW.average_rating - COALESCE(OLD.average_rating, 0)) > 0.1) THEN
        
        UPDATE profiles
        SET 
            calificacion_promedio = ROUND(NEW.average_rating)::smallint,
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
-- PARTE 4: MIGRACIÓN DE DATOS EXISTENTES
-- =========================================================================
DO $$
DECLARE
    supabase_url TEXT;
BEGIN
    -- Obtener URL de Supabase
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := 'YOUR_SUPABASE_URL';
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
    
    -- Sincronizar especialidades (solo si profession está vacío)
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
    
    -- Sincronizar estado de onboarding (solo si la columna existe)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'onboarding_status'
    ) THEN
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
    END IF;
    
    -- Sincronizar calificación promedio (convertir NUMERIC a smallint)
    UPDATE profiles p
    SET 
        calificacion_promedio = ROUND(ps.average_rating)::smallint,
        updated_at = NOW()
    FROM professional_stats ps
    WHERE p.user_id = ps.user_id
      AND ps.average_rating IS NOT NULL
      AND (p.calificacion_promedio IS NULL OR ABS(p.calificacion_promedio - ps.average_rating) > 0.1);
    
    RAISE NOTICE 'Migración de datos existentes completada';
END $$;

-- =========================================================================
-- PARTE 5: VERIFICACIÓN
-- =========================================================================
SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    p.profession as profiles_profession,
    ps.specialty as stats_specialty,
    CASE 
        WHEN p.avatar_url = ps.avatar_url 
             AND COALESCE(p.full_name, '') = COALESCE(ps.full_name, '')
        THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC NULLS LAST
LIMIT 10;

