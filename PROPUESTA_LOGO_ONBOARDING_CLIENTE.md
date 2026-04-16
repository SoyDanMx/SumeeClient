# Propuesta: Logos y fondo en onboarding (Sumee Client)

## Análisis del activo actual

### `assets/icon.png`
- **Contenido:** Letra "S" blanca estilizada sobre un **squircle** (cuadrado con esquinas muy redondeadas) con **gradiente púrpura** (aprox. `#8030D4` → `#6F00C7`).
- **Fondo:** Transparente fuera del squircle.
- **Problema en onboarding:** Si se coloca directamente sobre el gradiente púrpura de la welcome, el squircle púrpura del icono **se funde** con el fondo y se pierde el contorno; solo destaca la "S" blanca.

### `assets/images/logo-white.png`
- Usado por `SumeeLogo` en variante `white` (fondos oscuros).
- Debe mantener **contraste alto** sobre el gradiente (blanco sobre púrpura).

---

## Paleta de marca (alineada a `constants/Colors.ts`)

| Token        | Hex       | Uso en onboarding                    |
|-------------|-----------|--------------------------------------|
| PURPLE      | `#820AD1` | Gradiente principal, CTAs secundarios |
| PURPLE_DARK | `#5D0780` | Gradiente (extremo oscuro)            |
| PURPLE_LIGHT| `#A855F7` | Gradiente (extremo claro), acentos   |
| GREEN       | `#10B981` | Éxito, feature “Protección”          |
| Blanco      | `#FFFFFF` | Texto, logo, fondos de contraste      |
| Glass       | `rgba(255,255,255,0.12)` | Cards de features, botones secundarios |

---

## Fundamentos UX/UI aplicados

1. **Contraste (WCAG)**  
   - Logo y texto sobre fondo púrpura: uso de blanco (`#FFFFFF`) o blanco con sombra suave para legibilidad.
   - Si el logo lleva su propio “pod” (contenedor con fondo), ese fondo debe contrastar con el gradiente (p. ej. blanco o glass) para que no se pierda el squircle del icon.

2. **Jerarquía**  
   - Logo como primer elemento de la jerarquía visual; tamaño y contenedor que lo destaquen sin competir con el CTA principal.

3. **Consistencia de marca**  
   - Mismos tonos púrpura y verde que en el resto del ecosistema Sumee; ningún color nuevo fuera de la paleta.

4. **Vanguardia tecnológica**  
   - Contenedor del logo: forma redondeada (squircle o superellipse), posible efecto glass (blur + transparencia) o fondo sólido blanco con sombra suave.
   - Sombra discreta para dar profundidad sin saturar.
   - Transición/animación suave al entrar (ya existente con `logoScaleAnim`).

---

## Propuesta de implementación

### Opción A (recomendada): “Logo pod” con fondo contrastante
- **Contenedor del logo:**  
  - Fondo blanco (`#FFFFFF`) o blanco con ligera transparencia (`rgba(255,255,255,0.98)`).  
  - Bordes muy redondeados (borderRadius grande, estilo “pod”).  
  - Sombra suave (elevation + shadowColor púrpura suave) para separar del gradiente.  
  - Opcional: borde fino blanco/semi-transparente para definir el contorno.
- **Dentro del pod:**  
  - Usar `icon.png` (app icon) para consistencia con la app, **o** `logo-white.png` si se prefiere la versión “solo logo” para fondos oscuros.  
  - Sobre fondo blanco del pod, `icon.png` se ve nítido (S + squircle púrpura) y no se pierde en el gradiente.
- **Resultado:** Logo y fondo del onboarding coherentes con la paleta; contraste alto y aspecto actual.

### Opción B: Logo sin pod
- Mantener logo sobre gradiente sin contenedor.  
- Asegurar que **solo** se use una variante de logo pensada para fondo púrpura (p. ej. “S” blanca con fondo transparente, sin squircle púrpura), para evitar que dos púrpuras compitan.

---

## Recomendación

- **Implementar Opción A:** “Logo pod” con fondo blanco/glass, usando `icon.png` en la welcome para que el icono de la app y el onboarding sean la misma identidad visual, con fondo que sigue la paleta (blanco sobre púrpura) y cumple contraste y vanguardia.
