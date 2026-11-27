-- ############################################################################
-- ⛔ ARCHIVADO — NO EJECUTAR  /  ARCHIVED — DO NOT RUN
-- ############################################################################
--
-- Migración LEGACY conservada únicamente como referencia histórica.
-- Contiene `DROP TABLE ... CASCADE`, por lo que ejecutarla DESTRUIRÍA
-- datos existentes (CVs, publicaciones, reacciones, matches, etc.).
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
    'archive/0002_miaucv_init.sql';
END $$;

-- ############################################################################
-- CONTENIDO ORIGINAL (sin cambios) — solo referencia
-- ############################################################################

-- ============================================================
-- MiauCV - Inicialización de base de datos
-- Ejecutar en SQL Editor del panel de Supabase
-- ============================================================

-- Primero verificar si las tablas existen y obtener información
-- Esto permite ejecutar el script múltiples veces sin error

-- ============================================================
-- TABLA: currículums
-- ============================================================
DROP TABLE IF EXISTS public.curriculum CASCADE;
DROP TABLE IF EXISTS public.profesiones CASCADE;
DROP TABLE IF EXISTS public.habilidades CASCADE;
DROP TABLE IF EXISTS public.medallas CASCADE;

-- Tabla principal de currículums gatunos
CREATE TABLE public.curriculum (
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

-- ============================================================
-- TABLA: profesiones
-- ============================================================
CREATE TABLE public.profesiones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES public.curriculum(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nivel INTEGER CHECK (nivel >= 1 AND nivel <= 4),
  descripcion TEXT,
  emoji TEXT,
  is_combo BOOLEAN DEFAULT FALSE,
  combo_parent_id UUID REFERENCES public.profesiones(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: habilidades
-- ============================================================
CREATE TABLE public.habilidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES public.curriculum(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  icono TEXT,
  nivel INTEGER DEFAULT 1 CHECK (nivel >= 1 AND nivel <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TABLA: medallas
-- ============================================================
CREATE TABLE public.medallas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curriculum_id UUID REFERENCES public.curriculum(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  emoji TEXT,
  color TEXT CHECK (color IN ('gold', 'silver', 'bronze')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW())
);

-- ============================================================
-- TRIGGERS PARA ACTUALIZACIÓN DE FECHA
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('UTC'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PÓLIZAS DE ACCESO (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.curriculum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medallas ENABLE ROW LEVEL SECURITY;

-- Políticas para curriculum
DROP POLICY IF EXISTS "Usuarios pueden leer su propio CV" ON public.curriculum;
CREATE POLICY "Usuarios pueden leer su propio CV"
  ON public.curriculum
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio CV" ON public.curriculum;
CREATE POLICY "Usuarios pueden insertar su propio CV"
  ON public.curriculum
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio CV" ON public.curriculum;
CREATE POLICY "Usuarios pueden actualizar su propio CV"
  ON public.curriculum
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar su propio CV" ON public.curriculum;
CREATE POLICY "Usuarios pueden eliminar su propio CV"
  ON public.curriculum
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para profesiones
DROP POLICY IF EXISTS "Usuarios pueden leer profesiones de su CV" ON public.profesiones;
CREATE POLICY "Usuarios pueden leer profesiones de su CV"
  ON public.profesiones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden insertar profesiones en su CV" ON public.profesiones;
CREATE POLICY "Usuarios pueden insertar profesiones en su CV"
  ON public.profesiones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar profesiones de su CV" ON public.profesiones;
CREATE POLICY "Usuarios pueden actualizar profesiones de su CV"
  ON public.profesiones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.profesiones p ON p.curriculum_id = c.id
      WHERE p.id = profesiones.id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar profesiones de su CV" ON public.profesiones;
CREATE POLICY "Usuarios pueden eliminar profesiones de su CV"
  ON public.profesiones
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.profesiones p ON p.curriculum_id = c.id
      WHERE p.id = profesiones.id AND c.user_id = auth.uid()
    )
  );

-- Políticas para habilidades
DROP POLICY IF EXISTS "Usuarios pueden leer habilidades de su CV" ON public.habilidades;
CREATE POLICY "Usuarios pueden leer habilidades de su CV"
  ON public.habilidades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden insertar habilidades en su CV" ON public.habilidades;
CREATE POLICY "Usuarios pueden insertar habilidades en su CV"
  ON public.habilidades
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar habilidades de su CV" ON public.habilidades;
CREATE POLICY "Usuarios pueden actualizar habilidades de su CV"
  ON public.habilidades
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.habilidades h ON h.curriculum_id = c.id
      WHERE h.id = habilidades.id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar habilidades de su CV" ON public.habilidades;
CREATE POLICY "Usuarios pueden eliminar habilidades de su CV"
  ON public.habilidades
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.habilidades h ON h.curriculum_id = c.id
      WHERE h.id = habilidades.id AND c.user_id = auth.uid()
    )
  );

-- Políticas para medallas
DROP POLICY IF EXISTS "Usuarios pueden leer medallas de su CV" ON public.medallas;
CREATE POLICY "Usuarios pueden leer medallas de su CV"
  ON public.medallas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden insertar medallas en su CV" ON public.medallas;
CREATE POLICY "Usuarios pueden insertar medallas en su CV"
  ON public.medallas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      WHERE c.id = curriculum_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden actualizar medallas de su CV" ON public.medallas;
CREATE POLICY "Usuarios pueden actualizar medallas de su CV"
  ON public.medallas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.medallas m ON m.curriculum_id = c.id
      WHERE m.id = medallas.id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuarios pueden eliminar medallas de su CV" ON public.medallas;
CREATE POLICY "Usuarios pueden eliminar medallas de su CV"
  ON public.medallas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum c 
      JOIN public.medallas m ON m.curriculum_id = c.id
      WHERE m.id = medallas.id AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS PARA AUTOMATIZAR ACTUALIZACIÓN DE FECHA
-- ============================================================
DROP TRIGGER IF EXISTS update_curriculum_updated_at ON public.curriculum;
CREATE TRIGGER update_curriculum_updated_at
BEFORE UPDATE ON public.curriculum
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_curriculum_user_id ON public.curriculum(user_id);
CREATE INDEX IF NOT EXISTS idx_profesiones_curriculum_id ON public.profesiones(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_habilidades_curriculum_id ON public.habilidades(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_medallas_curriculum_id ON public.medallas(curriculum_id);

-- ============================================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================================
-- Nota: El bucket 'cat-photos' debe ser creado manualmente en el panel de Supabase
-- con configuración de almacenamiento público o privado según sea necesario