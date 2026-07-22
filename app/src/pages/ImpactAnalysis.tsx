import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Database,
  EyeOff,
  Gauge,
  GitBranch,
  Lightbulb,
  Radio,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ChannelChip, CoverageBar, KpiCategoryChip, PlatformChips, StatusBadge } from '@/components/cxm-shared';
import { allTouchpoints, coverageOf, fmtNum, impactOfTouchpoint } from '@/lib/cxm-utils';
import { customerPhaseForPath, customerPhaseIdForPath } from '@/lib/journey-taxonomy';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { KPI_CATEGORY_LABEL, PLATFORM_LABEL, type Platform } from '@/types/cxm';

export default function ImpactAnalysis() {
  const { selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const [selectedId, setSelectedId] = useState('');
  const timeFrame = timeFrameById(selectedTimeFrameId);
  const touchpoints = useMemo(
    () => allTouchpoints()
      .filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId)
      .map((path) => ({ ...path, impact: impactOfTouchpoint(path.touchpoint), coverage: coverageOf(path.touchpoint.events) })),
    [selectedCustomerPhaseId],
  );
  const ranked = useMemo(() => [...touchpoints].sort((a, b) => b.impact.impactScore - a.impact.impactScore), [touchpoints]);
  const selected = touchpoints.find((path) => path.touchpoint.id === selectedId) ?? ranked[0];

  if (!selected) return <div className="p-6 text-sm text-muted-foreground">Chưa có touchpoint cho phase đang chọn.</div>;

  const affectedPlatforms = [...new Set(selected.touchpoint.events.flatMap((event) => event.platforms))] as Platform[];
  const totalReach = ranked.reduce((sum, path) => sum + path.touchpoint.dailyUsers, 0);
  const highRadius = ranked.filter((path) => path.impact.impactScore >= 60).length;
  const blindKpis = new Set(ranked.flatMap((path) => path.impact.blindKpis.map((kpi) => kpi.id))).size;

  return (
    <div className="flex h-full min-h-[760px] min-w-[1080px] flex-col overflow-hidden bg-slate-50/40 p-5">
      <header className="mb-4 flex shrink-0 items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><GitBranch className="h-3.5 w-3.5" />Change impact report</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Blast radius theo touchpoint</h1>
          <p className="mt-1 text-xs text-muted-foreground">Chọn điểm thay đổi, lần theo event/data, KPI và hệ thống chịu tác động trước khi ưu tiên.</p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <Metric label="Touchpoint" value={String(ranked.length)} />
          <Metric label="High radius" value={String(highRadius)} tone="text-rose-700" />
          <Metric label="KPI đang mù" value={String(blindKpis)} tone="text-amber-700" />
          <Metric label={`Reach / ${timeFrame.label}`} value={fmtNum(volumeForTimeFrame(totalReach, selectedTimeFrameId))} tone="text-primary" />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[430px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <aside aria-label="Xếp hạng blast radius" className="flex min-h-0 flex-col border-r border-border bg-slate-50/70">
          <div className="border-b border-border bg-white p-4"><div className="flex items-start justify-between"><div><h2 className="text-sm font-semibold">Ranking master</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Score kết hợp reach, revenue và coverage risk.</p></div><span className="rounded-md bg-secondary px-2 py-1 text-[9px] font-semibold text-muted-foreground">Cao xuống thấp</span></div></div>
          <div className="grid grid-cols-[32px_1fr_54px_52px] gap-2 border-b border-border px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"><span>#</span><span>Touchpoint / phase</span><span className="text-right">Reach</span><span className="text-right">Score</span></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {ranked.map((path, index) => {
              const active = path.touchpoint.id === selected.touchpoint.id;
              return <button key={path.touchpoint.id} type="button" onClick={() => setSelectedId(path.touchpoint.id)} aria-pressed={active} className={cn('grid w-full grid-cols-[32px_1fr_54px_52px] items-center gap-2 border-b border-border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active ? 'bg-primary/5' : 'hover:bg-white')}>
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold', index < 3 ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-600')}>{index + 1}</span>
                <span className="min-w-0"><span className="block truncate text-[11px] font-semibold">{path.touchpoint.name}</span><span className="mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground"><span>{customerPhaseForPath(path).name}</span><span>·</span><span>{path.impact.downstreamKpis.length} KPI</span><span className={cn('h-1.5 w-1.5 rounded-full', path.coverage.score >= 75 ? 'bg-emerald-500' : path.coverage.score >= 40 ? 'bg-amber-500' : 'bg-rose-500')} /></span></span>
                <span className="text-right text-[10px] font-medium tabular-nums">{fmtNum(volumeForTimeFrame(path.touchpoint.dailyUsers, selectedTimeFrameId))}</span>
                <span className={cn('text-right text-sm font-bold tabular-nums', path.impact.impactScore >= 60 ? 'text-rose-700' : path.impact.impactScore >= 40 ? 'text-amber-700' : 'text-slate-700')}>{path.impact.impactScore}</span>
              </button>;
            })}
          </div>
          <div className="border-t border-border bg-white p-3"><div className="flex items-center justify-between text-[9px] text-muted-foreground"><span>Coverage của selection</span><strong className="text-foreground">{selected.coverage.score}%</strong></div><div className="mt-1.5"><CoverageBar stats={selected.coverage} height="h-1.5" showLabel={false} /></div></div>
        </aside>

        <main aria-label="Chi tiết blast radius" className="min-h-0 overflow-y-auto">
          <section className="border-b border-border p-5">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0"><div className="flex items-center gap-2"><ChannelChip channel={selected.touchpoint.channel} /><span className="text-[10px] text-muted-foreground">{customerPhaseForPath(selected).code} · {customerPhaseForPath(selected).name} / {selected.flow.name}</span></div><h2 className="mt-2 text-xl font-bold tracking-tight">{selected.touchpoint.name}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{selected.touchpoint.description}</p></div>
              <div className="flex shrink-0 gap-5 text-right"><TopFact icon={<Gauge className="h-3.5 w-3.5" />} label="Impact score" value={String(selected.impact.impactScore)} tone="text-rose-700" /><TopFact icon={<Users className="h-3.5 w-3.5" />} label={`KH / ${timeFrame.label}`} value={fmtNum(volumeForTimeFrame(selected.touchpoint.dailyUsers, selectedTimeFrameId))} /><TopFact icon={<Banknote className="h-3.5 w-3.5" />} label="Revenue" value={`${selected.touchpoint.revenueImpact}/10`} /></div>
            </div>
          </section>

          <section className="p-5">
            <div className="mb-3"><h3 className="text-xs font-semibold">Impact chain</h3><p className="mt-0.5 text-[10px] text-muted-foreground">Blast radius có thể kiểm tra từ nguồn thay đổi đến outcome và hệ thống vận hành.</p></div>
            <div className="grid grid-cols-[.82fr_24px_1.15fr_24px_1.15fr] items-stretch">
              <ChainNode icon={<Radio className="h-3.5 w-3.5" />} step="01" title="Touchpoint" tone="border-primary/30 bg-primary/5">
                <div className="text-xs font-semibold">{selected.touchpoint.name}</div><div className="mt-2 text-[10px] text-muted-foreground">Owner: {selected.touchpoint.owner}</div><div className="mt-1"><ChannelChip channel={selected.touchpoint.channel} /></div>
              </ChainNode>
              <ChainArrow />
              <ChainNode icon={<Database className="h-3.5 w-3.5" />} step="02" title={`Event / data (${selected.touchpoint.events.length})`}>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">{selected.touchpoint.events.map((event) => <div key={event.id} className="rounded-lg border border-border bg-white p-2.5"><div className="flex items-start justify-between gap-2"><code className="break-all text-[10px] font-semibold">{event.name}</code><StatusBadge status={event.status} size="xs" /></div><div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground"><PlatformChips platforms={event.platforms} /><span>{event.volumePerDay ? `${fmtNum(volumeForTimeFrame(event.volumePerDay, selectedTimeFrameId))} / ${timeFrame.label}` : 'No volume'}</span></div></div>)}</div>
              </ChainNode>
              <ChainArrow />
              <ChainNode icon={<ShieldAlert className="h-3.5 w-3.5" />} step="03" title="KPI / system impact" tone={selected.impact.blindKpis.length ? 'border-rose-200 bg-rose-50/40' : undefined}>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">{selected.impact.downstreamKpis.map((kpi) => { const blind = selected.impact.blindKpis.some((item) => item.id === kpi.id); return <div key={kpi.id} className="rounded-lg border border-border bg-white p-2.5"><div className="flex items-start justify-between gap-2"><span className="text-[10px] font-semibold">{kpi.name}</span>{blind && <span title="Mất tín hiệu" className="text-rose-700"><EyeOff className="h-3.5 w-3.5" /></span>}</div><div className="mt-1.5 flex items-center justify-between"><KpiCategoryChip category={kpi.category} label={KPI_CATEGORY_LABEL[kpi.category]} /><span className="text-[9px] text-muted-foreground">{kpi.owner}</span></div></div>; })}</div>
                <div className="mt-3 border-t border-border pt-2"><div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">System surface</div><div className="mt-1.5 flex flex-wrap gap-1">{affectedPlatforms.map((platform) => <span key={platform} className="rounded border border-border bg-white px-2 py-1 text-[9px] font-medium">{PLATFORM_LABEL[platform]}</span>)}</div></div>
              </ChainNode>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1.05fr] gap-4">
              <section className={cn('rounded-xl border p-4', selected.impact.blindKpis.length ? 'border-rose-200 bg-rose-50/60' : 'border-emerald-200 bg-emerald-50/60')}>
                <h3 className="flex items-center gap-2 text-xs font-semibold"><AlertTriangle className={cn('h-3.5 w-3.5', selected.impact.blindKpis.length ? 'text-rose-700' : 'text-emerald-700')} />Failure scenario</h3>
                {selected.impact.blindKpis.length ? <div className="mt-2 space-y-2 text-[11px] leading-5 text-slate-700"><p>Nếu signal chưa được implement hoặc bị mất, {selected.impact.blindKpis.length} KPI không còn đủ evidence giải thích biến động.</p><p><strong>{fmtNum(volumeForTimeFrame(selected.touchpoint.dailyUsers, selectedTimeFrameId))} KH</strong> đi qua vùng ảnh hưởng trong {timeFrame.label}; dashboard của {selected.impact.blindKpis.map((kpi) => kpi.owner).filter((owner, index, owners) => owners.indexOf(owner) === index).join(', ')} chịu tác động.</p></div> : <p className="mt-2 text-[11px] leading-5 text-emerald-800">Các event chính đã có tín hiệu. Rủi ro tập trung vào chất lượng schema, độ trễ và đối soát volume.</p>}
              </section>
              <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold"><Lightbulb className="h-3.5 w-3.5 text-primary" />Recommendation</h3>
                <p className="mt-2 text-[11px] leading-5 text-slate-700">{selected.coverage.score < 75 ? <>Xếp touchpoint vào <strong>{selected.impact.impactScore >= 60 ? 'P0/P1' : 'P2'}</strong>. Đóng {selected.coverage.gap + selected.coverage.designed} event chưa live, ưu tiên event nối với KPI critical và kiểm tra đủ platform.</> : <>Giữ coverage hiện tại. Thiết lập đối soát volume giữa {affectedPlatforms.map((platform) => PLATFORM_LABEL[platform]).join(', ')} và nguồn downstream; cảnh báo khi lệch quá 1%.</>}</p>
                <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-[9px] text-muted-foreground"><span>Accountable owner</span><strong className="text-foreground">{selected.touchpoint.owner}</strong></div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="min-w-[112px] border-r border-border px-4 py-2.5 last:border-r-0"><div className={cn('text-base font-bold tabular-nums', tone)}>{value}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}

function TopFact({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return <div><div className={cn('flex items-center justify-end gap-1 text-lg font-bold tabular-nums', tone)}>{icon}{value}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}

function ChainNode({ icon, step, title, tone, children }: { icon: React.ReactNode; step: string; title: string; tone?: string; children: React.ReactNode }) {
  return <section className={cn('min-w-0 rounded-xl border border-border bg-slate-50 p-3', tone)}><div className="mb-3 flex items-center justify-between"><h4 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{icon}{title}</h4><span className="text-[9px] font-bold text-muted-foreground">{step}</span></div>{children}</section>;
}

function ChainArrow() {
  return <div className="flex items-center justify-center" aria-hidden="true"><ArrowRight className="h-4 w-4 text-slate-400" /></div>;
}
