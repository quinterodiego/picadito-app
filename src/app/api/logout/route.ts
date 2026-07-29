import { NextResponse } from 'next/server';

// Clears all next-auth session cookies and redirects to /login.
// Used as a fallback when client-side signOut() fails to clear the session.
export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  const cookieNames = [
    'authjs.session-token',
    'authjs.callback-url',
    'authjs.csrf-token',
    '__Secure-authjs.session-token',
    '__Secure-authjs.callback-url',
    '__Secure-authjs.csrf-token',
    '__Host-authjs.csrf-token',
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
  ];
  for (const name of cookieNames) {
    response.cookies.set(name, '', { expires: new Date(0), path: '/' });
  }
  return response;
}