import type { ConsistencyResult } from "@/lib/utils/consistency";

export type ProgressDataPoint = {
  eventId: string;
  eventName: string;
  eventType: string;
  startDate: Date;
  carId: string;
  carLabel: string;
  bestAdjustedTime: number;
  runCount: number;
};

export type PersonalRecord = {
  carId: string;
  carLabel: string;
  eventType: string;
  bestTime: number;
  eventName: string;
  eventDate: Date;
  eventId: string;
};

export type ConditionStats = {
  condition: string;
  bestTime: number;
  avgTime: number;
  runCount: number;
};

export type CarComparisonSeries = {
  carId: string;
  carLabel: string;
  dataPoints: Array<{
    eventDate: Date;
    eventName: string;
    bestTime: number;
  }>;
  overallBest: number;
  avgBest: number;
  consistency: ConsistencyResult | null;
};

export type SeasonProgress = {
  year: number;
  eventsCompleted: number;
  eventsRemaining: number;
  improvementSeconds: number | null; // positive = got faster (first best - last best)
};

export type RecentRun = {
  id: string;
  runNumber: number;
  rawTime: number;
  adjustedTime: number | null;
  isDnf: boolean;
  conditions: string[];
  eventName: string;
  eventId: string;
  eventDate: Date;
  eventType: string;
  carLabel: string;
};
