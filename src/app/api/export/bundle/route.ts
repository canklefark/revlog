import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  modsToCSV,
  wishlistToCSV,
  maintenanceToCSV,
  runsToCSV,
  eventsToCSV,
  generateZipBundle,
} from "@/lib/services/csv-export";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const [mods, wishlistItems, maintenanceEntries, runs, events] =
      await Promise.all([
        prisma.mod.findMany({
          where: { car: { userId } },
          orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        }),
        prisma.wishlistItem.findMany({
          where: { car: { userId } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.maintenanceEntry.findMany({
          where: { car: { userId } },
          orderBy: { date: "desc" },
        }),
        prisma.run.findMany({
          where: { event: { userId } },
          orderBy: [{ event: { startDate: "desc" } }, { runNumber: "asc" }],
          include: {
            event: { select: { name: true, startDate: true, type: true } },
          },
        }),
        prisma.event.findMany({
          where: { userId },
          orderBy: { startDate: "desc" },
        }),
      ]);

    const sections = {
      mods: modsToCSV(mods),
      wishlist: wishlistToCSV(wishlistItems),
      maintenance: maintenanceToCSV(maintenanceEntries),
      runs: runsToCSV(runs),
      events: eventsToCSV(events),
    };

    const zipBuffer = await generateZipBundle(sections);

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="revlog-export.zip"',
      },
    });
  } catch {
    return new Response("Export failed", { status: 500 });
  }
}
