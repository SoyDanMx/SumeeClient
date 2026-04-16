# 🔄 Cómo Funciona la Sincronización de Perfiles

## 📱 Flujo Completo: SumeePros → Base de Datos → SumeeClient

### 1. **Profesional Actualiza su Perfil en SumeePros**

```
Usuario abre SumeePros
    ↓
Va a "Expediente" / "Documentos"
    ↓
Sube foto de perfil, INE, certificaciones, etc.
    ↓
App sube archivos a Supabase Storage:
    📁 sumee-expedientes/{user_id}/profile_photo_0_123456.jpg
    📁 sumee-expedientes/{user_id}/ine_front_0_123456.jpg
    📁 sumee-expedientes/{user_id}/certificaciones_0_123456.pdf
    ↓
App actualiza professional_stats:
    {
        avatar_url: "user_id/profile_photo_0_123456.jpg",
        expediente_data: {
            "profile_photo": ["user_id/profile_photo_0_123456.jpg"],
            "ine_front": ["user_id/ine_front_0_123456.jpg"],
            "certificaciones": ["user_id/certificaciones_0_123456.pdf"]
        },
        expediente_status: "approved",
        updated_at: "2025-01-XX..."
    }
```

**Archivo:** `SumeePros/app/professional-docs.tsx` (líneas 206-214)

---

### 2. **Trigger Automático Sincroniza a `profiles`**

```
professional_stats se actualiza
    ↓
TRIGGER: sync_professional_trigger
    ↓
FUNCIÓN: sync_professional_to_profiles()
    ↓
Actualiza profiles automáticamente:
    - avatar_url → profiles.avatar_url
    - full_name → profiles.full_name
    - expediente_data->>'certificaciones' → profiles.certificaciones_urls
    - expediente_data->>'no_penales' → profiles.antecedentes_no_penales_url
    - expediente_status → profiles.onboarding_status
    - updated_at → NOW() (para cache busting)
```

**Archivo:** `TRIGGER_SINCRONIZAR_PERFIL_COMPLETO.sql`

---

### 3. **SumeeClient Lee de `profiles`**

```
Cliente abre SumeeClient
    ↓
Home Screen carga "Profesionales Destacados"
    ↓
services/professionals.ts → getFeaturedProfessionals()
    ↓
Query a profiles:
    SELECT 
        user_id,
        full_name,
        avatar_url,  ← Sincronizado automáticamente
        profession,
        calificacion_promedio,
        areas_servicio,
        updated_at  ← Para cache busting
    FROM profiles
    WHERE role = 'profesional'
    ↓
utils/avatar.ts → resolveAvatarUrl()
    ↓
Construye URL completa:
    https://[supabase-url]/storage/v1/object/public/sumee-expedientes/user_id/profile_photo_0_123456.jpg?t=1234567890
    ↓
ProfessionalCard renderiza la foto
```

**Archivos:**
- `SumeeClient/services/professionals.ts`
- `SumeeClient/utils/avatar.ts`
- `SumeeClient/components/ProfessionalCard.tsx`

---

## 🎯 Ventajas de Esta Arquitectura

### ✅ **SumeePros es la Fuente de Verdad**
- Los profesionales actualizan desde la app móvil (más fácil)
- No necesitan usar la web para actualizar su perfil
- Todo se sincroniza automáticamente

### ✅ **Sincronización Automática**
- No requiere intervención manual
- Los cambios se reflejan inmediatamente
- Cache busting automático con `updated_at`

### ✅ **Consistencia de Datos**
- Una sola fuente de verdad (`professional_stats`)
- `profiles` siempre está sincronizado
- SumeeClient y Web leen de la misma tabla

### ✅ **Escalable**
- Fácil agregar nuevos campos a sincronizar
- Los triggers manejan la lógica compleja
- No requiere cambios en el código de las apps

---

## 🔍 Verificación del Sistema

### SQL para Verificar que Funciona

```sql
-- Verificar sincronización de avatar
SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC;
```

### Logs en SumeeClient

Cuando se carga el HomeScreen, deberías ver:

```
[ProfessionalsService] 🚀 Fetching featured professionals...
[ProfessionalsService] ✅ Attempt 1 SUCCESS: Found X professionals
[HomeScreen] Rendering professional: Dan Nuno, {
  hasPhoto: true,
  avatar_url: "https://.../sumee-expedientes/.../profile_photo_0_123456.jpg?t=..."
}
```

---

## 🚀 Próximos Pasos

1. ✅ **Avatar sincronizado** (Ya funciona - Dan Nuno aparece)
2. ⚠️ **Ejecutar trigger completo** para sincronizar todos los campos
3. ⚠️ **Verificar certificaciones** se muestran en SumeeClient
4. ⚠️ **Documentar** cómo agregar nuevos campos a sincronizar

---

## 📝 Notas Técnicas

### Cache Busting
- El sistema usa `updated_at` para agregar `?t=timestamp` a las URLs
- Esto fuerza a los navegadores a recargar imágenes actualizadas
- Implementado en `utils/avatar.ts`

### Detección de Bucket
- El sistema detecta automáticamente el bucket basado en el path
- `profile_photo` → `sumee-expedientes`
- `avatar-` → `professional-avatars`
- Implementado en `utils/avatar.ts` → `detectBucketFromPath()`

### Manejo de Errores
- Si el trigger falla, se registra en logs de Supabase
- Los errores no bloquean la actualización de `professional_stats`
- Se puede verificar manualmente con el SQL de verificación

