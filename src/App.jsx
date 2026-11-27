import React, { useState, useEffect, useMemo } from 'react'
import CVForm from './components/CVForm.jsx'
import CVPreview from './components/CVPreview.jsx'
import SocialFeed from './components/SocialFeed.jsx'
import CatMatch from './components/CatMatch.jsx'
import CatProfile from './components/CatProfile.jsx'
import { supabase, uploadCatPhoto, saveCV, loadCV, supabaseConfigurado } from './lib/supabaseClient.js'

// Componente de recordatorio PWA
const PWANotification = ({ showUpdate, onUpdate }) => {
  if (!showUpdate) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #5775D0, #7a91e8)',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      maxWidth: '350px',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease-out',
      fontFamily: "'Nunito', Inter, sans-serif"
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🔄</span>
        <div>
          <strong>¡Actualización disponible!</strong>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Hay una nueva versión de MiauCV
          </div>
        </div>
      </div>
      <button
        onClick={onUpdate}
        style={{
          marginTop: '0.75rem',
          width: '100%',
          padding: '0.5rem',
          borderRadius: '12px',
          border: 'none',
          background: '#fff',
          color: '#5775D0',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        Actualizar ahora
      </button>
    </div>
  )
}

function App() {
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    age: '',
    location: '',
    flag: '🇺🇸',
    furColor: '',
    furPattern: 'Regular',
    professional: [],
    skills: {},
    schedule: 'Mañana (7-14h)',
    sleepHours: 12,
    desiredSalary: '',
    compatibility: 'Muy compatible',
    background: 'pastel-blue',
    medals: [],
    photo: null,
    photoPreview: '',
    combo: null
  })

  const [showShareModal, setShowShareModal] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cv')
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  
  // PWA State
  const [showUpdate, setShowUpdate] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Perfil del gato
  const [showCatProfile, setShowCatProfile] = useState(false)

  // Calcular progreso del formulario
  const progress = useMemo(() => {
    const fields = [
      formData.name,
      formData.alias,
      formData.age,
      formData.location,
      formData.furColor,
      formData.furPattern,
      formData.professional.length > 0,
      Object.keys(formData.skills).length > 0,
      formData.schedule,
      formData.sleepHours,
      formData.desiredSalary,
      formData.compatibility,
      formData.background,
      formData.medals.length > 0,
      formData.photoPreview
    ]
    const filled = fields.filter(Boolean).length
    return Math.round((filled / fields.length) * 100)
  }, [formData])

  // Google OAuth handler
  const handleGoogleAuth = async () => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) {
      setAuthError('Error con Google: ' + error.message)
    }
  }

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cargar CV si existe
    const loadUserData = async () => {
      if (user) {
        const savedCV = await loadCV(user.id)
        if (savedCV) {
          setFormData({
            name: savedCV.nombre || '',
            alias: savedCV.alias || '',
            age: savedCV.edad ? String(savedCV.edad) : '',
            location: savedCV.ubicacion || '',
            flag: savedCV.bandera || '🇺🇸',
            furColor: savedCV.color_pelaje || '',
            furPattern: savedCV.patron || 'Regular',
            professional: savedCV.profesiones || [],
            skills: savedCV.habilidades || {},
            schedule: savedCV.horas_sueño ? 'flexible' : 'Mañana (7-14h)',
            sleepHours: savedCV.horas_sueño || 12,
            desiredSalary: savedCV.salario_deseado || '',
            compatibility: savedCV.compatibilidad || 'Muy compatible',
            background: savedCV.fondo || 'pastel-blue',
            medals: savedCV.medallas || [],
            photo: null,
            photoPreview: savedCV.foto_url || '',
            combo: null
          })
        }
      }
    }

    loadUserData()

    return () => subscription.unsubscribe()
  }, [user])

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    checkSession()
  }, [])

  // Estado de red (PWA)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // PWA - Exponer función para service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.MiauCVShowUpdateNotice = () => {
        setShowUpdate(true)
      }
    }
  }, [])

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      })
    }
    setShowUpdate(false)
  }

  // Google OAuth handler
  const handleGoogleAuth = async () => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) {
      setAuthError('Error con Google: ' + error.message)
    }
  }

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      updateField('photo', file)
      updateField('photoPreview', URL.createObjectURL(file))
    }
  }

  const handleDownload = () => {
    setShowShareModal(false)
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  // Auth functions
  const handleSignUp = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword
    })
    
    if (error) {
      setAuthError(error.message)
    } else {
      alert('✅ ¡Revisa tu email para confirmar la cuenta!')
      setAuthMode('login')
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword
    })
    
    if (error) {
      setAuthError(error.message)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAuthError('')
  }

  const handleSaveCV = async () => {
    if (!user) {
      alert('⚠️ Debes iniciar sesión primero')
      return
    }

    let photoUrl = formData.photoPreview
    
    if (formData.photo && formData.photoPreview.startsWith('blob:')) {
      photoUrl = await uploadCatPhoto(formData.photo, user.id)
      if (!photoUrl) {
        alert('❌ Error al subir la foto')
        return
      }
    }

    const result = await saveCV(user.id, formData, photoUrl)
    if (result) {
      alert('✅ CV guardado exitosamente!')
    } else {
      alert('❌ Error al guardar el CV')
    }
  }

  // Login Screen
  const LoginScreen = () => (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem', 
          fontWeight: 800,
          fontFamily: "'Nunito', Inter, sans-serif",
          background: 'linear-gradient(90deg, #ec4899, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>🐱 MiauCV</h1>
      </header>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        background: 'linear-gradient(135deg, #fdf7f2 0%, #fce4ec 100%)'
      }}>
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '420px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2rem', 
              fontWeight: 800,
              fontFamily: "'Nunito', Inter, sans-serif",
              background: 'linear-gradient(90deg, #ec4899, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>🐱 MiauCV</h1>
            <p style={{ color: '#666', margin: '0.5rem 0', fontSize: '1rem' }}>
              Inicia sesión con tu cuenta
            </p>
          </div>
          
          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>
          
          {authError && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '1rem',
              borderRadius: '16px',
              marginBottom: '1rem',
              fontSize: '1rem'
            }}>
              {authError}
            </div>
          )}
          
          <form onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
                className="input"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="field-label">Contraseña</label>
              <input
                type="password"
                placeholder="Contraseña"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
                minLength="6"
                className="input"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              {authMode === 'signup' ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#999',
            fontSize: '1rem'
          }}>
            {authMode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ec4899',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontWeight: 500
                  }}
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ec4899',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                    fontWeight: 500
                  }}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#666',
            borderTop: '1px dashed #d4c8b8',
            paddingTop: '1.5rem'
          }}>
            <p style={{ margin: '0.25rem 0' }}>🐱 MiauCV - Currículum Gatuno Interactivo</p>
            <p style={{ margin: '0.25rem 0', color: '#ec4899', fontWeight: 700 }}>
              creado por <strong style={{ fontWeight: 800 }}>@Jacinto.Cards</strong>
            </p>
            <p style={{ margin: '0.25rem 0', color: '#ec4899' }}>
              #CVGatuno #jacintocards
            </p>
          </div>
        </div>
      </div>
    </>
  )

  if (loading && !user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf7f2 0%, #fce4ec 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontFamily: "'Nunito', Inter, sans-serif",
            background: 'linear-gradient(90deg, #ec4899, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>🐱 MiauCV</h1>
          <p style={{ color: '#666' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar pantalla de login
  if (!user) {
    return <LoginScreen />
  }

  // Texto motivador según progreso
  const getProgressMessage = (p) => {
    if (p < 25) return '🌱 ¡Empieza a crear tu CV gatuno!'
    if (p < 50) return '🐾 ¡Buen comienzo! Sigue así'
    if (p < 75) return '⭐ ¡Casi lo tienes! Pocos campos más'
    if (p < 100) return '🎯 ¡Último empujón! Casi listo'
    return '🏆 ¡CV Completo! Listo para brillar'
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Tabs de navegación premium */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('cv')}
          className={`tab-btn ${activeTab === 'cv' ? 'active' : ''}`}
        >
          📄 Mi CV
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
        >
          🐱 Muro Social
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`tab-btn ${activeTab === 'match' ? 'active' : ''}`}
        >
          💘 Match Felino
        </button>
      </div>

      {/* Contenido basado en tab */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'cv' ? (
          <div style={{ padding: '1.5rem' }}>
            {/* Header con progreso */}
            <div className="glass-card" style={{ 
              padding: '1.5rem', 
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-2xl)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    fontWeight: 800,
                    fontFamily: "'Nunito', Inter, sans-serif",
                    background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>Mi CV</h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
                    {user?.email || 'Usuario'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    color: '#ec4899',
                    fontFamily: "'Nunito', Inter, sans-serif"
                  }}>
                    {progress}%
                  </span>
                  <button
                    onClick={handleSaveCV}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    💾 Guardar
                  </button>
                  <button
                    onClick={() => setShowCatProfile(true)}
                    className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      🐱 Perfil
                    </button>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    🚪 Salir
                  </button>
                </div>
              </div>
              
              {/* Barra de progreso */}
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p style={{ 
                margin: '0.75rem 0 0', 
                fontSize: '0.9rem', 
                color: '#ec4899',
                fontWeight: 600,
                fontFamily: "'Nunito', Inter, sans-serif"
              }}>
                {getProgressMessage(progress)}
              </p>
            </div>

            {/* Layout de dos columnas en desktop, apilado en móvil */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: '1.5rem'
            }}>
              {/* Columna izquierda - Formulario (scrollable) */}
              <div style={{ 
                minWidth: 0
              }}>
                <CVForm 
                  formData={formData} 
                  updateField={updateField} 
                  onPhotoUpload={handlePhotoUpload}
                  onDownload={handleDownload}
                  onShare={handleShare}
                />
              </div>

              {/* Columna derecha - Vista previa (sticky en desktop) */}
              <div className="preview-sticky">
                <CVPreview 
                  formData={formData} 
                  onDownload={handleDownload}
                  showShareModal={showShareModal}
                  setShowShareModal={setShowShareModal}
                  previewImage={previewImage}
                  setPreviewImage={setPreviewImage}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'social' ? (
          <SocialFeed user={user} CVData={formData} />
        ) : (
          <CatMatch user={user} CVData={formData} />
        )}
        
        {/* Notificación PWA */}
        <PWANotification showUpdate={showUpdate} onUpdate={handleUpdateApp} />
        
        {/* Indicador offline */}
        {isOffline && user && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            left: '20px',
            background: '#ff9800',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '50px',
            fontSize: '0.9rem',
            animation: 'slideUp 0.3s ease-out',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}>
            🐱 Modo offline - Algunos datos pueden no estar actualizados
          </div>
        )}

        {/* Modal Perfil del Gato */}
        {showCatProfile && (
          <div className="modal-overlay" onClick={() => setShowCatProfile(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
              <CatProfile 
                user={user} 
                onClose={() => setShowCatProfile(false)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App