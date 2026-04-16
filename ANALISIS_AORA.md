# 🔍 Análisis de AORA - Referencia para Sumee

## 📱 Visión General

AORA es una app de servicios a domicilio que conecta clientes con profesionales certificados. Su modelo es muy similar al que estamos construyendo con Sumee, pero con algunas características distintivas que debemos incorporar.

---

## 🎯 Características Principales de AORA

### **1. Sistema de Categorías de Servicios**

**Estructura:**
- **HOGAR Y OFICINA:**
  - Electricidad
  - Gasfitería (Plomería)
  - Cerrajería
  - Albañilería

- **ELECTRODOMÉSTICOS:**
  - Aire Acondicionado
  - Lavadora
  - Secadora
  - Cocina
  - Horno
  - Refrigeradora
  - Televisor
  - Microonda

- **TECNOLOGÍA:**
  - Casa Inteligente
  - Internet
  - Computadoras
  - Impresoras
  - TV

- **VEHÍCULOS:**
  - Lubricación
  - Batería
  - Cerrajería

- **CASAS COMERCIALES**
- **CHEF Y COMIDAS**

**Precios desde:** Cada servicio muestra "Desde $X.XX"

---

### **2. Sistema de Cotización en Tiempo Real**

**Flujo de Cotización:**
1. Usuario selecciona servicio (ej: "Instalar Aire Acondicionado")
2. Formulario dinámico con preguntas específicas:
   - ¿Qué necesitas? (Instalar, Mantenimiento, Revisión técnica)
   - ¿Qué marca es? (Dropdown)
   - ¿Necesitas que desinstalemos el A/C actual? (Sí/No)
   - ¿Existe punto eléctrico y/o cañerías? (Sí/No/No sé)
   - ¿A qué altura debe instalarse? (Opciones)
   - ¿Cuántos A/C necesitas instalar? (1, 2, 3, 4, 5+)
3. **Precio se calcula en tiempo real** según las respuestas
4. Muestra descuentos aplicados
5. Precio final visible antes de confirmar

**Ejemplo de Precio:**
- Precio Base: $49.00
- Servicio Inmediato: $10.00
- Adicionales: $30.00 (desinstalar A/C actual)
- **Total: $89.00**
- Descuentos: -$16.00
- **Total + IVA: $81.76**

---

### **3. Sistema de Programación de Citas**

**Características:**
- Muestra días disponibles en calendario
- Opciones: "Hoy", "Mañana", y días siguientes
- Formato: "Hoy aara", "Mañana Jueves 29 Oct.", etc.
- Cada día tiene flecha indicando que es seleccionable
- Permite programar o solicitar inmediatamente

---

### **4. Sistema de Profesionales (PAS)**

**PAS = Profesional Asociado de Servicio**

**Perfil del Profesional incluye:**
- **ID único:** "PAS 01-32"
- **Certificación:** Logo de certificación (AARGOS)
- **Foto y datos personales:**
  - Nombre completo
  - C.I. (Cédula de Identidad)
  - Edad
- **Métricas de rendimiento:**
  - Años de experiencia
  - Servicios brindados en AORA
  - Calificación (4.3/5)
- **Habilidades:** Lista de especialidades
- **Acerca de mí:** Descripción personal

**Ejemplo:**
- Alfredo Juan Bejar Tamayo
- C.I: 0988345178
- Edad: 40 años
- 18 Años de Experiencia
- 379 Servicios brindados en AORA
- 4.3/5 Calificación
- Habilidades:
  - Maestro de instalaciones eléctricas y luz
  - Maestro de gasfiteria y plomeria
  - Maestro de linea blanca y a/c

---

### **5. Sistema de Confirmación y Proformas**

**Resumen del Servicio:**
- Detalles del servicio solicitado
- Preguntas y respuestas del formulario
- Ubicación (múltiples direcciones guardadas)
- Detalle de pago desglosado:
  - SERVICIO (Precio Base, Servicio Inmediato, Subtotal)
  - ADICIONAL (Servicios extra, Subtotal)
  - TOTAL (Total, Descuentos, Total + IVA)

**Proformas:**
- Sistema de aprobación/rechazo
- Incluye materiales y repuestos
- Servicio de compra y despacho de material
- Total + IVA calculado

---

### **6. Sistema de Pagos**

- **Opciones:** Efectivo o tarjeta de crédito
- Integrado en el flujo de confirmación
- Muestra totales claramente

---

### **7. Características Adicionales**

- **Búsqueda:** "¿Qué Servicios Buscas?" con ejemplos
- **Promociones:** Banners promocionales (ej: "En el mes de Septiembre queremos premiarte con un bono")
- **Garantía:** "Un profesional certificado te brindará un servicio con garantía"
- **Disponibilidad:** "Disponibilidad garantizada"
- **Materiales:** "Y además nos encargamos de proveer todo lo que tu servicio necesita"

---

## 🔗 Cómo Debe Enlazarse con SumeePros

### **1. Flujo Cliente → Profesional**

**En SumeeClient:**
1. Cliente busca servicio
2. Cliente completa formulario de cotización
3. Sistema calcula precio en tiempo real
4. Cliente selecciona fecha/hora
5. Cliente confirma y paga
6. **Se crea un LEAD en Supabase**

**En SumeePros:**
1. Profesional ve el LEAD en su feed
2. Profesional puede ver:
   - Detalles del servicio
   - Formulario completado
   - Precio cotizado
   - Ubicación
   - Fecha/hora solicitada
3. Profesional acepta/rechaza
4. Si acepta, se asigna al profesional
5. Profesional puede ver materiales necesarios
6. Profesional puede crear proforma de materiales

---

### **2. Estructura de Datos Compartida**

**Tabla `leads` (ya existe):**
```sql
- id
- client_id (user_id del cliente)
- professional_id (asignado cuando acepta)
- service (nombre del servicio)
- service_category_id
- description
- status (nuevo, aceptado, en_progreso, completado)
- appointment_at (fecha/hora)
- location (JSON con dirección)
- price_quoted (precio cotizado)
- price_final (precio final)
- created_at
```

**Nueva tabla `service_quotes` (necesaria):**
```sql
- id
- lead_id
- service_category_id
- form_data (JSON con respuestas del formulario)
- base_price
- additional_services (JSON)
- immediate_service_fee
- discounts (JSON)
- subtotal
- total
- total_with_tax
- created_at
```

**Nueva tabla `service_materials` (necesaria):**
```sql
- id
- lead_id
- professional_id
- material_name
- quantity
- unit_price
- total_price
- purchase_service_fee
- status (pending, approved, purchased)
- created_at
```

---

### **3. Integración de Funcionalidades**

#### **A. Sistema de Cotización Dinámica**

**En SumeeClient:**
- Crear componente `ServiceQuoteForm`
- Cada categoría de servicio tiene su propio formulario
- Las preguntas determinan el precio
- Cálculo en tiempo real usando reglas de negocio

**En SumeePros:**
- Ver formulario completado en el LEAD
- Entender qué necesita el cliente
- Ver precio cotizado

#### **B. Sistema de Programación**

**En SumeeClient:**
- Calendario con días disponibles
- Horarios disponibles por día
- Integrado con calendario del profesional

**En SumeePros:**
- Ver citas programadas en su calendario
- Confirmar/ajustar horarios
- Ver disponibilidad

#### **C. Sistema de Materiales**

**En SumeeClient:**
- Ver materiales necesarios (si el profesional los propone)
- Aprobar/rechazar proforma de materiales
- Ver costo adicional

**En SumeePros:**
- Proponer materiales necesarios
- Crear proforma de materiales
- Ver aprobación del cliente

---

## 🎨 Mejoras UX/UI a Implementar

### **1. HomeScreen (SumeeClient)**
- ✅ Ya tenemos categorías (similar a AORA)
- ✅ Ya tenemos búsqueda
- ➕ Agregar: Precios "Desde $X" en cada categoría
- ➕ Agregar: Banner promocional más prominente

### **2. Pantalla de Servicio**
- ➕ Agregar: Formulario dinámico de cotización
- ➕ Agregar: Cálculo de precio en tiempo real
- ➕ Agregar: Selector de fecha/hora
- ➕ Agregar: Múltiples direcciones guardadas

### **3. Pantalla de Confirmación**
- ➕ Crear: Resumen completo del servicio
- ➕ Crear: Desglose de precios
- ➕ Crear: Selección de método de pago
- ➕ Crear: Botón de confirmar

### **4. Perfil de Profesional**
- ✅ Ya tenemos estructura básica
- ➕ Agregar: ID único (PAS equivalente)
- ➕ Agregar: Certificaciones
- ➕ Agregar: Años de experiencia
- ➕ Agregar: Servicios completados en Sumee
- ➕ Agregar: Habilidades/especialidades
- ➕ Agregar: "Acerca de mí"

---

## 📋 Plan de Implementación

### **Fase 1: Sistema de Cotización** (Prioridad Alta)
1. Crear `ServiceQuoteForm` component
2. Crear reglas de precios por categoría
3. Implementar cálculo en tiempo real
4. Guardar cotización en `service_quotes`

### **Fase 2: Sistema de Programación** (Prioridad Alta)
1. Integrar calendario en SumeeClient
2. Sincronizar con disponibilidad de profesionales
3. Permitir selección de fecha/hora
4. Crear LEAD con fecha/hora

### **Fase 3: Sistema de Materiales** (Prioridad Media)
1. Permitir a profesionales proponer materiales
2. Crear proforma de materiales
3. Sistema de aprobación del cliente
4. Integración con compra/despacho

### **Fase 4: Mejoras de Perfil** (Prioridad Media)
1. Mejorar perfil de profesional
2. Agregar métricas y certificaciones
3. Sistema de habilidades

### **Fase 5: Sistema de Pagos** (Prioridad Baja)
1. Integrar Stripe/PayPal
2. Procesar pagos
3. Confirmación de pago

---

## 🔄 Flujo Completo Cliente → Profesional

```
1. Cliente (SumeeClient)
   └─> Busca servicio
   └─> Completa formulario de cotización
   └─> Ve precio en tiempo real
   └─> Selecciona fecha/hora
   └─> Confirma y paga
   └─> Crea LEAD en Supabase

2. Supabase
   └─> LEAD creado con status "nuevo"
   └─> Notificación a profesionales disponibles

3. Profesional (SumeePros)
   └─> Ve LEAD en feed
   └─> Ve detalles completos (formulario, precio, fecha)
   └─> Acepta o rechaza
   └─> Si acepta: LEAD status → "aceptado"
   └─> Puede proponer materiales
   └─> Espera aprobación de materiales
   └─> Realiza servicio
   └─> Marca como completado

4. Cliente (SumeeClient)
   └─> Recibe notificación de aceptación
   └─> Ve perfil del profesional asignado
   └─> Aproba/rechaza materiales (si aplica)
   └─> Recibe servicio
   └─> Califica y paga
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Crear sistema de cotización dinámica**
2. **Integrar calendario de programación**
3. **Mejorar perfil de profesional**
4. **Crear pantalla de confirmación completa**
5. **Sincronizar LEADs entre apps**

---

**Fecha:** Enero 2025  
**Referencia:** AORA - Google Play Store

