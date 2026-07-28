import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { getOrCreateUsuario, getMiembroGrupo } from '@/lib/sheets';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, trigger }) {
      if (trigger === 'signIn' || trigger === 'signUp' || trigger === 'update' || !token['userId']) {
        try {
          if (token.email) {
            const userId = await getOrCreateUsuario(token.email, token.name ?? '');
            token['userId'] = userId;
            const miembro = await getMiembroGrupo(userId);
            token['groupId'] = miembro?.groupId;
          }
        } catch {
          // sheets may not be initialized yet
        }
      }
      return token;
    },
  },
});
