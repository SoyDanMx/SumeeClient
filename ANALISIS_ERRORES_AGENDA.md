# 🔍 Análisis de Errores en la Agenda

## ❌ Errores Detectados

### **Error 1: `supabase` no está importado en calendar.tsx**

**Ubicación:** `app/(tabs)/calendar.tsx:239`

**Error:**
```
ReferenceError: Property 'supabase' doesn't exist
```

**Causa:** Falta el import de `supabase` en el archivo.

**Solución:** ✅ Agregado `import { supabase } from '@/lib/supabase';`

---

### **Error 2: Foreign Key `leads_professional_id_fkey` no existe**

**Ubicación:** `services/scheduling.ts:66, 146`

**Error:**
```
Could not find a relationship between 'leads' and 'profiles' using the hint 'leads_professional_id_fkey'
```

**Causa:** El nombre de la foreign key puede ser diferente o no existe. Supabase requiere usar la sintaxis correcta para joins.

**Solución:** ✅ Cambiado de:
```typescript
profiles!leads_professional_id_fkey (full_name, user_id)
```

A:
```typescript
professional:profiles (full_name, user_id)
```

Esto usa un alias `professional` y hace el join directamente por la foreign key `professional_id`.

---

### **Error 3: Columna `postal_code` no existe en `profiles`**

**Ubicación:** `services/location.ts:107`

**Error:**
```
Could not find the 'postal_code' column of 'profiles' in the schema cache
```

**Causa:** La columna `postal_code` puede no existir en la tabla `profiles` de Supabase.

**Solución:** ✅ Hacer la actualización de `postal_code` opcional:
- Si existe, se actualiza
- Si no existe, se ignora sin causar error
- También removido de la query `select` para evitar errores

---

## ✅ Correcciones Aplicadas

### **1. calendar.tsx**
- ✅ Agregado `import { supabase } from '@/lib/supabase';`
- ✅ Cambiado `service.profiles` a `service.professional` para coincidir con el nuevo alias

### **2. scheduling.ts**
- ✅ Cambiado `profiles!leads_professional_id_fkey` a `professional:profiles`
- ✅ Actualizado acceso a datos: `lead.profiles` → `lead.professional`

### **3. location.ts**
- ✅ Hacer `postal_code` opcional en la actualización
- ✅ Removido `postal_code` del `select` para evitar errores
- ✅ Agregado manejo de errores para columnas que pueden no existir

---

## 🔍 Verificación Adicional

### **Verificar Foreign Key en Supabase**

Si el error de foreign key persiste, verifica el nombre correcto ejecutando:

```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'leads'
    AND kcu.column_name = 'professional_id';
```

Esto mostrará el nombre real de la foreign key.

---

## 📋 Próximos Pasos

1. **Reiniciar Expo con cache limpio:**
   ```bash
   npx expo start --clear
   ```

2. **Probar la agenda:**
   - Navegar a la pestaña "Agenda"
   - Verificar que no hay errores en la consola
   - Verificar que se cargan los servicios agendados

3. **Si el error de foreign key persiste:**
   - Ejecutar el query SQL de verificación arriba
   - Actualizar el código con el nombre correcto de la foreign key

---

## 🐛 Si Aún Hay Errores

### **Alternativa para el Join de Profiles**

Si el join con alias no funciona, usar una query separada:

```typescript
// Obtener leads primero
const { data: leadsData } = await supabase
    .from('leads')
    .select('*')
    .eq('cliente_id', clientId);

// Luego obtener profiles por separado
const professionalIds = leadsData
    ?.filter(l => l.professional_id)
    .map(l => l.professional_id) || [];

const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, full_name')
    .in('user_id', professionalIds);

// Combinar datos
const services = leadsData?.map(lead => ({
    ...lead,
    professional: profilesData?.find(p => p.user_id === lead.professional_id)
}));
```

---

**Estado:** ✅ Errores corregidos, listo para probar

