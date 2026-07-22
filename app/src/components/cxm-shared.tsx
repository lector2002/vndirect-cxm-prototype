import type { ReactNode } from 'react';
import {
  Bell,
  Building2,
  Cpu,
  Headphones,
  Mail,
  MessageSquare,
  Monitor,
  Smartphone,
  User,
  Globe,
  Server,
  Database,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import type { Channel, CoverageStats, InstrumentStatus, Platform } from '@/types/cxm';
import { CHANNEL_LABEL, PLATFORM_LABEL, STATUS_META } from '@/types/cxm';
import { cn } from '@/lib/utils';

// ---------- Status badge ----------
export function StatusBadge({ status, size = 'sm' }: { status: InstrumentStatus; size?: 'xs' | 'sm' }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        meta.bg,
        meta.color,
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
      )}
    >
      <span className={cn('rounded-full', meta.dot, size === 'xs' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {meta.label}
    </span>
  );
}

// ---------- Channel icon ----------
const CHANNEL_ICON: Record<Channel, typeof Smartphone> = {
  app: Smartphone,
  web: Monitor,
  hotline: Headphones,
  broker: User,
  email: Mail,
  sms: MessageSquare,
  zalo: MessageSquare,
  push: Bell,
  branch: Building2,
  backend: Server,
};

export function ChannelChip({ channel }: { channel: Channel }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-[11px] text-secondary-foreground">
      <Icon className="h-3 w-3 text-primary" />
      {CHANNEL_LABEL[channel]}
    </span>
  );
}

// ---------- Platform chips ----------
const PLATFORM_ICON: Record<Platform, typeof Globe> = {
  ios: Smartphone,
  android: Smartphone,
  web: Globe,
  server: Server,
  crm: Database,
};

export function PlatformChips({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {platforms.map((p) => {
        const Icon = PLATFORM_ICON[p];
        return (
          <span
            key={p}
            title={PLATFORM_LABEL[p]}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            <Icon className="h-2.5 w-2.5" />
            {PLATFORM_LABEL[p]}
          </span>
        );
      })}
    </span>
  );
}

// ---------- Coverage bar ----------
export function CoverageBar({ stats, height = 'h-2', showLabel = true }: { stats: CoverageStats; height?: string; showLabel?: boolean }) {
  const { total, live, validating, designed, gap } = stats;
  if (total === 0) return null;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex w-full overflow-hidden rounded-full bg-muted', height)}>
        <div className="bg-emerald-400" style={{ width: pct(live) }} title={`Đang đo: ${live}`} />
        <div className="bg-sky-400" style={{ width: pct(validating) }} title={`Validate: ${validating}`} />
        <div className="bg-amber-400" style={{ width: pct(designed) }} title={`Thiết kế: ${designed}`} />
        <div className="bg-rose-400" style={{ width: pct(gap) }} title={`Gap: ${gap}`} />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
          {stats.score}%
        </span>
      )}
    </div>
  );
}

// ---------- Stat card ----------
export function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'card-gradient rounded-2xl border p-4 transition-shadow hover:shadow-md',
        accent ? 'border-primary/35 shadow-[0_12px_30px_-18px_hsla(221,83%,32%,0.35)]' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('rounded-lg p-1.5', accent ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground')}>
          {icon}
        </span>
      </div>
      <div className={cn('mt-2 text-2xl font-bold tabular-nums', accent && 'text-primary text-glow')}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ---------- Trend chip ----------
export function TrendChip({ trend, value, good }: { trend: 'up' | 'down' | 'flat'; value: string; good: boolean }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        good ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700',
      )}
    >
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}

// ---------- KPI category chip ----------
const CAT_COLOR: Record<string, string> = {
  conversion: 'text-violet-700 bg-violet-500/10 border-violet-500/30',
  engagement: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/30',
  satisfaction: 'text-green-700 bg-green-500/10 border-green-500/30',
  revenue: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/30',
  risk: 'text-rose-700 bg-rose-500/10 border-rose-500/30',
  ops: 'text-slate-700 bg-slate-500/10 border-slate-500/30',
};

export function KpiCategoryChip({ category, label }: { category: string; label: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', CAT_COLOR[category])}>
      {label}
    </span>
  );
}

// ---------- Section title ----------
export function SectionTitle({ title, desc, right }: { title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

// ---------- misc ----------
export function PriorityBadge({ p }: { p: 'P0' | 'P1' | 'P2' | 'P3' }) {
  const map = {
    P0: 'bg-rose-500/15 text-rose-700 border-rose-500/40',
    P1: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
    P2: 'bg-sky-500/15 text-sky-700 border-sky-500/40',
    P3: 'bg-slate-500/15 text-slate-700 border-slate-500/40',
  } as const;
  return (
    <span className={cn('inline-flex rounded border px-1.5 py-0.5 text-[10px] font-bold', map[p])}>{p}</span>
  );
}

export const TASK_TYPE_META: Record<string, { label: string; cls: string }> = {
  'gap-closure': { label: 'Đóng gap', cls: 'text-rose-700 bg-rose-500/10' },
  enhancement: { label: 'Nâng cấp', cls: 'text-sky-700 bg-sky-500/10' },
  fix: { label: 'Sửa lỗi', cls: 'text-amber-700 bg-amber-500/10' },
  governance: { label: 'Governance', cls: 'text-violet-700 bg-violet-500/10' },
  experiment: { label: 'Thử nghiệm', cls: 'text-emerald-700 bg-emerald-500/10' },
};

export const CpuIcon = Cpu;
