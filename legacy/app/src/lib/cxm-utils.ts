import { PHASES, KPIS, kpiById } from '@/data/cxm';
import type {
  CoverageStats,
  Flow,
  InstrumentedEvent,
  KPI,
  Phase,
  Platform,
  Stage,
  Touchpoint,
} from '@/types/cxm';

// ---------- traversal helpers ----------
export interface EventPath {
  phase: Phase;
  flow: Flow;
  stage: Stage;
  touchpoint: Touchpoint;
  event: InstrumentedEvent;
}

export function allEventPaths(): EventPath[] {
  const out: EventPath[] = [];
  for (const phase of PHASES)
    for (const flow of phase.flows)
      for (const stage of flow.stages)
        for (const touchpoint of stage.touchpoints)
          for (const event of touchpoint.events)
            out.push({ phase, flow, stage, touchpoint, event });
  return out;
}

export function allTouchpoints(): { phase: Phase; flow: Flow; stage: Stage; touchpoint: Touchpoint }[] {
  const out: { phase: Phase; flow: Flow; stage: Stage; touchpoint: Touchpoint }[] = [];
  for (const phase of PHASES)
    for (const flow of phase.flows)
      for (const stage of flow.stages)
        for (const touchpoint of stage.touchpoints) out.push({ phase, flow, stage, touchpoint });
  return out;
}

// ---------- coverage ----------
export function coverageOf(events: InstrumentedEvent[]): CoverageStats {
  const total = events.length;
  const live = events.filter((e) => e.status === 'live').length;
  const validating = events.filter((e) => e.status === 'validating').length;
  const designed = events.filter((e) => e.status === 'designed').length;
  const gap = events.filter((e) => e.status === 'gap').length;
  return {
    total,
    live,
    validating,
    designed,
    gap,
    score: total === 0 ? 0 : Math.round(((live + validating * 0.5) / total) * 100),
  };
}

export function touchpointEvents(tp: Touchpoint): InstrumentedEvent[] {
  return tp.events;
}

export function stageEvents(st: Stage): InstrumentedEvent[] {
  return st.touchpoints.flatMap((t) => t.events);
}

export function flowEvents(fl: Flow): InstrumentedEvent[] {
  return fl.stages.flatMap(stageEvents);
}

export function phaseEvents(ph: Phase): InstrumentedEvent[] {
  return ph.flows.flatMap(flowEvents);
}

export const totalCoverage = () => coverageOf(allEventPaths().map((p) => p.event));

export function phaseCoverage(ph: Phase): CoverageStats {
  return coverageOf(phaseEvents(ph));
}

export function platformCoverage(): Record<Platform, CoverageStats> {
  const paths = allEventPaths();
  const byPlatform: Record<Platform, InstrumentedEvent[]> = {
    ios: [],
    android: [],
    web: [],
    server: [],
    crm: [],
  };
  for (const p of paths)
    for (const pl of p.event.platforms) byPlatform[pl].push(p.event);
  return {
    ios: coverageOf(byPlatform.ios),
    android: coverageOf(byPlatform.android),
    web: coverageOf(byPlatform.web),
    server: coverageOf(byPlatform.server),
    crm: coverageOf(byPlatform.crm),
  };
}

// ---------- impact ----------
export interface ImpactResult {
  downstreamKpis: KPI[];
  dailyReach: number;
  coverage: CoverageStats;
  impactScore: number; // 0-100
  blindKpis: KPI[]; // KPI mất tín hiệu nếu touchpoint này chết
}

export function impactOfTouchpoint(tp: Touchpoint): ImpactResult {
  const kpiIds = new Set<string>();
  tp.events.forEach((e) => e.kpiIds.forEach((k) => kpiIds.add(k)));
  const downstreamKpis = [...kpiIds].map(kpiById).filter(Boolean) as KPI[];
  const cov = coverageOf(tp.events);
  const blindKpiIds = new Set<string>();
  for (const e of tp.events) {
    if (e.status === 'gap' || e.status === 'designed') e.kpiIds.forEach((k) => blindKpiIds.add(k));
  }
  const blindKpis = [...blindKpiIds].map(kpiById).filter(Boolean) as KPI[];
  // impact score: reach (log) × revenue × coverage risk
  const reachScore = Math.min(1, Math.log10(tp.dailyUsers + 1) / 5.2);
  const revScore = tp.revenueImpact / 10;
  const riskPenalty = 1 + (cov.gap + cov.designed) / Math.max(1, cov.total);
  const impactScore = Math.round(Math.min(100, (reachScore * 0.45 + revScore * 0.55) * 100 * Math.min(1.35, riskPenalty * 0.75)));
  return { downstreamKpis, dailyReach: tp.dailyUsers, coverage: cov, impactScore, blindKpis };
}

export function impactOfEvent(ev: InstrumentedEvent, tp: Touchpoint): ImpactResult {
  const downstreamKpis = ev.kpiIds.map(kpiById).filter(Boolean) as KPI[];
  const cov = coverageOf([ev]);
  const reachScore = Math.min(1, Math.log10(Math.max(ev.volumePerDay, 1) + 1) / 5.2);
  const revScore = tp.revenueImpact / 10;
  const impactScore = Math.round(Math.min(100, (reachScore * 0.5 + revScore * 0.5) * 100));
  const blindKpis = ev.status === 'gap' || ev.status === 'designed' ? downstreamKpis : [];
  return { downstreamKpis, dailyReach: ev.volumePerDay, coverage: cov, impactScore, blindKpis };
}

// north-star KPIs
export const northStarKpis = KPIS.filter((k) => k.criticality === 'north-star');

// KPI nào đang "mù" (chỉ có event gap/designed, không có event live/validating nào)
export function blindKpiList(): { kpi: KPI; paths: EventPath[] }[] {
  const paths = allEventPaths();
  const byKpi = new Map<string, EventPath[]>();
  for (const p of paths)
    for (const k of p.event.kpiIds) {
      if (!byKpi.has(k)) byKpi.set(k, []);
      byKpi.get(k)!.push(p);
    }
  const out: { kpi: KPI; paths: EventPath[] }[] = [];
  for (const [kid, ps] of byKpi) {
    const hasSignal = ps.some((p) => p.event.status === 'live' || p.event.status === 'validating');
    if (!hasSignal) {
      const kpi = kpiById(kid);
      if (kpi) out.push({ kpi, paths: ps });
    }
  }
  return out;
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return `${n}`;
}

export function findEventById(id: string): EventPath | undefined {
  return allEventPaths().find((p) => p.event.id === id);
}

export function findTouchpointById(id: string) {
  return allTouchpoints().find((t) => t.touchpoint.id === id);
}
