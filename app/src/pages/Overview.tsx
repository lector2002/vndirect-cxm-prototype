import { Link } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  EyeOff,
  Radio,
  Target,
} from 'lucide-react';
import {
  allEventPaths,
  allTouchpoints,
  blindKpiList,
  coverageOf,
  fmtNum,
  impactOfTouchpoint,
} from '@/lib/cxm-utils';
import {
  CUSTOMER_PHASES,
  customerPhaseCoverage,
  customerPhaseForLegacyId,
  customerPhaseIdForPath,
  customerPhasePaths,
} from '@/lib/journey-taxonomy';
import { CoverageBar, PriorityBadge } from '@/components/cxm-shared';
import { useCXM } from '@/store/CXMContext';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';

const TASK_STATUS = {
  backlog: 'Backlog',
  ready: 'Sẵn sàng',
  doing: 'Đang làm',
  validating: 'Đang validate',
  done: 'Hoàn tất',
} as const;

export default function Overview() {
  const { tasks, selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const timeFrame = timeFrameById(selectedTimeFrameId);
  const phaseInScope = (phaseId: string) => selectedCustomerPhaseId === 'all' || phaseId === selectedCustomerPhaseId;
  const paths = allEventPaths().filter((path) => phaseInScope(customerPhaseIdForPath(path)));
  const touchpoints = allTouchpoints().filter((path) => phaseInScope(customerPhaseIdForPath(path)));
  const coverage = coverageOf(paths.map((path) => path.event));
  const openGaps = coverage.designed + coverage.gap;
  const activeSignals = coverage.live + coverage.validating;
  const periodVolume = volumeForTimeFrame(
    paths.reduce((sum, path) => sum + path.event.volumePerDay, 0),
    selectedTimeFrameId,
  );
  const blindKpis = blindKpiList()
    .map((item) => ({
      ...item,
      paths: item.paths.filter((path) => phaseInScope(customerPhaseIdForPath(path))),
    }))
    .filter((item) => item.paths.length > 0);
  const phaseRows = CUSTOMER_PHASES.filter((phase) => phaseInScope(phase.id)).map((phase) => {
    const phasePaths = customerPhasePaths(phase.id);
    const phaseCoverage = customerPhaseCoverage(phase.id);
    const phaseBlindKpis = blindKpiList().filter((item) =>
      item.paths.some((path) => customerPhaseIdForPath(path) === phase.id),
    ).length;
    const phaseTasks = tasks.filter(
      (task) => customerPhaseForLegacyId(task.phaseId).id === phase.id && task.column !== 'done',
    );
    return { phase, paths: phasePaths, coverage: phaseCoverage, blindKpis: phaseBlindKpis, tasks: phaseTasks };
  });
  const weakestPhase = [...phaseRows].filter((row) => row.coverage.total > 0).sort((a, b) => a.coverage.score - b.coverage.score)[0];
  const impactCandidates = touchpoints
    .map((path) => ({ ...path, impact: impactOfTouchpoint(path.touchpoint) }))
    .filter((path) => path.impact.coverage.gap + path.impact.coverage.designed > 0)
    .sort((a, b) => b.impact.impactScore - a.impact.impactScore);
  const highestImpact = impactCandidates[0];
  const priorityExceptions = tasks
    .filter(
      (task) =>
        task.column !== 'done' &&
        (task.priority === 'P0' || task.priority === 'P1') &&
        phaseInScope(customerPhaseForLegacyId(task.phaseId).id),
    )
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'P0' ? -1 : 1;
      return b.impact - a.impact || b.reach - a.reach;
    });
  const exceptions = priorityExceptions.slice(0, 5);
  const scopeLabel =
    selectedCustomerPhaseId === 'all'
      ? 'Toàn bộ hành trình'
      : CUSTOMER_PHASES.find((phase) => phase.id === selectedCustomerPhaseId)?.name;
  const healthLabel = coverage.score >= 75 ? 'Đang kiểm soát' : coverage.score >= 55 ? 'Cần chú ý' : 'Cần quyết định';

  return (
    <div className="min-w-[1040px] space-y-7 p-6">
      <header className="flex items-start justify-between gap-8 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Executive reporting</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Bức tranh điều hành CXM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scopeLabel} · {timeFrame.label} · Demo snapshot
          </p>
        </div>
        <Link
          to="/board"
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mở kế hoạch triển khai
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>

      <section aria-labelledby="executive-summary" className="overflow-hidden rounded-2xl border border-primary/25 bg-white shadow-[0_18px_48px_-34px_hsla(221,83%,32%,0.45)]">
        <div className="grid grid-cols-[minmax(0,1fr)_190px_190px_190px]">
          <div className="border-r border-border p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {healthLabel}
              </span>
              <span className="text-xs text-muted-foreground">Kết luận điều hành</span>
            </div>
            <h2 id="executive-summary" className="mt-3 max-w-3xl text-xl font-bold leading-7 text-foreground">
              {openGaps > 0
                ? `${openGaps} event còn thiếu tín hiệu; rủi ro tập trung tại ${weakestPhase?.phase.name ?? 'phase đang chọn'}.`
                : 'Phạm vi đang chọn đã có tín hiệu đầy đủ để theo dõi.'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Coverage đạt {coverage.score}%. {blindKpis.length > 0 ? `${blindKpis.length} KPI vẫn chưa có nguồn đo tin cậy.` : 'Không còn KPI mất hoàn toàn tín hiệu.'}{' '}
              {highestImpact
                ? `${highestImpact.touchpoint.name} là điểm cần bảo vệ trước, với impact score ${highestImpact.impact.impactScore}/100.`
                : 'Duy trì đối soát chất lượng dữ liệu tại các touchpoint đang live.'}
            </p>
          </div>
          <SummaryMetric label="Coverage" value={`${coverage.score}%`} note={`${activeSignals}/${coverage.total} event có tín hiệu`} />
          <SummaryMetric label="Khoảng trống" value={String(openGaps)} note={`${coverage.gap} chưa đo · ${coverage.designed} đã thiết kế`} tone="risk" />
          <SummaryMetric label="Ưu tiên mở" value={String(priorityExceptions.length)} note="P0/P1 cần theo dõi" tone="warning" />
        </div>
      </section>

      <section aria-labelledby="report-pillars">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ba trụ cột báo cáo</p>
            <h2 id="report-pillars" className="mt-1 text-base font-bold text-foreground">Điều cần biết trước khi ra quyết định</h2>
          </div>
          <span className="text-xs text-muted-foreground">Tự động cập nhật theo filter global</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <ReportPillar
            icon={<EyeOff className="h-4 w-4" aria-hidden="true" />}
            eyebrow="Điểm gãy / thiếu sót"
            value={`${openGaps} event chưa hoàn chỉnh`}
            description={`${blindKpis.length} KPI mất tín hiệu; ${weakestPhase?.phase.name ?? 'phase đang chọn'} có coverage thấp nhất ở mức ${weakestPhase?.coverage.score ?? 0}%.`}
            detail={`${coverage.gap} chưa đo · ${coverage.designed} chờ triển khai`}
            to="/coverage"
            linkLabel="Xem khoảng trống dữ liệu"
            tone="risk"
          />
          <ReportPillar
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            eyebrow="Tác động thay đổi"
            value={highestImpact ? `${highestImpact.touchpoint.name}` : 'Không có điểm rủi ro mở'}
            description={
              highestImpact
                ? `${fmtNum(volumeForTimeFrame(highestImpact.touchpoint.dailyUsers, selectedTimeFrameId))} lượt KH trong ${timeFrame.label}; liên kết ${highestImpact.impact.downstreamKpis.length} KPI downstream.`
                : 'Các touchpoint trong phạm vi đã có coverage hoàn chỉnh.'
            }
            detail={highestImpact ? `Impact score ${highestImpact.impact.impactScore}/100 · Revenue ${highestImpact.touchpoint.revenueImpact}/10` : 'Tiếp tục kiểm soát chất lượng'}
            to="/impact"
            linkLabel="Phân tích blast radius"
          />
          <ReportPillar
            icon={<Database className="h-4 w-4" aria-hidden="true" />}
            eyebrow="Dữ liệu đang thu thập"
            value={`${fmtNum(periodVolume)} event`}
            description={`${activeSignals} event live/validating trên ${touchpoints.length} touchpoint trong phạm vi báo cáo.`}
            detail={`${coverage.live} live · ${coverage.validating} đang validate`}
            to="/journey"
            linkLabel="Kiểm tra nguồn dữ liệu"
            tone="positive"
          />
        </div>
      </section>

      <section aria-labelledby="phase-health" className="rounded-2xl border border-border bg-white">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="phase-health" className="text-sm font-bold text-foreground">Sức khỏe theo phase</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">So sánh coverage, tín hiệu thiếu và khối lượng công việc đang mở.</p>
          </div>
          <Link to="/journey" className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Xem hành trình
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3">Phase</th>
                <th scope="col" className="w-[280px] px-4 py-3">Coverage</th>
                <th scope="col" className="px-4 py-3 text-right">Có tín hiệu</th>
                <th scope="col" className="px-4 py-3 text-right">Chưa hoàn chỉnh</th>
                <th scope="col" className="px-4 py-3 text-right">KPI mù</th>
                <th scope="col" className="px-5 py-3 text-right">Việc đang mở</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {phaseRows.map(({ phase, paths: phasePaths, coverage: phaseCoverage, blindKpis: phaseBlind, tasks: phaseTasks }) => (
                <tr key={phase.id} className="transition-colors hover:bg-slate-50/80">
                  <th scope="row" className="px-5 py-3.5 font-medium">
                    <Link to="/journey" className="group flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold" style={{ backgroundColor: `${phase.color}1A`, color: phase.color }}>
                        {phase.code}
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-foreground group-hover:text-primary">{phase.name}</span>
                        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">{phase.subtitle} · {phasePaths.length} event</span>
                      </span>
                    </Link>
                  </th>
                  <td className="px-4 py-3.5"><CoverageBar stats={phaseCoverage} /></td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-emerald-700">{phaseCoverage.live + phaseCoverage.validating}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-amber-700">{phaseCoverage.designed + phaseCoverage.gap}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-rose-700">{phaseBlind}</td>
                  <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">{phaseTasks.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="priority-exceptions" className="rounded-2xl border border-border bg-white">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <h2 id="priority-exceptions" className="text-sm font-bold text-foreground">Priority exceptions</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">P0/P1 chưa hoàn tất, xếp theo priority và impact.</p>
          </div>
          <Link to="/board" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Xem tất cả trên PO Board <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        {exceptions.length > 0 ? (
          <div className="divide-y divide-border">
            {exceptions.map((task) => {
              const phase = customerPhaseForLegacyId(task.phaseId);
              return (
                <Link key={task.id} to="/board" className="grid min-h-[72px] grid-cols-[90px_minmax(0,1fr)_170px_120px_120px] items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
                  <div className="flex items-center gap-2"><PriorityBadge p={task.priority} /><span className="font-mono text-[10px] text-muted-foreground">{task.id}</span></div>
                  <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{task.title}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{phase.code} · {phase.name} · {task.squad}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tác động</p><p className="mt-1 text-xs font-semibold text-foreground">{fmtNum(task.reach)} KH/tuần · {task.impact}/10</p></div>
                  <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trạng thái</p><p className="mt-1 text-xs font-medium text-foreground">{TASK_STATUS[task.column]}</p></div>
                  <div className="text-right"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Owner</p><p className="mt-1 truncate text-xs font-medium text-foreground">{task.owner}</p></div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            Không có exception P0/P1 trong phạm vi đang chọn.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryMetric({ label, value, note, tone = 'default' }: { label: string; value: string; note: string; tone?: 'default' | 'risk' | 'warning' }) {
  const valueColor = tone === 'risk' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : 'text-primary';
  return (
    <div className="flex flex-col justify-center border-r border-border p-5 last:border-r-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{note}</p>
    </div>
  );
}

function ReportPillar({ icon, eyebrow, value, description, detail, to, linkLabel, tone = 'default' }: { icon: React.ReactNode; eyebrow: string; value: string; description: string; detail: string; to: string; linkLabel: string; tone?: 'default' | 'risk' | 'positive' }) {
  const iconTone = tone === 'risk' ? 'bg-rose-500/10 text-rose-700' : tone === 'positive' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-primary/10 text-primary';
  return (
    <article className="flex min-h-[220px] flex-col rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className={`rounded-lg p-2 ${iconTone}`}>{icon}</span>
        <BarChart3 className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-1 truncate text-base font-bold text-foreground" title={value}>{value}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
        <span className="text-[10px] font-medium text-muted-foreground"><Radio className="mr-1 inline h-3 w-3" aria-hidden="true" />{detail}</span>
        <Link to={to} className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {linkLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
