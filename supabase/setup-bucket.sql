-- ============================================================
-- MiauCV - Configuración del bucket cat-photos
-- Ejecutar MANUALMENTE en el SQL Editor del panel de Supabase
-- Versión: 2.0 - IDEMPOTENTE (se puede re-ejecutar sin errores)
-- ============================================================
--
-- ⚠️  Este script NO borra datos ni archivos.
--     Solo asegura que el bucket exista y que las políticas sean
--     las correctas. Revísalo antes de ejecutarlo en producción.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Crear el bucket si no existe (no falla si ya existe)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cat-photos',
  'cat-photos',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Si el bucket ya existía, reforzar su configuración esperada
--    (público, límite de tamaño y tipos MIME permitidos).
--    En DO para que un error de permisos no aborte el script.
-- ------------------------------------------------------------
DO $$
BEGIN
  UPDATE storage.buckets
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  WHERE id = 'cat-photos';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo actualizar storage.buckets (cat-photos): %', SQLERRM;
END $$;

-- ------------------------------------------------------------
-- 3. Políticas de acceso para el bucket cat-photos
--    DROP POLICY IF EXISTS -> CREATE POLICY (idempotente)
-- ------------------------------------------------------------

-- 3.1 Cualquiera puede ver/descargar fotos (bucket público)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'cat-photos');

-- 3.2 Usuarios autenticados pueden subir sus propias fotos
--     (la primera carpeta del path debe ser su user_id)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cat-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3.3 Usuarios pueden actualizar sus propias fotos
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3.4 Usuarios pueden eliminar sus propias fotos
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ------------------------------------------------------------
-- 4. Recargar el schema cache de PostgREST
-- ------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN (descomenta para comprobar tras ejecutar)
-- ============================================================
/*
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'cat-photos';

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname IN (
    'Public read access',
    'Authenticated users can upload',
    'Users can update own photos',
    'Users can delete own photos'
  )
ORDER BY policyname;
*/

-- ============================================================
-- NOTAS
-- ============================================================
-- 1. Ejecutar en: Supabase Dashboard > SQL Editor
-- 2. Bucket: 'cat-photos', público (public = true)
-- 3. Rutas de archivo: {user_id}/{timestamp}_{nombre}.{ext}
-- 4. Límite: 5MB por archivo; solo imágenes jpeg/png/webp/gif
-- 5. Las políticas NO se debilitaron: la escritura sigue exigiendo
--    que el usuario autenticado sea dueño de la carpeta.
-- ============================================================
