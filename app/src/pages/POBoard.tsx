import { useMemo, useState } from 'react';
import { KanbanSquare, ListFilter, Flame, CircleDollarSign, CheckSquare, ChevronRight, Clock3, X } from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { useCXM } from '@/store/CXMContext';
import { PriorityBadge, TASK_TYPE_META } from '@/components/cxm-shared';
import { fmtNum } from '@/lib/cxm-utils';
import type { POTask, TaskColumn } from '@/types/cxm';
import { cn } from '@/lib/utils';
import { customerPhaseForLegacyId } from '@/lib/journey-taxonomy';

const COLUMNS: { id: TaskColumn; label: string; accent: string }[] = [
  { id: 'backlog', label: 'Backlog', accent: 'bg-slate-400' },
  { id: 'ready', label: 'Ready', accent: 'bg-sky-400' },
  { id: 'doing', label: 'Đang làm', accent: 'bg-amber-400' },
  { id: 'validating', label: 'Validate dữ liệu', accent: 'bg-violet-400' },
  { id: 'done', label: 'Hoàn thành', accent: 'bg-emerald-400' },
];

const SQUADS = ['Tất cả squad', 'Onboarding Squad', 'Activation Squad', 'Payments', 'Trading Core', 'Engagement Squad', 'Wealth Squad', 'Retention Squad', 'CX Team', 'Data Platform', 'Growth', 'Ops'];
const PRIORITIES = ['Tất cả P', 'P0', 'P1', 'P2', 'P3'];

export default function POBoard() {
  const { tasks, moveTask, selectedCustomerPhaseId } = useCXM();
  const [squad, setSquad] = useState('Tất cả squad');
  const [priority, setPriority] = useState('Tất cả P');
  const [dragOverCol, setDragOverCol] = useState<TaskColumn | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (squad === 'Tất cả squad' || t.squad === squad) &&
          (priority === 'Tất cả P' || t.priority === priority) &&
          (selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(t.phaseId).id === selectedCustomerPhaseId),
      ),
    [tasks, squad, priority, selectedCustomerPhaseId],
  );

  const openGaps = tasks.filter((t) => t.type === 'gap-closure' && t.column !== 'done').length;
  const p0Open = tasks.filter((t) => t.priority === 'P0' && t.column !== 'done').length;
  const doneCount = tasks.filter((t) => t.column === 'done').length;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <div className="relative flex h-full flex-col p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Điều phối triển khai</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <KanbanSquare className="h-5 w-5 text-primary" />
            Công việc cần triển khai
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kéo-thả để đổi trạng thái · click task để xem chi tiết liên kết với touchpoint, event và KPI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">
            <Flame className="h-3.5 w-3.5" /> {p0Open} P0 đang mở
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">
            <CircleDollarSign className="h-3.5 w-3.5 text-primary" /> {openGaps} gap-closure chưa xong
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
            <CheckSquare className="h-3.5 w-3.5" /> {doneCount} done
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <ListFilter className="h-4 w-4 text-muted-foreground" />
        <select
          value={squad}
          onChange={(e) => setSquad(e.target.value)}
          className="rounded-lg border border-input bg-muted/60 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {SQUADS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg border border-input bg-muted/60 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {PRIORITIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} task</span>
      </div>

      {/* Board */}
      <div className="min-h-0 flex-1 overflow-x-auto pb-1">
      <div className="grid h-full min-w-[1050px] grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const colTasks = filtered
            .filter((t) => t.column === col.id)
            .sort((a, b) => (b.rice || 0) - (a.rice || 0));
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverCol(col.id);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/task-id');
                if (id) moveTask(id, col.id);
                setDragOverCol(null);
              }}
              className={cn(
                'flex min-h-0 flex-col rounded-xl border bg-white shadow-sm transition-colors',
                dragOverCol === col.id ? 'border-primary/60 bg-primary/5' : 'border-border',
              )}
            >
              <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <span className={cn('h-2 w-2 rounded-full', col.accent)} />
                <span className="text-xs font-semibold text-foreground">{col.label}</span>
                <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-secondary-foreground">
                  {colTasks.length}
                </span>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                {colTasks.map((t) => (
                  <TaskCard key={t.id} task={t} selected={t.id === selectedTaskId} onSelect={() => setSelectedTaskId(t.id)} />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
                    Kéo task vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTaskId(null)} />}
    </div>
  );
}

function TaskCard({ task: t, selected, onSelect }: { task: POTask; selected: boolean; onSelect: () => void }) {
  const phase = customerPhaseForLegacyId(t.phaseId);
  const typeMeta = TASK_TYPE_META[t.type];
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/task-id', t.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onSelect}
      className={cn(
        'group cursor-grab rounded-lg border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-[0_10px_24px_-12px_hsla(221,83%,32%,0.3)] active:cursor-grabbing',
        selected ? 'border-primary ring-1 ring-primary/30' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
        <div className="flex items-center gap-1.5">
          <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', typeMeta.cls)}>{typeMeta.label}</span>
          <PriorityBadge p={t.priority} />
        </div>
      </div>
      <div className="mt-1.5 text-xs font-medium leading-snug text-foreground">{t.title}</div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-[9px] font-bold text-white">
            {t.owner === 'Chưa gán'
              ? '?'
              : t.owner
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')}
          </span>
          <span className="text-[10px] text-muted-foreground">{t.squad}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {phase && (
            <span
              className="rounded px-1 py-0.5 text-[9px] font-bold"
              style={{ background: `${phase.color}22`, color: phase.color }}
            >
              {phase.code}
            </span>
          )}
          {t.due && <span className="text-[10px] font-medium text-amber-300">{t.due}</span>}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary">RICE {fmtNum(t.rice)}</span>
        <span className="flex items-center gap-0.5 text-primary/80">Chi tiết <ChevronRight className="h-3 w-3" /></span>
      </div>
    </div>
  );
}

function TaskDetail({ task: t, onClose }: { task: POTask; onClose: () => void }) {
  const phase = customerPhaseForLegacyId(t.phaseId);
  const typeMeta = TASK_TYPE_META[t.type];
  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-[430px] max-w-[92vw] flex-col border-l border-border bg-white shadow-[-20px_0_50px_-24px_rgba(15,23,42,.16)]">
      <div className="flex items-start gap-3 border-b border-border p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">{t.id}</span><PriorityBadge p={t.priority} /></div>
          <h2 className="mt-2 text-base font-semibold leading-snug">{t.title}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Đóng chi tiết"><X className="h-4 w-4" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 text-sm">
        <p className="leading-6 text-muted-foreground">{t.description}</p>
        <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phân loại & phụ trách</h3><div className="grid grid-cols-2 gap-2"><Info label="Loại" value={typeMeta.label} /><Info label="Squad" value={t.squad} /><Info label="Owner" value={t.owner} /><Info label="Hạn xử lý" value={t.due ?? 'Chưa đặt'} /></div></section>
        <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ưu tiên RICE</h3><div className="grid grid-cols-4 gap-2"><Info label="Reach" value={fmtNum(t.reach)} /><Info label="Impact" value={String(t.impact)} /><Info label="Confidence" value={`${t.confidence}%`} /><Info label="Effort" value={`${t.effort}w`} /></div><div className="mt-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs"><span className="text-muted-foreground">RICE score</span><span className="ml-2 font-bold text-primary">{fmtNum(t.rice)}</span></div></section>
        <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">KPI bị ảnh hưởng</h3><div className="space-y-2">{t.kpiIds.map((id) => { const k = kpiById(id); return k ? <div key={id} className="rounded-lg border border-border bg-card p-3"><div className="text-xs font-medium">{k.name}</div><div className="mt-1 text-[11px] text-muted-foreground">Hiện tại {k.value} · Target {k.target}</div></div> : null; })}</div></section>
        {phase && <section className="rounded-lg border border-border bg-card p-3"><div className="text-[11px] uppercase tracking-wider text-muted-foreground">Liên kết hành trình</div><div className="mt-1 flex items-center gap-2 text-xs font-medium"><span className="rounded px-1.5 py-0.5" style={{ background: `${phase.color}22`, color: phase.color }}>{phase.code}</span>{phase.name}</div>{t.eventId && <div className="mt-2 font-mono text-[11px] text-muted-foreground">Event: {t.eventId}</div>}</section>}
      </div>
      <div className="flex items-center gap-2 border-t border-border p-4 text-[11px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Created {t.createdAt}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-card p-2.5"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate text-xs font-medium" title={value}>{value}</div></div>;
}
