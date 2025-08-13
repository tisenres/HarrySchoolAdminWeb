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

  // Check auth for protected routes
  const isAuthRoute = pathname.includes('/login') || 
                     pathname.includes('/sign-in') ||
                     pathname.includes('/forgot-password');
  
  // Check if it's a locale-only path (dashboard) - this should be protected
  const isDashboard = /^\/[a-z]{2}$/.test(pathname) || pathname === '/';
  
  // Check if it's any dashboard route that needs protection
  const isDashboardRoute = /^\/[a-z]{2}(?:\/|$)/.test(pathname) && !pathname.includes('/login') && !pathname.includes('/sign-in') && !pathname.includes('/forgot-password') && !pathname.includes('/maintenance');
  
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

  // Check for maintenance mode (but allow access to API routes and static assets)
  if (user && !pathname.includes('/api/') && !pathname.includes('/_next/')) {
    try {
      // Get user profile to check organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check maintenance mode directly in middleware
        const { data: maintenanceSetting } = await supabase
          .from('system_settings')
          .select('value')
          .eq('organization_id', profile.organization_id)
          .eq('category', 'system')
          .eq('key', 'maintenance_mode')
          .single();
        
        const isMaintenanceMode = maintenanceSetting?.value === true;
        
        // Allow superadmin to access during maintenance mode
        if (isMaintenanceMode && profile.role !== 'superadmin') {
          const locale = pathname.split('/')[1] || defaultLocale;
          const maintenanceUrl = new URL(`/${locale}/maintenance`, request.url);
          
          // Don't redirect if already on maintenance page
          if (!pathname.includes('/maintenance')) {
            return NextResponse.redirect(maintenanceUrl);
          }
        }
      }
    } catch (error) {
      // If there's an error checking maintenance mode, log it but don't block access
      console.warn('Error checking maintenance mode:', error);
    }
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
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}