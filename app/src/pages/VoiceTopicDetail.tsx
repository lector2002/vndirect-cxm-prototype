import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ChevronRight, CircleAlert, Layers, LineChart, MessageSquareQuote, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { PRODUCT_VOICE, type VoiceDecision } from '@/data/voice-of-customer';
import { TimeRangeFilter } from '@/components/charts/TimeRangeFilter';
import { RANGE_MONTHS, type RangeId } from '@/components/charts/time-range';
import { TopicTrendChart } from '@/components/charts/TopicTrendChart';
import { cn } from '@/lib/utils';

const DECISION_STYLE: Record<VoiceDecision, string> = {
  'Mở rộng': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Cải thiện': 'border-amber-200 bg-amber-50 text-amber-700',
  'Khảo sát thêm': 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function VoiceTopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const [range, setRange] = useState<RangeId>('6m');
  const voice = PRODUCT_VOICE.find((item) => item.id === topicId);

  if (!voice) {
    return (
      <div className="flex min-h-full min-w-[1100px] flex-col items-center justify-center gap-3 bg-slate-50/50 p-10 text-center">
        <p className="text-sm font-semibold text-foreground">Không tìm thấy topic này.</p>
        <Link to="/voice" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" />Quay lại Voice Insights</Link>
      </div>
    );
  }

  const TrendIcon = voice.trend >= 0 ? TrendingUp : TrendingDown;
  const subthemeTotal = voice.subthemes.reduce((sum, item) => sum + item.volume, 0) || 1;

  return (
    <div className="flex min-h-full min-w-[1100px] flex-col bg-slate-50/50">
      <header className="border-b border-border bg-white px-6 py-5">
        <Link to="/voice" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />Quay lại Voice Insights</Link>
        <div className="mt-3 flex items-start justify-between gap-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><span className={cn('rounded-full border px-2.5 py-1 text-[9px] font-semibold', DECISION_STYLE[voice.decision])}>{voice.decision}</span><span className="text-[10px] text-muted-foreground">{voice.theme} · {voice.subtheme} · {voice.touchpointId}</span></div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{voice.product}</h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{voice.insight}</p>
          </div>
          <div className="flex shrink-0 gap-6 rounded-xl border border-border bg-slate-50 px-5 py-3">
            <HeaderStat label="Positive" value={`${voice.positive}%`} tone="text-emerald-700" />
            <HeaderStat label="Xu hướng" value={`${voice.trend >= 0 ? '+' : ''}${voice.trend}pt`} tone={voice.trend >= 0 ? 'text-emerald-700' : 'text-rose-700'} icon={<TrendIcon className="h-3.5 w-3.5" />} />
            <HeaderStat label="Phản hồi" value={voice.responses.toLocaleString('vi-VN')} />
            <HeaderStat label="Owner" value={voice.owner} />
          </div>
        </div>
      </header>

      <main className="space-y-4 p-6">
        <section className="grid grid-cols-6 gap-3">
          <Kpi label="Positive" value={`${voice.positive}%`} tone="text-emerald-700" />
          <Kpi label="Neutral" value={`${voice.neutral}%`} />
          <Kpi label="Negative" value={`${voice.negative}%`} tone="text-rose-700" />
          <Kpi label="Adoption" value={`${voice.adoption}%`} />
          <Kpi label="Business impact" value={voice.businessImpact} />
          <Kpi label="Chủ đề con" value={String(voice.subthemes.length)} />
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div><div className="flex items-center gap-2 text-xs font-bold"><LineChart className="h-4 w-4 text-primary" />Xu hướng theo tháng</div><p className="mt-0.5 text-[10px] text-muted-foreground">Line = % positive sentiment · Bar = khối lượng phản hồi mỗi tháng.</p></div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 text-[9px] text-muted-foreground md:flex"><span className="flex items-center gap-1"><span className="h-0.5 w-4 rounded bg-primary" />Positive %</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />Khối lượng</span></div>
              <TimeRangeFilter value={range} onChange={setRange} />
            </div>
          </div>
          <div className="mt-4"><TopicTrendChart data={voice.monthly} months={RANGE_MONTHS[range]} height={280} /></div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-4">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-xs font-bold"><Layers className="h-4 w-4 text-primary" />Chủ đề con</div><span className="text-[9px] text-muted-foreground">{voice.subthemes.length} chủ đề · xếp theo khối lượng</span></div>
              <div className="divide-y divide-border">
                {[...voice.subthemes].sort((a, b) => b.volume - a.volume).map((sub) => {
                  const SubTrend = sub.trend >= 0 ? TrendingUp : TrendingDown;
                  const share = Math.round((sub.volume / subthemeTotal) * 100);
                  return (
                    <div key={sub.name} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold">{sub.name}</span>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="tabular-nums text-muted-foreground">{sub.volume.toLocaleString('vi-VN')} phản hồi</span>
                          <span className="w-10 text-right font-bold tabular-nums text-emerald-700">{sub.positive}%</span>
                          <span className={cn('flex w-12 items-center justify-end gap-0.5 font-semibold tabular-nums', sub.trend >= 0 ? 'text-emerald-700' : 'text-rose-700')}><SubTrend className="h-3 w-3" />{Math.abs(sub.trend)}pt</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary/70" style={{ width: `${share}%` }} /></div>
                        <span className="w-8 shrink-0 text-right text-[9px] tabular-nums text-muted-foreground">{share}%</span>
                      </div>
                      <p className="mt-2 text-[10px] leading-4 text-slate-600">“{sub.quote}”</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold"><MessageSquareQuote className="h-4 w-4 text-primary" />Verbatim evidence ({voice.evidence.length})</div>
              <div className="mt-3 space-y-2">{voice.evidence.map((item) => <blockquote key={item.quote} className="rounded-lg border border-border bg-slate-50 p-3"><p className="text-[10px] leading-4 text-slate-700">“{item.quote}”</p><footer className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>{item.source}</span><span>{item.segment}</span></footer></blockquote>)}</div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-primary"><CircleAlert className="h-3.5 w-3.5" />Handoff sang Customer Experience</div>
              <p className="mt-2 text-[11px] font-medium leading-5 text-slate-800">{voice.nextAction}</p>
              <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-[9px] text-muted-foreground"><span>Insight owner</span><strong className="text-foreground">{voice.owner}</strong></div>
              {voice.touchpointId === 'tp-bond'
                ? <Link to="/issues?issue=CXI-026" className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">Xem CX issue đã tạo <ChevronRight className="h-3 w-3" /></Link>
                : <span className="mt-3 block text-[9px] text-muted-foreground">Chỉ tạo CX issue khi có journey impact, affected scope và owner xử lý rõ ràng.</span>}
            </section>
            <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" />Nguồn tín hiệu</div>
              <div className="mt-2 flex flex-wrap gap-1.5">{voice.sources.map((source) => <span key={source} className="rounded-full border border-border bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-600">{source}</span>)}</div>
              <p className="mt-3 text-[9px] leading-4 text-muted-foreground">Voice of Customer kết thúc ở insight và handoff. Ưu tiên, xử lý và đo outcome thuộc Customer Experience.</p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function HeaderStat({ label, value, tone, icon }: { label: string; value: string; tone?: string; icon?: React.ReactNode }) {
  return <div><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={cn('mt-1 flex items-center gap-1 text-sm font-bold', tone)}>{icon}{value}</p></div>;
}
function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-xl border border-border bg-white p-3 shadow-sm"><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn('mt-1 text-lg font-bold tabular-nums', tone)}>{value}</p></div>;
}
