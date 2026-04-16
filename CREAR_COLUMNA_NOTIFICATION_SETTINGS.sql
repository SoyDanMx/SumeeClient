-- Script para agregar columna notification_settings a la tabla profiles
-- Esta columna almacena las preferencias de notificaciones del usuario

-- Verificar si la columna ya existe
DO $$
BEGIN
    -- Agregar columna notification_settings si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'notification_settings'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN notification_settings JSONB DEFAULT '{
            "push_enabled": true,
            "professional_communication": true,
            "platform_notifications": true,
            "service_updates": true,
            "new_leads": true,
            "quiet_hours_enabled": false,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00"
        }'::jsonb;
        
        COMMENT ON COLUMN public.profiles.notification_settings IS 
        'Configuración de notificaciones del usuario. Almacena preferencias de push notifications, categorías y horarios de silencio.';
        
        RAISE NOTICE '✅ Columna notification_settings agregada exitosamente';
    ELSE
        RAISE NOTICE 'ℹ️ La columna notification_settings ya existe';
    END IF;
END $$;

-- Verificar que la columna fue creada
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'notification_settings';

