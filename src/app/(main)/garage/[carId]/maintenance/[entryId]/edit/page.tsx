import { redirect } from "next/navigation";

export default async function EditMaintenanceRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/maintenance`);
}
