import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { getOrCreateUsuario, getMiembroGrupo } from '@/lib/sheets';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, trigger, user }) {
      // next-auth v5 beta doesn't always copy user.email → token.email automatically
      if ((trigger === 'signIn' || trigger === 'signUp') && user) {
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
      }

      if (trigger === 'signIn' || trigger === 'signUp' || trigger === 'update' || !token['userId']) {
        try {
          if (token.email) {
            const userId = await getOrCreateUsuario(token.email, token.name ?? '');
            token['userId'] = userId;
          }
          if (token['userId']) {
            const miembro = await getMiembroGrupo(token['userId'] as string);
            token['groupId'] = miembro?.groupId;
          }
        } catch (err) {
          console.error('[JWT] sheets error:', err);
        }
      }
      return token;
    },
  },
});
