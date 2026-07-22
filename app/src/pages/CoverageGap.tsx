import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Grid3X3, PlusCircle, CheckCircle2, AlertOctagon, Layers, ListFilter } from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { allEventPaths, allTouchpoints, coverageOf, fmtNum } from '@/lib/cxm-utils';
import { ChannelChip, CoverageBar, SectionTitle, StatCard, StatusBadge } from '@/components/cxm-shared';
import { useCXM } from '@/store/CXMContext';
import { PLATFORM_LABEL, type Platform } from '@/types/cxm';
import { cn } from '@/lib/utils';
import { CUSTOMER_PHASES, customerPhaseForPath, customerPhaseIdForPath, customerPhasePaths } from '@/lib/journey-taxonomy';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';

const PLATFORMS: Platform[] = ['ios', 'android', 'web', 'server', 'crm'];

export default function CoverageGap() {
  const { addTaskFromGap, tasks, selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const timeFrame = timeFrameById(selectedTimeFrameId);
  const visiblePaths = allEventPaths().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId);
  const cov = coverageOf(visiblePaths.map((path) => path.event));
  const tps = allTouchpoints().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId);
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const gaps = useMemo(
    () =>
      allEventPaths().filter(
        (p) =>
          (p.event.status === 'gap' || p.event.status === 'designed') &&
          (phaseFilter === 'all' || customerPhaseIdForPath(p) === phaseFilter) &&
          (selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(p) === selectedCustomerPhaseId),
      ),
    [phaseFilter, selectedCustomerPhaseId],
  );

  const existingTaskEventIds = useMemo(() => new Set(tasks.map((t) => t.eventId).filter(Boolean)), [tasks]);

  const cellStats = (touchpointEventsPlatforms: Platform[][], pl: Platform) => {
    // không có event nào dự kiến cho platform này
    const planned = touchpointEventsPlatforms.filter((ps) => ps.includes(pl));
    if (planned.length === 0) return null;
    return planned;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Ưu tiên dữ liệu</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Tìm điểm dữ liệu còn thiếu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xác định điểm mù dữ liệu theo touchpoint × platform, và đẩy thẳng vào PO Board để đóng gap.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={<Grid3X3 className="h-4 w-4" />} label="Coverage tổng" value={`${cov.score}%`} accent sub={`${cov.live + cov.validating}/${cov.total} events có tín hiệu`} />
        <StatCard icon={<AlertOctagon className="h-4 w-4" />} label="Gap (chưa đo)" value={`${cov.gap}`} sub="Event cần instrument ngay" />
        <StatCard icon={<Layers className="h-4 w-4" />} label="Đã thiết kế spec" value={`${cov.designed}`} sub="Chờ dev implement" />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Touchpoint đủ coverage"
          value={`${tps.filter((t) => coverageOf(t.touchpoint.events).score >= 75).length}/${tps.length}`}
          sub="Touchpoint ≥75% event live"
        />
      </div>

      {/* ===== Heatmap matrix ===== */}
      <div className="card-gradient rounded-2xl border border-border p-5">
        <SectionTitle
          title="Điểm nào đang thiếu dữ liệu?"
          desc="Màu ô = % event đang đo (live + ½ validating) trên platform đó · ô xám = không có event dự kiến"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Touchpoint
                </th>
                {PLATFORMS.map((pl) => (
                  <th key={pl} className="w-24 px-2 py-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {PLATFORM_LABEL[pl]}
                  </th>
                ))}
                <th className="w-40 px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tổng hợp
                </th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMER_PHASES.filter((ph) => selectedCustomerPhaseId === 'all' || ph.id === selectedCustomerPhaseId).map((ph) => (
                <Fragment key={ph.id}>
                  <tr>
                    <td colSpan={7} className="px-2 pb-0 pt-3">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                        style={{ background: `${ph.color}22`, color: ph.color }}
                      >
                        {ph.code} · {ph.name}
                      </span>
                    </td>
                  </tr>
                  {customerPhasePaths(ph.id).filter((path, index, paths) => paths.findIndex((item) => item.touchpoint.id === path.touchpoint.id) === index).map(({ stage: st, touchpoint: tp }) => {
                        const tc = coverageOf(tp.events);
                        return (
                          <tr key={tp.id}>
                            <td className="sticky left-0 rounded-md bg-card px-3 py-2">
                              <div className="font-medium text-foreground">{tp.name}</div>
                              <div className="text-[10px] text-muted-foreground">{st.name}</div>
                            </td>
                            {PLATFORMS.map((pl) => {
                              const planned = cellStats(tp.events.map((e) => e.platforms), pl);
                              if (!planned)
                                return (
                                  <td key={pl} className="rounded-md bg-muted/30 px-2 py-2 text-center text-muted-foreground/40">
                                    —
                                  </td>
                                );
                              const evs = tp.events.filter((e) => e.platforms.includes(pl));
                              const c = coverageOf(evs);
                              const tone =
                                c.score >= 75
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : c.score >= 40
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-rose-500/20 text-rose-300';
                              return (
                                <td key={pl} className={cn('rounded-md px-2 py-2 text-center font-semibold tabular-nums', tone)} title={`${c.live} live · ${c.validating} validating · ${c.designed} thiết kế · ${c.gap} gap`}>
                                  {c.score}%
                                </td>
                              );
                            })}
                            <td className="rounded-md bg-card px-3 py-2">
                              <CoverageBar stats={tc} height="h-1.5" />
                            </td>
                          </tr>
                        );
                      })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Gap list ===== */}
      <div className="card-gradient rounded-2xl border border-border p-5">
        <SectionTitle
          title={`Việc cần làm để khép điểm mù (${gaps.length})`}
          desc="Event ở trạng thái 'chưa đo' hoặc 'đã thiết kế' — đẩy vào PO Board để lên kế hoạch"
          right={
            <div className="flex items-center gap-2">
              <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
                className="rounded-lg border border-input bg-muted/60 px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">Tất cả giai đoạn</option>
                {CUSTOMER_PHASES.filter((p) => selectedCustomerPhaseId === 'all' || p.id === selectedCustomerPhaseId).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        <div className="space-y-2">
          {gaps.map(({ phase, flow, stage, touchpoint, event }) => {
            const already = existingTaskEventIds.has(event.id) || addedIds.has(event.id);
            return (
              <div
                key={event.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/60 p-3"
              >
                <StatusBadge status={event.status} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">{event.name}</span>
                    <ChannelChip channel={touchpoint.channel} />
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {customerPhaseForPath({ phase, touchpoint }).name} ▸ {flow.name} ▸ {stage.name} ▸ <span className="text-foreground/80">{touchpoint.name}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{event.description}</div>
                </div>
                <div className="hidden w-52 shrink-0 md:block">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">KPI bị ảnh hưởng</div>
                  <div className="flex flex-wrap gap-1">
                    {event.kpiIds.map((kid) => {
                      const k = kpiById(kid);
                      return k ? (
                        <span key={kid} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-200">
                          {k.name.length > 24 ? k.name.slice(0, 24) + '…' : k.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
                  <div>Owner</div>
                  <div className="font-medium text-foreground/80">{event.owner}</div>
                </div>
                <button
                  disabled={already}
                  onClick={() => {
                    addTaskFromGap({
                      title: `Instrument event ${event.name}`,
                      phaseId: phase.id,
                      touchpointId: touchpoint.id,
                      eventId: event.id,
                      kpiIds: event.kpiIds,
                      reach: touchpoint.dailyUsers * 7,
                      squad: event.owner,
                    });
                    setAddedIds((s) => new Set(s).add(event.id));
                  }}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-colors',
                    already
                      ? 'cursor-default bg-emerald-500/10 text-emerald-300'
                      : 'bg-primary text-primary-foreground hover:brightness-110',
                  )}
                >
                  {already ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Trên board
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-3.5 w-3.5" /> Đẩy vào PO Board
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {addedIds.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-200">
            <span>Đã thêm {addedIds.size} task vào cột Backlog của PO Board.</span>
            <button onClick={() => navigate('/board')} className="font-semibold text-primary hover:underline">
              Mở PO Board →
            </button>
          </div>
        )}
        <div className="mt-4 text-[11px] text-muted-foreground">
          Hiển thị {fmtNum(volumeForTimeFrame(gaps.reduce((s, g) => s + g.touchpoint.dailyUsers, 0), selectedTimeFrameId))} lượt KH đi qua các điểm mù trong {timeFrame.label}{timeFrame.snapshot ? ' (Demo snapshot)' : ''}.
        </div>
      </div>
    </div>
  );
}
