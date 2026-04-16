# Especificación: icono de app con alto contraste (Sumee Client)

## Problema detectado

En la APK anterior, el icono de la app se veía **defectuoso** en relación al fondo:

- **S** en **púrpura claro** sobre **fondo púrpura oscuro**.
- **Bajo contraste**: dos tonos de púrpura muy cercanos → el logo no se distingue bien en el launcher, en distintos brillos de pantalla ni en tamaños pequeños.
- Incumple buenas prácticas de **UX/UI** y **accesibilidad** (contraste insuficiente).

## Solución: alto contraste

El icono debe ser **claramente legible** en todas las situaciones:

| Elemento | Especificación | Motivo |
|----------|----------------|--------|
| **Letra "S" (logo)** | **Blanco** `#FFFFFF` | Máximo contraste sobre púrpura. |
| **Fondo del icono** | **Púrpura** `#820AD1` o `#6D28D9` | Marca Sumee. |
| **Relación de contraste** | ≥ 4.5:1 (WCAG AA) | Blanco sobre púrpura cumple con creces. |

## Assets a corregir

1. **`assets/icon.png`** (1024×1024 px)  
   - Uso: icono principal (iOS, web, referencias).  
   - Contenido: **S blanca** sobre **fondo púrpura** (o squircle púrpura).  
   - Sin transparencia si la plataforma lo requiere; si usas squircle, el exterior puede ser transparente.

2. **`assets/adaptive-icon.png`** (Android, 1024×1024 px)  
   - Uso: **foreground** del icono adaptativo. Android superpone esta imagen sobre `backgroundColor` de `app.json`.  
   - **Opción A (recomendada):** Solo la **S blanca sobre fondo transparente**. El sistema usa `android.adaptiveIcon.backgroundColor` (#6D28D9) como fondo → resultado: **S blanca sobre púrpura**.  
   - **Opción B:** S blanca dentro de un squircle/círculo púrpura con exterior transparente, para que el icono tenga forma definida.  
   - **No usar:** S en púrpura claro sobre transparente (vuelve a dar púrpura sobre púrpura con el background).

3. **`assets/splash-icon.png`**  
   - Mismo criterio: **S blanca** sobre púrpura o sobre transparente con `splash.backgroundColor` púrpura.

## Colores de marca (referencia)

- Púrpura principal: `#820AD1` (SUMEE_COLORS.PURPLE)  
- Púrpura actual en app.json: `#6D28D9` (válido, mantener si ya lo usas)  
- Logo: `#FFFFFF`

## Pasos para aplicar la mejora

1. **Generar o editar los PNG** con la S en **blanco** y fondo **púrpura** (o S blanca sobre transparente para adaptive-icon), según las opciones anteriores.  
2. **Reemplazar** en Sumee Client:
   - `assets/icon.png`
   - `assets/adaptive-icon.png`
   - `assets/splash-icon.png` (opcional pero recomendado)
3. **Verificar** en `app.json` que estén configurados:
   - `icon`: `./assets/icon.png`
   - `android.adaptiveIcon.foregroundImage`: `./assets/adaptive-icon.png`
   - `android.adaptiveIcon.backgroundColor`: `#6D28D9` (o `#820AD1`)
4. **Nuevo build:**  
   `npx expo prebuild --clean` y volver a generar la APK para que el icono actualizado se incluya.

## Uso de los PNG actuales

- Se usan **solo los PNG** en `assets/`: `icon.png`, `adaptive-icon.png`, `splash-icon.png`. Para mejorar el contraste, edita o reemplaza esos archivos directamente.


## Checklist después de reemplazar

- [ ] `assets/icon.png` → S blanca sobre púrpura, 1024×1024
- [ ] `assets/adaptive-icon.png` → S blanca sobre transparente, 1024×1024
- [ ] `npx expo prebuild --clean` (si usas builds nativos)
- [ ] Generar nueva APK y comprobar el icono en el launcher
