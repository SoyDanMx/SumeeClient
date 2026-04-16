# 🚀 Propuesta de Vanguardia Tecnológica: Cancelar y Editar Servicio

**Fecha:** 2025-01-XX  
**Estado:** 📋 Propuesta

---

## 🔍 Análisis de la Interfaz Web

### **Lógica Actual en `Sumeeapp-B`:**

#### **1. Cancelar/Eliminar Servicio:**
```typescript
// Ubicación: src/app/dashboard/client/page.tsx
handleDeleteLead(lead: Lead) {
  // 1. Confirmación con window.confirm()
  // 2. DELETE directo de la BD
  // 3. Verifica cliente_id para seguridad
  // 4. Refresca lista después
  // 5. Cierra modal si estaba abierto
}
```

**Características:**
- ✅ Eliminación permanente (no soft delete)
- ✅ Confirmación antes de eliminar
- ✅ Verificación de permisos (RLS)
- ✅ Manejo de errores con mensajes claros
- ✅ Actualización automática de la lista

#### **2. Editar Servicio:**
```typescript
// Ubicación: src/app/dashboard/client/page.tsx
handleUpdateLead(leadId: string, data: LeadUpdatePayload) {
  // Campos editables:
  // - servicio_solicitado
  // - descripcion_proyecto
  // - ubicacion_direccion
  // - whatsapp
  // - photos_urls
  
  // Fallback a RPC si RLS falla:
  // - update_lead_details(lead_id, ...)
}
```

**Características:**
- ✅ Modal con formulario completo
- ✅ Validación de WhatsApp (10-15 dígitos)
- ✅ Subida de fotos al bucket `lead-photos`
- ✅ Formateo automático de WhatsApp
- ✅ Fallback a RPC para evitar problemas de RLS
- ✅ Actualización de `updated_at` automática

---

## 🎯 Propuesta de Vanguardia Tecnológica

### **Arquitectura Propuesta:**

```
┌─────────────────────────────────────────────────┐
│         Lead Detail Screen (Cliente)            │
├─────────────────────────────────────────────────┤
│  • Información del Servicio                     │
│  • Profesional Asignado                         │
│  • Ubicación                                    │
│  • Fechas                                       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │     Botones de Acción                   │   │
│  │  • Editar Servicio (Modal)              │   │
│  │  • Cancelar Servicio (Confirmación)     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### **1. Botón "Editar Servicio"**

#### **Modal de Edición (`EditLeadModal.tsx`):**

**Campos Editables:**
- ✅ Servicio (`servicio_solicitado`)
- ✅ Descripción (`descripcion_proyecto`)
- ✅ Ubicación (`ubicacion_direccion`)
- ✅ WhatsApp (`whatsapp`)
- ✅ Fotos (`photos_urls`) - Galería con subida/eliminación

**Características de Vanguardia:**

1. **Validación en Tiempo Real:**
   - Validación de WhatsApp mientras se escribe
   - Contador de caracteres para descripción
   - Indicadores visuales de campos requeridos

2. **Gestión de Fotos Avanzada:**
   - Subida múltiple (máximo 10 fotos)
   - Preview de fotos antes de subir
   - Eliminación individual con confirmación
   - Indicador de progreso de subida
   - Validación de tamaño (máximo 10MB por foto)

3. **UX Mejorada:**
   - Auto-guardado de borrador (opcional)
   - Indicador de cambios no guardados
   - Animaciones suaves
   - Feedback visual inmediato

4. **Manejo de Errores Robusto:**
   - Fallback a RPC si RLS falla
   - Reintentos automáticos
   - Mensajes de error claros y accionables

#### **Flujo de Edición:**

```
1. Usuario hace clic en "Editar Servicio"
   ↓
2. Se abre modal con datos actuales
   ↓
3. Usuario modifica campos
   ↓
4. Validación en tiempo real
   ↓
5. Usuario sube fotos (opcional)
   ↓
6. Usuario hace clic en "Guardar cambios"
   ↓
7. Validación final
   ↓
8. Actualización en BD (con fallback a RPC)
   ↓
9. Actualización de UI
   ↓
10. Cierre de modal
```

---

### **2. Botón "Cancelar Servicio"**

#### **Características de Vanguardia:**

1. **Confirmación Inteligente:**
   - Modal de confirmación con información del servicio
   - Advertencia si hay profesional asignado
   - Opción de razones de cancelación (opcional)

2. **Manejo de Estados:**
   - Si NO hay profesional asignado: Eliminación directa
   - Si HAY profesional asignado: 
     - Opción 1: Cambiar estado a 'cancelado' (soft delete)
     - Opción 2: Eliminación completa (hard delete)
   - Notificación al profesional (si está asignado)

3. **Sincronización:**
   - Actualización inmediata en app de profesionales
   - Notificación en tiempo real
   - Actualización de estadísticas

#### **Flujo de Cancelación:**

```
1. Usuario hace clic en "Cancelar Servicio"
   ↓
2. Modal de confirmación aparece
   ↓
3. Si hay profesional asignado:
   - Muestra advertencia
   - Opción de razón de cancelación
   ↓
4. Usuario confirma
   ↓
5. Si NO hay profesional:
   - DELETE directo de BD
   ↓
6. Si HAY profesional:
   - UPDATE status='cancelled' + estado='cancelado'
   - O DELETE (según preferencia)
   ↓
7. Notificación al profesional (si aplica)
   ↓
8. Actualización de UI
   ↓
9. Navegación a lista de solicitudes
```

---

## 🛠️ Implementación Técnica

### **1. Servicio de Leads (`services/leads.ts`):**

```typescript
export class LeadsService {
  // ... métodos existentes ...
  
  /**
   * Actualizar lead (con fallback a RPC)
   */
  static async updateLead(
    leadId: string,
    data: LeadUpdatePayload
  ): Promise<ClientLead | null> {
    // 1. Intentar UPDATE directo
    // 2. Si falla por RLS, usar RPC update_lead_details
    // 3. Retornar lead actualizado
  }
  
  /**
   * Cancelar/Eliminar lead
   */
  static async cancelLead(
    leadId: string,
    reason?: string
  ): Promise<void> {
    // 1. Verificar si hay profesional asignado
    // 2. Si NO hay: DELETE directo
    // 3. Si HAY: UPDATE status='cancelled' + estado='cancelado'
    // 4. Registrar evento en lead_events (si existe)
  }
}
```

### **2. Componente Modal de Edición (`components/EditLeadModal.tsx`):**

**Props:**
```typescript
interface EditLeadModalProps {
  lead: Lead;
  visible: boolean;
  onClose: () => void;
  onSave: (data: LeadUpdatePayload) => Promise<void>;
}
```

**Características:**
- Formulario con validación
- Gestión de fotos
- Indicadores de carga
- Manejo de errores

### **3. Componente Modal de Cancelación (`components/CancelLeadModal.tsx`):**

**Props:**
```typescript
interface CancelLeadModalProps {
  lead: Lead;
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
}
```

**Características:**
- Confirmación con información del servicio
- Advertencia si hay profesional
- Campo opcional de razón
- Indicadores de carga

---

## 📊 Campos Editables

| Campo | Tipo | Validación | Requerido |
|-------|------|------------|-----------|
| `servicio_solicitado` | string | Max 100 chars | ✅ Sí |
| `descripcion_proyecto` | string | Min 20, Max 500 chars | ✅ Sí |
| `ubicacion_direccion` | string | Min 10, Max 200 chars | ⚠️ Opcional |
| `whatsapp` | string | 10-15 dígitos, formato válido | ✅ Sí |
| `photos_urls` | string[] | Max 10 fotos, 10MB c/u | ⚠️ Opcional |

---

## 🔐 Seguridad y Permisos

### **RLS Policies Requeridas:**

1. **UPDATE en `leads`:**
   - Cliente solo puede actualizar sus propios leads
   - Solo si `status` es 'pending' o 'accepted'
   - No puede cambiar `professional_id` si ya está asignado

2. **DELETE en `leads`:**
   - Cliente solo puede eliminar sus propios leads
   - Solo si NO hay profesional asignado
   - O si `status` es 'pending'

3. **RPC `update_lead_details`:**
   - Ya existe en la BD
   - Verifica `cliente_id` automáticamente
   - SECURITY DEFINER para evitar problemas de RLS

---

## 🎨 Diseño UI/UX

### **Botones en Detalle de Solicitud:**

```
┌─────────────────────────────────────────┐
│  [Editar Servicio]  [Cancelar Servicio] │
│  (Azul/Primary)     (Rojo/Danger)       │
└─────────────────────────────────────────┘
```

**Estados:**
- **Normal:** Botones visibles y activos
- **Cargando:** Botones deshabilitados con spinner
- **Éxito:** Feedback visual (toast/alert)
- **Error:** Mensaje de error claro

### **Modal de Edición:**

- Header con gradiente (azul → morado)
- Formulario con campos organizados
- Sección de fotos con grid
- Botones: "Cancelar" (outline) y "Guardar cambios" (primary)

### **Modal de Cancelación:**

- Header rojo para advertencia
- Icono de alerta
- Información del servicio
- Campo de razón (opcional)
- Botones: "No, mantener" (outline) y "Sí, cancelar" (danger)

---

## 🔄 Sincronización con App de Profesionales

### **Cuando se Cancela:**

1. **Si NO hay profesional asignado:**
   - DELETE directo
   - No requiere notificación

2. **Si HAY profesional asignado:**
   - UPDATE `status='cancelled'` + `estado='cancelado'`
   - Notificación en tiempo real (Supabase Realtime)
   - El profesional ve el cambio inmediatamente
   - El lead desaparece de su lista de trabajos activos

### **Cuando se Edita:**

1. **Si NO hay profesional asignado:**
   - UPDATE directo
   - No requiere notificación

2. **Si HAY profesional asignado:**
   - UPDATE con notificación
   - El profesional recibe actualización en tiempo real
   - Puede ver los cambios en el detalle del trabajo

---

## 📈 Mejoras Futuras (Fase 2)

1. **Historial de Cambios:**
   - Tabla `lead_changes` para auditoría
   - Ver quién cambió qué y cuándo

2. **Versiones de Borrador:**
   - Guardar borradores automáticamente
   - Recuperar cambios no guardados

3. **Notificaciones Push:**
   - Notificar al profesional cuando se cancela
   - Notificar al profesional cuando se edita

4. **Razones de Cancelación:**
   - Dropdown con razones predefinidas
   - Análisis de razones más comunes

---

## ✅ Checklist de Implementación

### **Fase 1: Funcionalidad Básica**
- [ ] Crear `EditLeadModal.tsx`
- [ ] Crear `CancelLeadModal.tsx`
- [ ] Agregar métodos en `LeadsService`
- [ ] Integrar botones en `app/lead/[id].tsx`
- [ ] Validación de formularios
- [ ] Manejo de errores

### **Fase 2: Gestión de Fotos**
- [ ] Subida de fotos a `lead-photos` bucket
- [ ] Preview de fotos
- [ ] Eliminación de fotos
- [ ] Validación de tamaño

### **Fase 3: Sincronización**
- [ ] Notificaciones en tiempo real
- [ ] Actualización en app de profesionales
- [ ] Manejo de estados

### **Fase 4: Mejoras UX**
- [ ] Animaciones
- [ ] Feedback visual
- [ ] Indicadores de carga
- [ ] Mensajes de éxito/error

---

## 🎯 Resultado Esperado

**Experiencia del Cliente:**
- ✅ Puede editar todos los detalles del servicio
- ✅ Puede cancelar el servicio con confirmación
- ✅ Feedback claro en cada acción
- ✅ Sincronización inmediata con profesionales

**Experiencia del Profesional:**
- ✅ Recibe notificaciones en tiempo real
- ✅ Ve cambios inmediatamente
- ✅ Lead cancelado desaparece de su lista
- ✅ Lead editado se actualiza automáticamente

---

**¡Propuesta de vanguardia tecnológica lista para implementación! 🚀**

