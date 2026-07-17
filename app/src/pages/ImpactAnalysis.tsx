import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Target, ArrowRight, Radio, EyeOff, Users, Banknote, Gauge, Lightbulb } from 'lucide-react';
import { allTouchpoints, coverageOf, fmtNum, impactOfTouchpoint } from '@/lib/cxm-utils';
import { ChannelChip, CoverageBar, KpiCategoryChip, StatusBadge, SectionTitle } from '@/components/cxm-shared';
import { KPI_CATEGORY_LABEL } from '@/types/cxm';
import { cn } from '@/lib/utils';
import { customerPhaseForPath } from '@/lib/journey-taxonomy';
import { useCXM } from '@/store/CXMContext';
import { customerPhaseIdForPath } from '@/lib/journey-taxonomy';

function toneOf(score: number) {
  return score >= 75 ? '#34d399' : score >= 40 ? '#fbbf24' : '#fb7185';
}

export default function ImpactAnalysis() {
  const { selectedCustomerPhaseId } = useCXM();
  const tps = useMemo(
    () =>
      allTouchpoints().filter((t) => selectedCustomerPhaseId === 'all' || customerPhaseIdForPath(t) === selectedCustomerPhaseId).map((t) => ({
        ...t,
        impact: impactOfTouchpoint(t.touchpoint),
        cov: coverageOf(t.touchpoint.events),
      })),
    [selectedCustomerPhaseId],
  );

  const sorted = useMemo(() => [...tps].sort((a, b) => b.impact.impactScore - a.impact.impactScore), [tps]);
  const [selectedId, setSelectedId] = useState('');
  const sel = tps.find((t) => t.touchpoint.id === selectedId) ?? sorted[0];

  const scatterData = tps.map((t) => ({
    x: t.touchpoint.dailyUsers,
    y: t.touchpoint.revenueImpact,
    z: Math.max(t.touchpoint.dailyUsers / 1200, 6),
    name: t.touchpoint.name,
    score: t.cov.score,
    id: t.touchpoint.id,
  }));

  if (!sel) return <div className="p-6 text-sm text-muted-foreground">Chưa có touchpoint cho phase đang chọn.</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Impact Analysis — blast radius của điểm chạm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Đánh giá mức độ ảnh hưởng của từng touchpoint tới KPI & doanh thu, và hậu quả khi instrumentation tại đó bị mù.
        </p>
      </div>

      {/* Scatter */}
      <div className="card-gradient rounded-xl border border-border p-5">
        <SectionTitle
          title="Bản đồ tác động: Reach × Revenue impact"
          desc="Kích thước bong bóng = lượt KH/ngày · màu = coverage score (xanh ≥75, vàng ≥40, đỏ <40) · trục X log-scale"
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="hsl(220 28% 16%)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                scale="log"
                domain={[300, 100000]}
                tickFormatter={(v: number) => fmtNum(v)}
                stroke="hsl(218 15% 45%)"
                tick={{ fontSize: 11 }}
                name="Reach/ngày"
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 11]}
                stroke="hsl(218 15% 45%)"
                tick={{ fontSize: 11 }}
                name="Revenue impact"
              />
              <ZAxis type="number" dataKey="z" range={[80, 700]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3', stroke: 'hsl(220 28% 30%)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof scatterData)[number];
                  return (
                    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-xl">
                      <div className="font-semibold text-foreground">{d.name}</div>
                      <div className="mt-1 text-muted-foreground">
                        Reach: {fmtNum(d.x)} KH/ngày · Revenue impact: {d.y}/10
                      </div>
                      <div style={{ color: toneOf(d.score) }}>Coverage: {d.score}%</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                onClick={(d) => {
                  const p = d as unknown as { id?: string };
                  if (p.id) setSelectedId(p.id);
                }}
              >
                {scatterData.map((d) => (
                  <Cell
                    key={d.id}
                    fill={toneOf(d.score)}
                    fillOpacity={d.id === sel.touchpoint.id ? 1 : 0.55}
                    stroke={d.id === sel.touchpoint.id ? '#fff' : 'transparent'}
                    strokeWidth={d.id === sel.touchpoint.id ? 2 : 0}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Ranking list */}
        <div className="card-gradient rounded-xl border border-border p-4">
          <SectionTitle title="Xếp hạng blast radius" desc="Click để phân tích" />
          <div className="max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
            {sorted.map((t, i) => (
              <button
                key={t.touchpoint.id}
                onClick={() => setSelectedId(t.touchpoint.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                  t.touchpoint.id === sel.touchpoint.id
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-transparent hover:border-border hover:bg-secondary/50',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    i < 3 ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">{t.touchpoint.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {fmtNum(t.touchpoint.dailyUsers)} KH/ngày · {customerPhaseForPath(t).name}
                  </div>
                </div>
                <span
                  className="shrink-0 text-sm font-bold tabular-nums"
                  style={{ color: toneOf(100 - t.impact.impactScore < 25 ? 30 : t.cov.score) }}
                >
                  {t.impact.impactScore}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail chain */}
        <div className="space-y-5 xl:col-span-2">
          {/* Touchpoint summary */}
          <div className="card-gradient rounded-xl border border-primary/30 p-5 shadow-[0_0_40px_-12px_hsla(45,100%,51%,0.3)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">{sel.touchpoint.name}</h2>
                  <ChannelChip channel={sel.touchpoint.channel} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {customerPhaseForPath(sel).name} ▸ {sel.flow.name} ▸ {sel.stage.name}
                </p>
              </div>
              <div className="flex gap-5 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{sel.impact.impactScore}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Impact score</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xl font-bold text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {fmtNum(sel.touchpoint.dailyUsers)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">KH/ngày</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xl font-bold text-foreground">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    {sel.touchpoint.revenueImpact}/10
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue impact</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chain: events -> kpis */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card-gradient rounded-xl border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" />
                Events ({sel.touchpoint.events.length})
              </h3>
              <div className="space-y-2">
                {sel.touchpoint.events.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[11px] font-medium text-foreground">{ev.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {ev.volumePerDay > 0 ? `${fmtNum(ev.volumePerDay)}/ngày` : 'chưa có dữ liệu'}
                      </div>
                    </div>
                    <StatusBadge status={ev.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>

            <div className="card-gradient rounded-xl border border-border p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                KPI downstream ({sel.impact.downstreamKpis.length})
              </h3>
              <div className="space-y-2">
                {sel.impact.downstreamKpis.map((k) => {
                  const blind = sel.impact.blindKpis.some((b) => b.id === k.id);
                  return (
                    <div
                      key={k.id}
                      className={cn(
                        'rounded-lg border p-2.5',
                        blind ? 'border-rose-500/40 bg-rose-500/5' : 'border-border bg-background/50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{k.name}</span>
                        <KpiCategoryChip category={k.category} label={KPI_CATEGORY_LABEL[k.category]} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>
                          Hiện tại: <b className="text-foreground">{k.value}</b> · Mục tiêu {k.target}
                        </span>
                        {blind && (
                          <span className="flex items-center gap-1 font-medium text-rose-300">
                            <EyeOff className="h-3 w-3" /> Mất tín hiệu
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blind scenario + recommendation */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-200">
                <EyeOff className="h-3.5 w-3.5" />
                Kịch bản mất dữ liệu tại touchpoint này
              </h3>
              {sel.impact.blindKpis.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-rose-100/90">
                  {sel.impact.blindKpis.map((k) => (
                    <li key={k.id} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      <span>
                        <b>{k.name}</b> mất một phần nguồn tín hiệu — dashboard {k.owner} không giải thích được biến động.
                      </span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                    <span>
                      {fmtNum(sel.touchpoint.dailyUsers)} KH/ngày đi qua điểm mù — mọi quyết định tối ưu tại đây đều là "đoán mò".
                    </span>
                  </li>
                </ul>
              ) : (
                <p className="text-xs text-emerald-200">
                  Touchpoint này đã được instrument đầy đủ — mọi KPI downstream đều có tín hiệu live.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Lightbulb className="h-3.5 w-3.5" />
                Khuyến nghị
              </h3>
              <div className="space-y-2 text-xs text-foreground/90">
                <CoverageBar stats={sel.cov} height="h-2" />
                <p>
                  {sel.cov.score >= 75 ? (
                    <>
                      Coverage tốt ({sel.cov.score}%). Ưu tiên <b>governance</b>: đối soát volume định kỳ giữa client-tracking và hệ thống lõi,
                      đảm bảo độ lệch {'<'} 1%.
                    </>
                  ) : (
                    <>
                      Coverage {sel.cov.score}% với revenue impact {sel.touchpoint.revenueImpact}/10 — thuộc nhóm{' '}
                      <b>{sel.impact.impactScore >= 60 ? 'ưu tiên P0/P1' : 'theo dõi'}</b>. Đóng {sel.cov.gap + sel.cov.designed} gap còn lại qua PO Board
                      để bảo vệ {sel.impact.blindKpis.length || 'các'} KPI downstream.
                    </>
                  )}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  Owner hiện tại: {sel.touchpoint.owner} · cập nhật lần cuối: hôm nay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
