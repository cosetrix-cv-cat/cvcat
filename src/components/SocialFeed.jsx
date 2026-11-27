import React, { useState, useEffect, useRef } from 'react'
import { 
  fetchPublicaciones, 
  crearPublicacion, 
  alternarReaccion, 
  agregarComentario,
  eliminarComentario,
  unirseADuelo
} from '../lib/supabaseClient.js'

// Datos de ejemplo para modo demo
const DEMO_PUBLICACIONES = [
  {
    id: 'demo-1',
    usuario_id: 'demo-user-1',
    usuarios_gato: {
      nombre: 'Pelusa',
      alias: '🐱 Pelusa',
      foto_url: '',
      edad: 2,
      ubicacion: 'CABA',
      bandera: '🇦🇷',
      compatibilidad: 'Muy compatible'
    },
    texto: '¡Acabo de terminar mi primera siesta del día! 🌞 #CVGatuno #jacintocards',
    foto_url: '',
    etiqueta_profesion: '',
    es_duelo: false,
    veces_visto: 0,
    creado_en: new Date(Date.now() - 3600000).toISOString(),
    reacciones: [
      { tipo: 'me_gusta', usuario_id: 'demo-user' },
      { tipo: 'meEncanta', usuario_id: 'demo-user-2' }
    ],
    comentarios: [
      {
        id: 'comment-1',
        publicacion_id: 'demo-1',
        usuario_id: 'demo-user-2',
        usuarios_gato: { alias: 'Minino' },
        texto: '¡Qué siesta tan cómoda! 😻',
        creado_en: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: 'demo-2',
    usuario_id: 'demo-user-2',
    usuarios_gato: {
      nombre: 'Minino',
      alias: '🐾 Minino',
      foto_url: '',
      edad: 3,
      ubicacion: 'La Plata',
      bandera: '🇦🇷',
      compatibilidad: 'Compatible'
    },
    texto: '¡Nuevo día, nuevas aventuras! 🎾',
    foto_url: '',
    etiqueta_profesion: '',
    es_duelo: false,
    veces_visto: 0,
    creado_en: new Date(Date.now() - 7200000).toISOString(),
    reacciones: [],
    comentarios: []
  }
]

function SocialFeed({ user, CVData, isDemo }) {
  const [publicaciones, setPublicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevaPublicacion, setNuevaPublicacion] = useState({
    texto: '',
    etiqueta_profesion: ''
  })
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [mostrandoComentarios, setMostrandoComentarios] = useState({})
  const [nuevoComentario, setNuevoComentario] = useState({})
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const fileInputRef = useRef(null)

  // Cargar publicaciones
  useEffect(() => {
    cargarPublicaciones()
  }, [])

  const cargarPublicaciones = async () => {
    if (!user && !isDemo) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    // Modo demo: usar datos locales
    if (isDemo) {
      setPublicaciones(DEMO_PUBLICACIONES)
      setHasMore(false)
      setLoading(false)
      return
    }

    // Modo autenticado: usar Supabase
    const { data, error } = await fetchPublicaciones(20, 0)
    
    if (error) {
      setError(error)
    } else {
      setPublicaciones(data)
      setHasMore(data.length >= 20)
    }
    setLoading(false)
  }

  const cargarMas = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    const { data, error } = await fetchPublicaciones(20, publicaciones.length)

    if (error) {
      setError(error)
    } else {
      setPublicaciones(prev => [...prev, ...data])
      setHasMore(data.length >= 20)
    }
    setLoadingMore(false)
  }

  // Manejar scroll infinito
  useEffect(() => {
    const handleScroll = async () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        await cargarMas()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [publicaciones.length, hasMore, loadingMore])

  // Subir foto para publicación
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 5 * 1024 * 1024) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    } else if (file && file.size > 5 * 1024 * 1024) {
      alert('⚠️ La foto no puede superar 5MB')
    }
  }

  // Crear publicación
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user && !isDemo) {
      alert('⚠️ Debes iniciar sesión')
      return
    }

    let fotoUrl = photoPreview

    // Subir foto si hay
    if (photoFile) {
      try {
        const formData = new FormData()
        formData.append('file', photoFile)
        
        const fileName = `${(user || {}).id || 'demo'}/${Date.now()}_post.${photoFile.name.split('.').pop()}`
        
        const { data, error } = await import('../lib/supabaseClient.js').then(m => 
          m.supabase.storage.from('cat-photos').upload(fileName, photoFile, {
            cacheControl: '3600',
            upsert: false
          })
        ).catch(() => ({ data: null, error: { message: 'Error al subir' } }))

        if (error) {
          console.error('Error subiendo foto:', error)
          alert('❌ Error al subir la foto')
          return
        }

        const { data: { publicUrl } } = await import('../lib/supabaseClient.js').then(m =>
          m.supabase.storage.from('cat-photos').getPublicUrl(fileName)
        )
        fotoUrl = publicUrl
      } catch (err) {
        console.error('Error:', err)
      }
    }

    if (!nuevaPublicacion.texto.trim() && !fotoUrl) {
      alert('⚠️ Agrega texto o una foto')
      return
    }

    // Modo demo: agregar publicación en memoria
    if (isDemo) {
      const nuevaPub = {
        id: `demo-${Date.now()}`,
        usuario_id: 'demo-user',
        usuarios_gato: {
          nombre: CVData.name || 'Gatito',
          alias: CVData.alias || '🐱 Demo',
          foto_url: '',
          edad: CVData.age || 2,
          ubicacion: CVData.location || 'Local',
          bandera: CVData.flag || '🇺🇸',
          compatibilidad: CVData.compatibility || 'Compatible'
        },
        texto: nuevaPublicacion.texto,
        foto_url: fotoUrl,
        etiqueta_profesion: nuevaPublicacion.etiqueta_profesion,
        es_duelo: false,
        veces_visto: 0,
        creado_en: new Date().toISOString(),
        reacciones: [],
        comentarios: []
      }
      setPublicaciones(prev => [nuevaPub, ...prev])
      setNuevaPublicacion({ texto: '', etiqueta_profesion: '' })
      setPhotoPreview('')
      setPhotoFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Modo autenticado: usar Supabase
    const { data, error } = await crearPublicacion(user.id, {
      foto_url: fotoUrl,
      texto: nuevaPublicacion.texto,
      etiqueta_profesion: nuevaPublicacion.etiqueta_profesion
    })

    if (error) {
      setError(error)
      return
    }

    // Agregar a la lista
    setPublicaciones(prev => [data, ...prev])
    setNuevaPublicacion({ texto: '', etiqueta_profesion: '' })
    setPhotoPreview('')
    setPhotoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Manejar reacción en modo demo
  const handleReaccion = async (publicacionId) => {
    if (!user && !isDemo) return

    // Modo demo: reacciones en memoria
    if (isDemo) {
      setPublicaciones(prev => {
        const next = [...prev]
        const pub = next.find(p => p.id === publicacionId)
        if (pub) {
          const userId = 'demo-user'
          const existingReaction = pub.reacciones?.find(r => r.usuario_id === userId)
          
          if (existingReaction) {
            // Quitar reacción
            pub.reacciones = pub.reacciones.filter(r => r.usuario_id !== userId)
          } else {
            // Agregar reacción
            pub.reacciones = [...(pub.reacciones || []), { tipo: 'me_gusta', usuario_id: userId }]
          }
          
          // Contar reacciones
          pub.reacciones_count = { me_gusta: (pub.reacciones || []).filter(r => r.tipo === 'me_gusta').length }
        }
        return next
      })
      return
    }

    // Modo autenticado: usar Supabase
    const { error } = await alternarReaccion(user.id, publicacionId)
    
    if (error) {
      setError(error)
      return
    }
  }

  // Agregar comentario
  const handleComentario = async (publicacionId) => {
    if ((!user && !isDemo) || !nuevoComentario[publicacionId]?.trim()) return

    if (isDemo) {
      setPublicaciones(prev => {
        const next = [...prev]
        const pub = next.find(p => p.id === publicacionId)
        if (pub) {
          pub.comentarios = pub.comentarios || []
          pub.comentarios.unshift({
            id: Date.now(),
            texto: nuevoComentario[publicacionId],
            creado_en: new Date().toISOString(),
            usuarios_gato: { nombre: 'Yo', alias: 'Yo' }
          })
        }
        return next
      })
      setNuevoComentario(prev => ({ ...prev, [publicacionId]: '' }))
      return
    }

    const { error } = await agregarComentario(
      user.id, 
      publicacionId, 
      nuevoComentario[publicacionId]
    )

    if (error) {
      setError(error)
      return
    }

    // Agregar comentario a la lista
    setPublicaciones(prev => {
      const next = [...prev]
      const pub = next.find(p => p.id === publicacionId)
      if (pub) {
        pub.comentarios = pub.comentarios || []
        pub.comentarios.unshift({
          id: Date.now(),
          texto: nuevoComentario[publicacionId],
          creado_en: new Date().toISOString(),
          usuarios_gato: { nombre: 'Yo', alias: 'Yo' }
        })
      }
      return next
    })

    setNuevoComentario(prev => ({ ...prev, [publicacionId]: '' }))
  }

  // Eliminar comentario
  const handleEliminarComentario = async (publicacionId, comentarioId, esMio) => {
    if (!esMio) return

    const { error } = await eliminarComentario(user.id, comentarioId)
    if (error) {
      setError(error)
      return
    }

    setPublicaciones(prev => {
      const next = [...prev]
      const pub = next.find(p => p.id === publicacionId)
      if (pub) {
        pub.comentarios = pub.comentarios.filter(c => c.id !== comentarioId)
      }
      return next
    })
  }

  // Unirse/ salir de duelo
  const handleDuelo = async (publicacionId) => {
    if (!user) return

    const { error } = await unirseADuelo(user.id, publicacionId)
    if (error) {
      setError(error)
    }
  }

  const toggleComentarios = (publicacionId) => {
    setMostrandoComentarios(prev => 
      prev[publicacionId] 
        ? { ...prev, [publicacionId]: false }
        : { ...prev, [publicacionId]: true }
    )
  }

  if (!user && !isDemo) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#666',
        background: 'var(--gradient-cats-cafe)'
      }}>
        <p>🔒 Inicia sesión para ver el Muro Social Felino</p>
        <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
          Necesitas una cuenta para participar en las publicaciones y retos
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
      {/* Publicación nueva */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        margin: '1rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border-medium)'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem', 
          color: '#1a1a1a',
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1.25rem'
        }}>📸 Compartir momento felino</h3>
        
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Describe tu publicación... (ej: 'Nueva captura de ronroneo')"
            value={nuevaPublicacion.texto}
            onChange={e => setNuevaPublicacion(p => ({ ...p, texto: e.target.value }))}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: '1rem',
              resize: 'vertical',
              fontFamily: 'Inter, sans-serif'
            }}
            rows={3}
          />
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Etiqueta profesión (ej: 'Chef de Siestas')"
              value={nuevaPublicacion.etiqueta_profesion}
              onChange={e => setNuevaPublicacion(p => ({ ...p, etiqueta_profesion: e.target.value }))}
              style={{
                flex: 1,
                minWidth: '150px',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border-medium)',
                fontSize: '1rem'
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border-medium)',
                background: photoPreview ? '#e6f7ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📷 Foto
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />
          
          {photoPreview && (
            <div style={{
              position: 'relative',
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <img 
                src={photoPreview} 
                alt="Preview" 
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'cover',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview('')
                  setPhotoFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ff6b6b',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'linear-gradient(135deg, #5775D0, #7a91e8)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            🐱 Publicar al Muro
          </button>
        </form>
      </div>

      {/* Mensajes de error */}
      {error && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          margin: '0 1rem 1rem',
          fontSize: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Lista de publicaciones */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#666'
        }}>
          <p>🐾 Cargando publicaciones...</p>
        </div>
      ) : (
        <div style={{ padding: '0 1rem 1rem' }}>
          {publicaciones.map((pub, index) => (
            <div
              key={pub.id || index}
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-medium)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Header con avatar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px dashed var(--color-border-medium)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: pub.usuarios_gato?.foto_url || '#e0d5c0',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }} />
                <div>
                  <strong style={{ 
                    color: '#1a1a1a',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px'
                  }}>
                    {pub.usuarios_gato?.alias || pub.usuarios_gato?.nombre || 'Gatito'}
                  </strong>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666666',
                    lineHeight: '1.4'
                  }}>
                    {pub.etiqueta_profession && `🐾 ${pub.etiqueta_profession}`}
                  </div>
                </div>
              </div>

              {/* Texto */}
              {pub.texto && (
                <p style={{
                  margin: '0 0 1rem',
                  color: '#1a1a1a',
                  lineHeight: '1.5',
                  fontSize: '1rem'
                }}>
                  {pub.texto}
                </p>
              )}


              {/* Foto */}
              {pub.foto_url && (
                <div style={{
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <img
                    src={pub.foto_url}
                    alt="Publicación"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: 'var(--radius-md)',
                      objectFit: 'cover',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  />
                </div>
              )}

              {/* Acciones */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: '#666666'
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleReaccion(pub.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDemo && pub.reacciones?.some(r => r.usuario_id === 'demo-user') ? '#5775D0' : '#666666',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      transition: 'color 0.2s ease',
                      fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                  >
                    ❤️ {pub.reacciones_count?.me_gusta || pub.reacciones?.length || 0}
                  </button>
                  
                  {pub.es_duelo && (
                    <button
                      onClick={() => handleDuelo(pub.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#5775D0',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'color 0.2s ease',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    >
                      🐱{pub.usuarios_duelo?.length || 0 > 1 ? ' ✨' : ' ¡Únete!'}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => toggleComentarios(pub.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666666',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'color 0.2s ease',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                  }}
                >
                  💬 {pub.comentarios?.length || 0}
                </button>
              </div>

              {/* Comentarios */}
              {mostrandoComentarios[pub.id] && (
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px dashed var(--color-border-medium)'
                }}>
                  {/* Lista de comentarios */}
                  {pub.comentarios?.map((comentario) => (
                    <div
                      key={comentario.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        fontSize: '13px'
                      }}
                    >
                      <div>
                        <strong style={{ color: '#1a1a1a' }}>
                          {comentario.usuarios_gato?.alias || 'Anon'}
                        </strong>
                        <div style={{ color: '#4f4f4f' }}>{comentario.texto}</div>
                      </div>
                      {comentario.usuarios_gato?.alias === 'Yo' && (
                        <button
                          onClick={() => handleEliminarComentario(pub.id, comentario.id, true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#999999',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: 0
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Input de comentario */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={nuevoComentario[pub.id] || ''}
                      onChange={e => setNuevoComentario(p => ({ ...p, [pub.id]: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-border-medium)',
                        fontSize: '13px',
                        fontFamily: 'Inter, sans-serif'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleComentario(pub.id)
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComentario(pub.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-accent-primary)',
                        background: '#fff',
                        cursor: 'pointer',
                        color: '#5775D0',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading más */}
          {loadingMore && (
            <div style={{
              textAlign: 'center',
              padding: '1rem',
              color: '#666'
            }}>
              <p>🐾 Cargando más...</p>
            </div>
          )}

          {/* Fin de publicaciones */}
          {!loading && !hasMore && publicaciones.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#666',
              fontSize: '1rem'
            }}>
              <p>🐱 No hay más publicaciones</p>
            </div>
          )}

          {/* Sin publicaciones */}
          {!loading && publicaciones.length === 0 && user && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: '#666'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐾</p>
              <p style={{ margin: 0 }}>¡Aún no hay publicaciones!</p>
              <p style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                Comparte tu primer momento felino
              </p>
            </div>
          )}

          {/* Firma y marca en el Muro Social */}
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: '#666',
            fontSize: '0.85rem',
            borderTop: '1px dashed var(--color-border-medium)',
            marginTop: '1rem'
          }}>
            <p style={{ margin: '0.25rem 0' }}>🐱 MiauCV - Muro Social Felino</p>
            <p style={{ margin: '0.25rem 0', color: '#ec4899', fontWeight: 700 }}>
              creado por <strong style={{ fontWeight: 800 }}>@Jacinto.Cards</strong>
            </p>
            <p style={{ margin: '0.25rem 0', color: '#ec4899' }}>
              #CVGatuno #jacintocards
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default SocialFeed