-- ============================================================================
-- CORREGIR USUARIO CLIENTE EN SUPABASE
-- ============================================================================
-- Ejecuta estos scripts para corregir problemas comunes con usuarios cliente
-- ============================================================================

-- ============================================================================
-- SOLUCIÓN 1: Crear perfil si no existe
-- ============================================================================
-- Si el usuario existe en auth.users pero no tiene perfil en profiles
-- ============================================================================

INSERT INTO profiles (
  user_id,
  email,
  full_name,
  user_type,
  role
)
SELECT 
  id as user_id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as full_name,
  'client' as user_type,
  'client' as role
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.users.id
)
RETURNING *;

-- ============================================================================
-- SOLUCIÓN 2: Actualizar user_type y role a 'client'
-- ============================================================================
-- Si el perfil existe pero tiene user_type o role incorrecto
-- ============================================================================

UPDATE profiles
SET 
  user_type = 'client',
  role = 'client',
  updated_at = NOW()
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
AND (
  user_type IS NULL 
  OR user_type NOT IN ('client', 'cliente')
  OR role IS NULL
  OR role NOT IN ('client', 'cliente')
)
RETURNING 
  user_id,
  email,
  user_type,
  role;

-- ============================================================================
-- SOLUCIÓN 3: Crear política RLS si no existe
-- ============================================================================
-- Si no hay política que permita a usuarios leer su propio perfil
-- ============================================================================

-- Verificar si la política existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    -- Crear la política
    CREATE POLICY "Users can read their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Política RLS creada exitosamente';
  ELSE
    RAISE NOTICE 'La política RLS ya existe';
  END IF;
END $$;

-- ============================================================================
-- SOLUCIÓN 4: Verificar y corregir todo en un solo paso
-- ============================================================================
-- Ejecuta este bloque para verificar y corregir automáticamente
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'TU_EMAIL_AQUI@ejemplo.com';
  v_profile_exists BOOLEAN;
  v_user_type TEXT;
  v_role TEXT;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users con email: %', v_email;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: %', v_user_id;
  
  -- Verificar si el perfil existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE user_id = v_user_id
  ) INTO v_profile_exists;
  
  IF NOT v_profile_exists THEN
    -- Crear perfil
    INSERT INTO profiles (
      user_id,
      email,
      full_name,
      user_type,
      role
    )
    SELECT 
      id,
      email,
      COALESCE(
        raw_user_meta_data->>'full_name',
        split_part(email, '@', 1)
      ),
      'client',
      'client'
    FROM auth.users
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Perfil creado exitosamente';
  ELSE
    -- Verificar y actualizar user_type y role
    SELECT user_type, role INTO v_user_type, v_role
    FROM profiles
    WHERE user_id = v_user_id;
    
    IF v_user_type IS NULL OR v_user_type NOT IN ('client', 'cliente') THEN
      UPDATE profiles
      SET user_type = 'client', updated_at = NOW()
      WHERE user_id = v_user_id;
      RAISE NOTICE 'user_type actualizado a "client"';
    END IF;
    
    IF v_role IS NULL OR v_role NOT IN ('client', 'cliente') THEN
      UPDATE profiles
      SET role = 'client', updated_at = NOW()
      WHERE user_id = v_user_id;
      RAISE NOTICE 'role actualizado a "client"';
    END IF;
  END IF;
  
  -- Verificar política RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can read their own profile'
  ) THEN
    CREATE POLICY "Users can read their own profile"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
    RAISE NOTICE 'Política RLS creada';
  END IF;
  
  RAISE NOTICE 'Verificación y corrección completada';
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecuta esto después de corregir para verificar que todo está bien
-- ============================================================================

SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.user_type,
  p.role,
  CASE 
    WHEN p.user_type IN ('client', 'cliente') AND p.role IN ('client', 'cliente') THEN '✅ Correcto'
    ELSE '❌ Necesita corrección'
  END as estado
FROM profiles p
WHERE p.email = 'TU_EMAIL_AQUI@ejemplo.com';

