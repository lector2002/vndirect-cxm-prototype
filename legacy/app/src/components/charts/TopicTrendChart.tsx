import { useId } from 'react';
import type { MonthlyPoint } from '@/data/voice-of-customer';

// ---------- Chart lớn: 2 trục (line = positive %, bar = khối lượng phản hồi) ----------
export function TopicTrendChart({
  data,
  months = 6,
  showVolume = true,
  height = 260,
}: {
  data: MonthlyPoint[];
  months?: number;
  showVolume?: boolean;
  height?: number;
}) {
  const gradientId = useId();
  const slice = data.slice(-months);
  const W = 720;
  const H = height;
  const padL = 40;
  const padR = 14;
  const padT = 16;
  const padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const positives = slice.map((point) => point.positive);
  const volumes = slice.map((point) => point.volume);
  const lo = Math.max(0, Math.floor((Math.min(...positives) - 8) / 5) * 5);
  const hi = Math.min(100, Math.ceil((Math.max(...positives) + 8) / 5) * 5);
  const volMax = Math.max(...volumes, 1);
  const slotW = plotW / slice.length;

  const cx = (index: number) => padL + slotW * (index + 0.5);
  const py = (value: number) => padT + plotH - ((value - lo) / (hi - lo || 1)) * plotH;
  const barW = Math.min(slotW * 0.46, 26);

  const linePoints = slice.map((point, index) => `${cx(index)},${py(point.positive)}`).join(' ');
  const areaPoints = `${padL},${padT + plotH} ${linePoints} ${padL + plotW},${padT + plotH}`;
  const gridValues = [lo, Math.round((lo + hi) / 2), hi];
  const labelStep = slice.length > 8 ? 2 : 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Xu hướng theo tháng">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.16" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid + trục Y (positive %) */}
      {gridValues.map((value) => (
        <g key={value}>
          <line x1={padL} y1={py(value)} x2={padL + plotW} y2={py(value)} className="stroke-slate-100" strokeWidth={1} />
          <text x={padL - 6} y={py(value) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">{value}%</text>
        </g>
      ))}

      {/* Bars: khối lượng */}
      {showVolume && slice.map((point, index) => {
        const barH = (point.volume / volMax) * plotH;
        return <rect key={point.month} x={cx(index) - barW / 2} y={padT + plotH - barH} width={barW} height={barH} rx={2} className="fill-slate-200" />;
      })}

      {/* Area + line: positive % */}
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={linePoints} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {slice.map((point, index) => (
        <circle key={point.month} cx={cx(index)} cy={py(point.positive)} r={index === slice.length - 1 ? 3.5 : 2.5} className="fill-white stroke-primary" strokeWidth={1.5} />
      ))}

      {/* Nhãn giá trị tháng cuối */}
      <text x={cx(slice.length - 1)} y={py(slice[slice.length - 1].positive) - 8} textAnchor="end" className="fill-primary text-[10px] font-bold">
        {slice[slice.length - 1].positive}%
      </text>

      {/* Trục X: nhãn tháng */}
      {slice.map((point, index) => (
        (index % labelStep === 0 || index === slice.length - 1) ? (
          <text key={point.month} x={cx(index)} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[9px] tabular-nums">{point.month}</text>
        ) : null
      ))}
    </svg>
  );
}

// ---------- Sparkline nhỏ cho từng dòng topic ----------
export function MiniTrend({ data, months = 6, positive = true }: { data: MonthlyPoint[]; months?: number; positive?: boolean }) {
  const slice = data.slice(-months);
  const values = slice.map((point) => point.positive);
  const W = 84;
  const H = 26;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const x = (index: number) => (index / (slice.length - 1 || 1)) * (W - 2) + 1;
  const y = (value: number) => H - 3 - ((value - lo) / span) * (H - 6);
  const points = slice.map((point, index) => `${x(index)},${y(point.positive)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-6 w-[84px]" aria-hidden="true">
      <polyline points={points} fill="none" className={positive ? 'stroke-emerald-500' : 'stroke-rose-500'} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(slice.length - 1)} cy={y(values[values.length - 1])} r={2} className={positive ? 'fill-emerald-500' : 'fill-rose-500'} />
    </svg>
  );
}
