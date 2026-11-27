import React, { useState, useEffect, useRef } from 'react'
import {
  obtenerGatosParaMatch,
  obtenerMatches,
  registrarInteres,
  verificarMatch,
  isTestUserId,
  calculateCompatibility
} from '../lib/supabaseClient.js'

// Datos de ejemplo para modo demo
const DEMO_GATOS = [
  {
    user_id: 'demo-gato-1',
    nombre: 'Luna',
    alias: '🐱 Luna',
    foto_url: '',
    edad: 2,
    ubicacion: 'CABA',
    bandera: '🇦🇷',
    compatibilidad: 'Muy compatible',
    zodiaco: 'leo',
    zodiaco_chino: 'dragon',
    ciudad: 'Buenos Aires',
    profesiones: [
      { id: 'chef', name: 'Chef de Siestas', icon: '🍽️' },
      { id: 'artist', name: 'Artista de Rascado', icon: '🎨' }
    ],
    habilidades: [
      { id: 'purring', name: 'Ronroneo', icon: '😻', level: 4 },
      { id: 'napping', name: 'Siestas', icon: '💤', level: 5 }
    ]
  },
  {
    user_id: 'demo-gato-2',
    nombre: 'Nube',
    alias: '☁️ Nube',
    foto_url: '',
    edad: 3,
    ubicacion: 'La Plata',
    bandera: '🇦🇷',
    compatibilidad: 'Compatible',
    zodiaco: 'cancer',
    zodiaco_chino: 'rabbit',
    ciudad: 'La Plata',
    profesiones: [
      { id: 'napper', name: 'Ninfa Profesional', icon: '💤' }
    ],
    habilidades: [
      { id: 'sleeping', name: 'Dulces Sueños', icon: '🌙', level: 5 },
      { id: 'cuddling', name: 'Abrazos', icon: '🤗', level: 4 }
    ]
  },
  {
    user_id: 'demo-gato-3',
    nombre: 'Tigre',
    alias: '🐯 Tigre',
    foto_url: '',
    edad: 4,
    ubicacion: 'Rosario',
    bandera: '🇦🇷',
    compatibilidad: 'Muy compatible',
    zodiaco: 'aries',
    zodiaco_chino: 'horse',
    ciudad: 'Rosario',
    profesiones: [
      { id: 'hunter', name: 'Cazador de Ratones', icon: '🎯' }
    ],
    habilidades: [
      { id: 'tracking', name: 'Trazas', icon: '🔍', level: 4 },
      { id: 'speed', name: 'Velocidad', icon: '⚡', level: 3 }
    ]
  }
]

// Normaliza una fila de `matches` (con sus relaciones embebidas) al formato
// que consumen las tarjetas del Match. Tolerante a campos nulos/ausentes.
function normalizarMatch(row, index = 0) {
  const perfil = row?.usuarios_gato || row?.currículums || {}
  return {
    user_id: row?.gato_id || row?.user_id || perfil?.user_id || null,
    nombre: perfil?.nombre || row?.nombre || 'Gatito',
    alias: perfil?.alias || perfil?.nombre || row?.alias || '🐱 Gatito',
    foto_url: perfil?.foto_url || row?.foto_url || '',
    edad: perfil?.edad ?? row?.edad ?? null,
    ubicacion: perfil?.ubicacion || row?.ubicacion || '',
    compatibilidad: perfil?.compatibilidad || row?.compatibilidad || 'Compatible',
    profesiones: Array.isArray(perfil?.profesiones) ? perfil.profesiones : [],
    estado: row?.estado || 'aceptado',
    creado_en: row?.creado_en || null,
    _rowKey: row?.id || `match-${index}`
  }
}

// Clave de identidad para no duplicar matches ya presentes en memoria
function claveMatch(gato) {
  if (!gato) return 'desconocido'
  return gato.user_id || `${gato.alias || gato.nombre || ''}|${gato.edad ?? ''}|${gato.ubicacion || ''}`
}

function CatMatch({ user, CVData }) {
  const [gatosDisponibles, setGatosDisponibles] = useState([])
  const [gatosMatches, setGatosMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [filters, setFilters] = useState({
    ciudad: '',
    zodiac: '',
    chineseZodiac: ''
  })
  const [matchModal, setMatchModal] = useState(null)
  const [matchesCargando, setMatchesCargando] = useState(false)
  // Evita re-hidratar los matches en cada render / bucle de dependencias
  const matchesHidratadosRef = useRef(null)

  const westernZodiac = [
    { value: 'capricorn', label: 'Capricornio 🐐' },
    { value: 'aquarius', label: 'Aquarius 🐟' },
    { value: 'pisces', label: 'Pisces 🐠' },
    { value: 'aries', label: 'Aries ⚡' },
    { value: 'taurus', label: 'Taurus 🐂' },
    { value: 'gemini', label: 'Gemini ⚛️' },
    { value: 'cancer', label: 'Cancer 🦀' },
    { value: 'leo', label: 'Leo 🦁' },
    { value: 'virgo', label: 'Virgo 🐿️' },
    { value: 'libra', label: 'Libra ⚖️' },
    { value: 'scorpio', label: 'Scorpio 🦂' },
    { value: 'sagittarius', label: 'Sagittarius 🐎' }
  ]

  const chineseZodiac = [
    { value: 'rat', label: 'Rata 🐭' },
    { value: 'ox', label: 'Buey 🐂' },
    { value: 'tiger', label: 'Tigre 🐅' },
    { value: 'rabbit', label: 'Conejo 🐇' },
    { value: 'dragon', label: 'Dragón 🐉' },
    { value: 'snake', label: 'Serpiente 🐍' },
    { value: 'horse', label: 'Caballo 🐴' },
    { value: 'goat', label: 'Cabra 🐐' },
    { value: 'monkey', label: 'Mono 🐒' },
    { value: 'rooster', label: 'Gallo 🐔' },
    { value: 'dog', label: 'Perro 🐕' },
    { value: 'pig', label: 'Cerdo 🐷' }
  ]

  const ciudades = ['Buenos Aires', 'CABA', 'La Plata', 'Rosario', 'Córdoba', 'Mendoza', 'Santa Fe', 'Londres', 'París', 'Tokio', 'Sídney', 'Madrid']

  useEffect(() => {
    cargarGatosDisponibles()
  }, [filters])

  // Hidratar los matches YA persistidos en Supabase al montar el componente.
  // Seguro si: no hay usuario, es usuario de prueba, no hay matches, o falla la consulta.
  useEffect(() => {
    if (!user?.id) {
      matchesHidratadosRef.current = null
      return
    }

    // Modo prueba: los IDs test-* no existen en auth.users, no hay matches reales
    if (isTestUserId(user.id)) return

    // Evitar re-consultar el mismo usuario (incluye doble invocación de StrictMode)
    if (matchesHidratadosRef.current === user.id) return
    matchesHidratadosRef.current = user.id

    let cancelado = false

    const hidratarMatches = async () => {
      setMatchesCargando(true)
      try {
        const { data, error: matchesError } = await obtenerMatches(user.id)

        if (cancelado) return

        if (matchesError) {
          // No es fatal: puede faltar la relación en el schema cache o no haber matches
          console.warn('No se pudieron hidratar los matches persistidos:', matchesError)
          return
        }

        const filas = Array.isArray(data) ? data : []
        if (filas.length === 0) return

        const hidratados = filas.map(normalizarMatch)

        setGatosMatches(prev => {
          const existentes = new Set((prev || []).map(claveMatch))
          const nuevos = hidratados.filter(g => !existentes.has(claveMatch(g)))
          return nuevos.length > 0 ? [...(prev || []), ...nuevos] : (prev || [])
        })
      } catch (err) {
        console.warn('Error inesperado hidratando matches:', err)
      } finally {
        if (!cancelado) setMatchesCargando(false)
      }
    }

    hidratarMatches()

    return () => {
      cancelado = true
    }
  }, [user?.id])

  const cargarGatosDisponibles = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    // Cargar gatos desde Supabase

    const { data, error } = await obtenerGatosParaMatch(user.id, filters)

    if (error) {
      setError(error)
    } else {
      setGatosDisponibles(data)
    }
    setLoading(false)
  }

  const handleInteres = async (gatoId, gatoNombre) => {
    // Modo prueba: no se persisten matches sin cuenta real
    if (isTestUserId(user.id)) {
      alert('🧪 Modo PRUEBA: registrar interés requiere iniciar sesión con una cuenta real.')
      return
    }

    try {
      // Registrar interés en Supabase
      const { error, action } = await registrarInteres(user.id, gatoId)

      if (error) {
        setError(typeof error === 'string' ? error : 'No se pudo registrar el interés.')
        return
      }

      if (action === 'added') {
        const matchResult = await verificarMatch(user.id, gatoId)

        if (matchResult?.isMatch) {
          alert(`🔥 ¡Match! ${gatoNombre} también te interesa`)
          setGatosMatches(prev => {
            const nuevo = {
              user_id: gatoId,
              id: gatoId,
              nombre: gatoNombre,
              alias: gatoNombre
            }
            const existentes = new Set((prev || []).map(claveMatch))
            return existentes.has(claveMatch(nuevo)) ? (prev || []) : [...(prev || []), nuevo]
          })
        }
      }

      setGatosDisponibles(prev => prev.filter(g => g.user_id !== gatoId))
    } catch (err) {
      console.warn('Error en handleInteres:', err)
      setError('No se pudo registrar el interés. Inténtalo de nuevo.')
    }
  }

  const handleMatchClick = (gato) => {
    const compat = calculateCompatibility(CVData, gato)
    setMatchModal({ gato, compat })
  }

  // Si no hay usuario ni modo demo, mostrar pantalla de bloqueo
  if (!user) {
    return (
      <div className="empty-state glass-card-light">
        <div className="empty-state-icon">🔒</div>
        <h3>Acceso Requerido</h3>
        <p>Inicia sesión para descubrir gatos compatibles y hacer matches felinos.</p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--gradient-cats-cafe)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Tabs */}
      <div className="glass-card-light" style={{
        padding: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-light)'
      }}>
        <button
          onClick={() => setActiveTab('discover')}
          style={{
            flex: 1,
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'discover' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'discover' ? '#fff' : 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 'var(--font-size-base)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family-heading)'
          }}
        >
          🔍 Descubrir
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          style={{
            flex: 1,
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'matches' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'matches' ? '#fff' : 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: 'var(--font-size-base)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family-heading)'
          }}
        >
          ❤️ Matches ({gatosMatches.length})
        </button>
      </div>

      {/* Filtros */}
      {activeTab === 'discover' && (
        <div className="glass-card-light" style={{
          padding: '20px',
          borderRadius: '20px',
          border: '1px solid var(--color-border-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <select
            value={filters.ciudad}
            onChange={e => setFilters(p => ({ ...p, ciudad: e.target.value }))}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: 'var(--font-size-sm)',
              background: '#fff',
              fontFamily: 'var(--font-family-base)'
            }}
          >
            <option value="">Todas las ciudades</option>
            {ciudades.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={filters.zodiac}
            onChange={e => setFilters(p => ({ ...p, zodiac: e.target.value }))}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: 'var(--font-size-sm)',
              background: '#fff',
              fontFamily: 'var(--font-family-base)'
            }}
          >
            <option value="">Cualquier zodiaco</option>
            {westernZodiac.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>

          <select
            value={filters.chineseZodiac}
            onChange={e => setFilters(p => ({ ...p, chineseZodiac: e.target.value }))}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: 'var(--font-size-sm)',
              background: '#fff',
              fontFamily: 'var(--font-family-base)'
            }}
          >
            <option value="">Cualquier horóscopo</option>
            {chineseZodiac.map(z => (
              <option key={z.value} value={z.value}>{z.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">🐾</div>
          <h3>Buscando gatos compatibles...</h3>
          <p>Analizando perfiles y afinidades felinas</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      ) : activeTab === 'discover' && gatosDisponibles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🐱</div>
          <h3>No hay gatos para descubrir</h3>
          <p>Vuelve más tarde o ajusta los filtros de búsqueda</p>
        </div>
      ) : activeTab === 'matches' && gatosMatches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{matchesCargando ? '💞' : '💘'}</div>
          <h3>{matchesCargando ? 'Cargando tus matches...' : 'No tienes matches aún'}</h3>
          <p>
            {matchesCargando
              ? 'Recuperando tus matches guardados'
              : 'Descubre y conecta con gatos compatibles para hacer match'}
          </p>
        </div>
      ) : (
        <div style={{
          padding: '0 1rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--spacing-lg)'
        }}>
          {(activeTab === 'discover' ? gatosDisponibles : gatosMatches).map((gato, index) => (
            <div
              key={gato.user_id || index}
              className="glass-card-light"
              style={{
                padding: 'var(--spacing-lg)',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)'
              }}>
                <div style={{
                  display: 'block',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: gato.foto_url || 'var(--color-border-medium)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0
                }} />
                <div>
                  <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-family-heading)' }}>
                    {gato.alias || gato.nombre}
                  </strong>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {gato.ubicacion}
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-md)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px dashed var(--color-border-medium)'
              }}>
                <div style={{ marginBottom: '0.25rem' }}>👶 Edad: {gato.edad || 'Desconocida'}</div>
                <div style={{ marginBottom: '0.25rem' }}>🎯 Compatibilidad: {gato.compatibilidad}</div>
                {gato.profesiones && gato.profesiones.length > 0 && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <span>💼 {gato.profesiones.slice(0, 2).map(p => p.name).join(', ')}</span>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleMatchClick(gato)}
                  style={{
                    flex: 1,
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-accent-primary)',
                    background: '#fff',
                    color: 'var(--color-accent-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-family-heading)'
                  }}
                >
                  🐱 Ver Compatibilidad
                </button>

                {activeTab === 'discover' && (
                  <button
                    onClick={() => handleInteres(gato.user_id, gato.alias || gato.nombre)}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid #f44336',
                      background: '#fff',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-family-heading)'
                    }}
                  >
                    ❤️ Interesar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de compatibilidad */}
      {matchModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setMatchModal(null)}
        >
          <div
            className="modal"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '400px',
              width: '90%',
              padding: 'var(--spacing-xxl)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <h2 style={{
              fontFamily: 'var(--font-family-heading)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xl)'
            }}>
              🐱 Compatibilidad Felina
            </h2>

            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: 'var(--spacing-md)'
              }}>
                {matchModal.compat.zodiac2emoji} + {matchModal.compat.zodiac1emoji}
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: 'var(--color-accent-primary)',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {matchModal.compat.percentage}%
              </div>
              <p style={{
                color: 'var(--color-text-secondary)',
                margin: 0,
                fontSize: 'var(--font-size-base)'
              }}>
                {matchModal.compat.explanation}
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              justifyContent: 'center',
              marginBottom: 'var(--spacing-lg)'
            }}>
              <button
                onClick={() => setMatchModal(null)}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-border-medium)',
                  background: '#fff',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-family-heading)'
                }}
              >
                ✕ Cerrar
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Compatible: ${matchModal.compat.percentage}%\n${matchModal.compat.explanation}`)
                  alert('✅ Texto copiado!')
                }}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-accent-secondary)',
                  background: '#fff',
                  color: 'var(--color-accent-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-family-heading)'
                }}
              >
                📋 Compartir
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)'
            }}>
              <p style={{ margin: '0.25rem 0' }}>creado por <strong style={{ color: '#5775D0' }}>@Jacinto.Cards</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatMatch