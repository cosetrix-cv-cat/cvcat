# MiauCV - Generador de Currículum Gatuno

Un generador interactivo de Currículum Gatuno con formulario a la izquierda, vista previa en tiempo real a la derecha, generador aleatorio, descarga de imagen y modal de compartir con la firma `@Jacinto.Cards`.

## 🚀 Características

- ✅ Formulario interactivo con múltiples campos personalizados
- ✅ Vista previa en tiempo real del CV
- ✅ Generador aleatorio con animación
- ✅ Descarga de imagen (usando html2canvas)
- ✅ Modal de compartir con texto sugerido
- ✅ Firma @Jacinto.Cards
- ✅ Autenticación multi-usuario (email/contraseña)
- ✅ Guardado y carga de CVs en Supabase
- ✅ Subida de fotos con compresión básica a Supabase Storage
- ✅ Sin módulo de citas
- ✅ Sin comandos de Git

## 📁 Estructura del Proyecto

```
cv jacinto cat 26/
├── index.html
├── package.json
├── vite.config.js
├── .env.local.example          # Ejemplo de variables de entorno
├── .gitignore
├── README.md
├── supabase/
│   ├── setup-bucket.sql                # Bucket cat-photos + políticas (idempotente)
│   └── migrations/
│       ├── 0001_miaucv_complete_schema.sql           # Esquema completo (ejecutar 1º)
│       ├── 0003_fix_social_relations_and_cache.sql   # FKs + RPC reacciones (ejecutar 2º)
│       └── archive/                                  # ⛔ LEGACY — NO EJECUTAR
├── public/
│   ├── manifest.webmanifest
│   ├── favicon.svg
│   ├── favicon-192.png
│   └── favicon-512.png
├── src/
│   ├── index.css
│   ├── main.jsx
│   ├── App.jsx                 # Auth y CRUD del CV
│   ├── data/
│   │   └── catOptions.js       # Catálogo de opciones
│   ├── lib/
│   │   └── supabaseClient.js   # Cliente Supabase
│   └── components/
│       ├── CVForm.jsx
│       └── CVPreview.jsx
└── README.md
```

## 🔧 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Supabase (https://supabase.com)

## 📦 Instalación

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
cd "C:\Users\Usuario\Desktop\cv jacinto cat 26"
npm install
```

## 🔐 Configuración de Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Copia el **URL** y la **Anon Key** en el panel de proyecto
4. Crea el archivo `.env.local` basado en `.env.local.example`:

```bash
cp .env.local.example .env.local
```

5. Edita `.env.local` con tus credenciales:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

6. **Crea el bucket de.Storage** (en el panel de Supabase):
   - Name: `cat-photos`
   - Public: `true` (o false según prefieras)

7. **Ejecuta las migraciones en el SQL Editor** (en este orden exacto):

   > ⚠️ **Haz un backup de la base de datos antes de empezar.**
   > Ejecuta cada script **manualmente** en el SQL Editor del panel de Supabase,
   > uno después de otro, y revisa la salida antes de pasar al siguiente.

   | # | Archivo | Qué hace |
   |---|---------|----------|
   | 1 | `supabase/migrations/0001_miaucv_complete_schema.sql` | Esquema completo: tablas, RLS, políticas, bucket e índices (idempotente) |
   | 2 | `supabase/migrations/0003_fix_social_relations_and_cache.sql` | Backfill + claves foráneas reales, vista/RPC de reacciones y recarga del schema cache |
   | 3 | `supabase/setup-bucket.sql` | Bucket `cat-photos` y sus políticas de Storage (idempotente) |

   Al final de cada script se ejecuta `NOTIFY pgrst, 'reload schema';` para que
   PostgREST refresque el schema cache.

   > 🚫 **No ejecutes los archivos de `supabase/migrations/archive/`.**
   > Son migraciones legacy (incluida `0002_miaucv_init.sql`) que contienen
   > `DROP TABLE ... CASCADE` y borrarían tus datos. Están bloqueadas con un
   > `RAISE EXCEPTION` para evitar ejecuciones accidentales.

## 🏃‍♂️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera los archivos de producción |
| `npm run preview` | Vista previa del build |

## 🚀 Iniciar el Servidor de Desarrollo

```bash
cd "C:\Users\Usuario\Desktop\cv jacinto cat 26"
npm run dev
```

Luego abre tu navegador y visita: http://localhost:5173

## 🎨 Personalización

Puedes personalizar los siguientes aspectos:

- **Colores de pelaje**: Editando `furColorOptions` en `src/data/catOptions.js`
- **Profesiones**: Editando el array `professions` en `src/data/catOptions.js`
- **Fondos**: Editando `backgrounds` en `src/data/catOptions.js`
- **Medallas**: Editando `medals` en `src/data/catOptions.js`
- **Estilos CSS**: Editando `src/index.css`

## 🔖 Combos de Profesiones

El sistema incluye combos especiales que se desbloquean automáticamente:

1. **Chef de comida humana no autorizada** + **Guardian de la nevera** = **Maestro del Sabotaje de Dietas** 🔥
2. **Ronroneador Oficial** + **Terapeuta Felinario** = **Médico-Chef**
3. **Cazador de Hormigas** + **Contador de Agujeros** = **Explorador Táctico**
4. **Guardia de la Alarma** + **Cazador de Hormigas** = **Guardián Especializado**
5. **Profesor de Gatitos** + **Ronroneador Oficial** = **Maestro del Ronroneo**
6. **Observador de Ventanas** + **Diseñador de Niveles** = **Vigilante Perpetuo**
7. **Terapeuta Felinario** + **Meditador** = **Terapeuta Zen**
8. **Relojero Gatuno** + **Guardia de Alarma** = **Cronovigilante**

## 📱 PWA (Progressive Web App)

El proyecto incluye un `manifest.webmanifest` para futura instalación como PWA:

- Iconos de 192x192 y 512x512px
- Tema de color pastel
- Nombre: "MiauCV - Generador de Currículum Gatuno"

## 🛠️ Tecnologías Utilizadas

- **React 18** - Interfaz de usuario
- **Vite** - Build tool y servidor de desarrollo
- **HTML2Canvas** - Generación de imágenes desde HTML
- **Supabase JS** - Auth y base de datos
- **CSS Modules** - Estilos encapsulados

## 📝 Notas de Desarrollo

- El proyecto usa `react-dom/client` con `createRoot` para React 18
- Los estilos son globales en `src/index.css`
- Los colores pastel se usan como fondo principal
- La firma `@Jacinto.Cards` aparece en el footer del CV y en el texto de compartir

---

## ⚠️ RECUERDA

**No expongas tus credenciales de Supabase!**

- Nunca subas el archivo `.env.local` al repositorio
- Usa `.env.local.example` como plantilla para compartir configuración
- El `SUPABASE_SERVICE_ROLE_KEY` NO debe usarse en el cliente

---

## 📡 SQL para Supabase

**🔴 IMPORTANTE: DEBES EJECUTAR ESTE SQL MANUALMENTE EN EL SQL EDITOR DEL PANEL DE SUPABASE**

```sql
-- ============================================================
-- MiauCV - Inicialización de base de datos
-- Ejecutar en SQL Editor del panel de Supabase
-- ============================================================

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
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_curriculum_user_id ON public.curriculum(user_id);
CREATE INDEX IF NOT EXISTS idx_profesiones_curriculum_id ON public.profesiones(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_habilidades_curriculum_id ON public.habilidades(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_medallas_curriculum_id ON public.medallas(curriculum_id);
```

**⚠️ RECUERDA:** Debes ejecutar el SQL anterior manualmente en el SQL Editor del panel de Supabase.

---

Creado con mucho amor y galletas 🐾