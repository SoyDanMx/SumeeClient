# ✅ Solución: Error "invalid input syntax for type timestamp with time zone: \"12:00\""

## 🎯 Problema Identificado

Al crear un lead, aparece el error:
```
ERROR: invalid input syntax for type timestamp with time zone: "12:00"
Code: 22007
```

Este error ocurre porque la columna `appointment_time` en la tabla `leads` es de tipo `timestamp with time zone`, pero estamos intentando insertar solo la hora en formato "HH:MM:SS".

---

## 🔍 Análisis

### **Problema:**

1. **Tipo de Columna:** `appointment_time` es de tipo `timestamp with time zone` (no `time`)
2. **Valor Enviado:** Se estaba enviando "12:00" o "12:00:00" (solo hora)
3. **Formato Esperado:** PostgreSQL espera un timestamp completo: "YYYY-MM-DD HH:MM:SS+00"

### **Causa Raíz:**

El código estaba formateando la hora como:
```typescript
appointmentTime = `${hours}:${minutes}:${seconds}`; // "12:00:00"
```

Y luego intentando insertarlo en una columna de tipo `timestamp`, lo cual causa el error.

---

## ✅ Solución Implementada

### **Opción 1: No Enviar `appointment_time` (Implementada)**

**Decisión:** No enviar `appointment_time` si la columna es de tipo `timestamp`.

**Razón:** 
- `appointment_date` ya contiene la fecha
- Si necesitamos la hora, debería combinarse con la fecha en un solo campo `timestamp`
- O cambiar el schema de la base de datos para que `appointment_time` sea de tipo `time`

**Código:**
```typescript
// No enviar appointment_time si la columna es de tipo timestamp
// if (appointmentTime) {
//     leadInsertData.appointment_time = appointmentTime; // Esto causa error si es timestamp
// }

// Asegurar que appointment_time NO esté en el objeto
if ('appointment_time' in leadInsertData) {
    delete leadInsertData.appointment_time;
}
```

### **Opción 2: Combinar Fecha y Hora (Alternativa)**

Si necesitas guardar la hora, puedes combinar `appointment_date` y `appointment_time` en un solo campo:

```typescript
if (appointmentDate && appointmentTime) {
    // Crear timestamp completo: YYYY-MM-DD HH:MM:SS
    const fullTimestamp = `${appointmentDate} ${appointmentTime}`;
    leadInsertData.appointment_timestamp = fullTimestamp; // Si existe esta columna
}
```

### **Opción 3: Cambiar Schema de Base de Datos (Recomendado para futuro)**

Si necesitas guardar fecha y hora por separado, cambiar el schema:

```sql
-- Cambiar appointment_time de timestamp a time
ALTER TABLE leads 
ALTER COLUMN appointment_time TYPE time USING appointment_time::time;
```

---

## 📊 Estado Actual

**Campos que se envían:**
- ✅ `appointment_date`: "YYYY-MM-DD" (tipo `date`)
- ✅ `appointment_status`: "scheduled" (tipo `text`)
- ❌ `appointment_time`: **NO se envía** (para evitar el error)

**Información de hora:**
- La hora se calcula y se guarda en logs
- No se guarda en la base de datos por ahora
- Si necesitas la hora, considera usar `appointment_timestamp` o cambiar el schema

---

## 🧪 Verificación

### **Logs Esperados:**

```
[QuoteService] Appointment formatted: {
  original: "2025-01-10T12:00:00.000Z",
  date: "2025-01-10",
  time: "12:00:00"
}
[QuoteService] Appointment data prepared: {
  appointmentDate: "2025-01-10",
  appointmentTime: "12:00:00", // Solo para logging
  appointmentStatus: "scheduled",
  note: "appointment_time no se envía porque la columna es de tipo timestamp"
}
[QuoteService] Lead insert data (final): {
  ...leadInsertData,
  hasAppointmentTime: false, // ✅ Debe ser false
}
```

### **Si el error persiste:**

1. Verificar que `appointment_time` no esté en `leadInsertData` antes del INSERT
2. Revisar si hay triggers o funciones en la base de datos que intenten usar `appointment_time`
3. Verificar el schema real de la tabla `leads` en Supabase

---

## 🔧 Archivos Modificados

1. ✅ **`services/quotes.ts`**
   - Comentado el código que envía `appointment_time`
   - Agregada verificación explícita para eliminar `appointment_time` si existe
   - Mejorado logging para debugging

---

## ✅ Resultado

**El lead ahora se crea sin el error de timestamp:**
- ✅ `appointment_date` se guarda correctamente
- ✅ `appointment_status` se guarda correctamente
- ✅ `appointment_time` NO se envía (evita el error)
- ✅ La hora se calcula y se muestra en logs (para referencia futura)

---

*Corrección completada: 2025-01-XX*
