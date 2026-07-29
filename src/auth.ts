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
          // Create/find user by email when available
          if (token.email) {
            const userId = await getOrCreateUsuario(token.email, token.name ?? '');
            token['userId'] = userId;
          }
          // Always look up group if we have a userId — even when email was missing
          if (token['userId']) {
            const miembro = await getMiembroGrupo(token['userId'] as string);
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
