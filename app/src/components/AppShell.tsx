import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  GitBranch,
  Grid3X3,
  Target,
  ListChecks,
  MessagesSquare,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
  SlidersHorizontal,
  HeartHandshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { totalCoverage, allEventPaths } from '@/lib/cxm-utils';
import { CUSTOMER_PHASES } from '@/lib/journey-taxonomy';
import { useCXM } from '@/store/CXMContext';
import { TIME_FRAMES, timeFrameById } from '@/lib/timeframe';

const NAV = [
  { to: '/', label: 'Báo cáo điều hành', icon: LayoutDashboard, end: true, group: 'Bối cảnh hành trình' },
  { to: '/journey', label: 'Hành trình khách hàng', icon: GitBranch, group: 'Bối cảnh hành trình' },
  { to: '/coverage', label: 'Độ phủ dữ liệu', icon: Grid3X3, group: 'Chất lượng đo lường' },
  { to: '/impact', label: 'Tác động thay đổi', icon: Target, group: 'Chất lượng đo lường' },
  { to: '/voice', label: 'Tiếng nói khách hàng', icon: HeartHandshake, group: 'Customer intelligence' },
  { to: '/issues', label: 'Trải nghiệm khách hàng', icon: MessagesSquare, group: 'Customer intelligence' },
  { to: '/board', label: 'Danh mục hành động', icon: ListChecks, group: 'Vấn đề & hành động' },
];

const PAGE_META = {
  '/': { label: 'Báo cáo điều hành', note: 'Sức khỏe hành trình và ngoại lệ chính' },
  '/journey': { label: 'Hành trình khách hàng', note: 'Phase, nhóm, flow và touchpoint' },
  '/coverage': { label: 'Độ phủ dữ liệu', note: 'Signal, gap và mức sẵn sàng đo lường' },
  '/impact': { label: 'Tác động thay đổi', note: 'Phạm vi ảnh hưởng tới KPI và hệ thống' },
  '/board': { label: 'Danh mục hành động', note: 'Owner, ưu tiên và trạng thái triển khai' },
  '/issues': { label: 'Trải nghiệm khách hàng', note: 'Journey friction, repeat contact và churn risk' },
  '/voice': { label: 'Tiếng nói khách hàng', note: 'Cảm nhận sản phẩm và quyết định tiếp theo' },
} as const;

export default function AppShell({ children }: { children: ReactNode }) {
  const cov = totalCoverage();
  const totalEvents = allEventPaths().length;
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { selectedCustomerPhaseId, setSelectedCustomerPhaseId, selectedTimeFrameId, setSelectedTimeFrameId } = useCXM();
  const timeFrame = timeFrameById(selectedTimeFrameId);
  const page = PAGE_META[location.pathname as keyof typeof PAGE_META] ?? PAGE_META['/'];

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'flex shrink-0 flex-col overflow-hidden border-r border-border bg-white transition-[width] duration-200',
          sidebarOpen ? 'w-60' : 'w-16',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center border-b border-border py-5', sidebarOpen ? 'gap-3 px-5' : 'justify-center px-2')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground shadow-sm">
            V
          </div>
          {sidebarOpen && <div>
            <div className="text-sm font-bold tracking-tight">
              VNDIRECT <span className="text-primary">CXM</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Customer experience workspace
            </div>
          </div>}
        </div>

        {/* Nav */}
        <nav aria-label="Điều hướng báo cáo" className={cn('flex-1 py-4', sidebarOpen ? 'px-3' : 'space-y-1 px-2')}>
          {NAV.map((n, index) => (
            <div key={n.to}>
              {sidebarOpen && (index === 0 || NAV[index - 1].group !== n.group) && <p className={cn('px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground', index > 0 && 'pt-4')}>{n.group}</p>}
            <NavLink
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg py-2 text-[12px] font-medium transition-colors',
                  sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2',
                  isActive
                     ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )
              }
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && n.label}
            </NavLink>
            </div>
          ))}
        </nav>

        {/* Coverage footer */}
        <div className={cn('border-t border-border', sidebarOpen ? 'p-4' : 'p-2')}>
          {sidebarOpen && <div className="rounded-xl border border-border bg-slate-50 p-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
               Dữ liệu hành trình
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
          {sidebarOpen && <div className="mt-3 text-center text-[10px] text-muted-foreground/60">Cập nhật: 17/07/2026</div>}
        </div>
      </aside>

      {/* ===== Main ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white/95 px-6 backdrop-blur">
          <div className="min-w-0"><div className="text-xs font-semibold text-foreground">{page.label}</div><div className="truncate text-[10px] text-muted-foreground">{page.note}</div></div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Reporting live</span>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-slate-50 p-1">
              <SlidersHorizontal className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <select
                value={selectedCustomerPhaseId}
                onChange={(event) => setSelectedCustomerPhaseId(event.target.value as typeof selectedCustomerPhaseId)}
                className="h-6 max-w-32 bg-transparent px-2 text-xs text-secondary-foreground outline-none"
                title="Lọc dữ liệu theo phase CX"
              >
                <option value="all">Tất cả phase</option>
                {CUSTOMER_PHASES.map((phase) => <option key={phase.id} value={phase.id}>{phase.code} · {phase.name}</option>)}
              </select>
              <div className="h-4 w-px bg-border" />
              <CalendarDays className="ml-1 h-3.5 w-3.5 shrink-0 text-primary" />
              <select
                value={selectedTimeFrameId}
                onChange={(event) => setSelectedTimeFrameId(event.target.value as typeof selectedTimeFrameId)}
                className="h-6 max-w-40 bg-transparent px-1 text-xs font-medium text-secondary-foreground outline-none"
                title="Khoảng thời gian dữ liệu"
              >
                {TIME_FRAMES.map((frame) => <option key={frame.id} value={frame.id}>{frame.label}{frame.snapshot ? ' · Demo' : ''}</option>)}
              </select>
            </div>
            {timeFrame.snapshot && <span className="text-[10px] font-medium text-amber-700">Demo snapshot</span>}
          </div>
        </header>

        {/* Content */}
        <main key={location.pathname} className="page-enter min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
