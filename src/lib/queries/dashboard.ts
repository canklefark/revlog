import { prisma } from "@/lib/prisma";
import { getMaintenanceAlerts } from "@/lib/utils/maintenance-alerts";
import { startOfYear, endOfYear } from "date-fns";

export async function getNextEvent(userId: string) {
  return prisma.event.findFirst({
    where: {
      userId,
      startDate: { gte: new Date() },
      registrationStatus: { not: "Skipped" },
    },
    orderBy: { startDate: "asc" },
    include: {
      car: {
        select: {
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getUpcomingEvents(userId: string, limit = 10) {
  return prisma.event.findMany({
    where: {
      userId,
      startDate: { gte: new Date() },
      registrationStatus: { not: "Skipped" },
    },
    orderBy: { startDate: "asc" },
    take: limit,
    include: {
      car: {
        select: {
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });
}

export async function getBudgetSnapshot(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { seasonBudget: true },
  });

  const events = await prisma.event.findMany({
    where: {
      userId,
      startDate: { gte: startOfYear(now), lte: endOfYear(now) },
      registrationStatus: { in: ["Registered", "Completed"] },
    },
    include: {
      additionalCosts: { select: { amount: true } },
    },
  });

  const spent = events.reduce((sum, e) => {
    const fee = e.entryFee ?? 0;
    const extra = e.additionalCosts.reduce((s, c) => s + c.amount, 0);
    return sum + fee + extra;
  }, 0);

  return { spent, budget: user?.seasonBudget ?? null };
}

export async function getMaintenanceAlertsForDashboard(userId: string) {
  const cars = await prisma.car.findMany({
    where: { userId },
    select: {
      id: true,
      year: true,
      make: true,
      model: true,
      nickname: true,
      currentOdometer: true,
      maintenanceEntries: true,
    },
  });

  return cars
    .map((car) => ({
      car,
      alerts: getMaintenanceAlerts(car.maintenanceEntries, car.currentOdometer),
    }))
    .filter(({ alerts }) => alerts.length > 0);
}
