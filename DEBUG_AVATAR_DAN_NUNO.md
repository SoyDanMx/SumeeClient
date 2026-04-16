# 🔍 Diagnóstico: Avatar de Dan Nuno No Visible

## Problema
Dan Nuno actualizó su foto de perfil desde SumeePros pero no se ve en SumeeClient.

## Pasos de Diagnóstico

### 1. Verificar en Supabase Database
Ejecuta el script `DIAGNOSTICO_AVATAR_DAN_NUNO.sql` en el SQL Editor de Supabase para verificar:
- ✅ Si `avatar_url` tiene un valor
- ✅ Qué formato tiene la URL (completa, relativa, path)
- ✅ En qué bucket se guardó
- ✅ Cuándo se actualizó por última vez

### 2. Verificar en Supabase Storage
1. Ve a **Storage** → **Files** en Supabase Dashboard
2. Busca en los buckets:
   - `professional-avatars` → Busca carpeta con `user_id` de Dan Nuno
   - `sumee-expedientes` → Busca carpeta con `user_id` de Dan Nuno
3. Verifica que el archivo existe y es accesible

### 3. Verificar Formato de URL en BD
El `avatar_url` puede estar en diferentes formatos:

**Formato 1: URL Completa**
```
https://TU_PROJECT_REF.supabase.co/storage/v1/object/public/professional-avatars/user-id/avatar-123.jpg
```

**Formato 2: Path Relativo (bucket incluido)**
```
professional-avatars/user-id/avatar-123.jpg
```

**Formato 3: Path Relativo (solo path)**
```
user-id/avatar-123.jpg
```

**Formato 4: Path de Expediente**
```
user-id/profile_photo_1.jpg
```

### 4. Probar Resolución Manual
Usa esta función en la consola de la app para probar:

```typescript
import { resolveAvatarUrl } from '@/utils/avatar';

// Obtener avatar_url de Dan Nuno desde Supabase
const avatarUrl = '...'; // Valor desde profiles.avatar_url
const updatedAt = '...'; // Valor desde profiles.updated_at

const resolved = resolveAvatarUrl(avatarUrl, updatedAt);
console.log('URL Original:', avatarUrl);
console.log('URL Resuelta:', resolved);
```

### 5. Verificar Logs en App
Revisa los logs de la consola cuando se carga el HomeScreen:
```
[ProfessionalsService] ✅ Attempt 1 SUCCESS: Found X professionals
[HomeScreen] Rendering professional: Dan Nuno, {
  hasPhoto: true/false,
  avatar_url: "..."
}
```

### 6. Verificar Políticas RLS
Asegúrate de que las políticas RLS permiten leer `avatar_url`:
```sql
-- Verificar políticas RLS en profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Soluciones Posibles

### Solución 1: URL en Formato Incorrecto
Si `avatar_url` está en formato incorrecto, normalizar:

```sql
-- Si está como path relativo sin bucket
UPDATE profiles
SET avatar_url = 'professional-avatars/' || avatar_url
WHERE user_id = 'user-id-de-dan-nuno'
  AND avatar_url NOT LIKE 'http%'
  AND avatar_url NOT LIKE 'professional-avatars%';
```

### Solución 2: Foto en Bucket Incorrecto
Si la foto está en `sumee-expedientes` pero debería estar en `professional-avatars`:

1. Verificar en Storage dónde está realmente
2. Mover el archivo al bucket correcto
3. Actualizar `avatar_url` en profiles

### Solución 3: Cache Busting No Funciona
Si la URL es correcta pero no se actualiza:

1. Verificar que `updated_at` se actualiza cuando se sube la foto
2. Verificar que `resolveAvatarUrl()` recibe `updated_at`
3. Forzar recarga con `cache: 'reload'` en Image component

### Solución 4: Política RLS Bloquea
Si RLS bloquea la lectura:

```sql
-- Verificar y corregir políticas
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';
```

## Comandos Útiles

### Ver Avatar URL de Dan Nuno
```sql
SELECT 
    user_id,
    full_name,
    email,
    avatar_url,
    updated_at
FROM profiles
WHERE email ILIKE '%dan%nuno%' OR full_name ILIKE '%dan%nuno%';
```

### Verificar si URL es Accesible
```bash
# Reemplaza con la URL real
curl -I "https://TU_PROJECT_REF.supabase.co/storage/v1/object/public/professional-avatars/user-id/avatar-123.jpg"
```

### Forzar Actualización de Avatar
```sql
-- Actualizar updated_at para forzar cache busting
UPDATE profiles
SET updated_at = NOW()
WHERE user_id = 'user-id-de-dan-nuno';
```

