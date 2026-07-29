import { useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Eye,
  FileCheck2,
  Fingerprint,
  GitCommitHorizontal,
  Info,
  LockKeyhole,
  MessageSquareQuote,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_PILOT,
  validateOnboardingPilot,
  type PilotAction,
  type PilotIssue,
  type PilotSeverity,
} from '@/data/onboarding-pilot';

const SEVERITY: Record<PilotSeverity, { label: string; dot: string; badge: string }> = {
  critical: { label: 'Cần xử lý ngay', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  high: { label: 'Cần theo dõi', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  medium: { label: 'Đang quan sát', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
};

export default function CXControlTower() {
  const [params] = useSearchParams();
  const [scope, setScope] = useState('onboarding');
  const requestedIssueId = params.get('issue');
  const [selectedIssueId, setSelectedIssueId] = useState(ONBOARDING_PILOT.issues.some((item) => item.id === requestedIssueId) ? requestedIssueId! : ONBOARDING_PILOT.issues[0].id);
  const [actions, setActions] = useState<PilotAction[]>(ONBOARDING_PILOT.actions);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const integrityErrors = validateOnboardingPilot();

  const issue = ONBOARDING_PILOT.issues.find((item) => item.id === selectedIssueId) ?? ONBOARDING_PILOT.issues[0];
  const step = ONBOARDING_PILOT.steps.find((item) => item.id === issue.stepId)!;
  const metric = ONBOARDING_PILOT.metrics.find((item) => item.id === issue.metricId)!;
  const evidence = ONBOARDING_PILOT.evidence.filter((item) => issue.evidenceRefs.includes(item.id));
  const action = actions.find((item) => item.id === issue.actionId)!;
  const successMetric = ONBOARDING_PILOT.metrics.find((item) => item.id === action.successMetricId)!;
  const currentStage = getCurrentStage(action);

  const updateAction = (patch: Partial<PilotAction>) => {
    setActions((current) => current.map((item) => item.id === action.id ? { ...item, ...patch } : item));
  };

  const nextAction = () => {
    if (action.approval === 'pending') {
      updateAction({ approval: 'approved' });
      return;
    }
    if (action.delivery === 'backlog') {
      updateAction({ delivery: 'in-progress' });
      return;
    }
    if (action.delivery === 'in-progress') {
      updateAction({ delivery: 'released', impactValidation: 'monitoring' });
      return;
    }
    if (!action.outcome) {
      const observedValue = action.successMetricId === 'm-liveness' ? '88,7%' : action.successMetricId === 'm-contract' ? '97,4%' : '91,4%';
      updateAction({
        outcome: {
          observedValue,
          target: successMetric.target,
          period: 'Observation demo · 24 giờ sau release',
          sampleSize: 240,
          evidenceRef: `DEMO-RUN•••${action.id.slice(-3)}`,
        },
      });
      return;
    }
    if (action.impactValidation !== 'validated') {
      updateAction({ impactValidation: 'validated', loopClosure: 'ready' });
      return;
    }
    if (action.loopClosure !== 'closed') updateAction({ loopClosure: 'closed' });
  };

  const primaryAction = getPrimaryAction(action);
  const openIssues = ONBOARDING_PILOT.issues.filter((item) => actions.find((candidate) => candidate.id === item.actionId)?.loopClosure !== 'closed');
  const affectedTotal = openIssues.reduce((sum, item) => sum + item.affectedCustomers, 0);

  return (
    <div className="min-w-[1080px] bg-[#f6f7f4] text-slate-900">
      <header className="border-b border-slate-200 bg-white px-7 py-5">
        <div className="mx-auto flex max-w-[1440px] items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#087264]"><Fingerprint className="h-4 w-4" /> Customer Experience · Control Tower</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Một nơi điều hành mọi điểm gãy trải nghiệm</h1>
            <p className="mt-1 text-sm text-slate-500">Nhận issue từ behavioral, operational và VOC signals; điều phối xử lý rồi đánh giá outcome.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400" htmlFor="cx-scope">Phạm vi đang xem</label>
            <select id="cx-scope" value={scope} onChange={(event) => setScope(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none ring-[#087264]/20 focus:ring-4">
              <option value="onboarding">Mở tài khoản · Pilot</option>
              <option value="cash" disabled>Dòng tiền · Sắp prototype</option>
              <option value="trading" disabled>Giao dịch · Sắp prototype</option>
              <option value="wealth" disabled>Sản phẩm đầu tư · Sắp prototype</option>
              <option value="service" disabled>Chăm sóc & khiếu nại · Sắp prototype</option>
              <option value="retention" disabled>Retention & churn · Sắp prototype</option>
            </select>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800"><Info className="mr-1 inline h-3.5 w-3.5" />Demo data</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-5 p-6">
        <section className="grid grid-cols-[1fr_220px_220px] overflow-hidden rounded-2xl border border-slate-200 bg-[#123a35] text-white shadow-sm">
          <div className="p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">Scope · Mở tài khoản</p>
            <h2 className="mt-2 text-xl font-bold">Có {openIssues.length} điểm gãy chưa khép vòng trong hành trình mở tài khoản.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Điểm nghiêm trọng nhất nằm ở bước Liveness. Hệ thống đã liên kết funnel thất bại, liên hệ lặp lại và phản hồi khách hàng để tạo cảnh báo.</p>
          </div>
          <SummaryNumber label="Lượt ảnh hưởng" value={affectedTotal.toLocaleString('vi-VN')} note="Có thể trùng khách" />
          <SummaryNumber label="Đang chờ quyết định" value={String(actions.filter((item) => item.approval === 'pending').length)} note="Cần human approval" />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="text-sm font-bold">Vai trò của CX Control Tower</h2><p className="mt-0.5 text-xs text-slate-500">Một vòng điều hành thống nhất cho mọi domain; chỉ thay đổi scope và loại evidence.</p></div>
            <span className="text-[10px] text-slate-400">Ba bước từ tín hiệu đến kết quả</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <HowItWorks number="1" icon={<AlertTriangle className="h-4 w-4" />} title="Phát hiện" text="Kết hợp hành vi, lỗi và phản hồi để tìm điểm gãy." active={false} />
            <HowItWorks number="2" icon={<GitCommitHorizontal className="h-4 w-4" />} title="Xử lý" text="Duyệt đề xuất, giao owner và theo dõi thay đổi." active={currentStage === 2} />
            <HowItWorks number="3" icon={<FileCheck2 className="h-4 w-4" />} title="Đánh giá" text="Quan sát sau phát hành và xác nhận vấn đề đã cải thiện." active={currentStage === 3} />
          </div>
        </section>

        <section className="grid min-h-[570px] grid-cols-[330px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <aside className="border-r border-slate-200 bg-slate-50/60">
            <div className="border-b border-slate-200 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Điểm gãy đã phát hiện</p><h2 className="mt-1 text-sm font-bold">Chọn một trường hợp để xem</h2></div>
            <div className="space-y-2 p-3">
              {ONBOARDING_PILOT.issues.map((item) => {
                const itemAction = actions.find((candidate) => candidate.id === item.actionId)!;
                const selected = item.id === issue.id;
                return (
                  <button key={item.id} type="button" aria-pressed={selected} onClick={() => { setSelectedIssueId(item.id); setEvidenceOpen(false); setTechnicalOpen(false); }} className={cn('w-full rounded-xl border p-4 text-left transition-all', selected ? 'border-[#087264] bg-white shadow-sm ring-1 ring-[#087264]/15' : 'border-transparent bg-transparent hover:border-slate-200 hover:bg-white')}>
                    <div className="flex items-center justify-between"><span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold', item.severity === 'critical' ? 'text-rose-700' : item.severity === 'high' ? 'text-amber-700' : 'text-sky-700')}><span className={cn('h-2 w-2 rounded-full', SEVERITY[item.severity].dot)} />{SEVERITY[item.severity].label}</span><ChevronRight className="h-3.5 w-3.5 text-slate-400" /></div>
                    <p className="mt-2 text-xs font-bold leading-5">{item.title}</p>
                    <p className="mt-2 text-[10px] text-slate-500">{item.affectedCustomers.toLocaleString('vi-VN')} lượt ảnh hưởng · {shortActionStatus(itemAction)}</p>
                  </button>
                );
              })}
            </div>
            {integrityErrors.length > 0 && <div className="mx-4 mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-800"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />{integrityErrors.length} liên kết dữ liệu mẫu cần kiểm tra.</div>}
          </aside>

          <div className="min-w-0">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0"><div className="flex items-center gap-2"><span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', SEVERITY[issue.severity].badge)}>{SEVERITY[issue.severity].label}</span><span className="text-[10px] text-slate-400">Bước {step.code} · {step.name}</span></div><h2 className="mt-3 text-xl font-bold">{issue.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{plainLanguageFinding(issue)}</p></div>
                <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-right"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Độ tin cậy</p><p className="mt-1 text-xl font-bold text-[#087264]">{issue.confidence}%</p></div>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_310px] gap-6 p-6">
              <div className="space-y-5">
                <section>
                  <div className="flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4 text-[#087264]" /> Vì sao hệ thống phát hiện?</div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <SignalCard value={`${step.failed.toLocaleString('vi-VN')}`} label="lần thất bại tại bước này" />
                    <SignalCard value={`${issue.repeatContactRate}%`} label="liên hệ lại cùng vấn đề" />
                    <SignalCard value={`${issue.trend > 0 ? '+' : ''}${issue.trend}%`} label="thay đổi so với kỳ trước" risk={issue.trend > 0} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">Giả thuyết: {issue.hypothesis}</p>
                  <button type="button" aria-expanded={evidenceOpen} aria-controls="issue-evidence" onClick={() => setEvidenceOpen((open) => !open)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#087264] hover:underline"><Eye className="h-3.5 w-3.5" />{evidenceOpen ? 'Ẩn căn cứ chi tiết' : `Xem ${evidence.length} căn cứ chi tiết`}<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', evidenceOpen && 'rotate-180')} /></button>
                </section>

                {evidenceOpen && <section id="issue-evidence" className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="space-y-2">{evidence.map((item) => <EvidenceRow key={item.id} item={item} />)}</div><button type="button" aria-expanded={technicalOpen} onClick={() => setTechnicalOpen((open) => !open)} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-800"><BarChart3 className="h-3.5 w-3.5" />{technicalOpen ? 'Ẩn định nghĩa đo lường' : 'Xem định nghĩa đo lường'}</button>{technicalOpen && <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3"><Detail label="Metric" value={metric.name} /><Detail label="Giá trị / mục tiêu" value={`${metric.value} / ${metric.target}`} /><Detail label="Cách tính" value={metric.formula} /><Detail label="Độ mới dữ liệu" value={metric.freshness} /></div>}</section>}

                <section className="rounded-xl border border-[#b9d9d2] bg-[#f2faf7] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#087264]">Đề xuất xử lý</p>
                  <p className="mt-2 text-sm font-semibold leading-6">{issue.decision}</p>
                  <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500"><span>Owner: <b className="text-slate-700">{action.owner}</b></span><span>Hạn: <b className="text-slate-700">{action.dueAt}</b></span><span>Thành công khi: <b className="text-slate-700">{successMetric.name} {successMetric.target}</b></span></div>
                </section>
              </div>

              <aside className="rounded-2xl border border-slate-200 bg-[#fbfcfa] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Vòng xử lý</p>
                <h3 className="mt-1 text-sm font-bold">Bước tiếp theo</h3>
                <div className="mt-4 space-y-1"><LoopStep number="1" label="Duyệt đề xuất" done={action.approval === 'approved'} active={primaryAction.key === 'approve'} /><LoopStep number="2" label="Triển khai thay đổi" done={action.delivery === 'released'} active={primaryAction.key === 'start' || primaryAction.key === 'release'} /><LoopStep number="3" label="Đo sau thay đổi" done={action.impactValidation === 'validated'} active={primaryAction.key === 'observe' || primaryAction.key === 'validate'} /><LoopStep number="4" label="Khép vòng với khách" done={action.loopClosure === 'closed'} active={primaryAction.key === 'close'} last /></div>

                {action.outcome && <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-sky-700">Hệ thống ghi nhận</p><div className="mt-2 flex items-end justify-between"><div><p className="text-xl font-bold text-sky-900">{action.outcome.observedValue}</p><p className="text-[10px] text-sky-700">Mục tiêu {action.outcome.target}</p></div>{action.impactValidation === 'validated' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Clock3 className="h-5 w-5 text-sky-600" />}</div><p className="mt-2 text-[9px] text-sky-700">{action.outcome.period} · {action.outcome.sampleSize} mẫu · chờ người phụ trách kết luận</p></div>}

                {primaryAction.key !== 'done' ? <><p className="mt-5 text-[9px] font-bold uppercase tracking-wide text-slate-400">{primaryAction.actor}</p><button type="button" onClick={nextAction} className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087264] text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#065d52]"><Play className="h-4 w-4" />{primaryAction.label}</button></> : <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Vòng xử lý đã hoàn tất</div>}
                <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">Thao tác chỉ thay đổi trạng thái demo trong phiên.</p>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SummaryNumber({ label, value, note }: { label: string; value: string; note: string }) { return <div className="flex flex-col justify-center border-l border-white/10 px-6"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p><p className="mt-1 text-[10px] text-slate-400">{note}</p></div>; }
function HowItWorks({ number, icon, title, text, active }: { number: string; icon: React.ReactNode; title: string; text: string; active: boolean }) { return <div className={cn('flex items-start gap-3 rounded-xl border p-4', active ? 'border-[#87bdb1] bg-[#f1faf7]' : 'border-slate-200 bg-slate-50')}><span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', active ? 'bg-[#087264] text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200')}>{number}</span><div><div className="flex items-center gap-1.5 text-xs font-bold">{icon}{title}</div><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div></div>; }
function SignalCard({ value, label, risk }: { value: string; label: string; risk?: boolean }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><p className={cn('text-lg font-bold', risk ? 'text-rose-700' : 'text-slate-900')}>{value}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{label}</p></div>; }
function EvidenceRow({ item }: { item: (typeof ONBOARDING_PILOT.evidence)[number] }) { return <div className="rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-bold"><MessageSquareQuote className="h-3.5 w-3.5 text-[#087264]" />{item.source}</span><span className="text-[9px] text-slate-400">{item.occurredAt}</span></div><p className="mt-2 text-[11px] leading-5 text-slate-700">“{item.maskedQuote}”</p><p className="mt-1 text-[9px] text-slate-400"><LockKeyhole className="mr-1 inline h-3 w-3" />{item.customerKey} · {item.signal}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-[10px] font-semibold leading-4 text-slate-700">{value}</p></div>; }
function LoopStep({ number, label, done, active, last }: { number: string; label: string; done: boolean; active: boolean; last?: boolean }) { return <div className="relative flex min-h-12 items-start gap-3"><div className={cn('absolute left-[13px] top-7 h-full w-px', last ? 'hidden' : 'bg-slate-200')} /><span className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold', done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-[#087264] bg-white text-[#087264] ring-4 ring-[#087264]/10' : 'border-slate-200 bg-white text-slate-400')}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span><div className="pt-1"><p className={cn('text-[11px] font-semibold', done ? 'text-emerald-700' : active ? 'text-slate-900' : 'text-slate-400')}>{label}</p>{active && <p className="mt-0.5 text-[9px] text-[#087264]">Đang chờ thao tác</p>}</div></div>; }

function plainLanguageFinding(issue: PilotIssue) {
  if (issue.id === 'CXI-021') return 'Nhiều khách Android không vượt qua bước nhận diện khuôn mặt và phải thử lại hoặc liên hệ hỗ trợ. Tín hiệu đang tăng nên cần quyết định xử lý ngay.';
  if (issue.id === 'CXI-017') return 'Khách không biết hợp đồng đã được ký hay chưa khi phiên SmartCA hết hạn. Điều này tạo bỏ dở và liên hệ lại.';
  return 'Bản cập nhật reason code đã được phát hành. Hệ thống đang theo dõi evidence coverage để người phụ trách xác nhận thay đổi có đủ hiệu quả hay chưa.';
}

function getCurrentStage(action: PilotAction) { return action.delivery !== 'released' ? 2 : 3; }
function shortActionStatus(action: PilotAction) { if (action.loopClosure === 'closed') return 'Đã hoàn tất'; if (action.impactValidation === 'validated') return 'Chờ khép vòng'; if (action.delivery === 'released') return 'Đang đánh giá'; if (action.delivery === 'in-progress') return 'Đang sửa'; return action.approval === 'pending' ? 'Chờ duyệt' : 'Sẵn sàng xử lý'; }
function getPrimaryAction(action: PilotAction) {
  if (action.approval === 'pending') return { key: 'approve', actor: 'Người phụ trách quyết định', label: 'Duyệt đề xuất xử lý' };
  if (action.delivery === 'backlog') return { key: 'start', actor: 'Owner cập nhật trạng thái', label: 'Bắt đầu triển khai' };
  if (action.delivery === 'in-progress') return { key: 'release', actor: 'Owner cập nhật trạng thái', label: 'Đánh dấu đã phát hành' };
  if (!action.outcome) return { key: 'observe', actor: 'Hệ thống mô phỏng', label: 'Nhận dữ liệu đánh giá demo' };
  if (action.impactValidation !== 'validated') return { key: 'validate', actor: 'Người phụ trách kết luận', label: 'Xác nhận kết quả đánh giá' };
  if (action.loopClosure !== 'closed') return { key: 'close', actor: 'CX xác nhận trạng thái', label: 'Đánh dấu đã khép vòng' };
  return { key: 'done', actor: '', label: 'Hoàn tất' };
}
