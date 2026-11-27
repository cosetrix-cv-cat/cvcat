import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Error Boundary para diagnosticar errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f0e6 0%, #e6f7ff 100%)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h1 style={{ color: '#c62828', marginBottom: '1rem' }}>⚠️ Error en la aplicación</h1>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Ha ocurrido un error al cargar la aplicación.</p>
            <details style={{ textAlign: 'left', background: '#f5f0e6', padding: '1rem', borderRadius: '8px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: '0.5rem' }}>Ver detalles del error</summary>
              <pre style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: '#8bc34a',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Registro del Service Worker (solo en producción y si el navegador lo soporta)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Registrar SW con versionado para evitar caché obsoleta
    const swVersion = new Date().toISOString().split('T')[0]
    navigator.serviceWorker.register(`/sw.js?v=${swVersion}`)
      .then((registration) => {
        console.log('[MiauCV] Service Worker registrado:', registration.scope)
        
        // Escuchar actualizaciones de la app
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                // Mostrar recordatorio de actualización
                if (window.MiauCVShowUpdateNotice) {
                  window.MiauCVShowUpdateNotice()
                }
              }
            })
          }
        })
        
        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Cada hora
      })
      .catch((error) => {
        console.log('[MiauCV] Error al registrar Service Worker:', error)
      })
  })
}

// Mostrar estado de carga inicial
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f0e6 0%, #e6f7ff 100%)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <h1>🐱 MiauCV</h1>
      <p style={{ color: '#666' }}>Cargando...</p>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)