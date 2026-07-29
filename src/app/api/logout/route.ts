import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const response = NextResponse.redirect(new URL('/login', req.url));

  const base = 'Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';
  const secure = `${base}; Secure`;

  const cookieHeaders = [
    // Standard (HTTP / localhost)
    `authjs.session-token=; ${base}`,
    `authjs.callback-url=; ${base}`,
    `authjs.csrf-token=; ${base}`,
    // __Secure- prefixed (HTTPS / production) — must include Secure attribute
    `__Secure-authjs.session-token=; ${secure}`,
    `__Secure-authjs.callback-url=; ${secure}`,
    `__Secure-authjs.csrf-token=; ${secure}`,
    // __Host- prefixed — must include Secure + no Domain
    `__Host-authjs.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
    // Legacy next-auth names
    `next-auth.session-token=; ${base}`,
    `next-auth.callback-url=; ${base}`,
    `next-auth.csrf-token=; ${base}`,
    `__Secure-next-auth.session-token=; ${secure}`,
  ];

  for (const header of cookieHeaders) {
    response.headers.append('Set-Cookie', header);
  }

  return response;
}