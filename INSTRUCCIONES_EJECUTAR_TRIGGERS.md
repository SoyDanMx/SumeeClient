# 📋 Instrucciones para Ejecutar los Triggers Completos

## 🎯 Objetivo

Sincronizar automáticamente todos los campos desde `professional_stats` (actualizado por SumeePros) a `profiles` (leído por SumeeClient).

---

## 📦 Archivo a Ejecutar

**`TRIGGERS_COMPLETOS_SINCRONIZACION.sql`**

---

## 🚀 Pasos para Ejecutar

### 1. Abrir Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**

### 2. Configurar URL de Supabase (IMPORTANTE)

Antes de ejecutar el script, necesitas reemplazar `YOUR_SUPABASE_URL` con tu URL real:

1. En Supabase Dashboard, ve a **Settings** → **API**
2. Copia tu **Project URL** (ejemplo: `abcdefghijklmnop.supabase.co`)
3. En el script SQL, busca `YOUR_SUPABASE_URL` y reemplázalo con tu URL

**Ejemplo:**
```sql
-- ANTES:
supabase_url := 'YOUR_SUPABASE_URL';

-- DESPUÉS:
supabase_url := 'abcdefghijklmnop.supabase.co';
```

### 3. Ejecutar el Script

1. Copia todo el contenido de `TRIGGERS_COMPLETOS_SINCRONIZACION.sql`
2. Pégalo en el SQL Editor de Supabase
3. Haz clic en **Run** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)

### 4. Verificar la Ejecución

El script debería ejecutarse sin errores. Verás mensajes como:

```
NOTICE: Avatar sincronizado: user_id=...
NOTICE: Migración de datos existentes completada
```

---

## ✅ Verificación Post-Ejecución

### 1. Verificar que los Triggers Están Activos

Ejecuta esta query en Supabase SQL Editor:

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'professional_stats'
  AND trigger_name LIKE 'sync%';
```

**Resultado esperado:**
```
trigger_name              | event_manipulation | event_object_table    | action_timing
--------------------------|-------------------|----------------------|---------------
sync_professional_trigger | INSERT            | professional_stats   | AFTER
sync_professional_trigger | UPDATE            | professional_stats   | AFTER
```

### 2. Verificar Sincronización de Datos

Ejecuta esta query para ver el estado de sincronización:

```sql
SELECT 
    p.user_id,
    p.full_name as profiles_name,
    ps.full_name as stats_name,
    p.avatar_url as profiles_avatar,
    ps.avatar_url as stats_avatar,
    CASE 
        WHEN p.avatar_url = ps.avatar_url THEN '✅ Sincronizado'
        ELSE '⚠️ Diferente'
    END as estado_avatar
FROM profiles p
LEFT JOIN professional_stats ps ON p.user_id = ps.user_id
WHERE ps.user_id IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 10;
```

**Resultado esperado:**
- Todos los registros deberían mostrar `✅ Sincronizado` para avatar
- Los nombres deberían coincidir entre `profiles` y `professional_stats`

### 3. Probar el Trigger (Opcional)

Para probar que el trigger funciona:

1. Actualiza un registro en `professional_stats`:

```sql
UPDATE professional_stats
SET avatar_url = 'test/path.jpg',
    updated_at = NOW()
WHERE user_id = 'TU_USER_ID_AQUI'
LIMIT 1;
```

2. Verifica que `profiles` se actualizó automáticamente:

```sql
SELECT 
    user_id,
    avatar_url,
    updated_at
FROM profiles
WHERE user_id = 'TU_USER_ID_AQUI';
```

**Resultado esperado:**
- `avatar_url` en `profiles` debería ser `'test/path.jpg'`
- `updated_at` debería ser el timestamp actual

---

## 🔧 Campos Sincronizados

El trigger sincroniza automáticamente:

| Campo Origen | Campo Destino | Prioridad |
|-------------|---------------|-----------|
| `avatar_url` | `avatar_url` | 🔴 CRÍTICA |
| `full_name` | `full_name` | 🟡 MEDIA |
| `specialty` | `profession` | 🟡 MEDIA |
| `expediente_data->>'certificaciones'` | `certificaciones_urls` | 🟡 MEDIA |
| `expediente_data->>'no_penales'` | `antecedentes_no_penales_url` | 🟡 MEDIA |
| `expediente_status` | `onboarding_status` | 🟢 BAJA |
| `average_rating` | `calificacion_promedio` | 🟢 BAJA |

---

## ⚠️ Solución de Problemas

### Error: "function build_storage_url does not exist"

**Causa:** La función auxiliar no se creó correctamente.

**Solución:** Ejecuta solo la PARTE 1 del script primero, luego el resto.

### Error: "column does not exist"

**Causa:** Alguna columna no existe en la tabla `profiles`.

**Solución:** Verifica que todas las columnas existen. Si falta alguna, créala primero:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certificaciones_urls TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS antecedentes_no_penales_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT;
```

### Los datos no se sincronizan

**Causa:** El trigger no se ejecuta o hay un error silencioso.

**Solución:**
1. Verifica que el trigger está activo (usar query de verificación)
2. Revisa los logs de Supabase para ver errores
3. Prueba actualizando manualmente un registro

### URL de Supabase incorrecta

**Causa:** `YOUR_SUPABASE_URL` no fue reemplazado.

**Solución:** 
1. Ve a Settings → API en Supabase
2. Copia tu Project URL
3. Reemplaza `YOUR_SUPABASE_URL` en el script
4. Ejecuta el script nuevamente

---

## 📝 Notas Importantes

1. **El trigger se ejecuta automáticamente** después de cada INSERT/UPDATE en `professional_stats`
2. **La migración de datos existentes** se ejecuta una sola vez al crear el trigger
3. **Los logs** (RAISE NOTICE) aparecen en los logs de Supabase, no en la consola
4. **Cache busting** se maneja automáticamente actualizando `updated_at`

---

## ✅ Checklist de Ejecución

- [ ] Abrí Supabase SQL Editor
- [ ] Reemplacé `YOUR_SUPABASE_URL` con mi URL real
- [ ] Ejecuté el script completo
- [ ] Verifiqué que no hay errores
- [ ] Verifiqué que los triggers están activos
- [ ] Verifiqué que los datos están sincronizados
- [ ] Probé actualizando un registro manualmente

---

## 🎉 Resultado Esperado

Después de ejecutar el script:

1. ✅ Los triggers están activos y funcionando
2. ✅ Los datos existentes están sincronizados
3. ✅ Futuros cambios en `professional_stats` se sincronizan automáticamente
4. ✅ SumeeClient puede leer datos actualizados de `profiles`

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de Supabase
2. Verifica que todas las columnas existen
3. Prueba ejecutando las queries de verificación
4. Revisa la documentación en `ARQUITECTURA_SINCRONIZACION_PERFILES.md`

