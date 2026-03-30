import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { WishlistForm } from "@/components/garage/wishlist-form";
import { updateWishlistItem } from "@/lib/actions/wishlist";

export default async function EditWishlistPage({
  params,
}: {
  params: Promise<{ carId: string; itemId: string }>;
}) {
  const { carId, itemId } = await params;
  const userId = await requireAuth();

  const item = await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: {
      car: {
        select: {
          userId: true,
          nickname: true,
          year: true,
          make: true,
          model: true,
        },
      },
    },
  });

  if (!item || item.car.userId !== userId) notFound();

  const displayName =
    item.car.nickname ?? `${item.car.year} ${item.car.make} ${item.car.model}`;

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
      <Link
        href={`/garage/${carId}/wishlist`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {displayName} / Wishlist
      </Link>
      <h1 className="text-2xl font-semibold mb-6 mt-1">Edit Wishlist Item</h1>
      <WishlistForm
        action={updateWishlistItem}
        carId={carId}
        defaultValues={item}
      />
    </main>
  );
}
