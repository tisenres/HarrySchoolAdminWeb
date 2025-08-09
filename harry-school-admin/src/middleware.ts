import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Define locales directly to avoid circular imports
const locales = ['en', 'ru', 'uz'] as const;
const defaultLocale = 'en' as const;

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always' // Always include locale in URL
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if pathname doesn't have a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If no locale prefix, redirect to default locale
  if (!pathnameHasLocale) {
    const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Handle legacy /dashboard routes - redirect to clean URLs with locale
  if (pathname.startsWith('/dashboard')) {
    const cleanPath = pathname.replace('/dashboard', '') || '/';
    return NextResponse.redirect(new URL(`/${defaultLocale}${cleanPath}`, request.url));
  }

  // Create a Supabase client configured to use cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check auth for protected routes
  const isAuthRoute = pathname.includes('/login') || 
                     pathname.includes('/sign-in') ||
                     pathname.includes('/forgot-password');
  
  // Check if it's a locale-only path (dashboard)
  const isDashboard = /^\/[a-z]{2}$/.test(pathname) || pathname === '/';
  
  const isProtectedRoute = isDashboard ||
                          pathname.includes('/teachers') || 
                          pathname.includes('/students') || 
                          pathname.includes('/groups') ||
                          pathname.includes('/settings') ||
                          pathname.includes('/finance') ||
                          pathname.includes('/reports');

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if accessing protected route without auth
  if (!user && isProtectedRoute) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (user && isAuthRoute) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/teachers`, request.url));
  }

  // Use next-intl middleware for everything else
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}