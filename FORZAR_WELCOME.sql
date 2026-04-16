-- 🔧 Script para Forzar Mostrar Welcome
-- Ejecuta este script en Supabase SQL Editor para ver el welcome de nuevo

-- Opción 1: Para tu usuario actual (recomendado)
UPDATE profiles 
SET onboarding_completed = false 
WHERE user_id = auth.uid();

-- Opción 2: Para un usuario específico (reemplaza 'USER_ID_AQUI' con el ID real)
-- UPDATE profiles 
-- SET onboarding_completed = false 
-- WHERE user_id = 'USER_ID_AQUI';

-- Opción 3: Para TODOS los usuarios (⚠️ Solo para testing)
-- UPDATE profiles 
-- SET onboarding_completed = false;

-- Verificar el cambio (usando las columnas correctas)
SELECT 
    user_id,
    full_name,
    email,
    onboarding_completed,
    created_at
FROM profiles
WHERE user_id = auth.uid();

-- Si no hay resultados, verifica que estés autenticado en Supabase
-- Si onboarding_completed sigue siendo true, verifica que el UPDATE se ejecutó correctamente

