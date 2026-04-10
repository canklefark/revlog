import { redirect } from "next/navigation";

export default async function EditExpenseRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/expenses`);
}
