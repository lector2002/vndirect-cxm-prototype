export type RangeId = '3m' | '6m' | '1y';

export const RANGE_MONTHS: Record<RangeId, number> = { '3m': 3, '6m': 6, '1y': 12 };
