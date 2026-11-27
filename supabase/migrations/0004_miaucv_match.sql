-- ============================================================
-- MiauCV - Módulo de Match Felino
-- Ejecutar en SQL Editor del panel de Supabase
-- ============================================================

-- ============================================================
-- TABLA: matches (matches entre gatos)
-- ============================================================
DROP TABLE IF EXISTS public.matches CASCADE;

CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gato_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'interesado' CHECK (estado IN ('interesado', 'aceptado', 'rechazado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW()),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: zodiac_preferences (preferencias de zodiaco)
-- ============================================================
DROP TABLE IF EXISTS public.zodiac_preferences CASCADE;

CREATE TABLE public.zodiac_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  zodiac_sign TEXT, -- Capricornio, Aries, etc.
  chinese_zodiac TEXT, -- Rat, Tiger, etc.
  ciudad TEXT,
  zona TEXT, -- barrio, zona, etc.
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: challenges (retos/duelos)
-- ============================================================
DROP TABLE IF EXISTS public.challenges CASCADE;

CREATE TABLE public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  foto_template TEXT, -- URL de plantilla
  puntos INTEGER DEFAULT 10,
  activo BOOLEAN DEFAULT TRUE,
  tipo TEXT DEFAULT 'individual' CHECK (tipo IN ('individual', 'duelo', 'comunidad')),
  creado_por UUID REFERENCES auth.users(id),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: challenge_participants (participantes de retos)
-- ============================================================
DROP TABLE IF EXISTS public.challenge_participants CASCADE;

CREATE TABLE public.challenge_participants (
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

-- ============================================================
-- TRIGGERS PARA ACTUALIZACIÓN DE FECHA
-- ============================================================
DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_zodiac_preferences_updated_at ON public.zodiac_preferences;
CREATE TRIGGER update_zodiac_preferences_updated_at
BEFORE UPDATE ON public.zodiac_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_challenge_participants_updated_at ON public.challenge_participants;
CREATE TRIGGER update_challenge_participants_updated_at
BEFORE UPDATE ON public.challenge_participants
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PÓLIZAS DE ACCESO (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zodiac_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas para matches
-- ============================================================
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
-- Políticas para zodiac_preferences
-- ============================================================
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
-- Políticas para challenges
-- ============================================================
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
-- Políticas para challenge_participants
-- ============================================================
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
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON public.matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_gato_id ON public.matches(gato_id);
CREATE INDEX IF NOT EXISTS idx_matches_estado ON public.matches(estado);
CREATE INDEX IF NOT EXISTS idx_zodiac_preferences_user_id ON public.zodiac_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_activo ON public.challenges(activo);

-- ============================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================

/*
NOTAS DE IMPLEMENTACIÓN:

1. El bucket 'cat-photos' debe ser creado manualmente en Supabase Storage:
   - Ir a Storage > Buckets > New bucket
   - Nombre: cat-photos
   - Public: true

2. Las preferencias de zodiaco se pueden establecer desde el CV al actualizar:
   - El signo del zodiaco se calcula automáticamente desde la edad
   - El horóscopo chino se calcula desde el año de nacimiento (si se conoce)

3. Para crear un reto inicial, ejecutar:
   INSERT INTO desafios (nombre, descripcion, foto_template, puntos, tipo)
   VALUES ('Primer Maullo', 'Comparte tu primer CV gatuno', '', 5, 'individual');
*/