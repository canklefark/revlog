import { redirect } from "next/navigation";

export default async function EditWishlistItemRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/wishlist`);
}
