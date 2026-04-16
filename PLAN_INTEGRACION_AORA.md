# 🎯 Plan de Integración AORA - SumeeClient ↔ SumeePros

## 📋 Resumen Ejecutivo

Basado en el análisis de AORA, necesitamos implementar un sistema de cotización dinámica, programación de citas, y mejor integración entre SumeeClient y SumeePros que permita un flujo similar al de AORA.

---

## 🔄 Flujo Actual vs Flujo AORA

### **Flujo Actual (Sumee):**
```
Cliente → Crea LEAD básico → Profesional ve LEAD → Acepta → Trabaja
```

### **Flujo AORA (Objetivo):**
```
Cliente → Completa formulario dinámico → Ve precio en tiempo real 
→ Selecciona fecha/hora → Confirma y paga → LEAD con toda la info 
→ Profesional ve LEAD completo → Acepta → Trabaja
```

---

## 🏗️ Estructura de Datos Necesaria

### **1. Extender Tabla `leads` (Ya existe, necesita campos adicionales)**

```sql
-- Campos a agregar a la tabla leads existente:
ALTER TABLE leads ADD COLUMN IF NOT EXISTS:
  - service_category_id UUID REFERENCES service_categories(id)
  - quote_data JSONB -- Datos del formulario de cotización
  - price_quoted DECIMAL(10,2) -- Precio cotizado
  - price_final DECIMAL(10,2) -- Precio final
  - appointment_at TIMESTAMP -- Fecha/hora programada
  - payment_method VARCHAR(50) -- 'cash', 'card', 'pending'
  - payment_status VARCHAR(50) -- 'pending', 'paid', 'refunded'
  - immediate_service BOOLEAN DEFAULT FALSE
  - additional_services JSONB -- Servicios adicionales
```

### **2. Nueva Tabla `service_quotes`**

```sql
CREATE TABLE service_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  service_category_id UUID REFERENCES service_categories(id),
  form_data JSONB NOT NULL, -- Respuestas del formulario
  base_price DECIMAL(10,2) NOT NULL,
  immediate_service_fee DECIMAL(10,2) DEFAULT 0,
  additional_services JSONB DEFAULT '[]'::jsonb,
  discounts JSONB DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  total_with_tax DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0.16, -- IVA 16%
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Nueva Tabla `service_categories` (Si no existe)**

```sql
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  base_price DECIMAL(10,2),
  form_schema JSONB, -- Esquema del formulario dinámico
  pricing_rules JSONB, -- Reglas de precios
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **4. Nueva Tabla `service_materials`**

```sql
CREATE TABLE service_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(user_id),
  material_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'unidad',
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  purchase_service_fee DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, purchased
  client_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 Componentes a Crear en SumeeClient

### **1. `ServiceQuoteForm` Component**

**Ubicación:** `components/ServiceQuoteForm.tsx`

**Funcionalidad:**
- Formulario dinámico basado en `form_schema` de la categoría
- Cálculo de precio en tiempo real
- Validación de campos
- Guardado de respuestas

**Props:**
```typescript
interface ServiceQuoteFormProps {
  serviceCategoryId: string;
  onQuoteChange: (quote: ServiceQuote) => void;
  initialData?: any;
}
```

### **2. `ServiceCalendar` Component**

**Ubicación:** `components/ServiceCalendar.tsx`

**Funcionalidad:**
- Mostrar días disponibles
- Selección de fecha/hora
- Integración con disponibilidad de profesionales
- Formato similar a AORA: "Hoy", "Mañana Jueves 29 Oct.", etc.

### **3. `ServiceConfirmation` Screen**

**Ubicación:** `app/request-service/confirm.tsx`

**Funcionalidad:**
- Resumen completo del servicio
- Desglose de precios
- Selección de método de pago
- Confirmación final

### **4. `AddressSelector` Component**

**Ubicación:** `components/AddressSelector.tsx`

**Funcionalidad:**
- Múltiples direcciones guardadas
- Selección de dirección
- Agregar nueva dirección
- Similar a AORA: "Mi Oficina", "Casa"

---

## 🔧 Servicios a Crear

### **1. `QuoteService`**

**Ubicación:** `services/quote.ts`

**Funcionalidad:**
- Calcular precio basado en formulario
- Aplicar reglas de precios
- Calcular descuentos
- Calcular IVA

```typescript
export class QuoteService {
  static calculatePrice(
    categoryId: string,
    formData: any,
    immediateService: boolean
  ): Promise<ServiceQuote>;
  
  static saveQuote(leadId: string, quote: ServiceQuote): Promise<void>;
  
  static getPricingRules(categoryId: string): Promise<PricingRules>;
}
```

### **2. `AppointmentService`**

**Ubicación:** `services/appointment.ts`

**Funcionalidad:**
- Obtener disponibilidad de profesionales
- Reservar fecha/hora
- Cancelar cita

### **3. `MaterialService`**

**Ubicación:** `services/materials.ts`

**Funcionalidad:**
- Proponer materiales (profesional)
- Aprobar materiales (cliente)
- Calcular costos

---

## 📱 Pantallas a Crear/Mejorar

### **1. `/service/[id]` - Mejorar**

**Agregar:**
- Formulario de cotización dinámico
- Cálculo de precio en tiempo real
- Selector de fecha/hora
- Botón "Solicitar servicio" mejorado

### **2. `/request-service` - Nueva**

**Flujo:**
1. Resumen del servicio
2. Formulario de cotización
3. Selección de fecha/hora
4. Selección de dirección
5. Confirmación y pago

### **3. `/request-service/confirm` - Nueva**

**Contenido:**
- Resumen completo
- Desglose de precios
- Método de pago
- Confirmar

---

## 🔗 Integración con SumeePros

### **1. Mejorar Visualización de LEADs**

**En SumeePros, cuando un profesional ve un LEAD:**

**Agregar sección "Cotización":**
- Mostrar formulario completado
- Mostrar precio cotizado
- Mostrar fecha/hora programada
- Mostrar dirección seleccionada

**Agregar sección "Materiales":**
- Ver materiales propuestos (si hay)
- Proponer nuevos materiales
- Ver aprobación del cliente

### **2. Sistema de Proformas**

**En SumeePros:**
- Profesional puede crear proforma de materiales
- Cliente ve proforma en SumeeClient
- Cliente aprueba/rechaza
- Profesional puede comprar materiales

---

## 📊 Reglas de Precios (Ejemplo: Aire Acondicionado)

```typescript
const pricingRules = {
  base_price: 49.00,
  immediate_service_fee: 10.00,
  questions: {
    "¿Necesitas que desinstalemos el A/C actual?": {
      "Si": { price: 30.00 },
      "No": { price: 0 }
    },
    "¿Existe punto eléctrico y/o cañerías?": {
      "No": { price: 25.00 }, // Instalación de punto
      "Si": { price: 0 }
    },
    "¿A qué altura debe instalarse?": {
      "A menos de 6 mts.": { price: 0 },
      "A más de 6 mts.": { price: 15.00 },
      "A más de 10 mts.": { price: 30.00 },
      "En el techo": { price: 20.00 }
    },
    "¿Cuántos A/C necesitas instalar?": {
      "1": { multiplier: 1 },
      "2": { multiplier: 1.8 },
      "3": { multiplier: 2.5 },
      "4": { multiplier: 3.2 },
      "5+": { multiplier: 4 }
    }
  },
  discounts: [
    { condition: "first_time", discount: 16.00 },
    { condition: "referral", discount: 10.00 }
  ]
};
```

---

## 🚀 Plan de Implementación

### **Fase 1: Estructura de Datos** (Semana 1)
- [ ] Crear migraciones para nuevas tablas
- [ ] Extender tabla `leads`
- [ ] Crear `service_categories` con datos iniciales
- [ ] Crear `service_quotes`
- [ ] Crear `service_materials`

### **Fase 2: Sistema de Cotización** (Semana 2)
- [ ] Crear `QuoteService`
- [ ] Crear `ServiceQuoteForm` component
- [ ] Implementar cálculo en tiempo real
- [ ] Integrar en pantalla de servicio

### **Fase 3: Sistema de Programación** (Semana 2-3)
- [ ] Crear `AppointmentService`
- [ ] Crear `ServiceCalendar` component
- [ ] Integrar con disponibilidad de profesionales
- [ ] Agregar a flujo de solicitud

### **Fase 4: Pantalla de Confirmación** (Semana 3)
- [ ] Crear `/request-service/confirm`
- [ ] Implementar desglose de precios
- [ ] Agregar selección de método de pago
- [ ] Integrar creación de LEAD

### **Fase 5: Integración SumeePros** (Semana 4)
- [ ] Mejorar visualización de LEADs
- [ ] Agregar sección de cotización
- [ ] Implementar sistema de materiales
- [ ] Crear proformas

### **Fase 6: Sistema de Pagos** (Semana 5)
- [ ] Integrar Stripe/PayPal
- [ ] Procesar pagos
- [ ] Confirmación de pago

---

## 🎯 Prioridades

### **Alta Prioridad:**
1. ✅ Sistema de cotización dinámica
2. ✅ Cálculo de precio en tiempo real
3. ✅ Sistema de programación
4. ✅ Pantalla de confirmación

### **Media Prioridad:**
5. Sistema de materiales
6. Proformas
7. Múltiples direcciones

### **Baja Prioridad:**
8. Sistema de pagos completo
9. Descuentos avanzados
10. Promociones

---

## 📝 Notas Importantes

- **Mantener compatibilidad:** Los LEADs existentes deben seguir funcionando
- **Migración gradual:** Implementar sin romper funcionalidad actual
- **Testing:** Probar flujo completo Cliente → Profesional
- **Performance:** Cálculo de precios debe ser rápido (< 100ms)

---

**Fecha:** Enero 2025  
**Estado:** 📋 Plan listo para implementación

