# 🔍 Diagnóstico Completo: Profesionales No Aparecen

## 🐛 Problema Reportado

"Sigue sin funcionar" - Los profesionales destacados no aparecen.

---

## ✅ Correcciones Aplicadas

### **1. Problema de `gap` en Styles**
- ❌ **Antes:** `gap: 6` (no soportado en todas las versiones)
- ✅ **Ahora:** `marginRight: 6`, `marginLeft: 4` (compatible)

### **2. Vista Alineada con la Web**
- ✅ Lista vertical (no horizontal)
- ✅ Cards full-width
- ✅ Tags/skills como badges azules
- ✅ Botón WhatsApp verde

---

## 🔍 Pasos de Diagnóstico

### **Paso 1: Verificar Logs en Consola**

Cuando la app carga, busca estos logs:

```
[ProfessionalsService] 🚀 Fetching featured professionals...
[ProfessionalsService] 📍 User location: { userLat: X, userLng: Y }
[ProfessionalsService] 📊 Attempt 1: Query directa (role = "profesional")
```

**Si ves:**
- ✅ `Attempt X SUCCESS: Found N professionals` → Los datos están llegando
- ❌ `Attempt X ERROR: ...` → Hay un error en la query
- ⚠️ `No results` → No hay profesionales en la BD

### **Paso 2: Verificar Estado en HomeScreen**

Revisa el estado de `featuredProfessionals`:

```typescript
console.log('[HomeScreen] Featured professionals:', featuredProfessionals.length);
console.log('[HomeScreen] Loading:', loadingProfessionals);
```

### **Paso 3: Verificar Datos en Supabase**

Ejecuta esta query en Supabase:

```sql
-- Ver todos los profiles
SELECT 
    user_id,
    full_name,
    role,
    user_type,
    profession,
    calificacion_promedio,
    ubicacion_lat,
    ubicacion_lng
FROM profiles
LIMIT 10;
```

**Verificar:**
- ¿Hay profiles en la BD?
- ¿Algunos tienen `role = 'profesional'`?
- ¿Algunos tienen `profession` no nulo?

### **Paso 4: Verificar RLS (Row Level Security)**

Las políticas RLS pueden estar bloqueando las queries. Verifica en Supabase:

1. Ve a **Authentication > Policies**
2. Busca políticas para la tabla `profiles`
3. Verifica que permitan lectura para usuarios anónimos o autenticados

**Política mínima necesaria:**
```sql
CREATE POLICY "Allow read profiles"
ON profiles FOR SELECT
USING (true);
```

---

## 🚀 Solución Rápida

### **Si NO hay profesionales en la BD:**

Crea uno de prueba:

```sql
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

### **Si hay ERROR en la query:**

Revisa los logs detallados. El error mostrará:
- **Código de error** (ej: `42703` = columna no existe)
- **Mensaje** (qué columna falta)
- **Hint** (sugerencia de qué usar)

### **Si RLS está bloqueando:**

Crea o ajusta la política:

```sql
-- Permitir lectura pública de profiles
CREATE POLICY "Public read profiles"
ON profiles FOR SELECT
TO public
USING (true);
```

---

## 📋 Checklist de Verificación

- [ ] Expo reiniciado con `--clear`
- [ ] Logs revisados en consola
- [ ] `featuredProfessionals.length` verificado
- [ ] Query SQL ejecutada en Supabase
- [ ] RLS policies verificadas
- [ ] Al menos 1 profesional en la BD con `role='profesional'`

---

## 💡 Próximos Pasos

1. **Revisar logs:** ¿Qué intento funcionó? ¿Hay errores?
2. **Verificar datos:** ¿Hay profesionales en Supabase?
3. **Verificar RLS:** ¿Las políticas permiten lectura?
4. **Probar query directa:** Ejecutar la query en Supabase SQL Editor

---

**Si después de estos pasos sigue sin funcionar, comparte:**
- Los logs completos de la consola
- El resultado de la query SQL
- Cualquier error visible en la app

