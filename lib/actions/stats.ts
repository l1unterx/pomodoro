"use server";

import { requireUser } from "@/lib/auth";
import { getUserWorkTimeSeries, type ChartPeriod, type WorkTimePoint } from "@/lib/stats";

export async function getWorkTimeSeriesAction(period: ChartPeriod): Promise<WorkTimePoint[]> {
  const user = await requireUser();
  return getUserWorkTimeSeries(user.id, period);
}
