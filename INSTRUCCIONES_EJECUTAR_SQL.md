# 🚀 Instrucciones para Ejecutar SQL en Supabase

## 📋 Archivo SQL
- **Archivo:** `SQL_EXTENDER_SERVICE_CATALOG.sql`
- **Tamaño:** ~189 líneas
- **Objetivo:** Extender `service_catalog` con campos de vanguardia

---

## ✅ Método 1: Ejecutar en Supabase SQL Editor (RECOMENDADO)

### **Paso 1: Abrir Supabase Dashboard**
1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **Sumee App**

### **Paso 2: Abrir SQL Editor**
1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en el botón **"New query"** (o usa una query existente)

### **Paso 3: Copiar y Ejecutar el Script**
1. Abre el archivo: `SQL_EXTENDER_SERVICE_CATALOG.sql`
2. **Copia TODO el contenido** (Cmd+A, Cmd+C / Ctrl+A, Ctrl+C)
3. Pega el contenido en el editor SQL de Supabase
4. Haz clic en el botón **"Run"** (o presiona `Cmd+Enter` / `Ctrl+Enter`)

### **Paso 4: Verificar Resultados**
El script incluye queries de verificación al final. Deberías ver:
- ✅ Servicios populares marcados
- ✅ Servicios agrupados por categoría
- ✅ Índices creados

---

## ✅ Método 2: Ejecutar con psql (Si tienes credenciales)

### **Requisitos:**
- `psql` instalado (viene con PostgreSQL)
- Password de la base de datos de Supabase

### **Paso 1: Obtener Password**
1. Ve a: https://supabase.com/dashboard/project/[TU_PROJECT_REF]/settings/database
2. Busca "Database Password" o "Connection String"
3. Copia la contraseña

### **Paso 2: Ejecutar**
```bash
cd ~/Documents/Sumee-Universe/SumeeClient

# Reemplaza [PASSWORD] y [PROJECT_REF] con tus valores
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" \
  -f SQL_EXTENDER_SERVICE_CATALOG.sql
```

---

## 📊 Qué Hace el Script

### **1. Agrega Columnas Nuevas:**
- `service_type` (express/pro)
- `is_popular` (boolean)
- `category_group` (mantenimiento/tecnologia/especializado/construccion)
- `completed_count` (integer)
- `badge_tags` (array de texto)
- `hero_image_url` (text)
- `display_order` (integer)

### **2. Crea Índices:**
- Índice para `is_popular`
- Índice para `category_group`
- Índice para `service_type`
- Índice para `display_order`

### **3. Migra Datos:**
- Marca servicios populares (Plomería, Electricidad, Aire Acondicionado)
- Asigna `category_group` según disciplina
- Asigna `service_type` según disciplina
- Asigna `badge_tags` según tipo
- Calcula `display_order` por precio

### **4. Verifica:**
- Muestra servicios populares
- Muestra servicios por grupo
- Muestra índices creados

---

## ⚠️ Notas Importantes

1. **El script es seguro:** Usa `IF NOT EXISTS` y `IF EXISTS` para evitar errores
2. **No elimina datos:** Solo agrega columnas y actualiza valores
3. **Puede ejecutarse múltiples veces:** Es idempotente
4. **Tiempo estimado:** ~10-30 segundos

---

## ✅ Verificación Post-Ejecución

Después de ejecutar, verifica que todo funcionó:

```sql
-- Verificar que las columnas existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_catalog' 
AND column_name IN ('service_type', 'is_popular', 'category_group');

-- Verificar servicios populares
SELECT COUNT(*) as total_populares
FROM service_catalog 
WHERE is_popular = true;

-- Verificar servicios por grupo
SELECT category_group, COUNT(*) as total
FROM service_catalog
WHERE category_group IS NOT NULL
GROUP BY category_group;
```

---

## 🐛 Si Hay Errores

### **Error: "column already exists"**
- ✅ Normal, significa que ya se ejecutó antes
- El script usa `IF NOT EXISTS`, así que es seguro

### **Error: "syntax error"**
- Verifica que copiaste TODO el contenido
- Asegúrate de no tener caracteres extraños

### **Error: "permission denied"**
- Verifica que tienes permisos de administrador en Supabase
- Usa el usuario `postgres` o un usuario con permisos

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los mensajes de error en Supabase
2. Verifica que el proyecto de Supabase sea el correcto
3. Asegúrate de tener permisos de administrador

---

**¡Listo!** Después de ejecutar el SQL, la app cliente podrá usar todos los nuevos campos.

