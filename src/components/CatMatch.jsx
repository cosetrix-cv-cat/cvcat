import React, { useState, useEffect } from 'react'
import {
  obtenerGatosParaMatch,
  registrarInteres,
  verificarMatch,
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

function CatMatch({ user, CVData, isDemo }) {
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

  const cargarGatosDisponibles = async () => {
    if (!user && !isDemo) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    if (isDemo) {
      let demoGatos = [...DEMO_GATOS]

      if (filters.ciudad) {
        demoGatos = demoGatos.filter(g => g.ciudad === filters.ciudad)
      }
      if (filters.zodiac) {
        demoGatos = demoGatos.filter(g => g.zodiaco === filters.zodiac)
      }
      if (filters.chineseZodiac) {
        demoGatos = demoGatos.filter(g => g.zodiaco_chino === filters.chineseZodiac)
      }

      setGatosDisponibles(demoGatos)
      setLoading(false)
      return
    }

    const { data, error } = await obtenerGatosParaMatch(user.id, filters)

    if (error) {
      setError(error)
    } else {
      setGatosDisponibles(data)
    }
    setLoading(false)
  }

  const handleInteres = async (gatoId, gatoNombre) => {
    if (isDemo) {
      const gato = gatosDisponibles.find(g => g.user_id === gatoId)
      if (gato) {
        const isMatch = Math.random() < 0.3
        if (isMatch) {
          alert(`🔥 ¡Match! ${gatoNombre} también te interesa`)
          setGatosMatches(prev => [...prev, {
            id: gatoId,
            nombre: gatoNombre,
            ...gato
          }])
        } else {
          alert(`💌 ${gatoNombre} aún no te interesa, pero sigue explorando`)
        }
        setGatosDisponibles(prev => prev.filter(g => g.user_id !== gatoId))
      }
      return
    }

    const { error, action } = await registrarInteres(user.id, gatoId)

    if (error) {
      setError(error)
      return
    }

    if (action === 'added') {
      const matchResult = await verificarMatch(user.id, gatoId)

      if (matchResult.isMatch) {
        alert(`🔥 ¡Match! ${gatoNombre} también te interesa`)
        setGatosMatches(prev => [...prev, {
          id: gatoId,
          nombre: gatoNombre
        }])
      }
    }

    setGatosDisponibles(prev => prev.filter(g => g.user_id !== gatoId))
  }

  const handleMatchClick = (gato) => {
    const compat = calculateCompatibility(CVData, gato)
    setMatchModal({ gato, compat })
  }

  // Si no hay usuario ni modo demo, mostrar pantalla de bloqueo
  if (!user && !isDemo) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-text-secondary)',
        background: 'var(--gradient-cats-cafe)'
      }}>
        <p>🔒 Debes iniciar sesión para usar el Muro Social Felino</p>
        <p style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
          Tu cuenta te permite descubrir gatos compatibles
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: '1rem', color: 'var(--color-text-tertiary)' }}>
          O usa el <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-demo-modal'))}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            modo demo
          </button>
        </p>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--gradient-cats-cafe)',
      minHeight: 'calc(100vh - 80px)'
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-sm)',
        margin: '1rem',
        borderRadius: 'var(--radius-lg)',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
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
        <div style={{
          background: '#fff',
          margin: '0 1rem 1rem',
          padding: 'var(--spacing-lg)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--spacing-md)'
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
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--color-text-secondary)'
        }}>
          <p>🐾 Buscando gatos compatibles...</p>
        </div>
      ) : error ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#c62828'
        }}>
          <p>❌ {error}</p>
        </div>
      ) : activeTab === 'discover' && gatosDisponibles.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--color-text-secondary)'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐱</p>
          <p>No hay gatos para descubrir ahora</p>
          <p style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
            Vuelve más tarde o ajusta los filtros
          </p>
        </div>
      ) : activeTab === 'matches' && gatosMatches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--color-text-secondary)'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💘</p>
          <p>No tienes matches aún</p>
          <p style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
            Descubre y conecta con gatos compatibles
          </p>
        </div>
      ) : (
        <div style={{
          padding: '0 1rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {(activeTab === 'discover' ? gatosDisponibles : gatosMatches).map((gato, index) => (
            <div
              key={gato.user_id || index}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
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
              <p style={{ margin: 0, color: '#5775D0' }}>#CVGatuno #jacintocards</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatMatch