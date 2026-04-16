# 🏗️ Arquitectura de Sincronización de Perfiles

## 📊 Estado Actual del Sistema

### Flujo de Actualización

#### 1. **SumeePros (App Móvil de Profesionales)** - Fuente de Verdad para Expediente
```
Usuario sube documentos → professional_stats
├── avatar_url (desde profile_photo)
├── expediente_data (JSONB con todos los documentos)
├── expediente_status
└── updated_at
```

**Archivo:** `SumeePros/app/professional-docs.tsx`
- Sube archivos a Storage: `sumee-expedientes/{user_id}/{category}_{index}_{timestamp}.{ext}`
- Actualiza `professional_stats` con:
  - `avatar_url`: Path de la foto de perfil
  - `expediente_data`: JSON con todos los documentos subidos
  - `expediente_status`: Estado del expediente

#### 2. **SumeeClient (App Móvil de Clientes)** - Lee de `profiles`
```
SumeeClient → profiles
├── avatar_url (para mostrar foto)
├── full_name
├── profession
├── calificacion_promedio
└── areas_servicio
```

**Archivo:** `SumeeClient/services/professionals.ts`
- Lee de `profiles` para mostrar profesionales destacados
- Usa `resolveAvatarUrl()` para construir URLs completas

#### 3. **Web (Sumeeapp-B)** - Actualiza `profiles` directamente
```
Web Dashboard → profiles
├── full_name
├── profession
├── whatsapp
├── descripcion_perfil
├── areas_servicio
└── ubicacion_lat/lng
```

**Archivos:** `Sumeeapp-B/src/lib/supabase/actions*.ts`
- Actualiza `profiles` directamente cuando el profesional edita su perfil
- Incluye geocodificación de direcciones

---

## 🔄 Sistema de Sincronización Actual

### Trigger Existente: `sync_avatar_to_profiles`
- **Origen:** `professional_stats.avatar_url`
- **Destino:** `profiles.avatar_url`
- **Estado:** ✅ Funcionando (Dan Nuno ya aparece)

**Archivo:** `TRIGGER_SINCRONIZAR_AVATAR.sql`

---

## 🎯 Arquitectura Propuesta: SumeePros como Fuente de Verdad

### Principio: **SumeePros actualiza → Triggers sincronizan → SumeeClient/Web leen**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUMEEPROS (App Móvil)                     │
│              Fuente de Verdad para Expediente                │
│                                                               │
│  professional_stats                                           │
│  ├── avatar_url                                              │
│  ├── expediente_data (JSONB)                                 │
│  ├── expediente_status                                       │
│  └── updated_at                                              │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ TRIGGERS (Automático)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROFILES (Tabla Unificada)                 │
│              Leída por SumeeClient y Web                     │
│                                                               │
│  profiles                                                    │
│  ├── avatar_url (sincronizado)                              │
│  ├── full_name                                               │
│  ├── profession                                              │
│  ├── areas_servicio                                          │
│  └── certificaciones_urls (desde expediente_data)            │
└─────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  SUMEECLIENT     │          │  WEB (Dashboard) │
│  (App Cliente)   │          │  (Edición)       │
│                  │          │                  │
│  Lee de profiles │          │  Lee/Escribe     │
│  Solo lectura    │          │  profiles        │
└──────────────────┘          └──────────────────┘
```

---

## 🔧 Triggers Necesarios

### 1. ✅ Avatar (Ya Implementado)
```sql
professional_stats.avatar_url → profiles.avatar_url
```

### 2. ⚠️ Expediente Data → Certificaciones (Pendiente)
```sql
professional_stats.expediente_data → profiles.certificaciones_urls
```

### 3. ⚠️ Full Name (Pendiente)
```sql
professional_stats.full_name → profiles.full_name
```

### 4. ⚠️ Expediente Status → Onboarding Status (Pendiente)
```sql
professional_stats.expediente_status → profiles.onboarding_status
```

---

## 📋 Campos a Sincronizar

### Desde `professional_stats` → `profiles`

| Campo Origen | Campo Destino | Prioridad | Estado |
|-------------|---------------|-----------|--------|
| `avatar_url` | `avatar_url` | 🔴 CRÍTICA | ✅ Implementado |
| `full_name` | `full_name` | 🟡 MEDIA | ⚠️ Pendiente |
| `expediente_data->>'certificaciones'` | `certificaciones_urls` | 🟡 MEDIA | ⚠️ Pendiente |
| `expediente_data->>'no_penales'` | `antecedentes_no_penales_url` | 🟡 MEDIA | ⚠️ Pendiente |
| `expediente_status` | `onboarding_status` | 🟢 BAJA | ⚠️ Pendiente |

---

## 🚀 Implementación Recomendada

### Opción 1: Trigger Completo (Recomendado) ⭐
- **Ventaja:** Sincronización automática de todos los campos
- **Desventaja:** Más complejo de mantener
- **Tiempo:** 1-2 horas

### Opción 2: Trigger Incremental
- **Ventaja:** Implementar campo por campo según necesidad
- **Desventaja:** Requiere múltiples deployments
- **Tiempo:** 30 min por campo

### Opción 3: Función RPC Unificada
- **Ventaja:** Control total, lógica centralizada
- **Desventaja:** Requiere cambiar código en SumeePros
- **Tiempo:** 2-3 horas

---

## 📝 Próximos Pasos

1. ✅ **Avatar sincronizado** (Ya funciona)
2. ⚠️ **Implementar trigger completo** para sincronizar todos los campos
3. ⚠️ **Documentar mapeo** de `expediente_data` (JSONB) a campos de `profiles`
4. ⚠️ **Verificar** que la web también puede actualizar `profiles` sin conflictos

---

## 🔍 Verificación

### SQL para Verificar Sincronización
```sql
SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado_avatar
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC;
```

