# 📦 Comandos de Instalación - SumeeClient

## 🚀 Instalación de Dependencias

### **1. Instalar Dependencias Base (Ya completado ✅)**

```bash
cd ~/Documents/Sumee-Universe/SumeeClient
npm install
```

### **2. Instalar Mapbox (Con conflicto de dependencias)**

**Ejecuta este comando en tu terminal:**

```bash
npm install @rnmapbox/maps --legacy-peer-deps
```

**Explicación:** El flag `--legacy-peer-deps` resuelve el conflicto entre React 19.1.0 y React 19.2.3.

### **3. Verificar Instalación**

```bash
npm list @rnmapbox/maps
```

---

## 🔧 Si hay problemas de permisos

Si ves errores de permisos (EPERM), intenta:

```bash
# Limpiar caché de npm
npm cache clean --force

# Reintentar instalación
npm install @rnmapbox/maps --legacy-peer-deps
```

---

## ✅ Estado Actual

- ✅ Variables de entorno configuradas (`.env`)
- ✅ `lib/supabase.ts` creado
- ✅ `app.json` configurado con Mapbox
- ⏳ `@rnmapbox/maps` pendiente de instalar (ejecutar comando arriba)

---

## 📝 Nota Importante

**No es crítico instalar Mapbox ahora** si no vas a usar mapas inmediatamente. Las variables están configuradas y puedes instalar el paquete cuando lo necesites.

---

**Ejecuta el comando manualmente en tu terminal cuando estés listo.**

