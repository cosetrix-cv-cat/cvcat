import React from 'react'
import {
  locationOptions,
  furPatternOptions,
  professions,
  professionCombos,
  skills,
  schedules,
  compatibilityOptions,
  backgrounds,
  medals,
  levels,
  furColorOptions
} from '../data/catOptions.js'

function CVForm({ formData, updateField, onPhotoUpload, onDownload, onShare, photoUploadError, setPhotoUploadError }) {
  const getRandomValue = (arr) => arr[Math.floor(Math.random() * arr.length)]

  const getRandomProfession = () => {
    const pro = getRandomValue(professions)
    const level = getRandomValue(levels)
    return {
      id: pro.id,
      name: pro.name,
      level: level.value,
      description: pro.description,
      icon: pro.icon
    }
  }

  const getRandomSkills = () => {
    const skillCount = Math.floor(Math.random() * 4) + 2
    const shuffled = [...skills].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, skillCount).map(skill => ({
      id: skill.id,
      name: skill.name,
      icon: skill.icon,
      description: skill.description,
      level: Math.floor(Math.random() * 4) + 1
    }))
  }

  const generateRandomCV = () => {
    const randomLocation = getRandomValue(locationOptions)
    const randomBackground = getRandomValue(backgrounds)
    const randomMedals = []
    const medalCount = Math.floor(Math.random() * 5) + 2
    const shuffledMedals = [...medals].sort(() => 0.5 - Math.random())

    for (let i = 0; i < medalCount; i++) {
      randomMedals.push(shuffledMedals[i])
    }

    const randomProfessions = []
    const profCount = Math.floor(Math.random() * 3) + 2
    const shuffledPros = [...professions].sort(() => 0.5 - Math.random())

    for (let i = 0; i < profCount; i++) {
      randomProfessions.push(getRandomProfession())
    }

    const combo = professionCombos.find(combo =>
      combo.condition.every(id => randomProfessions.some(p => p.id === id))
    )

    if (combo && !randomProfessions.some(p => p.id === combo.result.id)) {
      randomProfessions.push(combo.result)
    }

    const sleepHours = Math.floor(Math.random() * 11) + 12

    updateField('name', `Gatito ${Math.random().toString(36).substring(2, 6).toUpperCase()}`)
    const aliases = ['Pelusa', 'Minino', 'Tigre', 'Nube', 'Firulais', 'Michi', 'Gordo', 'Siamés']
    updateField('alias', `🐱 ${aliases[Math.floor(Math.random() * aliases.length)]}`)
    updateField('age', Math.floor(Math.random() * 15) + 2)
    updateField('location', randomLocation.city)
    updateField('flag', randomLocation.flag)
    updateField('furColor', getRandomValue(furColorOptions).value)
    updateField('furPattern', getRandomValue(furPatternOptions))
    updateField('professional', randomProfessions)
    updateField('skills', getRandomSkills())
    updateField('schedule', getRandomValue(schedules).value)
    updateField('sleepHours', sleepHours)
    updateField('desiredSalary', `🐱 ${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}K`)
    updateField('compatibility', getRandomValue(compatibilityOptions).value)
    updateField('background', randomBackground.value)
    updateField('medals', randomMedals)

    setTimeout(() => {
      alert('🎲 ¡Datos generados al azar! ¡Listo para el sueño de 8 horas!')
    }, 100)
  }

  return (
    <div style={{
      background: 'var(--gradient-cats-cafe)',
      padding: 'var(--spacing-xl)',
      overflowY: 'auto',
      flex: 1
    }}>
      <div className="form-header">
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xxl)', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>📝 Información del CV</h2>
        <p style={{ color: '#666', margin: '0.5rem 0', fontSize: 'var(--font-size-base)' }}>Completa los datos o usa el generador aleatorio</p>
      </div>

      <div className="form-grid">
        {/* Foto */}
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Foto (opcional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={onPhotoUpload}
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-border-medium)',
                cursor: 'pointer',
                background: '#fff'
              }}
            />
            {photoUploadError && (
              <div style={{
                color: 'var(--color-accent-error)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-heading)',
                padding: 'var(--spacing-xs) 0'
              }}>
                ⚠️ {photoUploadError}
              </div>
            )}
            {formData.photoPreview && (
              <div style={{ 
                position: 'relative', 
                display: 'inline-block', 
                maxWidth: '100%',
                width: '100%',
                aspectRatio: '4 / 3',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                background: 'var(--color-border-medium)'
              }}>
                <img
                  src={formData.photoPreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block'
                  }}
                />
              </div>
            )}
          </label>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Nombre</span>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Nombre del gato"
            />
          </label>
        </div>

        {/* Alias */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Alias/Apodo</span>
            <input
              type="text"
              className="input"
              value={formData.alias}
              onChange={e => updateField('alias', e.target.value)}
              placeholder="Ej: Pelusa, Minino"
            />
          </label>
        </div>

        {/* Edad */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Edad</span>
            <input
              type="number"
              className="input"
              value={formData.age}
              onChange={e => updateField('age', e.target.value)}
              placeholder="Edad en años"
              min="1"
              max="30"
            />
          </label>
        </div>

        {/* Ubicación */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Ubicación</span>
            <input
              type="text"
              className="input"
              value={formData.location}
              onChange={e => updateField('location', e.target.value)}
              placeholder="Ciudad"
            />
          </label>
        </div>

        {/* Bandera */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Bandera</span>
            <input
              type="text"
              className="input"
              value={formData.flag}
              onChange={e => updateField('flag', e.target.value)}
              placeholder="🌐"
            />
          </label>
        </div>

        {/* Color de pelaje */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Color de Pelaje</span>
            <select
              className="select"
              value={formData.furColor}
              onChange={e => updateField('furColor', e.target.value)}
            >
              <option value="">Selecciona un color</option>
              {furColorOptions.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Patrón de pelaje */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Patrón de Pelaje</span>
            <select
              className="select"
              value={formData.furPattern}
              onChange={e => updateField('furPattern', e.target.value)}
            >
              {furPatternOptions.map((pattern) => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Salario deseado */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Salario Deseado</span>
            <input
              type="text"
              className="input"
              value={formData.desiredSalary}
              onChange={e => updateField('desiredSalary', e.target.value)}
              placeholder="🐱 2.5K"
            />
          </label>
        </div>

        {/* Horario */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Horario</span>
            <select
              className="select"
              value={formData.schedule}
              onChange={e => updateField('schedule', e.target.value)}
            >
              {schedules.map((schedule) => (
                <option key={schedule.value} value={schedule.value}>
                  {schedule.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Horas de sueño */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Horas de Sueño: {formData.sleepHours}h</span>
            <input
              type="range"
              className="slider"
              min="12"
              max="22"
              value={formData.sleepHours}
              onChange={e => updateField('sleepHours', parseInt(e.target.value))}
            />
          </label>
        </div>

        {/* Compatibilidad */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Compatibilidad</span>
            <select
              className="select"
              value={formData.compatibility}
              onChange={e => updateField('compatibility', e.target.value)}
            >
              {compatibilityOptions.map((comp) => (
                <option key={comp.value} value={comp.value}>
                  {comp.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Fondo */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Fondo</span>
            <select
              className="select"
              value={formData.background}
              onChange={e => updateField('background', e.target.value)}
            >
              {backgrounds.map((bg) => (
                <option key={bg.value} value={bg.value}>
                  {bg.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Medallas con pills */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-accent-primary)', fontFamily: 'var(--font-family-heading)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: 'var(--font-size-xs)', display: 'block', marginBottom: 'var(--spacing-xs)' }}>Medallas ({formData.medals?.length || 0})</span>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              {medals.map((medal) => (
                <label key={medal.id} className="pill-checkbox" style={{ padding: 'var(--spacing-xs) var(--spacing-sm)' }}>
                  <input
                    type="checkbox"
                    checked={formData.medals?.some(m => m.id === medal.id) || false}
                    onChange={(e) => {
                      const newMedals = e.target.checked
                        ? [...(formData.medals || []), medal]
                        : (formData.medals || []).filter(m => m.id !== medal.id)
                      updateField('medals', newMedals)
                    }}
                  />
                  <span style={{ fontSize: '1.2rem' }}>{medal.emoji}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, fontFamily: 'var(--font-family-heading)' }}>{medal.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botones con estilo mejorado */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        marginTop: 'var(--spacing-xl)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          className="btn random-btn"
          onClick={generateRandomCV}
          style={{ minHeight: '48px' }}
        >
          <span>🎲 Generar Aleatorio</span>
        </button>
        <button
          className="btn btn-secondary"
          onClick={onShare}
          style={{ minHeight: '48px' }}
        >
          <span>👥 Compartir</span>
        </button>
        <button
          className="btn btn-primary"
          onClick={onDownload}
          style={{ minHeight: '48px' }}
        >
          <span>📥 Descargar</span>
        </button>
      </div>

      <div className="form-footer" style={{
        textAlign: 'center',
        padding: 'var(--spacing-xl)',
        color: 'var(--color-text-tertiary)',
        fontSize: 'var(--font-size-xs)',
        borderTop: '1px dashed var(--color-border-light)',
        marginTop: 'var(--spacing-xl)'
      }}>
        <p style={{ margin: '0.25rem 0', fontSize: 'var(--font-size-xs)' }}>🐱 MiauCV - Currículum Gatuno Interactivo</p>
        <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '0.25rem', color: '#666' }}>Hecho con amor y muchas galletas 🐾</p>
        <p style={{ margin: '0.5rem 0', color: '#5775D0', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
          creado por <strong style={{ fontWeight: 700 }}>@Jacinto.Cards</strong>
        </p>
        <p style={{ margin: '0.25rem 0', color: '#5775D0', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
          #CVGatuno #jacintocards
        </p>
      </div>
    </div>
  )
}

export default CVForm