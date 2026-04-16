-- ============================================================================
-- VERIFICAR USUARIO CLIENTE EN SUPABASE
-- ============================================================================
-- Ejecuta este script para verificar si un usuario cliente existe y está
-- configurado correctamente
-- ============================================================================

-- Reemplaza 'TU_EMAIL_AQUI@ejemplo.com' con el email del usuario
-- O usa el user_id directamente

-- Paso 1: Verificar que el usuario existe en auth.users
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
-- Si no hay resultados, el usuario no existe o el email es incorrecto

-- Paso 2: Verificar que el perfil existe en profiles
SELECT 
  user_id,
  email,
  full_name,
  user_type,
  role,
  phone,
  whatsapp,
  created_at,
  updated_at
FROM profiles
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
-- Si no hay resultados, el perfil no existe (necesita crearse)

-- Paso 3: Verificar user_type y role (deben ser 'client')
SELECT 
  user_id,
  email,
  user_type,
  role,
  CASE 
    WHEN user_type = 'client' OR user_type = 'cliente' THEN '✅ Correcto'
    WHEN role = 'client' OR role = 'cliente' THEN '✅ Correcto'
    ELSE '❌ INCORRECTO - Necesita actualización'
  END as estado
FROM profiles
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';

-- Paso 4: Verificar políticas RLS (Row Level Security)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'SELECT';
-- Debe haber al menos una política que permita a usuarios autenticados leer su propio perfil

