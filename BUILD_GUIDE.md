# 🚀 Guía de Build - SumeeClient

## Pre-requisitos
- Cuenta de Expo configurada: `npx eas-cli login`
- Proyecto vinculado a EAS: ✅ (Project ID: 73d4e082-9430-4be6-981f-7b0682245b78)

## Comandos de Build

### 📱 Preview Build (Recomendado para testing)

**iOS (Simulador):**
```bash
npx eas build --profile preview --platform ios
```

**Android (APK):**
```bash
npx eas build --profile preview --platform android
```

**Ambas plataformas:**
```bash
npx eas build --profile preview --platform all
```

### 🏭 Production Build

**iOS:**
```bash
npx eas build --profile production --platform ios
```

**Android:**
```bash
npx eas build --profile production --platform android
```

## Configuración Actual

### Preview Build
- **Distribución**: Internal (TestFlight/Internal Testing)
- **iOS**: Simulator build + Release configuration
- **Android**: APK (fácil de distribuir)
- **Channel**: `preview`

### Production Build
- **Distribución**: Store
- **iOS**: Release configuration
- **Android**: AAB (Android App Bundle)
- **Channel**: `production`

## Verificación Pre-Build

Ejecuta antes de cada build:
```bash
./scripts/prebuild.sh
```

O manualmente:
```bash
npx expo-doctor
```

## Estado del Proyecto

✅ Todas las dependencias instaladas correctamente
✅ Configuración de EAS lista
✅ Variables de entorno configuradas (.env)
✅ Permisos de ubicación configurados
✅ Bundle identifiers configurados:
   - iOS: com.nuonetworks.tulbox
   - Android: com.nuonetworks.tulbox

## Notas Importantes

1. **Leaflet Maps**: Funciona sin configuración nativa adicional
2. **Expo Location**: Plugin configurado en app.json
3. **Secure Store**: Actualizado a SDK 54
4. **Edge Functions**: Desplegadas y funcionando

## Troubleshooting

Si el build falla:
1. Limpia cache: `rm -rf .expo node_modules/.cache`
2. Reinstala dependencias: `npm install`
3. Verifica: `npx expo-doctor`
4. Revisa logs en: https://expo.dev/accounts/[tu-cuenta]/projects/sumeeclient/builds

## Siguiente Paso

Para iniciar el build de preview:
```bash
npx eas build --profile preview --platform ios
```

O si prefieres Android:
```bash
npx eas build --profile preview --platform android
```
