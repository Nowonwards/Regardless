import { AppLayout } from '@/components/layout/AppLayout';
import { getAuthUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  return (
    <AppLayout user={user || null}>
      {children}
    </AppLayout>
  );
}