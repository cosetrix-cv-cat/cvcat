import React, { useState, useRef, useEffect, useMemo } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { professionCombos, schedules } from '../data/catOptions.js'
import { crearPublicacion, uploadCatPhoto } from '../lib/supabaseClient.js'

function CVPreview({ formData, onDownload, onDownloadReady, showShareModal, setShowShareModal, previewImage, setPreviewImage, user }) {
  const cardRef = useRef(null)
  const [shareText, setShareText] = useState('')
  const [showDonationCard, setShowDonationCard] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showDownloadSelector, setShowDownloadSelector] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState('PNG')
  const [selectedAspect, setSelectedAspect] = useState('natural')

  // Helper compartido: captura la tarjeta del CV de forma segura (sin carreras, sin pantalla negra, sin recortes)
  const captureCard = async () => {
    if (!cardRef.current) {
      throw new Error('Contenedor del CV no disponible')
    }

    const card = cardRef.current
    const originalWidth = card.style.width
    const originalHeight = card.style.height
    const originalOverflow = card.style.overflow
    const originalMaxWidth = card.style.maxWidth

    try {
      // Asegurar dimensiones completas sin deformar
      card.style.width = 'auto'
      card.style.height = 'auto'
      card.style.maxWidth = 'none'
      card.style.overflow = 'visible'

      // Pre-procesar imágenes (blob:/externas) a dataURL para evitar CORS y pantalla negra
      const images = card.querySelectorAll('img')
      for (const img of images) {
        if (img.src && !img.src.startsWith('data:')) {
          try {
            img.setAttribute('crossOrigin', 'anonymous')
            const response = await fetch(img.src, { mode: 'cors' })
            const blob = await response.blob()
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result)
              reader.readAsDataURL(blob)
            })
            img.src = dataUrl
          } catch (e) {
            console.warn('No se pudo convertir imagen a dataURL:', e)
            img.setAttribute('crossOrigin', 'anonymous')
          }
        }
      }

      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 15000
      })

      return canvas.toDataURL('image/png')
    } finally {
      // Siempre restaurar estilos originales, incluso si falla
      card.style.width = originalWidth
      card.style.height = originalHeight
      card.style.maxWidth = originalMaxWidth
      card.style.overflow = originalOverflow
    }
  }

  // Registrar función de descarga para App (ref directa, sin carrera)
  useEffect(() => {
    if (onDownloadReady) {
      onDownloadReady(captureCard)
    }
  }, [onDownloadReady])

  // Determinar si hay combo aplicado
  const getActiveCombo = () => {
    return professionCombos.find(combo =>
      combo.condition.every(id => formData.professional.some(p => p.id === id))
    )
  }

  const activeCombo = getActiveCombo()

  // ============================================================
  // NIVEL GATUNO - Cálculo de nivel profesional
  // ============================================================
  const catLevel = useMemo(() => {
    let score = 0
    const breakdown = {
      profesiones: 0,
      habilidades: 0,
      medallas: 0,
      combo: 0
    }

    // Profesiones: puntos por cantidad y nivel
    if (Array.isArray(formData.professional) && formData.professional.length > 0) {
      const profScore = formData.professional.reduce((acc, prof) => {
        const level = prof.level || 1
        return acc + level * 10
      }, 0)
      score += profScore
      breakdown.profesiones = profScore
    }

    // Habilidades: suma de niveles / 4 * 50 max
    if (Array.isArray(formData.skills) && formData.skills.length > 0) {
      const skillScore = Math.min(50, formData.skills.reduce((acc, skill) => {
        const level = skill.level || 1
        return acc + level * 5
      }, 0))
      score += skillScore
      breakdown.habilidades = skillScore
    }

    // Medallas: 15 puntos por medalla
    if (Array.isArray(formData.medals) && formData.medals.length > 0) {
      const medalScore = Math.min(40, formData.medals.length * 15)
      score += medalScore
      breakdown.medallas = medalScore
    }

    // Combo activo: bonus
    if (activeCombo) {
      score += 30
      breakdown.combo = 30
    }

    // Determinar nivel y título
    let level = 'Gatito Novato'
    let levelIcon = '🐣'
    let levelColor = 'var(--color-accent-secondary)'
    let levelBg = 'rgba(139, 195, 74, 0.15)'
    let nextThreshold = 50

    if (score >= 200) {
      level = 'Gran Maestro Gatuno'
      levelIcon = '👑'
      levelColor = '#DAA520'
      levelBg = 'rgba(218, 165, 32, 0.2)'
      nextThreshold = null
    } else if (score >= 150) {
      level = 'Experto Felino'
      levelIcon = '🦁'
      levelColor = '#FF8C00'
      levelBg = 'rgba(255, 140, 0, 0.2)'
      nextThreshold = 200
    } else if (score >= 100) {
      level = 'Profesional Ronroneante'
      levelIcon = '🦚'
      levelColor = '#FF6B6B'
      levelBg = 'rgba(255, 107, 107, 0.2)'
      nextThreshold = 150
    } else if (score >= 70) {
      level = 'Aprendiz de Bigotes'
      levelIcon = '🐔'
      levelColor = '#5775D0'
      levelBg = 'rgba(87, 117, 208, 0.2)'
      nextThreshold = 100
    } else if (score >= 40) {
      level = 'Gatito Curioso'
      levelIcon = '🐱'
      levelColor = '#8bc34a'
      levelBg = 'rgba(139, 195, 74, 0.15)'
      nextThreshold = 70
    } else {
      nextThreshold = 40
    }

    const progress = nextThreshold ? Math.min(100, ((score - (nextThreshold - 50)) / 50) * 100) : 100

    return {
      score: Math.min(score, 200),
      level,
      levelIcon,
      levelColor,
      levelBg,
      progress,
      nextThreshold,
      breakdown
    }
  }, [formData.professional, formData.skills, formData.medals, activeCombo])

  // Toggle donation card
  const toggleDonationCard = () => {
    setShowDonationCard(!showDonationCard)
  }

  // Register download function with parent
  useEffect(() => {
    if (onDownloadReady) {
      onDownloadReady(handleDownload)
    }
  }, [onDownloadReady])

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
    setShowDownloadSelector(true)
  }

  const handleDownloadExecute = async () => {
    try {
      const image = await captureCard()

      if (selectedFormat === 'PDF') {
        // Generar PDF A4 con jspdf
        const orientation = selectedAspect === 'Horizontal' ? 'l' : 'p'
        const pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format: 'a4'
        })

        // Dimensiones A4 en mm
        const pageWidth = orientation === 'p' ? 210 : 297
        const pageHeight = orientation === 'p' ? 297 : 210
        const margin = 10
        const usableWidth = pageWidth - 2 * margin
        const usableHeight = pageHeight - 2 * margin

        // Calcular proporción para ajustar (contain) sin recortar
        const imgProps = pdf.getImageProperties(image)
        const imgAspect = imgProps.width / imgProps.height
        const pageAspect = usableWidth / usableHeight

        let pdfWidth, pdfHeight
        if (imgAspect > pageAspect) {
          pdfWidth = usableWidth
          pdfHeight = usableWidth / imgAspect
        } else {
          pdfHeight = usableHeight
          pdfWidth = usableHeight * imgAspect
        }

        const x = (pageWidth - pdfWidth) / 2
        const y = (pageHeight - pdfHeight) / 2

        pdf.addImage(image, 'PNG', x, y, pdfWidth, pdfHeight)
        pdf.save(`MiauCV_${formData.name || 'gatito'}.pdf`)
      } else {
        // PNG o JPG con relación de aspecto
        const link = document.createElement('a')
        const fileName = `MiauCV_${formData.name || 'gatito'}.${selectedFormat.toLowerCase()}`
        link.download = fileName

        if (selectedAspect === 'natural') {
          link.href = image
          link.click()
        } else {
          // Aplicar relación de aspecto con fondo limpio (sin recortar)
          const aspectRatios = {
            '1:1': 1,
            '4:5': 4 / 5,
            '9:16': 9 / 16,
            '16:9': 16 / 9
          }
          const targetAspect = aspectRatios[selectedAspect] || 1

          const canvas = document.createElement('canvas')
          const img = new Image()
          img.src = image
          await new Promise((resolve) => { img.onload = resolve })

          const imgAspect = img.width / img.height

          let canvasWidth, canvasHeight
          if (imgAspect > targetAspect) {
            canvasWidth = img.width
            canvasHeight = img.width / targetAspect
          } else {
            canvasHeight = img.height
            canvasWidth = img.height * targetAspect
          }

          canvas.width = canvasWidth
          canvas.height = canvasHeight

          const ctx = canvas.getContext('2d')
          // Fondo blanco limpio
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)

          // Centrar la imagen (contain)
          const drawX = (canvasWidth - img.width) / 2
          const drawY = (canvasHeight - img.height) / 2
          ctx.drawImage(img, drawX, drawY, img.width, img.height)

          const mime = selectedFormat === 'JPG' ? 'image/jpeg' : 'image/png'
          const quality = selectedFormat === 'JPG' ? 0.9 : undefined
          link.href = canvas.toDataURL(mime, quality)
          link.click()
        }

        alert(`✅ ¡CV descargado como ${selectedFormat}!`)
      }

      setShowDownloadSelector(false)
    } catch (error) {
      console.error('Error al descargar:', error)
      alert(`❌ Error al descargar: ${error.message || 'Error desconocido'}`)
    }
  }

  // Compartir al Muro Social - publica en publicaciones_gato
  const handleShareToSocial = async () => {
    if (!user) {
      alert('⚠️ Debes iniciar sesión para compartir en el Muro Social')
      return
    }

    setIsSharing(true)

    try {
      const image = await captureCard()

      // Subir imagen a Supabase Storage
      let fotoUrl = ''
      try {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], `cv_share_${formData.name || 'gatito'}_${Date.now()}.png`, { type: 'image/png' })
        const result = await uploadCatPhoto(file, user.id)
        if (result.url) {
          fotoUrl = result.url
        } else if (result.error) {
          alert(`⚠️ No se pudo subir la imagen del CV: ${result.error}. Se publicará sin foto.`)
        }
      } catch (err) {
        console.warn('No se pudo subir la imagen, publicando sin foto:', err)
        alert('⚠️ Error al subir imagen del CV. Se publicará sin foto.')
      }

      // Crear texto de la publicación (usa datos actuales de formData)
      const texto = `¡Acabo de crear mi CV gatuno con MiauCV! 🐱

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

creado por @Jacinto.Cards`

      // Crear publicación en el Muro Social
      const result = await crearPublicacion(user.id, {
        foto_url: fotoUrl,
        texto: texto,
        etiqueta_profesion: formData.professional?.[0]?.name || ''
      })

      if (result.error) {
        alert(`❌ Error al compartir: ${result.error}`)
        return
      }

      // Éxito
      alert('✅ ¡CV compartido en el Muro Social!')
      setShowShareModal(false)
      
    } catch (error) {
      console.error('Error al compartir en Muro Social:', error)
      alert(`❌ Error al compartir: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsSharing(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)

    try {
      const image = await captureCard()
      setPreviewImage(image)
      setShowShareModal(true)
    } catch (error) {
      console.error('Error al generar imagen:', error)
      alert(`❌ Error al generar la vista previa: ${error.message || 'Error desconocido'}`)
    } finally {
      setIsSharing(false)
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
              crossOrigin="anonymous"
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

          {/* Avatar circular centrado - display:block, object-fit:cover, object-position: center top para que se vea la cara del gato */}
          {formData.photoPreview ? (
            <img
              src={formData.photoPreview}
              alt="Gato"
              className="cat-avatar"
              crossOrigin="anonymous"
              style={{
                display: 'block',
                width: '160px',
                height: '160px',
                borderRadius: 'var(--radius-full)',
                objectFit: 'cover',
                objectPosition: 'center 20%',
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
                  💰 SALARIO DESEADO (USD)
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 500
                }}>
                  {formData.desiredSalary.includes('$') ? formData.desiredSalary : `🐱 $${formData.desiredSalary.replace(/[^0-9.]/g, '')}K`}
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

            {/* ============================================================
               NIVEL GATUNO - Indicador visual de nivel
               ============================================================ */}
            <div style={{
              marginBottom: 'var(--spacing-xl)',
              padding: 'var(--spacing-lg)',
              background: catLevel.levelBg,
              borderRadius: 'var(--radius-lg)',
              border: `2px solid ${catLevel.levelColor}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Barra de progreso de fondo */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <span style={{
                    fontSize: '3rem',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                    animation: 'gentle-bounce 2s ease-in-out infinite'
                  }}>
                    {catLevel.levelIcon}
                  </span>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 700,
                      color: catLevel.levelColor,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {catLevel.level}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      color: 'var(--color-accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginTop: '2px'
                    }}>
                      Nivel Gatuno: {catLevel.score} pts
                    </div>
                  </div>
                </div>
                
                {/* Barra de progreso */}
                <div style={{
                  flex: 1,
                  minWidth: '150px',
                  maxWidth: '200px',
                  height: '12px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${catLevel.progress}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${catLevel.levelColor}, ${catLevel.levelColor}dd)`,
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.5s ease-out',
                    boxShadow: `0 0 8px ${catLevel.levelColor}88`
                  }} />
                </div>
                
                {catLevel.nextThreshold && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    fontFamily: 'var(--font-family-heading)',
                    whiteSpace: 'nowrap'
                  }}>
                    {catLevel.nextThreshold - catLevel.score} pts para el siguiente nivel
                  </span>
                )}
              </div>
              
              {/* Desglose compacto */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--spacing-lg)',
                marginTop: 'var(--spacing-md)',
                paddingTop: 'var(--spacing-md)',
                borderTop: '1px solid rgba(0,0,0,0.08)',
                flexWrap: 'wrap'
              }}>
                {catLevel.breakdown.profesiones > 0 && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    💼 {catLevel.breakdown.profesiones}
                  </span>
                )}
                {catLevel.breakdown.habilidades > 0 && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⚡ {catLevel.breakdown.habilidades}
                  </span>
                )}
                {catLevel.breakdown.medallas > 0 && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🏆 {catLevel.breakdown.medallas}
                  </span>
                )}
                {catLevel.breakdown.combo > 0 && (
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: '#ff9800',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔥 {catLevel.breakdown.combo}
                  </span>
                )}
              </div>
            </div>

            {/* ============================================================
               TARJETA DE APOYO - LATITA DE ATÚN / MECENES GATUNO
               ============================================================ */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <button
                onClick={toggleDonationCard}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px dashed var(--color-accent-pink)',
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.08))',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--spacing-sm)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-pink-dark)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15))'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-pink)'
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(168, 85, 247, 0.08))'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <span style={{ fontSize: '1.5rem', animation: 'tin-wobble 1.5s ease-in-out infinite' }}>
                  🐟
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-heading)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 600,
                  color: 'var(--color-accent-pink)'
                }}>
                  {showDonationCard ? 'Gracias por tu apoyo ❤️' : '🐟 Invítanos una latita de atún (Mecenas Gatuno)'}
                </span>
                <span style={{
                  fontSize: '1rem',
                  transition: 'transform 0.3s ease',
                  transform: showDonationCard ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  ▾
                </span>
              </button>
              
              {/* Contenido expandible de la tarjeta de donación */}
              {showDonationCard && (
                <div style={{
                  marginTop: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  background: 'linear-gradient(135deg, #fce4ec 0%, #f3e5f5 100%)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <span style={{ fontSize: '2.5rem' }}>🐟</span>
                    <h4 style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-lg)',
                      color: 'var(--color-accent-pink-dark)',
                      margin: 'var(--spacing-sm) 0'
                    }}>
                      ¡Gracias por considerar apoyar MiauCV!
                    </h4>
                    <p style={{
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      lineHeight: 1.5
                    }}>
                      Tu apoyo nos ayuda a mantener el proyecto, añadir más profesiones,
                      combos, medallas y mejorar la experiencia gatuna.
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)'
                  }}>
                    <button
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-accent-pink)',
                        background: '#fff',
                        color: 'var(--color-accent-pink)',
                        fontFamily: 'var(--font-family-heading)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert('☕ ¡Gracias! Redirigiendo a Ko-fi... (placeholder)')}
                    >
                      ☕ Ko-fi (Café)
                    </button>
                    <button
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-accent-primary)',
                        background: '#fff',
                        color: 'var(--color-accent-primary)',
                        fontFamily: 'var(--font-family-heading)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert('💙 ¡Gracias! Redirigiendo a GitHub Sponsors... (placeholder)')}
                    >
                      💙 GitHub Sponsors
                    </button>
                    <button
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid var(--color-accent-secondary)',
                        background: '#fff',
                        color: 'var(--color-accent-secondary)',
                        fontFamily: 'var(--font-family-heading)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => alert('🐟 ¡Gracias! Redirigiendo a Buy Me a Coffee... (placeholder)')}
                    >
                      🐟 Buy Me a Coffee
                    </button>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--color-accent-pink)'
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-family-heading)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-accent-pink-dark)',
                      margin: 0
                    }}>
                      🎁 Los Mecenas reciben: Badge exclusivo en su CV + Acceso anticipado a nuevas features
                    </p>
                  </div>
                </div>
              )}
            </div>

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
                onClick={handleShareToSocial}
                style={{
                  background: 'var(--color-accent-primary)',
                  borderColor: 'var(--color-accent-primary-dark)',
                  color: '#fff'
                }}
              >
                🐱 Compartir en Muro Social
              </button>

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

      {/* Selector de descarga con formato y relación de aspecto */}
      {showDownloadSelector && (
        <div className="modal-overlay" onClick={() => setShowDownloadSelector(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowDownloadSelector(false)}
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
              📥 Descargar CV
            </h2>

            {/* Formato */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: 'var(--spacing-sm)'
              }}>
                📄 Formato
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {['PNG', 'JPG', 'PDF'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${selectedFormat === fmt ? 'var(--color-accent-primary)' : 'var(--color-border-medium)'}`,
                      background: selectedFormat === fmt ? 'var(--color-accent-primary)' : '#fff',
                      color: selectedFormat === fmt ? '#fff' : 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      fontFamily: 'var(--font-family-heading)'
                    }}
                  >
                    {fmt === 'PDF' ? 'PDF A4' : fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Orientación / Relación de aspecto */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'block',
                marginBottom: 'var(--spacing-sm)'
              }}>
                {selectedFormat === 'PDF'
                  ? '📐 Orientación A4'
                  : '📐 Relación de Aspecto'}
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {selectedFormat === 'PDF'
                  ? ['Vertical', 'Horizontal'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedAspect(opt)}
                        style={{
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${selectedAspect === opt ? 'var(--color-accent-primary)' : 'var(--color-border-medium)'}`,
                          background: selectedAspect === opt ? 'var(--color-accent-primary)' : '#fff',
                          color: selectedAspect === opt ? '#fff' : 'var(--color-text-primary)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 500,
                          fontFamily: 'var(--font-family-heading)'
                        }}
                      >
                        {opt}
                      </button>
                    ))
                  : ['natural', '1:1', '4:5', '9:16', '16:9'].map((opt) => {
                      const labels = {
                        natural: 'Natural',
                        '1:1': '1:1',
                        '4:5': '4:5',
                        '9:16': '9:16',
                        '16:9': '16:9'
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSelectedAspect(opt)}
                          style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${selectedAspect === opt ? 'var(--color-accent-primary)' : 'var(--color-border-medium)'}`,
                            background: selectedAspect === opt ? 'var(--color-accent-primary)' : '#fff',
                            color: selectedAspect === opt ? '#fff' : 'var(--color-text-primary)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 500,
                            fontFamily: 'var(--font-family-heading)'
                          }}
                        >
                          {labels[opt]}
                        </button>
                      )
                    })}
              </div>
            </div>

            {/* Botón de ejecutar descarga */}
            <button
              type="button"
              onClick={handleDownloadExecute}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-accent-primary)',
                color: '#fff',
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                fontFamily: 'var(--font-family-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📥 Descargar CV
            </button>
          </div>
        </div>
      )}
      
    </>
  )
}

export default CVPreview