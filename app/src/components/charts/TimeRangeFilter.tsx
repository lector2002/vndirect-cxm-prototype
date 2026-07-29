import { cn } from '@/lib/utils';
import type { RangeId } from './time-range';

const RANGES: { id: RangeId; label: string }[] = [
  { id: '3m', label: '3m' },
  { id: '6m', label: '6m' },
  { id: '1y', label: '1y' },
];

export function TimeRangeFilter({ value, onChange, className }: { value: RangeId; onChange: (range: RangeId) => void; className?: string }) {
  return (
    <div role="group" aria-label="Khoảng thời gian" className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border bg-slate-50 p-0.5', className)}>
      {RANGES.map((range) => {
        const active = range.id === value;
        return (
          <button
            key={range.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(range.id)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10px] font-semibold tabular-nums transition-colors',
              active ? 'bg-white text-primary shadow-sm ring-1 ring-primary/15' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
