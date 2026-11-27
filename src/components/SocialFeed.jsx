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
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    if (isDemo) {
      setPublicaciones(DEMO_PUBLICACIONES)
      setHasMore(false)
      setLoading(false)
      return
    }

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

  useEffect(() => {
    const handleScroll = async () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        await cargarMas()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [publicaciones.length, hasMore, loadingMore])

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 5 * 1024 * 1024) {
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    } else if (file && file.size > 5 * 1024 * 1024) {
      alert('⚠️ La foto no puede superar 5MB')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      alert('⚠️ Debes iniciar sesión')
      return
    }

    let fotoUrl = photoPreview

    if (photoFile) {
      const formData = new FormData()
      formData.append('file', photoFile)

      const fileName = `${user.id}/${Date.now()}_post.${photoFile.name.split('.').pop()}`

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
    }

    if (!nuevaPublicacion.texto.trim() && !fotoUrl) {
      alert('⚠️ Agrega texto o una foto')
      return
    }

    // Modo demo: agregar publicación en memoria (sin alerta de inicio de sesión)
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
        reacciones_count: { me_gusta: 0 },
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

    const { data, error } = await crearPublicacion(user.id, {
      foto_url: fotoUrl,
      texto: nuevaPublicacion.texto,
      etiqueta_profesion: nuevaPublicacion.etiqueta_profesion
    })

    if (error) {
      setError(error)
      return
    }

    setPublicaciones(prev => [data, ...prev])
    setNuevaPublicacion({ texto: '', etiqueta_profesion: '' })
    setPhotoPreview('')
    setPhotoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleReaccion = async (publicacionId) => {
    if (!user) return

    if (isDemo) {
      setPublicaciones(prev => {
        const next = [...prev]
        const pub = next.find(p => p.id === publicacionId)
        if (pub) {
          const userId = 'demo-user'
          const existingReaction = pub.reacciones?.find(r => r.usuario_id === userId)

          if (existingReaction) {
            pub.reacciones = pub.reacciones.filter(r => r.usuario_id !== userId)
          } else {
            pub.reacciones = [...(pub.reacciones || []), { tipo: 'me_gusta', usuario_id: userId }]
          }

          pub.reacciones_count = { me_gusta: (pub.reacciones || []).filter(r => r.tipo === 'me_gusta').length }
        }
        return next
      })
      return
    }

    const { error } = await alternarReaccion(user.id, publicacionId)

    if (error) {
      setError(error)
      return
    }

    const pubIndex = publicaciones.findIndex(p => p.id === publicacionId)
    if (pubIndex !== -1) {
      const { data: { reacciones = {} } = {} } = await contarReacciones(publicacionId)
      setPublicaciones(prev => {
        const next = [...prev]
        next[pubIndex] = { ...next[pubIndex], reacciones_count: reacciones }
        return next
      })
    }
  }

  const handleComentario = async (publicacionId) => {
    if (!user || !nuevoComentario[publicacionId]?.trim()) return

    const { error } = await agregarComentario(
      user.id,
      publicacionId,
      nuevoComentario[publicacionId]
    )

    if (error) {
      setError(error)
      return
    }

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
        color: 'var(--color-text-secondary)',
        background: 'var(--gradient-cats-cafe)'
      }}>
        <p>🔒 Inicia sesión para ver el Muro Social Felino</p>
        <p style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
          Necesitas una cuenta para participar en las publicaciones y retos
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
      {/* Publicación nueva */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-xl)',
        margin: '1rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border-light)'
      }}>
        <h3 style={{ margin: '0 0 1rem', color: 'var(--color-text-primary)', fontWeight: 600, fontFamily: 'var(--font-family-heading)' }}>📸 Compartir momento felino</h3>

        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Describe tu publicación... (ej: 'Nueva captura de ronroneo') 🐾"
            value={nuevaPublicacion.texto}
            onChange={e => setNuevaPublicacion(p => ({ ...p, texto: e.target.value }))}
            style={{
              width: '100%',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-border-medium)',
              fontSize: 'var(--font-size-base)',
              resize: 'vertical',
              marginBottom: '1rem',
              fontFamily: 'var(--font-family-base)'
            }}
            rows={3}
          />

          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            marginBottom: '1rem',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Etiqueta profesión (ej: 'Chef de Siestas')"
              value={nuevaPublicacion.etiqueta_profesion}
              onChange={e => setNuevaPublicacion(p => ({ ...p, etiqueta_profesion: e.target.value }))}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border-medium)',
                fontSize: 'var(--font-size-base)'
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border-medium)',
                background: photoPreview ? '#eef2ff' : '#fff',
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
              marginBottom: 'var(--spacing-lg)',
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
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-accent-primary)',
              color: '#fff',
              fontSize: 'var(--font-size-base)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-family-heading)'
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
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          margin: '0 1rem 1rem',
          fontSize: 'var(--font-size-sm)'
        }}>
          {error}
        </div>
      )}

      {/* Lista de publicaciones */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--color-text-secondary)'
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
                padding: 'var(--spacing-lg)',
                marginBottom: '1rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border-light)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Header con avatar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-md)',
                paddingBottom: 'var(--spacing-md)',
                borderBottom: '1px dashed var(--color-border-medium)'
              }}>
                <div style={{
                  display: 'block',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: pub.usuarios_gato?.foto_url || 'var(--color-border-medium)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0
                }} />
                <div>
                  <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-base)', fontFamily: 'var(--font-family-heading)' }}>
                    {pub.usuarios_gato?.alias || pub.usuarios_gato?.nombre || 'Gatito'}
                  </strong>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {pub.etiqueta_profession && `🐾 ${pub.etiqueta_profession}`}
                  </div>
                </div>
              </div>

              {/* Texto */}
              {pub.texto && (
                <p style={{
                  margin: '0 0 1rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: '1.5',
                  fontSize: 'var(--font-size-base)'
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
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)'
              }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <button
                    onClick={() => handleReaccion(pub.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDemo && pub.reacciones?.some(r => r.usuario_id === 'demo-user') ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    ❤️ {pub.reacciones_count?.me_gusta || 0}
                  </button>

                  {pub.es_duelo && (
                    <button
                      onClick={() => handleDuelo(pub.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent-secondary)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        transition: 'color 0.2s ease'
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
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    transition: 'color 0.2s ease'
                  }}
                >
                  💬 {pub.comentarios?.length || 0}
                </button>
              </div>

              {/* Comentarios */}
              {mostrandoComentarios[pub.id] && (
                <div style={{
                  marginTop: 'var(--spacing-md)',
                  paddingTop: 'var(--spacing-md)',
                  borderTop: '1px dashed var(--color-border-medium)'
                }}>
                  {pub.comentarios?.map((comentario) => (
                    <div
                      key={comentario.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-xs)',
                        fontSize: 'var(--font-size-xs)'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--color-text-primary)' }}>
                          {comentario.usuarios_gato?.alias || 'Anon'}
                        </strong>
                        <div style={{ color: 'var(--color-text-primary)' }}>{comentario.texto}</div>
                      </div>
                      {comentario.usuarios_gato?.alias === 'Yo' && (
                        <button
                          onClick={() => handleEliminarComentario(pub.id, comentario.id, true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-tertiary)',
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

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
                    <input
                      type="text"
                      placeholder="Escribe un comentario..."
                      value={nuevoComentario[pub.id] || ''}
                      onChange={e => setNuevoComentario(p => ({ ...p, [pub.id]: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-border-medium)',
                        fontSize: 'var(--font-size-xs)'
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
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-accent-primary)',
                        background: '#fff',
                        cursor: 'pointer',
                        color: 'var(--color-accent-primary)',
                        fontSize: 'var(--font-size-xs)',
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
              color: 'var(--color-text-secondary)'
            }}>
              <p>🐾 Cargando más...</p>
            </div>
          )}

          {/* Fin de publicaciones */}
          {!loading && !hasMore && publicaciones.length > 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-base)'
            }}>
              <p>🐱 No hay más publicaciones</p>
            </div>
          )}

          {/* Sin publicaciones */}
          {!loading && publicaciones.length === 0 && user && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--color-text-secondary)'
            }}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐾</p>
              <p style={{ margin: 0 }}>¡Aún no hay publicaciones!</p>
              <p style={{ fontSize: 'var(--font-size-base)', marginTop: '0.5rem' }}>
                Comparte tu primer momento felino
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SocialFeed