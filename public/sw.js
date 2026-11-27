// MiauCV - Service Worker
// Caché de recursos estáticos y soporte offline básico

// Versión del cache - INCREMENTAR esta versión en cada release para forzar actualización
const CACHE_VERSION = 'v1.0.1'
const CACHE_NAME = `miaucv-${CACHE_VERSION}`

// En producción, Vite genera archivos con hash en dist/assets/
// El SW no puede saber los hashes de antemano, así que usamos
// estrategia "cache-first con fallback a red" + cacheo dinámico
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-192.png',
  '/favicon-512.png'
]

// Evitar caché de URLs de Supabase (API dinámica)
const isSupabaseUrl = (url) => {
  return url.includes('supabase.co') || url.includes('.supabase.co')
}

// Evento de instalación - precache SOLO de assets core garantizados
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Usar addAll con manejo de errores por archivo individual
        // para que un 404 no rompa toda la instalación
        return Promise.allSettled(
          CORE_ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn('[MiauCV SW] Failed to cache:', url, err)
              return Promise.resolve() // No fallar la instalación
            })
          )
        )
      })
      .then(() => self.skipWaiting())
  )
})

// Evento de activación - limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Borrar cachés antiguos
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Evento de fetch - estrategia de caché primero para estáticos
// Network first para API de Supabase
self.addEventListener('fetch', (event) => {
  const url = event.request.url

  // No procesar requests a Supabase (API dinámica)
  if (isSupabaseUrl(url)) {
    event.respondWith(
      fetch(event.request).catch((error) => {
        console.log('[MiauCV SW] Network error for Supabase:', error)
        return new Response(JSON.stringify({ error: 'Offline - Network error' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    return
  }

  // Para navegación (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // Para otros recursos - caché primero con fallback a red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retornar caché si existe
      if (cachedResponse) {
        return cachedResponse
      }

      // Si no está en caché, ir a la red
      return fetch(event.request).then((response) => {
        // No cachear respuestas erróneas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clonar la respuesta para caché
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    }).catch(() => {
      // Fallback para recursos no críticos
      if (event.request.destination === 'image') {
        return new Response('', { status: 404 })
      }
      return new Response('', { status: 503 })
    })
  )
})

// Mensaje para controlar el service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Recordatorio de actualización
self.addEventListener('sync', (event) => {
  if (event.tag === 'MiauCV-update-check') {
    event.waitUntil(
      // Lógica para chequear actualizaciones (mínima)
      Promise.resolve()
    )
  }
})