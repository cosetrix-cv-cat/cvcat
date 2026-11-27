-- ============================================================
-- MiauCV - Fix Social Relations and Schema Cache
-- Ejecutar en SQL Editor del panel de Supabase
-- Versión: 3.0 - Idempotente - Con backfill para FK
-- ============================================================

-- ============================================================
-- 0. BACKFILL: SANEAR FILAS HUÉRFANAS ANTES DE CREAR FK
-- ============================================================
-- El error 23503 ocurre porque hay usuario_id en publicaciones_gato
-- que no existen en usuarios_gato. Hacemos backfill idempotente ANTES
-- de crear la FK.

-- 0.1 Insertar usuarios_gato faltantes desde publicaciones_gato
-- (usa user_id de auth.users como base, completa con datos de currículums si hay)
INSERT INTO public.usuarios_gato (user_id, nombre, alias, foto_url, edad, ubicacion, bandera, color_pelaje, patron, compatibilidad, horas_sueño, salario_deseado)
SELECT 
  p.usuario_id AS user_id,
  COALESCE(c.nombre, 'Gatito') AS nombre,
  COALESCE(c.alias, '🐱 Gatito') AS alias,
  COALESCE(c.foto_url, '') AS foto_url,
  COALESCE(c.edad, 2) AS edad,
  COALESCE(c.ubicacion, '') AS ubicacion,
  COALESCE(c.bandera, '🇺🇸') AS bandera,
  COALESCE(c.color_pelaje, '') AS color_pelaje,
  COALESCE(c.patron, 'Regular') AS patron,
  COALESCE(c.compatibilidad, 'Muy compatible') AS compatibilidad,
  COALESCE(c.horas_sueño, 12) AS horas_sueño,
  COALESCE(c.salario_deseado, '') AS salario_deseado
FROM public.publicaciones_gato p
LEFT JOIN public."currículums" c ON c.user_id = p.usuario_id
WHERE p.usuario_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 0.2 Para cualquier usuario_id que quede sin perfil (ej. usuarios que solo tienen publicaciones pero no CV)
-- Crear perfil mínimo desde auth.users
INSERT INTO public.usuarios_gato (user_id, nombre, alias, compatibilidad)
SELECT 
  au.id AS user_id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Gatito') AS nombre,
  COALESCE(au.raw_user_meta_data->>'alias', '🐱 Gatito') AS alias,
  'Muy compatible' AS compatibilidad
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios_gato ug WHERE ug.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 1. ASEGURAR RELACIÓN FK ENTRE publicaciones_gato Y usuarios_gato
-- ============================================================
-- El error "Could not find a relationship between 'publicaciones_gato' 
-- and 'usuarios_gato' in the schema cache" se debe a que PostgREST
-- no detecta la foreign key relationship. Agregamos la FK explícita.

-- Primero, asegurar que usuarios_gato existe (ya creado en 0001)
-- y que publicaciones_gato.usuario_id referencia auth.users(id)

-- Agregar constraint FK a auth.users si no existe (idempotente)
DO $$
BEGIN
  -- Verificar si la constraint ya existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'publicaciones_gato_usuario_id_fkey' 
    AND table_name = 'publicaciones_gato'
  ) THEN
    -- Agregar FK a auth.users si no existe
    ALTER TABLE public.publicaciones_gato 
    ADD CONSTRAINT publicaciones_gato_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar FK explícita a usuarios_gato para que PostgREST detecte la relación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'publicaciones_gato_usuarios_gato_fkey' 
    AND table_name = 'publicaciones_gato'
  ) THEN
    ALTER TABLE public.publicaciones_gato 
    ADD CONSTRAINT publicaciones_gato_usuarios_gato_fkey 
    FOREIGN KEY (usuario_id) REFERENCES public.usuarios_gato(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Crear índice para optimizar el join
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_usuario_id ON public.publicaciones_gato(usuario_id);

-- ============================================================
-- 2. ASEGURAR QUE usuarios_gato TENGA LOS CAMPOS NECESARIOS
-- ============================================================
-- Los campos que el frontend espera en el join

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS nombre TEXT;

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS alias TEXT;

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS foto_url TEXT;

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS compatibilidad TEXT DEFAULT 'Muy compatible';

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS edad INTEGER;

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS ubicacion TEXT;

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS bandera TEXT;

-- ============================================================
-- 3. CREAR VISTA MATERIALIZADA PARA OPTIMIZAR JOINS
-- ============================================================
-- Vista que pre-joinea publicaciones con usuarios para evitar
-- problemas de schema cache en PostgREST

DROP VIEW IF EXISTS public.publicaciones_con_usuarios;
CREATE OR REPLACE VIEW public.publicaciones_con_usuarios AS
SELECT 
  p.id,
  p.usuario_id,
  p.foto_url,
  p.texto,
  p.etiqueta_profesion,
  p.es_duelo,
  p.usuarios_duelo,
  p.veces_visto,
  p.creado_en,
  p.actualizado_en,
  u.nombre AS usuario_nombre,
  u.alias AS usuario_alias,
  u.foto_url AS usuario_foto_url,
  u.edad AS usuario_edad,
  u.ubicacion AS usuario_ubicacion,
  u.bandera AS usuario_bandera,
  u.compatibilidad AS usuario_compatibilidad
FROM public.publicaciones_gato p
LEFT JOIN public.usuarios_gato u ON p.usuario_id = u.user_id;

-- RLS para la vista
ALTER VIEW public.publicaciones_con_usuarios SET (security_invoker = true);

-- ============================================================
-- 4. FUNCIÓN RPC: obtener_publicaciones_con_usuarios
-- ============================================================
-- Función que el frontend puede llamar directamente para evitar
-- problemas de schema cache en PostgREST

DROP FUNCTION IF EXISTS public.obtener_publicaciones_con_usuarios(INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION public.obtener_publicaciones_con_usuarios(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  usuario_id UUID,
  foto_url TEXT,
  texto TEXT,
  etiqueta_profesion TEXT,
  es_duelo BOOLEAN,
  usuarios_duelo UUID[],
  veces_visto INTEGER,
  creado_en TIMESTAMP WITH TIME ZONE,
  actualizado_en TIMESTAMP WITH TIME ZONE,
  usuario_nombre TEXT,
  usuario_alias TEXT,
  usuario_foto_url TEXT,
  usuario_edad INTEGER,
  usuario_ubicacion TEXT,
  usuario_bandera TEXT,
  usuario_compatibilidad TEXT,
  reacciones_count BIGINT,
  comentarios_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.usuario_id,
    p.foto_url,
    p.texto,
    p.etiqueta_profesion,
    p.es_duelo,
    p.usuarios_duelo,
    p.veces_visto,
    p.creado_en,
    p.actualizado_en,
    u.nombre AS usuario_nombre,
    u.alias AS usuario_alias,
    u.foto_url AS usuario_foto_url,
    u.edad AS usuario_edad,
    u.ubicacion AS usuario_ubicacion,
    u.bandera AS usuario_bandera,
    u.compatibilidad AS usuario_compatibilidad,
    (SELECT COUNT(*) FROM public.reacciones r WHERE r.publicacion_id = p.id) AS reacciones_count,
    (SELECT COUNT(*) FROM public.comentarios c WHERE c.publicacion_id = p.id) AS comentarios_count
  FROM public.publicaciones_gato p
  LEFT JOIN public.usuarios_gato u ON p.usuario_id = u.user_id
  ORDER BY p.creado_en DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. POLÍTICAS RLS PARA publicaciones_gato
-- ============================================================
-- Asegurar que las políticas estén correctas

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
-- 6. POLÍTICAS RLS PARA usuarios_gato
-- ============================================================
ALTER TABLE public.usuarios_gato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Público puede leer perfiles gato" ON public.usuarios_gato;
CREATE POLICY "Público puede leer perfiles gato"
  ON public.usuarios_gato
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Usuario puede insertar su perfil gato" ON public.usuarios_gato;
CREATE POLICY "Usuario puede insertar su perfil gato"
  ON public.usuarios_gato
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede actualizar su perfil gato" ON public.usuarios_gato;
CREATE POLICY "Usuario puede actualizar su perfil gato"
  ON public.usuarios_gato
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuario puede eliminar su perfil gato" ON public.usuarios_gato;
CREATE POLICY "Usuario puede eliminar su perfil gato"
  ON public.usuarios_gato
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. FUNCIÓN: Asegurar que usuarios_gato existe para un usuario
-- ============================================================
-- Esta función puede ser llamada desde el frontend para crear
-- un perfil gato si no existe

DROP FUNCTION IF EXISTS public.asegurar_perfil_gato(UUID);
CREATE OR REPLACE FUNCTION public.asegurar_perfil_gato(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_perfil_id UUID;
  v_cv RECORD;
BEGIN
  -- Verificar si ya existe
  SELECT id INTO v_perfil_id FROM public.usuarios_gato WHERE user_id = p_user_id;
  
  IF v_perfil_id IS NOT NULL THEN
    RETURN v_perfil_id;
  END IF;
  
  -- Obtener datos del CV para crear el perfil
  SELECT * INTO v_cv FROM public."currículums" WHERE user_id = p_user_id;
  
  -- Crear perfil gato
  INSERT INTO public.usuarios_gato (
    user_id,
    nombre,
    alias,
    foto_url,
    edad,
    ubicacion,
    bandera,
    color_pelaje,
    patron,
    compatibilidad,
    horas_sueño,
    salario_deseado
  ) VALUES (
    p_user_id,
    COALESCE(v_cv.nombre, 'Gatito'),
    COALESCE(v_cv.alias, '🐱 Gatito'),
    COALESCE(v_cv.foto_url, ''),
    COALESCE(v_cv.edad, 2),
    COALESCE(v_cv.ubicacion, ''),
    COALESCE(v_cv.bandera, '🇺🇸'),
    COALESCE(v_cv.color_pelaje, ''),
    COALESCE(v_cv.patron, 'Regular'),
    COALESCE(v_cv.compatibilidad, 'Muy compatible'),
    COALESCE(v_cv.horas_sueño, 12),
    COALESCE(v_cv.salario_deseado, '')
  )
  RETURNING id INTO v_perfil_id;
  
  RETURN v_perfil_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. TRIGGER: Auto-crear usuarios_gato al crear/actualizar currículums
-- ============================================================
-- Cuando se guarda un CV, asegurar que existe el perfil gato

DROP TRIGGER IF EXISTS trigger_asegurar_perfil_gato ON public."currículums";
CREATE TRIGGER trigger_asegurar_perfil_gato
AFTER INSERT OR UPDATE ON public."currículums"
FOR EACH ROW
EXECUTE FUNCTION public.asegurar_perfil_gato_trigger();

-- Función trigger
DROP FUNCTION IF EXISTS public.asegurar_perfil_gato_trigger();
CREATE OR REPLACE FUNCTION public.asegurar_perfil_gato_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.asegurar_perfil_gato(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. RECARGAR SCHEMA CACHE DE POSTGREST
-- ============================================================
-- Este es el paso crítico para resolver el error:
-- "Could not find a relationship between 'publicaciones_gato' 
-- and 'usuarios_gato' in the schema cache"
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 10. ÍNDICES ADICIONALES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_usuario_id ON public.publicaciones_gato(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_gato_user_id ON public.usuarios_gato(user_id);
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_created_at ON public.publicaciones_gato(creado_en DESC);

-- ============================================================
-- 11. VERIFICACIÓN FINAL
-- ============================================================
-- Descomenta para verificar tras ejecutar:

/*
-- Verificar relación FK
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'publicaciones_gato';

-- Verificar funciones RPC
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'obtener_publicaciones_con_usuarios',
    'asegurar_perfil_gato',
    'asegurar_perfil_gato_trigger'
  );

-- Probar función obtener_publicaciones_con_usuarios
-- SELECT * FROM public.obtener_publicaciones_con_usuarios(5, 0);

-- Probar función asegurar_perfil_gato
-- SELECT public.asegurar_perfil_gato('user-uuid-here');
*/

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================