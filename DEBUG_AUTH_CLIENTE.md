# 🔍 Debug: Problema de Autenticación de Cliente

## ❌ Problema

No se puede iniciar sesión con credenciales de cliente en SumeeClient.

## 🔍 Posibles Causas

### **1. Perfil no existe en `profiles`**
- El usuario existe en `auth.users` pero no tiene registro en `profiles`
- **Solución:** Crear el perfil manualmente o usar el registro

### **2. `user_type` o `role` incorrecto**
- El perfil existe pero tiene `user_type = 'professional'` en lugar de `'client'`
- **Solución:** Actualizar el perfil en Supabase

### **3. Error de permisos RLS (Row Level Security)**
- Las políticas de seguridad de Supabase bloquean la lectura del perfil
- **Solución:** Verificar políticas RLS en `profiles`

### **4. Credenciales incorrectas**
- Email o contraseña incorrectos
- **Solución:** Verificar credenciales en Supabase

## 🛠️ Pasos de Debugging

### **Paso 1: Verificar que el usuario existe en auth.users**

Ejecuta en Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```

### **Paso 2: Verificar que el perfil existe**

```sql
SELECT 
  user_id,
  email,
  full_name,
  user_type,
  role,
  created_at
FROM profiles
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```

### **Paso 3: Verificar user_type y role**

El perfil debe tener:
- `user_type = 'client'` O `user_type = 'cliente'`
- `role = 'client'` O `role = 'cliente'`

Si no tiene estos valores, actualiza:

```sql
UPDATE profiles
SET 
  user_type = 'client',
  role = 'client'
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```

### **Paso 4: Verificar políticas RLS**

```sql
-- Ver políticas de SELECT en profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles';
```

Si no hay políticas, crea una:

```sql
-- Permitir que usuarios autenticados lean su propio perfil
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### **Paso 5: Revisar logs de la app**

Abre la consola de Expo y busca:
- `[Auth] Attempting to sign in with email:`
- `[Auth] Sign in successful, loading profile...`
- `[Auth] Profile data:`
- `[Auth] Error fetching profile:`

## ✅ Soluciones Rápidas

### **Solución 1: Crear perfil manualmente**

Si el usuario existe pero no tiene perfil:

```sql
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
  raw_user_meta_data->>'full_name' as full_name,
  'client' as user_type,
  'client' as role
FROM auth.users
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.users.id
);
```

### **Solución 2: Actualizar user_type existente**

Si el perfil existe pero tiene user_type incorrecto:

```sql
UPDATE profiles
SET 
  user_type = 'client',
  role = 'client'
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
AND (user_type != 'client' OR role != 'client');
```

### **Solución 3: Verificar y crear políticas RLS**

```sql
-- Verificar si existe la política
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Users can read their own profile';

-- Si no existe, crearla
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

## 📋 Checklist de Verificación

- [ ] Usuario existe en `auth.users`
- [ ] Perfil existe en `profiles` con `user_id` correcto
- [ ] `user_type = 'client'` o `'cliente'`
- [ ] `role = 'client'` o `'cliente'`
- [ ] Política RLS permite lectura del propio perfil
- [ ] Credenciales son correctas
- [ ] Logs de la app muestran el error específico

## 🔧 Mejoras Aplicadas

Se agregaron logs detallados en `AuthContext.tsx` para facilitar el debugging:
- Logs de intento de login
- Logs de datos del perfil
- Logs de errores específicos
- Logs de verificación de tipo de usuario

Revisa la consola de Expo para ver estos logs cuando intentes iniciar sesión.

