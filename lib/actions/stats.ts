"use server";

import { requireUser } from "@/lib/auth";
import { getUserWorkTimeSeries, type ChartPeriod, type WorkTimePoint } from "@/lib/stats";

const MAX_OFFSET = 1000;

export async function getWorkTimeSeriesAction(period: ChartPeriod, offset = 0): Promise<WorkTimePoint[]> {
  const user = await requireUser();
  const safeOffset = Number.isInteger(offset) ? Math.min(Math.max(offset, 0), MAX_OFFSET) : 0;
  return getUserWorkTimeSeries(user.id, period, safeOffset);
}
