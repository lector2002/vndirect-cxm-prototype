import { Link } from 'react-router';
import {
  Activity,
  Compass,
  Gauge,
  AlertTriangle,
  ArrowRight,
  MousePointerClick,
  Zap,
  EyeOff,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  allEventPaths,
  allTouchpoints,
  blindKpiList,
  fmtNum,
  northStarKpis,
  totalCoverage, coverageOf,
} from '@/lib/cxm-utils';
import { CUSTOMER_PHASES, customerPhaseCoverage, customerPhasePaths, customerPhaseIdForPath } from '@/lib/journey-taxonomy';
import { CoverageBar, SectionTitle, StatCard, TrendChip, KpiCategoryChip } from '@/components/cxm-shared';
import { KPI_CATEGORY_LABEL, PLATFORM_LABEL, type Platform } from '@/types/cxm';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';

// Funnel mô phỏng từ event volume thật trong dataset
const FUNNEL = [
  { label: 'Reach / quan tâm', value: 21400, phase: '01' },
  { label: 'Lead / tạo account', value: 2880, phase: '02' },
  { label: 'Onboarding / TK được duyệt', value: 1760, phase: '03' },
  { label: 'Be In / nạp tiền đầu', value: 1480, phase: '04' },
  { label: 'Be In / lệnh đầu khớp', value: 1180, phase: '04' },
  { label: 'Engage / active 30 ngày', value: 820, phase: '05' },
  { label: 'Engage / dùng ≥2 sản phẩm', value: 310, phase: '05' },
];

export default function Overview() {
  const cov = totalCoverage();
  const { selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const timeFrame = timeFrameById(selectedTimeFrameId);
  const paths = allEventPaths().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId);
  const tps = allTouchpoints().filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId);
  const events = paths;
  const blind = blindKpiList().map((item) => ({ ...item, paths: item.paths.filter((path) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(path) === selectedCustomerPhaseId) })).filter((item) => item.paths.length > 0 && !item.paths.some((path) => path.event.status === 'live' || path.event.status === 'validating'));
  const platformCov = (Object.keys(PLATFORM_LABEL) as Platform[]).reduce((result, platform) => {
    result[platform] = coverageOf(paths.filter((path) => path.event.platforms.includes(platform)).map((path) => path.event));
    return result;
  }, {} as Record<Platform, ReturnType<typeof coverageOf>>);

  const filteredCov = selectedCustomerPhaseId === 'all' ? cov : coverageOf(paths.map((path) => path.event));
  const donut = [
    { name: 'Đang đo', value: filteredCov.live, color: '#34d399' },
    { name: 'Đang validate', value: filteredCov.validating, color: '#38bdf8' },
    { name: 'Đã thiết kế', value: filteredCov.designed, color: '#fbbf24' },
    { name: 'Chưa đo', value: filteredCov.gap, color: '#fb7185' },
  ];
  const dailyVolume = events.reduce((s, p) => s + p.event.volumePerDay, 0);
  const periodVolume = volumeForTimeFrame(dailyVolume, selectedTimeFrameId);
  const maxFunnel = FUNNEL[0].value;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Tổng quan hôm nay</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Sức khỏe hành trình khách hàng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Giai đoạn ▸ Flow ▸ Stage ▸ Touchpoint ▸ Event ▸ KPI · Mô hình instrumentation cho toàn bộ hành trình nhà đầu tư
          </p>
        </div>
        <Link
          to="/coverage"
          className="flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
            Xem {filteredCov.gap + filteredCov.designed} gap cần đóng
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={<Gauge className="h-4 w-4" />}
          label="Instrumentation coverage"
           value={`${filteredCov.score}%`}
          accent
          sub={
            <span>
               {filteredCov.live} live · {filteredCov.validating} validating · {filteredCov.designed} thiết kế · {filteredCov.gap} gap
            </span>
          }
        />
        <StatCard
          icon={<Compass className="h-4 w-4" />}
          label="Điểm chạm được quản trị"
          value={`${tps.length}`}
          sub={`5 phase CX · ${tps.length} touchpoint · ${events.length} events`}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label={`Event volume · ${timeFrame.label}`}
          value={fmtNum(periodVolume)}
          sub={`${filteredCov.live} event đang stream · ${timeFrame.snapshot ? 'Demo snapshot' : 'Realtime'}`}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="KPI đang mù tín hiệu"
          value={`${blind.length}`}
          sub={
            <Link to="/impact" className="text-primary hover:underline">
              Phân tích blast radius →
            </Link>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Funnel */}
        <div className="card-gradient rounded-2xl border border-border p-5 xl:col-span-2">
          <SectionTitle
            title="Phễu hành trình nhà đầu tư"
             desc={`Chuyển đổi end-to-end · ${timeFrame.label}${timeFrame.snapshot ? ' (Demo snapshot)' : ''}`}
            right={
              <span className="rounded-md bg-secondary px-2 py-1 text-[10px] text-muted-foreground">realtime</span>
            }
          />
          <div className="space-y-2.5">
             {FUNNEL.filter((f) => selectedCustomerPhaseId === 'all' || f.phase === CUSTOMER_PHASES.find((phase) => phase.id === selectedCustomerPhaseId)?.code).map((f, i) => {
              const pct = (f.value / maxFunnel) * 100;
              const prevRate = i > 0 ? Math.round((f.value / FUNNEL[i - 1].value) * 100) : null;
              return (
                <div key={f.label} className="group">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-primary">{f.phase}</span>
                      {f.label}
                    </span>
                    <span className="flex items-center gap-3">
                      {prevRate !== null && (
                        <span className={cn('text-[10px]', prevRate >= 60 ? 'text-emerald-300' : prevRate >= 40 ? 'text-amber-300' : 'text-rose-300')}>
                          ▲ {prevRate}% từ bước trước
                        </span>
                      )}
                       <span className="font-semibold tabular-nums text-foreground">{fmtNum(volumeForTimeFrame(f.value, selectedTimeFrameId))}</span>
                    </span>
                  </div>
                  <div className="h-6 overflow-hidden rounded-md bg-muted/70">
                    <div
                      className="flex h-full items-center rounded-md bg-gradient-to-r from-primary/80 to-amber-500/80 px-2 transition-all group-hover:from-primary group-hover:to-amber-400"
                      style={{ width: `${Math.max(pct, 2.5)}%` }}
                    >
                      <span className="text-[10px] font-bold text-primary-foreground">{pct >= 1 ? pct.toFixed(1) : '<1'}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
            <Zap className="mr-1 inline h-3.5 w-3.5" />
            Nút thắt lớn nhất: <b>Lead → Onboarding (61%)</b> và <b>Active 30d → Cross-sell (38%)</b>.
            Impact analysis gợi ý 3 touchpoint có blast radius cao nhất tại 2 nút này.
          </div>
        </div>

        {/* Donut + platform */}
        <div className="space-y-6">
          <div className="card-gradient rounded-2xl border border-border p-5">
            <SectionTitle title="Trạng thái instrument" desc={`${events.length} events trong taxonomy`} />
            <div className="flex items-center gap-4">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" innerRadius={44} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                      {donut.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {donut.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card-gradient rounded-2xl border border-border p-5">
            <SectionTitle title="Coverage theo nền tảng" desc="Event có ít nhất 1 platform live" />
            <div className="space-y-3">
              {(Object.keys(platformCov) as Platform[]).map((pl) => (
                <div key={pl} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground">{PLATFORM_LABEL[pl]}</span>
                  <CoverageBar stats={platformCov[pl]} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Coverage by phase */}
        <div className="card-gradient rounded-2xl border border-border p-5 xl:col-span-2">
          <SectionTitle
            title="Coverage theo giai đoạn hành trình"
            desc="Tỷ trọng event theo trạng thái · click để mở cây hành trình"
          />
          <div className="space-y-3">
             {CUSTOMER_PHASES.filter((ph) => selectedCustomerPhaseId === 'all' || ph.id === selectedCustomerPhaseId).map((ph) => {
               const c = customerPhaseCoverage(ph.id);
              return (
                <Link
                  key={ph.id}
                  to="/journey"
                  className="flex items-center gap-4 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary/40"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{ background: `${ph.color}22`, color: ph.color }}
                  >
                    {ph.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-xs font-medium text-foreground">{ph.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {c.gap > 0 && <span className="mr-2 text-rose-300">{c.gap} gap</span>}
                         {customerPhasePaths(ph.id).length} events
                      </span>
                    </div>
                    <CoverageBar stats={c} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* North-star KPIs + blind */}
        <div className="space-y-6">
          <div className="card-gradient rounded-2xl border border-border p-5">
            <SectionTitle title="North-star KPI" desc="Theo từng giai đoạn" />
            <div className="space-y-3">
              {northStarKpis.slice(0, 5).map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">{k.name}</div>
                    <div className="text-[10px] text-muted-foreground">Mục tiêu: {k.target}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tabular-nums text-foreground">{k.value}</div>
                    <TrendChip trend={k.trend} value={k.trendValue} good={k.trendGood} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
            <SectionTitle
              title="Blind spots — KPI mất tín hiệu"
              desc="KPI chỉ được cấu thành bởi event chưa instrument"
            />
            <div className="space-y-2.5">
              {blind.map(({ kpi, paths }) => (
                <div key={kpi.id} className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/20 bg-background/60 p-2.5">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                    <div>
                      <div className="text-xs font-medium text-foreground">{kpi.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {paths.length} event chưa đo · owner: {kpi.owner}
                      </div>
                    </div>
                  </div>
                  <KpiCategoryChip category={kpi.category} label={KPI_CATEGORY_LABEL[kpi.category]} />
                </div>
              ))}
            </div>
            <Link
              to="/board"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-rose-500/15 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
            >
              <MousePointerClick className="h-3.5 w-3.5" />
              Đã có {blind.length} task tương ứng trên PO Board →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
