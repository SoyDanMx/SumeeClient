# ✅ Solución: Error PGRST116 en AuthContext

## 🐛 Problema

**Error:**
```
PGRST116: JSON object requested, multiple (or no) rows returned
```

**Causa:**
- El código usaba `.single()` que espera **exactamente 1 fila**
- Si no hay profile (0 filas), lanza error
- Si hay múltiples profiles (raro), también lanza error

**Ubicación:**
- `contexts/AuthContext.tsx` línea 100

---

## ✅ Solución Aplicada

### **1. Cambio de `.single()` a `.maybeSingle()`**

**Antes:**
```typescript
const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single(); // ❌ Falla si no hay filas
```

**Después:**
```typescript
const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle(); // ✅ Maneja 0 filas correctamente (devuelve null)
```

### **2. Creación Automática de Profile**

Si no existe profile, se crea automáticamente:

```typescript
if (!profileData) {
    console.log('[Auth] Profile does not exist, creating basic profile...');
    
    const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
            user_id: user.id,
            email: user.email || '',
            full_name: user.email?.split('@')[0] || 'Usuario',
            role: 'client',
            user_type: 'client',
        })
        .select()
        .single();

    if (createError) {
        console.error('[Auth] Error creating profile:', createError);
        setProfile(null);
        return;
    }

    setProfile(newProfile);
    return;
}
```

### **3. Manejo Mejorado de Errores**

- ✅ Errores reales (RLS, etc.) se manejan sin cerrar sesión
- ✅ Solo PGRST116 (no existe) se maneja creando profile
- ✅ No se cierra sesión automáticamente

---

## 📋 Comportamiento Actual

### **Escenario 1: Profile Existe**
- ✅ Se carga normalmente
- ✅ No hay errores

### **Escenario 2: Profile No Existe**
- ✅ Se detecta (`.maybeSingle()` devuelve `null`)
- ✅ Se crea automáticamente con datos básicos
- ✅ Usuario puede continuar usando la app

### **Escenario 3: Error Real (RLS, etc.)**
- ✅ Se registra el error
- ✅ Profile se establece como `null`
- ✅ Usuario mantiene sesión (puede intentar de nuevo)

---

## 🚀 Resultado

- ✅ **Error PGRST116 eliminado**
- ✅ **Mejor experiencia de usuario** (no se cierra sesión)
- ✅ **Profile se crea automáticamente** si no existe
- ✅ **Manejo robusto de errores**

---

## 🔍 Verificación

**Logs Esperados:**
```
[Auth] Loading profile for user: xxx
[Auth] Profile does not exist, creating basic profile...
[Auth] ✅ Profile created successfully
```

**O si ya existe:**
```
[Auth] Loading profile for user: xxx
[Auth] ✅ Profile loaded successfully
```

---

**Estado:** ✅ Corregido y listo para probar

