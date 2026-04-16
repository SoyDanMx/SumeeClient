# 🔄 Alineación de Lógica: SumeePros ↔ Sumeeapp-B ↔ SumeeClient

## 📋 Resumen Ejecutivo

Este documento asegura que las tres aplicaciones (SumeePros, Sumeeapp-B Web, y SumeeClient) compartan la misma lógica de negocio y estructura de datos, especialmente para el flujo de cotizaciones y solicitudes de servicios, inspirado en AORA.

---

## 🎯 Flujo Unificado: Cliente Solicita → Profesional Cotiza

### **Flujo Completo:**

```
1. Cliente (SumeeClient o Web)
   └─> Selecciona servicio de service_catalog
   └─> Completa formulario dinámico
   └─> Ve precio en tiempo real
   └─> Selecciona fecha/hora (opcional)
   └─> Confirma y crea LEAD

2. Lead creado en Supabase
   └─> status: 'pending'
   └─> quote_data: JSONB con formulario y cotización
   └─> price: precio base
   └─> agreed_price: precio final con IVA

3. Profesional (SumeePros)
   └─> Recibe notificación de nuevo lead
   └─> Ve lead con toda la información
   └─> Puede enviar cotización (si no hay precio fijo)
   └─> Acepta lead → status: 'accepted'

4. Cliente
   └─> Ve cotizaciones recibidas
   └─> Acepta o rechaza
   └─> Servicio se programa
```

---

## 🗄️ Estructura de Datos Compartida

### **1. Tabla `service_catalog` (Ya existe)**

**Usada por las 3 apps:**
- ✅ **SumeeClient:** Muestra servicios disponibles
- ✅ **Sumeeapp-B:** Muestra servicios en dashboard
- ⚠️ **SumeePros:** Debería usarla para mostrar servicios disponibles

**Campos clave:**
```sql
- id UUID
- discipline TEXT (electricidad, plomeria, etc.)
- service_name TEXT
- price_type TEXT (fixed, range, starting_at)
- min_price NUMERIC
- max_price NUMERIC
- unit TEXT
- includes_materials BOOLEAN
- description TEXT
- is_active BOOLEAN
- is_popular BOOLEAN
```

---

### **2. Tabla `leads` (Ya existe, extendida)**

**Campos compartidos:**
```sql
- id UUID
- cliente_id UUID → profiles(user_id)
- nombre_cliente TEXT
- whatsapp TEXT
- servicio TEXT → discipline de service_catalog
- servicio_solicitado TEXT → service_name de service_catalog
- descripcion_proyecto TEXT (o JSONB con form_data)
- ubicacion_lat NUMERIC
- ubicacion_lng NUMERIC
- ubicacion_direccion TEXT
- estado TEXT (legacy: 'Nuevo', 'Asignado', etc.)
- status TEXT (moderno: 'pending', 'accepted', 'completed')
- price NUMERIC (precio base)
- agreed_price NUMERIC (precio acordado/final)
- ai_suggested_price_min NUMERIC
- ai_suggested_price_max NUMERIC
- professional_id UUID (cuando es aceptado)
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

**Campos a agregar (para alineación con AORA):**
```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS:
  - quote_data JSONB, -- Datos del formulario y cotización
  - appointment_at TIMESTAMP, -- Fecha/hora programada
  - immediate_service BOOLEAN DEFAULT FALSE,
  - payment_method VARCHAR(50), -- 'cash', 'card', 'pending'
  - payment_status VARCHAR(50) DEFAULT 'pending'
```

---

### **3. Tabla `quotes` (Ya existe en SumeePros)**

**Estructura actual:**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES leads(id),
  professional_id UUID,
  client_id UUID,
  price NUMERIC,
  description TEXT,
  estimated_time TEXT,
  includes TEXT[],
  status TEXT, -- 'pending', 'accepted', 'rejected', 'expired'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Uso:**
- ✅ **SumeePros:** Crea cotizaciones para leads
- ⚠️ **SumeeClient:** Debería mostrar cotizaciones recibidas
- ⚠️ **Sumeeapp-B:** Debería mostrar cotizaciones en dashboard

---

## 🔄 Servicios Compartidos

### **1. QuoteService (Alineado)**

**SumeePros:** `services/quotes.ts`
- ✅ `createQuickQuote()` - Crear cotización rápida
- ✅ `getTemplatesForService()` - Templates pre-configurados
- ✅ `acceptQuote()` / `rejectQuote()` - Responder cotización

**SumeeClient:** `services/quotes.ts` (NUEVO)
- ✅ `calculatePrice()` - Calcular precio en tiempo real
- ✅ `createQuoteAndLead()` - Crear cotización y lead
- ✅ `getClientQuotes()` - Obtener cotizaciones del cliente
- ✅ `respondToQuote()` - Aprobar/rechazar cotización

**Alineación:**
- Ambos usan la misma estructura `ServiceQuote`
- Ambos crean leads con la misma estructura
- Ambos usan la tabla `quotes` para cotizaciones de profesionales

---

### **2. CategoryService (Alineado)**

**SumeeClient:** `services/categories.ts`
- ✅ `getCategories()` - Obtener categorías desde `service_catalog`
- ✅ `getServicesByDiscipline()` - Servicios por disciplina
- ✅ `getMinPrice()` - Precio mínimo

**SumeePros:** (FALTA)
- ⚠️ Debería tener `ServiceCatalogService` similar
- ⚠️ Para mostrar servicios disponibles y precios base

**Alineación necesaria:**
- Crear `ServiceCatalogService` en SumeePros
- Usar la misma lógica de `service_catalog`

---

## 📱 Pantallas y Flujos

### **SumeeClient - Flujo de Solicitud (Similar a AORA)**

1. **HomeScreen** (`app/(tabs)/index.tsx`)
   - ✅ Muestra categorías desde `service_catalog`
   - ✅ Navega a `/service-category/[id]`

2. **ServiceCategoryScreen** (`app/service-category/[id].tsx`) - NUEVO
   - ✅ Lista servicios de una categoría
   - ✅ Navega a `/service/[id]`

3. **ServiceDetailScreen** (`app/service/[id].tsx`) - NUEVO
   - ✅ Formulario dinámico (similar a AORA)
   - ✅ Cálculo de precio en tiempo real
   - ✅ Agendamiento de citas
   - ✅ Crea lead con `quote_data`

4. **ServiceConfirmationScreen** (`app/request-service/confirm.tsx`) - NUEVO
   - ✅ Resumen del servicio
   - ✅ Desglose de precios
   - ✅ Selección de método de pago
   - ✅ Confirma y crea lead

5. **ProjectsScreen** (`app/(tabs)/projects.tsx`) - ACTUALIZADO
   - ✅ Lista leads del cliente
   - ✅ Filtros por status
   - ✅ Muestra cotizaciones recibidas

---

### **SumeePros - Flujo de Cotización (Ya existe)**

1. **JobsScreen** (`app/(tabs)/jobs.tsx`)
   - ✅ Lista leads con `status = 'pending'`
   - ✅ Muestra información del lead

2. **JobDetailScreen** (`app/job/[id].tsx`)
   - ✅ Detalles completos del lead
   - ✅ Botón "Cotizar Rápido"
   - ✅ Muestra `quote_data` si existe

3. **QuickQuoteModal** (`components/QuickQuoteModal.tsx`)
   - ✅ Templates pre-configurados
   - ✅ Cotización personalizada
   - ✅ Crea registro en tabla `quotes`

---

### **Sumeeapp-B - Flujo Web (Ya existe)**

1. **Dashboard Cliente**
   - ✅ Crea leads desde `RequestServiceModal`
   - ✅ Usa `AISumeeAssistant` para cotización IA

2. **Dashboard Profesional**
   - ✅ Ve leads disponibles
   - ✅ Envía cotizaciones

**Alineación necesaria:**
- ⚠️ Web debería usar el mismo formulario dinámico que SumeeClient
- ⚠️ Web debería guardar `quote_data` en leads

---

## 🔧 Lógica de Cotización Unificada

### **Cálculo de Precio (Alineado con AORA)**

```typescript
// Misma lógica en SumeeClient y Web
function calculatePrice(
  basePrice: number,
  formData: ServiceQuoteFormData,
  immediateService: boolean
): ServiceQuote {
  // 1. Precio base
  const base = basePrice;
  
  // 2. Servicio inmediato (+$10)
  const immediateFee = immediateService ? 10 : 0;
  
  // 3. Servicios adicionales (basados en formData)
  const additionalServices = calculateAdditionalServices(formData);
  const additionalTotal = additionalServices
    .filter(s => s.selected)
    .reduce((sum, s) => sum + s.price, 0);
  
  // 4. Subtotal
  const subtotal = base + immediateFee + additionalTotal;
  
  // 5. Descuentos
  const discounts = calculateDiscounts();
  const discountTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
  
  // 6. Total
  const total = subtotal - discountTotal;
  
  // 7. IVA (16%)
  const taxRate = 0.16;
  const totalWithTax = total * (1 + taxRate);
  
  return {
    base_price: base,
    immediate_service_fee: immediateFee,
    additional_services: additionalServices,
    discounts,
    subtotal,
    total,
    total_with_tax: totalWithTax,
    tax_rate: taxRate,
  };
}
```

**Alineación:**
- ✅ SumeeClient usa esta lógica
- ⚠️ Web debería usar la misma lógica
- ✅ SumeePros calcula precios de manera similar (pero desde templates)

---

## 📊 Mapeo de Estados

| Estado Cliente | Estado Profesional | Estado Lead | Descripción |
|---------------|-------------------|-------------|-------------|
| "Solicitado" | "Nuevo" | `pending` | Lead creado, esperando cotización |
| "Cotizado" | "Cotizado" | `pending` (con quote) | Profesional envió cotización |
| "Aceptado" | "Aceptado" | `accepted` | Cliente aceptó cotización |
| "En Proceso" | "En Proceso" | `in_progress` | Profesional trabajando |
| "Completado" | "Completado" | `completed` | Servicio terminado |

---

## 🔄 Sincronización de Datos

### **Cuando Cliente Crea Lead:**

1. **SumeeClient/Web:**
   ```typescript
   await QuoteService.createQuoteAndLead(
     clientId,
     serviceId,
     quote,
     appointmentAt,
     location
   );
   ```

2. **Supabase:**
   ```sql
   INSERT INTO leads (
     cliente_id,
     servicio,
     servicio_solicitado,
     descripcion_proyecto, -- JSON con form_data
     status: 'pending',
     price: quote.base_price,
     agreed_price: quote.total_with_tax,
     quote_data: quote (si existe columna)
   );
   ```

3. **SumeePros:**
   - Realtime subscription detecta nuevo lead
   - Aparece en lista de trabajos disponibles
   - Profesional puede ver toda la información

---

### **Cuando Profesional Envía Cotización:**

1. **SumeePros:**
   ```typescript
   await createQuickQuote(
     jobId,
     professionalId,
     price,
     description
   );
   ```

2. **Supabase:**
   ```sql
   INSERT INTO quotes (
     job_id,
     professional_id,
     client_id,
     price,
     description,
     status: 'pending'
   );
   ```

3. **SumeeClient/Web:**
   - Realtime subscription detecta nueva cotización
   - Aparece en "Mis Solicitudes"
   - Cliente puede aceptar/rechazar

---

## ✅ Checklist de Alineación

### **Backend (Supabase):**
- [x] Trigger `sync_estado_to_status` creado
- [ ] Columna `quote_data` agregada a `leads` (opcional, se puede usar `descripcion_proyecto` como JSON)
- [ ] Tabla `quotes` existe y tiene RLS correcto
- [ ] Políticas RLS permiten lectura/escritura correcta

### **SumeeClient:**
- [x] `QuoteService` creado
- [x] Pantalla de servicio con formulario dinámico
- [x] Pantalla de confirmación
- [x] Pantalla de categorías
- [x] Pantalla de "Mis Solicitudes"
- [ ] Mostrar cotizaciones recibidas (pendiente)

### **SumeePros:**
- [x] `QuoteService` existe
- [x] `QuickQuoteModal` existe
- [ ] `ServiceCatalogService` (pendiente - usar `service_catalog`)

### **Sumeeapp-B (Web):**
- [x] Crea leads desde `RequestServiceModal`
- [x] Usa `AISumeeAssistant` para cotización IA
- [ ] Formulario dinámico similar a SumeeClient (pendiente)
- [ ] Guardar `quote_data` en leads (pendiente)

---

## 🎯 Próximos Pasos

1. **Agregar columna `quote_data` a `leads`** (opcional)
2. **Crear `ServiceCatalogService` en SumeePros**
3. **Implementar visualización de cotizaciones en SumeeClient**
4. **Sincronizar formulario dinámico entre Web y SumeeClient**
5. **Testing de flujo completo: Cliente → Profesional → Cliente**

---

**Última actualización:** Enero 2025  
**Estado:** 🔄 En progreso - Lógica básica alineada

