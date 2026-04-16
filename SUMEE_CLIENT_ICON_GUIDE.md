# Guía para Actualizar el Icono de Sumee Client

**Importante – Contraste:** Si el icono se ve “apagado” (S púrpura sobre fondo púrpura), sigue la **especificación de alto contraste**: ver **[ICONO_ALTO_CONTRASTE_SPEC.md](./ICONO_ALTO_CONTRASTE_SPEC.md)**. La S debe ser **blanca** (#FFFFFF) sobre fondo **púrpura** para buena legibilidad en el launcher.

---

¡El nuevo icono que has compartido es excelente! Refleja muy bien la identidad de Sumee. Aquí tienes las instrucciones para integrarlo correctamente en tu aplicación.

## 1. Organización del archivo
Te recomiendo guardar la imagen original en la siguiente ruta:
`SumeeClient/assets/images/app-icon-source.png`

## 2. Reemplazo de Iconos Estándar de Expo
Para que el icono se vea correctamente en todas las plataformas (iOS, Android, Web), debes reemplazar los siguientes archivos en la carpeta `SumeeClient/assets/`:

1.  **Icono Principal (iOS/General):** Reemplaza `assets/icon.png` con tu imagen.
    -   *Tamaño recomendado:* 1024x1024 px.
    -   *Formato:* PNG sin transparencia (para iOS).
2.  **Icono Adaptativo (Android):** Reemplaza `assets/adaptive-icon.png`.
    -   Para Android, el sistema separa el frente (foreground) del fondo. Como tu imagen ya tiene el fondo púrpura, puedes usarla directamente o separar el logo blanco para efectos de paralaje.
3.  **Splash Screen:** Reemplaza `assets/splash-icon.png`.
    -   Este es el logo que aparece al abrir la app.
4.  **Favicon (Web):** Reemplaza `assets/favicon.png`.
    -   *Tamaño recomendado:* 48x48 px o 64x64 px.

## 3. Configuración en `app.json`
Asegúrate de que tu archivo `app.json` apunte a las rutas correctas:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#6D28D9" 
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#6D28D9" 
      }
    }
  }
}
```
*Nota: El color `#6D28D9` es el púrpura característico de Sumee.*

## 4. Aplicar Cambios
Una vez reemplazados los archivos, limpia el caché de Expo para ver los cambios:

```bash
npx expo start --clear
```

---
**¿Quieres que yo mueva el archivo por ti?**
Si me indicas que proceda, puedo copiar automáticamente la imagen que subiste a las carpetas correspondientes y actualizar la configuración.
