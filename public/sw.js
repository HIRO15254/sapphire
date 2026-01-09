/// <reference lib="webworker" />

/**
 * Service Worker for Sapphire PWA
 *
 * Strategy:
 * - Cache First for static assets (icons, fonts)
 * - Network First for HTML pages (with offline fallback)
 * - Network Only for API calls (no caching for tRPC)
 */

const CACHE_NAME = 'sapphire-v1'
const OFFLINE_URL = '/offline'

// Static assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Install event - pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately without waiting
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  // Claim all clients immediately
  self.clients.claim()
})

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip API calls - always go to network
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip tRPC calls - always go to network
  if (url.pathname.includes('trpc')) {
    return
  }

  // Skip Next.js internal requests
  if (url.pathname.startsWith('/_next/')) {
    // For static assets in _next/static, use cache first
    if (url.pathname.startsWith('/_next/static/')) {
      event.respondWith(cacheFirst(request))
      return
    }
    // Other _next requests (HMR, etc.) go to network
    return
  }

  // Handle static assets (icons, images) - cache first
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }

  // Default: network first
  event.respondWith(networkFirst(request))
})

/**
 * Cache first strategy - try cache, fall back to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    // Return a basic offline response for assets
    return new Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Network first strategy - try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return new Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}

/**
 * Network first with offline fallback for navigation
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    // Try to return cached version first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    // Fall back to offline page
    const offlinePage = await caches.match(OFFLINE_URL)
    if (offlinePage) {
      return offlinePage
    }

    // Last resort - return a basic offline response
    return new Response(
      '<!DOCTYPE html><html><head><title>オフライン</title></head><body><h1>オフライン</h1><p>ネットワークに接続されていません</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }
}
