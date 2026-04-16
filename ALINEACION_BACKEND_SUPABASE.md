# 🔄 Alineación Backend Supabase: SumeePros ↔ SumeeClient

## 📋 Resumen Ejecutivo

Este documento asegura que **SumeePros** (App Profesionales) y **SumeeClient** (App Clientes) usen el mismo backend de Supabase de manera consistente, compartiendo la misma estructura de datos, servicios y lógica de negocio.

**Fecha:** Enero 2025  
**Estado:** ✅ En progreso  
**Objetivo:** Unificar ambas apps para compartir el mismo backend

---

## 🗄️ Estructura de Base de Datos Compartida

### **Tablas Principales**

#### **1. `profiles`** (Usuarios Base)
```sql
-- Usada por AMBAS apps
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    user_type TEXT CHECK (user_type IN ('client', 'professional')),
    role TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Uso:**
- ✅ **SumeePros:** Filtra `user_type = 'professional'`
- ✅ **SumeeClient:** Filtra `user_type = 'client'`
- ✅ **Ambas:** Usan `profiles` para datos básicos del usuario

---

#### **2. `service_catalog`** (Catálogo de Servicios)
```sql
-- Usada por AMBAS apps
CREATE TABLE service_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline TEXT NOT NULL,              -- 'electricidad', 'plomeria', etc.
    service_name TEXT NOT NULL,
    price_type TEXT CHECK (price_type IN ('fixed', 'range', 'starting_at')),
    max_price NUMERIC,
    unit TEXT,                             -- 'servicio', 'hora', 'm2', etc.
    min_price NUMERIC,
    includes_materials BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Uso:**
- ✅ **SumeeClient:** `CategoryService.getCategories()` - Muestra categorías en HomeScreen
- ✅ **SumeeClient:** `CategoryService.getServicesByDiscipline()` - Lista servicios por categoría
- ⚠️ **SumeePros:** Actualmente NO usa `service_catalog` directamente (debería usarlo)

**Problema Identificado:**
- SumeePros no consulta `service_catalog` para mostrar servicios disponibles
- SumeeClient ya lo usa correctamente

**Solución:**
- Crear `ServiceCatalogService` en SumeePros similar a `CategoryService` en SumeeClient

---

#### **3. `leads`** (Solicitudes de Servicios)
```sql
-- Creada desde Sumeeapp-B (Web), consumida por SumeePros
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES profiles(user_id),
    nombre_cliente TEXT,
    whatsapp TEXT,
    descripcion_proyecto TEXT,
    servicio TEXT,
    servicio_solicitado TEXT,
    ubicacion_lat NUMERIC,
    ubicacion_lng NUMERIC,
    ubicacion_direccion TEXT,
    estado TEXT,                            -- Legacy: 'Nuevo', 'Asignado', etc.
    status TEXT,                            -- Moderno: 'pending', 'accepted', 'completed', etc.
    price NUMERIC,
    agreed_price NUMERIC,
    ai_suggested_price_min NUMERIC,
    ai_suggested_price_max NUMERIC,
    disciplina_ia TEXT,
    urgencia_ia INTEGER,
    diagnostico_ia TEXT,
    imagen_url TEXT,
    photos_urls JSONB,
    professional_id UUID REFERENCES profiles(user_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Flujo:**
1. **Cliente (Sumeeapp-B Web):** Crea lead → `INSERT INTO leads`
2. **Profesional (SumeePros):** Recibe lead → `SELECT * FROM leads WHERE status = 'pending'`
3. **Profesional acepta:** `UPDATE leads SET professional_id = ?, status = 'accepted'`

**Problema Crítico Identificado:**
- ⚠️ **Inconsistencia `estado` vs `status`:** 
  - Web inserta `estado: "nuevo"` o `estado: "Nuevo"`
  - App filtra por `status = 'pending'`
  - **Resultado:** Leads no aparecen en SumeePros

**Solución:**
- Crear trigger en Supabase para sincronizar `estado` → `status`
- Actualizar Web para insertar `status: 'pending'` además de `estado`

---

#### **4. `reviews`** (Reseñas)
```sql
-- Usada por AMBAS apps
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    client_id UUID REFERENCES profiles(user_id),
    professional_id UUID REFERENCES profiles(user_id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Uso:**
- ✅ **SumeePros:** Muestra reseñas recibidas
- ⚠️ **SumeeClient:** Actualmente NO muestra reseñas (debería mostrarlas)

**Solución:**
- Crear `ReviewsService` en SumeeClient para mostrar reseñas de profesionales

---

## 🔐 Autenticación y Sesiones

### **Configuración de Supabase Client**

#### **SumeePros:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### **SumeeClient:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = { /* ... */ };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: ExpoSecureStoreAdapter,  // ✅ MEJOR: Usa SecureStore
  },
});
```

**Diferencia:**
- ✅ **SumeeClient:** Usa `ExpoSecureStoreAdapter` para almacenamiento seguro
- ⚠️ **SumeePros:** Usa almacenamiento por defecto (menos seguro)

**Solución:**
- Actualizar SumeePros para usar `ExpoSecureStoreAdapter` también

---

### **AuthContext Comparación**

#### **SumeePros AuthContext:**
```typescript
type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithPhone: (phone: string) => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    signInWithEmail: (email: string, pass: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    profile: any | null;
};
```

**Características:**
- ✅ Filtra por `user_type = 'professional'`
- ✅ Carga perfil desde `profiles`
- ✅ Redirige a `/welcome` si no ha visto onboarding

#### **SumeeClient AuthContext:**
```typescript
type AuthContextType = {
    user: User | null;
    session: Session | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
    signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
    signInWithPhone: (phone: string) => Promise<{ error: any }>;
    verifyOtp: (phone: string, token: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    profile: any | null;
};
```

**Características:**
- ✅ Filtra por `user_type = 'client'`
- ✅ Carga perfil desde `profiles`
- ✅ Incluye `signUpWithEmail` (SumeePros no lo tiene)

**Diferencias:**
- ⚠️ SumeePros no tiene `signUpWithEmail` (solo registro web)
- ✅ SumeeClient tiene registro completo

**Solución:**
- Mantener diferencias (SumeePros se registra desde web, SumeeClient puede registrarse desde app)

---

## 📦 Servicios y Lógica de Negocio

### **Servicios en SumeePros:**
```
services/
├── jobs.ts                    # ✅ Gestión de leads/trabajos
├── chat.ts                     # ✅ Chat en tiempo real
├── reviews.ts                  # ✅ Reseñas
├── location.ts                 # ✅ Geolocalización
├── routing.ts                   # ✅ Rutas y ETA
├── portfolio.ts                 # ✅ Portafolio
├── scheduling.ts                # ✅ Agendamiento
├── contracts.ts                 # ✅ Contratos
├── analytics.ts                 # ✅ Analytics
└── ... (30+ servicios)
```

### **Servicios en SumeeClient:**
```
services/
├── categories.ts               # ✅ Categorías de servicios
└── search.ts                   # ✅ Búsqueda
```

**Problema:**
- ⚠️ SumeeClient tiene MUY pocos servicios comparado con SumeePros
- ⚠️ SumeeClient no tiene servicios para:
  - Crear leads/solicitudes
  - Ver historial de servicios
  - Calificar profesionales
  - Chat con profesionales

**Solución:**
- Crear servicios faltantes en SumeeClient:
  1. `LeadsService` - Crear y gestionar solicitudes
  2. `ReviewsService` - Ver y crear reseñas
  3. `ChatService` - Chat con profesionales
  4. `HistoryService` - Historial de servicios
  5. `ProfessionalsService` - Buscar y ver profesionales

---

## 🔄 Flujo de Datos: Cliente → Profesional

### **Flujo Actual:**

```
1. Cliente (Sumeeapp-B Web)
   └─> Crea lead
       └─> INSERT INTO leads (estado: "nuevo", status: NULL)
       
2. Supabase Realtime
   └─> Notifica cambio
   
3. Profesional (SumeePros)
   └─> SELECT * FROM leads WHERE status = 'pending'
       └─> ❌ NO encuentra el lead (porque status es NULL)
```

**Problema:**
- ⚠️ Web inserta `estado: "nuevo"` pero NO `status: 'pending'`
- ⚠️ App filtra por `status = 'pending'`
- **Resultado:** Leads no aparecen

**Solución:**
1. **Crear trigger en Supabase:**
```sql
CREATE OR REPLACE FUNCTION sync_estado_to_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS NULL AND NEW.estado IS NOT NULL THEN
    CASE NEW.estado
      WHEN 'nuevo' THEN NEW.status := 'pending';
      WHEN 'Nuevo' THEN NEW.status := 'pending';
      WHEN 'Asignado' THEN NEW.status := 'accepted';
      WHEN 'En Proceso' THEN NEW.status := 'in_progress';
      WHEN 'Completado' THEN NEW.status := 'completed';
      ELSE NEW.status := 'pending';
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_estado_status_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION sync_estado_to_status();
```

2. **Actualizar Web para insertar `status` también:**
```typescript
// En RequestServiceModal.tsx
const leadPayload = {
  // ... otros campos
  status: "pending",        // ✅ Agregar
  estado: "Nuevo",          // Mantener para compatibilidad
};
```

---

## 📊 Campos de Precio: Consistencia

### **Campos de Precio en `leads`:**

| Campo | Tipo | Uso | SumeePros | SumeeClient |
|-------|------|-----|-----------|-------------|
| `price` | NUMERIC | Precio base/estimado | ✅ Usa | ❌ No usa |
| `agreed_price` | NUMERIC | Precio acordado | ✅ Usa | ❌ No usa |
| `ai_suggested_price_min` | NUMERIC | Precio mínimo sugerido por IA | ✅ Usa | ❌ No usa |
| `ai_suggested_price_max` | NUMERIC | Precio máximo sugerido por IA | ✅ Usa | ❌ No usa |

**Problema:**
- ⚠️ SumeeClient no muestra precios de leads (aún no tiene pantalla de leads)

**Solución:**
- Cuando SumeeClient implemente pantalla de "Mis Solicitudes", usar los mismos campos de precio

---

## 🎯 Plan de Alineación

### **Fase 1: Correcciones Críticas** 🔴 PRIORIDAD ALTA

1. **Sincronizar `estado` → `status`**
   - ✅ Crear trigger en Supabase
   - ✅ Actualizar Web para insertar `status: 'pending'`
   - ✅ Verificar que leads aparecen en SumeePros

2. **Actualizar SumeePros para usar SecureStore**
   - ✅ Agregar `ExpoSecureStoreAdapter` a `lib/supabase.ts`
   - ✅ Mejorar seguridad de sesiones

3. **Crear `ServiceCatalogService` en SumeePros**
   - ✅ Similar a `CategoryService` en SumeeClient
   - ✅ Usar `service_catalog` para mostrar servicios disponibles

---

### **Fase 2: Servicios Faltantes en SumeeClient** 🟡 PRIORIDAD MEDIA

1. **Crear `LeadsService`**
   ```typescript
   // services/leads.ts
   export const LeadsService = {
     createLead: async (leadData: CreateLeadInput) => { /* ... */ },
     getMyLeads: async () => { /* ... */ },
     getLeadById: async (leadId: string) => { /* ... */ },
     updateLead: async (leadId: string, updates: Partial<Lead>) => { /* ... */ },
   };
   ```

2. **Crear `ReviewsService`**
   ```typescript
   // services/reviews.ts
   export const ReviewsService = {
     getProfessionalReviews: async (professionalId: string) => { /* ... */ },
     createReview: async (reviewData: CreateReviewInput) => { /* ... */ },
   };
   ```

3. **Crear `ChatService`**
   ```typescript
   // services/chat.ts
   export const ChatService = {
     getConversations: async () => { /* ... */ },
     getMessages: async (conversationId: string) => { /* ... */ },
     sendMessage: async (conversationId: string, message: string) => { /* ... */ },
   };
   ```

4. **Crear `ProfessionalsService`**
   ```typescript
   // services/professionals.ts
   export const ProfessionalsService = {
     searchProfessionals: async (filters: SearchFilters) => { /* ... */ },
     getProfessionalById: async (professionalId: string) => { /* ... */ },
     getProfessionalPortfolio: async (professionalId: string) => { /* ... */ },
   };
   ```

---

### **Fase 3: Consistencia de Datos** 🟢 PRIORIDAD BAJA

1. **Estandarizar nombres de campos**
   - Revisar todos los servicios para usar los mismos nombres
   - Documentar mapeos de campos legacy → modernos

2. **Unificar tipos TypeScript**
   - Crear `@/types/supabase.ts` compartido (si es posible)
   - O al menos documentar tipos esperados

3. **Testing de integración**
   - Crear lead desde Web → Verificar que aparece en SumeePros
   - Crear lead desde SumeeClient → Verificar que aparece en SumeePros
   - Aceptar lead en SumeePros → Verificar que cliente ve actualización

---

## 📝 Checklist de Verificación

### **Backend Supabase:**
- [ ] Trigger `sync_estado_to_status` creado y funcionando
- [ ] Campo `status` se inserta correctamente desde Web
- [ ] Leads aparecen en SumeePros con `status = 'pending'`
- [ ] SecureStore implementado en SumeePros

### **Servicios:**
- [ ] `ServiceCatalogService` creado en SumeePros
- [ ] `LeadsService` creado en SumeeClient
- [ ] `ReviewsService` creado en SumeeClient
- [ ] `ChatService` creado en SumeeClient
- [ ] `ProfessionalsService` creado en SumeeClient

### **Autenticación:**
- [ ] Ambas apps usan SecureStore para sesiones
- [ ] Filtrado por `user_type` funciona correctamente
- [ ] Redirecciones de auth funcionan en ambas apps

### **Datos:**
- [ ] Precios se muestran correctamente en ambas apps
- [ ] Categorías/servicios se cargan desde `service_catalog` en ambas apps
- [ ] Leads se crean y consumen correctamente

---

## 🔗 Referencias

### **Archivos Clave:**

**SumeePros:**
- `lib/supabase.ts` - Cliente Supabase
- `contexts/AuthContext.tsx` - Autenticación
- `services/jobs.ts` - Gestión de leads
- `ANALISIS_FLUJO_LEAD_CLIENTE_PROFESIONAL.md` - Análisis de flujo

**SumeeClient:**
- `lib/supabase.ts` - Cliente Supabase
- `contexts/AuthContext.tsx` - Autenticación
- `services/categories.ts` - Categorías de servicios
- `services/search.ts` - Búsqueda

**Sumeeapp-B (Web):**
- `src/components/client/RequestServiceModal.tsx` - Creación de leads
- `src/components/client/AISumeeAssistant.tsx` - Asistente IA

---

## 📊 Matriz de Consistencia

| Característica | SumeePros | SumeeClient | Estado |
|---------------|-----------|-------------|--------|
| Supabase Client | ✅ | ✅ | ✅ OK |
| SecureStore | ❌ | ✅ | ⚠️ SumeePros necesita actualizar |
| AuthContext | ✅ | ✅ | ✅ OK |
| Filtro user_type | ✅ (professional) | ✅ (client) | ✅ OK |
| service_catalog | ❌ | ✅ | ⚠️ SumeePros necesita usar |
| leads (crear) | ❌ | ❌ | ⚠️ SumeeClient necesita crear |
| leads (consumir) | ✅ | ❌ | ⚠️ SumeeClient necesita ver historial |
| reviews | ✅ (ver) | ❌ | ⚠️ SumeeClient necesita ver/crear |
| chat | ✅ | ❌ | ⚠️ SumeeClient necesita implementar |
| status vs estado | ⚠️ (problema) | N/A | 🔴 CRÍTICO: Arreglar trigger |

---

## 🚀 Próximos Pasos

1. **Implementar trigger `sync_estado_to_status` en Supabase**
2. **Actualizar SumeePros para usar SecureStore**
3. **Crear `ServiceCatalogService` en SumeePros**
4. **Crear servicios faltantes en SumeeClient**
5. **Testing de integración completo**

---

**Última actualización:** Enero 2025  
**Responsable:** Equipo de Desarrollo  
**Estado:** 🔄 En progreso

