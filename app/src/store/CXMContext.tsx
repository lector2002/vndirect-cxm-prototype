import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { PO_TASKS } from '@/data/cxm';
import type { POTask, TaskColumn } from '@/types/cxm';
import type { CustomerPhaseId } from '@/lib/journey-taxonomy';
import type { TimeFrameId } from '@/lib/timeframe';

interface CXMStore {
  tasks: POTask[];
  moveTask: (id: string, col: TaskColumn) => void;
  addTaskFromGap: (payload: {
    title: string;
    phaseId: string;
    touchpointId?: string;
    eventId?: string;
    kpiIds: string[];
    reach: number;
    squad: string;
  }) => string;
  lastAddedId: string | null;
  selectedCustomerPhaseId: CustomerPhaseId | 'all';
  setSelectedCustomerPhaseId: (phaseId: CustomerPhaseId | 'all') => void;
  selectedTimeFrameId: TimeFrameId;
  setSelectedTimeFrameId: (timeFrameId: TimeFrameId) => void;
}

const Ctx = createContext<CXMStore | null>(null);

export function CXMProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<POTask[]>(PO_TASKS);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [selectedCustomerPhaseId, setSelectedCustomerPhaseId] = useState<CustomerPhaseId | 'all'>('all');
  const [selectedTimeFrameId, setSelectedTimeFrameId] = useState<TimeFrameId>('today');

  const moveTask = useCallback((id: string, col: TaskColumn) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: col } : t)));
  }, []);

  const addTaskFromGap: CXMStore['addTaskFromGap'] = useCallback((payload) => {
    const id = `CXM-${145 + Math.floor(Math.random() * 50)}`;
    setTasks((prev) => [
      {
        id,
        title: payload.title,
        description: 'Tạo tự động từ màn Coverage Gap. Cần PO bổ sung mô tả chi tiết và estimate.',
        type: 'gap-closure',
        priority: 'P1',
        column: 'backlog',
        reach: payload.reach,
        impact: 7,
        confidence: 70,
        effort: 1.5,
        rice: Math.round((payload.reach * 7 * 0.7) / 1.5 / 100),
        owner: 'Chưa gán',
        squad: payload.squad,
        phaseId: payload.phaseId,
        touchpointId: payload.touchpointId,
        eventId: payload.eventId,
        kpiIds: payload.kpiIds,
        tags: ['from-coverage-gap'],
        createdAt: '2026-07-17',
      },
      ...prev,
    ]);
    setLastAddedId(id);
    return id;
  }, []);

  const value = useMemo(
    () => ({ tasks, moveTask, addTaskFromGap, lastAddedId, selectedCustomerPhaseId, setSelectedCustomerPhaseId, selectedTimeFrameId, setSelectedTimeFrameId }),
    [tasks, moveTask, addTaskFromGap, lastAddedId, selectedCustomerPhaseId, selectedTimeFrameId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCXM(): CXMStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCXM must be used within CXMProvider');
  return ctx;
}
