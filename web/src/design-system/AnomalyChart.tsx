import type { QuantifySeriesPoint } from "../data/schema/index.ts";
import { isAnomaly, zScores } from "../domain/stats.ts";
import { nf } from "./format.ts";

/* Màu theo thứ tự series — port 1-1 từ mảng COL trong anomalyChart() (prototype dòng 2001). */
const COLORS = ["var(--crit)", "var(--ink3)"];
const W = 560;
const H = 150;
const PAD = 10;

export type AnomalyChartProps = {
  series: QuantifySeriesPoint[];
  /** Ngưỡng Z-score — PHẢI đọc từ cfg.anomaly.z của caller, không hardcode trong component này. */
  anomalyZ: number;
};

/* Chart bất thường (Z-score) — port 1-1 từ anomalyChart() (prototype dòng 1997-2018). Hình học SVG
   (W/H/pad, công thức toạ độ, vòng tròn kép r=7 rỗng + r=3.5 đặc khi bất thường, r=2.5 khi bình
   thường, 4 gridline) giữ nguyên. Z-score dùng domain/stats.ts (zScores/isAnomaly) đã có sẵn, không
   tính lại. */
export function AnomalyChart({ series, anomalyZ }: AnomalyChartProps) {
  const all = series.flatMap((s) => s.p);
  const mx = Math.max(...all);
  const mn = Math.min(0, ...all);
  const span = mx - mn || 1;

  return (
    <div data-testid="anomaly-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[170px]" role="img">
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
          const z = zScores(s.p);
          const xy = s.p.map((v, i) => ({
            x: (i / (s.p.length - 1)) * (W - 20) + 10,
            y: H - PAD - ((v - mn) / span) * (H - 2 * PAD),
          }));
          return (
            <g key={s.l}>
              <polyline
                points={xy.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {xy.map((p, i) => {
                const zi = z[i];
                if (zi !== null && isAnomaly(zi, anomalyZ)) {
                  const prevMean = Math.round(s.p.slice(0, i).reduce((a, b) => a + b, 0) / i);
                  const zLabel = zi.toFixed(2).replace(".", ",");
                  const threshLabel = String(anomalyZ).replace(".", ",");
                  return (
                    <g key={i} data-testid="anomaly-ring">
                      <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={7} fill="none" stroke={color} strokeWidth={2} />
                      <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3.5} fill={color} />
                      <title>
                        Bất thường · Z-score {zLabel} (ngưỡng {threshLabel}) — {s.l}: {nf(s.p[i])}, kỳ trước trung
                        bình {nf(prevMean)}
                      </title>
                    </g>
                  );
                }
                return (
                  <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={2.5} fill={color}>
                    <title>
                      {s.l}: {nf(s.p[i])}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 flex-wrap mt-[7px] text-xs text-ink-3">
        {series.map((s, si) => (
          <span key={s.l} className="inline-flex items-center">
            <i
              className="inline-block w-[9px] h-[9px] rounded-sm mr-[5px]"
              style={{ background: COLORS[si] ?? "var(--ink3)" }}
            />
            {s.l}
          </span>
        ))}
      </div>
    </div>
  );
}
