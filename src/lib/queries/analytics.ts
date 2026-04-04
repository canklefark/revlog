import { prisma } from "@/lib/prisma";
import { calculateConsistency } from "@/lib/utils/consistency";
import { startOfYear, endOfYear } from "date-fns";
import type { Prisma } from "@prisma/client";
import type {
  ProgressDataPoint,
  PersonalRecord,
  ConditionStats,
  CarComparisonSeries,
  SeasonProgress,
  RecentRun,
  ModMarker,
} from "@/types/analytics";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCarLabel(car: {
  nickname: string | null;
  year: number;
  make: string;
  model: string;
}): string {
  return car.nickname ?? `${car.year} ${car.make} ${car.model}`;
}

function bestValidAdjustedTime(
  runs: Array<{ adjustedTime: number | null }>,
): number | null {
  const times = runs
    .map((r) => r.adjustedTime)
    .filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  return Math.min(...times);
}

// ---------------------------------------------------------------------------
// getProgressData
// ---------------------------------------------------------------------------

export async function getProgressData(
  userId: string,
  filters?: { carId?: string; eventType?: string; year?: number },
): Promise<ProgressDataPoint[]> {
  const where: Prisma.EventWhereInput = {
    userId,
    runs: { some: { isDnf: false } },
  };

  if (filters?.carId) {
    where.carId = filters.carId;
  }
  if (filters?.eventType) {
    where.type = filters.eventType;
  }
  if (filters?.year !== undefined) {
    const anchor = new Date(filters.year, 0);
    where.startDate = {
      gte: startOfYear(anchor),
      lte: endOfYear(anchor),
    };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: 50,
    include: {
      runs: {
        where: { isDnf: false },
        select: { adjustedTime: true },
      },
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });

  const result: ProgressDataPoint[] = [];

  for (const event of events) {
    if (!event.car) continue;

    const best = bestValidAdjustedTime(event.runs);
    if (best === null) continue;

    result.push({
      eventId: event.id,
      eventName: event.name,
      eventType: event.type,
      startDate: event.startDate,
      carId: event.car.id,
      carLabel: buildCarLabel(event.car),
      bestAdjustedTime: best,
      runCount: event.runs.length,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getPersonalRecords
// ---------------------------------------------------------------------------

export async function getPersonalRecords(
  userId: string,
): Promise<PersonalRecord[]> {
  const events = await prisma.event.findMany({
    where: {
      userId,
      runs: { some: { isDnf: false } },
    },
    orderBy: { startDate: "asc" },
    include: {
      runs: {
        where: { isDnf: false },
        select: { adjustedTime: true },
      },
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });

  // Map keyed by `${carId}:${eventType}` → best PersonalRecord candidate
  const recordMap = new Map<string, PersonalRecord>();

  for (const event of events) {
    if (!event.car) continue;

    const best = bestValidAdjustedTime(event.runs);
    if (best === null) continue;

    const key = `${event.car.id}:${event.type}`;
    const existing = recordMap.get(key);

    if (!existing || best < existing.bestTime) {
      recordMap.set(key, {
        carId: event.car.id,
        carLabel: buildCarLabel(event.car),
        eventType: event.type,
        bestTime: best,
        eventName: event.name,
        eventDate: event.startDate,
        eventId: event.id,
      });
    }
  }

  return Array.from(recordMap.values()).sort((a, b) => {
    const labelCmp = a.carLabel.localeCompare(b.carLabel);
    if (labelCmp !== 0) return labelCmp;
    return a.eventType.localeCompare(b.eventType);
  });
}

// ---------------------------------------------------------------------------
// getConditionsAnalysis
// ---------------------------------------------------------------------------

export async function getConditionsAnalysis(
  userId: string,
  carId?: string,
): Promise<ConditionStats[]> {
  const where: Prisma.RunWhereInput = {
    event: { userId },
    isDnf: false,
    adjustedTime: { not: null },
  };

  if (carId) {
    where.carId = carId;
  }

  const runs = await prisma.run.findMany({
    where,
    select: { conditions: true, adjustedTime: true },
  });

  const buckets = new Map<string, number[]>();

  for (const run of runs) {
    // adjustedTime is non-null per the query filter but Prisma types it Float?
    const time = run.adjustedTime;
    if (time === null) continue;

    for (const condition of run.conditions) {
      const existing = buckets.get(condition);
      if (existing) {
        existing.push(time);
      } else {
        buckets.set(condition, [time]);
      }
    }
  }

  const stats: ConditionStats[] = [];

  for (const [condition, times] of buckets) {
    if (times.length === 0) continue;
    const bestTime = Math.min(...times);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    stats.push({ condition, bestTime, avgTime, runCount: times.length });
  }

  return stats.sort((a, b) => b.runCount - a.runCount);
}

// ---------------------------------------------------------------------------
// getCarComparisonData
// ---------------------------------------------------------------------------

export async function getCarComparisonData(
  userId: string,
  eventType?: string,
): Promise<CarComparisonSeries[]> {
  const where: Prisma.EventWhereInput = {
    userId,
    runs: { some: { isDnf: false } },
  };

  if (eventType) {
    where.type = eventType;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
    take: 50,
    include: {
      runs: {
        where: { isDnf: false },
        select: { adjustedTime: true },
      },
      car: {
        select: {
          id: true,
          year: true,
          make: true,
          model: true,
          nickname: true,
        },
      },
    },
  });

  // Group by carId
  const carGroups = new Map<
    string,
    {
      carLabel: string;
      dataPoints: Array<{
        eventDate: Date;
        eventName: string;
        bestTime: number;
      }>;
    }
  >();

  for (const event of events) {
    if (!event.car) continue;

    const best = bestValidAdjustedTime(event.runs);
    if (best === null) continue;

    const existing = carGroups.get(event.car.id);
    const dataPoint = {
      eventDate: event.startDate,
      eventName: event.name,
      bestTime: best,
    };

    if (existing) {
      existing.dataPoints.push(dataPoint);
    } else {
      carGroups.set(event.car.id, {
        carLabel: buildCarLabel(event.car),
        dataPoints: [dataPoint],
      });
    }
  }

  const result: CarComparisonSeries[] = [];

  for (const [carId, { carLabel, dataPoints }] of carGroups) {
    const allBestTimes = dataPoints.map((dp) => dp.bestTime);
    const overallBest = Math.min(...allBestTimes);
    const avgBest =
      allBestTimes.reduce((sum, t) => sum + t, 0) / allBestTimes.length;
    const consistency = calculateConsistency(allBestTimes);

    result.push({
      carId,
      carLabel,
      dataPoints,
      overallBest,
      avgBest,
      consistency,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// getSeasonProgress
// ---------------------------------------------------------------------------

export async function getSeasonProgress(
  userId: string,
): Promise<SeasonProgress> {
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const [eventsCompleted, eventsRemaining, completedEvents] = await Promise.all(
    [
      prisma.event.count({
        where: {
          userId,
          registrationStatus: "Completed",
          startDate: { gte: yearStart, lte: now },
        },
      }),
      prisma.event.count({
        where: {
          userId,
          registrationStatus: {
            in: ["Registered", "Interested", "Waitlisted"],
          },
          startDate: { gt: now, lte: yearEnd },
        },
      }),
      prisma.event.findMany({
        where: {
          userId,
          registrationStatus: "Completed",
          startDate: { gte: yearStart },
          runs: { some: { isDnf: false } },
        },
        orderBy: { startDate: "asc" },
        include: {
          runs: {
            where: { isDnf: false },
            select: { adjustedTime: true },
          },
        },
        take: 50,
      }),
    ],
  );

  let improvementSeconds: number | null = null;

  if (completedEvents.length >= 2) {
    const firstBest = bestValidAdjustedTime(completedEvents[0].runs);
    const lastBest = bestValidAdjustedTime(
      completedEvents[completedEvents.length - 1].runs,
    );

    if (firstBest !== null && lastBest !== null) {
      improvementSeconds = firstBest - lastBest;
    }
  }

  return { year, eventsCompleted, eventsRemaining, improvementSeconds };
}

// ---------------------------------------------------------------------------
// getModMarkers
// ---------------------------------------------------------------------------

export async function getModMarkers(userId: string): Promise<ModMarker[]> {
  const mods = await prisma.mod.findMany({
    where: {
      car: { userId },
      installDate: { not: null },
    },
    select: {
      installDate: true,
      name: true,
      car: { select: { nickname: true, year: true, make: true, model: true } },
    },
    orderBy: { installDate: "asc" },
  });

  return mods
    .filter((m) => m.installDate != null)
    .map((m) => ({
      // Use full ISO string so it aligns with the eventDate x-axis key built
      // via Date.toISOString() in progress-chart.tsx
      date: m.installDate!.toISOString(),
      label: m.name.length > 20 ? m.name.slice(0, 18) + "\u2026" : m.name,
      carLabel: m.car.nickname ?? `${m.car.year} ${m.car.make} ${m.car.model}`,
    }));
}

// ---------------------------------------------------------------------------
// getRecentRuns
// ---------------------------------------------------------------------------

export async function getRecentRuns(
  userId: string,
  limit = 10,
): Promise<RecentRun[]> {
  const runs = await prisma.run.findMany({
    where: { event: { userId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      event: {
        select: {
          id: true,
          name: true,
          startDate: true,
          type: true,
        },
      },
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

  return runs.map((run) => ({
    id: run.id,
    runNumber: run.runNumber,
    rawTime: run.rawTime,
    adjustedTime: run.adjustedTime,
    isDnf: run.isDnf,
    conditions: run.conditions,
    eventName: run.event.name,
    eventId: run.event.id,
    eventDate: run.event.startDate,
    eventType: run.event.type,
    carLabel: buildCarLabel(run.car),
  }));
}
