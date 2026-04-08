import { prisma } from "@/lib/prisma";
import type { VenueOption } from "@/components/events/venue-autocomplete";

export async function getVenueOptions(userId: string): Promise<VenueOption[]> {
  const rows = await prisma.event.findMany({
    where: { userId, venueName: { not: null } },
    select: { venueName: true, address: true },
    distinct: ["venueName"],
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return rows.map((v) => ({
    venueName: v.venueName!,
    address: v.address,
  }));
}
