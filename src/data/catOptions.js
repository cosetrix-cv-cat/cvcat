// Cat options for MiauCV generator

// Ubicaciones con banderas
export const locationOptions = [
  { city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { city: 'CABA', country: 'Argentina', flag: '🇦🇷' },
  { city: 'La Plata', country: 'Argentina', flag: '🇦🇷' },
  { city: 'Santa Fe', country: 'Argentina', flag: '🇦🇷' },
  { city: 'Córdoba', country: 'Argentina', flag: '🇦🇷' },
  { city: 'Mendoza', country: 'Argentina', flag: '🇦🇷' },
  { city: 'Rosario', country: 'Argentina', flag: '🇦🇷' },
  { city: 'New York', country: 'USA', flag: '🇺🇸' },
  { city: 'San Francisco', country: 'USA', flag: '🇺🇸' },
  { city: 'Los Angeles', country: 'USA', flag: '🇺🇸' },
  { city: 'Londres', country: 'UK', flag: '🇬🇧' },
  { city: 'París', country: 'Francia', flag: '🇫🇷' },
  { city: 'Tokio', country: 'Japón', flag: '🇯🇵' },
  { city: 'Sídney', country: 'Australia', flag: '🇦🇺' },
  { city: 'Sí dulce de Tenerife', country: 'España', flag: '🇪🇸' },
  { city: 'Madrid', country: 'España', flag: '🇪🇸' },
  { city: 'Berlín', country: 'Alemania', flag: '🇩🇪' },
  { city: 'Sí de Móstoles', country: 'España', flag: '🇪🇸' },
  { city: 'La Boca', country: 'Argentina', flag: '🇦🇷' },
  { city: 'Palermo', country: 'Italia', flag: '🇮🇹' },
]

// Patrones de pelaje
export const furPatternOptions = [
  'Regular',
  'Rayas',
  'Manchado',
  'Torto',
  'Punto negro',
  'Amarillo brillante',
  'Cebras doradas',
  'Esponja',
  'Siamés',
  'Persa',
  'Maine Coon',
  'Bengal',
  'Scottish Fold',
]

// Profesiones gatunas (20 profesiones)
export const professions = [
  {
    id: 'chef',
    name: 'Chef de comida humana no autorizada',
    level: 3,
    description: 'Cocina excepcional con ingredientes prohibidos',
    icon: '🍽️'
  },
  {
    id: 'guardian-nevera',
    name: 'Guardian de la nevera',
    level: 2,
    description: 'Protege los alimentos de incautos intrusos',
    icon: '🧊'
  },
  {
    id: 'ronroneador-oficial',
    name: 'Ronroneador Oficial de la Casa',
    level: 1,
    description: 'Calibrador emocional certificado',
    icon: '🐱'
  },
  {
    id: 'cazador-de-hormigas',
    name: 'Cazador de Hormigas',
    level: 2,
    description: 'Especialista en presas pequeñas y deliciosas',
    icon: '🐜'
  },
  {
    id: 'desgarrador-de-mantas',
    name: 'Desgarrador de mantas',
    level: 1,
    description: 'Servicio de limpieza estructural',
    icon: '🧶'
  },
  {
    id: 'relojero-gatuno',
    name: 'Relojero Gatuno',
    level: 2,
    description: 'Asegurador de que duermes 8 horas o menos',
    icon: '⏰'
  },
  {
    id: 'guardia-de-calle',
    name: 'Guardia de Calle',
    level: 2,
    description: 'Supervisor de la zona de jardín',
    icon: '🚨'
  },
  {
    id: 'diseñador-de-niveles',
    name: 'Diseñador de Niveles de Supervivencia',
    level: 3,
    description: 'Crea desafíos para gatos curiosos',
    icon: '🎯'
  },
  {
    id: 'terapeuta-felinario',
    name: 'Terapeuta Felinario',
    level: 4,
    description: 'Ayuda a humanos a entender el lenguaje de ronroneo',
    icon: '🧘'
  },
  {
    id: 'contador-de-agujeros',
    name: 'Contador de Agujeros en Cortinas',
    level: 1,
    description: 'Especialista en pequeños espacios',
    icon: '🕳️'
  },
  {
    id: 'conductor-de-cajas',
    name: 'Conductor de Cajas',
    level: 2,
    description: 'Transporte seguro de objetos pequeños',
    icon: '📦'
  },
  {
    id: 'protector-de-muebles',
    name: 'Protector de Muebles',
    level: 1,
    description: 'Aseguro contra arañazos con estilo',
    icon: '🛋️'
  },
  {
    id: 'musico-de-acciones',
    name: 'Músico de Acciones',
    level: 3,
    description: 'Experto en ritmos de patas sobre teclados',
    icon: '🎹'
  },
  {
    id: 'observador-de-ventanas',
    name: 'Observador de Ventanas',
    level: 2,
    description: 'Vigilante constante de la vida exterior',
    icon: '👀'
  },
  {
    id: 'repartidor-de-pelos',
    name: 'Repartidor de Pelos',
    level: 2,
    description: 'Distribuye pelaje por toda la casa',
    icon: '🧶'
  },
  {
    id: 'guardia-de-alarma',
    name: 'Guardia de la Alarma',
    level: 3,
    description: 'Desactiva alertas no autorizadas',
    icon: '🔔'
  },
  {
    id: 'profesor-de-gatitos',
    name: 'Profesor de Gatitos',
    level: 4,
    description: 'Enseña las artes del ronroneo y caza',
    icon: '🎓'
  },
  {
    id: 'cortador-de-unas',
    name: 'Cortador de Uñas Oficial',
    level: 1,
    description: 'Auto-cuidado especializado',
    icon: '✂️'
  },
  {
    id: 'lector-de-ojos',
    name: 'Lector de Ojos Humanos',
    level: 3,
    description: 'Interpreta expresiones de pelos erizados',
    icon: '👀'
  },
  {
    id: 'meditador',
    name: 'Meditador Zen',
    level: 4,
    description: 'Maestro del sonido del ronroneo profundo',
    icon: '🧘‍♂️'
  }
]

// Combos de profesiones
export const professionCombos = [
  {
    condition: ['chef', 'guardian-nevera'],
    result: {
      id: 'maestro-sabotaje',
      name: 'Maestro del Sabotaje de Dietas',
      level: 4,
      description: 'Crea combinaciones imposibles de resistir - ¡Peligro para la salud!',
      icon: '💥'
    }
  },
  {
    condition: ['ronroneador-oficial', 'terapeuta-felinario'],
    result: {
      id: 'medico-chef',
      name: 'Médico-Chef',
      level: 3,
      description: 'Trata desequilibrios gastronómicos con platos de reparación',
      icon: '🩺🍴'
    }
  },
  {
    condition: ['cazador-de-hormigas', 'contador-de-agujeros'],
    result: {
      id: 'explorador-tactico',
      name: 'Explorador Táctico',
      level: 3,
      description: 'Especialista en mapear zonas de acceso',
      icon: '🗺️'
    }
  },
  {
    condition: ['guardia-de-alarma', 'cazador-de-hormigas'],
    result: {
      id: 'guardian-especializado',
      name: 'Guardián Especializado',
      level: 4,
      description: 'Protección total con vista panorámica',
      icon: '🛡️'
    }
  },
  {
    condition: ['profesor-de-gatitos', 'ronroneador-oficial'],
    result: {
      id: 'maestro-del-ronroneo',
      name: 'Maestro del Ronroneo',
      level: 4,
      description: 'Enseña el arte del ronroneo contagioso',
      icon: '🔊'
    }
  },
  {
    condition: ['observador-de-ventanas', 'diseñador-de-niveles'],
    result: {
      id: 'vigilante-perpetuo',
      name: 'Vigilante Perpetuo',
      level: 4,
      description: 'Supervisión 24/7 de todo el entorno',
      icon: '👁️‍🗨️'
    }
  },
  {
    condition: ['terapeuta-felinario', 'meditador'],
    result: {
      id: 'terapeuta-zen',
      name: 'Terapeuta Zen',
      level: 4,
      description: 'Calma el estrés con ronroneos medicinales',
      icon: '🧘‍🐱'
    }
  },
  {
    condition: ['relojero-gatuno', 'guardia-de-alarma'],
    result: {
      id: 'cronovigilante',
      name: 'Cronovigilante',
      level: 4,
      description: 'Controla el tiempo y la seguridad simultáneamente',
      icon: '⏳'
    }
  }
]

// Habilidades con sliders
export const skills = [
  {
    id: 'caza',
    name: 'Caza',
    icon: '🎯',
    description: 'Precisión en la captura de presas'
  },
  {
    id: 'agilidad',
    name: 'Agilidad',
    icon: '🐾',
    description: 'Flexibilidad y salto'
  },
  {
    id: 'ronroneo',
    name: 'Ronroneo',
    icon: '😸',
    description: 'Intensidad del ronroneo'
  },
  {
    id: 'sigilo',
    name: 'Sigilo',
    icon: '👣',
    description: 'Capacidad de movimiento silencioso'
  },
  {
    id: 'inteligencia',
    name: 'Inteligencia',
    icon: '🧠',
    description: 'Resolución de problemas'
  },
  {
    id: 'carisma',
    name: 'Carisma',
    icon: '⭐',
    description: 'Magnetismo felino'
  },
  {
    id: 'adaptabilidad',
    name: 'Adaptabilidad',
    icon: '🔄',
    description: 'Ajuste a cambios ambientales'
  },
  {
    id: 'paciencia',
    name: 'Paciencia',
    icon: '⏳',
    description: 'Resistencia en esperas largas'
  }
]

// Horarios de trabajo
export const schedules = [
  { value: 'mañana', label: 'Mañana (7-14h)', emoji: '☀️' },
  { value: 'tarde', label: 'Tarde (14-21h)', emoji: '🌤️' },
  { value: 'noche', label: 'Noche (21-4h)', emoji: '🌙' },
  { value: 'flexible', label: 'Flexible (Todo el día)', emoji: '🕐' },
]

// Compatibilidad con otros gatos
export const compatibilityOptions = [
  { value: 'muy-compatible', label: 'Muy compatible', emoji: '💞' },
  { value: 'compatible', label: 'Compatible', emoji: '💕' },
  { value: 'neutral', label: 'Neutral', emoji: '⚖️' },
  { value: 'poco-compatible', label: 'Poco compatible', emoji: '💔' },
  { value: 'no-compatible', label: 'No compatible', emoji: '⛔' },
]

// Fondos temáticos
export const backgrounds = [
  { value: 'pastel-blue', label: 'Azul Pastel', color: '#e6f7ff' },
  { value: 'warm', label: 'Cálido', color: '#fff8e6' },
  { value: 'meadow', label: 'Pradera', color: '#e8f5e9' },
  { value: 'sunset', label: 'Atardecer', color: '#f3e5f5' },
]

// Medallas
export const medals = [
  { id: 'supervivencia', name: 'Supervivencia', emoji: '🏆', color: 'gold' },
  { id: 'dedicacion', name: 'Dedicación', emoji: '🏅', color: 'gold' },
  { id: 'rapidez', name: 'Rapidez', emoji: '🥇', color: 'silver' },
  { id: 'sabiduria', name: 'Sabiduría', emoji: '🥈', color: 'bronze' },
  { id: 'amor', name: 'Amor', emoji: '💖', color: 'gold' },
  { id: 'silencio', name: 'Silencio', emoji: '🛡️', color: 'silver' },
  { id: 'sabor', name: 'Sabor Único', emoji: '🌶️', color: 'bronze' },
  { id: 'fuerza', name: 'Fuerza', emoji: '💪', color: 'gold' },
  { id: 'belleza', name: 'Belleza', emoji: '✨', color: 'gold' },
  { id: 'coraje', name: 'Coraje', emoji: '⚔️', color: 'bronze' },
  { id: 'gratitude', name: 'Gratitud', emoji: '🙏', color: 'silver' },
  { id: 'noche', name: 'Vigilancia Nocturna', emoji: '🌙', color: 'gold' },
  { id: 'crono', name: 'Crono', emoji: '⌛', color: 'gold' },
  { id: 'punto', name: 'Punto Extra', emoji: '⭐', color: 'silver' },
  { id: 'galleta', name: 'Galleta Dorada', emoji: '🍪', color: 'gold' },
  { id: 'raton', name: 'Ratón de Oro', emoji: '🐭', color: 'bronze' },
  { id: 'lealtad', name: 'Lealtad', emoji: '❤️', color: 'gold' },
  { id: 'pelo', name: 'Pelo Brillante', emoji: '🔗', color: 'silver' },
  { id: 'maullido', name: 'Maullido Perfecto', emoji: '🗣️', color: 'bronze' },
  { id: 'corona', name: 'Rey/Reina de la Casa', emoji: '👑', color: 'gold' },
]

// Niveles de profesión
export const levels = [
  { value: 1, label: 'Principiante', emoji: '🐣' },
  { value: 2, label: 'Intermedio', emoji: '🐔' },
  { value: 3, label: 'Avanzado', emoji: '🦚' },
  { value: 4, label: 'Experto', emoji: '🦁' },
]

// Colores de pelaje
export const furColorOptions = [
  { value: '#8B4513', label: 'Marrón Tostón' },
  { value: '#000000', label: 'Negro Profundo' },
  { value: '#FFFFFF', label: 'Blanco Puro' },
  { value: '#FFD700', label: 'Amarillo Brillante' },
  { value: '#C0C0C0', label: 'Plata' },
  { value: '#FFA500', label: 'Naranja' },
  { value: '#800080', label: 'Púrpura' },
  { value: '#FF69B4', label: 'Rosa' },
  { value: '#228B22', label: 'Verde Esmeralda' },
  { value: '#FF4500', label: 'Rojo Fuego' },
  { value: '#1E90FF', label: 'Azul Cielo' },
  { value: '#9370DB', label: 'Violácea' },
  { value: '#DAA520', label: 'Oro' },
  { value: '#DC143C', label: 'Carmesí' },
  { value: '#20B2AA', label: 'Turquesa' },
]