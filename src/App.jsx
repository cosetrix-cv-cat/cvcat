import React, { useState, useEffect } from 'react'
import CVForm from './components/CVForm.jsx'
import CVPreview from './components/CVPreview.jsx'
import SocialFeed from './components/SocialFeed.jsx'
import CatMatch from './components/CatMatch.jsx'
import { supabase, uploadCatPhoto, saveCV, loadCV, supabaseConfigurado } from './lib/supabaseClient.js'

// Componente de recordatorio PWA
const PWANotification = ({ showUpdate, onUpdate }) => {
  if (!showUpdate) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #5775D0, #4560b5)',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
      maxWidth: '350px',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease-out',
      fontFamily: 'var(--font-family-heading)'
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
  const [showAuth, setShowAuth] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [photoUploadError, setPhotoUploadError] = useState('')

  // Ref para evitar cargas duplicadas del CV
  const cvLoadedRef = useRef(new Set())

  // PWA State
  const [showUpdate, setShowUpdate] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  // Escuchar cambios de autenticación - ÚNICO useEffect para auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)
        setLoading(false)
        
        // Limpiar fragmentos residuales del hash tras autenticación
        if (session && window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        }

        // Cargar CV solo una vez por usuario por sesión
        if (newUser && !cvLoadedRef.current.has(newUser.id)) {
          cvLoadedRef.current.add(newUser.id)
          loadUserData(newUser.id)
        } else if (!newUser) {
          // Limpiar formData al cerrar sesión
          setFormData(prev => ({
            ...prev,
            name: '', alias: '', age: '', location: '', flag: '🇺🇸',
            furColor: '', furPattern: 'Regular', professional: [], skills: {},
            schedule: 'Mañana (7-14h)', sleepHours: 12, desiredSalary: '',
            compatibility: 'Muy compatible', background: 'pastel-blue',
            medals: [], photo: null, photoPreview: '', combo: null
          }))
          cvLoadedRef.current.clear()
        }
      }
    )

    // Verificar sesión inicial
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const initialUser = session?.user ?? null
      setUser(initialUser)
      setLoading(false)
      
      if (session && window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
      }

      if (initialUser && !cvLoadedRef.current.has(initialUser.id)) {
        cvLoadedRef.current.add(initialUser.id)
        await loadUserData(initialUser.id)
      }
    }
    checkSession()

    return () => subscription.unsubscribe()
  }, [])

  // Cargar CV del usuario (separada para reutilizar)
  const loadUserData = async (userId) => {
    try {
      const savedCV = await loadCV(userId)
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
    } catch (err) {
      console.error('Error cargando CV:', err)
      // No mostrar alert para no bloquear la UI, solo log
    }
  }

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

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Mostrar vista previa inmediata en local
    const previewUrl = URL.createObjectURL(file)
    updateField('photo', file)
    updateField('photoPreview', previewUrl)
    setPhotoUploadError('')

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('El archivo debe ser una imagen (JPG, PNG, WebP, GIF)')
      updateField('photoPreview', '')
      return
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError('La imagen no puede superar 5MB')
      updateField('photoPreview', '')
      return
    }

    // Subir a Supabase solo si hay usuario autenticado
    if (user) {
      try {
        const result = await uploadCatPhoto(file, user.id)
        if (result.error) {
          setPhotoUploadError(`Error al subir: ${result.error}`)
          console.error('Error subiendo foto:', result.error)
        } else {
          // La vista previa ya está en local, pero actualizamos con la URL de Supabase para persistencia
          updateField('photoPreview', result.url)
          setPhotoUploadError('')
        }
      } catch (err) {
        setPhotoUploadError(`Error inesperado: ${err.message}`)
        console.error('Error subiendo foto:', err)
      }
    }
    // En modo demo o sin usuario, solo usamos la vista previa local
  }

  const handleDownload = () => {
    setShowShareModal(false)
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  // Google OAuth
  const handleGoogleAuth = async () => {
    setAuthError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) {
        setAuthError('Error al iniciar sesión con Google: ' + error.message)
      }
    } catch (err) {
      setAuthError('Error inesperado con Google: ' + err.message)
    }
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

  const LoginScreen = () => (
    <>
      <header className="cv-header" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: 'var(--font-size-xxxl)', fontWeight: 700 }}>🐱 MiauCV</h1>
      </header>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        background: 'var(--gradient-cats-cafe)',
        padding: '2rem'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '400px',
          width: '100%',
          border: '1px solid var(--color-border-light)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-xxxl)', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>🐱 MiauCV</h1>
            <p style={{ color: '#666', margin: '0.5rem 0', fontSize: 'var(--font-size-base)' }}>Inicia sesión o regístrate</p>
          </div>

          {/* Botón Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--color-accent-primary)',
              background: '#fff',
              color: '#444',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base)',
              fontWeight: 500,
              fontFamily: 'var(--font-family-heading)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              transition: 'all 0.2s ease'
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
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: 'var(--font-size-sm)'
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'signup' ? handleSignUp : handleSignIn}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-border-medium)',
                  fontSize: 'var(--font-size-base)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                placeholder="Contraseña"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--color-border-medium)',
                  fontSize: 'var(--font-size-base)'
                }}
              />
            </div>
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
                cursor: 'pointer'
              }}
            >
              {authMode === 'signup' ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '1rem',
            color: '#999',
            fontSize: 'var(--font-size-sm)'
          }}>
            {authMode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-accent-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
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
                    color: 'var(--color-accent-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
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
            fontSize: 'var(--font-size-xs)',
            color: '#666'
          }}>
            <p style={{ margin: '0.25rem 0' }}>🐱 MiauCV - Generador de Currículum Gatuno</p>
            <p style={{ margin: 0, color: '#5775D0' }}>creado por <strong style={{ fontWeight: 600 }}>@Jacinto.Cards</strong></p>
            <p style={{ margin: 0, color: '#5775D0' }}>#CVGatuno #jacintocards</p>
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
        background: 'var(--gradient-cats-cafe)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--font-size-xxxl)', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>🐱 MiauCV</h1>
          <p style={{ color: '#666' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="app-container" style={{
      minHeight: '100vh',
      paddingBottom: '70px'
    }}>
      {/* Desktop Tabs */}
      <div className="desktop-only" style={{
        display: 'flex',
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        padding: 'var(--spacing-sm)',
        marginBottom: 'var(--spacing-lg)',
        borderRadius: 'var(--radius-lg)',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
        border: '1px solid var(--color-border-light)'
      }}>
        <button
          onClick={() => setActiveTab('cv')}
          style={{
            flex: 1,
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'cv' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'cv' ? '#fff' : '#444',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-base)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family-heading)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          📄 Mi CV
        </button>
        <button
          onClick={() => setActiveTab('social')}
          style={{
            flex: 1,
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'social' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'social' ? '#fff' : '#444',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-base)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family-heading)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          🐱 Muro Social
        </button>
        <button
          onClick={() => setActiveTab('match')}
          style={{
            flex: 1,
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeTab === 'match' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
            color: activeTab === 'match' ? '#fff' : '#444',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-base)',
            transition: 'all 0.2s ease',
            fontFamily: 'var(--font-family-heading)',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          💘 Match Felino
        </button>
      </div>

      {/* Contenido basado en tab */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'cv' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Header con usuario y logout */}
            <header className="cv-header glass-card-light" style={{
              padding: 'var(--spacing-lg) var(--spacing-xl)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border-light)',
              marginBottom: 'var(--spacing-lg)',
              minHeight: '44px'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, fontFamily: 'var(--font-family-heading)' }}>🐱 MiauCV</h2>
                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>
                  {user?.email || 'Usuario'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                <button
                  onClick={handleSaveCV}
                  className="btn btn-primary"
                  style={{
                    background: 'var(--color-accent-primary)',
                    borderColor: 'var(--color-accent-primary-dark)',
                    padding: '0.5rem 1rem',
                    fontSize: 'var(--font-size-sm)',
                    minHeight: '44px'
                  }}
                >
                  💾 Guardar
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary"
                  style={{
                    background: '#f0f0f0',
                    borderColor: '#e0e0e0',
                    padding: '0.5rem 1rem',
                    fontSize: 'var(--font-size-sm)',
                    minHeight: '44px'
                  }}
                >
                  🚪 Salir
                </button>
              </div>
            </header>

            <div className="two-column-layout">
              {/* Columna izquierda - Formulario scrollable */}
              <div className="form-scrollable" style={{ minWidth: 0 }}>
                <CVForm
                  formData={formData}
                  updateField={updateField}
                  onPhotoUpload={handlePhotoUpload}
                  onDownload={handleDownload}
                  onShare={handleShare}
                  photoUploadError={photoUploadError}
                  setPhotoUploadError={setPhotoUploadError}
                />
              </div>

              {/* Columna derecha - Vista previa sticky */}
              <div className="preview-sticky glass-card-light" style={{ padding: 'var(--spacing-lg)' }}>
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
            bottom: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ff9800',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--font-size-sm)',
            animation: 'slideUp 0.3s ease-out',
            zIndex: 1000,
            boxShadow: 'var(--shadow-sm)'
          }}>
            🐱 Modo offline - Algunos datos pueden no estar actualizados
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('cv')}
          className={activeTab === 'cv' ? 'active' : ''}
        >
          📄
          <span>CV</span>
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={activeTab === 'social' ? 'active' : ''}
        >
          🐱
          <span>Social</span>
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={activeTab === 'match' ? 'active' : ''}
        >
          💘
          <span>Match</span>
        </button>
      </nav>
    </div>
  )
}

export default App