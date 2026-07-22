import { ArrowRight, MessageSquareText, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import { PRODUCT_VOICE, type ProductVoice, type VoiceDecision } from '@/data/voice-of-customer';
import { cn } from '@/lib/utils';

const DECISION_STYLE: Record<VoiceDecision, string> = {
  'Mở rộng': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Cải thiện': 'border-amber-200 bg-amber-50 text-amber-700',
  'Khảo sát thêm': 'border-sky-200 bg-sky-50 text-sky-700',
};

export default function VoiceOfCustomer() {
  const responses = PRODUCT_VOICE.reduce((sum, item) => sum + item.responses, 0);
  const weightedPositive = Math.round(PRODUCT_VOICE.reduce((sum, item) => sum + item.positive * item.responses, 0) / responses);
  const strongest = [...PRODUCT_VOICE].sort((a, b) => b.score - a.score)[0];
  const needsAction = PRODUCT_VOICE.filter((item) => item.decision !== 'Mở rộng').length;

  return (
    <div className="min-w-[1040px] space-y-6 p-6">
      <header className="flex items-start justify-between gap-8 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Voice of Customer</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Khách hàng cảm thấy thế nào về sản phẩm?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tín hiệu một chạm tại touchpoint, tổng hợp thành insight và quyết định tiếp theo.</p>
        </div>
        <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">Demo snapshot · Chờ API survey thật</span>
      </header>

      <section className="grid grid-cols-4 overflow-hidden rounded-2xl border border-border bg-white">
        <Summary label="Phản hồi đã thu" value={responses.toLocaleString('vi-VN')} note="Thumb và survey nhanh" />
        <Summary label="Cảm nhận tích cực" value={`${weightedPositive}%`} note="Weighted theo response" tone="positive" />
        <Summary label="Được yêu thích nhất" value={strongest.product} note={`${strongest.positive}% tích cực`} />
        <Summary label="Cần quyết định" value={String(needsAction)} note="Cải thiện hoặc khảo sát thêm" tone="warning" />
      </section>

      <section className="rounded-2xl border border-border bg-white">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-sm font-bold">Tín hiệu theo sản phẩm / dịch vụ</h2><p className="mt-1 text-xs text-muted-foreground">Không chỉ đo điểm số: mỗi tín hiệu phải dẫn tới một hành động.</p></div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-emerald-600" />Tích cực</span><span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-rose-600" />Tiêu cực</span></div>
        </div>
        <div className="grid grid-cols-[minmax(190px,0.85fr)_180px_130px_minmax(260px,1.2fr)_minmax(220px,1fr)] gap-4 bg-slate-50 px-5 py-3 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Sản phẩm / nguồn đo</span><span>Cảm nhận khách hàng</span><span>Mức tin cậy</span><span>Insight chính</span><span>Quyết định tiếp theo</span>
        </div>
        <div className="divide-y divide-border">{PRODUCT_VOICE.map((voice) => <VoiceRow key={voice.id} voice={voice} />)}</div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3"><MessageSquareText className="mt-0.5 h-5 w-5 text-primary" /><div><h2 className="text-sm font-bold">Cách dùng tín hiệu để quyết định</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Tích cực cao và đủ mẫu: mở rộng. Điểm trung bình hoặc negative tăng: cải thiện nguyên nhân cụ thể. Mẫu nhỏ: chưa kết luận, tiếp tục survey đúng cohort. Luôn đọc cùng conversion, retention và complaint để tránh quyết định chỉ từ cảm xúc tự khai báo.</p></div></div>
      </section>
    </div>
  );
}

function VoiceRow({ voice }: { voice: ProductVoice }) {
  const confidence = voice.responses >= 300 ? 'Đủ mẫu' : voice.responses >= 100 ? 'Thăm dò' : 'Mẫu nhỏ';
  return <article className="grid grid-cols-[minmax(190px,0.85fr)_180px_130px_minmax(260px,1.2fr)_minmax(220px,1fr)] items-center gap-4 px-5 py-4">
    <div><h3 className="text-xs font-semibold">{voice.product}</h3><p className="mt-1 text-[9px] text-muted-foreground">{voice.method} · {voice.touchpointId}</p></div>
    <div><div className="flex items-baseline justify-between"><strong className="text-lg tabular-nums text-emerald-700">{voice.positive}%</strong><span className="text-[9px] text-muted-foreground">{voice.negative}% negative</span></div><div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-muted"><span className="bg-emerald-500" style={{ width: `${voice.positive}%` }} /><span className="bg-slate-300" style={{ width: `${voice.neutral}%` }} /><span className="bg-rose-400" style={{ width: `${voice.negative}%` }} /></div></div>
    <div><p className="flex items-center gap-1 text-[10px] font-semibold"><Users className="h-3 w-3" />{voice.responses.toLocaleString('vi-VN')}</p><p className={cn('mt-1 text-[9px]', confidence === 'Đủ mẫu' ? 'text-emerald-700' : confidence === 'Thăm dò' ? 'text-amber-700' : 'text-rose-700')}>{confidence}</p></div>
    <p className="text-[10px] leading-4 text-slate-700">{voice.insight}</p>
    <div><span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold', DECISION_STYLE[voice.decision])}>{voice.decision}</span><p className="mt-2 flex gap-1 text-[10px] leading-4 text-slate-700"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{voice.nextAction}</p></div>
  </article>;
}

function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone?: 'positive' | 'warning' }) {
  return <div className="border-r border-border p-5 last:border-r-0"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className={cn('mt-2 truncate text-2xl font-bold', tone === 'positive' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : 'text-foreground')} title={value}>{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{note}</p></div>;
}
