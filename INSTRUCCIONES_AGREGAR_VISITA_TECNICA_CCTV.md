# ✅ Instrucciones: Agregar Servicio CCTV - Visita Técnica de Levantamiento

**Fecha:** 2025-01-10  
**Servicio:** Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)  
**Precio:** $600 MXN

---

## 📋 INFORMACIÓN DEL SERVICIO

- **Nombre:** Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)
- **Disciplina:** `cctv`
- **Precio:** $600 MXN (fijo)
- **Tipo de precio:** `fixed`
- **Incluye materiales:** NO (solo servicio de visita técnica)
- **Estado:** Activo
- **Popular:** No (por defecto)
- **Descripción:** Visita técnica profesional para levantamiento en sitio. Incluye evaluación del espacio, mediciones, planificación del proyecto y recomendaciones técnicas. Ideal para proyectos personalizados de más de 4 cámaras de seguridad CCTV.

---

## 🚀 PASOS PARA AGREGAR EL SERVICIO

### **1. Ejecutar Script SQL en Supabase**

**⚠️ IMPORTANTE:** Este script alinea el servicio entre **todas las apps** (SumeeClient, SumeePros, Sumeeapp-B) porque todas usan la misma tabla `service_catalog`.

1. Abre el **Supabase Dashboard**
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `AGREGAR_SERVICIO_CCTV_VISITA_TECNICA.sql`
4. Ejecuta el script
5. Verifica que aparezca uno de estos mensajes:
   - `✅ Servicio CCTV "Visita Técnica de Levantamiento" creado exitosamente` (si no existía)
   - `✅ Servicio CCTV "Visita Técnica de Levantamiento" actualizado al nombre estándar` (si existía con otro nombre)

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
- ✅ 3 servicios de CCTV (ordenados por precio):
  1. Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras) - $600
  2. Instalación de cámara de CCTV wifi - $800
  3. Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales) - $2,000

### **3. Verificar en Todas las Apps**

#### **SumeeClient (App de Clientes):**
```bash
cd "/Users/danielnuno/Documents/Sumee-Universe/SumeeClient"
npx expo start --clear
```
- Navegar a categoría CCTV
- Deberías ver **3 servicios** (ordenados por precio)

#### **SumeePros (App de Profesionales):**
```bash
cd "/Users/danielnuno/Sumee Pros/SumeePros"
npx expo start --clear
```
- Los servicios se cargan automáticamente desde `service_catalog`
- Debería aparecer el nuevo servicio

#### **Sumeeapp-B (Interfaz Web):**
- Reiniciar servidor de desarrollo
- El servicio debería aparecer en la categoría CCTV

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
   - Verificar que la query trae 3 servicios

---

## 📝 NOTAS

- **Alineación Automática:** El script detecta y actualiza servicios existentes con nombres diferentes al nombre estándar
- **Todas las Apps:** Como todas usan la misma tabla `service_catalog`, ejecutar el script una vez alinea para todas las apps
- **Sin Materiales:** `includes_materials = false` porque es solo un servicio de visita técnica (no incluye instalación ni materiales)
- **Precio Fijo:** `price_type = 'fixed'` en $600 MXN garantiza consistencia
- **Popular:** `is_popular = false` por defecto, puedes cambiarlo a `true` si lo deseas
- **Contador:** `completed_count` inicia en 0

---

## 🎯 RESULTADO FINAL

Después de ejecutar el script, en la categoría **CCTV** deberías ver:

1. ✅ **Visita Técnica de Levantamiento en Sitio (para proyectos personalizados de más de 4 cámaras)** - $600
2. ✅ **Instalación de cámara de CCTV wifi** - $800
3. ✅ **Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)** - $2,000

---

*Script creado: 2025-01-10*
