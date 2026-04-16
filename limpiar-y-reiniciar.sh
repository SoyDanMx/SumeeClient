#!/bin/bash

echo "🧹 Limpiando cache y archivos temporales..."
echo ""

# Limpiar cache de Expo
echo "1. Limpiando .expo..."
rm -rf .expo
rm -rf .expo-shared

# Limpiar cache de Metro
echo "2. Limpiando cache de Metro..."
rm -rf node_modules/.cache

# Limpiar watchman (si está instalado)
if command -v watchman &> /dev/null; then
    echo "3. Limpiando watchman..."
    watchman watch-del-all 2>/dev/null || true
fi

echo ""
echo "✅ Limpieza completada"
echo ""
echo "🚀 Para iniciar Expo:"
echo "   npx expo start --clear"
echo ""

