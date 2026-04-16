-- =====================================================================
-- SCHEMA: Tabla de Direcciones Guardadas para Clientes
-- =====================================================================
-- Esta tabla permite a los clientes guardar múltiples direcciones
-- (Casa, Oficina, etc.) para facilitar las solicitudes de servicio
-- =====================================================================

-- Crear tabla addresses si no existe
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- "Casa", "Oficina", "Otro", etc.
    address TEXT NOT NULL, -- Dirección completa
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city TEXT,
    state TEXT,
    zip_code TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(user_id, is_default) WHERE is_default = true;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Habilitar RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias direcciones
CREATE POLICY "Users can view their own addresses"
    ON public.addresses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias direcciones
CREATE POLICY "Users can insert their own addresses"
    ON public.addresses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias direcciones
CREATE POLICY "Users can update their own addresses"
    ON public.addresses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias direcciones
CREATE POLICY "Users can delete their own addresses"
    ON public.addresses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- =====================================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================================

COMMENT ON TABLE public.addresses IS 'Direcciones guardadas por los clientes para facilitar solicitudes de servicio';
COMMENT ON COLUMN public.addresses.name IS 'Nombre descriptivo de la dirección (ej: "Casa", "Oficina")';
COMMENT ON COLUMN public.addresses.address IS 'Dirección completa en texto';
COMMENT ON COLUMN public.addresses.latitude IS 'Latitud de la ubicación (opcional, para geocodificación)';
COMMENT ON COLUMN public.addresses.longitude IS 'Longitud de la ubicación (opcional, para geocodificación)';
COMMENT ON COLUMN public.addresses.is_default IS 'Indica si esta es la dirección predeterminada del usuario';

