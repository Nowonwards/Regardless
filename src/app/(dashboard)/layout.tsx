import { AppLayout } from '@/components/layout/AppLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <AppLayout user={session?.user || null}>
      {children}
    </AppLayout>
  );
}