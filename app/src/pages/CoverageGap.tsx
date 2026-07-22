import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardPlus,
  DatabaseZap,
  Filter,
  Layers3,
} from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { CoverageBar, PlatformChips, StatusBadge } from '@/components/cxm-shared';
import { allEventPaths, allTouchpoints, coverageOf, fmtNum } from '@/lib/cxm-utils';
import { CUSTOMER_PHASES, customerPhaseForPath, customerPhaseIdForPath } from '@/lib/journey-taxonomy';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { PLATFORM_LABEL, type Platform } from '@/types/cxm';

const PLATFORMS: Platform[] = ['ios', 'android', 'web', 'server', 'crm'];

export default function CoverageGap() {
  const { addTaskFromGap, tasks, selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const timeFrame = timeFrameById(selectedTimeFrameId);

  const scopedPaths = useMemo(
    () => allEventPaths().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId),
    [selectedCustomerPhaseId],
  );
  const scopedTouchpoints = useMemo(
    () => allTouchpoints().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId),
    [selectedCustomerPhaseId],
  );
  const coverage = coverageOf(scopedPaths.map((path) => path.event));
  const existingTaskEventIds = useMemo(() => new Set(tasks.map((task) => task.eventId).filter(Boolean)), [tasks]);
  const gaps = useMemo(
    () =>
      scopedPaths
        .filter((path) => (path.event.status === 'gap' || path.event.status === 'designed') && (phaseFilter === 'all' || customerPhaseIdForPath(path) === phaseFilter))
        .sort((a, b) => {
          if (a.event.status !== b.event.status) return a.event.status === 'gap' ? -1 : 1;
          return b.touchpoint.dailyUsers - a.touchpoint.dailyUsers;
        }),
    [phaseFilter, scopedPaths],
  );
  const selected = gaps.find((path) => path.event.id === selectedId) ?? gaps[0];
  const exposedVolume = volumeForTimeFrame(gaps.reduce((sum, path) => sum + path.touchpoint.dailyUsers, 0), selectedTimeFrameId);
  const completeTouchpoints = scopedTouchpoints.filter((path) => coverageOf(path.touchpoint.events).score >= 75).length;

  const phaseReport = CUSTOMER_PHASES.filter((phase) => selectedCustomerPhaseId === 'all' || phase.id === selectedCustomerPhaseId).map((phase) => ({
    phase,
    stats: coverageOf(scopedPaths.filter((path) => customerPhaseIdForPath(path) === phase.id).map((path) => path.event)),
  }));
  const platformReport = PLATFORMS.map((platform) => ({
    platform,
    stats: coverageOf(scopedPaths.filter((path) => path.event.platforms.includes(platform)).map((path) => path.event)),
  }));

  function addSelectedGap() {
    if (!selected) return;
    addTaskFromGap({
      title: `Instrument event ${selected.event.name}`,
      phaseId: selected.phase.id,
      touchpointId: selected.touchpoint.id,
      eventId: selected.event.id,
      kpiIds: selected.event.kpiIds,
      reach: selected.touchpoint.dailyUsers * 7,
      squad: selected.event.owner,
    });
    setAddedIds((current) => new Set(current).add(selected.event.id));
  }

  return (
    <div className="flex h-full min-h-[760px] min-w-[1060px] flex-col overflow-hidden bg-slate-50/40 p-5">
      <header className="mb-4 flex shrink-0 items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">
            <DatabaseZap className="h-3.5 w-3.5" /> Coverage exceptions
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Điểm mù dữ liệu cần xử lý</h1>
          <p className="mt-1 text-xs text-muted-foreground">Bắt đầu từ exception, kiểm tra evidence rồi chuyển đúng gap sang PO Board.</p>
        </div>
        <div className="flex overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <SummaryMetric label="Coverage" value={`${coverage.score}%`} accent="text-emerald-700" />
          <SummaryMetric label="Chưa đo" value={String(coverage.gap)} accent="text-rose-700" />
          <SummaryMetric label="Chờ implement" value={String(coverage.designed)} accent="text-amber-700" />
          <SummaryMetric label="Touchpoint đạt chuẩn" value={`${completeTouchpoints}/${scopedTouchpoints.length}`} />
        </div>
      </header>

      <section aria-label="Báo cáo coverage theo phase và platform" className="mb-4 grid shrink-0 grid-cols-[1.2fr_.8fr] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
        <CoverageReport title="Theo phase" subtitle="Ưu tiên phase có gap tuyệt đối cao" rows={phaseReport.map(({ phase, stats }) => ({ id: phase.id, label: `${phase.code} · ${phase.name}`, color: phase.color, stats }))} />
        <CoverageReport title="Theo platform" subtitle="Không phải heatmap; chỉ hiển thị mức tổng hợp" rows={platformReport.map(({ platform, stats }) => ({ id: platform, label: PLATFORM_LABEL[platform], stats }))} bordered />
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-[390px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <aside aria-label="Danh sách gap" className="flex min-h-0 flex-col border-r border-border bg-slate-50/70">
          <div className="border-b border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Master list gap</h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Xếp gap thật trước, sau đó theo lượng khách phơi nhiễm.</p>
              </div>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{gaps.length} exception</span>
            </div>
            <label className="mt-3 flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span className="sr-only">Lọc theo phase</span>
              <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border border-input bg-white px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/20">
                <option value="all">Tất cả phase</option>
                {CUSTOMER_PHASES.filter((phase) => selectedCustomerPhaseId === 'all' || phase.id === selectedCustomerPhaseId).map((phase) => <option key={phase.id} value={phase.id}>{phase.code} · {phase.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-[1fr_62px_54px] gap-2 border-b border-border px-4 py-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Exception / touchpoint</span><span className="text-right">KH</span><span className="text-right">KPI</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {gaps.map((path) => {
              const active = path.event.id === selected?.event.id;
              return <button key={path.event.id} type="button" onClick={() => setSelectedId(path.event.id)} aria-pressed={active} className={cn('grid w-full grid-cols-[1fr_62px_54px] gap-2 border-b border-border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active ? 'bg-primary/5' : 'hover:bg-white')}>
                <span className="min-w-0"><span className="flex items-center gap-1.5"><span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', path.event.status === 'gap' ? 'bg-rose-500' : 'bg-amber-500')} /><code className="truncate text-[11px] font-semibold text-foreground">{path.event.name}</code></span><span className="mt-1 block truncate text-[9px] text-muted-foreground">{customerPhaseForPath(path).name} · {path.touchpoint.name}</span></span>
                <span className="self-center text-right text-[11px] font-semibold tabular-nums">{fmtNum(volumeForTimeFrame(path.touchpoint.dailyUsers, selectedTimeFrameId))}</span>
                <span className="self-center text-right text-[11px] font-semibold tabular-nums">{path.event.kpiIds.length}</span>
              </button>;
            })}
            {!gaps.length && <div className="m-4 rounded-lg border border-dashed border-border bg-white p-5 text-center text-xs text-muted-foreground">Không có gap trong phạm vi lọc.</div>}
          </div>
          <div className="border-t border-border bg-white px-4 py-2.5 text-[10px] text-muted-foreground">{fmtNum(exposedVolume)} lượt KH phơi nhiễm / {timeFrame.label}{timeFrame.snapshot ? ' · Demo snapshot' : ''}</div>
        </aside>

        {selected ? <main aria-label="Chi tiết gap đang chọn" className="min-h-0 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-5 border-b border-border pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><StatusBadge status={selected.event.status} size="xs" /><span className="text-[10px] text-muted-foreground">{customerPhaseForPath(selected).code} · {customerPhaseForPath(selected).name}</span></div>
              <h2 className="mt-2 break-all font-mono text-lg font-bold">{selected.event.name}</h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{selected.event.description}</p>
            </div>
            <div className="text-right"><div className="text-2xl font-bold tabular-nums text-rose-700">{fmtNum(volumeForTimeFrame(selected.touchpoint.dailyUsers, selectedTimeFrameId))}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">KH phơi nhiễm / {timeFrame.label}</div></div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-5">
            <DetailSection title="Evidence & phạm vi" icon={<Layers3 className="h-3.5 w-3.5" />}>
              <InfoRow label="Journey" value={`${selected.flow.name} / ${selected.stage.name}`} />
              <InfoRow label="Touchpoint" value={selected.touchpoint.name} />
              <InfoRow label="Platform" value={<PlatformChips platforms={selected.event.platforms} />} />
              <InfoRow label="Signal hiện có" value={selected.event.volumePerDay > 0 ? `${fmtNum(volumeForTimeFrame(selected.event.volumePerDay, selectedTimeFrameId))} / ${timeFrame.label}` : 'Không có volume quan sát'} warning={selected.event.volumePerDay === 0} />
              <InfoRow label="Last seen" value={selected.event.lastSeen ?? 'Chưa từng ghi nhận'} warning={!selected.event.lastSeen} />
            </DetailSection>
            <DetailSection title="Impact evidence" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
              <InfoRow label="Owner signal" value={selected.event.owner} />
              <InfoRow label="Owner touchpoint" value={selected.touchpoint.owner} />
              <InfoRow label="Revenue impact" value={`${selected.touchpoint.revenueImpact}/10`} />
              <div className="pt-1"><div className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">KPI mất hoặc thiếu tín hiệu</div><div className="space-y-2">{selected.event.kpiIds.map((id) => { const kpi = kpiById(id); return kpi ? <div key={id} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2"><span className="text-[11px] font-medium">{kpi.name}</span><span className="text-[9px] text-rose-700">{kpi.owner}</span></div> : null; })}</div></div>
            </DetailSection>
          </div>

          <section className="rounded-xl border border-primary/20 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-6">
              <div><h3 className="flex items-center gap-2 text-xs font-semibold"><ClipboardPlus className="h-3.5 w-3.5 text-primary" />Action đề xuất</h3><p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-muted-foreground">{selected.event.status === 'gap' ? 'Tạo tracking spec, thống nhất schema và instrument event trên các platform đã khai báo.' : 'Spec đã có. Đưa vào backlog implement, sau đó validate volume và field bắt buộc trước khi chuyển live.'}</p></div>
              <button type="button" disabled={existingTaskEventIds.has(selected.event.id) || addedIds.has(selected.event.id)} onClick={addSelectedGap} className={cn('inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', existingTaskEventIds.has(selected.event.id) || addedIds.has(selected.event.id) ? 'cursor-default bg-emerald-100 text-emerald-700' : 'bg-primary text-primary-foreground hover:brightness-105')}>
                {existingTaskEventIds.has(selected.event.id) || addedIds.has(selected.event.id) ? <><CheckCircle2 className="h-3.5 w-3.5" />Đã có trên board</> : <><ClipboardPlus className="h-3.5 w-3.5" />Đẩy vào PO Board</>}
              </button>
            </div>
          </section>
          {addedIds.size > 0 && <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[11px] text-emerald-800"><span>Đã thêm {addedIds.size} task vào Backlog.</span><button type="button" onClick={() => navigate('/board')} className="inline-flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Mở PO Board <ArrowUpRight className="h-3 w-3" /></button></div>}
        </main> : <div className="flex items-center justify-center text-sm text-muted-foreground">Chọn phạm vi khác để xem exception.</div>}
      </section>
    </div>
  );
}

function SummaryMetric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="min-w-[118px] border-r border-border px-4 py-2.5 last:border-r-0"><div className={cn('text-base font-bold tabular-nums', accent)}>{value}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}

function CoverageReport({ title, subtitle, rows, bordered }: { title: string; subtitle: string; rows: { id: string; label: string; color?: string; stats: ReturnType<typeof coverageOf> }[]; bordered?: boolean }) {
  return <div className={cn('p-4', bordered && 'border-l border-border')}><div className="mb-3 flex items-baseline justify-between gap-3"><h2 className="text-xs font-semibold">{title}</h2><p className="text-[9px] text-muted-foreground">{subtitle}</p></div><div className="grid grid-cols-1 gap-x-5 gap-y-2 xl:grid-cols-2">{rows.map(({ id, label, color, stats }) => <div key={id} className="grid grid-cols-[110px_1fr_46px] items-center gap-2"><span className="truncate text-[10px] font-medium" title={label}>{color && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />}{label}</span><CoverageBar stats={stats} height="h-1.5" showLabel={false} /><span className={cn('text-right text-[10px] font-semibold tabular-nums', stats.gap > 0 && 'text-rose-700')}>{stats.score}% <span className="font-normal text-muted-foreground">·{stats.gap}</span></span></div>)}</div></div>;
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-border p-4"><h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{icon}{title}</h3><div className="space-y-2.5">{children}</div></section>;
}

function InfoRow({ label, value, warning }: { label: string; value: React.ReactNode; warning?: boolean }) {
  return <div className="grid grid-cols-[112px_1fr] items-start gap-3 border-b border-border/70 pb-2.5 last:border-b-0 last:pb-0"><span className="text-[10px] text-muted-foreground">{label}</span><span className={cn('text-[11px] font-medium text-foreground', warning && 'text-rose-700')}>{value}</span></div>;
}
