    -- ==========================================
    -- SCRIPT DE VANGUARDIA: REVIEWS Y PERMISOS
    -- Objetivo: Asegurar que los clientes puedan calificar 
    -- a los profesionales y que las políticas RLS lo permitan.
    -- ==========================================

    -- 1. Asegurar que la tabla reviews existe con la estructura correcta
    -- Nota: Si usas el SQL Editor de Supabase, puedes ejecutar estas sentencias directamente.

    CREATE TABLE IF NOT EXISTS public.reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
        client_id UUID REFERENCES public.profiles(user_id),
        professional_id UUID REFERENCES public.profiles(user_id),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Habilitar RLS (Row Level Security)
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

    -- 2. Configurar Políticas de Seguridad (RLS)
    -- Borrar políticas existentes para evitar duplicados
    DROP POLICY IF EXISTS "Clientes pueden crear reseñas" ON public.reviews;
    DROP POLICY IF EXISTS "Cualquiera puede ver reseñas" ON public.reviews;

    -- Política: Los clientes pueden crear reseñas para sus propios servicios
    CREATE POLICY "Clientes pueden crear reseñas" 
    ON public.reviews 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = client_id
    );

    -- Política: Cualquiera (logueado) puede ver las reseñas de los profesionales
    CREATE POLICY "Cualquiera puede ver reseñas" 
    ON public.reviews 
    FOR SELECT 
    USING (
        auth.role() = 'authenticated'
    );

    -- 3. Trigger para actualizar la calificación promedio del profesional (Opcional pero recomendado)
    -- Primero nos aseguramos de que la columna exista en profiles
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calificacion_promedio NUMERIC(2,1) DEFAULT 0;

    CREATE OR REPLACE FUNCTION update_professional_rating()
    RETURNS TRIGGER AS $$
    BEGIN
        UPDATE public.profiles
        SET calificacion_promedio = (
            SELECT AVG(rating)::numeric(2,1)
            FROM public.reviews
            WHERE professional_id = NEW.professional_id
        )
        WHERE user_id = NEW.professional_id;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS tr_update_professional_rating ON public.reviews;
    CREATE TRIGGER tr_update_professional_rating
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_rating();
