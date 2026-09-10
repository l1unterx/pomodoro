export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

export function formatMinutes(totalSeconds: number): string {
  return `${Math.round(totalSeconds / 60)} min`;
}

export function formatDurationShort(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.round((totalSeconds % 3600) / 60);
  if (hrs === 0) return `${mins}M`;
  if (mins === 0) return `${hrs}H`;
  return `${hrs}H ${mins}M`;
}
