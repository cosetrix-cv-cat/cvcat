import { createClient } from '@supabase/supabase-js'

// Valores por defecto para permitir renderizado sin variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Crear cliente Supabase (tolerante a variables faltantes)
export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    // Configuración tolerante para desarrollo
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Flag para saber si estamos en modo demo/local
export const supabaseConfigurado = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

// Helper para subir imagen con compresión básica
export async function uploadCatPhoto(file, userId) {
  if (!file || !userId) return { url: null, error: 'Archivo o usuario no válido' }
  
  // Compresión básica - reducir tamaño si es muy grande
  const maxSize = 5 * 1024 * 1024 // 5MB máximo
  let compressedFile = file
  
  if (file.size > maxSize) {
    // Crear versión comprimida usando canvas
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const ratio = maxSize / file.size
        const scale = Math.sqrt(ratio) * 0.8 // 80% del original
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            compressedFile = new File([blob], file.name, { 
              type: 'image/jpeg', 
              lastModified: Date.now() 
            })
            resolve()
          } else {
            reject(new Error('Error al comprimir imagen'))
          }
        }, 'image/jpeg', 0.8)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }
  
  // Generar nombre único con nombre de archivo limpio
  const fileExt = (compressedFile.name.split('.').pop() || 'jpg').toLowerCase()
  const cleanName = compressedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 50)
  const fileName = `${userId}/${Date.now()}_${cleanName}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('cat-photos')
    .upload(fileName, compressedFile, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    console.error('Error al subir foto:', error)
    return { url: null, error: error.message }
  }
  
  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('cat-photos')
    .getPublicUrl(fileName)
  
  return { url: publicUrl, error: null }
}

// Guardar CV en Supabase
export async function saveCV(userId, cvData, photoUrl = null) {
  if (!userId) return null
  
  const cv = {
    user_id: userId,
    nombre: cvData.name || '',
    alias: cvData.alias || '',
    edad: cvData.age ? parseInt(cvData.age) : null,
    ubicacion: cvData.location || '',
    bandera: cvData.flag || '',
    color_pelaje: cvData.furColor || '',
    patron: cvData.furPattern || 'Regular',
    foto_url: photoUrl || cvData.photoPreview || '',
    horas_sueño: cvData.sleepHours || 12,
    salario_deseado: cvData.desiredSalary || '',
    compatibilidad: cvData.compatibility || 'Muy compatible',
    fondo: cvData.background || 'pastel-blue',
    profesiones: cvData.professional || [],
    habilidades: cvData.skills || {},
    medallas: cvData.medals || []
  }
  
  // Primero verificar si existe
  const { data: existing, error: selectError } = await supabase
    .from('currículums')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (selectError) {
    console.error('Error al buscar CV:', selectError)
    return null
  }
  
  let result
  if (existing) {
    // Actualizar
    result = await supabase
      .from('currículums')
      .update(cv)
      .eq('user_id', userId)
      .select()
  } else {
    // Insertar
    result = await supabase
      .from('currículums')
      .insert([cv])
      .select()
  }
  
  const { data, error } = result
  
  if (error) {
    console.error('Error al guardar CV:', error)
    return null
  }
  
  return data[0]
}

// Cargar CV del usuario
export async function loadCV(userId) {
  if (!userId) return null
  
  const { data, error } = await supabase
    .from('currículums')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  
  if (error) {
    console.error('Error al cargar CV:', error)
    return null
  }
  
  return data
}

// Eliminar CV
export async function deleteCV(userId) {
  const { error } = await supabase
    .from('currículums')
    .delete()
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error al eliminar CV:', error)
    return false
  }
  
  return true
}

// ============================================================
// Funciones del Muro Social Felino
// ============================================================

// Obtener todas las publicaciones con info de usuario y reacciones
export async function fetchPublicaciones(limit = 20, offset = 0) {
  // Intentar primero la función RPC que evita problemas de schema cache
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_publicaciones_con_usuarios', {
      p_limit: limit,
      p_offset: offset
    })
    
    if (!rpcError && rpcData) {
      // Mapear los datos del RPC al formato esperado por el frontend
      const mappedData = rpcData.map(pub => ({
        id: pub.id,
        usuario_id: pub.usuario_id,
        foto_url: pub.foto_url,
        texto: pub.texto,
        etiqueta_profesion: pub.etiqueta_profesion,
        es_duelo: pub.es_duelo,
        usuarios_duelo: pub.usuarios_duelo,
        veces_visto: pub.veces_visto,
        creado_en: pub.creado_en,
        actualizado_en: pub.actualizado_en,
        usuarios_gato: {
          nombre: pub.usuario_nombre || 'Gatito',
          alias: pub.usuario_alias || '🐱 Gatito',
          foto_url: pub.usuario_foto_url || '',
          edad: pub.usuario_edad || 2,
          ubicacion: pub.usuario_ubicacion || '',
          bandera: pub.usuario_bandera || '🇺🇸',
          compatibilidad: pub.usuario_compatibilidad || 'Compatible'
        },
        reacciones: [],
        reacciones_count: { me_gusta: Number(pub.reacciones_count) || 0 },
        comentarios: [],
        comentarios_count: Number(pub.comentarios_count) || 0
      }))
      return { data: mappedData, error: null }
    }
  } catch (rpcErr) {
    console.warn('RPC no disponible, usando query directa:', rpcErr)
  }

  // Fallback: query directa con join
  const { data, error } = await supabase
    .from('publicaciones_gato')
    .select(`
      *,
      usuarios_gato!left (
        nombre,
        alias,
        foto_url
      ),
      reacciones (
        tipo,
        usuario_id
      ),
      comentarios (
        id,
        texto,
        creado_en,
        usuarios_gato (
          nombre,
          alias
        )
      )
    `)
    .order('creado_en', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) {
    // Último fallback: query sin joins
    console.warn('Error con join, intentando sin relaciones:', error)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('publicaciones_gato')
      .select('*')
      .order('creado_en', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (fallbackError) {
      console.error('Error al cargar publicaciones:', fallbackError)
      return { data: [], error: fallbackError.message }
    }
    return { data: fallbackData || [], error: null }
  }
  
  return { data, error: null }
}

// Crear nueva publicación
export async function crearPublicacion(userId, { foto_url, texto, etiqueta_profesion, es_duelo = false }) {
  if (!userId) return { data: null, error: 'Debes iniciar sesión' }
  
  // Primero obtener el CV del usuario
  const cv = await loadCV(userId)
  if (!cv) {
    return { data: null, error: 'No tienes CV creado' }
  }
  
  const publicacion = {
    usuario_id: userId,
    foto_url: foto_url || cv.foto_url || '',
    texto: texto || `🐱 Publicación de ${cv.alias || cv.nombre}`,
    etiqueta_profesion: etiqueta_profesion,
    es_duelo: es_duelo,
    creado_en: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('publicaciones_gato')
    .insert([publicacion])
    .select()
  
  if (error) {
    console.error('Error al crear publicación:', error)
    return { data: null, error: error.message }
  }
  
  return { data: data[0], error: null }
}

// Alternar reacción (like/vote)
export async function alternarReaccion(userId, publicacionId, tipo = 'me_gusta') {
  if (!userId) return { error: 'Debes iniciar sesión' }
  
  // Verificar si ya existe reacción
  const { data: existing, error: checkError } = await supabase
    .from('reacciones')
    .select('id')
    .eq('usuario_id', userId)
    .eq('publicacion_id', publicacionId)
    .eq('tipo', tipo)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error al verificar reacción:', checkError)
    return { error: 'Error al verificar reacción' }
  }
  
  let result
  if (existing) {
    // Eliminar reacción
    result = await supabase
      .from('reacciones')
      .delete()
      .eq('usuario_id', userId)
      .eq('publicacion_id', publicacionId)
      .eq('tipo', tipo)
  } else {
    // Agregar reacción
    result = await supabase
      .from('reacciones')
      .insert([{
        usuario_id: userId,
        publicacion_id: publicacionId,
        tipo: tipo,
        creado_en: new Date().toISOString()
      }])
  }
  
  const { error } = result
  
  if (error) {
    console.error('Error al alternar reacción:', error)
    return { error: error.message }
  }
  
  // Contar reacciones actualizadas
  const { data: counts, error: countError } = await supabase.rpc('contar_reacciones_por_publicacion', {
    p_publicacion_id: publicacionId
  }).catch(() => null)
  
  return { error: null, reacciones_actualizadas: counts || {} }
}

// Agregar comentario
export async function agregarComentario(userId, publicacionId, texto) {
  if (!userId) return { error: 'Debes iniciar sesión' }
  if (!texto || texto.trim().length === 0) return { error: 'El comentario no puede estar vacío' }
  
  // Verificar que la publicación existe
  const { data: pub, error: pubError } = await supabase
    .from('publicaciones_gato')
    .select('id')
    .eq('id', publicacionId)
    .single()
  
  if (pubError) {
    return { error: 'Publicación no encontrada' }
  }
  
  const { data, error } = await supabase
    .from('comentarios')
    .insert([{
      publicacion_id: publicacionId,
      usuario_id: userId,
      texto: texto.trim(),
      creado_en: new Date().toISOString()
    }])
    .select(`
      id,
      texto,
      creado_en,
      usuarios_gato!inner (
        nombre,
        alias
      )
    `)
  
  if (error) {
    console.error('Error al agregar comentario:', error)
    return { error: error.message }
  }
  
  return { data: data[0], error: null }
}

// Eliminar comentario
export async function eliminarComentario(userId, comentarioId) {
  if (!userId) return { error: 'Debes iniciar sesión' }
  
  const { error } = await supabase
    .from('comentarios')
    .delete()
    .eq('id', comentarioId)
    .eq('usuario_id', userId)
  
  if (error) {
    console.error('Error al eliminar comentario:', error)
    return { error: error.message }
  }
  
  return { error: null }
}

// Unirse a un reto/duelo
export async function unirseADuelo(userId, publicacionId) {
  if (!userId) return { error: 'Debes iniciar sesión' }
  if (!publicacionId) return { error: 'ID de duelo requerido' }
  
  // Verificar que la publicación es un duelo
  const { data: duel, error: duelError } = await supabase
    .from('publicaciones_gato')
    .select('es_duelo, usuarios_duelo')
    .eq('id', publicacionId)
    .single()
  
  if (duelError) {
    return { error: 'Duelo no encontrado' }
  }
  
  if (!duel.es_duelo) {
    return { error: 'No es un duelo válido' }
  }
  
  // Verificar si ya está unido
  if (duel.usuarios_duelo && duel.usuarios_duelo.includes(userId)) {
    // Salir del duelo
    const nuevoLista = duel.usuarios_duelo.filter(id => id !== userId)
    const { error } = await supabase
      .from('publicaciones_gato')
      .update({ usuarios_duelo: nuevoLista })
      .eq('id', publicacionId)
    
    if (error) {
      return { error: error.message }
    }
    return { error: null, salio: true }
  }
  
  // Unirse al duelo
  const nuevoLista = [...(duel.usuarios_duelo || []), userId]
  const { error } = await supabase
    .from('publicaciones_gato')
    .update({ usuarios_duelo: nuevoLista })
    .eq('id', publicacionId)
  
  if (error) {
    return { error: error.message }
  }
  
  return { error: null, unido: true }
}

// Contar reacciones por publicación (función helper)
export async function contarReacciones(publicacionId) {
  const { data, error } = await supabase.rpc('contar_reacciones_por_publicacion', {
    p_publicacion_id: publicacionId
  }).catch(async () => {
    // Si la función no existe, hacer consulta directa
    const { data: r, error: e } = await supabase
      .from('reacciones')
      .select('tipo', { count: 'exact' })
      .eq('publicacion_id', publicacionId)
    
    return { count: r?.length || 0, error: e }
  })
  
  return { data: data || {}, error }
}

// ============================================================
// Funciones del Módulo de Match Felino
// ============================================================

// Obtener gatos potenciales para match
export async function obtenerGatosParaMatch(userId, filtros = {}) {
  const { data, error } = await supabase
    .from('currículums')
    .select(`
      user_id,
      nombre,
      alias,
      edad,
      ubicacion,
      color_pelaje,
      bandera,
      foto_url,
      horas_sueño,
      compatibilidad,
      profesiones,
      medallas
    `)
    .neq('user_id', userId) // Excluir al propio usuario
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('Error al obtener gatos:', error)
    return { data: [], error: error.message }
  }
  
  // Añadir información de zodiaco (calculada localmente)
  const gatosConZodiaco = data.map(gato => ({
    ...gato,
    zodiac: getWesternZodiac(gato.edad || 3),
    chineseZodiac: getChineseZodiac(gato.user_id) // Placeholder, se calcula por birthdate si está disponible
  }))
  
  return { data: gatosConZodiaco, error: null }
}

// Registrar interés/match
export async function registrarInteres(userId, gatoId) {
  if (!userId || !gatoId) return { error: 'Datos insuficientes' }
  
  // Verificar si ya existe
  const { data: existing, error: checkError } = await supabase
    .from('matches')
    .select('id')
    .eq('user_id', userId)
    .eq('gato_id', gatoId)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') {
    return { error: checkError.message }
  }
  
  if (existing) {
    // Eliminar interés
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('user_id', userId)
      .eq('gato_id', gatoId)
    
    if (error) return { error: error.message }
    return { error: null, action: 'removed' }
  }
  
  // Agregar interés
  const { error } = await supabase
    .from('matches')
    .insert([{
      user_id: userId,
      gato_id: gatoId,
      estado: 'interesado',
      creado_en: new Date().toISOString()
    }])
  
  if (error) return { error: error.message }
  return { error: null, action: 'added' }
}

// Verificar match mutuo
export async function verificarMatch(userId, gatoId) {
  if (!userId || !gatoId) return { isMatch: false }
  
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('user_id', userId)
    .eq('gato_id', gatoId)
    .eq('estado', 'interesado')
    .single()
  
  if (error) return { isMatch: false }
  
  // Verificar si el otro usuario también está interesado
  const { data: reverse, error: reverseError } = await supabase
    .from('matches')
    .select('id')
    .eq('user_id', gatoId)
    .eq('gato_id', userId)
    .eq('estado', 'interesado')
    .single()
  
  return { 
    isMatch: !!data && !!reverse,
    userInteresado: !!data,
    gatoInteresado: !!reverse
  }
}

// Obtener matches aceptados
export async function obtenerMatches(userId) {
  if (!userId) return { data: [], error: 'Debes iniciar sesión' }
  
  const { data, error } = await supabase
    .from('matches')
    .select(`
      estado,
      creado_en,
      usuarios_gato!inner (
        nombre,
        alias,
        foto_url,
        edad,
        ubicacion,
        compatibilidad
      ),
      currículums!inner (
        nombre,
        alias,
        edad,
        ubicacion,
        foto_url,
        horas_sueño,
        compatibilidad
      )
    `)
    .eq('user_id', userId)
    .eq('estado', 'aceptado')
  
  if (error) {
    console.error('Error al obtener matches:', error)
    return { data: [], error: error.message }
  }
  
  return { data, error: null }
}

// Funciones de zodiaco (importar desde utils o definir inline)
function getWesternZodiac(age) {
  const adjustedAge = age || 3
  const westernZodiac = [
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
  const signIndex = Math.floor((adjustedAge - 1) % 12)
  return westernZodiac[signIndex]
}

function getChineseZodiac(birthYear) {
  const year = birthYear || 2020
  const chineseZodiac = [
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
  const signIndex = (year + 4) % 12
  return chineseZodiac[signIndex]
}

// Calcular compatibilidad entre gatos
export function calculateCompatibility(cat1, cat2) {
  if (!cat1 || !cat2) {
    return { percentage: 0, explanation: 'Datos insuficientes' }
  }

  const zodiac1 = getWesternZodiac(cat1.edad)
  const zodiac2 = getWesternZodiac(cat2.edad)

  const elementCompatibility = {
    tierra: { fuego: 'amasada', aire: 'complementaria', tierra: 'respetuosa', agua: 'equilibrada', metal: 'estable', madera: 'creciente' },
    aire: { fuego: 'vibrante', aire: 'chisposa', tierra: 'complenta', agua: 'reflexiva', metal: 'poderosa', madera: 'expansiva' },
    agua: { fuego: 'explosiva', aire: 'suave', tierra: 'calmada', agua: 'profunda', metal: 'misteriosa', madera: 'fluida' },
    fuego: { fuego: 'apasionada', aire: 'encendida', tierra: 'ardiente', agua: 'apacible', metal: 'intensa', madera: 'ardiente' },
    metal: { fuego: 'fina', aire: 'brillante', tierra: 'sólida', agua: 'poderosa', metal: 'precisa', madura: 'completa' },
    madera: { fuego: 'viva', aire: 'creciente', tierra: 'fertil', agua: 'vibrante', metal: 'flexible', madera: 'estable' }
  }

  const factors = []
  
  if (zodiac1.sign === zodiac2.sign) {
    factors.push({ weight: 30, text: 'Misma energía zodiacal' })
  }
  
  const elementMatch1 = elementCompatibility[zodiac1.element]?.[zodiac2.element]
  const elementMatch2 = elementCompatibility[zodiac2.element]?.[zodiac1.element]
  
  if (elementMatch1) {
    factors.push({ weight: 20, text: `Elementos ${elementMatch1}` })
  }
  
  if (cat1.ubicacion === cat2.ubicacion) {
    factors.push({ weight: 10, text: 'Mismo vecindario' })
  }

  let totalPoints = factors.reduce((sum, f) => sum + f.weight, 0)
  const percentage = Math.min(100, Math.round(totalPoints / 1.5))

  const explanations = {
    amistad: `Perfectos para compartir ronroneos y siestas en la misma alfombra. ${factors.find(f => f.text.includes('Misma')) ? '¡Son como dos galletas del mismo paquete!' : ''}`,
    siestas: 'Ideal para el río de siestas: pueden tomarse turns y cubrir todas las superficies.',
    juego: `Sus energías ${zodiac1.name.toLowerCase()} y ${zodiac2.name.toLowerCase()} se complementan en corridas de pelota y caza de sombras.`,
    rivalidad: `Un poco como dos gatos viendo una rata: competencia amistosa y espectáculo garantizado.`
  }

  let explanationText
  if (percentage >= 80) {
    explanationText = `🌟 ¡Alta compatibilidad! ${explanations.amistad} ${cat1.alias || cat1.nombre} y ${cat2.alias || cat2.nombre} serían compañeros ideales.`
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
    zodiac1emoji: zodiac1.emoji,
    zodiac2emoji: zodiac2.emoji
  }
}