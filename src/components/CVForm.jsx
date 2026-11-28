import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  locationOptions,
  flagOptions,
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

function CVForm({ formData, updateField, onPhotoUpload, onDownload, onShare, onSave, onNotify, photoUploadError, setPhotoUploadError }) {
  // Estados locales para selectores con búsqueda
  const [flagSearch, setFlagSearch] = useState('')
  const [colorSearch, setColorSearch] = useState('')
  const [showCustomColor, setShowCustomColor] = useState(false)
  const [customColorValue, setCustomColorValue] = useState('')
  const [customColorLabel, setCustomColorLabel] = useState('')

  // ---- "Roll" del generador aleatorio ----
  const [isRolling, setIsRolling] = useState(false)
  const [hasRolled, setHasRolled] = useState(false) // detiene el latido tras la 1ª interacción
  const rollTimerRef = useRef(null)
  // Guard síncrono: evita que dos clics seguidos dentro del mismo tick
  // arranquen dos intervalos y apliquen dos datasets distintos.
  const rollingRef = useRef(false)

  // Helper functions para aleatoriedad
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

  // Colores de pelaje filtrados y ordenados
  const filteredColors = useMemo(() => {
    let colors = [...furColorOptions].sort((a, b) => a.label.localeCompare(b.label))
    if (colorSearch) {
      colors = colors.filter(c => 
        c.label.toLowerCase().includes(colorSearch.toLowerCase()) ||
        c.value.toLowerCase().includes(colorSearch.toLowerCase())
      )
    }
    return colors
  }, [colorSearch])

  // Banderas filtradas
  const filteredFlags = useMemo(() => {
    let flags = [...flagOptions]
    if (flagSearch) {
      flags = flags.filter(f => 
        f.country.toLowerCase().includes(flagSearch.toLowerCase()) ||
        f.flag.includes(flagSearch) ||
        f.code.toLowerCase().includes(flagSearch.toLowerCase())
      )
    }
    return flags
  }, [flagSearch])

  // ============================================================
  // GENERADOR ALEATORIO CON "ROLL" ANIMADO
  // ============================================================
  // Limpieza defensiva: si el componente se desmonta a mitad del roll,
  // se cancela el intervalo para no llamar a setState sobre un árbol caído.
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) {
        clearInterval(rollTimerRef.current)
        rollTimerRef.current = null
      }
      rollingRef.current = false
    }
  }, [])

  const prefiereMenosMovimiento = () => {
    try {
      return typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }

  // Construye un set completo de datos aleatorios (sin tocar el estado)
  const buildRandomData = () => {
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

    const combo = professionCombos.find(c =>
      c.condition.every(id => randomProfessions.some(p => p.id === id))
    )

    if (combo && !randomProfessions.some(p => p.id === combo.result.id)) {
      randomProfessions.push(combo.result)
    }

    const aliases = ['Pelusa', 'Minino', 'Tigre', 'Nube', 'Firulais', 'Michi', 'Gordo', 'Siamés']

    return {
      name: `Gatito ${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      alias: `🐱 ${aliases[Math.floor(Math.random() * aliases.length)]}`,
      age: Math.floor(Math.random() * 15) + 2,
      location: randomLocation.city,
      flag: randomLocation.flag,
      furColor: getRandomValue(furColorOptions).value,
      furPattern: getRandomValue(furPatternOptions),
      professional: randomProfessions,
      skills: getRandomSkills(),
      schedule: getRandomValue(schedules).value,
      sleepHours: Math.floor(Math.random() * 11) + 12,
      desiredSalary: `🐱 ${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}K`,
      compatibility: getRandomValue(compatibilityOptions).value,
      background: randomBackground.value,
      medals: randomMedals
    }
  }

  // Aplica un set de datos al formulario
  const applyRandomData = (data) => {
    Object.entries(data).forEach(([field, value]) => updateField(field, value))
  }

  const notifySuccess = (msg) => {
    if (typeof onNotify === 'function') {
      onNotify(msg, 'success')
    } else {
      console.info(msg)
    }
  }

  const generateRandomCV = () => {
    if (rollingRef.current) return // guard síncrono: nunca dos rolls a la vez
    rollingRef.current = true

    setHasRolled(true) // a partir de aquí el botón deja de latir

    // Accesibilidad: sin animación, aplicamos todo de una vez
    if (prefiereMenosMovimiento()) {
      applyRandomData(buildRandomData())
      rollingRef.current = false
      notifySuccess('🎲 ¡Datos generados al azar! ¡Listo para el sueño de 8 horas!')
      return
    }

    setIsRolling(true)

    let ticks = 0
    const TOTAL_TICKS = 7   // ~630 ms de "rodado"
    const TICK_MS = 90

    rollTimerRef.current = setInterval(() => {
      ticks += 1

      // Durante el roll: solo campos "rápidos" para dar sensación de sorteo
      const flicker = buildRandomData()
      updateField('name', flicker.name)
      updateField('alias', flicker.alias)
      updateField('age', flicker.age)
      updateField('location', flicker.location)
      updateField('flag', flicker.flag)
      updateField('sleepHours', flicker.sleepHours)
      updateField('desiredSalary', flicker.desiredSalary)

      if (ticks >= TOTAL_TICKS) {
        if (rollTimerRef.current) {
          clearInterval(rollTimerRef.current)
          rollTimerRef.current = null
        }

        // Asentar el resultado definitivo (uno solo, coherente)
        applyRandomData(buildRandomData())
        setIsRolling(false)
        rollingRef.current = false
        notifySuccess('🎲 ¡Dados tirados! Tu gatito ya tiene currículum.')
      }
    }, TICK_MS)
  }

  // Helper para formatear salario en USD
  const formatSalary = (value) => {
    if (!value) return ''
    // Si ya tiene formato 🐱 X.K, devolverlo
    if (value.includes('🐱')) return value
    // Si es solo número, formatear
    const num = parseFloat(value.replace(/[^0-9.]/g, ''))
    if (!isNaN(num)) {
      return `🐱 $${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`
    }
    return value
  }

  const handleSalaryChange = (e) => {
    const value = e.target.value
    // Permitir escribir libremente pero mantener el ícono 🐱
    if (value.startsWith('🐱')) {
      updateField('desiredSalary', value)
    } else if (value === '') {
      updateField('desiredSalary', '')
    } else {
      // Formatear en vivo preservando 🐱
      const num = value.replace(/[^0-9.]/g, '')
      if (num) {
        updateField('desiredSalary', `🐱 $${num}K`)
      } else {
        updateField('desiredSalary', '🐱 ')
      }
    }
  }

  const handleBlurSalary = () => {
    // Formatear al perder foco
    const value = formData.desiredSalary
    if (value && !value.includes('$')) {
      const num = parseFloat(value.replace(/[^0-9.]/g, ''))
      if (!isNaN(num)) {
        updateField('desiredSalary', `🐱 $${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`)
      }
    }
  }

  const addCustomColor = () => {
    if (customColorValue && customColorLabel) {
      const newColor = {
        value: customColorValue.startsWith('#') ? customColorValue : `#${customColorValue}`,
        label: customColorLabel
      }
      // En un entorno real, esto se guardaría en Supabase
      // Por ahora lo agregamos al estado local
      updateField('furColor', newColor.value)
      setShowCustomColor(false)
      setCustomColorValue('')
      setCustomColorLabel('')
    }
  }

  return (
    <div
      className={`cv-form-root${isRolling ? ' is-rolling' : ''}`}
      style={{
        background: 'var(--gradient-cats-cafe)',
        padding: 'var(--spacing-xl)',
        overflowY: 'auto',
        flex: 1
      }}
    >
      <div className="form-header">
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xxl)', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>📝 Información del CV</h2>
        <p style={{ color: 'var(--text-soft)', margin: '0.5rem 0', fontSize: 'var(--font-size-base)' }}>Completa los datos o usa el generador aleatorio</p>
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
                background: 'var(--surface-0)'
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

        {/* Bandera - Selector con búsqueda */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Bandera 🌎</span>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                value={flagSearch}
                onChange={(e) => {
                  setFlagSearch(e.target.value)
                  // Buscar coincidencia exacta para actualizar flag
                  const match = flagOptions.find(f => f.country.toLowerCase() === e.target.value.toLowerCase() || f.flag === e.target.value)
                  if (match) updateField('flag', match.flag)
                }}
                placeholder="🔍 Buscar país... (ej: Argentina)"
                style={{ paddingRight: '40px' }}
              />
              <div style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                fontSize: '1.5rem'
              }}>
                {formData.flag || '🏳️'}
              </div>
              {flagSearch && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface-0)',
                  border: '2px solid var(--color-border-medium)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {filteredFlags.slice(0, 10).map((f) => (
                    <button
                      key={f.code}
                      type="button"
                      onClick={() => {
                        updateField('flag', f.flag)
                        setFlagSearch(f.country)
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{f.flag}</span>
                      <span>{f.country}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Color de pelaje - Selector con búsqueda y opción personalizada */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Color de Pelaje 🎨</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  value={colorSearch}
                  onChange={(e) => {
                    setColorSearch(e.target.value)
                    // Buscar coincidencia exacta
                    const match = furColorOptions.find(c => c.label.toLowerCase() === e.target.value.toLowerCase())
                    if (match) updateField('furColor', match.value)
                  }}
                  placeholder="🔍 Buscar color... (ej: Marrón, Negro)"
                  style={{ paddingRight: '40px' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  right: '8px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '2px solid var(--color-border-medium)',
                  background: formData.furColor || 'transparent'
                }} />
              </div>
              {(colorSearch || showCustomColor) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface-0)',
                  border: '2px solid var(--color-border-medium)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {filteredColors.slice(0, 12).map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        updateField('furColor', color.value)
                        setColorSearch(color.label)
                      }}
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        textAlign: 'left',
                        border: 'none',
                        background: formData.furColor === color.value ? 'var(--color-bg-accent)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)'
                      }}
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: color.value,
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} />
                      <span>{color.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomColor(!showCustomColor)}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      textAlign: 'left',
                      border: 'none',
                      background: showCustomColor ? 'var(--color-bg-accent)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}
                  >
                    <span>➕</span> {showCustomColor ? 'Cancelar color personalizado' : 'Agregar color personalizado...'}
                  </button>
                  {showCustomColor && (
                    <div style={{ padding: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border-light)' }}>
                      <input
                        type="color"
                        value={customColorValue || '#8B4513'}
                        onChange={(e) => setCustomColorValue(e.target.value)}
                        style={{ width: '50px', height: '32px', border: 'none', cursor: 'pointer', marginRight: 'var(--spacing-sm)' }}
                      />
                      <input
                        type="text"
                        className="input"
                        value={customColorLabel}
                        onChange={(e) => setCustomColorLabel(e.target.value)}
                        placeholder="Nombre del color (ej: Marrón Claro)"
                        style={{ flex: 1, minWidth: '120px' }}
                      />
                      <button
                        type="button"
                        onClick={addCustomColor}
                        className="btn btn-primary"
                        style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}
                      >
                        Agregar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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

        {/* Salario deseado - Formato USD con ícono 🐱 */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Salario Deseado (USD) 💰</span>
            <input
              type="text"
              className="input"
              value={formData.desiredSalary}
              onChange={handleSalaryChange}
              onBlur={handleBlurSalary}
              placeholder="🐱 $2.5K"
            />
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              Formato: 🐱 $2.5K (se formatea automáticamente en USD)
            </small>
          </label>
        </div>

        {/* Horario - Opciones divertidas con emojis */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Horario de Trabajo ⏰</span>
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
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              Diferente a "Horas de Sueño" abajo: esto es cuándo trabajas, no cuándo duermes 😴
            </small>
          </label>
        </div>

        {/* Horas de sueño */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Horas de Sueño: {formData.sleepHours}h 😴</span>
            <input
              type="range"
              className="slider"
              min="12"
              max="22"
              value={formData.sleepHours}
              onChange={e => updateField('sleepHours', parseInt(e.target.value))}
            />
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              Cuántas horas duermes al día (diferente al horario de trabajo)
            </small>
          </label>
        </div>

        {/* Compatibilidad - Con ayuda contextual */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Compatibilidad con otros gatos 🐱‍👤</span>
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
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              Qué tan bien te llevas con otros gatos (se usa en Match Felino 💘)
            </small>
          </label>
        </div>

        {/* Fondo - Con ayuda contextual */}
        <div>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>Fondo de la Tarjeta 🎨</span>
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
            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
              Estilo visual de tu CV (se ve en la vista previa a la derecha)
            </small>
          </label>
        </div>

        {/* Medallas con pills - Mejor visibilidad */}
        <div style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-accent-primary)', fontFamily: 'var(--font-family-heading)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: 'var(--font-size-xs)' }}>Medallas ({formData.medals?.length || 0})</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                Haz clic para seleccionar/deseleccionar
              </span>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)',
              maxHeight: '160px',
              overflowY: 'auto',
              padding: 'var(--spacing-xs)',
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)'
            }}>
              {medals.map((medal) => {
                const isSelected = formData.medals?.some(m => m.id === medal.id) || false
                return (
                  <label key={medal.id} className={`pill-checkbox ${isSelected ? 'active' : ''}`} style={{ padding: 'var(--spacing-xs) var(--spacing-md)' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newMedals = e.target.checked
                          ? [...(formData.medals || []), medal]
                          : (formData.medals || []).filter(m => m.id !== medal.id)
                        updateField('medals', newMedals)
                      }}
                    />
                    <span style={{ fontSize: '1.4rem', marginRight: 'var(--spacing-xs)' }}>{medal.emoji}</span>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500, fontFamily: 'var(--font-family-heading)' }}>{medal.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Botones mejorados con feedback visual */}
      <div style={{
        display: 'flex',
        gap: 'var(--spacing-md)',
        marginTop: 'var(--spacing-xl)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          type="button"
          className={`btn random-btn${hasRolled ? ' has-interacted' : ''}${isRolling ? ' is-rolling' : ''}`}
          onClick={generateRandomCV}
          disabled={isRolling}
          aria-busy={isRolling}
          aria-label={isRolling ? 'Generando CV aleatorio…' : 'Generar CV aleatorio'}
          style={{ minHeight: '48px' }}
        >
          <span>{isRolling ? '🎲 Tirando los dados…' : '🎲 Generar Aleatorio'}</span>
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
          onClick={onSave}
          style={{ minHeight: '48px', minWidth: '140px' }}
          id="save-cv-btn-form"
        >
          <span>💾 Guardar</span>
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
        <p style={{ fontSize: 'var(--font-size-xs)', marginTop: '0.25rem', color: 'var(--text-soft)' }}>Hecho con amor y muchas galletas 🐾</p>
        <p style={{ margin: '0.5rem 0', color: 'var(--accent)', fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>
          creado por <strong style={{ fontWeight: 700 }}>@Jacinto.Cards</strong>
        </p>
        {/* Hashtags eliminados según requerimiento */}
      </div>
    </div>
  )
}

export default CVForm