import { useState } from "react";
import type { Cfg, CxmData, Source } from "../../data/schema/index.ts";
import {
  distByIntent,
  distByPhase,
  distByPlatform,
  distBySentiment,
  distByTheme,
  evidenceOfSource,
  lagText,
  scopeTotal,
  sourceHealth,
} from "../../domain/index.ts";
import { Badge, Bars, Card, CatChip, Note, Stat } from "../../design-system/index.ts";
import { nf, pv } from "../../design-system/format.ts";

/* Hồ sơ MỘT NGUỒN — port srcProfile() (prototype dòng 3600-3665).

   HAI CHỖ CỐ Ý KHÁC PROTOTYPE, cả hai vì cùng một lý do: con số phải nói đúng đơn vị của nó.

   1. NHÃN CỦA MẪU SỐ. Prototype in `share + '% tổng bản ghi phản hồi'` (dòng 3624). Owner đã bác
      đúng cách gọi đó ngày 01/08 — ghi tại domain/scope.ts:12-15: mẫu số `scopeTotal` gộp cả nguồn
      hành vi (Digital analytics 41.200 + eKYC SDK 12.800, ~95% tổng) vốn KHÔNG có lời khách nào,
      nên gọi nó là "bản ghi phản hồi" là nói quá. Nhãn đúng là "tín hiệu khách hàng".

   2. HAI MẪU SỐ TRONG CÙNG MỘT HỒ SƠ. `Source.vol` là volume TỔNG HỢP (src-ga: 41.200);
      `evidenceOfSource` là BẰNG CHỨNG MẪU đếm được từng cái (src-ga: 157) — lệch khoảng 260 lần.
      Năm phân bố bên dưới đếm trên tập mẫu, ô "Volume trong kỳ" đọc trên volume tổng hợp. Prototype
      có nói điều này, nhưng ở NHÃN TRỤC CUỐI CÙNG — sau khi người đọc đã nhìn xong chart. Ở đây nó
      lên DẢI MẪU SỐ ngay dưới tiêu đề, chỗ gặp trước.

   Câu cảnh báo khi nguồn hỏng KHÔNG phán chiều lệch của chỉ số — lý do dài ở docblock
   domain/sources.ts bẫy 3. Tóm tắt: nguồn mất có thể nằm ở cả tử lẫn mẫu của công thức, dữ liệu
   không nói được thương số đi lên hay xuống, nên màn chỉ ra người phải hỏi (`Metric.owner`). */

/** Số topic hiện sẵn — cùng mức với hồ sơ điểm chạm ở #/vocjourney. Tầng theme có 14 node nên đây
    là phân bố DUY NHẤT trong hồ sơ này cần cắt: intent tối đa 4, sắc thái 3, nền tảng 4, phase 6. */
const TOP_THEMES = 6;

export type SourceProfileProps = {
  source: Source;
  data: CxmData;
  cfg: Cfg;
  onClose: () => void;
};

const HEALTH_LABEL = { ok: "Đang nhận", stale: "Trễ hơn SLA", down: "Ngừng gửi" } as const;
const HEALTH_BADGE = { ok: "ok", stale: "watch", down: "crit" } as const;

export function SourceProfile({ source, data, cfg, onClose }: SourceProfileProps) {
  const [themesOpen, setThemesOpen] = useState(false);

  const health = sourceHealth(source, cfg);
  const evs = evidenceOfSource(data, source.id);
  const metrics = source.metrics
    .map((id) => data.metrics.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const themeRows = distByTheme(data, evs);
  const shownThemes = themesOpen ? themeRows : themeRows.slice(0, TOP_THEMES);
  const sla = cfg.source[source.id];

  const dist = (label: string, rows: { id: string; l: string; v: number; c?: string }[], testid: string) => (
    <div data-testid={testid}>
      <div className="t-lbl mb-2">{label}</div>
      {rows.length ? (
        /* scaled={false}: đây là bằng chứng ĐẾM ĐƯỢC TỪNG CÁI, không phải volume tổng hợp — nhân
           fx() vào đây ra một con số không tra ngược được về bản ghi nào (D0a ở Bars). */
        <Bars rows={rows} total={evs.length} scaled={false} />
      ) : (
        <div className="t-meta text-[12px]">Không có bằng chứng mẫu nào từ nguồn này.</div>
      )}
    </div>
  );

  return (
    <div className="mt-4" data-tour="src-profile" data-testid="src-profile">
      <Card
        title={`Hồ sơ dữ liệu · ${source.name}`}
        subtitle={source.note}
        denomStrip={
          <span data-testid="src-profile-denom">
            {evs.length === 0
              ? `Chưa có bằng chứng mẫu nào từ nguồn này · volume tổng hợp trong kỳ ${nf(source.vol)}`
              : `${nf(evs.length)} bằng chứng mẫu đọc được từng cái — KHÔNG phải toàn bộ ${nf(source.vol)} bản ghi nguồn này khai. Năm phân bố bên dưới đếm trên ${nf(evs.length)} đó.`}
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Badge state={HEALTH_BADGE[health]} text={HEALTH_LABEL[health]} />
            <button
              type="button"
              data-testid="src-profile-close"
              onClick={onClose}
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              đóng hồ sơ
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 mb-4">
          <Stat
            label="Volume trong kỳ"
            value={nf(source.vol)}
            foot={`${pv(source.vol, scopeTotal(data))}% tổng tín hiệu khách hàng`}
            srcNote={`Loại nguồn: ${source.kind}`}
          />
          <Stat
            label="Độ tươi"
            value={lagText(source.lagH)}
            foot={sla === undefined ? "chưa đặt SLA riêng cho nguồn này" : `SLA riêng của nguồn này: ${sla} giờ`}
            srcNote={`Nhận lần cuối ${source.last}`}
            tone={health === "ok" ? undefined : health === "stale" ? "var(--watch)" : "var(--crit)"}
          />
          <Stat
            label="Nền tảng phủ"
            value={source.pf.length ? String(source.pf.length) : "—"}
            foot={source.pf.length ? source.pf.join(" · ") : "không gắn nền tảng — nhập tay hoặc webhook"}
            srcNote="Nền tảng thiếu là chỗ có khách nhưng ta không nghe được"
          />
          <Stat
            label="Chỉ số phụ thuộc"
            value={String(metrics.length)}
            foot={metrics.length ? "sai lệch theo nguồn này" : "không nối chỉ số nào"}
            srcNote={metrics.map((m) => m.name).join(" · ") || "—"}
            tone={metrics.length && health !== "ok" ? "var(--crit)" : undefined}
          />
        </div>

        {health !== "ok" ? (
          <div className="mb-4" data-testid="src-profile-impact">
            <Note tone="crit">
              <b>Nguồn này đang {HEALTH_LABEL[health].toLowerCase()}.</b>{" "}
              {metrics.length ? (
                <>
                  {metrics.length === 1 ? "Chỉ số " : `${metrics.length} chỉ số `}
                  {metrics.map((m, i) => (
                    <span key={m.id}>
                      <b>{m.name}</b>
                      {i < metrics.length - 1 ? " và " : " "}
                    </span>
                  ))}
                  đang tính trên dữ liệu thiếu phần của nguồn này. Dữ liệu <b>không nói được</b> con
                  số đang cao hơn hay thấp hơn thực tế — nguồn mất có thể nằm ở cả tử lẫn mẫu của
                  công thức. Hỏi chủ chỉ số ({[...new Set(metrics.map((m) => m.owner))].join(" · ")})
                  trước khi dùng con số kỳ này.
                </>
              ) : (
                <>
                  Nguồn chưa nối vào chỉ số nào nên không làm lệch con số nào, nhưng đang mất tiếng
                  nói của khách đến từ kênh này.
                </>
              )}
            </Note>
          </div>
        ) : null}

        <div className="t-lbl mb-2.5">Bằng chứng mẫu của nguồn này trông thế nào</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-4">
          {dist("Theo intent", distByIntent(data, evs), "src-dist-intent")}
          {dist("Theo sắc thái", distBySentiment(evs), "src-dist-sen")}
          {dist("Theo nền tảng", distByPlatform(evs), "src-dist-pf")}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div data-testid="src-dist-theme">
            <div className="t-lbl mb-2">
              {themeRows.length > TOP_THEMES
                ? `Theo topic — đang hiện ${shownThemes.length} trên ${themeRows.length}`
                : "Theo topic"}
            </div>
            {shownThemes.length ? (
              <Bars rows={shownThemes} total={evs.length} scaled={false} />
            ) : (
              <div className="t-meta text-[12px]">Không có bằng chứng mẫu nào từ nguồn này.</div>
            )}
            {themeRows.length > TOP_THEMES ? (
              <button
                type="button"
                data-testid="src-theme-more"
                onClick={() => setThemesOpen((v) => !v)}
                className="mt-2 text-[12px] font-semibold text-primary hover:underline"
              >
                {themesOpen ? "Thu gọn" : `Xem hết ${themeRows.length} topic (+${themeRows.length - TOP_THEMES} nữa)`}
              </button>
            ) : null}
          </div>
          {dist("Theo phase hành trình", distByPhase(data, evs), "src-dist-phase")}
        </div>

        {evs.length ? (
          <>
            <div className="border-t border-line my-4" />
            {/* Cố ý chỉ hai mẫu: hồ sơ này trả lời "nguồn này nói kiểu gì", không phải chỗ đọc từng
                feedback — đọc từng cái nằm ở tab Verbatim của #/vocjourney. */}
            <div className="t-lbl mb-2">Nguồn này “nói kiểu gì” — {Math.min(2, evs.length)} bản ghi mẫu</div>
            <div className="grid gap-2.5">
              {evs.slice(0, 2).map((e) => {
                const cat = data.cats[e.cat];
                return (
                  <div key={e.id} className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {cat ? <CatChip label={cat.label} color={cat.color} /> : null}
                      <span className="font-mono text-[12px] text-ink-3">{e.ref}</span>
                      <span className="ml-auto t-meta text-[12px]">{e.at}</span>
                    </div>
                    <p className="text-[13.5px] leading-relaxed">“{e.q}”</p>
                    {/* `ck` đã che sẵn ở tầng dữ liệu — màn KHÔNG bao giờ mở khoá. */}
                    <div className="mt-2 text-[12px] text-ink-3">🔒 {e.ck}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </Card>
    </div>
  );
}
