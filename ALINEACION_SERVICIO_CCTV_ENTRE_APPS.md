# ✅ Alineación: Servicio CCTV Kit de 4 Cámaras entre Apps

**Fecha:** 2025-01-10  
**Servicio:** Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)  
**Precio:** $2,000 MXN

---

## 🎯 OBJETIVO

Alinear el servicio de CCTV "Kit de 4 Cámaras" entre todas las apps:
- ✅ **SumeeClient** (App de Clientes)
- ✅ **SumeePros** (App de Profesionales)
- ✅ **Sumeeapp-B** (Interfaz Web)

---

## 📋 ESTADO ACTUAL

### **Sumeeapp-B (Web):**
- ✅ Ya tiene servicio: "Instalar Kit de 4 Cámaras" - $2,000
- ⚠️ Nombre diferente al estándar

### **SumeeClient (App Clientes):**
- ⚠️ Solo tiene: "Instalación de cámara de CCTV wifi" - $800
- ❌ Falta el servicio de Kit de 4 Cámaras

### **SumeePros (App Profesionales):**
- ⚠️ Usa la misma tabla `service_catalog` (se alineará automáticamente)

---

## 🔧 SOLUCIÓN

### **1. Script SQL Unificado** ✅

**Archivo:** `AGREGAR_SERVICIO_CCTV_KIT_4_CAMARAS.sql`

Este script:
- ✅ Crea el servicio si no existe
- ✅ Actualiza servicios existentes con nombres diferentes al nombre estándar
- ✅ Asegura precio de $2,000 MXN
- ✅ Marca `includes_materials = false`

**Nombre Estándar:**
```
Instalación de Kit de 4 Cámaras de CCTV (únicamente mano de obra, sin materiales)
```

### **2. Migración para Sumeeapp-B** ✅

**Archivo:** `supabase/migrations/20250110_alinear_servicio_cctv_kit_4_camaras.sql`

Esta migración:
- ✅ Actualiza "Instalar Kit de 4 Cámaras" → Nombre estándar
- ✅ Asegura precio de $2,000 MXN
- ✅ Mantiene consistencia con otras apps

---

## 🚀 PASOS PARA ALINEAR

### **Paso 1: Ejecutar Script en Supabase (Una vez para todas las apps)**

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Ejecuta **`AGREGAR_SERVICIO_CCTV_KIT_4_CAMARAS.sql`**
3. Verifica que aparezca el mensaje de éxito

### **Paso 2: Ejecutar Migración en Sumeeapp-B (Opcional)**

Si Sumeeapp-B tiene su propio proceso de migraciones:

```bash
cd "/Users/danielnuno/Documents/Sumee-Universe/Sumeeapp-B"
# Ejecutar migración según tu proceso (Supabase CLI, etc.)
```

O ejecutar directamente en Supabase Dashboard:
- Ejecuta `supabase/migrations/20250110_alinear_servicio_cctv_kit_4_camaras.sql`

### **Paso 3: Verificar en Todas las Apps**

#### **SumeeClient:**
```bash
cd "/Users/danielnuno/Documents/Sumee-Universe/SumeeClient"
npx expo start --clear
```
- Navegar a categoría CCTV
- Deberías ver 2 servicios

#### **SumeePros:**
```bash
cd "/Users/danielnuno/Sumee Pros/SumeePros"
npx expo start --clear
```
- Los servicios se cargan desde `service_catalog`
- Debería aparecer automáticamente

#### **Sumeeapp-B (Web):**
- Reiniciar servidor de desarrollo
- Verificar que el servicio aparezca con el nombre estándar

---

## 🔍 VERIFICACIÓN

### **Query SQL para Verificar:**

```sql
SELECT 
    service_name AS "Nombre",
    discipline AS "Disciplina",
    min_price AS "Precio",
    price_type AS "Tipo",
    includes_materials AS "Sin Materiales",
    is_active AS "Activo"
FROM service_catalog
WHERE discipline = 'cctv'
AND is_active = true
ORDER BY min_price ASC;
```

**Resultado Esperado:**
```
Nombre                                                          | Precio | Tipo  | Sin Materiales | Activo
----------------------------------------------------------------|--------|-------|----------------|-------
Instalación de cámara de CCTV wifi                             | 800    | fixed | false          | true
Instalación de Kit de 4 Cámaras de CCTV (únicamente...)       | 2000   | fixed | false          | true
```

---

## 📝 NOTAS IMPORTANTES

1. **Tabla Compartida:** Todas las apps usan la misma tabla `service_catalog` en Supabase, por lo que al ejecutar el script una vez, se alinea para todas.

2. **Nombres Diferentes:** El script maneja automáticamente diferentes variaciones de nombres:
   - "Instalar Kit de 4 Cámaras"
   - "Instalación de Sistema CCTV Completo (4 cámaras)"
   - "Kit de 4 Cámaras"
   - etc.

3. **Precio Fijo:** El servicio tiene `price_type = 'fixed'` y `min_price = 2000`, garantizando consistencia.

4. **Sin Materiales:** `includes_materials = false` indica que es "únicamente mano de obra".

---

## ✅ CHECKLIST DE ALINEACIÓN

- [x] Script SQL creado con lógica de actualización
- [x] Migración para Sumeeapp-B creada
- [ ] Script ejecutado en Supabase
- [ ] Verificado en SumeeClient
- [ ] Verificado en SumeePros
- [ ] Verificado en Sumeeapp-B
- [ ] Servicio aparece con nombre estándar en todas las apps
- [ ] Precio correcto ($2,000) en todas las apps

---

*Documentación creada: 2025-01-10*
