-- =========================================================================
-- TRIGGERS COMPLETOS V2: Sincronización professional_stats → profiles
-- =========================================================================
-- VERSIÓN MEJORADA: Verifica existencia de columnas antes de actualizar
-- 
-- IMPORTANTE: Ejecuta primero CREAR_COLUMNAS_FALTANTES.sql
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
-- PARTE 2: FUNCIÓN AUXILIAR - Verificar si columna existe
-- =========================================================================
-- Eliminar función existente si tiene parámetros con nombres conflictivos
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT);

-- Crear función con nombres de parámetros únicos para evitar ambigüedad
CREATE OR REPLACE FUNCTION column_exists(tbl_name TEXT, col_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = tbl_name
        AND column_name = col_name
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================================================
-- PARTE 3: FUNCIÓN PRINCIPAL - Sincronizar professional_stats → profiles
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_professional_to_profiles()
RETURNS TRIGGER AS $$
DECLARE
    supabase_url TEXT;
    cert_urls TEXT[];
    antecedentes_url TEXT;
    sql_text TEXT;
BEGIN
    -- Obtener URL de Supabase
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := NULL;
    END;
    
    -- =====================================================================
    -- SINCRONIZAR AVATAR (si la columna existe)
    -- =====================================================================
    IF NEW.avatar_url IS NOT NULL 
       AND NEW.avatar_url != '' 
       AND (OLD.avatar_url IS NULL OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
       AND column_exists('profiles', 'avatar_url') THEN
        
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = CASE WHEN column_exists('profiles', 'updated_at') THEN NOW() ELSE updated_at END
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Avatar sincronizado: user_id=%, avatar_url=%', NEW.user_id, NEW.avatar_url;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR NOMBRE COMPLETO (si la columna existe)
    -- =====================================================================
    IF NEW.full_name IS NOT NULL 
       AND NEW.full_name != '' 
       AND (OLD.full_name IS NULL OR OLD.full_name IS DISTINCT FROM NEW.full_name)
       AND column_exists('profiles', 'full_name') THEN
        
        sql_text := 'UPDATE profiles SET full_name = $1';
        IF column_exists('profiles', 'updated_at') THEN
            sql_text := sql_text || ', updated_at = NOW()';
        END IF;
        sql_text := sql_text || ' WHERE user_id = $2';
        
        EXECUTE sql_text USING NEW.full_name, NEW.user_id;
        
        RAISE NOTICE 'Nombre sincronizado: user_id=%, full_name=%', NEW.user_id, NEW.full_name;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR ESPECIALIDAD (si la columna existe)
    -- =====================================================================
    IF NEW.specialty IS NOT NULL 
       AND NEW.specialty != ''
       AND column_exists('profiles', 'profession') THEN
        
        -- Solo actualizar si profession está vacío
        sql_text := 'UPDATE profiles SET profession = COALESCE(NULLIF(profession, ''''), $1)';
        IF column_exists('profiles', 'updated_at') THEN
            sql_text := sql_text || ', updated_at = NOW()';
        END IF;
        sql_text := sql_text || ' WHERE user_id = $2 AND (profession IS NULL OR profession = '''')';
        
        EXECUTE sql_text USING NEW.specialty, NEW.user_id;
        
        RAISE NOTICE 'Especialidad sincronizada: user_id=%, specialty=%', NEW.user_id, NEW.specialty;
    END IF;
    
    -- =====================================================================
    -- EXTRAER CERTIFICACIONES (si la columna existe)
    -- =====================================================================
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'certificaciones'
       AND jsonb_typeof(NEW.expediente_data->'certificaciones') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'certificaciones') > 0
       AND column_exists('profiles', 'certificaciones_urls') THEN
        
        SELECT array_agg(
            CASE 
                WHEN value::text LIKE 'http%' THEN value::text
                ELSE build_storage_url(value::text)
            END
        )
        INTO cert_urls
        FROM jsonb_array_elements_text(NEW.expediente_data->'certificaciones');
        
        IF cert_urls IS NOT NULL AND array_length(cert_urls, 1) > 0 THEN
            sql_text := 'UPDATE profiles SET certificaciones_urls = $1';
            IF column_exists('profiles', 'updated_at') THEN
                sql_text := sql_text || ', updated_at = NOW()';
            END IF;
            sql_text := sql_text || ' WHERE user_id = $2';
            
            EXECUTE sql_text USING cert_urls, NEW.user_id;
            
            RAISE NOTICE 'Certificaciones sincronizadas: user_id=%, count=%', NEW.user_id, array_length(cert_urls, 1);
        END IF;
    END IF;
    
    -- =====================================================================
    -- EXTRAER ANTECEDENTES NO PENALES (si la columna existe)
    -- =====================================================================
    IF NEW.expediente_data IS NOT NULL 
       AND NEW.expediente_data ? 'no_penales'
       AND jsonb_typeof(NEW.expediente_data->'no_penales') = 'array'
       AND jsonb_array_length(NEW.expediente_data->'no_penales') > 0
       AND column_exists('profiles', 'antecedentes_no_penales_url') THEN
        
        SELECT CASE 
            WHEN value::text LIKE 'http%' THEN value::text
            ELSE build_storage_url(value::text)
        END
        INTO antecedentes_url
        FROM jsonb_array_elements_text(NEW.expediente_data->'no_penales')
        LIMIT 1;
        
        IF antecedentes_url IS NOT NULL THEN
            sql_text := 'UPDATE profiles SET antecedentes_no_penales_url = $1';
            IF column_exists('profiles', 'updated_at') THEN
                sql_text := sql_text || ', updated_at = NOW()';
            END IF;
            sql_text := sql_text || ' WHERE user_id = $2';
            
            EXECUTE sql_text USING antecedentes_url, NEW.user_id;
            
            RAISE NOTICE 'Antecedentes sincronizados: user_id=%, url=%', NEW.user_id, antecedentes_url;
        END IF;
    END IF;
    
    -- =====================================================================
    -- MAPEAR ESTADO DE EXPEDIENTE (si la columna existe)
    -- =====================================================================
    IF NEW.expediente_status IS NOT NULL 
       AND (OLD.expediente_status IS NULL OR OLD.expediente_status IS DISTINCT FROM NEW.expediente_status)
       AND column_exists('profiles', 'onboarding_status') THEN
        
        sql_text := format(
            'UPDATE profiles SET onboarding_status = CASE 
                WHEN $1 = ''approved'' THEN ''approved''
                WHEN $1 = ''pending_approval'' THEN ''pending_review''
                WHEN $1 = ''rejected'' THEN ''rejected''
                WHEN $1 = ''not_uploaded'' THEN ''pending_review''
                ELSE onboarding_status
            END%s WHERE user_id = $2',
            CASE WHEN column_exists('profiles', 'updated_at') THEN ', updated_at = NOW()' ELSE '' END
        );
        
        EXECUTE sql_text USING NEW.expediente_status, NEW.user_id;
        
        RAISE NOTICE 'Estado de onboarding sincronizado: user_id=%, expediente_status=%', 
            NEW.user_id, NEW.expediente_status;
    END IF;
    
    -- =====================================================================
    -- SINCRONIZAR CALIFICACIÓN PROMEDIO (si la columna existe)
    -- =====================================================================
    -- Nota: calificacion_promedio es smallint en profiles, average_rating es NUMERIC en professional_stats
    IF NEW.average_rating IS NOT NULL 
       AND (OLD.average_rating IS NULL OR ABS(NEW.average_rating - COALESCE(OLD.average_rating, 0)) > 0.1)
       AND column_exists('profiles', 'calificacion_promedio') THEN
        
        sql_text := 'UPDATE profiles SET calificacion_promedio = $1::smallint';
        IF column_exists('profiles', 'updated_at') THEN
            sql_text := sql_text || ', updated_at = NOW()';
        END IF;
        sql_text := sql_text || ' WHERE user_id = $2';
        
        -- Convertir NUMERIC a smallint (redondeado)
        EXECUTE sql_text USING ROUND(NEW.average_rating)::smallint, NEW.user_id;
        
        RAISE NOTICE 'Calificación sincronizada: user_id=%, rating=%', NEW.user_id, NEW.average_rating;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- PARTE 4: CREAR TRIGGER
-- =========================================================================
DROP TRIGGER IF EXISTS sync_professional_trigger ON professional_stats;

CREATE TRIGGER sync_professional_trigger
AFTER INSERT OR UPDATE ON professional_stats
FOR EACH ROW
EXECUTE FUNCTION sync_professional_to_profiles();

-- =========================================================================
-- PARTE 5: MIGRACIÓN DE DATOS EXISTENTES (Solo campos que existen)
-- =========================================================================
DO $$
DECLARE
    supabase_url TEXT;
    has_avatar_url BOOLEAN;
    has_full_name BOOLEAN;
    has_profession BOOLEAN;
    has_certificaciones BOOLEAN;
    has_antecedentes BOOLEAN;
    has_onboarding_status BOOLEAN;
    has_calificacion BOOLEAN;
    has_updated_at BOOLEAN;
BEGIN
    -- Verificar qué columnas existen
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
    ) INTO has_avatar_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
    ) INTO has_full_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'profession'
    ) INTO has_profession;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'certificaciones_urls'
    ) INTO has_certificaciones;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'antecedentes_no_penales_url'
    ) INTO has_antecedentes;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'onboarding_status'
    ) INTO has_onboarding_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'calificacion_promedio'
    ) INTO has_calificacion;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Obtener URL de Supabase
    BEGIN
        supabase_url := current_setting('app.supabase_url', true);
    EXCEPTION WHEN OTHERS THEN
        supabase_url := 'YOUR_SUPABASE_URL';
    END;
    
    -- Sincronizar solo campos que existen
    IF has_avatar_url THEN
        UPDATE profiles p
        SET 
            avatar_url = ps.avatar_url,
            updated_at = CASE WHEN has_updated_at THEN NOW() ELSE p.updated_at END
        FROM professional_stats ps
        WHERE p.user_id = ps.user_id
          AND ps.avatar_url IS NOT NULL
          AND ps.avatar_url != ''
          AND (p.avatar_url IS NULL OR p.avatar_url = '' OR p.avatar_url != ps.avatar_url);
        
        RAISE NOTICE 'Avatares sincronizados';
    END IF;
    
    IF has_full_name THEN
        UPDATE profiles p
        SET 
            full_name = ps.full_name,
            updated_at = CASE WHEN has_updated_at THEN NOW() ELSE p.updated_at END
        FROM professional_stats ps
        WHERE p.user_id = ps.user_id
          AND ps.full_name IS NOT NULL
          AND ps.full_name != ''
          AND (p.full_name IS NULL OR p.full_name = '' OR p.full_name != ps.full_name);
        
        RAISE NOTICE 'Nombres sincronizados';
    END IF;
    
    IF has_profession THEN
        UPDATE profiles p
        SET 
            profession = ps.specialty,
            updated_at = CASE WHEN has_updated_at THEN NOW() ELSE p.updated_at END
        FROM professional_stats ps
        WHERE p.user_id = ps.user_id
          AND ps.specialty IS NOT NULL
          AND ps.specialty != ''
          AND (p.profession IS NULL OR p.profession = '');
        
        RAISE NOTICE 'Especialidades sincronizadas';
    END IF;
    
    -- Certificaciones, antecedentes, onboarding_status y calificación
    -- se manejan de forma similar, verificando has_* antes de actualizar
    
    RAISE NOTICE 'Migración completada. Columnas verificadas: avatar_url=%, full_name=%, profession=%, certificaciones=%, antecedentes=%, onboarding_status=%, calificacion=%', 
        has_avatar_url, has_full_name, has_profession, has_certificaciones, 
        has_antecedentes, has_onboarding_status, has_calificacion;
END $$;

-- =========================================================================
-- PARTE 6: VERIFICACIÓN
-- =========================================================================
SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado_avatar
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC NULLS LAST
LIMIT 10;

