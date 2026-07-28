import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      groupId?: string;
    } & DefaultSession['user'];
  }
}

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session({ session, token }) {
      if (token['userId']) session.user.id = token['userId'] as string;
      session.user.groupId = token['groupId'] as string | undefined;
      // Ensure email/name propagate from token (next-auth v5 beta quirk)
      if (token.email) session.user.email = token.email;
      if (token.name) session.user.name = token.name;
      return session;
    },
  },
} satisfies NextAuthConfig;
