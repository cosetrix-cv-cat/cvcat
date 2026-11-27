import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { professionCombos, schedules } from '../data/catOptions.js'

function CVPreview({ formData, onDownload, showShareModal, setShowShareModal, previewImage, setPreviewImage }) {
  const cardRef = useRef(null)
  const [shareText, setShareText] = useState('')
  const [viralText, setViralText] = useState('')

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
${Array.isArray(formData.skills) ? Object.entries(formData.skills)?.map(([id, level]) => {
  const skill = [{id:'caza',name:'Caza',icon:'🎯'},{id:'agilidad',name:'Agilidad',icon:'🐾'},{id:'ronroneo',name:'Ronroneo',icon:'😸'},{id:'sigilo',name:'Sigilo',icon:'👣'},{id:'inteligencia',name:'Inteligencia',icon:'🧠'},{id:'carisma',name:'Carisma',icon:'⭐'},{id:'adaptabilidad',name:'Adaptabilidad',icon:'🔄'},{id:'paciencia',name:'Paciencia',icon:'⏳'}].find(s => s.id === id)
  return skill ? `  • ${skill.icon} ${skill.name} (${level}/5)` : ''
}).join('\n') : ''}

Horas de sueño: ${formData.sleepHours}h
Compatibilidad: ${formData.compatibility}

#CVGatuno #JacintoCards #MiauCV
creado por @Jacinto.Cards`

    setShareText(text)
  }, [formData])

  // Generar texto viral para copiar
  useEffect(() => {
    const mainProfession = formData.professional[0]
    const text = `🐱 ¡Mi gato ${formData.name || 'Gatito'} (${formData.alias || 'sin alias'}) es oficialmente ${mainProfession ? `${mainProfession.icon} ${mainProfession.name}` : 'un gato profesional'}!

🏆 Nivel: ${mainProfession ? getLevelEmoji(mainProfession.level) : '🐱'}
😴 Duerme ${formData.sleepHours}h al día
🎯 Compatibilidad: ${formData.compatibility}

¿Crees que tu gato puede superar este CV? ¡Crea el tuyo en MiauCV! 

creado por @Jacinto.Cards
#CVGatuno #jacintocards #MiauCV`

    setViralText(text)
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

    // Validación previa: exigir nombre del gato
    if (!formData.name || formData.name.trim() === '') {
      alert('⚠️ Para descargar el CV, tu gato necesita un nombre. ¡Ponle nombre en el formulario!')
      return
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        logging: false
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

    // Validación previa: exigir nombre del gato
    if (!formData.name || formData.name.trim() === '') {
      alert('⚠️ Para compartir el CV, tu gato necesita un nombre. ¡Ponle nombre en el formulario!')
      return
    }

    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        logging: false
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
      await navigator.clipboard.writeText(viralText)
      alert('✅ ¡Texto viral copiado! Pégalo donde quieras 🐱')
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
      {/* Vista previa del CV */}
      <div className="flex flex-col items-center" style={{ 
        padding: '1.5rem', 
        overflowY: 'auto',
        background: 'var(--gradient-cats-cafe)',
        minHeight: '100%'
      }}>
        <div 
          ref={cardRef}
          className={`cv-card bg-${formData.background}`}
          style={{
            maxWidth: '500px',
            width: '100%',
            borderRadius: 'var(--radius-3xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border-light)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
          }}
        >
          {/* Header banda principal */}
          <div style={{
            background: 'var(--gradient-header)',
            color: '#ffffff',
            padding: '2.5rem 2rem 2rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <h2 style={{
              fontFamily: "'Nunito', Inter, sans-serif",
              fontSize: '2.5rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.03em',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              {formData.name || 'GATITO'}
            </h2>
            {formData.alias && (
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 500,
                marginTop: '0.5rem',
                opacity: 0.95
              }}>
                {formData.alias}
              </p>
            )}
          </div>

          {/* Avatar circular PERFECTO */}
          {formData.photoPreview ? (
            <img 
              src={formData.photoPreview} 
              alt="Gato" 
              className="cat-avatar"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'center',
                border: '6px solid #ffffff',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
                margin: '-75px auto 2.5rem',
                transition: 'transform 0.3s ease'
              }}
            />
          ) : (
            <div className="cat-avatar-placeholder">
              🐱
            </div>
          )}

          {/* Información del CV */}
          <div className="cv-content">
            {/* Empleado del Mes */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="employee-of-month">
                ⭐ Empleado del Mes
              </span>
            </div>

            {/* Ubicación */}
            {formData.location && (
              <div className="cv-info" style={{ marginBottom: '2rem' }}>
                <span className="label">UBICACIÓN</span>
                <div className="value">
                  {formData.location} {formData.flag}
                </div>
              </div>
            )}

            {/* Color y patrón */}
            {(formData.furColor || formData.furPattern) && (
              <div className="cv-info" style={{ marginBottom: '2rem' }}>
                <span className="label">PELAJE</span>
                <div className="value">
                  {formData.furPattern} {formData.furColor ? getColorName(formData.furColor) : ''}
                </div>
              </div>
            )}

            {/* Edad */}
            {formData.age && (
              <div className="cv-info" style={{ marginBottom: '2rem' }}>
                <span className="label">EDAD</span>
                <div className="value">
                  {formData.age} años
                </div>
              </div>
            )}

            {/* Profesiones con combo */}
            {formData.professional && formData.professional.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <span className="section-title">PROFESIONES</span>
                <div className="profession-badges">
                  {formData.professional.map((prof, idx) => (
                    <span 
                      key={idx}
                      className="profession-badge"
                    >
                      {prof.icon} {getLevelEmoji(prof.level)} {prof.name}
                    </span>
                  ))}
                </div>
                {activeCombo && (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #ff9800, #f44336)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: "'Nunito', sans-serif"
                    }}>
                      🔥 Combo: {activeCombo.result.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Habilidades */}
            {Object.keys(formData.skills).length > 0 && (
              <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(87, 117, 208, 0.05)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(87, 117, 208, 0.1)'
              }}>
                <span className="section-title">HABILIDADES</span>
                <div className="skill-badges">
                  {Object.entries(formData.skills).map(([skillId, level]) => {
                    const skill = [
                      {id:'caza',name:'Caza',icon:'🎯'},
                      {id:'agilidad',name:'Agilidad',icon:'🐾'},
                      {id:'ronroneo',name:'Ronroneo',icon:'😸'},
                      {id:'sigilo',name:'Sigilo',icon:'👣'},
                      {id:'inteligencia',name:'Inteligencia',icon:'🧠'},
                      {id:'carisma',name:'Carisma',icon:'⭐'},
                      {id:'adaptabilidad',name:'Adaptabilidad',icon:'🔄'},
                      {id:'paciencia',name:'Paciencia',icon:'⏳'}
                    ].find(s => s.id === skillId)
                    return skill ? (
                      <span key={skillId} className="skill-badge">
                        {skill.icon} {skill.name} ({level}/5)
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )}

            {/* Horario y sueño */}
            <div style={{ 
              display: 'flex', 
              gap: '2rem', 
              marginBottom: '2rem',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <span className="label">HORARIO</span>
                <span style={{ 
                  fontSize: '1.125rem', 
                  color: '#1a1a1a', 
                  marginTop: '0.5rem',
                  fontWeight: 600
                }}>
                  {schedules.find(s => s.value === formData.schedule)?.label || formData.schedule}
                </span>
              </div>
              {formData.sleepHours && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <span className="label">SUEÑO</span>
                  <span style={{ 
                    fontSize: '1.125rem', 
                    color: '#1a1a1a', 
                    marginTop: '0.5rem',
                    fontWeight: 600
                  }}>
                    {formData.sleepHours}h
                  </span>
                </div>
              )}
            </div>

            {/* Comentarios adicionales */}
            {formData.desiredSalary && (
              <div className="cv-info" style={{ marginBottom: '2rem' }}>
                <span className="label">SALARIO DESEADO</span>
                <div className="value">
                  {formData.desiredSalary}
                </div>
              </div>
            )}

            {/* Medallas */}
            {formData.medals && formData.medals.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <span className="section-title">MEDALLAS</span>
                <div className="medals-container">
                  {formData.medals.map(medal => (
                    <span 
                      key={medal.id}
                      className="medal"
                      title={medal.name}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer con firma - CORREGIDO */}
            <div className="cv-footer">
              <div className="signature">
                Creado por <strong>@Jacinto.Cards</strong>
              </div>
              <div className="hashtags">
                #CVGatuno #jacintocards
              </div>
            </div>

            {/* Mecenas Block */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <div className="mecenas-block">
                ☕ ¿Te gusta MiauCV? Invítanos una latita (Mecenas Gatuno)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de compartir viral */}
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
              textAlign: 'center', 
              marginBottom: '2rem',
              fontFamily: "'Nunito', sans-serif",
              fontSize: '2rem',
              fontWeight: 800,
              color: '#1a1a1a',
              background: 'linear-gradient(90deg, #ec4899, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📤 Compartir Viral
            </h2>

            {previewImage && (
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <img 
                  src={previewImage} 
                  alt="CV Share" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: 'var(--radius-xl)',
                    objectFit: 'contain',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ 
                marginBottom: '1rem', 
                color: '#1a1a1a',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700
              }}>Texto viral listo para copiar:</h4>
              <div style={{ 
                background: 'var(--gradient-rose)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'Inter, monospace',
                fontSize: '13px',
                margin: '0',
                wordBreak: 'break-word',
                textAlign: 'left',
                border: '1px solid var(--color-border-medium)',
                color: '#1a1a1a',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {viralText}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem' 
            }}>
              <button 
                className="btn btn-viral"
                onClick={copyToClipboard}
                style={{ width: '100%' }}
              >
                📋 Copiar Texto Viral
              </button>
              
              <button 
                className="btn btn-primary"
                onClick={downloadImage}
                style={{ width: '100%' }}
              >
                📥 Descargar Imagen
              </button>

              <button 
                className="btn btn-secondary"
                onClick={() => setShowShareModal(false)}
                style={{ width: '100%' }}
              >
                ✕ Cerrar
              </button>
            </div>

            <div style={{ 
              textAlign: 'center', 
              marginTop: '2rem', 
              padding: '1rem',
              fontSize: '0.85rem',
              color: '#8a8a8a',
              fontFamily: "'Nunito', sans-serif"
            }}>
              <p>Comparte tu CV gatuno y reta a tus amigos 🐾</p>
              <p style={{ marginTop: '0.5rem', color: '#ec4899', fontWeight: 700 }}>
                #CVGatuno #jacintocards
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CVPreview