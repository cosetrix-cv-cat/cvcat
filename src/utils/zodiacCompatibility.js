/**
 * MiauCV - Motor de Zodiaco y Horóscopo Chino para compatibilidad felina
 */

// Signos del Zodiaco Occidental (basado en edad aproximada)
export const westernZodiac = [
  { sign: 'capricorn', name: 'Capricornio', emoji: '🐐', element: 'tierra' },
  { sign: 'aquarius', name: 'Aquarius', emoji: '🐟', element: 'aire' },
  { sign: 'pisces', name: 'Pisces', emoji: '🐠', element: 'agua' },
  { sign: 'aries', name: 'Aries', emoji: '♈', element: 'fuego' },
  { sign: 'taurus', name: 'Taurus', emoji: '🐂', element: 'tierra' },
  { sign: 'gemini', name: 'Gemini', emoji: '⚛️', element: 'aire' },
  { sign: 'cancer', name: 'Cancer', emoji: '🦀', element: 'agua' },
  { sign: 'leo', name: 'Leo', emoji: '🦁', element: 'fuego' },
  { sign: 'virgo', name: 'Virgo', emoji: '🐿️', element: 'tierra' },
  { sign: 'libra', name: 'Libra', emoji: '⚖️', element: 'aire' },
  { sign: 'scorpio', name: 'Scorpio', emoji: '🦂', element: 'agua' },
  { sign: 'sagittarius', name: 'Sagittarius', emoji: '🐎', element: 'fuego' }
]

// Signos del Horóscopo Chino
export const chineseZodiac = [
  { sign: 'rat', name: 'Rata', emoji: '🐭', element: 'madera' },
  { sign: 'ox', name: 'Buey', emoji: '🐂', element: 'madera' },
  { sign: 'tiger', name: 'Tigre', emoji: '🐅', element: 'fuego' },
  { sign: 'rabbit', name: 'Conejo', emoji: '🐇', element: 'fuego' },
  { sign: 'dragon', name: 'Dragón', emoji: '🐉', element: 'tierra' },
  { sign: 'snake', name: 'Serpiente', emoji: '🐍', element: 'tierra' },
  { sign: 'horse', name: 'Caballo', emoji: '🐴', element: 'metal' },
  { sign: 'goat', name: 'Cabra', emoji: '🐐', element: 'metal' },
  { sign: 'monkey', name: 'Mono', emoji: '🐒', element: 'agua' },
  { sign: 'rooster', name: 'Gallo', emoji: '🐔', element: 'agua' },
  { sign: 'dog', name: 'Perro', emoji: '🐕', element: 'fuego' },
  { sign: 'pig', name: 'Cerdo', emoji: '🐷', element: 'fuego' }
]

// Combinaciones compatibles por elemento
const elementCompatibility = {
  tierra: { fuego: 'amasada', aire: 'complementaria', tierra: 'respetuosa', agua: 'equilibrada', metal: 'estable', madera: 'creciente' },
  aire: { fuego: 'vibrante', aire: 'chisposa', tierra: 'complenta', agua: 'reflexiva', metal: 'poderosa', madera: 'expansiva' },
  agua: { fuego: 'explosiva', aire: 'suave', tierra: 'calmada', agua: 'profunda', metal: 'misteriosa', madera: 'fluida' },
  fuego: { fuego: 'apasionada', aire: 'encendida', tierra: 'ardiente', agua: 'apacible', metal: 'intensa', madera: 'ardiente' },
  metal: { fuego: 'fina', aire: 'brillante', tierra: 'sólida', agua: 'poderosa', metal: 'precisa', madura: 'completa' },
  madera: { fuego: 'viva', aire: 'creciente', tierra: 'fertil', agua: 'vibrante', metal: 'flexible', madera: 'estable' }
}

/**
 * Determina el signo del zodiaco occidental basado en la edad
 * @param {number} age - Edad del gato en años
 * @returns {object} - Objeto con el signo
 */
export function getWesternZodiac(age) {
  // Los gatos viven aproximadamente 15 años
  // Mapeamos edad a signo (ciclo de 12 años)
  const adjustedAge = age || 3
  const signIndex = Math.floor((adjustedAge - 1) % 12)
  return westernZodiac[signIndex]
}

/**
 * Determina el signo del horóscopo chino basado en el año de nacimiento
 * @param {number} birthYear - Año de nacimiento
 * @returns {object} - Objeto con el signo
 */
export function getChineseZodiac(birthYear) {
  // Los gatos nacen en el mismo ciclo que los humanos
  const year = birthYear || 2020
  const signIndex = (year + 4) % 12 // Ajuste para el ciclo chino
  return chineseZodiac[signIndex]
}

/**
 * Calcula compatibilidad entre dos gatos
 * @param {object} cat1 - Perfil del primer gato (age, birthYear, etc.)
 * @param {object} cat2 - Perfil del segundo gato
 * @returns {object} - Porcentaje y explicación de compatibilidad
 */
export function calculateCompatibility(cat1, cat2) {
  if (!cat1 || !cat2) {
    return { percentage: 0, explanation: 'Datos insuficientes' }
  }

  const zodiac1 = getWesternZodiac(cat1.age)
  const zodiac2 = getWesternZodiac(cat2.age)
  
  const chinese1 = getChineseZodiac(cat1.birthYear)
  const chinese2 = getChineseZodiac(cat2.birthYear)

  // Calcular compatibilidad elemento a elemento
  const elementMatch1 = elementCompatibility[zodiac1.element]?.[zodiac2.element]
  const elementMatch2 = elementCompatibility[zodiac2.element]?.[zodiac1.element]

  // Factores de compatibilidad
  const factors = []
  
  // Compatibilidad de signos
  if (zodiac1.sign === zodiac2.sign) {
    factors.push({ weight: 30, text: 'Misma energía zodiacal' })
  } else if (elementMatch1) {
    factors.push({ weight: 20, text: `Elementos ${elementMatch1}` })
  }

  // Compatibilidad de horóscopo chino
  if (chinese1.sign === chinese2.sign) {
    factors.push({ weight: 25, text: 'Destino compartido' })
  } else if (elementMatch1) {
    factors.push({ weight: 15, text: `Destino ${elementMatch2 || elementMatch1}` })
  }

  // Compatibilidad de ubicación/city
  if (cat1.ubicacion === cat2.ubicacion) {
    factors.push({ weight: 10, text: 'Mismo vecindario' })
  }

  // Calcular porcentaje total
  let totalPoints = factors.reduce((sum, f) => sum + f.weight, 0)
  const percentage = Math.min(100, Math.round(totalPoints / 1.5))

  // Generar explicación divertida
  const explanations = {
    amistad: `Perfectos para compartir ronroneos y siestas en la misma alfombra. ${factors.find(f => f.text.includes('Misma')) ? '¡Son como dos galletas del mismo paquete!' : ''}`,
    siestas: 'Ideal para el río de siestas: pueden tomarse turns y cubrir todas las superficies.',
    juego: `Sus energías ${zodiac1.name.toLowerCase()} y ${zodiac2.name.toLowerCase()} se complementan en corridas de pelota y caza de sombras.`,
    rivalidad: `Un poco como dos gatos viendo una rata: competencia amistosa y espectáculo garantizado.`
  }

  let explanationText
  if (percentage >= 80) {
    explanationText = `🌟 ¡Alta compatibilidad! ${explanations.amistad} ${cat1.alias} y ${cat2.alias} serían compañeros ideales.`
  } else if (percentage >= 50) {
    explanationText = `😸 Buena onda. ${explanations.juego}. Podrían ser vecinos felices.`
  } else if (percentage >= 30) {
    explanationText = `🤔 Entre amigos. ${explanations.rivalidad} Un reto interesante.`
  } else {
    explanationText = `❌ Matrimonio arreglado por humanos. Tal vez deben esperar más tiempo para conocerse.`
  }

  return {
    percentage,
    explanation: explanationText,
    zodiac1: zodiac1.name,
    zodiac2: zodiac2.name,
    chinese1: chinese1.name,
    chinese2: chinese2.name,
    element1: zodiac1.element,
    element2: zodiac2.element
  }
}

/**
 * Genera texto para compartir el match
 * @param {object} cat1 - Primer gato
 * @param {object} cat2 - Segundo gato
 * @param {object} compatibility - Resultado de compatibilidad
 * @returns {string} - Texto listo para compartir
 */
export function generateMatchText(cat1, cat2, compatibility) {
  return `¡Acabo de hacer un match gatuno con MiauCV! 🐱💘

${cat1.alias || cat1.nombre} (${compatibility.zodiac1} ${compatibility.chinese1})
👉 con
${cat2.alias || cat2.nombre} (${compatibility.zodiac2} ${compatibility.chinese2})

Compatibilidad: ${compatibility.percentage}%
${compatibility.explanation}

#CVGatuno #jacintocards #MiauCV
creado por @Jacinto.Cards`
}

/**
 * Obtiene ciudades por región para el filtro
 */
export const cityRegions = [
  { region: 'buenos-aires', cities: ['Buenos Aires', 'CABA', 'La Plata', 'Rosario', 'Córdoba', 'Mendoza', 'Santa Fe', 'La Boca', 'Palermo'] },
  { region: 'capital-federal', cities: ['CABA'] },
  { region: 'interior', cities: ['Córdoba', 'Mendoza', 'Santa Fe', 'Tucumán', 'Salta', 'La Rioja', 'San Juan'] },
  { region: 'costa', cities: ['Mar del Plata', 'Bs. As. Costera', 'Pinamar', 'Punta del Este', 'Miami', 'Santa Barbara'] },
  { region: 'urbana-argentina', cities: ['Buenos Aires', 'Rosario', 'Córdoba', 'La Plata', 'Mendoza'] }
]