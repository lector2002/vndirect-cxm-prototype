export const TIME_FRAMES = [
  { id: 'today', label: 'Hôm nay', days: 1, snapshot: false },
  { id: 'last-7d', label: '7 ngày gần nhất', days: 7, snapshot: true },
  { id: 'last-30d', label: '30 ngày gần nhất', days: 30, snapshot: true },
  { id: 'q3-2026', label: 'Q3/2026', days: 92, snapshot: true },
  { id: 'ytd-2026', label: 'YTD 2026', days: 199, snapshot: true },
] as const;

export type TimeFrameId = (typeof TIME_FRAMES)[number]['id'];

export function timeFrameById(id: TimeFrameId) {
  return TIME_FRAMES.find((frame) => frame.id === id)!;
}

export function volumeForTimeFrame(dailyVolume: number, timeFrameId: TimeFrameId) {
  return dailyVolume * timeFrameById(timeFrameId).days;
}
