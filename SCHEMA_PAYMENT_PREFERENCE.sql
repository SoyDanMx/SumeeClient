-- Agregar columna payment_preference a la tabla profiles
-- Esta columna almacena el método de pago preferido del usuario

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'payment_preference'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN payment_preference VARCHAR(20) DEFAULT NULL;
        
        -- Agregar comentario a la columna
        COMMENT ON COLUMN profiles.payment_preference IS 'Método de pago preferido del usuario: cash, debit, credit';
        
        RAISE NOTICE 'Columna payment_preference agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna payment_preference ya existe';
    END IF;
END $$;

-- Crear índice para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_profiles_payment_preference 
ON profiles(payment_preference) 
WHERE payment_preference IS NOT NULL;

-- Verificar que la columna fue creada
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name = 'payment_preference';
