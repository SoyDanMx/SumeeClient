# 🐛 Debug: Servicios y Profesionales No Cargan

## 🔍 Verificación Paso a Paso

### Paso 1: Revisar Logs en Consola

Abre la consola de Expo y busca estos logs:

```
[HomeScreen] 🚀 Loading categories...
[HomeScreen] ✅ Categories loaded: X

[HomeScreen] 🚀 Loading popular services...
[ServicesService] 🚀 Fetching popular services...
[ServicesService] ✅ Returning X popular services

[HomeScreen] 🚀 Loading featured professionals...
[ProfessionalsService] 🚀 Fetching featured professionals...
[ProfessionalsService] ✅ Found X professionals
```

**Si ves errores (❌), copia el mensaje completo.**

---

### Paso 2: Verificar Base de Datos

#### A. Verificar Servicios Populares

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar servicios con is_popular = true
SELECT 
    id,
    service_name,
    discipline,
    is_popular,
    is_active,
    min_price
FROM service_catalog
WHERE is_active = true
ORDER BY is_popular DESC NULLS LAST, min_price ASC
LIMIT 10;
```

**Si no hay servicios con `is_popular = true`:**
```sql
-- Marcar algunos servicios como populares
UPDATE service_catalog
SET is_popular = true
WHERE is_active = true
AND discipline IN ('electricidad', 'plomeria', 'aire-acondicionado')
LIMIT 5;
```

#### B. Verificar Profesionales

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar profesionales disponibles
SELECT 
    user_id,
    full_name,
    profession,
    role,
    user_type,
    calificacion_promedio,
    ubicacion_lat,
    ubicacion_lng
FROM profiles
WHERE role = 'profesional'
AND profession IS NOT NULL
AND profession != ''
AND user_type != 'client'
LIMIT 10;
```

**Si no hay profesionales:**
- Verifica que existan perfiles con `role = 'profesional'`
- Verifica que tengan `profession` lleno
- Verifica que `user_type != 'client'`

---

### Paso 3: Verificar Políticas RLS

#### A. Política para service_catalog

```sql
-- Verificar políticas RLS para service_catalog
SELECT 
    policyname,
    cmd,
    qual,
    roles
FROM pg_policies
WHERE tablename = 'service_catalog';
```

**Si no hay políticas o son restrictivas:**
```sql
-- Crear política permisiva para lectura (solo desarrollo)
CREATE POLICY "Allow public read service_catalog"
ON service_catalog FOR SELECT
TO public
USING (is_active = true);
```

#### B. Política para profiles

```sql
-- Verificar políticas RLS para profiles
SELECT 
    policyname,
    cmd,
    qual,
    roles
FROM pg_policies
WHERE tablename = 'profiles';
```

**Si no hay políticas o son restrictivas:**
```sql
-- Crear política para leer profesionales
CREATE POLICY "Allow read professionals"
ON profiles FOR SELECT
TO public
USING (
    role = 'profesional'
    AND profession IS NOT NULL
    AND profession != ''
    AND user_type != 'client'
);
```

---

### Paso 4: Verificar Variables de Entorno

Verifica que `.env` tenga:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

**Verificar en código:**
```typescript
// En lib/supabase.ts
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);
```

---

### Paso 5: Verificar Conexión a Supabase

Agrega este código temporal en `app/(tabs)/index.tsx`:

```typescript
useEffect(() => {
    async function testConnection() {
        try {
            const { data, error } = await supabase
                .from('service_catalog')
                .select('count')
                .limit(1);
            
            console.log('[Test] Supabase connection:', error ? '❌ FAILED' : '✅ OK');
            if (error) {
                console.error('[Test] Error:', error);
            }
        } catch (err) {
            console.error('[Test] Exception:', err);
        }
    }
    testConnection();
}, []);
```

---

## 🔧 Soluciones Comunes

### Problema 1: No hay servicios con is_popular = true

**Solución:**
```sql
-- Marcar servicios como populares
UPDATE service_catalog
SET is_popular = true
WHERE is_active = true
AND discipline IN ('electricidad', 'plomeria', 'aire-acondicionado', 'pintura', 'limpieza')
LIMIT 10;
```

### Problema 2: No hay profesionales en la BD

**Solución:**
- Verifica que existan perfiles con `role = 'profesional'`
- Si todos tienen `user_type = 'client'`, corrígelos:
```sql
UPDATE profiles
SET user_type = 'profesional', role = 'profesional'
WHERE profession IS NOT NULL
AND profession != ''
AND user_type = 'client';
```

### Problema 3: Políticas RLS muy restrictivas

**Solución:**
- Crea políticas permisivas para lectura pública (solo desarrollo)
- O verifica que el usuario esté autenticado correctamente

### Problema 4: Error de conexión a Supabase

**Solución:**
- Verifica variables de entorno
- Verifica que la URL y KEY sean correctas
- Verifica conexión a internet

---

## 📋 Checklist de Verificación

- [ ] Logs muestran que se están cargando los datos
- [ ] No hay errores en la consola
- [ ] Hay servicios con `is_popular = true` en la BD
- [ ] Hay profesionales con `role = 'profesional'` en la BD
- [ ] Las políticas RLS permiten lectura
- [ ] Las variables de entorno están configuradas
- [ ] La conexión a Supabase funciona

---

## 💡 Próximos Pasos

1. **Revisa los logs** en la consola de Expo
2. **Ejecuta las queries SQL** para verificar datos
3. **Comparte los resultados** para poder ayudarte mejor

Si después de estos pasos sigue sin funcionar, comparte:
- Los logs completos de la consola
- Los resultados de las queries SQL
- Cualquier error específico que veas

