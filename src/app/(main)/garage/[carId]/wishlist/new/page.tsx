import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { WishlistForm } from "@/components/garage/wishlist-form";
import { createWishlistItem } from "@/lib/actions/wishlist";

export default async function NewWishlistPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  const userId = await requireAuth();

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car || car.userId !== userId) notFound();

  const displayName = car.nickname ?? `${car.year} ${car.make} ${car.model}`;

  return (
    <main className="container mx-auto px-4 py-6 max-w-xl">
      <Link
        href={`/garage/${carId}/wishlist`}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {displayName} / Wishlist
      </Link>
      <h1 className="text-2xl font-semibold mb-6 mt-1">Add Wishlist Item</h1>
      <WishlistForm action={createWishlistItem} carId={carId} />
    </main>
  );
}
