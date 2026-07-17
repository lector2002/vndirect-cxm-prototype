import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, CircleDot, Milestone, Radio, Target, Users, X } from 'lucide-react';
import { kpiById } from '@/data/cxm';
import { coverageOf, findTouchpointById, fmtNum } from '@/lib/cxm-utils';
import { ChannelChip, CoverageBar, PlatformChips, StatusBadge } from '@/components/cxm-shared';
import { cn } from '@/lib/utils';
import { useCXM } from '@/store/CXMContext';
import { timeFrameById, volumeForTimeFrame } from '@/lib/timeframe';

type JourneyStage = { id: string; name: string; description: string; touchpointIds: string[] };
type JourneyFlow = { id: string; name: string; description: string; stages: JourneyStage[] };
type JourneyPhase = { id: string; code: string; name: string; subtitle: string; goal: string; moment: string; color: string; flows: JourneyFlow[] };

// Phase taxonomy follows customer-journey.md. Operational flow/stage mapping is reference material pending business validation.
const JOURNEY: JourneyPhase[] = [
  { id: 'reach', code: '01', name: 'Reach', subtitle: 'Tìm hiểu', goal: 'Hiểu VNDS/VNDGO có phù hợp và chủ động bắt đầu.', moment: 'Hiểu giá trị khác biệt và bấm Bắt đầu.', color: '#38bdf8', flows: [
    { id: 'acquisition', name: 'Khám phá & cân nhắc', description: 'Campaign, social, referral và nội dung giáo dục.', stages: [
      { id: 'reach-content', name: 'Tiếp cận nội dung', description: 'Xem campaign, landing page, nội dung và ưu đãi.', touchpointIds: ['tp-landing', 'tp-referral'] },
      { id: 'reach-cta', name: 'Bắt đầu hành trình', description: 'Bấm CTA mở tài khoản hoặc để lại thông tin.', touchpointIds: ['tp-landing', 'tp-leadform'] },
    ] },
  ] },
  { id: 'lead', code: '02', name: 'Lead', subtitle: 'Bắt đầu hành trình', goal: 'Đăng ký nhanh, xác thực OTP và có thể quay lại tiếp tục.', moment: 'Tạo account thành công, đăng nhập và thấy bước tiếp theo.', color: '#60a5fa', flows: [
    { id: 'registration', name: 'Đăng ký & account trải nghiệm', description: 'Thu thông tin, referral và khởi tạo hồ sơ.', stages: [
      { id: 'lead-form', name: 'Đăng ký thông tin', description: 'Nhập SĐT/email, đồng ý chính sách và tạo hồ sơ.', touchpointIds: ['tp-leadform'] },
      { id: 'lead-otp', name: 'Xác thực OTP', description: 'Xác thực số điện thoại trước khi vào nền tảng.', touchpointIds: ['tp-otp'] },
    ] },
  ] },
  { id: 'onboarding', code: '03', name: 'Onboarding', subtitle: 'Hoàn tất MTK & định hướng', goal: 'Mở tài khoản hợp lệ và biết cách bắt đầu đầu tư.', moment: 'Kích hoạt quyền giao dịch và nhận la bàn định hướng.', color: '#a78bfa', flows: [
    { id: 'account-opening', name: '3.1 Hoàn tất MTK', description: 'eKYC, chọn tài khoản, ký hợp đồng và kích hoạt.', stages: [
      { id: 'ekyc', name: 'Xác thực danh tính', description: 'CCCD/OCR, liveness và thông tin cá nhân.', touchpointIds: ['tp-idcapture', 'tp-liveness', 'tp-profile-form'] },
      { id: 'contract', name: 'Thiết lập & ký hợp đồng', description: 'Chọn số tài khoản, eContract và xét duyệt.', touchpointIds: ['tp-contract', 'tp-backoffice'] },
    ] },
    { id: 'investment-orientation', name: '3.2 OB & định hướng đầu tư', description: 'Welcome, khám phá nền tảng, KYC/RNX và chọn track.', stages: [
      { id: 'orientation-welcome', name: 'Khám phá & chuẩn bị đầu tư', description: 'Welcome, dashboard, watchlist và kiến thức cơ bản.', touchpointIds: ['tp-market', 'tp-push-ftd'] },
      { id: 'orientation-track', name: 'La bàn & chọn track', description: 'KYC/RNX, kết quả định hướng và đề xuất sản phẩm.', touchpointIds: [] },
    ] },
  ] },
  { id: 'be-in', code: '04', name: 'Be In', subtitle: 'Trải nghiệm đầu tư', goal: 'Nạp tiền, thực hiện hành động đầu tiên và được đồng hành.', moment: 'Hành động đầu tiên thành công đúng lúc.', color: '#fbbf24', flows: [
    { id: 'first-funding', name: 'Nạp tiền & sẵn sàng giao dịch', description: 'Liên kết ngân hàng, nạp tiền và xác nhận số dư.', stages: [
      { id: 'bank-link', name: 'Liên kết ngân hàng', description: 'Đăng ký tài khoản ngân hàng và phương thức nộp/rút.', touchpointIds: ['tp-banklink'] },
      { id: 'first-deposit', name: 'Nạp tiền lần đầu', description: 'Tạo lệnh nạp, callback ngân hàng và ghi có.', touchpointIds: ['tp-deposit', 'tp-payment-gw'] },
    ] },
    { id: 'first-investment', name: 'Hành động đầu tư đầu tiên', description: 'Khám phá thị trường, đặt lệnh và xác nhận kết quả.', stages: [
      { id: 'discover-invest', name: 'Khám phá cơ hội đầu tư', description: 'Bảng giá, tìm kiếm mã và nghiên cứu sản phẩm.', touchpointIds: ['tp-market'] },
      { id: 'first-order', name: 'Đặt & khớp lệnh đầu', description: 'Mở vé lệnh, đặt lệnh, khớp và nhận xác nhận.', touchpointIds: ['tp-orderticket', 'tp-matching', 'tp-portfolio-first'] },
    ] },
  ] },
  { id: 'engage', code: '05', name: 'Engage & Advocacy', subtitle: 'Gắn bó & giới thiệu', goal: 'Duy trì active, tăng giá trị tài sản, loyalty và advocacy.', moment: 'Khách hàng tiếp tục dùng và sẵn sàng giới thiệu.', color: '#34d399', flows: [
    { id: 'active-investing', name: 'Đầu tư & quản lý tài sản', description: 'Giao dịch thường xuyên, danh mục, nộp/rút và sản phẩm mở rộng.', stages: [
      { id: 'daily-investing', name: 'Giao dịch & quản lý danh mục', description: 'Phiên giao dịch, lệnh, danh mục và báo cáo.', touchpointIds: ['tp-daily', 'tp-portfolio', 'tp-withdraw'] },
      { id: 'wealth-services', name: 'Sản phẩm & dịch vụ mở rộng', description: 'Margin, trái phiếu, quỹ và DCA.', touchpointIds: ['tp-bond', 'tp-dca', 'tp-advance'] },
    ] },
    { id: 'advocacy-care', name: 'Chăm sóc, feedback & advocacy', description: 'Support, NPS/CSAT, loyalty, referral và winback.', stages: [
      { id: 'support-feedback', name: 'Hỗ trợ & phản hồi', description: 'Ticket, CSAT và khảo sát trải nghiệm.', touchpointIds: ['tp-support', 'tp-nps'] },
      { id: 'loyalty-advocacy', name: 'Gắn bó & giới thiệu', description: 'Chăm sóc chủ động, referral và tái kích hoạt.', touchpointIds: ['tp-referral', 'tp-broker-crm'] },
    ] },
  ] },
];

function stageSignals(stage: JourneyStage) {
  return stage.touchpointIds.flatMap((id) => findTouchpointById(id)?.touchpoint.events ?? []);
}

export default function JourneyTree() {
  const { selectedCustomerPhaseId, selectedTimeFrameId } = useCXM();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [flowDrawerPhase, setFlowDrawerPhase] = useState<JourneyPhase | null>(null);
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(null);
  const selectedPhase = JOURNEY.find((phase) => phase.id === selectedPhaseId) ?? null;
  const selectedFlow = selectedPhase?.flows.find((flow) => flow.id === selectedFlowId) ?? selectedPhase?.flows[0] ?? null;

  const selectFlow = (phase: JourneyPhase, flowId: string) => {
    setSelectedPhaseId(phase.id);
    setSelectedFlowId(flowId);
    setSelectedStage(null);
    setFlowDrawerPhase(null);
  };

  return <div className="relative min-h-full p-6">
    {selectedPhase && selectedFlow ? <PhaseJourneyBoard phase={selectedPhase} flow={selectedFlow} onBack={() => { setSelectedPhaseId(null); setSelectedFlowId(null); }} onSelectFlow={() => setFlowDrawerPhase(selectedPhase)} onSelectStage={setSelectedStage} timeFrameId={selectedTimeFrameId} /> : <PhaseOverview onSelect={setFlowDrawerPhase} phaseFilter={selectedCustomerPhaseId} timeFrameId={selectedTimeFrameId} />}
    {flowDrawerPhase && <FlowDrawer phase={flowDrawerPhase} onClose={() => setFlowDrawerPhase(null)} onSelectFlow={(flowId) => selectFlow(flowDrawerPhase, flowId)} />}
    {selectedStage && selectedPhase && <StageDrawer stage={selectedStage} phase={selectedPhase} onClose={() => setSelectedStage(null)} timeFrameId={selectedTimeFrameId} />}
  </div>;
}

function PhaseOverview({ onSelect, phaseFilter, timeFrameId }: { onSelect: (phase: JourneyPhase) => void; phaseFilter: string; timeFrameId: Parameters<typeof volumeForTimeFrame>[1] }) {
  const phases = JOURNEY.filter((phase) => phaseFilter === 'all' || phase.id === phaseFilter);
  const gridColumns = phases.length === 1 ? 'grid-cols-1' : phases.length === 2 ? 'grid-cols-2' : phases.length === 3 ? 'grid-cols-3' : phases.length === 4 ? 'grid-cols-4' : 'grid-cols-5';
  const timeFrame = timeFrameById(timeFrameId);
  return <div className="mx-auto max-w-[1550px]"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">CXM Journey Board</p><h1 className="mt-1 text-2xl font-bold">Hành trình khách hàng VNDIRECT / VNDGO</h1><p className="mt-2 text-sm text-muted-foreground">Bấm một station để mở danh sách flow ở drawer bên phải.</p></div><div className="relative min-h-[620px] overflow-x-auto rounded-2xl border border-border bg-[hsl(222,45%,8%)] p-8"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(hsl(217_20%_30%)_1px,transparent_1px)] [background-size:14px_14px]" /><div className="relative min-w-[1140px]"><div className="absolute left-20 right-20 top-[202px] h-1 rounded-full bg-primary/40" /><div className={cn('grid gap-5', gridColumns)}>{phases.map((phase, index) => { const signals = phase.flows.flatMap((flow) => flow.stages.flatMap(stageSignals)); const cov = coverageOf(signals); const volume = volumeForTimeFrame(signals.reduce((sum, signal) => sum + signal.volumePerDay, 0), timeFrameId); return <button key={phase.id} onClick={() => onSelect(phase)} className="group relative z-10 text-left"><div className="rounded-xl border border-border bg-card p-4 transition-colors group-hover:border-primary/60"><div className="flex items-center justify-between"><span className="rounded-lg px-2 py-1 text-[10px] font-bold" style={{ background: `${phase.color}22`, color: phase.color }}>{phase.code}</span><ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" /></div><h2 className="mt-3 text-sm font-bold">{phase.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">{phase.subtitle}</p><p className="mt-3 line-clamp-2 text-[10px] leading-4 text-foreground/70">{phase.moment}</p></div><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border-4 border-[hsl(222,45%,8%)] text-xs font-bold transition-transform group-hover:scale-110" style={{ background: phase.color, color: '#08111e' }}>{index + 1}</span><div className="rounded-xl border border-border bg-card p-4 transition-colors group-hover:border-primary/40"><div className="flex items-baseline justify-between"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Data station</span><span className="text-base font-bold" style={{ color: phase.color }}>{cov.score}%</span></div><CoverageBar stats={cov} height="h-2" /><div className="mt-3 grid grid-cols-2 gap-y-2 text-[10px]"><span className="text-emerald-300">{cov.live} live</span><span className="text-sky-300">{cov.validating} validate</span><span className="text-rose-300">{cov.gap} gap</span><span className="text-right text-muted-foreground">{signals.length} signal</span></div><div className="mt-3 border-t border-border pt-3"><div className="text-[10px] text-muted-foreground">Volume · {timeFrame.label}</div><div className="mt-0.5 text-sm font-semibold">{volume ? fmtNum(volume) : '—'}</div></div></div></button> })}</div></div></div></div>;
}

function PhaseJourneyBoard({ phase, flow, onBack, onSelectFlow, onSelectStage, timeFrameId }: { phase: JourneyPhase; flow: JourneyFlow; onBack: () => void; onSelectFlow: () => void; onSelectStage: (stage: JourneyStage) => void; timeFrameId: Parameters<typeof volumeForTimeFrame>[1] }) {
  return <div className="mx-auto max-w-[1550px]"><div className="mb-5 flex items-start justify-between gap-4"><div><button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Tất cả phase</button><div className="flex items-center gap-3"><span className="rounded-lg px-2 py-1 text-xs font-bold" style={{ background: `${phase.color}22`, color: phase.color }}>{phase.code}</span><h1 className="text-2xl font-bold">{phase.name}</h1><span className="text-sm text-muted-foreground">{phase.subtitle}</span></div><p className="mt-2 text-sm text-muted-foreground">{phase.goal}</p></div><button onClick={onSelectFlow} className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-medium text-primary hover:bg-primary/20">Đổi flow</button></div><div className="relative min-h-[620px] overflow-hidden rounded-2xl border border-border bg-[hsl(222,45%,8%)] p-7"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(hsl(217_20%_30%)_1px,transparent_1px)] [background-size:14px_14px]" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: phase.color }}>Flow đang xem</p><h2 className="mt-1 text-xl font-bold">{flow.name}</h2><p className="mt-1 text-sm text-muted-foreground">{flow.description}</p><div className="relative mt-20"><div className="absolute left-10 right-10 top-6 h-1 rounded-full" style={{ background: `${phase.color}66` }} /><div className={cn('relative grid gap-5', flow.stages.length > 2 ? 'grid-cols-3' : 'grid-cols-2')}>{flow.stages.map((stage, index) => <MetroStage key={stage.id} stage={stage} index={index + 1} color={phase.color} onClick={() => onSelectStage(stage)} timeFrameId={timeFrameId} />)}</div></div></div></div></div>;
}

function FlowDrawer({ phase, onClose, onSelectFlow }: { phase: JourneyPhase; onClose: () => void; onSelectFlow: (id: string) => void }) {
  return <div className="absolute inset-y-0 right-0 z-20 flex w-[380px] max-w-[94vw] flex-col border-l border-border bg-[hsl(222,46%,9%)] shadow-[-20px_0_60px_-24px_rgba(0,0,0,.9)]"><div className="border-b border-border p-5"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded-lg px-2 py-1 text-[10px] font-bold" style={{ background: `${phase.color}22`, color: phase.color }}>{phase.code}</span><span className="text-xs text-muted-foreground">{phase.subtitle}</span></div><h2 className="mt-2 text-lg font-bold">{phase.name}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Chọn flow để xem metro stage và data.</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Đóng"><X className="h-4 w-4" /></button></div></div><div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{phase.flows.map((flow, index) => { const signals = flow.stages.flatMap(stageSignals); const cov = coverageOf(signals); return <button key={flow.id} onClick={() => onSelectFlow(flow.id)} className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-secondary/50"><div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: `${phase.color}22`, color: phase.color }}>{index + 1}</span><div className="min-w-0 flex-1"><div className="text-sm font-semibold">{flow.name}</div><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{flow.description}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></div><div className="mt-4"><CoverageBar stats={cov} height="h-1.5" /></div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{flow.stages.length} stage</span><span>{signals.length} signal · {cov.score}%</span></div></button> })}</div></div>;
}

function MetroStage({ stage, index, color, onClick, timeFrameId }: { stage: JourneyStage; index: number; color: string; onClick: () => void; timeFrameId: Parameters<typeof volumeForTimeFrame>[1] }) {
  const signals = stageSignals(stage); const cov = coverageOf(signals); const volume = volumeForTimeFrame(signals.reduce((sum, signal) => sum + signal.volumePerDay, 0), timeFrameId); const timeFrame = timeFrameById(timeFrameId);
  return <button onClick={onClick} className="group relative text-left"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-[hsl(222,45%,8%)] text-sm font-bold transition-transform group-hover:scale-110" style={{ background: color, color: '#08111e' }}>{index}</span><div className="mt-4 rounded-xl border border-border bg-card p-4 transition-colors group-hover:border-primary/60"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold leading-snug">{stage.name}</h3><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" /></div><p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{stage.description}</p><div className="mt-4 flex items-end justify-between"><div><div className="text-[10px] text-muted-foreground">Volume · {timeFrame.label}</div><div className="mt-0.5 text-sm font-bold">{volume ? fmtNum(volume) : '—'}</div></div><div className="text-right"><div className="text-[10px] text-muted-foreground">Coverage</div><div className="mt-0.5 text-sm font-bold" style={{ color }}>{cov.score}%</div></div></div><div className="mt-3"><CoverageBar stats={cov} height="h-1.5" /></div><div className="mt-2 text-[10px] text-muted-foreground">{signals.length} signal · {cov.gap} gap</div></div></button>;
}

function StageDrawer({ stage, phase, onClose, timeFrameId }: { stage: JourneyStage; phase: JourneyPhase; onClose: () => void; timeFrameId: Parameters<typeof volumeForTimeFrame>[1] }) {
  const entries = useMemo(() => stage.touchpointIds.map(findTouchpointById).filter(Boolean), [stage]);
  const signals = stageSignals(stage); const cov = coverageOf(signals); const kpis = [...new Set(signals.flatMap((signal) => signal.kpiIds))].map(kpiById).filter(Boolean);
  const timeFrame = timeFrameById(timeFrameId);
  return <div className="absolute inset-y-0 right-0 z-30 flex w-[520px] max-w-[96vw] flex-col border-l border-border bg-[hsl(222,46%,9%)] shadow-[-20px_0_60px_-24px_rgba(0,0,0,.9)]"><div className="border-b border-border p-5"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Milestone className="h-3.5 w-3.5" style={{ color: phase.color }} />{phase.name}</div><h2 className="mt-2 text-lg font-bold">{stage.name}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{stage.description}</p></div><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Đóng"><X className="h-4 w-4" /></button></div><div className="mt-4"><div className="mb-1 flex justify-between text-[11px] text-muted-foreground"><span>Signal coverage tại stage</span><span className="font-bold text-foreground">{cov.score}%</span></div><CoverageBar stats={cov} height="h-2" /></div></div><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"><section><h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><CircleDot className="h-3.5 w-3.5 text-primary" /> Touchpoint trong stage</h3><div className="space-y-2">{entries.length ? entries.map((entry) => entry && <div key={entry.touchpoint.id} className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2"><span className="min-w-0 flex-1 text-xs font-medium">{entry.touchpoint.name}</span><ChannelChip channel={entry.touchpoint.channel} /></div><p className="mt-1 text-[11px] text-muted-foreground">{entry.touchpoint.description}</p><div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-3 w-3" />{fmtNum(volumeForTimeFrame(entry.touchpoint.dailyUsers, timeFrameId))} KH / {timeFrame.label}</span><span>Owner: {entry.touchpoint.owner}</span></div></div>) : <Empty text="Mapping vận hành chưa có touchpoint/signal đo lường." />}</div></section><section><h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Radio className="h-3.5 w-3.5 text-primary" /> Data đang đo ({signals.length})</h3><div className="space-y-2">{signals.length ? signals.map((signal) => <div key={signal.id} className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2"><code className="min-w-0 flex-1 truncate text-[11px] font-medium">{signal.name}</code><StatusBadge status={signal.status} size="xs" /></div><p className="mt-1 text-[11px] text-muted-foreground">{signal.description}</p><div className="mt-2 flex items-center justify-between gap-2"><PlatformChips platforms={signal.platforms} /><span className="text-[10px] text-muted-foreground">{signal.volumePerDay ? `${fmtNum(volumeForTimeFrame(signal.volumePerDay, timeFrameId))} / ${timeFrame.label}` : 'Chưa ghi nhận'}</span></div></div>) : <Empty text="Chưa có event được mapping cho stage này." />}</div></section><section><h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Target className="h-3.5 w-3.5 text-primary" /> KPI liên quan</h3><div className="flex flex-wrap gap-2">{kpis.length ? kpis.map((kpi) => kpi && <div key={kpi.id} className="rounded-lg border border-border bg-card px-3 py-2 text-[11px]"><div className="font-medium">{kpi.name}</div><div className="mt-0.5 text-muted-foreground">{kpi.value} · Target {kpi.target}</div></div>) : <Empty text="Chưa xác định KPI liên quan." />}</div></section></div></div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground">{text}</div>; }
