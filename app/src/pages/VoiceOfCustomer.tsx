import { useState } from 'react';
import { Link } from 'react-router';
import { Bot, ChevronRight, CircleAlert, Database, MessageSquareQuote, Search, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { PRODUCT_VOICE, VOICE_SOURCES, type ProductVoice, type VoiceDecision } from '@/data/voice-of-customer';
import { cn } from '@/lib/utils';

const DECISION_STYLE: Record<VoiceDecision, string> = {
  'Mở rộng': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Cải thiện': 'border-amber-200 bg-amber-50 text-amber-700',
  'Khảo sát thêm': 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function VoiceOfCustomer() {
  const [selectedId, setSelectedId] = useState('voc-bond');
  const selected = PRODUCT_VOICE.find((item) => item.id === selectedId) ?? PRODUCT_VOICE[0];
  const responses = PRODUCT_VOICE.reduce((sum, item) => sum + item.responses, 0);
  const weightedPositive = Math.round(PRODUCT_VOICE.reduce((sum, item) => sum + item.positive * item.responses, 0) / responses);
  const deteriorating = PRODUCT_VOICE.filter((item) => item.trend < 0).length;

  return (
    <div className="flex min-h-full min-w-[1100px] flex-col bg-slate-50/50">
      <header className="border-b border-border bg-white px-6 py-5">
        <div className="flex items-start justify-between gap-8">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Voice of Customer</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Voice Insights</h1><p className="mt-1 text-xs text-muted-foreground">Hiểu khách hàng đang nói gì, vì sao và xu hướng nào cần chuyển thành CX issue.</p></div>
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">Demo snapshot · 17/07/2026</span>
        </div>
        <div className="mt-5 flex h-11 max-w-3xl items-center gap-3 rounded-xl border border-primary/25 bg-primary/[0.03] px-4 shadow-sm">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">Điều gì đang làm giảm niềm tin với sản phẩm đầu tư mới?</span>
          <span className="ml-auto rounded-md bg-white px-2 py-1 text-[9px] font-medium text-muted-foreground">AI answer · grounded</span>
        </div>
      </header>

      <section className="grid grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(150px,0.55fr))] border-b border-border bg-white">
        <div className="border-r border-border p-5"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary"><Bot className="h-3.5 w-3.5" />Executive answer</div><p className="mt-2 text-sm font-semibold leading-5">Niềm tin giảm tập trung ở iBond và Margin, không phải do thiếu nhu cầu mà do khách chưa hiểu rủi ro, thanh khoản và tổng chi phí.</p><p className="mt-1 text-[10px] text-muted-foreground">Kết luận từ 629 phản hồi liên quan · 4 nguồn · 2 segment chính</p></div>
        <Summary label="Feedback hợp nhất" value={responses.toLocaleString('vi-VN')} note="5 nguồn tín hiệu" />
        <Summary label="Positive share" value={`${weightedPositive}%`} note="+3pt so với kỳ trước" tone="positive" />
        <Summary label="Theme giảm điểm" value={String(deteriorating)} note="iBond · Margin" tone="warning" />
      </section>

      <div className="grid min-h-[610px] flex-1 grid-cols-[230px_minmax(390px,0.9fr)_minmax(390px,1.1fr)]">
        <aside className="border-r border-border bg-white p-4">
          <SectionLabel icon={<Database className="h-3 w-3" />} label="Unified sources" />
          <div className="mt-3 space-y-1">{VOICE_SOURCES.map((item) => <div key={item.source} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[10px] hover:bg-slate-50"><span className="text-slate-700">{item.source}</span><span className="font-medium tabular-nums text-muted-foreground">{item.volume.toLocaleString('vi-VN')}</span></div>)}</div>
          <div className="my-4 border-t border-border" />
          <SectionLabel icon={<Search className="h-3 w-3" />} label="Adaptive taxonomy" />
          <div className="mt-3 space-y-1">{[...new Set(PRODUCT_VOICE.map((item) => item.theme))].map((theme) => { const count = PRODUCT_VOICE.filter((item) => item.theme === theme).reduce((sum, item) => sum + item.responses, 0); return <button key={theme} type="button" onClick={() => setSelectedId(PRODUCT_VOICE.find((item) => item.theme === theme)?.id ?? selectedId)} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] transition-colors hover:bg-slate-50', selected.theme === theme && 'bg-primary/5 text-primary')}><ChevronRight className="h-3 w-3" /><span className="min-w-0 flex-1 truncate font-medium">{theme}</span><span className="text-[9px] tabular-nums text-muted-foreground">{count.toLocaleString('vi-VN')}</span></button>; })}</div>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-slate-50 p-3"><p className="text-[9px] font-semibold text-foreground">Context đang áp dụng</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Sản phẩm · Touchpoint · Segment · Adoption · Business impact</p></div>
        </aside>

        <main className="border-r border-border bg-slate-50/60">
          <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3"><div><h2 className="text-xs font-bold">Themes cần chú ý</h2><p className="mt-0.5 text-[9px] text-muted-foreground">Xếp theo business impact, trend và evidence.</p></div><span className="text-[9px] text-muted-foreground">{PRODUCT_VOICE.length} insights</span></div>
          <div className="divide-y divide-border">{PRODUCT_VOICE.map((voice) => <InsightRow key={voice.id} voice={voice} active={voice.id === selected.id} onSelect={() => setSelectedId(voice.id)} />)}</div>
        </main>

        <aside className="bg-white">
          <div className="border-b border-border p-5"><div className="flex items-center justify-between gap-3"><span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-semibold', DECISION_STYLE[selected.decision])}>{selected.decision}</span><span className="text-[9px] text-muted-foreground">{selected.owner}</span></div><h2 className="mt-3 text-lg font-bold">{selected.product}</h2><p className="mt-1 text-[10px] text-muted-foreground">{selected.theme} / {selected.subtheme} · {selected.touchpointId}</p></div>
          <div className="space-y-5 p-5">
            <section><SectionLabel icon={<Sparkles className="h-3 w-3" />} label="Evidence-backed insight" /><p className="mt-2 text-xs font-medium leading-5 text-slate-800">{selected.insight}</p><div className="mt-3 grid grid-cols-3 gap-2"><Fact label="Positive" value={`${selected.positive}%`} tone="text-emerald-700" /><Fact label="Adoption" value={`${selected.adoption}%`} /><Fact label="Impact" value={selected.businessImpact} /></div></section>
            <section><SectionLabel icon={<MessageSquareQuote className="h-3 w-3" />} label={`Verbatim evidence (${selected.evidence.length})`} /><div className="mt-2 space-y-2">{selected.evidence.map((item) => <blockquote key={item.quote} className="rounded-lg border border-border bg-slate-50 p-3"><p className="text-[10px] leading-4 text-slate-700">“{item.quote}”</p><footer className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>{item.source}</span><span>{item.segment}</span></footer></blockquote>)}</div></section>
            <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4"><div className="flex items-center gap-2 text-[10px] font-semibold text-primary"><CircleAlert className="h-3.5 w-3.5" />Handoff sang Customer Experience</div><p className="mt-2 text-[11px] font-medium leading-5 text-slate-800">{selected.nextAction}</p><div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-[9px] text-muted-foreground"><span>Insight owner</span><strong className="text-foreground">{selected.owner}</strong></div>{selected.touchpointId === 'tp-bond' ? <Link to="/issues?issue=CXI-026" className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">Xem CX issue đã tạo <ChevronRight className="h-3 w-3" /></Link> : <span className="mt-3 block text-[9px] text-muted-foreground">Chỉ tạo CX issue khi có journey impact, affected scope và owner xử lý rõ ràng.</span>}</section>
            <p className="text-[9px] leading-4 text-muted-foreground">Voice of Customer kết thúc ở insight và handoff. Việc ưu tiên, xử lý và đo outcome thuộc Customer Experience.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InsightRow({ voice, active, onSelect }: { voice: ProductVoice; active: boolean; onSelect: () => void }) {
  const TrendIcon = voice.trend >= 0 ? TrendingUp : TrendingDown;
  return <button type="button" onClick={onSelect} aria-pressed={active} className={cn('w-full px-4 py-3.5 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', active && 'bg-white shadow-[inset_3px_0_0_hsl(var(--primary))]')}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-[11px] font-semibold">{voice.product}</span><span className={cn('rounded-full border px-1.5 py-0.5 text-[8px] font-semibold', DECISION_STYLE[voice.decision])}>{voice.decision}</span></div><p className="mt-1 truncate text-[9px] text-muted-foreground">{voice.theme} · {voice.subtheme}</p></div><span className={cn('flex shrink-0 items-center gap-1 text-[9px] font-semibold', voice.trend >= 0 ? 'text-emerald-700' : 'text-rose-700')}><TrendIcon className="h-3 w-3" />{Math.abs(voice.trend)}pt</span></div><div className="mt-3 flex items-end gap-3"><div className="flex h-8 flex-1 items-end gap-1" aria-label="Xu hướng sentiment 6 kỳ">{voice.trendPoints.map((point, index) => <span key={index} className={cn('flex-1 rounded-sm', voice.trend >= 0 ? 'bg-emerald-300' : 'bg-rose-300')} style={{ height: `${Math.max(20, point)}%` }} />)}</div><div className="text-right"><span className="block text-base font-bold tabular-nums">{voice.positive}%</span><span className="text-[8px] text-muted-foreground">{voice.responses.toLocaleString('vi-VN')} phản hồi</span></div></div></button>;
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) { return <h3 className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{icon}{label}</h3>; }
function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'positive' | 'warning' }) { return <div className="border-r border-border p-5 last:border-r-0"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn('mt-2 truncate text-2xl font-bold', tone === 'positive' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : 'text-foreground')}>{value}</p><p className="mt-1 text-[9px] text-muted-foreground">{note}</p></div>; }
function Fact({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="rounded-lg bg-slate-50 p-2.5"><p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn('mt-1 text-sm font-bold', tone)}>{value}</p></div>; }
