import { auth } from '@/auth';
import PartidoPageClient from './_components/PartidoPageClient';
import LandingPage from './_components/LandingPage';

export default async function Page() {
  const session = await auth();
  if (session?.user) return <PartidoPageClient />;
  return <LandingPage />;
}
