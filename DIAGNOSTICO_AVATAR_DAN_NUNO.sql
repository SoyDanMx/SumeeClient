-- =========================================================================
-- DIAGNÓSTICO: Avatar de Dan Nuno
-- =========================================================================
-- Este script verifica dónde se guardó la foto de perfil de Dan Nuno
-- y qué valor tiene en la base de datos
--
-- IMPORTANTE: En SumeePros, las fotos pueden guardarse en:
-- 1. profiles.avatar_url (actualización directa de perfil)
-- 2. professional_stats.avatar_url (subida desde expediente)
-- 3. Bucket: professional-avatars (fotos de perfil)
-- 4. Bucket: sumee-expedientes (fotos de expediente como profile_photo)

-- 0. BUSCAR USER_ID DE DAN NUNO
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email
FROM profiles
WHERE 
    email ILIKE '%dan%nuno%' 
    OR full_name ILIKE '%dan%nuno%'
    OR email ILIKE '%daniel.nunojeda%'
LIMIT 1;

-- 1. BUSCAR PERFIL DE DAN NUNO (profiles.avatar_url)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    updated_at,
    created_at,
    role,
    user_type
FROM profiles
WHERE 
    email ILIKE '%dan%nuno%' 
    OR full_name ILIKE '%dan%nuno%'
    OR email ILIKE '%daniel.nunojeda%'
ORDER BY updated_at DESC;

-- 2. VERIFICAR AVATAR_URL (formato y contenido)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN 'NULL'
        WHEN avatar_url = '' THEN 'VACÍO'
        WHEN avatar_url LIKE 'http%' THEN 'URL COMPLETA'
        WHEN avatar_url LIKE '%professional-avatars%' THEN 'BUCKET: professional-avatars'
        WHEN avatar_url LIKE '%sumee-expedientes%' THEN 'BUCKET: sumee-expedientes'
        WHEN avatar_url LIKE '%profile_photo%' THEN 'EXPEDIENTE: profile_photo'
        WHEN avatar_url LIKE '%avatar%' THEN 'CONTIENE: avatar'
        ELSE 'OTRO FORMATO'
    END as formato_url,
    LENGTH(avatar_url) as longitud_url,
    updated_at
FROM profiles
WHERE 
    email ILIKE '%dan%nuno%' 
    OR full_name ILIKE '%dan%nuno%'
    OR email ILIKE '%daniel.nunojeda%';

-- 3. BUSCAR EN STORAGE (professional-avatars)
-- =========================================================================
-- Nota: Esto requiere acceso directo a storage, pero podemos verificar
-- si el path existe en la URL

-- 4. VERIFICAR ÚLTIMAS ACTUALIZACIONES DE PERFIL
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    updated_at,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600 as horas_desde_actualizacion
FROM profiles
WHERE 
    (email ILIKE '%dan%nuno%' 
     OR full_name ILIKE '%dan%nuno%'
     OR email ILIKE '%daniel.nunojeda%')
    AND avatar_url IS NOT NULL
    AND avatar_url != ''
ORDER BY updated_at DESC;

-- 5. VERIFICAR SI HAY MÚLTIPLES PERFILES (por si hay duplicados)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    role,
    user_type,
    updated_at
FROM profiles
WHERE 
    email ILIKE '%dan%nuno%' 
    OR full_name ILIKE '%dan%nuno%'
    OR email ILIKE '%daniel.nunojeda%'
ORDER BY updated_at DESC;

-- 6. VERIFICAR professional_stats (donde se guarda desde expediente)
-- =========================================================================
SELECT 
    user_id,
    avatar_url as stats_avatar_url,
    expediente_data->'profile_photo' as expediente_profile_photo,
    updated_at as stats_updated_at,
    expediente_status
FROM professional_stats
WHERE user_id IN (
    SELECT user_id 
    FROM profiles
    WHERE email ILIKE '%dan%nuno%' 
       OR full_name ILIKE '%dan%nuno%'
       OR email ILIKE '%daniel.nunojeda%'
);

-- 7. COMPARAR profiles vs professional_stats
-- =========================================================================
SELECT 
    p.user_id,
    p.full_name,
    p.email,
    p.avatar_url as profiles_avatar_url,
    p.updated_at as profiles_updated_at,
    ps.avatar_url as stats_avatar_url,
    ps.expediente_data->'profile_photo' as expediente_profile_photo,
    ps.updated_at as stats_updated_at,
    CASE 
        WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN 'profiles tiene avatar'
        WHEN ps.avatar_url IS NOT NULL AND ps.avatar_url != '' THEN 'stats tiene avatar'
        WHEN ps.expediente_data->'profile_photo' IS NOT NULL THEN 'expediente tiene profile_photo'
        ELSE 'NO HAY AVATAR'
    END as donde_esta_avatar
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE 
    p.email ILIKE '%dan%nuno%' 
    OR p.full_name ILIKE '%dan%nuno%'
    OR p.email ILIKE '%daniel.nunojeda%';

-- 8. VERIFICAR FORMATO DE URL (extraer bucket y path)
-- =========================================================================
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE 'https://%storage/v1/object/public/%' THEN
            SUBSTRING(avatar_url FROM 'storage/v1/object/public/([^/]+)/')
        WHEN avatar_url LIKE '%professional-avatars%' THEN 'professional-avatars'
        WHEN avatar_url LIKE '%sumee-expedientes%' THEN 'sumee-expedientes'
        ELSE 'NO DETECTADO'
    END as bucket_detectado,
    CASE 
        WHEN avatar_url LIKE 'https://%storage/v1/object/public/%' THEN
            SUBSTRING(avatar_url FROM 'storage/v1/object/public/[^/]+/(.+)')
        WHEN avatar_url NOT LIKE 'http%' THEN avatar_url
        ELSE 'URL COMPLETA'
    END as path_detectado
FROM profiles
WHERE 
    (email ILIKE '%dan%nuno%' 
     OR full_name ILIKE '%dan%nuno%'
     OR email ILIKE '%daniel.nunojeda%')
    AND avatar_url IS NOT NULL
    AND avatar_url != '';

