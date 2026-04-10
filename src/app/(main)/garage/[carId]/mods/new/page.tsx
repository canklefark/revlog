import { redirect } from "next/navigation";

export default async function NewModRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/mods`);
}
