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

function CVForm({ formData, updateField, onPhotoUpload, onDownload, onShare }) {
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

    // Verificar combos
    const combo = professionCombos.find(combo => 
      combo.condition.every(id => randomProfessions.some(p => p.id === id))
    )

    if (combo && !randomProfessions.some(p => p.id === combo.result.id)) {
      randomProfessions.push(combo.result)
    }

    // Horas de sueño al azar
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

  // Helpers para el formulario
  const handleSkillChange = (skillId, value) => {
    updateField('skills', {
      ...formData.skills,
      [skillId]: parseInt(value)
    })
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', overflow: 'visible' }}>
      <div className="form-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ 
          fontSize: 'var(--font-size-xxxl)', 
          fontWeight: 800,
          fontFamily: "'Nunito', Inter, sans-serif",
          margin: 0,
          background: 'linear-gradient(90deg, #ec4899, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>📝 Información del CV</h2>
        <p style={{ color: 'var(--color-text-tertiary)', margin: '0.75rem 0 0', fontSize: '1rem' }}>
          Completa los datos o usa el generador aleatorio
        </p>
      </div>

      {/* Foto */}
      <div className="section-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ 
          fontSize: 'var(--font-size-lg)', 
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📸 <span>Foto del Gato</span>
        </h3>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={onPhotoUpload}
            className="input"
          />
          {formData.photoPreview && (
            <img 
              src={formData.photoPreview} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                maxHeight: '200px',
                borderRadius: 'var(--radius-xl)',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          )}
        </label>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Nombre */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Nombre del Gato</label>
          <input 
            type="text" 
            className="input" 
            value={formData.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder="Nombre del gato"
          />
        </div>

        {/* Alias */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Alias / Apodo</label>
          <input 
            type="text" 
            className="input" 
            value={formData.alias}
            onChange={e => updateField('alias', e.target.value)}
            placeholder="Ej: Pelusa, Minino"
          />
        </div>

        {/* Edad */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Edad</label>
          <input 
            type="number" 
            className="input" 
            value={formData.age}
            onChange={e => updateField('age', e.target.value)}
            placeholder="Edad en años"
            min="1"
            max="30"
          />
        </div>

        {/* Ubicación */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Ubicación</label>
          <input 
            type="text" 
            className="input" 
            value={formData.location}
            onChange={e => updateField('location', e.target.value)}
            placeholder="Ciudad"
          />
        </div>

        {/* Bandera */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Bandera</label>
          <input 
            type="text" 
            className="input" 
            value={formData.flag}
            onChange={e => updateField('flag', e.target.value)}
            placeholder="🌐"
          />
        </div>

        {/* Color de pelaje */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Color de Pelaje</label>
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
        </div>

        {/* Patrón de pelaje */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Patrón de Pelaje</label>
          <select 
            className="select"
            value={formData.furPattern}
            onChange={e => updateField('furPattern', e.target.value)}
          >
            {furPatternOptions.map((pattern) => (
              <option key={pattern} value={pattern}>{pattern}</option>
            ))}
          </select>
        </div>

        {/* Salario deseado */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Salario Deseado</label>
          <input 
            type="text" 
            className="input" 
            value={formData.desiredSalary}
            onChange={e => updateField('desiredSalary', e.target.value)}
            placeholder="🐱 2.5K"
          />
        </div>

        {/* Horario */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Horario</label>
          <select 
            className="select"
            value={formData.schedule}
            onChange={e => updateField('schedule', e.target.value)}
          >
            {schedules.map((schedule) => (
              <option key={schedule.value} value={schedule.value}>
                {schedule.emoji} {schedule.label}
              </option>
            ))}
          </select>
        </div>

        {/* Horas de sueño con slider */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="field-label" style={{ margin: 0 }}>
              Horas de Sueño
            </label>
            <span className="slider-value">{formData.sleepHours}h</span>
          </div>
          <div className="slider-container">
            <input 
              type="range" 
              className="slider"
              min="12" 
              max="22" 
              value={formData.sleepHours}
              onChange={e => updateField('sleepHours', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Compatibilidad */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Compatibilidad</label>
          <select 
            className="select"
            value={formData.compatibility}
            onChange={e => updateField('compatibility', e.target.value)}
          >
            {compatibilityOptions.map((comp) => (
              <option key={comp.value} value={comp.value}>
                {comp.emoji} {comp.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fondo */}
        <div className="section-card" style={{ padding: '1.5rem' }}>
          <label className="field-label">Fondo de la Tarjeta</label>
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
        </div>

        {/* Profesiones */}
        <div className="section-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <span className="section-title">💼 PROFESIONES</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {professions.map((profession) => (
              <label key={profession.id} className="pill-checkbox">
                <input 
                  type="checkbox"
                  checked={formData.professional.some(p => p.id === profession.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const level = levels[Math.floor(Math.random() * levels.length)]
                      updateField('professional', [
                        ...formData.professional,
                        {
                          id: profession.id,
                          name: profession.name,
                          level: level.value,
                          description: profession.description,
                          icon: profession.icon
                        }
                      ])
                    } else {
                      updateField('professional', 
                        formData.professional.filter(p => p.id !== profession.id)
                      )
                    }
                  }}
                />
                <span>{profession.icon} {profession.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Habilidades con sliders */}
        <div className="section-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <span className="section-title">⚡ HABILIDADES</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {skills.map((skill) => (
              <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{skill.icon}</span>
                <span style={{ 
                  fontWeight: 600, 
                  minWidth: '120px',
                  color: 'var(--color-text-primary)'
                }}>
                  {skill.name}
                </span>
                <div className="slider-container" style={{ flex: 1, margin: 0 }}>
                  <input 
                    type="range" 
                    className="slider"
                    min="1" 
                    max="5" 
                    value={formData.skills[skill.id] || 1}
                    onChange={e => handleSkillChange(skill.id, e.target.value)}
                  />
                  <span className="slider-value">
                    {formData.skills[skill.id] || 1}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medallas */}
        <div className="section-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <span className="section-title">🏆 MEDALLAS ({formData.medals?.length || 0})</span>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.75rem',
            justifyContent: 'center'
          }}>
            {medals.map((medal) => (
              <label key={medal.id} className="pill-checkbox" style={{ padding: '8px 14px' }}>
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
                <span style={{ 
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  fontFamily: "'Nunito', sans-serif"
                }}>
                  {medal.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginTop: '2rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button 
          className="btn random-btn"
          onClick={generateRandomCV}
        >
          <span>🎲 Generar Aleatorio</span>
        </button>
        <button 
          className="btn btn-secondary"
          onClick={onShare}
        >
          <span>👥 Compartir</span>
        </button>
        <button 
          className="btn btn-viral"
          onClick={onDownload}
        >
          <span>📥 Descargar CV</span>
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--color-text-tertiary)',
        fontSize: '0.9rem',
        borderTop: '1px dashed var(--color-border-light)',
        marginTop: '2rem'
      }}>
        <p style={{ margin: '0.25rem 0' }}>🐱 MiauCV - Currículum Gatuno Interactivo</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Hecho con amor y muchas galletas 🐾
        </p>
        <p style={{ margin: '0.5rem 0', color: '#ec4899', fontWeight: 700 }}>
          creado por <strong style={{ fontWeight: 800 }}>@Jacinto.Cards</strong>
        </p>
        <p style={{ margin: '0.25rem 0', color: '#ec4899' }}>
          #CVGatuno #jacintocards
        </p>
      </div>
    </div>
  )
}

export default CVForm