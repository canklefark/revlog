import { redirect } from "next/navigation";

export default async function EditBrakeSetRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/brakes`);
}
