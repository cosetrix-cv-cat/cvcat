-- ============================================================
-- MiauCV - Esquema Completo Consolidado e IDEMPOTENTE
-- Ejecutar en SQL Editor del panel de Supabase
-- Versión: 2.0 - SEGURO: no destruye datos existentes
-- ============================================================
--
-- ⚠️  IMPORTANTE - LEER ANTES DE EJECUTAR
--
-- 1. Este script es IDEMPOTENTE y NO BORRA DATOS.
--    Ya no incluye `DROP TABLE ... CASCADE` sobre las tablas de la app.
--
-- 2. Aun así, TODO cambio de esquema en producción debe:
--      a) Hacerse con BACKUP PREVIO (Supabase Dashboard > Database > Backups)
--      b) Revisarse en un proyecto/entorno de prueba primero
--      c) Ejecutarse MANUALMENTE en el SQL Editor de Supabase
--
-- 3. Si necesitas recrear una tabla desde cero, NO uses este script:
--    hazlo de forma explícita y consciente, con respaldo y migrando datos.
--
-- 4. Las políticas RLS existentes se recrean con DROP/CREATE para evitar
--    duplicados. Los permisos definidos son los mismos de siempre:
--    lectura pública donde corresponde y escritura solo del dueño
--    (auth.uid()) o de usuarios autenticados.
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- FUNCIÓN HELPER: handle_updated_at()
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('UTC'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLA: "currículums" (con tilde - usado por el frontend)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public."currículums" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  alias TEXT,
  edad INTEGER CHECK (edad >= 1 AND edad <= 30),
  ubicacion TEXT,
  bandera TEXT,
  color_pelaje TEXT,
  patron TEXT DEFAULT 'Regular',
  foto_url TEXT,
  horas_sueño INTEGER DEFAULT 12 CHECK (horas_sueño >= 12 AND horas_sueño <= 22),
  salario_deseado TEXT,
  compatibilidad TEXT DEFAULT 'Muy compatible',
  fondo TEXT DEFAULT 'pastel-blue',
  profesiones JSONB DEFAULT '[]'::jsonb,
  habilidades JSONB DEFAULT '{}'::jsonb,
  medallas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- Índices para currículums
CREATE INDEX IF NOT EXISTS idx_curriculums_user_id ON public."currículums"(user_id);
CREATE INDEX IF NOT EXISTS idx_curriculums_created_at ON public."currículums"(created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_curriculums_updated_at ON public."currículums";
CREATE TRIGGER update_curriculums_updated_at
BEFORE UPDATE ON public."currículums"
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS para currículums
ALTER TABLE public."currículums" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden leer su propio CV" ON public."currículums";
CREATE POLICY "Usuarios pueden leer su propio CV"
  ON public."currículums"
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio CV" ON public."currículums";
CREATE POLICY "Usuarios pueden insertar su propio CV"
  ON public."currículums"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio CV" ON public."currículums";
CREATE POLICY "Usuarios pueden actualizar su propio CV"
  ON public."currículums"
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio CV" ON public."currículums";
CREATE POLICY "Usuarios pueden eliminar su propio CV"
  ON public."currículums"
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLA: usuarios_gato (perfil felino para Social/Feed)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.usuarios_gato (
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

CREATE INDEX IF NOT EXISTS idx_usuarios_gato_user_id ON public.usuarios_gato(user_id);

DROP TRIGGER IF EXISTS update_usuarios_gato_updated_at ON public.usuarios_gato;
CREATE TRIGGER update_usuarios_gato_updated_at
BEFORE UPDATE ON public.usuarios_gato
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.usuarios_gato ENABLE ROW LEVEL SECURITY;

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

-- Lectura pública de perfiles (necesaria para Muro Social y Match Felino)
DROP POLICY IF EXISTS "Público puede leer perfiles gato" ON public.usuarios_gato;
CREATE POLICY "Público puede leer perfiles gato"
  ON public.usuarios_gato
  FOR SELECT
  USING (true);

-- ============================================================
-- TABLA: publicaciones_gato (Muro Social)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.publicaciones_gato (
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

CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_usuario_id ON public.publicaciones_gato(usuario_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_created_at ON public.publicaciones_gato(creado_en DESC);

DROP TRIGGER IF EXISTS update_publicaciones_gato_updated_at ON public.publicaciones_gato;
CREATE TRIGGER update_publicaciones_gato_updated_at
BEFORE UPDATE ON public.publicaciones_gato
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.publicaciones_gato ENABLE ROW LEVEL SECURITY;

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
-- TABLA: reacciones (likes en publicaciones)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.reacciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  publicacion_id UUID REFERENCES public.publicaciones_gato(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('me_gusta', 'meEncanta', 'meDivertí', 'meSorprendí', 'meEnojé', 'meArrepentí')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  UNIQUE(usuario_id, publicacion_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_reacciones_publicacion_id ON public.reacciones(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_reacciones_usuario_id ON public.reacciones(usuario_id);

ALTER TABLE public.reacciones ENABLE ROW LEVEL SECURITY;

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
-- TABLA: comentarios
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.comentarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  publicacion_id UUID REFERENCES public.publicaciones_gato(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_comentarios_publicacion_id ON public.comentarios(publicacion_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario_id ON public.comentarios(usuario_id);

DROP TRIGGER IF EXISTS update_comentarios_updated_at ON public.comentarios;
CREATE TRIGGER update_comentarios_updated_at
BEFORE UPDATE ON public.comentarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

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
-- FUNCIÓN: contar_reacciones_por_publicacion
-- Usada por src/lib/supabaseClient.js
-- ============================================================
CREATE OR REPLACE FUNCTION public.contar_reacciones_por_publicacion(p_publicacion_id UUID)
RETURNS TABLE(
  me_gusta BIGINT,
  me_encanta BIGINT,
  me_divertí BIGINT,
  me_sorprendí BIGINT,
  me_enojé BIGINT,
  me_arrepentí BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN r.tipo = 'me_gusta' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'meEncanta' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'meDivertí' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'meSorprendí' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'meEnojé' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN r.tipo = 'meArrepentí' THEN 1 ELSE 0 END), 0)::BIGINT
  FROM public.reacciones r
  WHERE r.publicacion_id = p_publicacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TABLA: matches (Match Felino)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gato_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'interesado' CHECK (estado IN ('interesado', 'aceptado', 'rechazado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_gato_id ON public.matches(gato_id);
CREATE INDEX IF NOT EXISTS idx_matches_estado ON public.matches(estado);

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario puede gestionar sus matches" ON public.matches;
CREATE POLICY "Usuario puede gestionar sus matches"
  ON public.matches
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Público puede ver matches aceptados" ON public.matches;
CREATE POLICY "Público puede ver matches aceptados"
  ON public.matches
  FOR SELECT
  USING (estado = 'aceptado');

-- ============================================================
-- TABLA: zodiac_preferences (Preferencias zodiacales)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.zodiac_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  zodiac_sign TEXT,
  chinese_zodiac TEXT,
  ciudad TEXT,
  zona TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_zodiac_preferences_user_id ON public.zodiac_preferences(user_id);

ALTER TABLE public.zodiac_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario puede gestionar sus preferencias" ON public.zodiac_preferences;
CREATE POLICY "Usuario puede gestionar sus preferencias"
  ON public.zodiac_preferences
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Público puede leer preferencias" ON public.zodiac_preferences;
CREATE POLICY "Público puede leer preferencias"
  ON public.zodiac_preferences
  FOR SELECT
  USING (true);

-- ============================================================
-- TABLA: desafios (Retos - compatibilidad con SocialFeed)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.desafios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  foto_template TEXT,
  puntos INTEGER DEFAULT 10,
  activo BOOLEAN DEFAULT TRUE,
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_desafios_activo ON public.desafios(activo);

ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;

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
-- TABLA: progreso_desafios
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.progreso_desafios (
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

CREATE INDEX IF NOT EXISTS idx_progreso_desafios_usuario_id ON public.progreso_desafios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_progreso_desafios_desafio_id ON public.progreso_desafios(desafio_id);

ALTER TABLE public.progreso_desafios ENABLE ROW LEVEL SECURITY;

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
-- TABLA: challenges (Retos - módulo Match, compatibilidad)
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  foto_template TEXT,
  puntos INTEGER DEFAULT 10,
  activo BOOLEAN DEFAULT TRUE,
  tipo TEXT DEFAULT 'individual' CHECK (tipo IN ('individual', 'duelo', 'comunidad')),
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_challenges_activo ON public.challenges(activo);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Público puede leer retos activos" ON public.challenges;
CREATE POLICY "Público puede leer retos activos"
  ON public.challenges
  FOR SELECT
  USING (activo = TRUE);

DROP POLICY IF EXISTS "Usuario admin puede gestionar retos" ON public.challenges;
CREATE POLICY "Usuario admin puede gestionar retos"
  ON public.challenges
  FOR ALL
  USING (auth.uid() = creado_por);

-- ============================================================
-- TABLA: challenge_participants
-- ============================================================
-- SEGURO: se crea solo si no existe. NO se borra la tabla ni sus datos.
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'inscrito' CHECK (estado IN ('inscrito', 'completado', 'fallido')),
  puntos_ganados INTEGER DEFAULT 0,
  comentario TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  completado_en TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);

DROP TRIGGER IF EXISTS update_challenge_participants_updated_at ON public.challenge_participants;
CREATE TRIGGER update_challenge_participants_updated_at
BEFORE UPDATE ON public.challenge_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario puede gestionar su participación" ON public.challenge_participants;
CREATE POLICY "Usuario puede gestionar su participación"
  ON public.challenge_participants
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Público puede ver participantes de retos" ON public.challenge_participants;
CREATE POLICY "Público puede ver participantes de retos"
  ON public.challenge_participants
  FOR SELECT
  USING (true);

-- ============================================================
-- COMPATIBILIDAD CON ESQUEMAS PREVIOS (ADD COLUMN IF NOT EXISTS)
-- ============================================================
-- Si las tablas ya existían de una migración anterior con menos columnas,
-- estas sentencias las completan SIN borrar datos ni filas.

-- currículums
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS ubicacion TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS bandera TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS color_pelaje TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS patron TEXT DEFAULT 'Regular';
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS horas_sueño INTEGER DEFAULT 12;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS salario_deseado TEXT;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS compatibilidad TEXT DEFAULT 'Muy compatible';
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS fondo TEXT DEFAULT 'pastel-blue';
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS profesiones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS habilidades JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS medallas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public."currículums" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- usuarios_gato (incluye columnas que usa el Match Felino)
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS alias TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS ubicacion TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS bandera TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS color_pelaje TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS patron TEXT DEFAULT 'Regular';
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS compatibilidad TEXT DEFAULT 'Muy compatible';
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS horas_sueño INTEGER DEFAULT 12;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS salario_deseado TEXT;
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.usuarios_gato ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- publicaciones_gato
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS texto TEXT;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS etiqueta_profesion TEXT;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS es_duelo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS usuarios_duelo UUID[] DEFAULT ARRAY[]::UUID[];
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS veces_visto INTEGER DEFAULT 0;
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.publicaciones_gato ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- reacciones
ALTER TABLE public.reacciones ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE public.reacciones ADD COLUMN IF NOT EXISTS publicacion_id UUID;
ALTER TABLE public.reacciones ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.reacciones ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- comentarios
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS publicacion_id UUID;
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS texto TEXT;
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS gato_id UUID;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'interesado';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- zodiac_preferences
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS chinese_zodiac TEXT;
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS zona TEXT;
ALTER TABLE public.zodiac_preferences ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- desafios
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS foto_template TEXT;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS puntos INTEGER DEFAULT 10;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS creado_por UUID;
ALTER TABLE public.desafios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- progreso_desafios
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS desafio_id UUID;
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS puntos_ganados INTEGER DEFAULT 0;
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS comentario TEXT;
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.progreso_desafios ADD COLUMN IF NOT EXISTS completado_en TIMESTAMP WITH TIME ZONE;

-- challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS nombre TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS foto_template TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS puntos INTEGER DEFAULT 10;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'individual';
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS creado_por UUID;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- challenge_participants
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS challenge_id UUID;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'inscrito';
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS puntos_ganados INTEGER DEFAULT 0;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS comentario TEXT;
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());
ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS completado_en TIMESTAMP WITH TIME ZONE;

-- Índices únicos (habilitan los ON CONFLICT del frontend sin duplicar filas).
-- Se crean de forma tolerante: si ya existen datos duplicados, se avisa
-- con NOTICE en lugar de abortar toda la migración.
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_gato_user_id
      ON public.usuarios_gato(user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear ux_usuarios_gato_user_id: %', SQLERRM;
  END;

  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_zodiac_preferences_user_id
      ON public.zodiac_preferences(user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear ux_zodiac_preferences_user_id: %', SQLERRM;
  END;

  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_reacciones_usuario_pub_tipo
      ON public.reacciones(usuario_id, publicacion_id, tipo);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear ux_reacciones_usuario_pub_tipo: %', SQLERRM;
  END;

  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_progreso_desafios_usuario_desafio
      ON public.progreso_desafios(usuario_id, desafio_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear ux_progreso_desafios_usuario_desafio: %', SQLERRM;
  END;

  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_challenge_participants_challenge_user
      ON public.challenge_participants(challenge_id, user_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo crear ux_challenge_participants_challenge_user: %', SQLERRM;
  END;
END $$;

-- ============================================================
-- STORAGE BUCKET: cat-photos
-- ============================================================
-- Crear bucket de forma segura (no falla si ya existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cat-photos',
  'cat-photos',
  true,
  5242880, -- 5MB límite
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Si el bucket ya existía, asegurar configuración esperada sin recrearlo.
-- Envolvemos en DO para que un error de permisos sobre storage.buckets
-- no aborte la migración (el bucket público ya existiría de todos modos).
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

-- Políticas de storage (idempotentes con DROP IF EXISTS)
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'cat-photos');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'cat-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'cat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'cat-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- DATOS DE EJEMPLO OPCIONALES (descomenta para poblar)
-- ============================================================

/*
-- Retos de ejemplo
INSERT INTO public.desafios (nombre, descripcion, foto_template, puntos) VALUES
  ('Primer Maullo', 'Comparte tu primer CV gatuno', '', 5),
  ('Ronroneo Pro', 'Completa 3 CVs con diferentes profesiones', '', 10),
  ('Gatito Social', 'Haz 5 reacciones en el Muro Social', '', 15)
ON CONFLICT DO NOTHING;

INSERT INTO public.challenges (nombre, descripcion, foto_template, puntos, tipo) VALUES
  ('Primer Maullo', 'Comparte tu primer CV gatuno', '', 5, 'individual'),
  ('Match Perfecto', 'Consigue tu primer match felino', '', 10, 'duelo')
ON CONFLICT DO NOTHING;
*/

-- ============================================================
-- RECARGA DEL SCHEMA CACHE DE POSTGREST
-- ============================================================
-- Necesario para que la API detecte tablas/relaciones recién creadas
-- y evitar errores del tipo "Could not find a relationship ... in the
-- schema cache".
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Descomenta para verificar tras ejecutar:

/*
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'currículums', 'usuarios_gato', 'publicaciones_gato',
  'reacciones', 'comentarios', 'matches',
  'zodiac_preferences', 'desafios', 'progreso_desafios',
  'challenges', 'challenge_participants'
)
ORDER BY table_name;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'cat-photos';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- Verificar que NO hay filas perdidas (conteos por tabla)
SELECT 'currículums' AS tabla, COUNT(*) FROM public."currículums"
UNION ALL SELECT 'usuarios_gato', COUNT(*) FROM public.usuarios_gato
UNION ALL SELECT 'publicaciones_gato', COUNT(*) FROM public.publicaciones_gato
UNION ALL SELECT 'reacciones', COUNT(*) FROM public.reacciones;
*/

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
