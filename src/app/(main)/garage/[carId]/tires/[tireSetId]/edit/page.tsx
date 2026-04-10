import { redirect } from "next/navigation";

export default function EditTireSetRedirect({
  params,
}: {
  params: { carId: string; tireSetId: string };
}) {
  redirect(`/garage/${params.carId}/tires`);
}
