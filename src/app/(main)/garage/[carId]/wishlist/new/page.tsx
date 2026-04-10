import { redirect } from "next/navigation";

export default async function NewWishlistItemRedirect({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  redirect(`/garage/${carId}/wishlist`);
}
