import { redirect } from "next/navigation";

export default function NewTireSetRedirect({
  params,
}: {
  params: { carId: string };
}) {
  redirect(`/garage/${params.carId}/tires`);
}
