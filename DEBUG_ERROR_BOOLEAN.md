# 🐛 Debug: Error "String cannot be cast to Boolean"

## 🔍 Estrategia de Debug

He creado una versión **simplificada** del HomeScreen para aislar el problema.

### **Paso 1: Probar Versión Simplificada**

El archivo `app/(tabs)/index.tsx` ahora tiene una versión mínima que solo muestra texto.

**Si esto funciona:**
- El problema está en los componentes personalizados o en el ThemeContext
- Necesitamos restaurar el archivo original y revisar componente por componente

**Si esto NO funciona:**
- El problema está en la configuración base (SafeAreaView, StatusBar, o expo-router)
- Necesitamos revisar la configuración de expo-router

---

## 📋 Checklist de Verificación

### **1. Verificar que la versión simplificada funcione:**
```bash
# Recarga la app
# Si funciona, el problema está en los componentes
```

### **2. Si funciona, restaurar y revisar componente por componente:**

**Componentes a revisar:**
- [ ] `ThemeContext` - Verificar que `isDark` sea boolean
- [ ] `SafeAreaView` con `edges={['top']}` - Verificar formato
- [ ] `StatusBar` de expo-status-bar - Verificar props
- [ ] `ScrollView` con `showsVerticalScrollIndicator={false}` - Verificar boolean
- [ ] `TouchableOpacity` con `activeOpacity={0.7}` - Verificar number
- [ ] `TextInput` con `editable={editable}` - Verificar boolean
- [ ] `Image` con `resizeMode="cover"` - Verificar string válido

### **3. Restaurar archivo original:**

```bash
cd ~/Documents/Sumee-Universe/SumeeClient
mv app/\(tabs\)/index.tsx.backup app/\(tabs\)/index.tsx
```

---

## 🔧 Posibles Causas

### **Causa 1: ThemeContext no inicializado**
**Solución:** Asegurar que ThemeProvider envuelva todo antes de usar useTheme()

### **Causa 2: Props booleanas como strings**
**Solución:** Verificar que todas las props booleanas sean `true`/`false`, no `"true"`/`"false"`

### **Causa 3: SafeAreaView edges**
**Solución:** Verificar que `edges` sea un array válido: `['top']` no `'top'`

### **Causa 4: StatusBar de expo-status-bar**
**Solución:** Verificar que `style` sea un string válido: `"dark"` o `"light"`

---

## 📝 Comandos Útiles

```bash
# Ver logs de Android
adb logcat | grep -i "string.*boolean"

# Limpiar y reiniciar
rm -rf .expo node_modules/.cache
npx expo start --clear

# Verificar estructura
ls -la app/\(tabs\)/
```

---

**Última actualización:** Enero 2025

