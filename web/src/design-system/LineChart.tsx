import type { QuantifySeriesPoint } from "../data/schema/index.ts";

/* Màu theo thứ tự series — port 1-1 từ mảng `colors` trong lineChart() (prototype dòng 1590):
   tối đa 2 màu (đủ cho cohort 2 nhóm), series thứ 3 trở đi rơi về fallback ink3. */
const COLORS = ["var(--crit)", "var(--ink3)"];
const W = 560;
const H = 130;
const PAD = 6;

export type LineChartProps = {
  series: QuantifySeriesPoint[];
};

/* Chart đường dùng cho trend + cohort — port 1-1 từ lineChart() (prototype dòng 1589-1618). Hình
   học SVG (W/H/pad, công thức toạ độ điểm, 4 gridline, r=3.5 cho dot) giữ nguyên; đây là viết lại
   bằng JSX, không phải thiết kế lại. */
export function LineChart({ series }: LineChartProps) {
  const all = series.flatMap((s) => s.p);
  const mx = Math.max(...all);
  const mn = Math.min(...all);
  const span = mx - mn || 1;

  return (
    <div data-testid="line-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px]" role="img">
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1={0}
            y1={PAD + (i * (H - 2 * PAD)) / 3}
            x2={W}
            y2={PAD + (i * (H - 2 * PAD)) / 3}
            stroke="var(--line)"
            strokeWidth={1}
          />
        ))}
        {series.map((s, si) => {
          const color = COLORS[si] ?? "var(--ink3)";
          const pts = s.p.map((v, i) => ({
            x: (i / (s.p.length - 1)) * (W - 10) + 5,
            y: H - PAD - ((v - mn) / span) * (H - 2 * PAD),
          }));
          return (
            <g key={s.l}>
              <polyline
                points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3.5} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 flex-wrap">
        {series.map((s, si) => (
          <span key={s.l} className="text-[12.5px] flex items-center gap-1.5">
            <i className="w-3.5 h-[3px] inline-block" style={{ background: COLORS[si] ?? "var(--ink3)" }} />
            {s.l} · cuối kỳ <b className="tabular-nums">{s.p[s.p.length - 1]}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
