import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  modsToCSV,
  wishlistToCSV,
  maintenanceToCSV,
  runsToCSV,
  eventsToCSV,
  expensesToCSV,
} from "@/lib/services/csv-export";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { section } = await params;
  const carId = request.nextUrl.searchParams.get("carId") ?? undefined;

  let csv: string;
  let filename: string;

  try {
    switch (section) {
      case "mods": {
        const mods = await prisma.mod.findMany({
          where: { carId: carId ?? undefined, car: { userId } },
          orderBy: [{ category: "asc" }, { createdAt: "desc" }],
        });
        csv = modsToCSV(mods);
        filename = carId ? `mods-${carId}.csv` : "mods.csv";
        break;
      }
      case "wishlist": {
        const items = await prisma.wishlistItem.findMany({
          where: { carId: carId ?? undefined, car: { userId } },
          orderBy: { createdAt: "desc" },
        });
        csv = wishlistToCSV(items);
        filename = carId ? `wishlist-${carId}.csv` : "wishlist.csv";
        break;
      }
      case "maintenance": {
        const entries = await prisma.maintenanceEntry.findMany({
          where: { carId: carId ?? undefined, car: { userId } },
          orderBy: { date: "desc" },
        });
        csv = maintenanceToCSV(entries);
        filename = carId ? `maintenance-${carId}.csv` : "maintenance.csv";
        break;
      }
      case "runs": {
        const runs = await prisma.run.findMany({
          where: { event: { userId } },
          orderBy: [{ event: { startDate: "desc" } }, { runNumber: "asc" }],
          include: {
            event: { select: { name: true, startDate: true, type: true } },
          },
        });
        csv = runsToCSV(runs);
        filename = "runs.csv";
        break;
      }
      case "events": {
        const events = await prisma.event.findMany({
          where: { userId },
          orderBy: { startDate: "desc" },
        });
        csv = eventsToCSV(events);
        filename = "events.csv";
        break;
      }
      case "expenses": {
        const expenses = await prisma.expense.findMany({
          where: { carId: carId ?? undefined, car: { userId } },
          orderBy: { date: "desc" },
        });
        csv = expensesToCSV(expenses);
        filename = carId ? `expenses-${carId}.csv` : "expenses.csv";
        break;
      }
      default:
        return new Response("Not found", { status: 404 });
    }
  } catch {
    return new Response("Export failed", { status: 500 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
