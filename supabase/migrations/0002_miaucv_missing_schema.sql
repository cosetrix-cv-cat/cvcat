-- ============================================================
-- MiauCV - Migración Complementaria (Huecos Detectados)
-- Ejecutar en SQL Editor del panel de Supabase
-- Versión: 1.0 - Compatible con frontend actual (src/lib/supabaseClient.js)
-- Idempotente: se puede ejecutar múltiples veces sin errores
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. AGREGAR COLUMNAS FALTANTES EN usuarios_gato
-- ============================================================
-- La función obtenerMatches() en src/lib/supabaseClient.js:548-583
-- hace join con usuarios_gato esperando columna 'compatibilidad'

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS compatibilidad TEXT DEFAULT 'Muy compatible';

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS horas_sueño INTEGER DEFAULT 12 CHECK (horas_sueño >= 12 AND horas_sueño <= 22);

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS salario_deseado TEXT;

-- Comentario para documentar
COMMENT ON COLUMN public.usuarios_gato.compatibilidad IS 'Nivel de compatibilidad con otros gatos (usado en Match Felino)';
COMMENT ON COLUMN public.usuarios_gato.horas_sueño IS 'Horas de sueño diarias (sincronizado desde CV)';
COMMENT ON COLUMN public.usuarios_gato.salario_deseado IS 'Salario deseado (sincronizado desde CV)';

-- ============================================================
-- 2. NORMALIZAR NOMBRE DE COLUMNA DE TIMESTAMP EN usuarios_gato
-- ============================================================
-- Algunas tablas usan 'updated_at', otras 'actualizado_en'
-- Agregar 'updated_at' como alias para consistencia con handle_updated_at()

ALTER TABLE public.usuarios_gato
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('UTC'::text, NOW());

-- Trigger para mantener updated_at sincronizado con actualizado_en
DROP TRIGGER IF EXISTS update_usuarios_gato_updated_at ON public.usuarios_gato;
CREATE TRIGGER update_usuarios_gato_updated_at
BEFORE UPDATE ON public.usuarios_gato
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Mantener actualizado_en también actualizado (backfill)
UPDATE public.usuarios_gato SET updated_at = actualizado_en WHERE updated_at IS NULL;

-- ============================================================
-- 3. AGREGAR COLUMNAS FALTANTES EN currículums PARA CONSISTENCIA
-- ============================================================
-- Algunas consultas esperan estos campos

ALTER TABLE public."currículums"
ADD COLUMN IF NOT EXISTS zodiac_sign TEXT;

ALTER TABLE public."currículums"
ADD COLUMN IF NOT EXISTS chinese_zodiac TEXT;

ALTER TABLE public."currículums"
ADD COLUMN IF NOT EXISTS ciudad TEXT;

ALTER TABLE public."currículums"
ADD COLUMN IF NOT EXISTS zona TEXT;

COMMENT ON COLUMN public."currículums".zodiac_sign IS 'Signo zodiacal occidental (calculado desde edad)';
COMMENT ON COLUMN public."currículums".chinese_zodiac IS 'Signo zodiacal chino (calculado desde año nacimiento)';
COMMENT ON COLUMN public."currículums".ciudad IS 'Ciudad para filtros de Match Felino';
COMMENT ON COLUMN public."currículums".zona IS 'Zona/barrio para filtros de proximidad';

-- ============================================================
-- 4. FUNCIÓN RPC: CALCULAR COMPATIBILIDAD ENTRE GATOS
-- ============================================================
-- Mueve la lógica de calculateCompatibility() del frontend a la BD
-- Usada por Match Felino para calcular % de compatibilidad

DROP FUNCTION IF EXISTS public.calcular_compatibilidad_gatos(UUID, UUID);
CREATE OR REPLACE FUNCTION public.calcular_compatibilidad_gatos(p_user_id UUID, p_gato_id UUID)
RETURNS TABLE(
  percentage INTEGER,
  explanation TEXT,
  zodiac1 TEXT,
  zodiac2 TEXT,
  zodiac1emoji TEXT,
  zodiac2emoji TEXT,
  factors JSONB
) AS $$
DECLARE
  v_cat1 RECORD;
  v_cat2 RECORD;
  v_zodiac1 RECORD;
  v_zodiac2 RECORD;
  v_factors JSONB := '[]'::jsonb;
  v_total_points INTEGER := 0;
BEGIN
  -- Obtener datos de ambos gatos desde currículums
  SELECT * INTO v_cat1 FROM public."currículums" WHERE user_id = p_user_id;
  SELECT * INTO v_cat2 FROM public."currículums" WHERE user_id = p_gato_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 'Datos insuficientes', '', '', '', '', '[]'::jsonb;
    RETURN;
  END IF;

  -- Calcular zodiaco occidental basado en edad
  v_zodiac1 := public.get_western_zodiac(v_cat1.edad);
  v_zodiac2 := public.get_western_zodiac(v_cat2.edad);

  -- Factor 1: Mismo signo zodiacal
  IF v_zodiac1.sign = v_zodiac2.sign THEN
    v_factors := v_factors || jsonb_build_object(
      'weight', 30,
      'text', 'Misma energía zodiacal'
    );
    v_total_points := v_total_points + 30;
  END IF;

  -- Factor 2: Compatibilidad elemental
  IF public.elementos_compatibles(v_zodiac1.element, v_zodiac2.element) THEN
    v_factors := v_factors || jsonb_build_object(
      'weight', 20,
      'text', 'Elementos ' || public.elementos_compatibles(v_zodiac1.element, v_zodiac2.element)
    );
    v_total_points := v_total_points + 20;
  END IF;

  -- Factor 3: Mismo vecindario
  IF v_cat1.ubicacion = v_cat2.ubicacion THEN
    v_factors := v_factors || jsonb_build_object(
      'weight', 10,
      'text', 'Mismo vecindario'
    );
    v_total_points := v_total_points + 10;
  END IF;

  -- Factor 4: Profesiones complementarias (bonus)
  IF v_cat1.profesiones IS NOT NULL AND v_cat2.profesiones IS NOT NULL THEN
    -- Lógica simplificada: si comparten al menos una profesión
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_cat1.profesiones) AS p1(prof)
      INTERSECT
      SELECT 1 FROM jsonb_array_elements_text(v_cat2.profesiones) AS p2(prof)
    ) THEN
      v_factors := v_factors || jsonb_build_object(
        'weight', 15,
        'text', 'Profesión compartida'
      );
      v_total_points := v_total_points + 15;
    END IF;
  END IF;

  -- Calcular porcentaje final (máx 100)
  v_total_points := LEAST(v_total_points, 100);

  -- Generar explicación
  DECLARE v_explanation TEXT;
  BEGIN
    IF v_total_points >= 80 THEN
      v_explanation := '🌟 ¡Alta compatibilidad! Son como dos galletas del mismo paquete. Perfectos para compartir ronroneos y siestas.';
    ELSIF v_total_points >= 50 THEN
      v_explanation := '😸 Buena onda. Sus energías se complementan en corridas de pelota y caza de sombras. Podrían ser vecinos felices.';
    ELSIF v_total_points >= 30 THEN
      v_explanation := '🤔 Entre amigos. Un poco como dos gatos viendo una rata: competencia amistosa y espectáculo garantizado. Un reto interesante.';
    ELSE
      v_explanation := '❌ Matrimonio arreglado por humanos. Tal vez deben esperar más tiempo para conocerse.';
    END IF;
  END;

  RETURN QUERY SELECT 
    v_total_points,
    v_explanation,
    v_zodiac1.name,
    v_zodiac2.name,
    v_zodiac1.emoji,
    v_zodiac2.emoji,
    v_factors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. FUNCIONES AUXILIARES PARA ZODIACO Y ELEMENTOS
-- ============================================================

-- Zodiaco occidental basado en edad (simplificado)
DROP FUNCTION IF EXISTS public.get_western_zodiac(INTEGER);
CREATE OR REPLACE FUNCTION public.get_western_zodiac(p_age INTEGER)
RETURNS TABLE(sign TEXT, name TEXT, emoji TEXT, element TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    ('capricorn', 'Capricornio', '🐐', 'tierra'),
    ('aquarius', 'Aquarius', '🐟', 'aire'),
    ('pisces', 'Pisces', '🐠', 'agua'),
    ('aries', 'Aries', '⚡', 'fuego'),
    ('taurus', 'Taurus', '🐂', 'tierra'),
    ('gemini', 'Gemini', '⚛️', 'aire'),
    ('cancer', 'Cancer', '🦀', 'agua'),
    ('leo', 'Leo', '🦁', 'fuego'),
    ('virgo', 'Virgo', '🐿️', 'tierra'),
    ('libra', 'Libra', '⚖️', 'aire'),
    ('scorpio', 'Scorpio', '🦂', 'agua'),
    ('sagittarius', 'Sagittarius', '🐎', 'fuego')
  ) AS z(sign, name, emoji, element)
  WHERE z.sign = (ARRAY['capricorn','aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius'])[((p_age - 1) % 12) + 1];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compatibilidad elemental
DROP FUNCTION IF EXISTS public.elementos_compatibles(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.elementos_compatibles(p_element1 TEXT, p_element2 TEXT)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  -- Definir compatibilidades
  v_result := CASE
    WHEN p_element1 = 'tierra' AND p_element2 = 'fuego' THEN 'amasada'
    WHEN p_element1 = 'tierra' AND p_element2 = 'aire' THEN 'complementaria'
    WHEN p_element1 = 'tierra' AND p_element2 = 'tierra' THEN 'respetuosa'
    WHEN p_element1 = 'tierra' AND p_element2 = 'agua' THEN 'equilibrada'
    WHEN p_element1 = 'tierra' AND p_element2 = 'metal' THEN 'estable'
    WHEN p_element1 = 'tierra' AND p_element2 = 'madera' THEN 'creciente'
    
    WHEN p_element1 = 'aire' AND p_element2 = 'fuego' THEN 'vibrante'
    WHEN p_element1 = 'aire' AND p_element2 = 'aire' THEN 'chisposa'
    WHEN p_element1 = 'aire' AND p_element2 = 'tierra' THEN 'complementaria'
    WHEN p_element1 = 'aire' AND p_element2 = 'agua' THEN 'reflexiva'
    WHEN p_element1 = 'aire' AND p_element2 = 'metal' THEN 'poderosa'
    WHEN p_element1 = 'aire' AND p_element2 = 'madera' THEN 'expansiva'
    
    WHEN p_element1 = 'agua' AND p_element2 = 'fuego' THEN 'explosiva'
    WHEN p_element1 = 'agua' AND p_element2 = 'aire' THEN 'suave'
    WHEN p_element1 = 'agua' AND p_element2 = 'tierra' THEN 'calmada'
    WHEN p_element1 = 'agua' AND p_element2 = 'agua' THEN 'profunda'
    WHEN p_element1 = 'agua' AND p_element2 = 'metal' THEN 'misteriosa'
    WHEN p_element1 = 'agua' AND p_element2 = 'madera' THEN 'fluida'
    
    WHEN p_element1 = 'fuego' AND p_element2 = 'fuego' THEN 'apasionada'
    WHEN p_element1 = 'fuego' AND p_element2 = 'aire' THEN 'encendida'
    WHEN p_element1 = 'fuego' AND p_element2 = 'tierra' THEN 'ardiente'
    WHEN p_element1 = 'fuego' AND p_element2 = 'agua' THEN 'apacible'
    WHEN p_element1 = 'fuego' AND p_element2 = 'metal' THEN 'intensa'
    WHEN p_element1 = 'fuego' AND p_element2 = 'madera' THEN 'ardiente'
    
    WHEN p_element1 = 'metal' AND p_element2 = 'fuego' THEN 'fina'
    WHEN p_element1 = 'metal' AND p_element2 = 'aire' THEN 'brillante'
    WHEN p_element1 = 'metal' AND p_element2 = 'tierra' THEN 'sólida'
    WHEN p_element1 = 'metal' AND p_element2 = 'agua' THEN 'poderosa'
    WHEN p_element1 = 'metal' AND p_element2 = 'metal' THEN 'precisa'
    WHEN p_element1 = 'metal' AND p_element2 = 'madera' THEN 'flexible'
    
    WHEN p_element1 = 'madera' AND p_element2 = 'fuego' THEN 'viva'
    WHEN p_element1 = 'madera' AND p_element2 = 'aire' THEN 'creciente'
    WHEN p_element1 = 'madera' AND p_element2 = 'tierra' THEN 'fértil'
    WHEN p_element1 = 'madera' AND p_element2 = 'agua' THEN 'vibrante'
    WHEN p_element1 = 'madera' AND p_element2 = 'metal' THEN 'flexible'
    WHEN p_element1 = 'madera' AND p_element2 = 'madera' THEN 'estable'
    
    ELSE NULL
  END;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. FUNCIÓN RPC: OBTENER GATOS PARA MATCH (OPTIMIZADA)
-- ============================================================
-- Reemplaza la consulta compleja del frontend con una función BD

DROP FUNCTION IF EXISTS public.obtener_gatos_para_match(UUID, JSONB);
CREATE OR REPLACE FUNCTION public.obtener_gatos_para_match(p_user_id UUID, p_filtros JSONB DEFAULT '{}'::jsonb)
RETURNS TABLE(
  user_id UUID,
  nombre TEXT,
  alias TEXT,
  edad INTEGER,
  ubicacion TEXT,
  color_pelaje TEXT,
  bandera TEXT,
  foto_url TEXT,
  horas_sueño INTEGER,
  compatibilidad TEXT,
  profesiones JSONB,
  medallas JSONB,
  zodiac TEXT,
  zodiac_emoji TEXT,
  zodiac_element TEXT,
  chinese_zodiac TEXT,
  chinese_emoji TEXT,
  ciudad TEXT,
  zona TEXT
) AS $$
DECLARE
  v_ciudad TEXT := p_filtros->>'ciudad';
  v_zodiac TEXT := p_filtros->>'zodiac';
  v_chinese_zodiac TEXT := p_filtros->>'chineseZodiac';
BEGIN
  RETURN QUERY
  SELECT 
    c.user_id,
    c.nombre,
    c.alias,
    c.edad,
    c.ubicacion,
    c.color_pelaje,
    c.bandera,
    c.foto_url,
    c.horas_sueño,
    c.compatibilidad,
    c.profesiones,
    c.medallas,
    wz.sign AS zodiac,
    wz.emoji AS zodiac_emoji,
    wz.element AS zodiac_element,
    cz.sign AS chinese_zodiac,
    cz.emoji AS chinese_emoji,
    c.ciudad,
    c.zona
  FROM public."currículums" c
  CROSS JOIN LATERAL public.get_western_zodiac(c.edad) wz
  CROSS JOIN LATERAL public.get_chinese_zodiac(EXTRACT(YEAR FROM NOW()) - c.edad) cz
  WHERE c.user_id != p_user_id
    AND (v_ciudad IS NULL OR v_ciudad = '' OR c.ciudad = v_ciudad)
    AND (v_zodiac IS NULL OR v_zodiac = '' OR wz.sign = v_zodiac)
    AND (v_chinese_zodiac IS NULL OR v_chinese_zodiac = '' OR cz.sign = v_chinese_zodiac)
  ORDER BY c.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Zodiaco chino basado en año de nacimiento (aprox desde edad)
DROP FUNCTION IF EXISTS public.get_chinese_zodiac(INTEGER);
CREATE OR REPLACE FUNCTION public.get_chinese_zodiac(p_birth_year INTEGER)
RETURNS TABLE(sign TEXT, name TEXT, emoji TEXT, element TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    ('rat', 'Rata', '🐭', 'madera'),
    ('ox', 'Buey', '🐂', 'madera'),
    ('tiger', 'Tigre', '🐅', 'fuego'),
    ('rabbit', 'Conejo', '🐇', 'fuego'),
    ('dragon', 'Dragón', '🐉', 'tierra'),
    ('snake', 'Serpiente', '🐍', 'tierra'),
    ('horse', 'Caballo', '🐴', 'metal'),
    ('goat', 'Cabra', '🐐', 'metal'),
    ('monkey', 'Mono', '🐒', 'agua'),
    ('rooster', 'Gallo', '🐔', 'agua'),
    ('dog', 'Perro', '🐕', 'fuego'),
    ('pig', 'Cerdo', '🐷', 'fuego')
  ) AS z(sign, name, emoji, element)
  WHERE z.sign = (ARRAY['rat','ox','tiger','rabbit','dragon','snake','horse','goat','monkey','rooster','dog','pig'])[((p_birth_year + 4) % 12) + 1];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. ÍNDICES ADICIONALES PARA OPTIMIZAR CONSULTAS FRECUENTES
-- ============================================================

-- Índices para currículums (Match Felino)
CREATE INDEX IF NOT EXISTS idx_curriculums_ciudad ON public."currículums"(ciudad) WHERE ciudad IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_curriculums_edad ON public."currículums"(edad);
CREATE INDEX IF NOT EXISTS idx_curriculums_compatibilidad ON public."currículums"(compatibilidad);
CREATE INDEX IF NOT EXISTS idx_curriculums_zodiac ON public."currículums"(zodiac_sign) WHERE zodiac_sign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_curriculums_chinese_zodiac ON public."currículums"(chinese_zodiac) WHERE chinese_zodiac IS NOT NULL;

-- Índices para usuarios_gato (Social Feed)
CREATE INDEX IF NOT EXISTS idx_usuarios_gato_compatibilidad ON public.usuarios_gato(compatibilidad) WHERE compatibilidad IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_gato_ciudad ON public.usuarios_gato(ubicacion) WHERE ubicacion IS NOT NULL;

-- Índices compuestos para consultas de join frecuentes
CREATE INDEX IF NOT EXISTS idx_publicaciones_gato_usuario_creado ON public.publicaciones_gato(usuario_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_reacciones_user_pub ON public.reacciones(usuario_id, publicacion_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_estado ON public.matches(user_id, estado);
CREATE INDEX IF NOT EXISTS idx_matches_gato_estado ON public.matches(gato_id, estado);

-- ============================================================
-- 8. POLÍTICAS RLS ADICIONALES PARA NUEVAS COLUMNAS
-- ============================================================
-- Las políticas existentes ya cubren las tablas base
-- No se necesitan políticas nuevas ya que las columnas se heredan

-- ============================================================
-- 9. ACTUALIZAR DATOS EXISTENTES (BACKFILL)
-- ============================================================

-- Sincronizar compatibilidad en usuarios_gato desde currículums
UPDATE public.usuarios_gato ug
SET compatibilidad = c.compatibilidad,
    horas_sueño = c.horas_sueño,
    salario_deseado = c.salario_deseado
FROM public."currículums" c
WHERE ug.user_id = c.user_id
  AND (ug.compatibilidad IS NULL OR ug.compatibilidad = 'Muy compatible')
  AND c.compatibilidad IS NOT NULL;

-- Actualizar updated_at en usuarios_gato
UPDATE public.usuarios_gato SET updated_at = actualizado_en WHERE updated_at IS NULL;

-- ============================================================
-- 10. VERIFICACIÓN FINAL
-- ============================================================
-- Descomenta para verificar tras ejecutar:

/*
-- Verificar columnas nuevas en usuarios_gato
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'usuarios_gato'
  AND column_name IN ('compatibilidad', 'horas_sueño', 'salario_deseado', 'updated_at')
ORDER BY column_name;

-- Verificar columnas nuevas en currículums
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'currículums'
  AND column_name IN ('zodiac_sign', 'chinese_zodiac', 'ciudad', 'zona')
ORDER BY column_name;

-- Verificar funciones RPC creadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calcular_compatibilidad_gatos',
    'get_western_zodiac',
    'elementos_compatibles',
    'obtener_gatos_para_match',
    'get_western_zodiac',
    'get_chinese_zodiac',
    'elementos_compatibles'
  )
ORDER BY routine_name;

-- Verificar índices nuevos
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND tablename IN ('currículums', 'usuarios_gato', 'publicaciones_gato', 'reacciones', 'matches')
ORDER BY tablename, indexname;

-- Probar función calcular_compatibilidad_gatos (requiere 2 usuarios con CVs)
-- SELECT * FROM public.calcular_compatibilidad_gatos('user-id-1', 'user-id-2');

-- Probar función obtener_gatos_para_match
-- SELECT * FROM public.obtener_gatos_para_match('user-id', '{}'::jsonb);
*/

-- ============================================================
-- FIN DE LA MIGRACIÓN COMPLEMENTARIA
-- ============================================================