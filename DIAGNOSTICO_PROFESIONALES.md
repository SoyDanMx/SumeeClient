# 🔍 Diagnóstico: Profesionales No Aparecen

## 🐛 Problema

La sección de "Profesionales Destacados" muestra "No hay profesionales disponibles en este momento".

---

## ✅ Solución Implementada

### **Estrategia de Múltiples Intentos**

El servicio ahora intenta **4 estrategias diferentes** en orden de prioridad:

#### **Intento 1: Query Simple (Como la Web)**
```typescript
.eq('role', 'profesional')
```
- **Más probable que funcione** (igual que la web)
- Sin filtros adicionales
- Limita a `limit * 3` resultados

#### **Intento 2: Buscar en user_type**
```typescript
.eq('user_type', 'profesional')
```
- Si `role` no funciona, intenta `user_type`
- Algunas bases de datos usan este campo

#### **Intento 3: Buscar por profession**
```typescript
.not('profession', 'is', null)
.not('profession', 'eq', '')
```
- Si no hay role/user_type, busca por profession
- Cualquier perfil con profession es considerado profesional

#### **Intento 4: Sin Filtros (Último Recurso)**
```typescript
// Sin filtros, obtener todos
// Filtrar manualmente después
```
- Obtiene todos los profiles
- Filtra manualmente por profession/role/user_type
- Último recurso si todo lo demás falla

---

## 📊 Logging Detallado

Cada intento registra:
- ✅ **SUCCESS**: Cuántos profesionales encontró
- ⚠️ **WARNING**: Si no encontró resultados o hubo error
- ❌ **ERROR**: Detalles del error si falló

**Ejemplo de logs:**
```
[ProfessionalsService] Fetching featured professionals...
[ProfessionalsService] Attempt 1: role = "profesional"
[ProfessionalsService] ✅ Attempt 1 SUCCESS: Found 15 professionals
[ProfessionalsService] Featured professionals: 10
```

---

## 🔧 Cómo Diagnosticar

### **1. Revisar Logs en Consola**

Cuando la app carga, busca estos logs en Metro:

```
[ProfessionalsService] Fetching featured professionals...
[ProfessionalsService] Attempt 1: role = "profesional"
```

**Si ves:**
- ✅ `Attempt X SUCCESS` → Ese intento funcionó
- ⚠️ `Attempt X: No results` → Ese intento no encontró datos
- ❌ `Attempt X error: ...` → Ese intento falló con error

### **2. Verificar Datos en Supabase**

Ejecuta estas queries en Supabase para diagnosticar:

#### **Query 1: Ver todos los profiles**
```sql
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    ubicacion_lat,
    ubicacion_lng
FROM profiles
LIMIT 10;
```

#### **Query 2: Buscar por role**
```sql
SELECT COUNT(*) as total
FROM profiles
WHERE role = 'profesional';
```

#### **Query 3: Buscar por user_type**
```sql
SELECT COUNT(*) as total
FROM profiles
WHERE user_type = 'profesional';
```

#### **Query 4: Buscar por profession**
```sql
SELECT COUNT(*) as total
FROM profiles
WHERE profession IS NOT NULL 
  AND profession != '';
```

#### **Query 5: Ver estructura de la tabla**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('role', 'user_type', 'profession')
ORDER BY column_name;
```

---

## 🎯 Posibles Causas

### **Causa 1: No hay profesionales en la BD**
**Solución:** Crear algunos profesionales de prueba

### **Causa 2: Campo `role` no existe o tiene otro nombre**
**Solución:** Verificar estructura de la tabla con Query 5

### **Causa 3: RLS (Row Level Security) bloqueando la query**
**Solución:** Verificar políticas RLS en Supabase

### **Causa 4: Los profesionales tienen `role` diferente**
**Solución:** Verificar valores reales con Query 1

---

## 🚀 Pasos para Resolver

### **Paso 1: Reiniciar Expo**
```bash
cd ~/Documents/Sumee-Universe/SumeeClient
npx expo start --clear
```

### **Paso 2: Revisar Logs**
- Abre la app
- Ve a la sección de profesionales destacados
- Revisa la consola de Metro
- Busca los logs de `[ProfessionalsService]`

### **Paso 3: Ejecutar Queries de Diagnóstico**
- Ve a Supabase Dashboard
- Ejecuta las queries de arriba
- Identifica qué intento debería funcionar

### **Paso 4: Ajustar Código si es Necesario**
- Si los logs muestran qué campo usar, podemos ajustar
- Si RLS está bloqueando, necesitamos ajustar políticas

---

## 📋 Checklist de Verificación

- [ ] Expo reiniciado con `--clear`
- [ ] Logs revisados en consola
- [ ] Query 1 ejecutada (ver todos los profiles)
- [ ] Query 2 ejecutada (contar por role)
- [ ] Query 3 ejecutada (contar por user_type)
- [ ] Query 4 ejecutada (contar por profession)
- [ ] Query 5 ejecutada (ver estructura)
- [ ] Identificado qué campo usar
- [ ] Profesionales aparecen en la app

---

## 💡 Solución Rápida (Si No Hay Profesionales)

Si no hay profesionales en la BD, puedes crear uno de prueba:

```sql
-- Crear profesional de prueba
INSERT INTO profiles (
    user_id,
    full_name,
    email,
    role,
    profession,
    calificacion_promedio,
    ubicacion_lat,
    ubicacion_lng,
    areas_servicio,
    whatsapp
) VALUES (
    gen_random_uuid(),
    'Profesional de Prueba',
    'test@example.com',
    'profesional',
    'Electricista',
    4.5,
    19.4326,
    -99.1332,
    ARRAY['Electricidad', 'Instalaciones'],
    '+5215512345678'
);
```

---

**Estado:** ✅ Código actualizado con múltiples estrategias. Requiere revisar logs para diagnosticar.

