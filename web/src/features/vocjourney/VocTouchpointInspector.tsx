import { useState } from "react";
import type { Category, CxmData, Evidence, Step, TaxNode, VoiceInsight } from "../../data/schema/index.ts";
import { intentRowsAtStep, sentimentAtStep, themeRowsAtStep } from "../../domain/index.ts";
import { Badge, Bars, Card, CatChip, Note } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";

/* Hồ sơ MỘT ĐIỂM CHẠM, ba tab — port vocInspector() (prototype dòng 2762-2823), song song với
   AtlasStepInspector của bản đồ hành trình: cùng vị trí trên màn, khác thứ đo (tiếng nói, không
   phải hành vi).

   BA CHỖ CỐ Ý KHÁC PROTOTYPE:

   1. CẮT DANH SÁCH. Bước đông nhất trong demoData có 175 bằng chứng và 16 node theme+subtheme.
      Prototype đổ hết ra một cột. Cùng luật đã áp cho @coverage/@topictrend/@journeystate: hiện
      phần đáng nhìn, đếm phần còn lại RA CHỮ, mở đủ khi được yêu cầu, và danh sách mở ra thì cuộn
      trong khung cao cố định.

   2. TOPIC GỘP THEO THEME CHA, sub-theme thành chip dưới đúng cha (xem domain/vocJourney.ts).
      Prototype xếp phẳng trộn hai cấp — cắt một danh sách trộn cấp sẽ đánh rơi theme cha xuống
      dưới sub-theme con của chính nó.

   3. BỎ hai nút gọi `drillFeed(...)` (prototype dòng 2781/2786/2802). Hàm đó KHÔNG tồn tại: được
      gọi ở ba chỗ, không khai ở đâu, bấm vào là lỗi. Bỏ vì đích đến không có, không phải vì quên;
      khi màn Feed được dựng thì nối lại ở đúng ba chỗ này. */

/** Số topic hiện sẵn — phần còn lại đếm ra chữ. */
const TOP_THEMES = 6;
/** Số verbatim hiện sẵn. Bước đông nhất có 175 — không đổ hết ra một cột. */
const TOP_VERBATIM = 10;

const TABS = [
  ["topic", "Topic tại điểm chạm"],
  ["verb", "Verbatim"],
  ["ins", "Insight & đề xuất"],
] as const;

type TabKey = (typeof TABS)[number][0];

export type VocTouchpointInspectorProps = {
  step: Step;
  /** Bằng chứng mẫu của RIÊNG bước này, đã lọc ở caller. */
  evs: Evidence[];
  /** Insight gắn vào RIÊNG bước này, đã lọc ở caller. */
  ins: VoiceInsight[];
  /** Ba tab đều tra ngược nhiều bảng (tax, cats, sources) — nhận nguyên `data` thay vì bó từng
      mảng ở caller, cùng lý do AtlasSignalPanel nhận cả `dims`. */
  data: CxmData;
  /** Tổng bằng chứng toàn hệ — mẫu số của dải "… trên …". */
  evTotal: number;
};

function sentimentText(sen: number | null): string {
  if (sen === null) return "chưa đo";
  return `${sen > 0 ? "+" : ""}${sen.toFixed(1).replace(".", ",")}`;
}

function srcName(data: CxmData, id: string): string {
  return data.sources.find((s) => s.id === id)?.name ?? id;
}

function catOf(data: CxmData, id: string): Category | undefined {
  return data.cats[id];
}

/** Đường taxonomy của một bằng chứng — chỉ TÊN node có thật, bỏ id mồ côi. */
function taxPath(data: CxmData, ids: readonly string[]): string {
  return ids
    .map((id) => data.tax.find((t: TaxNode) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n))
    .join(" › ");
}

export function VocTouchpointInspector({ step, evs, ins, data, evTotal }: VocTouchpointInspectorProps) {
  /* Tab KHÔNG reset khi đổi điểm chạm — cùng hành vi với AtlasStepInspector và với prototype
     (`ST.sub.vocTab` là state toàn cục). Đang đọc verbatim ở bước này thì bấm bước kế phải vẫn ở
     verbatim, không bị ném về tab đầu. */
  const [tab, setTab] = useState<TabKey>("topic");
  const [themesOpen, setThemesOpen] = useState(false);
  const [verbOpen, setVerbOpen] = useState(false);

  const sen = sentimentAtStep(evs);
  const themeRows = themeRowsAtStep(data, evs);
  const intentRows = intentRowsAtStep(data, evs);

  const shownThemes = themesOpen ? themeRows : themeRows.slice(0, TOP_THEMES);
  const shownVerb = verbOpen ? evs : evs.slice(0, TOP_VERBATIM);

  return (
    <Card
      title={`Điểm chạm ${step.code} · ${step.name}`}
      subtitle={`${step.stationId} · phụ trách ${step.owner}`}
      denomStrip={`${nf(evs.length)} trên ${nf(evTotal)} bằng chứng mẫu toàn hệ gắn vào điểm chạm này · sentiment trung bình ${sentimentText(sen)}`}
      actions={<Badge state={sen === null ? "unknown" : sen < -0.5 ? "crit" : sen < 0 ? "watch" : "ok"} />}
    >
      <div
        className="flex gap-1.5 border-b border-line"
        role="tablist"
        aria-label="Cách xem hồ sơ điểm chạm"
        data-testid="voc-inspector-tabs"
      >
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`voc-tab-${k}`}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 -mb-px text-[12.5px] font-semibold border-b-2 ${
              tab === k ? "border-primary text-primary" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3.5">
        {tab === "topic" ? (
          themeRows.length === 0 ? (
            // luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu
            <Note>
              <Badge state="unknown" /> Chưa có bằng chứng mẫu nào gán vào điểm chạm này.
            </Note>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="t-lbl mb-2">
                  {`Topic tại điểm chạm này — đang hiện ${shownThemes.length} trên ${themeRows.length}`}
                </div>
                <Bars
                  rows={shownThemes.map((r) => ({ id: r.id, l: r.name, v: r.n }))}
                  total={evs.length}
                  /* Số bằng chứng ĐẾM ĐƯỢC TỪNG CÁI, không phải volume tổng hợp — không nhân fx()
                     (cùng lý do D0a ở Bars với base='ev'). */
                  scaled={false}
                  kids={(row) =>
                    shownThemes.find((r) => r.id === row.id)?.kids.map((k) => ({ name: k.name, n: k.n })) ?? []
                  }
                  // luật 11/08: bỏ "tập mẫu, không phải toàn bộ bản ghi"
                  axisLabel="Số bằng chứng mẫu"
                />
                {themeRows.length > TOP_THEMES ? (
                  <button
                    type="button"
                    data-testid="voc-theme-more"
                    onClick={() => setThemesOpen((v) => !v)}
                    className="mt-2 text-[12px] font-semibold text-primary hover:underline"
                  >
                    {themesOpen
                      ? "Thu gọn"
                      : `Xem hết ${themeRows.length} topic (+${themeRows.length - TOP_THEMES} nữa)`}
                  </button>
                ) : null}
              </div>
              <div>
                <div className="t-lbl mb-2">Intent của khách tại đây</div>
                <Bars
                  rows={intentRows.map((r) => ({ id: r.id, l: r.label, v: r.n, c: r.color }))}
                  total={evs.length}
                  scaled={false}
                  axisLabel="Số bằng chứng mẫu"
                />
                {/* luật 11/08: bỏ luận giải */}
              </div>
            </div>
          )
        ) : null}

        {tab === "verb" ? (
          evs.length === 0 ? (
            <Note>
              <Badge state="unknown" /> Chưa có verbatim nào tại điểm chạm này.
            </Note>
          ) : (
            <>
              {/* Danh sách mở ra thì CUỘN trong khung cao cố định — 175 quote đẩy mọi thứ khác ra
                  khỏi màn, kể cả chính thanh tab vừa bấm. */}
              <div
                className={`grid gap-3${verbOpen ? " max-h-[520px] overflow-y-auto pr-1" : ""}`}
                data-testid="voc-verbatim-list"
              >
                {shownVerb.map((e) => {
                  const cat = catOf(data, e.cat);
                  return (
                    <div key={e.id} className="rounded-lg border border-line bg-surface-2 px-3.5 py-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {cat ? <CatChip label={cat.label} color={cat.color} /> : null}
                        <span className="px-1.5 py-0.5 rounded-[6px] text-[11.5px] bg-surface border border-line">
                          {srcName(data, e.src)}
                        </span>
                        <span className="font-mono text-[12px] text-ink-3">{e.ref}</span>
                        <span className="ml-auto t-meta text-[12px]">{e.at}</span>
                      </div>
                      <p className="text-[13.5px] leading-relaxed">“{e.q}”</p>
                      <div className="flex gap-3 flex-wrap mt-2 text-[12px] text-ink-3">
                        {/* `ck` đã che sẵn ở tầng dữ liệu (KH•••482) — màn KHÔNG bao giờ mở khoá. */}
                        <span>🔒 {e.ck}</span>
                        <span className="font-mono">{taxPath(data, e.tax)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {evs.length > TOP_VERBATIM ? (
                <button
                  type="button"
                  data-testid="voc-verb-more"
                  onClick={() => setVerbOpen((v) => !v)}
                  className="mt-3 text-[12px] font-semibold text-primary hover:underline"
                >
                  {verbOpen
                    ? "Thu gọn"
                    : `Xem hết ${nf(evs.length)} verbatim (+${nf(evs.length - TOP_VERBATIM)} nữa)`}
                </button>
              ) : null}
            </>
          )
        ) : null}

        {tab === "ins" ? (
          ins.length === 0 ? (
            /* TRƯỜNG HỢP CHÍNH, không phải ngoại lệ: 27 trên 30 bước trong demoData chưa có insight
               nào. Nên câu chữ ở đây phải tách được hai thứ mà một chữ "trống" gộp làm một: chưa có
               tiếng nói, và có tiếng nói nhưng chưa ai tổng hợp. */
            <Note>
              <Badge state="unknown" />{" "}
              {/* luật 11/08 (Dạng A): bỏ "chưa đo, chứ không phải đo rồi không thấy gì" và bỏ
                  'không phải "đã xem xét và kết luận không có vấn đề"' — giữ nguyên vế trạng thái
                  dữ liệu; VocJourneyPage.test.tsx canh lại ở vế còn giữ, không xoá test. */}
              {evs.length === 0 ? (
                <>Chưa có insight nào cho điểm chạm này, và cũng chưa có bằng chứng mẫu nào ở đây.</>
              ) : (
                <>
                  {/* luật 12/08: bỏ vế định nghĩa "Insight là bước tổng hợp riêng từ các bằng chứng
                      đó, chưa chạy cho điểm chạm này" — vế trước đã nói đủ tình trạng dữ liệu */}
                  Chưa có insight nào cho điểm chạm này, dù đã có {nf(evs.length)} bằng chứng mẫu.
                </>
              )}
            </Note>
          ) : (
            <div className="grid gap-3">
              {ins.map((i) => {
                const theme = data.tax.find((t) => t.id === i.theme);
                return (
                  <Note key={i.id}>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-mono text-[12px] text-ink-3">{i.id}</span>
                      <b>{theme?.name ?? i.theme}</b>
                      <span className="px-1.5 py-0.5 rounded-[6px] text-[11.5px] bg-surface border border-line">
                        {nf(i.n)} phản hồi
                      </span>
                      <span className="px-1.5 py-0.5 rounded-[6px] text-[11.5px] bg-surface border border-line">
                        {i.pos}% tích cực
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded-[6px] text-[11.5px] bg-surface border font-semibold"
                        style={{ color: i.trend < 0 ? "var(--crit)" : "var(--good)", borderColor: "currentColor" }}
                      >
                        {i.trend > 0 ? "+" : ""}
                        {i.trend} điểm
                      </span>
                    </div>
                    <div className="mb-2 text-[13px]">{i.rec}</div>
                    <div className="t-meta text-[12px]">
                      {i.hoEl ? (
                        <>
                          ✓ Đủ điều kiện đẩy thành CX issue — {i.hoWhy}
                          {i.hoIssue ? (
                            <>
                              {" · đã tạo "}
                              <a href={`#/issue/${i.hoIssue}`}>{i.hoIssue}</a>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <>⚠ Chưa đủ điều kiện — {i.hoWhy}</>
                      )}
                    </div>
                  </Note>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </Card>
  );
}
