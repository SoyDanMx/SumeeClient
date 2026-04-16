# Build Sumee Client (Sumee App)

## Antes de construir

En [expo.dev](https://expo.dev) → **Sumee App** (proyecto SumeeClient) → **Environment variables** / **Secrets**:

- Asegúrate de tener para el environment **preview** (APK) y **production** (AAB):
  - `EXPO_PUBLIC_SUPABASE_URL` → URL de tu proyecto Supabase
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Clave anónima de Supabase
  - `EXPO_PUBLIC_MAPBOX_TOKEN` (opcional, si usas mapas)

Las variables deben estar en **Plain text** para que se inyecten en el build.

## Generar APK (Android)

```bash
cd /Users/danielnuno/Documents/Sumee-Universe/SumeeClient
npm run build:android:preview
```

O con EAS directamente:

```bash
npx eas build --profile preview --platform android --clear-cache
```

El build se ejecuta en el proyecto **Sumee App** (slug: SumeeClient). Cuando termine, descarga el APK desde [expo.dev](https://expo.dev) → Builds.

**Importante:** El build debe estar en el proyecto **Sumee App** (SumeeClient), no en Sumee Pro.
