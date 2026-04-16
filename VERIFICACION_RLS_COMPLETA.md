# ✅ Verificación: Políticas RLS Completas

## 📊 Estado Actual

### **Política de INSERT: ✅ CREADA**

```sql
policyname: "Users can insert their own profile"
cmd: "INSERT"
with_check: "(auth.uid() = user_id)"
roles: "{authenticated}"
```

**Funcionalidad:**
- ✅ Usuarios autenticados pueden crear su propio perfil
- ✅ Solo pueden crear perfil con su propio `user_id`
- ✅ No pueden crear perfiles para otros usuarios
- ✅ Seguro y restringido

---

## 🔍 Políticas RLS Recomendadas para Profiles

Para que la app funcione completamente, verifica que tengas estas políticas:

### **1. SELECT (Leer)**

**Para profesionales (pública):**
```sql
-- Ya existe: "Allow read professionals"
-- Filtra: role = 'profesional' AND profession NOT NULL AND user_type != 'client'
```

**Para usuarios (su propio perfil):**
```sql
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### **2. INSERT (Crear) ✅**

```sql
-- ✅ YA CREADA
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

## 🚀 Verificación Completa

### **Ver Todas las Políticas de Profiles:**

Ejecuta esta query en Supabase SQL Editor:

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
- ✅ SELECT: "Users can view their own profile" (autenticados, propio) - **Verificar si existe**
- ✅ INSERT: "Users can insert their own profile" (autenticados, propio) - **✅ CREADA**
- ✅ UPDATE: "Users can update their own profile" (autenticados, propio) - **Verificar si existe**

---

## ✅ Resultado Esperado

Después de crear la política de INSERT:

- ✅ **Error 42501 resuelto**
- ✅ Usuarios pueden crear su propio perfil
- ✅ Profile se crea automáticamente si no existe
- ✅ App funciona correctamente

---

## 🧪 Prueba

1. **Reiniciar Expo:**
   ```bash
   npx expo start --clear
   ```

2. **Iniciar sesión** con un usuario que no tenga profile

3. **Verificar logs:**
   ```
   [Auth] Loading profile for user: xxx
   [Auth] Profile does not exist, creating basic profile...
   [Auth] ✅ Profile created successfully
   ```

4. **Verificar en Supabase:**
   - El profile debería aparecer en la tabla `profiles`
   - Con `user_id` = ID del usuario autenticado
   - Con `role` = 'client'
   - Con `user_type` = 'client'

---

## 📋 Checklist Final

- [x] Política RLS de INSERT creada
- [ ] Política RLS de SELECT para propio perfil (verificar)
- [ ] Política RLS de UPDATE para propio perfil (verificar)
- [ ] Error 42501 resuelto
- [ ] Profile se crea automáticamente
- [ ] App funciona correctamente

---

**Estado:** ✅ Política de INSERT creada correctamente. Listo para probar.

