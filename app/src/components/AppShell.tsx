import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  GitBranch,
  Grid3X3,
  Target,
  KanbanSquare,
  Search,
  Bell,
  ChevronDown,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { totalCoverage, allEventPaths } from '@/lib/cxm-utils';
import { CUSTOMER_PHASES } from '@/lib/journey-taxonomy';
import { useCXM } from '@/store/CXMContext';
import { TIME_FRAMES, timeFrameById } from '@/lib/timeframe';

const NAV = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/journey', label: 'Hành trình CX', icon: GitBranch },
  { to: '/coverage', label: 'Coverage Gap', icon: Grid3X3 },
  { to: '/impact', label: 'Impact Analysis', icon: Target },
  { to: '/board', label: 'PO Board', icon: KanbanSquare },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const cov = totalCoverage();
  const totalEvents = allEventPaths().length;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedCustomerPhaseId, setSelectedCustomerPhaseId, selectedTimeFrameId, setSelectedTimeFrameId } = useCXM();
  const timeFrame = timeFrameById(selectedTimeFrameId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'flex shrink-0 flex-col overflow-hidden border-r border-border bg-[hsl(222,48%,7%)] transition-[width] duration-200',
          sidebarOpen ? 'w-60' : 'w-16',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center border-b border-border py-4', sidebarOpen ? 'gap-3 px-5' : 'justify-center px-2')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
            V
          </div>
          {sidebarOpen && <div>
            <div className="text-sm font-bold tracking-tight">
              VNDIRECT <span className="text-primary">CXM</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Experience Governance
            </div>
          </div>}
        </div>

        {/* Nav */}
        <nav className={cn('flex-1 space-y-1 py-4', sidebarOpen ? 'px-3' : 'px-2')}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg py-2.5 text-[13px] font-medium transition-colors',
                  sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_0_hsl(45,100%,51%)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && n.label}
            </NavLink>
          ))}
        </nav>

        {/* Coverage footer */}
        <div className={cn('border-t border-border', sidebarOpen ? 'p-4' : 'p-2')}>
          {sidebarOpen && <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Instrumentation coverage
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-xl font-bold text-primary">{cov.score}%</span>
              <span className="text-[11px] text-muted-foreground">
                · {cov.live + cov.validating}/{totalEvents} events có tín hiệu
              </span>
            </div>
            <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-emerald-400" style={{ width: `${(cov.live / cov.total) * 100}%` }} />
              <div className="bg-sky-400" style={{ width: `${(cov.validating / cov.total) * 100}%` }} />
              <div className="bg-amber-400" style={{ width: `${(cov.designed / cov.total) * 100}%` }} />
              <div className="bg-rose-400" style={{ width: `${(cov.gap / cov.total) * 100}%` }} />
            </div>
          </div>}
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            title={sidebarOpen ? 'Thu gọn sidebar' : 'Mở sidebar'}
            className={cn(
              'flex h-8 items-center rounded-lg border border-border bg-secondary/60 text-muted-foreground transition-colors hover:text-foreground',
              sidebarOpen ? 'mt-3 w-full justify-center gap-2 text-[11px]' : 'w-full justify-center',
            )}
          >
            {sidebarOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            {sidebarOpen && 'Thu gọn'}
          </button>
          {sidebarOpen && <div className="mt-3 text-center text-[10px] text-muted-foreground/60">v0.9 · prototype · 17/07/2026</div>}
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-[hsl(222,46%,8%)] px-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Tìm touchpoint, event, KPI…"
              className="h-8 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs text-secondary-foreground hover:bg-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Production
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <select
              value={selectedCustomerPhaseId}
              onChange={(event) => setSelectedCustomerPhaseId(event.target.value as typeof selectedCustomerPhaseId)}
              className="h-8 rounded-lg border border-border bg-secondary/60 px-3 text-xs text-secondary-foreground outline-none hover:bg-secondary"
              title="Lọc dữ liệu theo phase CX"
            >
              <option value="all">Tất cả phase</option>
              {CUSTOMER_PHASES.map((phase) => <option key={phase.id} value={phase.id}>{phase.code} · {phase.name}</option>)}
            </select>
            <select
              value={selectedTimeFrameId}
              onChange={(event) => setSelectedTimeFrameId(event.target.value as typeof selectedTimeFrameId)}
              className="h-8 rounded-lg border border-border bg-secondary/60 px-3 text-xs text-secondary-foreground outline-none hover:bg-secondary"
              title="Khoảng thời gian dữ liệu"
            >
              {TIME_FRAMES.map((frame) => <option key={frame.id} value={frame.id}>{frame.label}{frame.snapshot ? ' · Demo' : ''}</option>)}
            </select>
            {timeFrame.snapshot && <span className="hidden text-[10px] text-amber-300 xl:block">Demo snapshot</span>}
            <button className="relative rounded-lg border border-border bg-secondary/60 p-2 text-muted-foreground hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rose-400" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-amber-600 text-xs font-bold text-primary-foreground">
              CX
            </div>
          </div>
        </header>

        {/* Content */}
        <main key={location.pathname} className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
