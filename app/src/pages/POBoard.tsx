import { useMemo, useState } from 'react';
import { AlertTriangle, Clock3, ListFilter, X } from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { useCXM } from '@/store/CXMContext';
import { PriorityBadge, TASK_TYPE_META } from '@/components/cxm-shared';
import { fmtNum } from '@/lib/cxm-utils';
import type { POTask, TaskColumn } from '@/types/cxm';
import { cn } from '@/lib/utils';
import { customerPhaseForLegacyId } from '@/lib/journey-taxonomy';

const COLUMNS: { id: TaskColumn; label: string; dot: string }[] = [
  { id: 'backlog', label: 'Backlog', dot: 'bg-slate-400' },
  { id: 'ready', label: 'Ready', dot: 'bg-sky-500' },
  { id: 'doing', label: 'Đang làm', dot: 'bg-amber-500' },
  { id: 'validating', label: 'Validate dữ liệu', dot: 'bg-violet-500' },
  { id: 'done', label: 'Hoàn thành', dot: 'bg-emerald-500' },
];

const SQUADS = ['Tất cả squad', 'Onboarding Squad', 'Activation Squad', 'Payments', 'Trading Core', 'Engagement Squad', 'Wealth Squad', 'Retention Squad', 'CX Team', 'Data Platform', 'Growth', 'Ops'];
const PRIORITIES = ['Tất cả P', 'P0', 'P1', 'P2', 'P3'];
const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

export default function POBoard() {
  const { tasks, moveTask, selectedCustomerPhaseId } = useCXM();
  const [squad, setSquad] = useState('Tất cả squad');
  const [priority, setPriority] = useState('Tất cả P');
  const [status, setStatus] = useState<TaskColumn | 'all'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            (squad === 'Tất cả squad' || task.squad === squad) &&
            (priority === 'Tất cả P' || task.priority === priority) &&
            (status === 'all' || task.column === status) &&
            (selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(task.phaseId).id === selectedCustomerPhaseId),
        )
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (b.rice || 0) - (a.rice || 0)),
    [tasks, squad, priority, status, selectedCustomerPhaseId],
  );

  const scopedTasks = tasks.filter((task) => selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(task.phaseId).id === selectedCustomerPhaseId);
  const selectedTask = scopedTasks.find((task) => task.id === selectedTaskId) ?? null;
  const openTasks = scopedTasks.filter((task) => task.column !== 'done');
  const p0Open = openTasks.filter((task) => task.priority === 'P0').length;
  const gapOpen = openTasks.filter((task) => task.type === 'gap-closure').length;
  const dueOpen = openTasks.filter((task) => task.due).length;
  const doneCount = scopedTasks.length - openTasks.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50 p-6">
      <header className="flex shrink-0 items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Action reporting</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Danh mục thay đổi & ngoại lệ</h1>
          <p className="mt-1 text-xs text-muted-foreground">Theo dõi ưu tiên, trạng thái và KPI chịu tác động trên một danh sách điều hành.</p>
        </div>
        <dl className="flex divide-x divide-border rounded-lg border border-border bg-white shadow-sm">
          <Summary label="P0 đang mở" value={p0Open} tone="text-rose-700" />
          <Summary label="Gap chưa đóng" value={gapOpen} tone="text-amber-700" />
          <Summary label="Có deadline" value={dueOpen} />
          <Summary label="Hoàn thành" value={doneCount} tone="text-emerald-700" />
        </dl>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-border py-3">
        <ListFilter className="mr-1 h-4 w-4 text-muted-foreground" />
        <FilterSelect label="Lọc theo squad" value={squad} onChange={setSquad} options={SQUADS.map((value) => ({ value, label: value }))} />
        <FilterSelect label="Lọc theo priority" value={priority} onChange={setPriority} options={PRIORITIES.map((value) => ({ value, label: value }))} />
        <FilterSelect label="Lọc theo trạng thái" value={status} onChange={(value) => setStatus(value as TaskColumn | 'all')} options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...COLUMNS.map((column) => ({ value: column.id, label: column.label }))]} />
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length} / {scopedTasks.length} hạng mục</span>
      </div>

      <div className={cn('grid min-h-0 flex-1 pt-4', selectedTask ? 'grid-cols-[minmax(680px,1fr)_360px] gap-4' : 'grid-cols-1')}>
        <section aria-label="Danh sách công việc" className="min-w-0 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(280px,1.7fr)_150px_105px_145px_minmax(180px,1fr)_90px] gap-3 border-b border-border bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Exception / thay đổi</span><span>Trạng thái</span><span>Priority</span><span>Owner</span><span>KPI tác động</span><span>RICE</span>
          </div>
          <div className="h-[calc(100%-37px)] overflow-auto divide-y divide-border">
            {filtered.map((task) => <TaskRow key={task.id} task={task} selected={task.id === selectedTaskId} onSelect={() => setSelectedTaskId(task.id)} onMove={(column) => moveTask(task.id, column)} />)}
            {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Không có hạng mục phù hợp bộ lọc.</div>}
          </div>
        </section>
        {selectedTask && <TaskDetail task={selectedTask} onClose={() => setSelectedTaskId(null)} onMove={(column) => moveTask(selectedTask.id, column)} />}
      </div>
    </div>
  );
}

function Summary({ label, value, tone = 'text-foreground' }: { label: string; value: number; tone?: string }) {
  return <div className="min-w-28 px-4 py-2"><dt className="text-[10px] text-muted-foreground">{label}</dt><dd className={cn('mt-0.5 text-lg font-bold tabular-nums', tone)}>{value}</dd></div>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-8 rounded-md border border-input bg-white px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/30">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

function TaskRow({ task, selected, onSelect, onMove }: { task: POTask; selected: boolean; onSelect: () => void; onMove: (column: TaskColumn) => void }) {
  const phase = customerPhaseForLegacyId(task.phaseId);
  const kpis = task.kpiIds.map(kpiById).filter(Boolean);
  const isException = task.priority === 'P0' || task.type === 'gap-closure';
  return (
    <div className={cn('grid grid-cols-[minmax(280px,1.7fr)_150px_105px_145px_minmax(180px,1fr)_90px] items-center gap-3 px-4 py-3 text-left hover:bg-slate-50', selected && 'bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]')}>
      <button type="button" onClick={onSelect} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{task.id}</span>{isException && <AlertTriangle className="h-3 w-3 text-amber-600" aria-label="Ngoại lệ ưu tiên" />}<span className={cn('rounded px-1.5 py-0.5 text-[9px] font-medium', TASK_TYPE_META[task.type].cls)}>{TASK_TYPE_META[task.type].label}</span></span>
        <span className="mt-1 block truncate text-xs font-semibold text-foreground">{task.title}</span>
        <span className="mt-1 block text-[10px] text-muted-foreground">{phase.code} · {phase.name}{task.due ? ` · Hạn ${task.due}` : ''}</span>
      </button>
      <select aria-label={`Trạng thái ${task.id}`} value={task.column} onChange={(event) => onMove(event.target.value as TaskColumn)} onClick={(event) => event.stopPropagation()} className="h-7 w-full rounded border border-input bg-white px-2 text-[11px] font-medium outline-none focus:ring-2 focus:ring-ring/30">{COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</select>
      <span><PriorityBadge p={task.priority} /></span>
      <span className="min-w-0"><span className="block truncate text-xs font-medium">{task.owner}</span><span className="block truncate text-[10px] text-muted-foreground">{task.squad}</span></span>
      <span className="min-w-0 text-[11px] text-foreground">{kpis.length ? kpis.slice(0, 2).map((kpi) => kpi?.name).join(' · ') : 'Chưa liên kết KPI'}</span>
      <span className="text-xs font-bold tabular-nums text-primary">{fmtNum(task.rice)}</span>
    </div>
  );
}

function TaskDetail({ task, onClose, onMove }: { task: POTask; onClose: () => void; onMove: (column: TaskColumn) => void }) {
  const phase = customerPhaseForLegacyId(task.phaseId);
  return (
    <aside aria-label={`Chi tiết ${task.id}`} className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-white p-4">
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{task.id}</span><PriorityBadge p={task.priority} /></div><h2 className="mt-1.5 text-sm font-semibold leading-5">{task.title}</h2></div>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-5 p-4 text-xs">
        <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái xử lý</span><select value={task.column} onChange={(event) => onMove(event.target.value as TaskColumn)} className="h-9 w-full rounded-md border border-input bg-white px-3 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/30">{COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.label}</option>)}</select></label>
        <p className="leading-5 text-muted-foreground">{task.description}</p>
        <section><Heading>Accountability</Heading><dl className="grid grid-cols-2 gap-x-4 gap-y-3"><Info label="Owner" value={task.owner} /><Info label="Squad" value={task.squad} /><Info label="Loại" value={TASK_TYPE_META[task.type].label} /><Info label="Hạn xử lý" value={task.due ?? 'Chưa đặt'} /></dl></section>
        <section><Heading>Impacted KPI</Heading><div className="divide-y divide-border border-y border-border">{task.kpiIds.map((id) => { const kpi = kpiById(id); return kpi ? <div key={id} className="py-2.5"><div className="font-medium">{kpi.name}</div><div className="mt-1 text-[10px] text-muted-foreground">Hiện tại {kpi.value} · Target {kpi.target}</div></div> : null; })}</div></section>
        <section><Heading>RICE assessment</Heading><dl className="grid grid-cols-4 gap-2"><Info label="Reach" value={fmtNum(task.reach)} /><Info label="Impact" value={String(task.impact)} /><Info label="Confidence" value={`${task.confidence}%`} /><Info label="Effort" value={`${task.effort}w`} /></dl><div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>RICE score</span><span className="text-primary">{fmtNum(task.rice)}</span></div></section>
        <section><Heading>Journey context</Heading><div className="font-medium">{phase.code} · {phase.name}</div>{task.eventId && <div className="mt-1 font-mono text-[10px] text-muted-foreground">Event: {task.eventId}</div>}</section>
        <div className="flex items-center gap-2 border-t border-border pt-3 text-[10px] text-muted-foreground"><Clock3 className="h-3.5 w-3.5" /> Created {task.createdAt}</div>
      </div>
    </aside>
  );
}

function Heading({ children }: { children: string }) { return <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><dt className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-0.5 truncate font-medium" title={value}>{value}</dd></div>; }
