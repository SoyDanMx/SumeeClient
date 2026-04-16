# ✅ Solución: Timeout al Obtener Leads

**Fecha:** 2025-01-10  
**Problema:** Timeout al obtener leads del cliente (10 segundos)

---

## 🔴 PROBLEMA IDENTIFICADO

### **Error:**
```
ERROR [LeadsService] Error fetching leads: {
  "code": "UNKNOWN_ERROR",
  "message": "Timeout al obtener leads del cliente"
}
```

### **Causa:**
1. ⚠️ **Timeout muy corto:** 10 segundos puede no ser suficiente si hay muchos leads
2. ⚠️ **Tipo incorrecto en `withTimeout`:** Similar al problema en SumeePros, necesita cast
3. ⚠️ **Query puede ser lenta:** Si hay muchos leads o falta de índices

---

## ✅ CORRECCIONES APLICADAS

### **1. Aumentar Timeout** ✅

**Antes:**
```typescript
await withTimeout(query, 10000, 'Timeout al obtener leads del cliente');
```

**Después:**
```typescript
await withTimeout(query, 15000, 'Timeout al obtener leads del cliente');
```

**Razón:** 15 segundos da más margen para queries con muchos leads.

### **2. Corregir Tipo en `withTimeout`** ✅

**Antes:**
```typescript
const { data, error } = await withTimeout(query, 10000, '...');
// ❌ Error: Type 'PostgrestBuilder' no es asignable a Promise
```

**Después:**
```typescript
const { data, error } = await withTimeout(
    query as unknown as Promise<{ data: any; error: any }>,
    15000,
    'Timeout al obtener leads del cliente'
);
```

**Razón:** TypeScript necesita el cast para aceptar queries de Supabase.

### **3. Optimizar Query (Opcional)** ⚠️

Si el timeout persiste, considerar:

1. **Limitar resultados:**
   ```typescript
   .limit(100) // Limitar a 100 leads más recientes
   ```

2. **Agregar índices en Supabase:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_leads_cliente_id_updated_at 
   ON leads(cliente_id, updated_at DESC);
   ```

3. **Paginación:**
   - Cargar leads en páginas de 20-50
   - Cargar más cuando el usuario hace scroll

---

## 🔍 VERIFICACIONES

### **1. Revisar Logs:**

Después de la corrección, deberías ver:

**Si funciona:**
```
[LeadsService] Raw leads from DB (excluding cancelled): X
[LeadsService] Normalized leads: Y
[Projects] Leads loaded: Y
```

**Si aún hay timeout:**
```
[LeadsService] Error fetching leads: { code: "TIMEOUT", message: "..." }
```

### **2. Verificar Cantidad de Leads:**

```sql
-- Ver cuántos leads tiene el cliente
SELECT COUNT(*) FROM leads
WHERE cliente_id = 'TU_CLIENT_ID'
AND estado != 'cancelado'
AND status != 'cancelled';
```

Si hay muchos leads (>100), considerar:
- Limitar resultados
- Implementar paginación
- Agregar índices

### **3. Verificar Índices:**

```sql
-- Ver índices en tabla leads
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'leads'
AND indexdef LIKE '%cliente_id%';
```

Si no hay índice en `cliente_id`, crearlo:
```sql
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id 
ON leads(cliente_id);
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Correcciones aplicadas** - Timeout aumentado, tipo corregido
2. ⏳ **Reiniciar Expo** y probar
3. ⏳ **Revisar logs** para ver si el timeout persiste
4. ⏳ **Si persiste:** Considerar optimizaciones (límite, índices, paginación)

---

## 📋 CHECKLIST

- [x] Timeout aumentado de 10s a 15s
- [x] Tipo corregido en `withTimeout` con cast
- [x] Aplicado en `getClientLeads()` y `getLeadById()`
- [ ] Reiniciar Expo y probar
- [ ] Revisar logs para verificar que funciona
- [ ] Si persiste, considerar optimizaciones

---

*Solución aplicada: 2025-01-10*
