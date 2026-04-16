# 📍 Ubicación del Onboarding/Welcome

**Estado:** ✅ Implementado pero NO se muestra automáticamente

---

## 📂 Archivos del Onboarding

### **Pantalla Welcome:**
- **Ubicación:** `app/onboarding/welcome.tsx`
- **Ruta:** `/onboarding/welcome`
- **Estado:** ✅ Completada

### **Layout del Onboarding:**
- **Ubicación:** `app/onboarding/_layout.tsx`
- **Pantallas registradas:**
  - `welcome` ✅
  - `services` ⏳ (pendiente)
  - `management` ⏳ (pendiente)
  - `permissions` ⏳ (pendiente)

### **Componentes:**
- `components/onboarding/SumeeLogo.tsx` ✅
- `components/onboarding/OnboardingButton.tsx` ✅
- `components/onboarding/ProgressDots.tsx` ✅

---

## 🚨 Problema Actual

**El onboarding NO se muestra automáticamente** porque:

1. **En `AuthContext.tsx` (líneas 52-66):**
   ```typescript
   // Cuando el usuario se autentica, va directo a /(tabs)
   else if (isAuthenticated && inAuthGroup) {
       router.replace('/(tabs)'); // ❌ No verifica onboarding
   }
   ```

2. **No hay verificación de `onboarding_completed`:**
   - No se verifica si el usuario ha completado el onboarding
   - No se redirige a `/onboarding/welcome` si es primera vez

---

## ✅ Solución: Mostrar Onboarding Automáticamente

### **Opción 1: Verificar en AuthContext (Recomendado)**

Modificar `contexts/AuthContext.tsx` para verificar si el usuario ha completado el onboarding:

```typescript
// Navigate based on auth state
useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
        router.replace('/auth/login');
    } else if (isAuthenticated) {
        // Verificar si ha completado onboarding
        const hasCompletedOnboarding = profile?.onboarding_completed === true;
        
        if (!hasCompletedOnboarding && !inOnboardingGroup) {
            // Primera vez → mostrar onboarding
            router.replace('/onboarding/welcome');
        } else if (hasCompletedOnboarding && inAuthGroup) {
            // Ya completó onboarding → ir a home
            router.replace('/(tabs)');
        } else if (hasCompletedOnboarding && inOnboardingGroup) {
            // Ya completó pero está en onboarding → ir a home
            router.replace('/(tabs)');
        }
    }
}, [isAuthenticated, isLoading, segments, profile]);
```

### **Opción 2: Verificar en Welcome Screen**

Modificar `app/onboarding/welcome.tsx` para marcar como completado:

```typescript
const handleReturning = async () => {
    // Marcar onboarding como completado
    if (user?.id) {
        await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('user_id', user.id);
    }
    router.replace('/(tabs)');
};

const handleSkip = async () => {
    // Marcar onboarding como completado
    if (user?.id) {
        await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('user_id', user.id);
    }
    router.replace('/(tabs)');
};
```

---

## 📋 Pasos para Activar el Onboarding

### **1. Agregar columna `onboarding_completed` a la BD:**

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
```

### **2. Modificar `AuthContext.tsx`:**

Agregar verificación de `onboarding_completed` en el `useEffect` de navegación.

### **3. Modificar `welcome.tsx`:**

Agregar lógica para marcar `onboarding_completed = true` cuando el usuario:
- Toca "Ya he usado Sumee"
- Toca "Omitir"
- Completa el flujo completo

---

## 🧪 Cómo Probar Manualmente

### **Opción A: Navegar directamente**
```typescript
// En cualquier pantalla, puedes navegar manualmente:
router.push('/onboarding/welcome');
```

### **Opción B: Usar la ruta en el navegador**
- Abre la app
- Navega a: `/onboarding/welcome`

---

## 📊 Flujo Esperado

```
Usuario inicia sesión
    ↓
¿Tiene onboarding_completed = true?
    ├─ NO → /onboarding/welcome
    └─ SÍ → /(tabs) (Home)
```

---

## 🎯 Estado Actual

- ✅ **Pantalla Welcome:** Implementada y funcional
- ✅ **Componentes:** Creados y listos
- ✅ **Rutas:** Registradas en el Stack
- ❌ **Lógica de detección:** NO implementada
- ❌ **Columna BD:** Probablemente no existe
- ❌ **Marcado como completado:** NO implementado

---

**¿Quieres que implemente la lógica para mostrar el onboarding automáticamente?** 🚀

