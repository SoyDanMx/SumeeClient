# 🚀 Propuesta de Vanguardia Tecnológica: Detalle de Solicitud + Citas + Contratos

**Fecha:** 2025-01-XX  
**Estado:** 📋 Propuesta

---

## 🔍 Problema Identificado

1. **Error "Solicitud no encontrada":**
   - El join con `profiles` falla por foreign key incorrecta
   - La consulta no maneja correctamente los casos donde no hay profesional asignado
   - Posibles problemas de RLS (Row Level Security)

2. **Falta de funcionalidad:**
   - No hay sistema de agendamiento de citas
   - No hay sistema de contratos digitales
   - No está alineado con la app de profesionales

---

## ✅ Solución Propuesta: Sistema Integral de Vanguardia

### **Fase 1: Corrección del Detalle de Solicitud** 🔧

#### **1.1 Usar LeadsService**
```typescript
// En lugar de consulta directa, usar LeadsService
const lead = await LeadsService.getLeadById(id);
```

**Beneficios:**
- ✅ Normalización automática de estados
- ✅ Manejo robusto de errores
- ✅ Logging detallado

#### **1.2 Consulta Mejorada con Join Correcto**
```typescript
// Consulta sin foreign key específica (más robusta)
const { data, error } = await supabase
    .from('leads')
    .select(`
        *,
        professional:profiles!leads_professional_id_fkey (
            full_name,
            whatsapp,
            phone,
            profession,
            calificacion_promedio,
            avatar_url
        )
    `)
    .eq('id', id)
    .single();

// Fallback: Si el join falla, obtener profesional por separado
if (data?.professional_id && !data.professional) {
    const { data: profData } = await supabase
        .from('profiles')
        .select('full_name, whatsapp, phone, profession, calificacion_promedio, avatar_url')
        .eq('user_id', data.professional_id)
        .single();
    
    data.professional = profData;
}
```

---

### **Fase 2: Sistema de Agendamiento de Citas** 📅

#### **2.1 Componente `AppointmentScheduler`**

**Características:**
- ✅ Visualización de citas propuestas por el profesional
- ✅ Aceptar/Rechazar/Proponer nueva fecha
- ✅ Calendario interactivo
- ✅ Notificaciones de recordatorio

**Flujo:**
```
Profesional propone cita → Cliente recibe notificación
    ↓
Cliente ve propuesta en detalle de solicitud
    ↓
Cliente puede:
  • Aceptar cita
  • Rechazar y proponer nueva fecha
  • Ver calendario del profesional
    ↓
Cita confirmada → Notificación a ambos
```

#### **2.2 Integración con `appointments` Table**

```typescript
interface Appointment {
    id: string;
    job_id: string;
    professional_id: string;
    client_id: string;
    scheduled_date: string;
    scheduled_time: string;
    duration: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    confirmed_at?: string;
    cancelled_at?: string;
}
```

**Servicio:**
```typescript
class AppointmentService {
    // Obtener citas de un lead
    static async getLeadAppointments(leadId: string): Promise<Appointment[]>
    
    // Confirmar cita propuesta
    static async confirmAppointment(appointmentId: string): Promise<boolean>
    
    // Proponer nueva fecha
    static async proposeNewDate(appointmentId: string, newDateTime: string): Promise<boolean>
    
    // Cancelar cita
    static async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean>
}
```

---

### **Fase 3: Sistema de Contratos Digitales** 📝

#### **3.1 Componente `ContractViewer`**

**Características:**
- ✅ Visualización del contrato generado
- ✅ Firma digital con canvas
- ✅ Verificación de integridad (hash)
- ✅ Descarga de PDF
- ✅ Historial de versiones

**Flujo:**
```
Profesional genera contrato → Cliente recibe notificación
    ↓
Cliente ve contrato en detalle de solicitud
    ↓
Cliente puede:
  • Leer términos y condiciones
  • Firmar digitalmente
  • Ver firma del profesional
  • Descargar PDF firmado
    ↓
Contrato completado → Ambos reciben PDF
```

#### **3.2 Integración con `job_contracts` Table**

```typescript
interface JobContract {
    id: string;
    job_id: string;
    contract_text: string;
    agreed_price: number;
    agreed_scope: string;
    terms_and_conditions?: string;
    
    // Firma profesional
    professional_signature_url?: string;
    professional_signature_hash?: string;
    professional_signed_at?: string;
    
    // Firma cliente
    client_signature_url?: string;
    client_signature_hash?: string;
    client_signed_at?: string;
    
    status: 'pending' | 'professional_signed' | 'client_signed' | 'completed' | 'cancelled';
    contract_pdf_url?: string;
}
```

**Servicio:**
```typescript
class ContractService {
    // Obtener contrato de un lead
    static async getLeadContract(leadId: string): Promise<JobContract | null>
    
    // Firmar contrato como cliente
    static async signContractAsClient(
        contractId: string, 
        signatureDataUrl: string,
        location?: { lat: number; lng: number; address: string }
    ): Promise<boolean>
    
    // Descargar PDF del contrato
    static async downloadContractPDF(contractId: string): Promise<string>
}
```

---

### **Fase 4: UI/UX de Vanguardia** 🎨

#### **4.1 Pantalla de Detalle Mejorada**

**Secciones:**
1. **Header con Mapa** (similar a SumeePros)
   - Mapa con ubicación del servicio
   - Badge de precio
   - Estado del lead

2. **Información del Servicio**
   - Descripción detallada
   - Fotos del proyecto
   - Precio acordado

3. **Profesional Asignado**
   - Perfil completo
   - Calificación
   - Botón de contacto

4. **Citas/Agendamiento** (NUEVO)
   - Lista de citas propuestas
   - Calendario interactivo
   - Botones: Aceptar/Rechazar/Proponer

5. **Contrato Digital** (NUEVO)
   - Vista previa del contrato
   - Botón de firma
   - Estado de firmas (profesional/cliente)

6. **Chat Integrado** (FUTURO)
   - Mensajería en tiempo real
   - Historial de conversación

#### **4.2 Estados Visuales**

```typescript
const getLeadStatusFlow = (lead: Lead) => {
    if (lead.status === 'pending') {
        return {
            stage: 'Esperando profesional',
            actions: ['Ver profesionales disponibles'],
        };
    }
    
    if (lead.status === 'accepted') {
        const hasAppointment = lead.appointment_status === 'confirmed';
        const hasContract = lead.contract_status === 'completed';
        
        return {
            stage: hasContract 
                ? 'Contrato firmado - Listo para iniciar'
                : hasAppointment 
                    ? 'Cita confirmada - Pendiente contrato'
                    : 'Profesional asignado - Pendiente cita',
            actions: [
                !hasAppointment && 'Agendar cita',
                !hasContract && 'Firmar contrato',
                'Contactar profesional',
            ].filter(Boolean),
        };
    }
    
    if (lead.status === 'completed') {
        return {
            stage: 'Servicio completado',
            actions: ['Calificar servicio', 'Ver detalles'],
        };
    }
};
```

---

## 📊 Arquitectura de Vanguardia

### **Stack Tecnológico:**

1. **Real-time Subscriptions:**
   - Supabase Realtime para actualizaciones automáticas
   - Notificaciones push para citas y contratos

2. **Firma Digital:**
   - Canvas API para captura de firma
   - SHA-256 para verificación de integridad
   - PDF generation con react-pdf

3. **Calendario:**
   - react-native-calendars para UI
   - Integración con sistema de disponibilidad

4. **Mapas:**
   - Mapbox para visualización
   - Geocoding para direcciones

---

## 🎯 Flujo Completo Propuesto

```
Cliente abre detalle de solicitud
    ↓
Sistema carga:
  • Lead completo (con LeadsService)
  • Perfil del profesional (si está asignado)
  • Citas propuestas/confirmadas
  • Contrato (si existe)
    ↓
Cliente ve estado actual:
  • Si pending → "Esperando profesional"
  • Si accepted → Muestra acciones disponibles:
      - Agendar cita (si no hay)
      - Firmar contrato (si no está firmado)
      - Contactar profesional
    ↓
Cliente interactúa:
  • Acepta cita propuesta → Cita confirmada
  • Firma contrato → Contrato completado
  • Contacta profesional → WhatsApp/Chat
    ↓
Sistema actualiza en tiempo real:
  • Notificaciones a ambos
  • Cambios reflejados automáticamente
```

---

## 📝 Archivos a Crear/Modificar

### **Nuevos:**
- ✅ `services/appointments.ts` - Servicio de citas
- ✅ `services/contracts.ts` - Servicio de contratos
- ✅ `components/AppointmentScheduler.tsx` - Componente de citas
- ✅ `components/ContractViewer.tsx` - Componente de contratos
- ✅ `components/DigitalSignatureCanvas.tsx` - Canvas de firma
- ✅ `app/lead/[id].tsx` - Actualizado con nuevas funcionalidades

### **Modificados:**
- ✅ `app/lead/[id].tsx` - Usar LeadsService y agregar secciones nuevas
- ✅ `services/leads.ts` - Agregar método para obtener lead con relaciones

---

## 🚀 Implementación por Fases

### **Fase 1: Corrección Inmediata** (Prioridad Alta)
1. Corregir consulta del lead
2. Usar LeadsService
3. Manejar casos sin profesional

### **Fase 2: Sistema de Citas** (Prioridad Media)
1. Crear AppointmentService
2. Crear AppointmentScheduler component
3. Integrar en detalle de lead

### **Fase 3: Sistema de Contratos** (Prioridad Media)
1. Crear ContractService
2. Crear ContractViewer component
3. Integrar firma digital

### **Fase 4: Mejoras UX** (Prioridad Baja)
1. Chat integrado
2. Notificaciones push
3. Optimizaciones de performance

---

## ✅ Beneficios de la Solución

1. **Alineación con App de Profesionales:**
   - Misma estructura de datos
   - Mismos flujos de trabajo
   - Consistencia en UX

2. **Experiencia de Usuario Mejorada:**
   - Todo en un solo lugar
   - Actualizaciones en tiempo real
   - Proceso claro y guiado

3. **Seguridad y Legalidad:**
   - Contratos digitales firmados
   - Verificación de integridad
   - Historial completo

4. **Escalabilidad:**
   - Código modular
   - Fácil agregar nuevas funcionalidades
   - Separación de responsabilidades

---

**¡Propuesta de vanguardia tecnológica lista para implementar! 🚀**

