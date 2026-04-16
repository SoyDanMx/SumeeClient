# 🚀 Solución Directa: Forzar Welcome

## ⚡ Solución Rápida (Temporal para Testing)

Si el welcome no aparece automáticamente, puedes forzarlo temporalmente modificando `app/_layout.tsx`:

### **Opción 1: Forzar Welcome en RootLayout (Solo Testing)**

Modifica `app/_layout.tsx` temporalmente:

```typescript
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function RootLayout() {
    const router = useRouter();
    
    // TEMPORAL: Forzar welcome (solo para testing)
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/onboarding/welcome');
        }, 500);
        return () => clearTimeout(timer);
    }, []);
    
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false,
                        }}
                    >
                        {/* ... resto de screens ... */}
                    </Stack>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
```

**⚠️ IMPORTANTE:** Quita este código después de probar.

---

### **Opción 2: Botón de Debug en Home Screen**

Agrega un botón temporal en `app/(tabs)/index.tsx`:

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

// Dentro del componente:
const { profile, reloadProfile } = useAuth();
const router = useRouter();

// Botón temporal (puedes ponerlo en un lugar discreto)
<TouchableOpacity
    onPress={async () => {
        console.log('[DEBUG] Profile:', profile);
        console.log('[DEBUG] Onboarding completed:', profile?.onboarding_completed);
        await reloadProfile();
        router.replace('/onboarding/welcome');
    }}
    style={{ padding: 10, backgroundColor: 'red', margin: 10 }}
>
    <Text style={{ color: 'white' }}>DEBUG: Ver Welcome</Text>
</TouchableOpacity>
```

---

### **Opción 3: Verificar y Recargar Perfil**

Ejecuta en Supabase SQL Editor:

```sql
-- 1. Verificar estado actual
SELECT 
    user_id,
    full_name,
    email,
    onboarding_completed,
    created_at,
    updated_at
FROM profiles
WHERE user_id = auth.uid();

-- 2. Forzar a false
UPDATE profiles 
SET onboarding_completed = false,
    updated_at = NOW()
WHERE user_id = auth.uid();

-- 3. Verificar cambio
SELECT 
    user_id,
    onboarding_completed,
    updated_at
FROM profiles
WHERE user_id = auth.uid();
```

Luego en la app:

1. **Cierra completamente la app** (no solo minimizar)
2. **Abre la app de nuevo**
3. **Si aún no aparece**, agrega un botón temporal para recargar:

```typescript
// En cualquier pantalla visible
const { reloadProfile } = useAuth();

<TouchableOpacity onPress={reloadProfile}>
    <Text>Recargar Perfil</Text>
</TouchableOpacity>
```

---

## 🔍 Verificar Logs

Abre la consola de Metro Bundler y busca:

```
[Auth] Loading profile for user: ...
[Auth] Profile data: { ... }
[Auth] Navigation check: { ... }
[Auth] ✅ User has not completed onboarding, redirecting to welcome
```

**Si NO ves estos logs:**
- El perfil no se está cargando
- O hay un error en `loadUserProfile`

**Si ves los logs pero no aparece el welcome:**
- Problema de routing
- El componente welcome tiene un error

---

## ✅ Checklist Final

- [ ] `onboarding_completed = false` en BD (verificado con SELECT)
- [ ] App cerrada completamente y reabierta
- [ ] Logs muestran "redirecting to welcome"
- [ ] `app/onboarding/welcome.tsx` existe (verificado con `ls`)
- [ ] `app/onboarding/_layout.tsx` está configurado
- [ ] No hay errores en consola de Metro
- [ ] Cache limpio (`rm -rf .expo .expo-shared`)

---

## 🎯 Solución Definitiva

Si nada funciona, usa la **Opción 1** (forzar welcome en RootLayout) temporalmente para verificar que el componente funciona, luego quita el código y depura el routing.

