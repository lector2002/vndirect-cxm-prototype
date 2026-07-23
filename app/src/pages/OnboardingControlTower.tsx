import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  DatabaseZap,
  Eye,
  FileCheck2,
  Fingerprint,
  GitCommitHorizontal,
  LockKeyhole,
  MessageSquareQuote,
  Radio,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ONBOARDING_PILOT,
  validateOnboardingPilot,
  type ApprovalStatus,
  type DeliveryStatus,
  type LoopClosureStatus,
  type PilotAction,
  type PilotIssue,
  type PilotSeverity,
  type PilotStep,
  type ValidationStatus,
} from '@/data/onboarding-pilot';

const SEVERITY_META: Record<PilotSeverity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'border-rose-200 bg-rose-50 text-rose-700' },
  high: { label: 'High', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
  medium: { label: 'Medium', cls: 'border-sky-200 bg-sky-50 text-sky-700' },
};

const DELIVERY_LABEL: Record<DeliveryStatus, string> = {
  backlog: 'Chờ triển khai',
  'in-progress': 'Đang triển khai',
  released: 'Đã phát hành',
};

export default function OnboardingControlTower() {
  const [selectedIssueId, setSelectedIssueId] = useState(ONBOARDING_PILOT.issues[0].id);
  const [actions, setActions] = useState<PilotAction[]>(ONBOARDING_PILOT.actions);
  const [view, setView] = useState<'evidence' | 'action'>('evidence');
  const integrityErrors = validateOnboardingPilot();
  const selectedIssue = ONBOARDING_PILOT.issues.find((issue) => issue.id === selectedIssueId) ?? ONBOARDING_PILOT.issues[0];
  const selectedStep = ONBOARDING_PILOT.steps.find((step) => step.id === selectedIssue.stepId)!;
  const selectedMetric = ONBOARDING_PILOT.metrics.find((metric) => metric.id === selectedIssue.metricId)!;
  const selectedEvidence = ONBOARDING_PILOT.evidence.filter((item) => selectedIssue.evidenceRefs.includes(item.id));
  const selectedAction = actions.find((action) => action.id === selectedIssue.actionId)!;
  const successMetric = ONBOARDING_PILOT.metrics.find((metric) => metric.id === selectedAction.successMetricId)!;
  const totalStarted = ONBOARDING_PILOT.steps[0].entered;
  const totalActivated = ONBOARDING_PILOT.steps.at(-1)?.completed ?? 0;
  const completion = ((totalActivated / totalStarted) * 100).toFixed(1).replace('.', ',');
  const issueExposures = ONBOARDING_PILOT.issues.reduce((sum, issue) => sum + issue.affectedCustomers, 0);
  const openDecisions = actions.filter((action) => action.approval === 'pending').length;

  const updateAction = (patch: Partial<PilotAction>) => {
    setActions((current) => current.map((action) => action.id === selectedAction.id ? { ...action, ...patch } : action));
  };

  const captureOutcome = () => {
    if (selectedAction.outcome) {
      updateAction({ impactValidation: 'validated', loopClosure: 'ready' });
      return;
    }
    updateAction({
      impactValidation: 'monitoring',
      outcome: {
        observedValue: successMetric.target.replace('≥ ', ''),
        target: successMetric.target,
        period: 'Observation demo · 24 giờ sau release',
        sampleSize: 240,
        evidenceRef: `DEMO-RUN•••${selectedAction.id.slice(-3)}`,
      },
    });
  };

  return (
    <div className="min-w-[1180px] bg-[#f5f6f2] text-slate-900">
      <section className="border-b border-slate-200 bg-[#102d2a] px-7 py-6 text-white">
        <div className="mx-auto flex max-w-[1500px] items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Fingerprint className="h-4 w-4" /> Pilot · Securities Journey Control Tower
            </div>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight">{ONBOARDING_PILOT.journey.name}</h1>
            <p className="mt-1 text-sm text-slate-300">{ONBOARDING_PILOT.journey.scope}</p>
          </div>
          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-white/15 bg-white/5 text-xs">
            <HeaderMeta label="Taxonomy" value={ONBOARDING_PILOT.journey.version} />
            <HeaderMeta label="Provenance" value={ONBOARDING_PILOT.journey.source} />
            <HeaderMeta label="Dữ liệu" value={`Demo snapshot · ${ONBOARDING_PILOT.journey.asOf}`} warning />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1500px] space-y-5 p-6">
        <section className="grid grid-cols-[1.4fr_repeat(4,minmax(0,1fr))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-r border-slate-200 p-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">Cần quyết định</span>
              <span className="text-[11px] text-slate-500">Kết luận pilot</span>
            </div>
            <p className="mt-3 max-w-xl text-lg font-bold leading-7">Liveness là điểm gãy lớn nhất; 312 khách bị ảnh hưởng và evidence đủ để duyệt pilot recovery.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Không dùng sentiment đơn lẻ. Kết luận kết hợp funnel event, ticket lặp lại và app review đã masking.</p>
          </div>
          <MetricCard label="Hoàn tất hành trình" value={`${completion}%`} note="11.840 / 18.420 hồ sơ" tone="risk" />
          <MetricCard label="Issue exposures" value={issueExposures.toLocaleString('vi-VN')} note="Có thể trùng khách giữa các issue" />
          <MetricCard label="Evidence coverage" value="78%" note="6 nguồn đã nối issue" />
          <MetricCard label="Chờ phê duyệt" value={String(openDecisions)} note="Human approval bắt buộc" tone="warning" />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div><h2 className="text-sm font-bold">Canonical journey · 6 bước</h2><p className="mt-0.5 text-xs text-slate-500">Một taxonomy, stable ID và owner cho toàn bộ pilot.</p></div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500"><Legend dot="bg-emerald-500" label="Ổn định" /><Legend dot="bg-amber-500" label="Theo dõi" /><Legend dot="bg-rose-500" label="Điểm gãy" /></div>
          </div>
          <div className="grid grid-cols-6 px-5 py-5">
            {ONBOARDING_PILOT.steps.map((step, index) => <JourneyStep key={step.id} step={step} last={index === ONBOARDING_PILOT.steps.length - 1} />)}
          </div>
        </section>

        <section className="grid min-h-[520px] grid-cols-[370px_minmax(0,1fr)_360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <aside className="border-r border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Friction queue</p><h2 className="mt-1 text-sm font-bold">Điểm gãy cần xử lý</h2></div>
            <div className="divide-y divide-slate-100">
              {ONBOARDING_PILOT.issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} selected={issue.id === selectedIssue.id} action={actions.find((item) => item.id === issue.actionId)!} onClick={() => setSelectedIssueId(issue.id)} />
              ))}
            </div>
            <div className="m-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] leading-5 text-emerald-800">
              <div className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" /> Integrity check</div>
              <p className="mt-1">{integrityErrors.length === 0 ? '0 broken link · issue, evidence và action hợp lệ.' : `${integrityErrors.length} lỗi cần xử lý.`}</p>
            </div>
          </aside>

          <div className="min-w-0 border-r border-slate-200">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0"><div className="flex items-center gap-2"><span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold', SEVERITY_META[selectedIssue.severity].cls)}>{SEVERITY_META[selectedIssue.severity].label}</span><span className="font-mono text-[10px] text-slate-400">{selectedIssue.id}</span></div><h2 className="mt-2 truncate text-lg font-bold">{selectedIssue.title}</h2><p className="mt-1 text-xs text-slate-500">{selectedStep.code} · {selectedStep.name} · {selectedStep.owner}</p></div>
                <div className="text-right"><p className="text-[10px] uppercase tracking-wide text-slate-400">Priority score</p><p className="text-2xl font-bold text-[#0a6b5b]">{selectedIssue.priorityScore}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <MiniMetric label="Khách ảnh hưởng" value={selectedIssue.affectedCustomers.toLocaleString('vi-VN')} />
                <MiniMetric label="Repeat contact" value={`${selectedIssue.repeatContactRate}%`} />
                <MiniMetric label="Confidence" value={`${selectedIssue.confidence}%`} />
                <MiniMetric label="Xu hướng" value={`${selectedIssue.trend > 0 ? '+' : ''}${selectedIssue.trend}%`} risk={selectedIssue.trend > 0} />
              </div>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
              <TabButton active={view === 'evidence'} onClick={() => setView('evidence')} icon={<Eye className="h-3.5 w-3.5" />} label={`Evidence · ${selectedEvidence.length}`} />
              <TabButton active={view === 'action'} onClick={() => setView('action')} icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Decision & action" />
            </div>

            {view === 'evidence' ? (
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-slate-200 bg-[#f8faf7] p-4"><div className="flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4 text-[#0a6b5b]" /> Giả thuyết có evidence</div><p className="mt-2 text-sm leading-6 text-slate-700">{selectedIssue.hypothesis}</p><p className="mt-2 text-[10px] text-slate-500">Prototype rule-based synthesis · không phải AI production output.</p></div>
                <div className="space-y-2">{selectedEvidence.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}</div>
              </div>
            ) : (
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-[#b7d8cf] bg-[#f2faf7] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#0a6b5b]">Decision recommendation</p><p className="mt-2 text-sm font-semibold leading-6">{selectedIssue.decision}</p></div>
                <ActionTimeline action={selectedAction} />
              </div>
            )}
          </div>

          <aside className="bg-[#fbfcfa]">
            <div className="border-b border-slate-200 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Governed action</p><h2 className="mt-1 text-sm font-bold">{selectedAction.id}</h2></div>
            <div className="space-y-4 p-5">
              <div><p className="text-sm font-bold leading-5">{selectedAction.title}</p><div className="mt-3 grid grid-cols-2 gap-2"><Info label="Owner" value={selectedAction.owner} /><Info label="Accountable" value={selectedAction.accountable} /><Info label="Due" value={selectedAction.dueAt} /><Info label="Success metric" value={`${successMetric.name} ${successMetric.target}`} /></div></div>
              <WorkflowControl label="1. Phê duyệt" icon={<UserRoundCheck className="h-4 w-4" />} value={selectedAction.approval === 'approved' ? 'Đã phê duyệt' : 'Chờ phê duyệt'} done={selectedAction.approval === 'approved'} actionLabel="Phê duyệt pilot" disabled={selectedAction.approval === 'approved'} onAction={() => updateAction({ approval: 'approved' as ApprovalStatus })} />
              <WorkflowControl label="2. Delivery" icon={<GitCommitHorizontal className="h-4 w-4" />} value={DELIVERY_LABEL[selectedAction.delivery]} done={selectedAction.delivery === 'released'} actionLabel={selectedAction.delivery === 'backlog' ? 'Bắt đầu triển khai' : 'Đánh dấu phát hành'} disabled={selectedAction.approval !== 'approved' || selectedAction.delivery === 'released'} onAction={() => updateAction({ delivery: selectedAction.delivery === 'backlog' ? 'in-progress' : 'released', impactValidation: selectedAction.delivery === 'in-progress' ? 'monitoring' : selectedAction.impactValidation })} />
              {selectedAction.outcome && <div className="rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-sky-700">Post-release observation</p><div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-sky-900"><span>Quan sát: <b>{selectedAction.outcome.observedValue}</b></span><span>Mục tiêu: <b>{selectedAction.outcome.target}</b></span><span>Sample: <b>{selectedAction.outcome.sampleSize}</b></span><span>Evidence: <b>{selectedAction.outcome.evidenceRef}</b></span></div><p className="mt-2 text-[10px] text-sky-700">{selectedAction.outcome.period}</p></div>}
              <WorkflowControl label="3. Xác minh tác động" icon={<FileCheck2 className="h-4 w-4" />} value={validationLabel(selectedAction.impactValidation)} done={selectedAction.impactValidation === 'validated'} actionLabel={selectedAction.outcome ? 'Xác nhận observation' : 'Tạo observation demo'} disabled={selectedAction.delivery !== 'released' || selectedAction.impactValidation === 'validated'} onAction={captureOutcome} />
              <WorkflowControl label="4. Khép vòng" icon={<MessageSquareQuote className="h-4 w-4" />} value={loopLabel(selectedAction.loopClosure)} done={selectedAction.loopClosure === 'closed'} actionLabel="Xác nhận đã liên hệ" disabled={selectedAction.impactValidation !== 'validated' || selectedAction.loopClosure === 'closed'} onAction={() => updateAction({ loopClosure: 'closed' as LoopClosureStatus })} />
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-4 text-amber-800"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Mọi thay đổi chỉ mô phỏng trong phiên. Authentication, approval log và CRM/Jira chỉ là trạng thái giả lập ngoài phạm vi dự án.</div>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-[1.15fr_1fr] gap-5 pb-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Metric contract</h2><p className="mt-1 text-xs text-slate-500">Định nghĩa dùng để kiểm tra kết luận đang chọn.</p></div><DatabaseZap className="h-5 w-5 text-[#0a6b5b]" /></div><div className="mt-4 grid grid-cols-2 gap-3"><Info label="Metric" value={selectedMetric.name} /><Info label="Giá trị / mục tiêu" value={`${selectedMetric.value} / ${selectedMetric.target}`} /><Info label="Grain" value={selectedMetric.grain} /><Info label="Formula" value={selectedMetric.formula} /><Info label="Source" value={selectedMetric.source} /><Info label="Freshness" value={selectedMetric.freshness} /></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">Prototype readiness</h2><p className="mt-1 text-xs text-slate-500">Feature và trạng thái cần chốt trong UI prototype.</p></div><BadgeCheck className="h-5 w-5 text-emerald-600" /></div><div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3"><Readiness label="Canonical journey" done /><Readiness label="Evidence drill-down" done /><Readiness label="Issue → Action integrity" done /><Readiness label="Human approval states" done /><Readiness label="Persistence state simulation" /><Readiness label="Connector state simulation" /><Readiness label="RBAC & audit screens" /><Readiness label="AI insight states" /></div></div>
        </section>
      </div>
    </div>
  );
}

function HeaderMeta({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <div className="border-r border-white/10 px-4 py-3 last:border-r-0"><p className="text-[9px] uppercase tracking-wider text-slate-400">{label}</p><p className={cn('mt-1 max-w-52 truncate font-semibold', warning && 'text-amber-300')} title={value}>{value}</p></div>; }
function MetricCard({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'risk' | 'warning' }) { return <div className="flex flex-col justify-center border-r border-slate-200 p-5 last:border-r-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={cn('mt-2 text-3xl font-bold', tone === 'risk' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : 'text-[#0a6b5b]')}>{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>; }
function Legend({ dot, label }: { dot: string; label: string }) { return <span className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', dot)} />{label}</span>; }
function JourneyStep({ step, last }: { step: PilotStep; last: boolean }) { const conversion = ((step.completed / step.entered) * 100).toFixed(1).replace('.', ','); const color = step.status === 'critical' ? 'bg-rose-500' : step.status === 'watch' ? 'bg-amber-500' : 'bg-emerald-500'; return <div className="relative pr-4 last:pr-0"><div className={cn('absolute left-5 top-5 h-0.5 w-full bg-slate-200', last && 'hidden')} /><div className="relative flex items-center"><span className={cn('z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-[10px] font-bold text-white shadow-sm', color)}>{step.code}</span><ChevronRight className={cn('ml-auto h-4 w-4 text-slate-300', last && 'hidden')} /></div><p className="mt-3 pr-3 text-xs font-bold">{step.name}</p><p className="mt-1 text-[10px] text-slate-500">{conversion}% hoàn tất · {step.failed.toLocaleString('vi-VN')} fail</p><div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500"><Radio className="h-3 w-3" /> Evidence {step.evidenceCoverage}%</div></div>; }
function IssueRow({ issue, selected, action, onClick }: { issue: PilotIssue; selected: boolean; action: PilotAction; onClick: () => void }) { return <button type="button" onClick={onClick} className={cn('w-full border-l-4 px-4 py-4 text-left transition-colors', selected ? 'border-l-[#0a6b5b] bg-[#f0f8f5]' : 'border-l-transparent hover:bg-slate-50')}><div className="flex items-center justify-between"><span className={cn('rounded border px-1.5 py-0.5 text-[9px] font-bold', SEVERITY_META[issue.severity].cls)}>{SEVERITY_META[issue.severity].label}</span><span className="font-mono text-[9px] text-slate-400">{issue.id}</span></div><p className="mt-2 text-xs font-bold leading-5">{issue.title}</p><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>{issue.affectedCustomers.toLocaleString('vi-VN')} khách · confidence {issue.confidence}%</span><span className="flex items-center gap-1">{action.approval === 'pending' ? <Clock3 className="h-3 w-3 text-amber-600" /> : <Check className="h-3 w-3 text-emerald-600" />}{action.approval === 'pending' ? 'Chờ duyệt' : DELIVERY_LABEL[action.delivery]}</span></div></button>; }
function MiniMetric({ label, value, risk }: { label: string; value: string; risk?: boolean }) { return <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"><p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p><p className={cn('mt-1 text-sm font-bold', risk && 'text-rose-700')}>{value}</p></div>; }
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) { return <button type="button" onClick={onClick} className={cn('flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold', active ? 'border-[#0a6b5b] text-[#0a6b5b]' : 'border-transparent text-slate-500')}>{icon}{label}</button>; }
function EvidenceCard({ evidence }: { evidence: (typeof ONBOARDING_PILOT.evidence)[number] }) { return <article className="rounded-xl border border-slate-200 p-3.5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquareQuote className="h-4 w-4 text-[#0a6b5b]" /><span className="text-xs font-bold">{evidence.source}</span><span className="font-mono text-[9px] text-slate-400">{evidence.id}</span></div><span className="text-[10px] text-slate-400">{evidence.occurredAt}</span></div><p className="mt-2 text-xs leading-5 text-slate-700">“{evidence.maskedQuote}”</p><div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>{evidence.signal}</span><span className="flex items-center gap-1"><LockKeyhole className="h-3 w-3" />{evidence.customerKey} · {evidence.sourceRef}</span></div></article>; }
function ActionTimeline({ action }: { action: PilotAction }) { const rows = [{ label: 'Human approval', value: action.approval === 'approved' ? 'Đã phê duyệt' : 'Chờ phê duyệt', done: action.approval === 'approved' }, { label: 'Delivery', value: DELIVERY_LABEL[action.delivery], done: action.delivery === 'released' }, { label: 'Impact validation', value: validationLabel(action.impactValidation), done: action.impactValidation === 'validated' }, { label: 'Customer loop', value: loopLabel(action.loopClosure), done: action.loopClosure === 'closed' }]; return <div className="rounded-xl border border-slate-200"><div className="border-b border-slate-200 px-4 py-3 text-xs font-bold">Decision-to-outcome chain</div><div className="grid grid-cols-4 p-4">{rows.map((row, index) => <div key={row.label} className="relative pr-4"><div className={cn('absolute left-4 top-4 h-0.5 w-full bg-slate-200', index === rows.length - 1 && 'hidden')} /><span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white', row.done ? 'border-emerald-500 text-emerald-600' : 'border-slate-300 text-slate-400')}>{row.done ? <Check className="h-4 w-4" /> : <CircleDot className="h-3.5 w-3.5" />}</span><p className="mt-2 text-[10px] font-bold">{row.label}</p><p className="mt-1 text-[10px] text-slate-500">{row.value}</p></div>)}</div></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-slate-200 bg-white p-2.5"><p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-[11px] font-semibold leading-4 text-slate-700">{value}</p></div>; }
function WorkflowControl({ label, icon, value, done, actionLabel, disabled, onAction }: { label: string; icon: React.ReactNode; value: string; done: boolean; actionLabel: string; disabled: boolean; onAction: () => void }) { return <div className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center gap-2"><span className={cn('rounded-lg p-1.5', done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>{icon}</span><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="text-xs font-semibold">{value}</p></div></div><button type="button" disabled={disabled} onClick={onAction} className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0a6b5b] text-[10px] font-bold text-white transition-colors hover:bg-[#085448] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{done ? <Check className="h-3.5 w-3.5" /> : <RefreshCcw className="h-3.5 w-3.5" />}{done ? 'Hoàn tất' : actionLabel}</button></div>; }
function Readiness({ label, done }: { label: string; done?: boolean }) { return <div className="flex items-center gap-2 text-xs"><span className={cn('flex h-5 w-5 items-center justify-center rounded-full', done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400')}>{done ? <Check className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}</span><span className={done ? 'font-semibold' : 'text-slate-500'}>{label}</span></div>; }
function validationLabel(status: ValidationStatus) { return status === 'validated' ? 'Đã xác minh' : status === 'monitoring' ? 'Đang theo dõi' : 'Chưa bắt đầu'; }
function loopLabel(status: LoopClosureStatus) { return status === 'closed' ? 'Đã khép vòng' : status === 'ready' ? 'Sẵn sàng liên hệ' : 'Chưa đủ điều kiện'; }
