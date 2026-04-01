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
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/settings" label="Settings" />
      <h1 className="mb-6 text-2xl font-semibold">Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}
