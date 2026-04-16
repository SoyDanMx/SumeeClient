-- ============================================================================
-- CORREGIR POLÍTICAS DE STORAGE PARA AVATARS DE CLIENTES
-- ============================================================================
-- Este script verifica y crea las políticas de Storage necesarias para que
-- los clientes puedan subir sus fotos de perfil al bucket professional-avatars
-- ============================================================================

-- 1. VERIFICAR SI EL BUCKET EXISTE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'professional-avatars'
    ) THEN
        RAISE NOTICE '⚠️ El bucket professional-avatars no existe.';
        RAISE NOTICE '   Crea el bucket manualmente en Supabase Dashboard:';
        RAISE NOTICE '   - Nombre: professional-avatars';
        RAISE NOTICE '   - Público: Sí';
        RAISE NOTICE '   - Tamaño máximo: 5 MB';
        RAISE NOTICE '   - Tipos permitidos: image/*';
    ELSE
        RAISE NOTICE '✅ Bucket professional-avatars existe';
    END IF;
END $$;

-- 2. ELIMINAR POLÍTICAS ANTIGUAS (si existen)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;

-- 3. CREAR POLÍTICA PARA INSERT (Subir avatares)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own avatars'
    ) THEN
        CREATE POLICY "Users can upload their own avatars"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'professional-avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
        
        RAISE NOTICE '✅ Política de INSERT creada para avatares';
    ELSE
        RAISE NOTICE 'ℹ️ Política de INSERT ya existe';
    END IF;
END $$;

-- 4. CREAR POLÍTICA PARA UPDATE (Actualizar avatares)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update their own avatars'
    ) THEN
        CREATE POLICY "Users can update their own avatars"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'professional-avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        )
        WITH CHECK (
            bucket_id = 'professional-avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
        
        RAISE NOTICE '✅ Política de UPDATE creada para avatares';
    ELSE
        RAISE NOTICE 'ℹ️ Política de UPDATE ya existe';
    END IF;
END $$;

-- 5. CREAR POLÍTICA PARA DELETE (Eliminar avatares)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own avatars'
    ) THEN
        CREATE POLICY "Users can delete their own avatars"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'professional-avatars' AND
            (storage.foldername(name))[1] = auth.uid()::text
        );
        
        RAISE NOTICE '✅ Política de DELETE creada para avatares';
    ELSE
        RAISE NOTICE 'ℹ️ Política de DELETE ya existe';
    END IF;
END $$;

-- 6. CREAR POLÍTICA PARA SELECT (Ver avatares - Público)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public can view avatars'
    ) THEN
        CREATE POLICY "Public can view avatars"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'professional-avatars');
        
        RAISE NOTICE '✅ Política de SELECT (público) creada para avatares';
    ELSE
        RAISE NOTICE 'ℹ️ Política de SELECT (público) ya existe';
    END IF;
END $$;

-- 7. VERIFICAR POLÍTICAS CREADAS
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- 8. MENSAJE FINAL
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verificación de Storage completada';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Políticas creadas:';
    RAISE NOTICE '  • Users can upload their own avatars (INSERT)';
    RAISE NOTICE '  • Users can update their own avatars (UPDATE)';
    RAISE NOTICE '  • Users can delete their own avatars (DELETE)';
    RAISE NOTICE '  • Public can view avatars (SELECT)';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verificaciones adicionales:';
    RAISE NOTICE '  1. El bucket professional-avatars debe ser PÚBLICO';
    RAISE NOTICE '  2. El bucket debe permitir tipos: image/*';
    RAISE NOTICE '  3. El tamaño máximo recomendado: 5 MB';
    RAISE NOTICE '';
END $$;

