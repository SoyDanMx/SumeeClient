# 🔄 Fix: Schema Cache de Supabase Desactualizado

## ✅ Verificación

Las columnas **SÍ existen** en la base de datos:
- ✅ `actual_service_name`
- ✅ `predicted_service_name`
- ✅ `actual_service_id`
- ✅ `predicted_service_id`
- ✅ `query`
- ✅ `query_embedding`
- ✅ `conversion`
- ✅ `features`

**El problema:** El schema cache de Supabase está desactualizado.

---

## 🔧 Soluciones

### **Opción 1: Esperar (Automático) ⏰**

El cache de Supabase se actualiza automáticamente cada **1-2 minutos**. 

**Solución:**
1. Espera 1-2 minutos
2. Reinicia la app
3. Prueba nuevamente

---

### **Opción 2: Forzar Actualización del Cache (Recomendado) 🚀**

Ejecuta este SQL en Supabase para forzar la actualización:

```sql
-- Forzar actualización del schema cache
NOTIFY pgrst, 'reload schema';
```

**Pasos:**
1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Ejecuta: `NOTIFY pgrst, 'reload schema';`
3. Espera 10-15 segundos
4. Reinicia la app

---

### **Opción 3: Reiniciar el Proyecto (Si las anteriores no funcionan)**

1. Ve a **Supabase Dashboard** > **Settings** > **General**
2. Busca la opción para **"Restart project"** o **"Refresh schema"**
3. Reinicia el proyecto (esto puede tomar unos minutos)

---

### **Opción 4: Verificar RLS Policies**

A veces el problema es con las políticas RLS. Verifica que existan:

```sql
-- Verificar políticas RLS de ml_interactions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'ml_interactions';
```

Si no hay políticas, créalas:

```sql
-- Crear políticas RLS si no existen
ALTER TABLE public.ml_interactions ENABLE ROW LEVEL SECURITY;

-- Política para INSERT (usuarios pueden insertar sus propias interacciones)
CREATE POLICY IF NOT EXISTS "Users can insert own interactions"
    ON public.ml_interactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para SELECT (usuarios pueden leer sus propias interacciones)
CREATE POLICY IF NOT EXISTS "Users can read own interactions"
    ON public.ml_interactions
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Política para UPDATE (usuarios pueden actualizar sus propias interacciones)
CREATE POLICY IF NOT EXISTS "Users can update own interactions"
    ON public.ml_interactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

---

## 🧪 Probar Después de la Solución

1. **Reinicia la app** (o espera 1-2 minutos)
2. **Prueba el tracking nuevamente:**
   - Usa el AISearchBar
   - Escribe una búsqueda
   - Verifica que no aparezca el error

3. **Verifica los logs:**
   - Deberías ver: `[MLTracking] ✅ Interaction tracked: [id]`
   - NO deberías ver: `Could not find the 'actual_service_name' column`

---

## 📊 Verificar que Funciona

Ejecuta esta consulta para verificar que se están insertando datos:

```sql
SELECT 
    id,
    query,
    predicted_service_name,
    actual_service_name,
    conversion,
    timestamp
FROM ml_interactions
ORDER BY timestamp DESC
LIMIT 5;
```

Si ves datos, significa que el tracking está funcionando correctamente.

---

## ✅ Solución Rápida (Recomendada)

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Forzar actualización del schema cache
NOTIFY pgrst, 'reload schema';
```

Luego espera 10-15 segundos y reinicia la app.

---

**¿El error persiste después de ejecutar `NOTIFY pgrst, 'reload schema';`?** 🔄

