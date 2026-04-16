#!/bin/bash

echo "🧹 Limpiando caché de Metro y reiniciando Expo..."

# Detener cualquier proceso de Expo en el puerto 8082
# fuser -k 8082/tcp > /dev/null 2>&1

# Eliminar cachés de Expo y Node
rm -rf .expo node_modules/.cache .metro

# Limpiar la caché de npm
npm cache clean --force

# Verificar que react-native-url-polyfill está instalado
if [ ! -d "node_modules/react-native-url-polyfill" ]; then
    echo "⚠️  react-native-url-polyfill no encontrado, instalando..."
    npm install react-native-url-polyfill --legacy-peer-deps
fi

# Iniciar Expo con caché limpia
echo "🚀 Iniciando Expo con caché limpia..."
npx expo start --clear --port 8082

echo "✅ Proceso de reinicio completado."
