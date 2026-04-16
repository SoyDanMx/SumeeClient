# ✅ Solución: Error RLS 42501 al Crear Profile

## 🐛 Problema

**Error:**
```
42501: new row violates row-level security policy for table "profiles"
```

**Causa:**
- No existe política RLS que permita INSERT en `profiles`
- RLS está habilitado pero no hay política para usuarios autenticados
- El usuario no puede crear su propio perfil

**Ubicación:**
- `contexts/AuthContext.tsx` línea 124-134 (creación automática de profile)

---

## ✅ Solución

### **Script SQL: `POLITICA_RLS_INSERT_PROFILES.sql`**

Este script crea una política RLS que permite a usuarios autenticados crear su propio perfil:

```sql
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);
```

**¿Qué hace?**
- ✅ Permite INSERT solo a usuarios autenticados (`TO authenticated`)
- ✅ Solo pueden crear perfil con su propio `user_id` (`auth.uid() = user_id`)
- ✅ No pueden crear perfiles para otros usuarios
- ✅ Seguro y restringido

---

## 🚀 Pasos para Aplicar

### **1. Ejecutar Script en Supabase**

1. Abre **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `POLITICA_RLS_INSERT_PROFILES.sql`
4. Ejecuta el script

### **2. Verificar Política Creada**

Ejecuta esta query para verificar:

```sql
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND cmd = 'INSERT';
```

**Deberías ver:**
```
policyname: "Users can insert their own profile"
cmd: "INSERT"
with_check: "auth.uid() = user_id"
roles: "{authenticated}"
```

### **3. Probar en la App**

1. Reinicia Expo:
   ```bash
   npx expo start --clear
   ```

2. Inicia sesión con un usuario que no tenga profile

3. Verifica logs:
   ```
   [Auth] Profile does not exist, creating basic profile...
   [Auth] ✅ Profile created successfully
   ```

---

## 📋 Políticas RLS Recomendadas para Profiles

Para que la app funcione completamente, necesitas estas políticas:

### **1. SELECT (Leer)**
```sql
-- Ya existe: "Allow read professionals" (para profesionales)
-- Necesitas: Política para que usuarios lean su propio perfil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### **2. INSERT (Crear)**
```sql
-- La que acabamos de crear
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### **3. UPDATE (Actualizar)**
```sql
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 🔍 Verificación Completa

### **Ver Todas las Políticas de Profiles:**

```sql
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
```

**Deberías ver:**
- ✅ SELECT: "Allow read professionals" (pública, para profesionales)
- ✅ SELECT: "Users can view their own profile" (autenticados, propio)
- ✅ INSERT: "Users can insert their own profile" (autenticados, propio)
- ✅ UPDATE: "Users can update their own profile" (autenticados, propio)

---

## ⚠️ Notas Importantes

1. **No elimines políticas existentes** sin verificar primero
2. **La política de SELECT para profesionales** debe mantenerse (para que aparezcan en la app)
3. **Las políticas de INSERT/UPDATE** son solo para usuarios autenticados
4. **Siempre verifica** que `auth.uid() = user_id` para seguridad

---

## ✅ Resultado Esperado

Después de ejecutar el script:

- ✅ Usuarios pueden crear su propio perfil
- ✅ Error 42501 desaparece
- ✅ Profile se crea automáticamente si no existe
- ✅ App funciona correctamente

---

**Estado:** ✅ Script listo para ejecutar en Supabase

