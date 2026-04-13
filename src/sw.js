import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

// Injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)

// Cache-first for same-origin assets (icons, images)
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'image' || request.destination === 'font'),
  new CacheFirst({ cacheName: 'assets-cache' })
)

// Network-first for the CSV (readings data may be updated)
registerRoute(
  ({ url }) => url.pathname.endsWith('readings.csv'),
  new NetworkFirst({ cacheName: 'data-cache' })
)

// Show a notification on behalf of the page
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data
    self.registration.showNotification(title, {
      body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: tag || 'daily-reading',
    })
  }
})

// Focus or open the app when a notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('./')
    })
  )
})
