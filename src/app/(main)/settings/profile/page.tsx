import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import { BackLink } from "@/components/shared/back-link";

export default async function ProfilePage() {
  const userId = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      homeAddress: true,
      timezone: true,
      units: true,
      seasonBudget: true,
      defaultEventType: true,
    },
  });

  return (
    <div>
      <BackLink href="/settings" label="Settings" />
      <h1 className="mb-6 text-2xl font-semibold">Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}
