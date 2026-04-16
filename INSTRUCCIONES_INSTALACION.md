# 📦 Instrucciones de Instalación - SumeeClient

## Dependencias Necesarias

Para que la app funcione correctamente, necesitas instalar las siguientes dependencias:

```bash
cd ~/Documents/Sumee-Universe/SumeeClient
npm install @expo/vector-icons expo-linear-gradient react-native-safe-area-context
```

## Verificar Instalación

Después de instalar, verifica que todo esté correcto:

```bash
npm list @expo/vector-icons expo-linear-gradient react-native-safe-area-context
```

## Ejecutar la App

```bash
npx expo start --port 8082
```

## Estructura Creada

✅ Componentes base:
- `components/Text.tsx`
- `components/Screen.tsx`
- `components/Button.tsx`
- `components/Card.tsx`
- `components/SearchBar.tsx`
- `components/ServiceCard.tsx`

✅ Contextos:
- `contexts/ThemeContext.tsx`

✅ Constantes:
- `constants/Colors.ts`

✅ Pantallas:
- `app/(tabs)/index.tsx` - Home Screen (inspirada en Angi)
- `app/(tabs)/projects.tsx` - Mis Solicitudes
- `app/(tabs)/profile.tsx` - Perfil

✅ Layouts:
- `app/_layout.tsx` - Layout principal
- `app/(tabs)/_layout.tsx` - Layout de tabs

## Notas

- La Home Screen está inspirada en el flujo de onboarding de Angi
- Usa los mismos colores de marca que SumeePros y Sumeeapp-B
- Está lista para integrar con Supabase cuando sea necesario

