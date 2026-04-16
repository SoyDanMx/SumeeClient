#!/bin/bash

# Script para configurar secrets en EAS
# Las variables EXPO_PUBLIC_* se incluyen automáticamente en el build

echo "🔐 Configurando secrets de EAS..."

# Leer variables del .env
SUPABASE_URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_ANON_KEY=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

echo "📝 Configurando EXPO_PUBLIC_SUPABASE_URL..."
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "$SUPABASE_URL" --type string --force

echo "📝 Configurando EXPO_PUBLIC_SUPABASE_ANON_KEY..."
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "$SUPABASE_ANON_KEY" --type string --force

echo "✅ Secrets configurados correctamente"
echo ""
echo "Para verificar, ejecuta:"
echo "npx eas secret:list"
