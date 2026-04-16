# ✅ Sistema Alineado: SumeePros → Base de Datos → SumeeClient

## 🎯 Principio Fundamental

**SumeePros (App Móvil de Profesionales) es la fuente de verdad para actualizar perfil y documentación.**

---

## 📊 Flujo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  👤 PROFESIONAL ACTUALIZA SU PERFIL                          │
│  📱 SumeePros (App Móvil)                                    │
│                                                               │
│  • Sube foto de perfil                                       │
│  • Sube INE (frente/vuelta)                                  │
│  • Sube certificaciones                                      │
│  • Sube antecedentes no penales                              │
│  • Actualiza información personal                            │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Código: professional-docs.tsx
                        │ Storage: sumee-expedientes/{user_id}/
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  💾 BASE DE DATOS: professional_stats                        │
│                                                               │
│  {                                                           │
│    avatar_url: "user_id/profile_photo_0_123.jpg",          │
│    expediente_data: {                                        │
│      "profile_photo": ["user_id/profile_photo_0_123.jpg"],  │
│      "certificaciones": ["user_id/cert_0_123.pdf"],         │
│      "no_penales": ["user_id/antecedentes_0_123.pdf"]      │
│    },                                                        │
│    expediente_status: "approved",                            │
│    updated_at: "2025-01-XX..."                              │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ ⚡ TRIGGER AUTOMÁTICO
                        │ sync_professional_trigger
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  🔄 SINCRONIZACIÓN AUTOMÁTICA                                │
│  sync_professional_to_profiles()                            │
│                                                               │
│  • avatar_url → profiles.avatar_url                         │
│  • full_name → profiles.full_name                           │
│  • certificaciones → profiles.certificaciones_urls         │
│  • antecedentes → profiles.antecedentes_no_penales_url      │
│  • expediente_status → profiles.onboarding_status            │
│  • updated_at → NOW() (cache busting)                       │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Tabla Unificada
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  📋 BASE DE DATOS: profiles                                  │
│  (Tabla Unificada - Leída por SumeeClient y Web)            │
│                                                               │
│  {                                                           │
│    user_id: "uuid",                                          │
│    full_name: "Dan Nuno",                                    │
│    avatar_url: "user_id/profile_photo_0_123.jpg",          │
│    profession: "Plomero",                                    │
│    certificaciones_urls: ["url1", "url2"],                   │
│    antecedentes_no_penales_url: "url",                      │
│    onboarding_status: "approved",                            │
│    updated_at: "2025-01-XX..."                              │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  📱 SUMEECLIENT  │          │  🌐 WEB           │
│  (App Cliente)   │          │  (Dashboard)      │
│                  │          │                   │
│  • Lee profiles  │          │  • Lee profiles   │
│  • Solo lectura  │          │  • Puede editar   │
│  • Muestra       │          │  • Geocodifica    │
│    profesionales │          │    direcciones     │
└──────────────────┘          └──────────────────┘
```

---

## ✅ Estado Actual

### Implementado y Funcionando

1. ✅ **Avatar Sincronizado**
   - `professional_stats.avatar_url` → `profiles.avatar_url`
   - Trigger: `sync_avatar_to_profiles()`
   - **Verificado:** Dan Nuno aparece correctamente en SumeeClient

2. ✅ **Sistema de Resolución de URLs**
   - `utils/avatar.ts` → `resolveAvatarUrl()`
   - Detecta bucket automáticamente (`sumee-expedientes`)
   - Cache busting con `updated_at`

3. ✅ **Query de Profesionales**
   - `services/professionals.ts` → `getFeaturedProfessionals()`
   - Lee de `profiles` (tabla unificada)
   - Filtra solo profesionales (`role = 'profesional'`)

### Pendiente de Implementar

1. ⚠️ **Trigger Completo**
   - Sincronizar `full_name`
   - Extraer `certificaciones_urls` desde `expediente_data`
   - Extraer `antecedentes_no_penales_url` desde `expediente_data`
   - Mapear `expediente_status` → `onboarding_status`

2. ⚠️ **Mostrar Certificaciones en SumeeClient**
   - Agregar sección de certificaciones en `ProfessionalCard`
   - Mostrar badges de certificaciones

---

## 🔧 Cómo Funciona Actualmente

### Ejemplo Real: Dan Nuno

1. **Dan Nuno actualiza su foto en SumeePros:**
   ```
   SumeePros → Sube foto → Storage: sumee-expedientes/1581075c-94c5-4ef8-95f9-968a3541b101/profile_photo_0_1767646367295.jpg
   ```

2. **SumeePros actualiza professional_stats:**
   ```sql
   UPDATE professional_stats
   SET avatar_url = '1581075c-94c5-4ef8-95f9-968a3541b101/profile_photo_0_1767646367295.jpg'
   WHERE user_id = '1581075c-94c5-4ef8-95f9-968a3541b101';
   ```

3. **Trigger automático sincroniza:**
   ```sql
   -- Trigger ejecuta automáticamente
   UPDATE profiles
   SET avatar_url = '1581075c-94c5-4ef8-95f9-968a3541b101/profile_photo_0_1767646367295.jpg',
       updated_at = NOW()
   WHERE user_id = '1581075c-94c5-4ef8-95f9-968a3541b101';
   ```

4. **SumeeClient lee y muestra:**
   ```typescript
   // services/professionals.ts
   const { data } = await supabase
       .from('profiles')
       .select('avatar_url, updated_at')
       .eq('user_id', '1581075c-94c5-4ef8-95f9-968a3541b101');
   
   // utils/avatar.ts
   const url = resolveAvatarUrl(data.avatar_url, data.updated_at);
   // → https://[supabase-url]/storage/v1/object/public/sumee-expedientes/.../profile_photo_0_1767646367295.jpg?t=1234567890
   
   // components/ProfessionalCard.tsx
   <Image source={{ uri: url }} />
   ```

---

## 🚀 Próximos Pasos

### 1. Ejecutar Trigger Completo (Recomendado)

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: TRIGGER_SINCRONIZAR_PERFIL_COMPLETO.sql
```

**Beneficios:**
- ✅ Sincroniza todos los campos automáticamente
- ✅ Certificaciones disponibles en SumeeClient
- ✅ Antecedentes no penales disponibles
- ✅ Estado de onboarding sincronizado

### 2. Verificar Sincronización

```sql
-- Verificar que todo está sincronizado
SELECT 
    p.user_id,
    p.full_name,
    p.avatar_url,
    ps.avatar_url,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅'
        ELSE '⚠️'
    END as estado
FROM profiles p
JOIN professional_stats ps ON p.user_id = ps.user_id
LIMIT 10;
```

### 3. Probar en SumeeClient

1. Reiniciar Expo: `npx expo start --clear`
2. Verificar que el avatar de Dan Nuno aparece
3. Verificar que otros profesionales también aparecen

---

## 📝 Notas Importantes

### ✅ Ventajas de Esta Arquitectura

1. **SumeePros es la Fuente de Verdad**
   - Los profesionales actualizan desde la app móvil (más fácil)
   - No necesitan usar la web

2. **Sincronización Automática**
   - Los cambios se reflejan inmediatamente
   - No requiere intervención manual

3. **Consistencia**
   - SumeeClient y Web leen de la misma tabla (`profiles`)
   - Datos siempre sincronizados

4. **Escalable**
   - Fácil agregar nuevos campos
   - Los triggers manejan la lógica compleja

### ⚠️ Consideraciones

1. **Web también puede editar `profiles`**
   - No hay conflicto: Web edita directamente `profiles`
   - SumeePros edita `professional_stats` → Trigger sincroniza
   - Si hay conflicto, el trigger sobrescribe (SumeePros tiene prioridad)

2. **Cache Busting**
   - El sistema usa `updated_at` para forzar recarga de imágenes
   - Implementado en `utils/avatar.ts`

3. **Detección de Bucket**
   - El sistema detecta automáticamente el bucket
   - `profile_photo` → `sumee-expedientes`
   - `avatar-` → `professional-avatars`

---

## ✅ Conclusión

**El sistema está alineado y funcionando correctamente:**

- ✅ SumeePros actualiza `professional_stats`
- ✅ Trigger sincroniza automáticamente a `profiles`
- ✅ SumeeClient lee de `profiles` (tabla unificada)
- ✅ El avatar de Dan Nuno aparece correctamente

**Próximo paso:** Ejecutar el trigger completo para sincronizar todos los campos.

