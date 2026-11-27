import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { professionCombos, schedules } from '../data/catOptions.js'

function CVPreview({ formData, onDownload, showShareModal, setShowShareModal, previewImage, setPreviewImage }) {
  const cardRef = useRef(null)
  const [shareText, setShareText] = useState('')

  // Determinar si hay combo aplicado
  const getActiveCombo = () => {
    return professionCombos.find(combo =>
      combo.condition.every(id => formData.professional.some(p => p.id === id))
    )
  }

  const activeCombo = getActiveCombo()

  // Generar texto de compartir
  useEffect(() => {
    const text = `¡Acabo de crear mi CV gatuno con MiauCV! 🐱

${formData.name} - ${formData.alias}
Edad: ${formData.age} años
📍 ${formData.location} ${formData.flag}
🐾 ${formData.furPattern} ${formData.furColor ? getColorName(formData.furColor) : ''}

Profesiones:
${Array.isArray(formData.professional) ? formData.professional?.map(p => `  • ${p.icon} ${getLevelEmoji(p.level)} ${p.name}`).join('\n') : ''}

Skills:
${Array.isArray(formData.skills) ? formData.skills?.map(s => `  • ${s.icon} ${s.name} (${s.level}/4)`).join('\n') : ''}

Horas de sueño: ${formData.sleepHours}h
Compatibilidad: ${formData.compatibility}

#CVGatuno #JacintoCards #MiauCV
creado por @Jacinto.Cards`

    setShareText(text)
  }, [formData])

  const getColorName = (color) => {
    const colors = {
      '#8B4513': 'Marrón Tostón',
      '#000000': 'Negro Profundo',
      '#FFFFFF': 'Blanco Puro',
      '#FFD700': 'Amarillo Brillante',
      '#C0C0C0': 'Plata',
      '#FFA500': 'Naranja',
      '#800080': 'Púrpura',
      '#FF69B4': 'Rosa',
      '#228B22': 'Verde Esmeralda',
      '#FF4500': 'Rojo Fuego',
      '#1E90FF': 'Azul Cielo',
      '#9370DB': 'Violácea',
      '#DAA520': 'Oro',
      '#DC143C': 'Carmesí',
      '#20B2AA': 'Turquesa'
    }
    return colors[color] || ''
  }

  const getLevelEmoji = (level) => {
    const emojis = ['🐣', '🐔', '🦚', '🦁'][level - 1] || '🐱'
    return emojis
  }

  const handleDownload = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2
      })

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `MiauCV_${formData.name || 'gatito'}.png`
      link.href = image
      link.click()
    } catch (error) {
      console.error('Error al descargar:', error)
      alert('❌ Error al generar la imagen. Inténtalo de nuevo.')
    }
  }

  const handleShare = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2
      })

      const image = canvas.toDataURL('image/png')
      setPreviewImage(image)
      setShowShareModal(true)
    } catch (error) {
      console.error('Error al generar imagen:', error)
      alert('❌ Error al generar la vista previa.')
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      alert('✅ Texto copiado al portapapeles!')
    } catch (err) {
      alert('❌ No se pudo copiar. Copia manualmente desde debajo.')
    }
  }

  const downloadImage = () => {
    if (previewImage) {
      const link = document.createElement('a')
      link.download = `MiauCV_${formData.name || 'gatito'}_share.png`
      link.href = previewImage
      link.click()
    }
  }

  return (
    <>
      {/* Vista previa del CV - Credencial Premium */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem',
        overflowY: 'auto',
        background: 'var(--gradient-cats-cafe)'
      }}>
        <div
          ref={cardRef}
          className={`cv-card bg-${formData.background} relative`}
          style={{
            maxWidth: '480px',
            width: '100%',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border-light)',
            transition: 'transform 0.3s ease',
            position: 'relative'
          }}
        >
          {/* Watermark diagonal */}
          <div className="watermark">MIAUCV APPROVED</div>

          {/* Foto de fondo opcional */}
          {formData.photoPreview && formData.background === 'pastel-blue' && (
            <img
              src={formData.photoPreview}
              alt="Background"
              className="bg-photo"
            />
          )}

          <div style={{
            background: 'linear-gradient(135deg, #5775D0 0%, #7a91e8 100%)',
            color: '#fff',
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-xxxl)',
              fontWeight: 700,
              margin: 0,
              letterSpacing: -0.5,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              {formData.name || 'Gatito'}
            </h2>
            {formData.alias && (
              <p style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-base)',
                opacity: 0.95,
                marginTop: 'var(--spacing-xs)',
                fontWeight: 500
              }}>
                {formData.alias}
              </p>
            )}
          </div>

          {/* Avatar circular centrado - display:block, object-fit:cover, object-position:center */}
          {formData.photoPreview ? (
            <img
              src={formData.photoPreview}
              alt="Gato"
              className="cat-avatar"
              style={{
                display: 'block',
                width: '160px',
                height: '160px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                objectPosition: 'center',
                border: '5px solid #fff',
                boxShadow: 'var(--shadow-avatar)',
                margin: '-80px auto var(--spacing-lg)',
                background: 'var(--color-border-medium)',
                transition: 'transform 0.3s ease'
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '160px',
              height: '160px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-border-medium)',
              margin: '-80px auto var(--spacing-lg)',
              fontSize: '3rem',
              boxShadow: 'var(--shadow-avatar)',
              transition: 'transform 0.3s ease'
            }}>
              🐱
            </div>
          )}

          {/* Información del CV */}
          <div style={{
            padding: '24px',
            paddingTop: '24px',
            position: 'relative'
          }}>
            {/* Ubicación */}
            {formData.location && (
              <div style={{
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  📍 UBICACIÓN
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500
                }}>
                  {formData.location} {formData.flag}
                </span>
              </div>
            )}

            {/* Color y patrón */}
            {(formData.furColor || formData.furPattern) && (
              <div style={{
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  🐾 PELAJE
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500
                }}>
                  {formData.furPattern}
                </span>
                {formData.furColor && (
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: formData.furColor,
                    marginLeft: '8px',
                    verticalAlign: 'middle',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }} />
                )}
              </div>
            )}

            {/* Edad */}
            {formData.age && (
              <div style={{
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  👶 EDAD
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500
                }}>
                  {formData.age} años
                </span>
              </div>
            )}

            {/* Profesiones */}
            {formData.professional && formData.professional.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  💼 PROFESIONES
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-sm)',
                  justifyContent: 'center'
                }}>
                  {formData.professional.map((prof, idx) => (
                    <span
                      key={idx}
                      className={`profession-badge level-${prof.level}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(87, 117, 208, 0.1), rgba(122, 145, 232, 0.1))',
                        margin: '0.25rem',
                        fontSize: 'var(--font-size-sm)',
                        border: '1px solid rgba(87, 117, 208, 0.2)',
                        backdropFilter: 'blur(5px)',
                        transition: 'all 0.2s ease',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 500,
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      {prof.icon} {getLevelEmoji(prof.level)} {prof.name}
                    </span>
                  ))}
                </div>
                {activeCombo && (
                  <div style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #ff9800, #f44336)',
                    color: '#fff',
                    display: 'inline-block',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600
                  }}>
                    🔥 Combo: {activeCombo.result.name}
                  </div>
                )}
              </div>
            )}

            {/* Habilidades */}
            {Array.isArray(formData.skills) && formData.skills.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  ⚡ SKILLS
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-xs)'
                }}>
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="skill-badge"
                      style={{
                        display: 'inline-block',
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(87, 117, 208, 0.1)',
                        fontSize: 'var(--font-size-xs)',
                        margin: 'var(--spacing-xs)',
                        border: '1px solid rgba(87, 117, 208, 0.2)',
                        transition: 'all 0.2s ease',
                        color: 'var(--color-accent-primary)',
                        fontWeight: 500
                      }}
                    >
                      {skill.icon} {skill.name} ({skill.level}/4)
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Horario y sueño */}
            {(formData.schedule || formData.sleepHours) && (
              <div style={{
                display: 'flex',
                gap: '2rem',
                marginBottom: 'var(--spacing-xl)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                flexWrap: 'wrap'
              }}>
                {formData.schedule && (
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      ⏰ HORARIO
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 500
                    }}>
                      {schedules.find(s => s.value === formData.schedule)?.label || formData.schedule}
                    </span>
                  </div>
                )}
                {formData.sleepHours && (
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      😴 SUEÑO
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 500
                    }}>
                      {formData.sleepHours}h
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Salario deseado */}
            {formData.desiredSalary && (
              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  💰 SALARIO
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500
                }}>
                  {formData.desiredSalary}
                </span>
              </div>
            )}

            {/* Employee of the Month */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <span className="employee-of-month">⭐ Empleado del Mes</span>
            </div>

            {/* Medallas */}
            {formData.medals && formData.medals.length > 0 && (
              <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  🏆 MEDALLAS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                  {formData.medals.map(medal => (
                    <span
                      key={medal.id}
                      className={`medal ${medal.color}`}
                      title={medal.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Footer con firma - CREDENTIAL STYLE */}
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              marginTop: 'auto',
              borderTop: '2px dashed var(--color-border-light)',
              background: 'var(--color-bg-primary)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '4px',
                background: 'linear-gradient(90deg, #5775D0, #8bc34a)',
                borderRadius: '2px'
              }} />
              <div style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Creado por <span style={{ color: '#5775D0', fontWeight: 700 }}>@Jacinto.Cards</span>
              </div>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: '#5775D0',
                fontWeight: 600
              }}>
                #CVGatuno • #jacintocards
              </div>
            </div>

            {/* Mecenas block */}
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
              <div className="mecenas-block">
                ☕ ¿Te gusta MiauCV? Invítanos una latita (Mecenas Gatuno)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de compartir */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowShareModal(false)}
            >
              ✕
            </button>

            <h2 style={{
              fontFamily: 'var(--font-family-heading)',
              textAlign: 'center',
              marginBottom: 'var(--spacing-xl)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xl)'
            }}>
              📤 Compartir CV
            </h2>

            {previewImage && (
              <div className="share-card">
                <img
                  src={previewImage}
                  alt="CV Share"
                  className="download-image"
                />
              </div>
            )}

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)' }}>Texto sugerido:</h4>
              <div className="share-text" style={{
                background: 'var(--gradient-cats-cafe)',
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'Plus Jakarta Sans, Inter, monospace',
                fontSize: 'var(--font-size-sm)',
                margin: '0.5rem 0',
                wordBreak: 'break-all',
                textAlign: 'left',
                border: '1px solid var(--color-border-medium)'
              }}>
                {shareText}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <button
                className="btn"
                onClick={copyToClipboard}
                style={{
                  background: 'var(--color-accent-secondary)',
                  borderColor: 'var(--color-accent-secondary-dark)',
                  color: '#fff'
                }}
              >
                📋 Copiar texto
              </button>

              <button
                className="btn"
                onClick={downloadImage}
                style={{
                  background: 'var(--color-accent-primary)',
                  borderColor: 'var(--color-accent-primary-dark)',
                  color: '#fff'
                }}
              >
                📥 Descargar imagen
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowShareModal(false)}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={{
              textAlign: 'center',
              marginTop: 'var(--spacing-xl)',
              padding: 'var(--spacing-sm)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)'
            }}>
              <p style={{ margin: '0.25rem 0' }}>Comparte tu CV gatuno con el mundo 🐾</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CVPreview