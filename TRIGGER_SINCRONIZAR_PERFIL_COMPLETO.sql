-- =========================================================================
-- TRIGGER COMPLETO: Sincronizar Perfil desde professional_stats a profiles
-- =========================================================================
-- Este trigger sincroniza automáticamente TODOS los campos relevantes desde
-- professional_stats (actualizado por SumeePros) a profiles (leído por SumeeClient)
--
-- Arquitectura:
--   SumeePros → professional_stats → [TRIGGER] → profiles → SumeeClient/Web
--
-- Principio: SumeePros es la fuente de verdad para expediente/documentación

-- =========================================================================
-- 1. FUNCIÓN DE SINCRONIZACIÓN COMPLETA
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_professional_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar profiles cuando se actualiza professional_stats
    UPDATE profiles
    SET 
        -- Avatar (ya implementado, mantener)
        avatar_url = COALESCE(NEW.avatar_url, OLD.avatar_url),
        
        -- Nombre completo (si se actualiza en stats)
        full_name = COALESCE(NEW.full_name, profiles.full_name),
        
        -- Extraer certificaciones desde expediente_data (JSONB)
        certificaciones_urls = CASE 
            WHEN NEW.expediente_data IS NOT NULL 
                 AND NEW.expediente_data ? 'certificaciones'
                 AND jsonb_array_length(NEW.expediente_data->'certificaciones') > 0
            THEN (
                SELECT array_agg(
                    CASE 
                        WHEN value::text LIKE 'http%' THEN value::text
                        ELSE CONCAT(
                            'https://', 
                            current_setting('app.supabase_url', true),
                            '/storage/v1/object/public/sumee-expedientes/',
                            value::text
                        )
                    END
                )
                FROM jsonb_array_elements_text(NEW.expediente_data->'certificaciones')
            )
            ELSE profiles.certificaciones_urls
        END,
        
        -- Extraer antecedentes no penales desde expediente_data
        antecedentes_no_penales_url = CASE 
            WHEN NEW.expediente_data IS NOT NULL 
                 AND NEW.expediente_data ? 'no_penales'
                 AND jsonb_array_length(NEW.expediente_data->'no_penales') > 0
            THEN (
                SELECT CASE 
                    WHEN value::text LIKE 'http%' THEN value::text
                    ELSE CONCAT(
                        'https://', 
                        current_setting('app.supabase_url', true),
                        '/storage/v1/object/public/sumee-expedientes/',
                        value::text
                    )
                END
                FROM jsonb_array_elements_text(NEW.expediente_data->'no_penales')
                LIMIT 1
            )
            ELSE profiles.antecedentes_no_penales_url
        END,
        
        -- Mapear expediente_status a onboarding_status
        onboarding_status = CASE 
            WHEN NEW.expediente_status = 'approved' THEN 'approved'
            WHEN NEW.expediente_status = 'pending_approval' THEN 'pending_review'
            WHEN NEW.expediente_status = 'rejected' THEN 'rejected'
            WHEN NEW.expediente_status = 'not_uploaded' THEN 'pending_review'
            ELSE profiles.onboarding_status
        END,
        
        -- Actualizar timestamp para cache busting
        updated_at = NOW()
        
    WHERE user_id = NEW.user_id;
    
    -- Log para debugging (opcional)
    RAISE NOTICE 'Perfil sincronizado: user_id=%, avatar_url=%, expediente_status=%', 
        NEW.user_id, 
        NEW.avatar_url,
        NEW.expediente_status;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 2. CREAR TRIGGER
-- =========================================================================
DROP TRIGGER IF EXISTS sync_professional_trigger ON professional_stats;

CREATE TRIGGER sync_professional_trigger
AFTER INSERT OR UPDATE ON professional_stats
FOR EACH ROW
EXECUTE FUNCTION sync_professional_to_profiles();

-- =========================================================================
-- 3. SINCRONIZAR DATOS EXISTENTES (One-time migration)
-- =========================================================================
-- Ejecutar una vez para sincronizar todos los datos existentes
UPDATE profiles p
SET 
    avatar_url = COALESCE(ps.avatar_url, p.avatar_url),
    full_name = COALESCE(ps.full_name, p.full_name),
    certificaciones_urls = CASE 
        WHEN ps.expediente_data IS NOT NULL 
             AND ps.expediente_data ? 'certificaciones'
             AND jsonb_array_length(ps.expediente_data->'certificaciones') > 0
        THEN (
            SELECT array_agg(
                CASE 
                    WHEN value::text LIKE 'http%' THEN value::text
                    ELSE CONCAT(
                        'https://', 
                        (SELECT setting FROM pg_settings WHERE name = 'app.supabase_url' LIMIT 1),
                        '/storage/v1/object/public/sumee-expedientes/',
                        value::text
                    )
                END
            )
            FROM jsonb_array_elements_text(ps.expediente_data->'certificaciones')
        )
        ELSE p.certificaciones_urls
    END,
    antecedentes_no_penales_url = CASE 
        WHEN ps.expediente_data IS NOT NULL 
             AND ps.expediente_data ? 'no_penales'
             AND jsonb_array_length(ps.expediente_data->'no_penales') > 0
        THEN (
            SELECT CASE 
                WHEN value::text LIKE 'http%' THEN value::text
                ELSE CONCAT(
                    'https://', 
                    (SELECT setting FROM pg_settings WHERE name = 'app.supabase_url' LIMIT 1),
                    '/storage/v1/object/public/sumee-expedientes/',
                    value::text
                )
            END
            FROM jsonb_array_elements_text(ps.expediente_data->'no_penales')
            LIMIT 1
        )
        ELSE p.antecedentes_no_penales_url
    END,
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
  AND (
      -- Solo actualizar si hay diferencias
      p.avatar_url IS DISTINCT FROM ps.avatar_url
      OR p.full_name IS DISTINCT FROM ps.full_name
      OR (ps.expediente_status IS NOT NULL AND p.onboarding_status IS DISTINCT FROM 
          CASE 
              WHEN ps.expediente_status = 'approved' THEN 'approved'
              WHEN ps.expediente_status = 'pending_approval' THEN 'pending_review'
              WHEN ps.expediente_status = 'rejected' THEN 'rejected'
              WHEN ps.expediente_status = 'not_uploaded' THEN 'pending_review'
              ELSE p.onboarding_status
          END)
  );

-- =========================================================================
-- 4. VERIFICACIÓN (Ejecutar después de crear el trigger)
-- =========================================================================
SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    p.onboarding_status as profiles_onboarding,
    ps.expediente_status as stats_expediente,
    CASE 
        WHEN p.avatar_url = ps.avatar_url 
             AND p.full_name = ps.full_name 
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
LIMIT 10;

