#!/bin/bash

# Pre-build script para SumeeClient
# Limpia y prepara el proyecto para build de producción

echo "🧹 Limpiando proyecto..."

# Limpiar cache de Metro
rm -rf .expo
rm -rf node_modules/.cache

# Limpiar builds anteriores
rm -rf ios/build
rm -rf android/app/build

# Verificar dependencias
echo "📦 Verificando dependencias..."
npx expo-doctor

echo "✅ Proyecto listo para build"
