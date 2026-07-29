import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bot, ChevronRight, Database, LineChart, Search, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { PRODUCT_VOICE, VOICE_MONTHS, VOICE_SOURCES, type MonthlyPoint, type ProductVoice, type VoiceDecision } from '@/data/voice-of-customer';
import { TimeRangeFilter } from '@/components/charts/TimeRangeFilter';
import { RANGE_MONTHS, type RangeId } from '@/components/charts/time-range';
import { TopicTrendChart, MiniTrend } from '@/components/charts/TopicTrendChart';
import { cn } from '@/lib/utils';

const DECISION_STYLE: Record<VoiceDecision, string> = {
  'Mở rộng': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Cải thiện': 'border-amber-200 bg-amber-50 text-amber-700',
  'Khảo sát thêm': 'border-sky-200 bg-sky-50 text-sky-700',
};

function aggregateMonthly(): MonthlyPoint[] {
  return VOICE_MONTHS.map((month, index) => {
    let volume = 0;
    let weighted = 0;
    for (const voice of PRODUCT_VOICE) {
      const point = voice.monthly[index];
      volume += point.volume;
      weighted += point.positive * point.volume;
    }
    return { month, positive: Math.round(weighted / (volume || 1)), volume };
  });
}

export default function VoiceOfCustomer() {
  const [heroRange, setHeroRange] = useState<RangeId>('6m');
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const aggregate = useMemo(() => aggregateMonthly(), []);
  const themes = useMemo(() => [...new Set(PRODUCT_VOICE.map((item) => item.theme))], []);
  const visible = activeTheme ? PRODUCT_VOICE.filter((item) => item.theme === activeTheme) : PRODUCT_VOICE;

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

      <div className="grid flex-1 grid-cols-[230px_minmax(0,1fr)]">
        <aside className="border-r border-border bg-white p-4">
          <SectionLabel icon={<Database className="h-3 w-3" />} label="Unified sources" />
          <div className="mt-3 space-y-1">{VOICE_SOURCES.map((item) => <div key={item.source} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[10px] hover:bg-slate-50"><span className="text-slate-700">{item.source}</span><span className="font-medium tabular-nums text-muted-foreground">{item.volume.toLocaleString('vi-VN')}</span></div>)}</div>
          <div className="my-4 border-t border-border" />
          <SectionLabel icon={<Search className="h-3 w-3" />} label="Adaptive taxonomy" />
          <div className="mt-3 space-y-1">
            <button type="button" onClick={() => setActiveTheme(null)} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] transition-colors hover:bg-slate-50', activeTheme === null && 'bg-primary/5 text-primary')}><ChevronRight className="h-3 w-3" /><span className="min-w-0 flex-1 truncate font-medium">Tất cả chủ đề</span><span className="text-[9px] tabular-nums text-muted-foreground">{responses.toLocaleString('vi-VN')}</span></button>
            {themes.map((theme) => {
              const count = PRODUCT_VOICE.filter((item) => item.theme === theme).reduce((sum, item) => sum + item.responses, 0);
              return <button key={theme} type="button" onClick={() => setActiveTheme((current) => current === theme ? null : theme)} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] transition-colors hover:bg-slate-50', activeTheme === theme && 'bg-primary/5 text-primary')}><ChevronRight className="h-3 w-3" /><span className="min-w-0 flex-1 truncate font-medium">{theme}</span><span className="text-[9px] tabular-nums text-muted-foreground">{count.toLocaleString('vi-VN')}</span></button>;
            })}
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-border bg-slate-50 p-3"><p className="text-[9px] font-semibold text-foreground">Context đang áp dụng</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">Sản phẩm · Touchpoint · Segment · Adoption · Business impact</p></div>
        </aside>

        <main className="space-y-4 p-5">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex items-center gap-2 text-xs font-bold"><LineChart className="h-4 w-4 text-primary" />Topic & Xu hướng</div><p className="mt-0.5 text-[10px] text-muted-foreground">Sentiment tích cực và khối lượng phản hồi hợp nhất theo tháng gần đây.</p></div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 text-[9px] text-muted-foreground md:flex"><span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-primary" />Positive %</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />Khối lượng</span></div>
                <TimeRangeFilter value={heroRange} onChange={setHeroRange} />
              </div>
            </div>
            <div className="mt-4"><TopicTrendChart data={aggregate} months={RANGE_MONTHS[heroRange]} height={240} /></div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-xs font-bold">Themes cần chú ý</h2><p className="mt-0.5 text-[9px] text-muted-foreground">Bấm một topic để xem chủ đề con và số liệu chi tiết.</p></div><span className="text-[9px] text-muted-foreground">{visible.length} topic{activeTheme ? ` · ${activeTheme}` : ''}</span></div>
            <div className="grid grid-cols-[minmax(220px,1.4fr)_110px_120px_120px] gap-3 border-b border-border bg-slate-50 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground"><span>Topic / chủ đề chính</span><span>Xu hướng</span><span className="text-right">Positive</span><span className="text-right">Phản hồi</span></div>
            <div className="divide-y divide-border">{visible.map((voice) => <InsightRow key={voice.id} voice={voice} />)}</div>
          </section>
        </main>
      </div>
    </div>
  );
}

function InsightRow({ voice }: { voice: ProductVoice }) {
  const TrendIcon = voice.trend >= 0 ? TrendingUp : TrendingDown;
  return (
    <Link to={`/voice/${voice.id}`} className="grid grid-cols-[minmax(220px,1.4fr)_110px_120px_120px] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <div className="min-w-0">
        <div className="flex items-center gap-2"><span className="truncate text-[11px] font-semibold">{voice.product}</span><span className={cn('rounded-full border px-1.5 py-0.5 text-[8px] font-semibold', DECISION_STYLE[voice.decision])}>{voice.decision}</span></div>
        <p className="mt-1 truncate text-[9px] text-muted-foreground">{voice.theme} · {voice.subtheme}</p>
      </div>
      <div className="flex items-center gap-2"><MiniTrend data={voice.monthly} positive={voice.trend >= 0} /><span className={cn('flex shrink-0 items-center gap-0.5 text-[9px] font-semibold', voice.trend >= 0 ? 'text-emerald-700' : 'text-rose-700')}><TrendIcon className="h-3 w-3" />{Math.abs(voice.trend)}pt</span></div>
      <div className="text-right"><span className="block text-base font-bold tabular-nums">{voice.positive}%</span><span className="text-[8px] text-muted-foreground">positive share</span></div>
      <div className="flex items-center justify-end gap-2"><div className="text-right"><span className="block text-sm font-semibold tabular-nums">{voice.responses.toLocaleString('vi-VN')}</span><span className="text-[8px] text-muted-foreground">{voice.subthemes.length} chủ đề con</span></div><ChevronRight className="h-4 w-4 text-slate-300" /></div>
    </Link>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) { return <h3 className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{icon}{label}</h3>; }
function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'positive' | 'warning' }) { return <div className="border-r border-border p-5 last:border-r-0"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn('mt-2 truncate text-2xl font-bold', tone === 'positive' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : 'text-foreground')}>{value}</p><p className="mt-1 text-[9px] text-muted-foreground">{note}</p></div>; }
