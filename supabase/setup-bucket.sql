-- ============================================================
-- MiauCV - Configuración del bucket cat-photos
-- Ejecutar en SQL Editor del panel de Supabase
-- ============================================================

-- Crear el bucket para fotos de gatos (público)
-- Nota: Si el bucket ya existe, esto fallará silenciosamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cat-photos',
  'cat-photos',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para el bucket cat-photos

-- 1. Cualquiera puede ver/descargar fotos (bucket público)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'cat-photos');

-- 2. Usuarios autenticados pueden subir sus propias fotos
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cat-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Usuarios pueden actualizar sus propias fotos
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cat-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Usuarios pueden eliminar sus propias fotos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cat-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- NOTAS:
-- 1. Ejecuta esto en: Supabase Dashboard > SQL Editor
-- 2. El bucket se llama 'cat-photos' y es público (public: true)
-- 3. Las políticas aseguran que cada usuario solo gestione sus archivos
-- 4. Los archivos se guardan en carpetas: {user_id}/{timestamp}_cat.{ext}
-- 4. Límite de 5MB por archivo, solo imágenes
-- ============================================================