-- ############################################################################
-- ⛔ ARCHIVADO — NO EJECUTAR  /  ARCHIVED — DO NOT RUN
-- ############################################################################
--
-- Migración LEGACY conservada únicamente como referencia histórica.
-- Contiene `DROP TABLE ... CASCADE`, por lo que ejecutarla DESTRUIRÍA
-- datos existentes (perfiles de gato, publicaciones, reacciones, comentarios...).
--
-- ✅ ESQUEMA ACTIVO (usar estos en su lugar):
--    - supabase/migrations/0001_miaucv_complete_schema.sql
--    - supabase/migrations/0003_fix_social_relations_and_cache.sql
--    - supabase/setup-bucket.sql
--
-- ⚠️ SI ALGUIEN NECESITA EJECUTARLA MANUALMENTE:
--    1) Backup previo: Supabase Dashboard > Database > Backups
--    2) Probar primero en un proyecto/entorno de prueba
--    3) Quitar de forma consciente el bloque "BLOQUEO DE EJECUCIÓN"
--    4) Ejecutar MANUALMENTE en el SQL Editor
--
-- ############################################################################

-- ============================================================
-- BLOQUEO DE EJECUCIÓN (quitar solo de forma deliberada)
-- ============================================================
DO $$
BEGIN
  RAISE EXCEPTION
    'ARCHIVED MIGRATION (%). Es legacy y usa DROP TABLE CASCADE. Usa 0001_miaucv_complete_schema.sql. Si de verdad necesitas ejecutarla: haz backup y elimina el bloque de bloqueo.',
    'archive/0003_miaucv_social.sql';
END $$;

-- ############################################################################
-- CONTENIDO ORIGINAL (sin cambios) — solo referencia
-- ############################################################################

-- ============================================================
-- MiauCV - Muro Social Felino
-- Ejecutar en SQL Editor del panel de Supabase
-- ============================================================

-- ============================================================
-- TABLA: usuarios_gato (perfil felino del usuario)
-- ============================================================

-- Primero verificar si existe
DROP TABLE IF EXISTS public.usuarios_gato CASCADE;

CREATE TABLE public.usuarios_gato (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nombre TEXT,
  alias TEXT,
  foto_url TEXT,
  edad INTEGER CHECK (edad >= 1 AND edad <= 30),
  ubicacion TEXT,
  bandera TEXT,
  color_pelaje TEXT,
  patron TEXT DEFAULT 'Regular',
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: publicaciones_gato (publicaciones del muro)
-- ============================================================
DROP TABLE IF EXISTS public.publicaciones_gato CASCADE;

CREATE TABLE public.publicaciones_gato (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  foto_url TEXT,
  texto TEXT,
  etiqueta_profesion TEXT,
  es_duelo BOOLEAN DEFAULT FALSE,
  usuarios_duelo UUID[] DEFAULT ARRAY[]::UUID[],
  veces_visto INTEGER DEFAULT 0,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: reacciones
-- ============================================================
DROP TABLE IF EXISTS public.reacciones CASCADE;

CREATE TABLE public.reacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  publicacion_id UUID REFERENCES public.publicaciones_gato(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('me_gusta', 'meEncanta', 'meDivertí', 'meSorprendí', 'meEnojé', 'meArrepentré')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  UNIQUE(usuario_id, publicacion_id, tipo)
);

-- ============================================================
-- TABLA: comentarios
-- ============================================================
DROP TABLE IF EXISTS public.comentarios CASCADE;

CREATE TABLE public.comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID REFERENCES public.publicaciones_gato(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: desafios (retos)
-- ============================================================
DROP TABLE IF EXISTS public.desafios CASCADE;

CREATE TABLE public.desafios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  foto_template TEXT, -- URL de plantilla
  puntos INTEGER DEFAULT 10,
  activo BOOLEAN DEFAULT TRUE,
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: progreso_desafios
-- ============================================================
DROP TABLE IF EXISTS public.progreso_desafios CASCADE;

CREATE TABLE public.progreso_desafios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  desafio_id UUID REFERENCES public.desafios(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completado', 'fallido')),
  puntos_ganados INTEGER DEFAULT 0,
  comentario TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  completado_en TIMESTAMP WITH TIME ZONE,
  UNIQUE(usuario_id, desafio_id)
);

-- ============================================================
-- TRIGGERS PARA ACTUALIZACIÓN DE FECHA
-- ============================================================

DROP TRIGGER IF EXISTS update_usuarios_gato_updated_at ON public.usuarios_gato;
CREATE TRIGGER update_usuarios_gato_updated_at
BEFORE UPDATE ON public.usuarios_gato
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_publicaciones_gato_updated_at ON public.publicaciones_gato;
CREATE TRIGGER update_publicaciones_gato_updated_at
BEFORE UPDATE ON public.publicaciones_gato
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_comentarios_updated_at ON public.comentarios;
CREATE TRIGGER update_comentarios_updated_at
BEFORE UPDATE ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN DE AYUDA PARA CONTAR REACCIONES
-- ============================================================
DROP FUNCTION IF EXISTS public.contar_reacciones_por_publicacion(UUID);
CREATE OR REPLACE FUNCTION public.contar_reacciones_por_publicacion(p_publicacion_id UUID)
RETURNS TABLE(me_gusta BIGINT, me_encanta BIGINT, me_divertí BIGINT, me_sorprendí BIGINT, me_enojé BIGINT, me_arrepentí BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN r.tipo = 'me_gusta' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'me_encanta' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'me_divertí' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'me_sorprendí' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'me_enojé' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'me_arrepentí' THEN 1 ELSE 0 END), 0)::BIGINT
  FROM public.reacciones r
  WHERE r.publicacion_id = p_publicacion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PÓLIZAS DE ACCESO (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios_gato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicaciones_gato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_desafios ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas para usuarios_gato
-- ============================================================

DROP POLICY IF EXISTS "Usuario puede leer su propio perfil" ON public.usuarios_gato;
CREATE POLICY "Usuario puede leer su propio perfil"
  ON public.usuarios_gato
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede insertar su propio perfil" ON public.usuarios_gato;
CREATE POLICY "Usuario puede insertar su propio perfil"
  ON public.usuarios_gato
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede actualizar su propio perfil" ON public.usuarios_gato;
CREATE POLICY "Usuario puede actualizar su propio perfil"
  ON public.usuarios_gato
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su propio perfil" ON public.usuarios_gato;
CREATE POLICY "Usuario puede eliminar su propio perfil"
  ON public.usuarios_gato
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Políticas para publicaciones_gato
-- ============================================================

DROP POLICY IF EXISTS "Público puede leer publicaciones" ON public.publicaciones_gato;
CREATE POLICY "Público puede leer publicaciones"
  ON public.publicaciones_gato
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuario puede insertar su publicación" ON public.publicaciones_gato;
CREATE POLICY "Usuario puede insertar su publicación"
  ON public.publicaciones_gato
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede actualizar su publicación" ON public.publicaciones_gato;
CREATE POLICY "Usuario puede actualizar su publicación"
  ON public.publicaciones_gato
  FOR UPDATE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su publicación" ON public.publicaciones_gato;
CREATE POLICY "Usuario puede eliminar su publicación"
  ON public.publicaciones_gato
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- Políticas para reacciones
-- ============================================================

DROP POLICY IF EXISTS "Público puede leer reacciones" ON public.reacciones;
CREATE POLICY "Público puede leer reacciones"
  ON public.reacciones
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuario puede insertar su reacción" ON public.reacciones;
CREATE POLICY "Usuario puede insertar su reacción"
  ON public.reacciones
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su reacción" ON public.reacciones;
CREATE POLICY "Usuario puede eliminar su reacción"
  ON public.reacciones
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- Políticas para comentarios
-- ============================================================

DROP POLICY IF EXISTS "Público puede leer comentarios" ON public.comentarios;
CREATE POLICY "Público puede leer comentarios"
  ON public.comentarios
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuario puede insertar su comentario" ON public.comentarios;
CREATE POLICY "Usuario puede insertar su comentario"
  ON public.comentarios
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede actualizar su comentario" ON public.comentarios;
CREATE POLICY "Usuario puede actualizar su comentario"
  ON public.comentarios
  FOR UPDATE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su comentario" ON public.comentarios;
CREATE POLICY "Usuario puede eliminar su comentario"
  ON public.comentarios
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- Políticas para desafios
-- ============================================================

DROP POLICY IF EXISTS "Público puede leer desafios activos" ON public.desafios;
CREATE POLICY "Público puede leer desafios activos"
  ON public.desafios
  FOR SELECT
  USING (activo = TRUE);

DROP POLICY IF EXISTS "Usuario admin puede gestionar desafios" ON public.desafios;
CREATE POLICY "Usuario admin puede gestionar desafios"
  ON public.desafios
  FOR ALL
  USING (auth.uid() = creado_por);

-- ============================================================
-- Políticas para progreso_desafios
-- ============================================================

DROP POLICY IF EXISTS "Usuario puede leer su progreso" ON public.progreso_desafios;
CREATE POLICY "Usuario puede leer su progreso"
  ON public.progreso_desafios
  FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede insertar su progreso" ON public.progreso_desafios;
CREATE POLICY "Usuario puede insertar su progreso"
  ON public.progreso_desafios
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede actualizar su progreso" ON public.progreso_desafios;
CREATE POLICY "Usuario puede actualizar su progreso"
  ON public.progreso_desafios
  FOR UPDATE
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su progreso" ON public.progreso_desafios;
CREATE POLICY "Usuario puede eliminar su progreso"
  ON public.progreso_desafios
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_gato_user_id ON public.usuarios_gato(user_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_usuario_id ON public.publicaciones_gato(usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_created_at ON public.publicaciones_gato(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_reacciones_publicacion_id ON public.reacciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_reacciones_usuario_id ON public.reacciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion_id ON public.comentarios(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario_id ON public.comentarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progreso_desafios_usuario_id ON public.progreso_desafios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progreso_desafios_desafio_id ON public.progreso_desafios(desafio_id);

-- ============================================================
-- COMENTARIOS FINALES
-- ============================================================

/*
NOTAS DE IMPLEMENTACIÓN:

1. El bucket 'cat-photos' debe ser creado manualmente en Supabase Storage:
   - Ir a Storage > Buckets > New bucket
   - Nombre: cat-photos
   - Public: true (para acceso público)

2. El primer usuario debe crear su perfil usando la función saveCV()

3. Para crear un desafío inicial, ejecutar:
   INSERT INTO desafios (nombre, descripcion, foto_template, puntos)
   VALUES ('Primer Maullo', 'Comparte tu primer CV gatuno', '', 5);

4. Las funciones helper están en src/lib/supabaseClient.js
*/