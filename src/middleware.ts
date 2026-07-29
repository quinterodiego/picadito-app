import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (!isLoggedIn) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // / and /login are public — everything else redirects to landing
    if (pathname === '/' || pathname === '/login') return NextResponse.next();
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Logged-in users don't need the login page or the landing — send to app
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const groupId = req.auth?.user?.groupId;
  if (!groupId) {
    if (pathname.startsWith('/api/')) {
      if (pathname.startsWith('/api/grupos')) return NextResponse.next();
      if (pathname.startsWith('/api/logout')) return NextResponse.next();
      return NextResponse.json({ error: 'Sin grupo asignado' }, { status: 403 });
    }
    if (pathname.startsWith('/grupo/')) return NextResponse.next();
    return NextResponse.redirect(new URL('/grupo/inicio', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|api/setup|_next/static|_next/image|favicon\\.ico|logo\\.png).*)'],
};
