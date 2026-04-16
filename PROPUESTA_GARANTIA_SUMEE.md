# 🛡️ Propuesta: Reubicación del Banner de Garantía Sumee

## 📊 Análisis Actual

### **Ubicación Actual (HomeScreen)**
- **Líneas 246-274** en `app/(tabs)/index.tsx`
- Banner grande y prominente entre categorías y profesionales
- Ocupa espacio valioso en el feed principal
- Puede ser molesto para usuarios que ya conocen la garantía

### **Problemas Identificados**
1. ❌ Ocupa espacio en el feed principal
2. ❌ Interrumpe el flujo de navegación
3. ❌ Puede ser repetitivo para usuarios frecuentes
4. ❌ No es contextual (no está relacionado con acciones del usuario)

---

## ✅ Propuesta: Mover a Perfil

### **Opción 1: Sección "Seguridad y Garantías" (RECOMENDADA)**

**Ubicación:** Después de "Información Personal", antes de "Configuración"

**Diseño:**
- Card compacto con icono de escudo
- Título: "Garantía Sumee"
- Descripción breve: "Tu dinero está protegido hasta que el trabajo esté terminado"
- Botón "Saber más" que abre modal o navega a página de detalles

**Ventajas:**
- ✅ No interrumpe el flujo principal
- ✅ Accesible cuando el usuario lo necesita
- ✅ Contexto apropiado (perfil = confianza)
- ✅ Más discreto pero visible

### **Opción 2: Badge en Header del Perfil**

**Ubicación:** Junto al nombre del usuario, como badge pequeño

**Diseño:**
- Badge pequeño con icono de escudo
- Al tocar, muestra tooltip o modal con información

**Ventajas:**
- ✅ Muy discreto
- ✅ Siempre visible
- ❌ Menos información visible

### **Opción 3: Item en Configuración**

**Ubicación:** En la sección "Configuración", como primer item

**Diseño:**
- Item de lista con icono de escudo
- Al tocar, navega a página de detalles

**Ventajas:**
- ✅ Lógico (configuración = información importante)
- ✅ No ocupa espacio visual
- ❌ Menos visible

---

## 🎯 Recomendación Final

**Opción 1: Sección "Seguridad y Garantías"**

### **Implementación:**

1. **Eliminar del HomeScreen:**
   - Remover líneas 246-274 (bannerSection completo)

2. **Agregar al Perfil:**
   - Crear nueva sección después de "Información Personal"
   - Card compacto con diseño similar pero más pequeño
   - Mantener colores de marca (morado Sumee)
   - Icono de escudo visible

3. **Diseño del Card:**
   ```
   ┌─────────────────────────────────┐
   │ 🛡️  Garantía Sumee              │
   │                                 │
   │ Tu dinero está protegido hasta  │
   │ que el trabajo esté terminado.  │
   │                                 │
   │ [Saber más →]                  │
   └─────────────────────────────────┘
   ```

4. **Funcionalidad:**
   - Botón "Saber más" puede:
     - Abrir modal con detalles completos
     - Navegar a página de términos y condiciones
     - Mostrar información sobre la garantía

---

## 📋 Cambios a Realizar

### **1. HomeScreen (`app/(tabs)/index.tsx`)**
- [ ] Eliminar `bannerSection` (líneas 246-274)
- [ ] Eliminar estilos relacionados (`bannerSection`, `banner`, etc.)
- [ ] Ajustar espaciado si es necesario

### **2. ProfileScreen (`app/(tabs)/profile.tsx`)**
- [ ] Agregar nueva sección "Seguridad y Garantías"
- [ ] Crear componente `GuaranteeCard` (opcional, puede ser inline)
- [ ] Agregar estilos para el card compacto
- [ ] Implementar navegación/modal para "Saber más"

---

## 🎨 Diseño Propuesto

### **Card de Garantía (Perfil)**

```tsx
<View style={styles.guaranteeSection}>
    <Text variant="h3" weight="bold" style={styles.sectionTitle}>
        Seguridad y Garantías
    </Text>
    <Card variant="elevated" style={styles.guaranteeCard}>
        <View style={styles.guaranteeContent}>
            <View style={[styles.guaranteeIconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
            </View>
            <View style={styles.guaranteeText}>
                <Text variant="h3" weight="bold" style={styles.guaranteeTitle}>
                    Garantía Sumee
                </Text>
                <Text variant="body" color={theme.textSecondary} style={styles.guaranteeDescription}>
                    Tu dinero está protegido hasta que el trabajo esté terminado.
                </Text>
            </View>
            <TouchableOpacity 
                style={[styles.guaranteeButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
                onPress={() => {/* Navegar o abrir modal */}}
            >
                <Text variant="caption" weight="bold" color="#FFFFFF">
                    Saber más
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    </Card>
</View>
```

### **Estilos:**

```tsx
guaranteeSection: {
    paddingHorizontal: 20,
    marginTop: 24,
},
guaranteeCard: {
    marginTop: 12,
},
guaranteeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
},
guaranteeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
},
guaranteeText: {
    flex: 1,
},
guaranteeTitle: {
    marginBottom: 4,
},
guaranteeDescription: {
    fontSize: 13,
    lineHeight: 18,
},
guaranteeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
},
```

---

## ✅ Beneficios

1. **Mejor UX:**
   - HomeScreen más limpio y enfocado
   - Información de garantía accesible cuando se necesita

2. **Mejor Contexto:**
   - Perfil = lugar para información de confianza
   - Usuario busca garantía cuando revisa su perfil

3. **Menos Intrusivo:**
   - No interrumpe el flujo principal
   - Visible pero discreto

4. **Más Profesional:**
   - HomeScreen enfocado en servicios
   - Perfil enfocado en confianza y seguridad

---

## 🚀 Implementación

¿Proceder con la implementación de la Opción 1?

