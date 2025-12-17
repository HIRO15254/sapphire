import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'

import { edgeAuthConfig } from '~/server/auth/edge-config'

/**
 * Authentication middleware for protected routes.
 *
 * This middleware checks if the user is authenticated before allowing access
 * to protected routes. Unauthenticated users are redirected to the sign-in page.
 *
 * Protected routes pattern: All routes under /(auth) group
 * Public routes: /auth/*, /api/*, /, /offline
 */

/**
 * Routes that require authentication.
 * All routes under (auth) group are protected.
 */
const protectedRoutes = [
  '/dashboard',
  '/sessions',
  '/currencies',
  '/stores',
  '/players',
  '/hands',
  '/help',
]

/**
 * Routes that should be accessible without authentication.
 */
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/signout',
  '/offline',
]

/**
 * Check if the pathname matches any of the protected routes.
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
}

/**
 * Check if the pathname matches any of the public routes.
 */
function isPublicRoute(pathname: string): boolean {
  return (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/')
  )
}

/**
 * NextAuth middleware wrapper.
 * Uses auth callback to check authentication status and handle redirects.
 */
const { auth } = NextAuth(edgeAuthConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Allow public routes
  if (isPublicRoute(nextUrl.pathname)) {
    // If logged in and trying to access auth pages, redirect to dashboard
    if (
      isLoggedIn &&
      (nextUrl.pathname === '/auth/signin' ||
        nextUrl.pathname === '/auth/register')
    ) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Protect routes that require authentication
  if (isProtectedRoute(nextUrl.pathname)) {
    if (!isLoggedIn) {
      const signInUrl = new URL('/auth/signin', nextUrl)
      signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
})

/**
 * Configure which routes the middleware runs on.
 * Matches all routes except static files and images.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
