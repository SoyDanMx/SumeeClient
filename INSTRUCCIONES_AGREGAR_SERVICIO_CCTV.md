# ✅ Instrucciones: Agregar Servicio CCTV - Kit de 4 Cámaras

**Fecha:** 2025-01-10  
**Servicio:** Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)  
**Precio:** $2,000 MXN

---

## 📋 INFORMACIÓN DEL SERVICIO

- **Nombre:** Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)
- **Disciplina:** `cctv`
- **Precio:** $2,000 MXN (fijo)
- **Tipo de precio:** `fixed`
- **Incluye materiales:** NO (únicamente mano de obra)
- **Estado:** Activo
- **Popular:** No (por defecto)

---

## 🚀 PASOS PARA AGREGAR EL SERVICIO

### **1. Ejecutar Script SQL en Supabase (Alinea todas las apps)**

**⚠️ IMPORTANTE:** Este script alinea el servicio entre **todas las apps** (SumeeClient, SumeePros, Sumeeapp-B) porque todas usan la misma tabla `service_catalog`.

1. Abre el **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `AGREGAR_SERVICIO_CCTV_KIT_4_CAMARAS.sql`
4. Ejecuta el script
5. Verifica que aparezca uno de estos mensajes:
   - `✅ Servicio CCTV "Kit de 4 Cámaras" creado exitosamente` (si no existía)
   - `✅ Servicio CCTV "Kit de 4 Cámaras" actualizado al nombre estándar` (si existía con otro nombre)

### **2. Verificar que se Creó Correctamente**

Ejecuta esta query en Supabase para verificar:

```sql
SELECT 
    id,
    service_name,
    discipline,
    min_price,
    price_type,
    is_active,
    includes_materials,
    description
FROM service_catalog
WHERE discipline = 'cctv'
AND is_active = true
ORDER BY min_price ASC;
```

**Resultado esperado:**
- ✅ 2 servicios de CCTV:
  1. Instalación de cámara de CCTV wifi - $800
  2. Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) - $2,000

### **3. Verificar en Todas las Apps**

#### **SumeeClient (App de Clientes):**
```bash
cd "/Users/danielnuno/Documents/Sumee-Universe/SumeeClient"
npx expo start --clear
```
- Navegar a categoría CCTV
- Deberías ver **2 servicios**

#### **SumeePros (App de Profesionales):**
```bash
cd "/Users/danielnuno/Sumee Pros/SumeePros"
npx expo start --clear
```
- Los servicios se cargan automáticamente desde `service_catalog`
- Debería aparecer el nuevo servicio

#### **Sumeeapp-B (Interfaz Web):**
- Reiniciar servidor de desarrollo
- El servicio debería aparecer con el nombre estándar alineado

**Servicios esperados en CCTV:**
- Instalación de cámara de CCTV wifi ($800)
- Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) ($2,000)

---

## 🔍 VERIFICACIÓN ADICIONAL

### **Query para Ver Todos los Servicios de CCTV:**

```sql
SELECT 
    service_name AS "Nombre del Servicio",
    min_price AS "Precio",
    price_type AS "Tipo de Precio",
    includes_materials AS "Incluye Materiales",
    is_active AS "Activo",
    is_popular AS "Popular"
FROM service_catalog
WHERE discipline = 'cctv'
ORDER BY min_price ASC;
```

### **Si el Servicio No Aparece en la App:**

1. **Verificar que `is_active = true`**
2. **Limpiar caché de la app:**
   ```bash
   rm -rf .expo node_modules/.cache
   npx expo start --clear
   ```
3. **Verificar logs en consola:**
   - Buscar: `[ServicesService]`
   - Verificar que la query trae 2 servicios

---

## 📝 NOTAS

- **Alineación Automática:** El script detecta y actualiza servicios existentes con nombres diferentes (ej: "Instalar Kit de 4 Cámaras" de Sumeeapp-B) al nombre estándar
- **Todas las Apps:** Como todas usan la misma tabla `service_catalog`, ejecutar el script una vez alinea para todas las apps
- **Sin Materiales:** `includes_materials = false` porque es "únicamente mano de obra, sin materiales"
- **Precio Fijo:** `price_type = 'fixed'` en $2,000 MXN garantiza consistencia
- **Popular:** `is_popular = false` por defecto, puedes cambiarlo a `true` si lo deseas
- **Contador:** `completed_count` inicia en 0

---

## 🎯 RESULTADO FINAL

Después de ejecutar el script, en la categoría **CCTV** deberías ver:

1. ✅ **Instalación de cámara de CCTV wifi** - $800
2. ✅ **Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)** - $2,000

---

*Script creado: 2025-01-10*
