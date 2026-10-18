// ============================================================================
// PROTECH CYBER-OS v4.2 — SERVICE WORKER OFFLINE-FIRST (TOLERANTE A PARÁMETROS)
// ============================================================================
const CACHE_NAME = 'protech-cache-v4.2';

// Lista completa de módulos de la suite (se cachean de forma segura sin abortar si falta alguno)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './catalogo.html',
  './proforma.html',
  './agenda_tickets.html',
  './inspecciones_index.html',
  './inspeccion_cliente.html',
  './inspeccion_cctv.html',
  './inspeccion_alarmas.html',
  './inspeccion_redes.html',
  './inspeccion_cercos.html',
  './inspeccion_acceso.html',
  './inspeccion_equipos.html',
  './inspeccion_materiales.html',
  './topologia_general.html',
  './acta_entrega.html',
  './protech-offline.js',
  './theme-protech.css',
  './manifest.json',
  './logo.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// 1. INSTALACIÓN TOLERANTE A FALLOS (Si un archivo aún no existe, igual cachea todos los demás)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res.ok || res.type === 'opaque') {
                return cache.put(url, res);
              }
            })
            .catch(() => {})
        )
      );
    })
  );
});

// 2. ACTIVACIÓN Y LIMPIEZA AUTOMÁTICA DE CACHÉS ANTIGUOS (v2, v3, etc.)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTOR DE RED INTELIGENTE (Network-First + Dynamic Cache + IgnoreSearch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // REGLA 1: Peticiones a Supabase o métodos POST/PUT/DELETE pasan directo (las gestiona protech-offline.js en IndexedDB)
  if (url.hostname.includes('supabase.co') || event.request.method !== 'GET') {
    return;
  }

  // REGLA 2: No cachear videos pesados (.mp4) para proteger el almacenamiento móvil
  if (url.pathname.endsWith('.mp4')) {
    return;
  }

  // REGLA 3: Network-First con actualización de caché en vivo y respaldo Offline ignorando '?id=...'
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si hay internet, guardamos una copia fresca en el caché antes de entregarla
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Si es un archivo HTML local con ?id=..., guardamos también la versión limpia sin query
            if (url.origin === self.location.origin && url.pathname.endsWith('.html')) {
              cache.put(url.origin + url.pathname, responseClone.clone());
            }
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // MODO OFFLINE: Buscar primero coincidencia exacta y luego ignorando '?id=...'
        const exactMatch = await caches.match(event.request);
        if (exactMatch) return exactMatch;

        const cleanMatch = await caches.match(event.request, { ignoreSearch: true });
        if (cleanMatch) return cleanMatch;

        // Último respaldo si es navegación a una página HTML
        if (event.request.mode === 'navigate') {
          return caches.match('./inspecciones_index.html', { ignoreSearch: true });
        }
      })
  );
});

// ============================================================================
// SOPORTE DE NOTIFICACIONES PUSH NATIVAS (ProTech)
// ============================================================================

self.addEventListener('push', function(event) {
  let data = { title: 'Alerta ProTech', body: 'Nueva notificación de seguridad', url: 'https://app.protechsecurityec.com' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: './logo.png',
    badge: './logo.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || 'https://app.protechsecurityec.com' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Maneja el clic sobre la notificación para abrir la app de forma funcional
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});