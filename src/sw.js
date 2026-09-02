import {
  cleanupOutdatedCaches,
  precacheAndRoute,
} from 'workbox-precaching'

import { clientsClaim } from 'workbox-core'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data
      ? event.data.json()
      : {}
  } catch {
    data = {
      body:
        event.data?.text() ||
        'Tienes un nuevo recordatorio.',
    }
  }

  const title = data.title || 'Cumbre 🏔️'

  const options = {
    body:
      data.body ||
      'Tienes un nuevo recordatorio.',

    icon:
      data.icon ||
      '/pwa-192x192.png',

    badge: '/pwa-192x192.png',

    data: {
      url:
        data.url ||
        data.data?.url ||
        '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url =
    event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((listaClientes) => {
        for (const cliente of listaClientes) {
          if ('focus' in cliente) {
            if ('navigate' in cliente) {
              cliente.navigate(url)
            }

            return cliente.focus()
          }
        }

        return clients.openWindow(url)
      })
  )
})