import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, image: true, email: true },
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DesktopSidebar user={user} className="hidden md:flex" />
      <div className="flex flex-1 flex-col">
        <AppHeader user={user} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav className="md:hidden" />
    </div>
  );
}
