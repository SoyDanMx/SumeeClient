# 🐛 Debug: Profesionales Destacados No Cargan

**Fecha:** 2025-01-10  
**Problema:** La sección de profesionales destacados no carga en el home screen

---

## 🔍 CAMBIOS APLICADOS

### **1. Mejoras en `app/(tabs)/index.tsx`**

**Problema identificado:**
- El `useEffect` puede no ejecutarse correctamente si `currentLocation` cambia
- Falta de logs detallados para diagnóstico
- No hay manejo de timeout para asegurar ejecución

**Solución aplicada:**
- ✅ Agregado `setTimeout` para asegurar ejecución después del mount
- ✅ Logs detallados de diagnóstico
- ✅ Mejor manejo de errores con stack traces
- ✅ Logs del estado de loading

---

### **2. Mejoras en `services/professionals.ts`**

**Problema identificado:**
- El filtro en `processProfessionalsData` puede estar eliminando profesionales válidos
- Falta de logs para ver qué se está filtrando

**Solución aplicada:**
- ✅ Logs detallados de qué profesionales se filtran y por qué
- ✅ Validación de `hasProfession` agregada al filtro
- ✅ Logs de muestra de datos filtrados si no hay resultados

---

## 🧪 CÓMO VERIFICAR

### **1. Revisar logs en consola:**

Buscar estos logs cuando se carga el home:

```
[HomeScreen] 🔄 useEffect triggered for featured professionals
[HomeScreen] 🚀 Loading featured professionals...
[ProfessionalsService] 🚀 Fetching featured professionals...
[ProfessionalsService] 🔍 Processing X profiles...
[ProfessionalsService] 🔍 Filtered: X -> Y professionals
[HomeScreen] ✅ Professionals loaded: X (Xms)
```

### **2. Verificar qué se está filtrando:**

Si ves logs como:
```
[ProfessionalsService] ⚠️ Filtered out: { reason: 'no profession' }
```

Significa que hay profesionales sin `profession` en la BD.

### **3. Verificar datos en Supabase:**

```sql
-- Ver profesionales sin profession
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession
FROM profiles
WHERE (role IN ('profesional', 'professional', 'Profesional', 'Professional')
   OR user_type IN ('profesional', 'professional', 'Profesional', 'Professional'))
AND (profession IS NULL OR profession = '');
```

---

## 🔧 POSIBLES CAUSAS

### **1. No hay profesionales en la BD**
- **Verificar:** Ejecutar query SQL arriba
- **Solución:** Agregar profesionales o corregir datos existentes

### **2. Filtros demasiado restrictivos**
- **Verificar:** Ver logs de "Filtered out"
- **Solución:** Ajustar filtros en `processProfessionalsData`

### **3. Problema de RLS (Row Level Security)**
- **Verificar:** Ver errores en logs de Supabase
- **Solución:** Verificar políticas RLS en tabla `profiles`

### **4. Problema de ubicación**
- **Verificar:** Ver si `currentLocation` es null
- **Solución:** El código ahora funciona sin ubicación, pero puede afectar ordenamiento

---

## 📊 CHECKLIST DE DIAGNÓSTICO

- [ ] Verificar logs en consola al cargar home
- [ ] Verificar si `useEffect` se ejecuta (log: "🔄 useEffect triggered")
- [ ] Verificar si `getFeaturedProfessionals` se llama (log: "🚀 Fetching featured professionals")
- [ ] Verificar cuántos profiles se reciben de Supabase
- [ ] Verificar cuántos pasan el filtro
- [ ] Verificar si hay errores en la consola
- [ ] Verificar datos en Supabase directamente

---

## 🎯 PRÓXIMOS PASOS

1. **Ejecutar la app y revisar logs**
2. **Compartir logs de consola** para diagnóstico más preciso
3. **Verificar datos en Supabase** si los logs muestran 0 profesionales
4. **Ajustar filtros** si se están eliminando profesionales válidos

---

*Debug iniciado: 2025-01-10*
