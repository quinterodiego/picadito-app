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
      return session;
    },
  },
} satisfies NextAuthConfig;
