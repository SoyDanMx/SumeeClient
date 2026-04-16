# 🚀 Ejecutar Script para Agregar Todas las Disciplinas

## 📋 Instrucciones Paso a Paso

### **PASO 1: Abrir Supabase Dashboard**
1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve al menú lateral izquierdo
4. Haz clic en **"SQL Editor"**

### **PASO 2: Ejecutar el Script**
1. Haz clic en **"New Query"** (botón verde)
2. Abre el archivo `AGREGAR_DISCIPLINAS_COMPLETO.sql` en este proyecto
3. Copia **TODO** el contenido del archivo
4. Pégalo en el editor SQL de Supabase
5. Haz clic en **"Run"** (o presiona `Ctrl/Cmd + Enter`)

### **PASO 3: Verificar Resultado**
Después de ejecutar, deberías ver:
- ✅ Mensaje: "Success. No rows returned" o similar
- ✅ En la sección de resultados, verás las queries de verificación mostrando:
  - Disciplinas antes de agregar
  - Disciplinas después de agregar
  - Resumen final con estadísticas

### **PASO 4: Verificar en la App**
1. Reinicia la app: `npx expo start --clear`
2. Las categorías deberían aparecer en este orden:
   - **Fila 1:** Electricidad | Plomería | CCTV ✅
   - **Fila 2:** WiFi | Climatización | Armado ✅
   - **Fila 3:** Montaje | Tablaroca | Cargadores Eléctricos ✅
   - **Fila 4:** Paneles Solares | Limpieza | Pintura ✅
   - **Fila 5:** Jardinería | Carpintería | Arquitectos e Ingenieros ✅
   - **Fila 6:** Fumigación ✅

---

## ⚠️ Si Hay Errores

### **Error: "column does not exist"**
- Verifica que hayas ejecutado `SQL_EXTENDER_SERVICE_CATALOG.sql` primero
- Ese script agrega las columnas `is_popular`, `completed_count`, etc.

### **Error: "duplicate key"**
- El script usa `WHERE NOT EXISTS`, así que no debería crear duplicados
- Si aparece, significa que la disciplina ya existe (está bien)

### **Error: "permission denied"**
- Verifica que tengas permisos de escritura en la tabla `service_catalog`
- Contacta al administrador de Supabase si es necesario

---

## 📊 Qué Hace el Script

1. **Verifica disciplinas actuales** - Muestra qué disciplinas ya existen
2. **Crea servicios faltantes** - Agrega servicios para las 10 disciplinas faltantes:
   - cctv
   - wifi
   - tablaroca
   - cargadores-electricos
   - paneles-solares
   - pintura
   - jardineria
   - carpinteria
   - arquitectos-ingenieros
   - fumigacion
3. **Verifica resultado** - Muestra todas las disciplinas después de agregar
4. **Muestra resumen** - Estadísticas finales

---

## ✅ Después de Ejecutar

- Todas las disciplinas estarán disponibles en la app
- CCTV aparecerá en la posición correcta (Fila 1, columna 3)
- El orden será exactamente como lo solicitaste
- Los servicios tendrán precios fijos y estarán marcados como populares

