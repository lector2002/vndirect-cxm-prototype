import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertOctagon, ArrowUpRight, Clock3, Filter, MessageSquareText, Siren, TicketCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { customerPhaseForLegacyId } from '@/lib/journey-taxonomy';

type IssueStatus = 'new' | 'investigating' | 'in-progress' | 'resolved';
type Severity = 'critical' | 'high' | 'medium';
type Breakpoint = { id: string; title: string; phaseId: string; touchpoint: string; theme: string; severity: Severity; volume: number; trend: string; signal: string; owner: string; ticketId: string; status: IssueStatus; kpi: string; updated: string; feedback: { channel: string; text: string; sentiment: 'negative' | 'neutral'; time: string }[] };

const BREAKPOINTS: Breakpoint[] = [
  { id: 'BP-024', title: 'Nạp tiền treo sau callback ngân hàng', phaseId: 'p3', touchpoint: 'Cổng thanh toán & đối soát', theme: 'Nạp/rút tiền', severity: 'critical', volume: 87, trend: '+42% so với 7 ngày trước', signal: '87 ticket + 214 giao dịch timeout', owner: 'Payments', ticketId: 'CXM-142', status: 'in-progress', kpi: 'Tỷ lệ nạp tiền thành công', updated: '12 phút trước', feedback: [{ channel: 'Hotline', text: 'Tiền đã trừ nhưng hơn 30 phút chưa vào tiểu khoản.', sentiment: 'negative', time: '12 phút trước' }, { channel: 'App feedback', text: 'Không biết giao dịch treo thì cần chờ bao lâu.', sentiment: 'negative', time: '26 phút trước' }] },
  { id: 'BP-021', title: 'Liveness thất bại lặp lại trên Android', phaseId: 'p2', touchpoint: 'Liveness & Face match', theme: 'eKYC', severity: 'high', volume: 63, trend: '+18% so với 7 ngày trước', signal: '63 feedback + completion giảm 3,2pt', owner: 'Onboarding Squad', ticketId: 'CXM-138', status: 'investigating', kpi: 'Tỷ lệ hoàn tất eKYC', updated: '34 phút trước', feedback: [{ channel: 'Google Play', text: 'Quay đi quay lại vẫn báo không nhận diện được khuôn mặt.', sentiment: 'negative', time: '34 phút trước' }, { channel: 'Chat', text: 'Đã thử 4 lần, app yêu cầu làm lại từ đầu.', sentiment: 'negative', time: '1 giờ trước' }] },
  { id: 'BP-019', title: 'Không rõ lý do lệnh bị từ chối', phaseId: 'p4', touchpoint: 'Vé lệnh (Order ticket)', theme: 'Đặt lệnh', severity: 'high', volume: 41, trend: '+11% so với 7 ngày trước', signal: '41 ticket cùng intent + FCR 58%', owner: 'Trading Core', ticketId: 'CXM-135', status: 'in-progress', kpi: 'Tỷ lệ đặt lệnh thành công', updated: '1 giờ trước', feedback: [{ channel: 'Hotline', text: 'Lệnh báo từ chối nhưng không hiểu sai giá hay sai sức mua.', sentiment: 'negative', time: '1 giờ trước' }, { channel: 'iOS review', text: 'Cần hiện hướng dẫn cụ thể thay vì mã lỗi.', sentiment: 'negative', time: '2 giờ trước' }] },
  { id: 'BP-017', title: 'Khách hàng bỏ dở ở bước ký hợp đồng', phaseId: 'p2', touchpoint: 'Ký HĐ điện tử (CA)', theme: 'eKYC', severity: 'medium', volume: 29, trend: '-6% so với 7 ngày trước', signal: 'Drop-off 14% + 29 chat hỏi cách ký', owner: 'Onboarding Squad', ticketId: 'CXM-131', status: 'resolved', kpi: 'Thời gian mở TK (trung vị)', updated: 'Hôm qua', feedback: [{ channel: 'Chat', text: 'Không thấy nút ký ở cuối hợp đồng.', sentiment: 'neutral', time: 'Hôm qua' }] },
];

const STATUS_META: Record<IssueStatus, { label: string; cls: string }> = {
  new: { label: 'Mới', cls: 'bg-slate-100 text-slate-700 border-slate-300' }, investigating: { label: 'Đang điều tra', cls: 'bg-violet-50 text-violet-700 border-violet-200' }, 'in-progress': { label: 'Đang xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200' }, resolved: { label: 'Đã xác nhận', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};
const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-rose-700 bg-rose-50 border-rose-200' }, high: { label: 'High', cls: 'text-amber-700 bg-amber-50 border-amber-200' }, medium: { label: 'Medium', cls: 'text-sky-700 bg-sky-50 border-sky-200' },
};
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2 };

export default function IssueHub() {
  const { selectedCustomerPhaseId } = useCXM();
  const [theme, setTheme] = useState('Tất cả chủ đề');
  const [selectedId, setSelectedId] = useState('BP-024');
  const issues = useMemo(() => BREAKPOINTS.filter((issue) => (theme === 'Tất cả chủ đề' || issue.theme === theme) && (selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(issue.phaseId).id === selectedCustomerPhaseId)).sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.volume - a.volume), [theme, selectedCustomerPhaseId]);
  const selected = issues.find((issue) => issue.id === selectedId) ?? issues[0] ?? null;
  const scopedIssues = BREAKPOINTS.filter((issue) => selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(issue.phaseId).id === selectedCustomerPhaseId);
  const open = scopedIssues.filter((issue) => issue.status !== 'resolved').length;
  const breached = scopedIssues.filter((issue) => issue.severity === 'critical' && issue.status !== 'resolved').length;
  const totalCases = scopedIssues.reduce((sum, issue) => sum + issue.volume, 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50/50 p-6">
      <header className="flex shrink-0 items-end justify-between gap-6 border-b border-border pb-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Issue reporting</p><h1 className="mt-1 text-xl font-bold tracking-tight">Breakpoint & issue report</h1><p className="mt-1 text-xs text-muted-foreground">Ưu tiên theo severity, SLA, evidence và tác động lên hành trình.</p></div>
        <button type="button" className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><TicketCheck className="h-3.5 w-3.5" />Tạo CX ticket</button>
      </header>

      <div className="flex shrink-0 items-center gap-5 border-b border-border py-3">
        <Metric icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Đang mở" value={String(open)} />
        <Metric icon={<Siren className="h-3.5 w-3.5" />} label="Vi phạm SLA" value={String(breached)} critical />
        <Metric icon={<MessageSquareText className="h-3.5 w-3.5" />} label="Cases đã gộp" value={String(totalCases)} />
        <Metric icon={<Clock3 className="h-3.5 w-3.5" />} label="Closed-loop" value="76%" />
        <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><Filter className="h-3.5 w-3.5" /><span className="sr-only">Lọc theo chủ đề</span><select value={theme} onChange={(event) => setTheme(event.target.value)} className="h-8 rounded-md border border-input bg-white px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/30"><option>Tất cả chủ đề</option><option>eKYC</option><option>Nạp/rút tiền</option><option>Đặt lệnh</option></select></label>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(660px,1fr)_380px] gap-4 pt-4">
        <section aria-label="Danh sách breakpoint" className="min-w-0 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(250px,1.5fr)_100px_135px_minmax(170px,1fr)_125px] gap-3 border-b border-border bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><span>Breakpoint</span><span>Severity / SLA</span><span>Impact</span><span>Evidence</span><span>Owner / status</span></div>
          <div className="h-[calc(100%-37px)] overflow-y-auto divide-y divide-border">
            {issues.map((issue) => <button type="button" key={issue.id} onClick={() => setSelectedId(issue.id)} className={cn('grid w-full grid-cols-[minmax(250px,1.5fr)_100px_135px_minmax(170px,1fr)_125px] items-center gap-3 px-4 py-4 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', selected?.id === issue.id && 'bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]')}>
              <span className="min-w-0"><span className="font-mono text-[10px] text-muted-foreground">{issue.id} · {issue.updated}</span><span className="mt-1 block text-xs font-semibold text-foreground">{issue.title}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{customerPhaseForLegacyId(issue.phaseId).code} · {issue.touchpoint}</span></span>
              <span className="space-y-1.5"><Badge meta={SEVERITY_META[issue.severity]} />{issue.severity === 'critical' && issue.status !== 'resolved' ? <span className="block text-[10px] font-semibold text-rose-700">Quá 48 phút</span> : <span className="block text-[10px] text-muted-foreground">Trong SLA</span>}</span>
              <span><span className="block text-sm font-bold tabular-nums">{issue.volume} cases</span><span className={cn('mt-1 block text-[10px]', issue.trend.startsWith('+') ? 'text-rose-700' : 'text-emerald-700')}>{issue.trend.split(' so với')[0]}</span><span className="mt-1 block truncate text-[10px] text-muted-foreground">{issue.kpi}</span></span>
              <span className="text-[11px] leading-4 text-foreground">{issue.signal}</span>
              <span className="min-w-0"><span className="block truncate text-xs font-medium">{issue.owner}</span><span className="my-1 block font-mono text-[10px] text-primary">{issue.ticketId}</span><Badge meta={STATUS_META[issue.status]} /></span>
            </button>)}
            {issues.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Không có breakpoint phù hợp bộ lọc.</div>}
          </div>
        </section>
        <IssueDetail issue={selected} />
      </div>
    </div>
  );
}

function Metric({ icon, label, value, critical }: { icon: ReactNode; label: string; value: string; critical?: boolean }) { return <div className="flex items-center gap-2"><span className={critical ? 'text-rose-700' : 'text-primary'}>{icon}</span><span className="text-[10px] text-muted-foreground">{label}</span><span className={cn('text-sm font-bold tabular-nums', critical && 'text-rose-700')}>{value}</span></div>; }
function Badge({ meta }: { meta: { label: string; cls: string } }) { return <span className={cn('inline-flex rounded border px-2 py-0.5 text-[10px] font-medium', meta.cls)}>{meta.label}</span>; }

function IssueDetail({ issue }: { issue: Breakpoint | null }) {
  if (!issue) return <aside className="flex items-center justify-center rounded-lg border border-dashed border-border bg-white text-sm text-muted-foreground">Chọn breakpoint để xem báo cáo.</aside>;
  const phase = customerPhaseForLegacyId(issue.phaseId);
  const breached = issue.severity === 'critical' && issue.status !== 'resolved';
  return (
    <aside aria-label={`Chi tiết ${issue.id}`} className="min-h-0 overflow-y-auto rounded-lg border border-border bg-white shadow-sm">
      <div className="border-b border-border p-4"><div className="flex items-center gap-2"><Badge meta={SEVERITY_META[issue.severity]} /><Badge meta={STATUS_META[issue.status]} /><span className="ml-auto font-mono text-[10px] text-muted-foreground">{issue.id}</span></div><h2 className="mt-2 text-sm font-semibold leading-5">{issue.title}</h2><p className="mt-1 text-[10px] text-muted-foreground">Cập nhật {issue.updated}</p></div>
      <div className="space-y-5 p-4 text-xs">
        <section className={cn('border-l-2 py-1 pl-3', breached ? 'border-rose-500' : 'border-emerald-500')}><div className={cn('font-semibold', breached ? 'text-rose-700' : 'text-emerald-700')}>{breached ? 'Vi phạm SLA · quá 48 phút' : 'Đang trong SLA'}</div><p className="mt-1 leading-5 text-muted-foreground">{breached ? 'Chưa có phản hồi đầu tiên cho cụm sự cố này.' : 'Owner đã tiếp nhận trong thời gian cam kết.'}</p></section>
        <section><Heading>Customer & business impact</Heading><dl className="grid grid-cols-2 gap-x-4 gap-y-3"><Info label="Affected cases" value={String(issue.volume)} /><Info label="Xu hướng" value={issue.trend.split(' so với')[0]} /><Info label="KPI ảnh hưởng" value={issue.kpi} /><Info label="Owner" value={issue.owner} /></dl></section>
        <section><Heading>Evidence</Heading><div className="border-y border-border py-3 font-medium leading-5">{issue.signal}</div><div className="divide-y divide-border">{issue.feedback.map((feedback) => <blockquote key={feedback.text} className="py-3"><p className="leading-5 text-foreground">“{feedback.text}”</p><footer className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{feedback.channel}</span><span>{feedback.time}</span></footer></blockquote>)}</div></section>
        <section><Heading>Journey context</Heading><div className="font-medium">{phase.code} · {phase.name}</div><div className="mt-1 text-muted-foreground">{issue.touchpoint}</div></section>
        <section><Heading>Accountability</Heading><div className="inline-flex items-center gap-1 font-mono font-semibold text-primary">{issue.ticketId}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></div><p className="mt-2 leading-5 text-muted-foreground">Ticket chỉ đóng khi đã xác nhận fix và gửi phản hồi cho khách hàng.</p></section>
      </div>
    </aside>
  );
}

function Heading({ children }: { children: string }) { return <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><dt className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-0.5 truncate font-medium" title={value}>{value}</dd></div>; }
