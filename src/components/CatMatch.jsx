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
  const [activeTab, setActiveTab] = useState('discover') // 'discover' or 'matches'
  const [filters, setFilters] = useState({
    ciudad: '',
    zodiac: '',
    chineseZodiac: ''
  })
  const [matchModal, setMatchModal] = useState(null)

  // Zodiaco occidental
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

  // Horóscopo chino
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
    // Si no hay usuario ni modo demo, mostrar pantalla de bloqueo
    if (!user && !isDemo) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    // Modo demo: usar datos locales
    if (isDemo) {
      let demoGatos = [...DEMO_GATOS]
      
      // Aplicar filtros
      if (filters.ciudad) {
        demoGatos = demoGatos.filter(g => g.ciudad === filters.ciudad)
      }
      if (filters.zodiac) {
        demoGatos = demoGatos.filter(g => g.zodiaco === filters.zodiac)
      }
      if (filters.chineseZodiac) {
        demoGatos = demoGatos.filter(g => g.zodiaco_china === filters.chineseZodiac)
      }
      
      setGatosDisponibles(demoGatos)
      setLoading(false)
      return
    }

    // Modo autenticado: usar Supabase
    const { data, error } = await obtenerGatosParaMatch(user.id, filters)
    
    if (error) {
      setError(error)
    } else {
      setGatosDisponibles(data)
    }
    setLoading(false)
  }

  const handleInteres = async (gatoId, gatoNombre) => {
    // Modo demo: interés local
    if (isDemo) {
      const gato = gatosDisponibles.find(g => g.user_id === gatoId)
      if (gato) {
        // Simular match aleatorio (30% de probabilidad)
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

    // Modo autenticado: usar Supabase
    const { error, action } = await registrarInteres(user.id, gatoId)
    
    if (error) {
      setError(error)
      return
    }

    if (action === 'added') {
      // Verificar si hay match
      const matchResult = await verificarMatch(user.id, gatoId)
      
      if (matchResult.isMatch) {
        alert(`🔥 ¡Match! ${gatoNombre} también te interesa`)
        setGatosMatches(prev => [...prev, {
          id: gatoId,
          nombre: gatoNombre
        }])
      }
    }

    // Actualizar lista
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
        color: '#666',
        background: 'var(--gradient-cats-cafe)'
      }}>
        <p>🔒 Debes iniciar sesión para usar el Muro Social Felino</p>
        <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
          Tu cuenta te permite descubrir gatos compatibles
        </p>
        <p style={{ fontSize: '0.9rem', marginTop: '1rem', color: '#999' }}>
          O usa el <button 
            onClick={() => window.dispatchEvent(new CustomEvent('show-demo-modal'))}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-accent-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontWeight: 500
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
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('discover')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'discover' ? '#5775D0' : '#fff',
            color: activeTab === 'discover' ? '#fff' : '#1a1a1a',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s ease',
            textTransform: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: activeTab === 'discover' ? 'none' : '1px solid #d4c8b8'
          }}
        >
          🔍 Descubrir
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'matches' ? '#5775D0' : '#fff',
            color: activeTab === 'matches' ? '#fff' : '#1a1a1a',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s ease',
            textTransform: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: activeTab === 'matches' ? 'none' : '1px solid #d4c8b8'
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
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border-medium)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <select
            value={filters.ciudad}
            onChange={e => setFilters(p => ({ ...p, ciudad: e.target.value }))}
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: '13px',
              background: '#fff',
              fontFamily: 'Inter, sans-serif'
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
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: '13px',
              background: '#fff',
              fontFamily: 'Inter, sans-serif'
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
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: '13px',
              background: '#fff',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <option value="">Cualquier horóscope</option>
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
          color: '#666'
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
          color: '#666'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐱</p>
          <p>No hay gatos para descubrir ahora</p>
          <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
            Vuelve más tarde o ajusta los filtros
          </p>
        </div>
      ) : activeTab === 'matches' && gatosMatches.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#666'
        }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💘</p>
          <p>No tienes matches aún</p>
          <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
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
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-medium)',
                position: 'relative',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: gato.foto_url || '#e0d5c0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div>
                  <strong style={{ 
                    color: '#1a1a1a',
                    fontSize: '16px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}>
                    {gato.alias || gato.nombre}
                  </strong>
                  <div style={{ fontSize: '13px', color: '#666666' }}>
                    {gato.ubicacion}
                  </div>
                </div>
              </div>

              {/* Información del gato */}
              <div style={{
                fontSize: '14px',
                color: '#4f4f4f',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px dashed var(--color-border-medium)'
              }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  👶 Edad: {gato.edad || 'Desconocida'}
                </div>
                <div style={{ marginBottom: '0.25rem', fontWeight: 500, color: '#5775D0' }}>
                  🎯 Compatibilidad: {gato.compatibilidad}
                </div>
                {gato.profesiones && gato.profesiones.length > 0 && (
                  <div style={{ marginTop: '0.25rem', fontSize: '13px' }}>
                    <span>💼 {gato.profesiones.slice(0, 2).map(p => p.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => handleMatchClick(gato)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--color-accent-primary)',
                    background: '#fff',
                    color: 'var(--color-accent-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  🐱 Ver Compatibilidad
                </button>
                
                {activeTab === 'discover' && (
                  <button
                    onClick={() => handleInteres(gato.user_id, gato.alias || gato.nombre)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid #f44336',
                      background: '#fff',
                      color: '#f44336',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
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
              padding: '24px',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <h2 style={{
              textAlign: 'center',
              marginBottom: '24px',
              color: '#1a1a1a',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '24px',
              fontWeight: 700
            }}>
              🐱 Compatibilidad Felina
            </h2>

            <div style={{
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '16px'
              }}>
                {matchModal.compat.zodiac2emoji} + {matchModal.compat.zodiac1emoji}
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#5775D0',
                marginBottom: '12px'
              }}>
                {matchModal.compat.percentage}%
              </div>
              <p style={{
                color: '#666666',
                margin: 0,
                fontFamily: 'Inter, sans-serif'
              }}>
                {matchModal.compat.explanation}
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => setMatchModal(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #d4c8b8',
                  background: '#fff',
                  color: '#1a1a1a',
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
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
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid #5775D0',
                  background: '#fff',
                  color: '#5775D0',
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 Compartir
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#8a8a8a',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
              <p style={{ margin: '0.25rem 0' }}>creado por <strong style={{ color: '#5775D0' }}>@Jacinto.Cards</strong></p>
              <p style={{ margin: 0 }}>#CVGatuno #jacintocards</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatMatch