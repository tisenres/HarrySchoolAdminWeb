import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { applyRateLimit } from '@/lib/middleware/rate-limit';

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
  
  // Early return for static assets and build files (no rate limiting needed)
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') && !pathname.includes('/api/')
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to API routes first
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = await applyRateLimit(request, 'api');
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }
    return NextResponse.next();
  }
  
  // Check if pathname doesn't have a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // If no locale prefix, redirect to default locale
  if (!pathnameHasLocale) {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url));
  }

  // Handle legacy /dashboard routes - redirect to clean URLs with locale
  if (pathname.startsWith('/dashboard')) {
    const cleanPath = pathname.replace('/dashboard', '') || '/';
    return NextResponse.redirect(new URL(`/${defaultLocale}${cleanPath}`, request.url));
  }

  // Apply rate limiting for authentication routes
  const isAuthRoute = pathname.includes('/login') || 
                     pathname.includes('/sign-in') ||
                     pathname.includes('/forgot-password');
  
  if (isAuthRoute) {
    const rateLimitResult = await applyRateLimit(request, 'auth');
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }
  }

  // Apply general dashboard rate limiting for protected routes
  const isDashboardRoute = /^\/[a-z]{2}(?:\/|$)/.test(pathname) && !pathname.includes('/login') && !pathname.includes('/sign-in') && !pathname.includes('/forgot-password') && !pathname.includes('/maintenance');
  
  if (isDashboardRoute) {
    const rateLimitResult = await applyRateLimit(request, 'dashboard');
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult;
    }
  }

  // Get the next-intl response first to handle locale properly
  const intlResponse = intlMiddleware(request);
  
  // Create a Supabase client configured to use cookies
  let response = intlResponse;

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
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check if it's a locale-only path (dashboard) - this should be protected
  const isDashboard = /^\/[a-z]{2}$/.test(pathname) || pathname === '/';
  
  const isProtectedRoute = isDashboard ||
                          isDashboardRoute ||
                          pathname.includes('/teachers') || 
                          pathname.includes('/students') || 
                          pathname.includes('/groups') ||
                          pathname.includes('/settings') ||
                          pathname.includes('/finance') ||
                          pathname.includes('/reports');

  // Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // Simplified maintenance check - move complex logic to layout components
  // Only check if user is authenticated and not already on maintenance page
  if (user && !pathname.includes('/maintenance')) {
    // Note: Detailed maintenance mode checking moved to server-side layout
    // This reduces middleware database queries and improves performance
    // Complex authorization is now handled in the dashboard layout component
  }

  // Redirect to login if accessing protected route without auth
  if (!user && isProtectedRoute) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (user && isAuthRoute) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Return the intl response with any cookie modifications
  return response;
}

export const config = {
  matcher: [
    /*
     * Optimized matcher for better performance:
     * - Only match pages that need i18n or auth checking
     * - Exclude all static assets, API routes, and build files
     */
    '/((?!api|_next|favicon.ico|.*\\.).*)',
  ],
}