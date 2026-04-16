-- =========================================================================
-- TRIGGER: Sincronizar Avatar desde professional_stats a profiles
-- =========================================================================
-- Este trigger sincroniza automáticamente avatar_url desde professional_stats
-- a profiles cuando se actualiza desde el expediente profesional en SumeePros
--
-- Problema: Cuando se sube foto desde expediente, se guarda en:
--   - professional_stats.avatar_url (bucket: sumee-expedientes)
--   - Pero SumeeClient busca en profiles.avatar_url
--
-- Solución: Sincronizar automáticamente con este trigger

-- 1. CREAR FUNCIÓN DE SINCRONIZACIÓN
-- =========================================================================
CREATE OR REPLACE FUNCTION sync_avatar_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza avatar_url en professional_stats, sincronizar a profiles
    IF NEW.avatar_url IS NOT NULL 
       AND NEW.avatar_url != '' 
       AND (OLD.avatar_url IS NULL OR OLD.avatar_url != NEW.avatar_url) THEN
        
        UPDATE profiles
        SET 
            avatar_url = NEW.avatar_url,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Avatar sincronizado: user_id=%, avatar_url=%', NEW.user_id, NEW.avatar_url;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. CREAR TRIGGER
-- =========================================================================
DROP TRIGGER IF EXISTS sync_avatar_trigger ON professional_stats;

CREATE TRIGGER sync_avatar_trigger
AFTER INSERT OR UPDATE ON professional_stats
FOR EACH ROW
WHEN (NEW.avatar_url IS NOT NULL AND NEW.avatar_url != '')
EXECUTE FUNCTION sync_avatar_to_profiles();

-- 3. SINCRONIZAR AVATARES EXISTENTES (para Dan Nuno y otros)
-- =========================================================================
-- Ejecutar una vez para sincronizar avatares que ya existen en professional_stats
UPDATE profiles p
SET 
    avatar_url = ps.avatar_url,
    updated_at = NOW()
FROM professional_stats ps
WHERE p.user_id = ps.user_id
  AND ps.avatar_url IS NOT NULL
  AND ps.avatar_url != ''
  AND (p.avatar_url IS NULL OR p.avatar_url = '' OR p.avatar_url != ps.avatar_url);

-- 4. VERIFICAR SINCRONIZACIÓN
-- =========================================================================
SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        WHEN p.avatar_url IS NULL AND ps.avatar_url IS NOT NULL THEN '⚠️ Falta sincronizar'
        WHEN p.avatar_url != ps.avatar_url THEN '⚠️ Diferentes'
        ELSE '✅ OK'
    END as estado
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.avatar_url IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 10;

