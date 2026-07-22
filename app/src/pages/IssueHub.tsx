import { useMemo, useState } from 'react';
import { AlertOctagon, ArrowUpRight, CheckCircle2, Clock3, Filter, MessageSquareText, Siren, TicketCheck, X } from 'lucide-react';
import { SectionTitle, StatCard } from '@/components/cxm-shared';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { customerPhaseForLegacyId } from '@/lib/journey-taxonomy';

type IssueStatus = 'new' | 'investigating' | 'in-progress' | 'resolved';
type Severity = 'critical' | 'high' | 'medium';

type Breakpoint = {
  id: string;
  title: string;
  phaseId: string;
  touchpoint: string;
  theme: string;
  severity: Severity;
  volume: number;
  trend: string;
  signal: string;
  owner: string;
  ticketId: string;
  status: IssueStatus;
  kpi: string;
  updated: string;
  feedback: { channel: string; text: string; sentiment: 'negative' | 'neutral'; time: string }[];
};

const BREAKPOINTS: Breakpoint[] = [
  { id: 'BP-024', title: 'Nạp tiền treo sau callback ngân hàng', phaseId: 'p3', touchpoint: 'Cổng thanh toán & đối soát', theme: 'Nạp/rút tiền', severity: 'critical', volume: 87, trend: '+42% so với 7 ngày trước', signal: '87 ticket + 214 giao dịch timeout', owner: 'Payments', ticketId: 'CXM-142', status: 'in-progress', kpi: 'Tỷ lệ nạp tiền thành công', updated: '12 phút trước', feedback: [{ channel: 'Hotline', text: 'Tiền đã trừ nhưng hơn 30 phút chưa vào tiểu khoản.', sentiment: 'negative', time: '12 phút trước' }, { channel: 'App feedback', text: 'Không biết giao dịch treo thì cần chờ bao lâu.', sentiment: 'negative', time: '26 phút trước' }] },
  { id: 'BP-021', title: 'Liveness thất bại lặp lại trên Android', phaseId: 'p2', touchpoint: 'Liveness & Face match', theme: 'eKYC', severity: 'high', volume: 63, trend: '+18% so với 7 ngày trước', signal: '63 feedback + completion giảm 3,2pt', owner: 'Onboarding Squad', ticketId: 'CXM-138', status: 'investigating', kpi: 'Tỷ lệ hoàn tất eKYC', updated: '34 phút trước', feedback: [{ channel: 'Google Play', text: 'Quay đi quay lại vẫn báo không nhận diện được khuôn mặt.', sentiment: 'negative', time: '34 phút trước' }, { channel: 'Chat', text: 'Đã thử 4 lần, app yêu cầu làm lại từ đầu.', sentiment: 'negative', time: '1 giờ trước' }] },
  { id: 'BP-019', title: 'Không rõ lý do lệnh bị từ chối', phaseId: 'p4', touchpoint: 'Vé lệnh (Order ticket)', theme: 'Đặt lệnh', severity: 'high', volume: 41, trend: '+11% so với 7 ngày trước', signal: '41 ticket cùng intent + FCR 58%', owner: 'Trading Core', ticketId: 'CXM-135', status: 'in-progress', kpi: 'Tỷ lệ đặt lệnh thành công', updated: '1 giờ trước', feedback: [{ channel: 'Hotline', text: 'Lệnh báo từ chối nhưng không hiểu sai giá hay sai sức mua.', sentiment: 'negative', time: '1 giờ trước' }, { channel: 'iOS review', text: 'Cần hiện hướng dẫn cụ thể thay vì mã lỗi.', sentiment: 'negative', time: '2 giờ trước' }] },
  { id: 'BP-017', title: 'Khách hàng bỏ dở ở bước ký hợp đồng', phaseId: 'p2', touchpoint: 'Ký HĐ điện tử (CA)', theme: 'eKYC', severity: 'medium', volume: 29, trend: '-6% so với 7 ngày trước', signal: 'Drop-off 14% + 29 chat hỏi cách ký', owner: 'Onboarding Squad', ticketId: 'CXM-131', status: 'resolved', kpi: 'Thời gian mở TK (trung vị)', updated: 'Hôm qua', feedback: [{ channel: 'Chat', text: 'Không thấy nút ký ở cuối hợp đồng.', sentiment: 'neutral', time: 'Hôm qua' }] },
];

const STATUS_META: Record<IssueStatus, { label: string; cls: string }> = {
  new: { label: 'Mới', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  investigating: { label: 'Đang điều tra', cls: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  'in-progress': { label: 'Đang xử lý', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  resolved: { label: 'Đã xác nhận', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Nghiêm trọng', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  high: { label: 'Cao', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  medium: { label: 'Trung bình', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
};

export default function IssueHub() {
  const { selectedCustomerPhaseId } = useCXM();
  const [theme, setTheme] = useState('Tất cả chủ đề');
  const [selectedId, setSelectedId] = useState<string | null>('BP-024');
  const issues = useMemo(() => BREAKPOINTS.filter((issue) => (theme === 'Tất cả chủ đề' || issue.theme === theme) && (selectedCustomerPhaseId === 'all' || customerPhaseForLegacyId(issue.phaseId).id === selectedCustomerPhaseId)), [theme, selectedCustomerPhaseId]);
  const selected = BREAKPOINTS.find((issue) => issue.id === selectedId) ?? null;
  const open = BREAKPOINTS.filter((issue) => issue.status !== 'resolved');
  const breached = BREAKPOINTS.filter((issue) => issue.severity === 'critical' && issue.status !== 'resolved');

  return <div className="relative space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><MessageSquareText className="h-5 w-5 text-primary" />CX Issue Hub</h1><p className="mt-1 text-sm text-muted-foreground">Closed-loop management: feedback đa kênh → điểm gãy → ticket có owner, SLA và KPI liên quan</p></div>
      <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110"><TicketCheck className="h-3.5 w-3.5" />Tạo CX ticket</button>
    </div>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatCard icon={<AlertOctagon className="h-4 w-4" />} label="Điểm gãy đang mở" value={String(open.length)} accent sub="Đã gộp theo touchpoint và intent" />
      <StatCard icon={<Siren className="h-4 w-4" />} label="Vi phạm SLA" value={String(breached.length)} sub="1 breakpoint cần phản hồi trong 4 giờ" />
      <StatCard icon={<MessageSquareText className="h-4 w-4" />} label="Feedback tiêu cực" value="220" sub="7 ngày gần nhất · đa kênh" />
      <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Closed-loop rate" value="76%" sub="Feedback đã được phản hồi hoặc xử lý" />
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card-gradient rounded-xl border border-border p-5">
        <SectionTitle title="Điểm gãy ưu tiên" desc="Gộp feedback, ticket vận hành và tín hiệu hành vi theo cùng touchpoint" right={<div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5 text-muted-foreground" /><select value={theme} onChange={(event) => setTheme(event.target.value)} className="rounded-lg border border-input bg-muted/60 px-3 py-1.5 text-xs outline-none"><option>Tất cả chủ đề</option><option>eKYC</option><option>Nạp/rút tiền</option><option>Đặt lệnh</option></select></div>} />
        <div className="overflow-x-auto"><div className="min-w-[780px]">
          <div className="grid grid-cols-[1.7fr_.8fr_.85fr_1fr_.8fr] gap-3 border-b border-border px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><span>Điểm gãy / evidence</span><span>Mức độ</span><span>Tín hiệu</span><span>Owner / ticket</span><span>Trạng thái</span></div>
          <div className="divide-y divide-border">{issues.map((issue) => <button type="button" key={issue.id} onClick={() => setSelectedId(issue.id)} className={cn('grid w-full grid-cols-[1.7fr_.8fr_.85fr_1fr_.8fr] gap-3 px-3 py-4 text-left transition-colors hover:bg-secondary/50', selectedId === issue.id && 'bg-primary/5')}>
            <span><span className="font-mono text-[10px] text-muted-foreground">{issue.id}</span><span className="mt-1 block text-xs font-semibold text-foreground">{issue.title}</span><span className="mt-1 block text-[10px] text-muted-foreground">{customerPhaseForLegacyId(issue.phaseId).code} · {issue.touchpoint}</span></span>
            <span><Badge meta={SEVERITY_META[issue.severity]} /></span><span><span className="block text-xs font-semibold text-foreground">{issue.volume} cases</span><span className={cn('mt-1 block text-[10px]', issue.trend.startsWith('+') ? 'text-rose-300' : 'text-emerald-300')}>{issue.trend}</span></span><span><span className="block text-xs text-foreground">{issue.owner}</span><span className="mt-1 block font-mono text-[10px] text-primary">{issue.ticketId}</span></span><span><Badge meta={STATUS_META[issue.status]} /></span>
          </button>)}</div>
        </div></div>
      </section>
      <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5"><SectionTitle title="SLA cần chú ý" desc="Ưu tiên theo tác động khách hàng" /><div className="space-y-3"><div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-rose-200"><Siren className="h-3.5 w-3.5" />CXM-142 quá SLA 48 phút</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Chưa có phản hồi đầu tiên cho cụm nạp tiền treo.</p></div><div className="rounded-lg border border-border bg-card p-3"><div className="flex items-center gap-2 text-xs font-semibold"><Clock3 className="h-3.5 w-3.5 text-primary" />6 ticket chờ triage</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Tự động route theo intent, touchpoint và squad sở hữu.</p></div><div className="rounded-lg border border-border bg-card p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quy tắc đóng vòng lặp</div><p className="mt-1 text-xs leading-5 text-foreground">Ticket chỉ đóng khi đã xác nhận fix và gửi phản hồi cho khách hàng.</p></div></div></section>
    </div>
    {selected && <IssueDetail issue={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}

function Badge({ meta }: { meta: { label: string; cls: string } }) { return <span className={cn('inline-flex rounded border px-2 py-0.5 text-[10px] font-medium', meta.cls)}>{meta.label}</span>; }

function IssueDetail({ issue, onClose }: { issue: Breakpoint; onClose: () => void }) {
  const phase = customerPhaseForLegacyId(issue.phaseId);
  return <aside className="absolute inset-y-0 right-0 z-20 flex w-[430px] max-w-[94vw] flex-col border-l border-border bg-[hsl(222,46%,9%)] shadow-[-20px_0_50px_-24px_rgba(0,0,0,.8)]"><div className="flex items-start gap-3 border-b border-border p-5"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">{issue.id}</span><Badge meta={SEVERITY_META[issue.severity]} /></div><h2 className="mt-2 text-base font-semibold leading-snug">{issue.title}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"><section className="grid grid-cols-2 gap-2"><Info label="Owner" value={issue.owner} /><Info label="CX ticket" value={issue.ticketId} /><Info label="Trạng thái" value={STATUS_META[issue.status].label} /><Info label="KPI ảnh hưởng" value={issue.kpi} /></section><section className="rounded-lg border border-primary/20 bg-primary/5 p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Liên kết hành trình</div><div className="mt-1 text-xs font-semibold text-foreground">{phase.code} · {phase.name}</div><div className="mt-1 text-[11px] text-muted-foreground">{issue.touchpoint}</div></section><section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidence đã gộp</h3><div className="rounded-lg border border-border bg-card p-3 text-xs font-medium">{issue.signal}</div></section><section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Feedback gần nhất</h3><div className="space-y-2">{issue.feedback.map((feedback) => <div key={feedback.text} className="rounded-lg border border-border bg-card p-3"><div className="flex justify-between text-[10px] text-muted-foreground"><span>{feedback.channel}</span><span>{feedback.time}</span></div><p className="mt-1.5 text-xs leading-5 text-foreground">“{feedback.text}”</p></div>)}</div></section></div><div className="flex gap-2 border-t border-border p-4"><button className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Mở {issue.ticketId}</button><button className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"><ArrowUpRight className="h-3.5 w-3.5" /></button></div></aside>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-card p-2.5"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 truncate text-xs font-medium" title={value}>{value}</div></div>; }
