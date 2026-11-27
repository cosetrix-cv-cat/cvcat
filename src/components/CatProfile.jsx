import React, { useState, useEffect } from 'react'
import { supabase, uploadCatPhoto } from '../lib/supabaseClient.js'
import { locationOptions, furPatternOptions, furColorOptions } from '../data/catOptions.js'

function CatProfile({ user, onClose }) {
  const [profile, setProfile] = useState({
    nombre: '',
    alias: '',
    edad: '',
    ubicacion: '',
    bandera: '🇺🇸',
    color_pelaje: '',
    patron: 'Regular',
    foto_url: '',
    fotoPreview: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)

  // Cargar perfil existente
  useEffect(() => {
    if (!user) return
    
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('usuarios_gato')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!error && data) {
        setProfile({
          nombre: data.nombre || '',
          alias: data.alias || '',
          edad: data.edad ? String(data.edad) : '',
          ubicacion: data.ubicacion || '',
          bandera: data.bandera || '🇺🇸',
          color_pelaje: data.color_pelaje || '',
          patron: data.patron || 'Regular',
          foto_url: data.foto_url || '',
          fotoPreview: data.foto_url || ''
        })
      }
    }
    
    loadProfile()
  }, [user])

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhotoFile(file)
      updateField('fotoPreview', URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess(false)

    let fotoUrl = profile.fotoPreview

    // Subir foto si hay una nueva
    if (photoFile && photoFile.size > 0) {
      const fileExt = photoFile.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${Date.now()}_profile.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(fileName, photoFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) {
        setError('Error al subir la foto: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('cat-photos')
        .getPublicUrl(fileName)
      
      fotoUrl = publicUrl
    }

    const profileData = {
      user_id: user.id,
      nombre: profile.nombre,
      alias: profile.alias,
      edad: profile.edad ? parseInt(profile.edad) : null,
      ubicacion: profile.ubicacion,
      bandera: profile.bandera,
      color_pelaje: profile.color_pelaje,
      patron: profile.patron,
      foto_url: fotoUrl
    }

    // Upsert perfil
    const { error } = await supabase
      .from('usuarios_gato')
      .upsert(profileData, { onConflict: 'user_id' })

    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 700 }}>
          🐱 Perfil del Gato
        </h3>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Inicia sesión para crear tu perfil felino.
        </p>
        <button
          onClick={onClose}
          className="btn btn-secondary"
        >
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
          🐱 Perfil del Gato
        </h2>
        <button 
          onClick={onClose}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem' }}
        >
          ← Volver
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          background: '#e8f5e9', 
          color: '#2e7d32', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem' 
        }}>
          ✅ Perfil guardado correctamente
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Foto de perfil */}
        <div className="section-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>
            📸 Foto de Perfil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              {profile.fotoPreview ? (
                <img 
                  src={profile.fotoPreview} 
                  alt="Perfil" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '4px solid #fff',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #e8e0d4 0%, #d4c8b8 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  🐱
                </div>
              )}
              <label style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0,
                background: 'var(--gradient-pink)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-md)',
                border: '3px solid #fff'
              }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <span style={{ color: '#fff', fontSize: '1rem' }}>📷</span>
              </label>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              ref={e => e && e.click && (window.profilePhotoInput = e)}
            />
            <button 
              type="button"
              onClick={() => window.profilePhotoInput?.click()}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Cambiar foto
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {/* Nombre */}
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <label className="field-label">Nombre</label>
            <input 
              type="text" 
              className="input" 
              value={profile.nombre}
              onChange={e => updateField('nombre', e.target.value)}
              placeholder="Nombre del gato"
            />
          </div>

          {/* Alias */}
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <label className="field-label">Alias / Apodo</label>
            <input 
              type="text" 
              className="input" 
              value={profile.alias}
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
              value={profile.edad}
              onChange={e => updateField('edad', e.target.value)}
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
              value={profile.ubicacion}
              onChange={e => updateField('ubicacion', e.target.value)}
              placeholder="Ciudad"
            />
          </div>

          {/* Bandera */}
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <label className="field-label">Bandera</label>
            <input 
              type="text" 
              className="input" 
              value={profile.bandera}
              onChange={e => updateField('bandera', e.target.value)}
              placeholder="🌐"
            />
          </div>

          {/* Color de pelaje */}
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <label className="field-label">Color de Pelaje</label>
            <select 
              className="select"
              value={profile.color_pelaje}
              onChange={e => updateField('color_pelaje', e.target.value)}
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
              value={profile.patron}
              onChange={e => updateField('patron', e.target.value)}
            >
              {furPatternOptions.map((pattern) => (
                <option key={pattern} value={pattern}>{pattern}</option>
              ))}
            </select>
          </div>

          {/* Ubicación (select con opciones) */}
          <div className="section-card" style={{ padding: '1.5rem' }}>
            <label className="field-label">Ciudad (opcional)</label>
            <select 
              className="select"
              value={profile.ubicacion}
              onChange={e => updateField('ubicacion', e.target.value)}
            >
              <option value="">Selecciona una ciudad</option>
              {locationOptions.map((loc) => (
                <option key={loc.city} value={loc.city}>
                  {loc.city} {loc.flag}
                </option>
              ))}
            </select>
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
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            ← Volver
          </button>
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '💾 Guardando...' : '💾 Guardar Perfil'}
          </button>
        </div>
      </form>

      <div style={{
        textAlign: 'center',
        padding: '1.5rem',
        color: '#666',
        fontSize: '0.85rem',
        borderTop: '1px dashed var(--color-border-medium)',
        marginTop: '2rem'
      }}>
        <p style={{ margin: '0.25rem 0' }}>🐱 Perfil Felino - MiauCV</p>
        <p style={{ margin: '0.25rem 0', color: '#ec4899', fontWeight: 700 }}>
          creado por <strong style={{ fontWeight: 800 }}>@Jacinto.Cards</strong>
        </p>
        <p style={{ margin: '0.25rem 0', color: '#ec4899' }}>
          #CVGatuno #jacintocards
        </p>
      </div>
    </div>
  )
}

export default CatProfile