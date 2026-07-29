import { allEventPaths, coverageOf } from '@/lib/cxm-utils';
import type { CoverageStats } from '@/types/cxm';

export const CUSTOMER_PHASES = [
  { id: 'reach', code: '01', name: 'Reach', subtitle: 'Tìm hiểu', color: '#38bdf8' },
  { id: 'lead', code: '02', name: 'Lead', subtitle: 'Bắt đầu hành trình', color: '#60a5fa' },
  { id: 'onboarding', code: '03', name: 'Onboarding', subtitle: 'Hoàn tất MTK & định hướng', color: '#a78bfa' },
  { id: 'be-in', code: '04', name: 'Be In', subtitle: 'Trải nghiệm đầu tư', color: '#fbbf24' },
  { id: 'engage', code: '05', name: 'Engage & Advocacy', subtitle: 'Gắn bó & giới thiệu', color: '#34d399' },
  { id: 'churn', code: '06', name: 'Churn', subtitle: 'Rời bỏ & phục hồi', color: '#fb7185' },
] as const;

export type CustomerPhaseId = (typeof CUSTOMER_PHASES)[number]['id'];

const LEAD_TOUCHPOINTS = new Set(['tp-leadform', 'tp-otp']);
const ONBOARDING_TOUCHPOINTS = new Set(['tp-idcapture', 'tp-liveness', 'tp-profile-form', 'tp-contract', 'tp-backoffice']);

type JourneyPathRef = Pick<ReturnType<typeof allEventPaths>[number], 'phase' | 'touchpoint'>;

export function customerPhaseIdForPath(path: JourneyPathRef): CustomerPhaseId {
  if (LEAD_TOUCHPOINTS.has(path.touchpoint.id)) return 'lead';
  if (ONBOARDING_TOUCHPOINTS.has(path.touchpoint.id)) return 'onboarding';
  if (path.phase.id === 'p1') return 'reach';
  if (path.phase.id === 'p2') return 'onboarding';
  if (path.phase.id === 'p3' || path.phase.id === 'p4') return 'be-in';
  return path.phase.id === 'p7' ? 'churn' : 'engage';
}

export function customerPhaseForPath(path: JourneyPathRef) {
  return CUSTOMER_PHASES.find((phase) => phase.id === customerPhaseIdForPath(path))!;
}

export function customerPhaseForLegacyId(phaseId: string) {
  const id: CustomerPhaseId = phaseId === 'p1' ? 'reach' : phaseId === 'p2' ? 'onboarding' : phaseId === 'p3' || phaseId === 'p4' ? 'be-in' : phaseId === 'p7' ? 'churn' : 'engage';
  return CUSTOMER_PHASES.find((phase) => phase.id === id)!;
}

export function customerPhaseCoverage(phaseId: CustomerPhaseId): CoverageStats {
  return coverageOf(allEventPaths().filter((path) => customerPhaseIdForPath(path) === phaseId).map((path) => path.event));
}

export function customerPhasePaths(phaseId: CustomerPhaseId) {
  return allEventPaths().filter((path) => customerPhaseIdForPath(path) === phaseId);
}
