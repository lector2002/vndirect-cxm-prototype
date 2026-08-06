import { useState } from "react";
import type { Action, Cfg, CxmData, TaxNode } from "../../../data/schema/index.ts";
/* `ptsFor`/`trendOf` trước nằm private ngay trong file này. Chuyển xuống `domain/topics.ts` ngày
   06/08 khi màn #/topics ra đời: chart đường ở màn đó và sparkline ở bảng này vẽ CÙNG một chuỗi,
   nên hai chỗ phải cắt kỳ bằng đúng một hàm — tách ra là cùng một topic hiện hai hình dạng khác
   nhau trên cùng một màn. */
import { fx, ptsFor, trendOf } from "../../../domain/index.ts";
import { AxisLabel, Badge, Card, CatChip, Sparkline } from "../../../design-system/index.ts";
import { nf } from "../../../design-system/format.ts";

/* Số topic hiện sẵn. Bảng này là chỗ NỞ NHANH NHẤT hệ thống: mỗi topic mới của taxonomy VoC là một
   dòng, vĩnh viễn — 14 dòng ở seed hôm nay, và không có trần nào. Bảng chịu được nhiều dòng hơn bar
   chart, nhưng "chịu được" không phải "có chặn" (quét toàn bộ chart 06/08). Cắt ở 8 như
   ThemeStackBlock, phần còn lại đếm ra chữ và mở được tại chỗ. */
const TOP_N = 8;

/* @topictrend — port 1-1 "Topic nào đang lớn nhất?" (prototype dòng 2256-2281 + hằng D_DRIFT
   dòng 3764 + themeStep/themeFixes dòng 3794-3795). Biểu đồ đường 6 kỳ thật thuộc Phase 5
   (vocjourney) — ở đây CHỈ nút toggle ★/☆ + trạng thái, KHÔNG dựng chart đường (charter S2.2). */
export type TopicTrendBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung — trạng thái badge suy từ `drift`/`demo` trên chính node,
      không dùng ngưỡng cfg nên component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  /** Bấm một dòng → điều hướng màn chi tiết topic (port drillTopic, prototype dòng 2268). */
  onGo?: (route: string) => void;
  /** ★ topic đang hiện trên biểu đồ đường nhiều-topic — UI selection do PAGE sở hữu (không phải
      store), vì biểu đồ đường thật (ST.sel.topicLines) thuộc Phase 5 vocjourney. */
  selectedLines?: string[];
  /** Bấm nút ★/☆ trên một dòng (port toggleTopicLine, prototype dòng 2269). */
  onToggleLine?: (id: string) => void;
  /** Số tháng gần nhất áp cho sparkline "Xu hướng" — ĐÂY LÀ chuỗi thời gian THẬT duy nhất trong
   *  block này (quyết định range owner 01/08: 8 block khác trong Overview là snapshot, block này
   *  KHÔNG snapshot vì có `t.pts`). Bỏ trống = hiện trọn `pts` (hành vi cũ, dùng cho caller ngoài
   *  Overview). KHÔNG nội suy: theme có ít điểm hơn N thì `.slice(-months)` tự nhiên trả về đúng
   *  số điểm đang có. */
  months?: number;
};

/** Nhãn diễn giải drift — port 1-1 hằng D_DRIFT (prototype dòng 3764). */
const D_DRIFT: Record<string, string> = {
  "new-term": "Thuật ngữ mới chưa gán",
  duplicate: "Có thể trùng nghĩa",
  shifting: "Ngữ nghĩa đang lệch",
};

/* Bước mà theme tập trung nhiều bằng chứng nhất — port themeStep() (prototype dòng 3794): đếm
   evidence có tax chứa theme này theo từng step, lấy step có count lớn nhất. */
function themeStep(data: CxmData, theme: TaxNode): string | null {
  const counts = new Map<string, number>();
  data.ev.forEach((e) => {
    if (e.tax.indexOf(theme.id) > -1 && e.step) counts.set(e.step, (counts.get(e.step) ?? 0) + 1);
  });
  let best: string | null = null;
  let bestN = -1;
  counts.forEach((n, step) => {
    if (n > bestN) {
      best = step;
      bestN = n;
    }
  });
  return best;
}

/* Thay đổi ĐÃ phát hành chạm đúng bước theme tập trung — port themeFixes() (prototype dòng 3795). */
function themeFixes(data: CxmData, theme: TaxNode): Action[] {
  const step = themeStep(data, theme);
  if (!step) return [];
  return data.act.filter((a) => {
    if (a.dl !== "released") return false;
    const issue = data.iss.find((i) => i.id === a.iss);
    return issue !== undefined && issue.step === step;
  });
}

function subthemesOf(data: CxmData, themeId: string): TaxNode[] {
  return data.tax.filter((n) => n.lv === "subtheme" && n.parentId === themeId);
}

function catColor(data: CxmData, cat: string | undefined): string {
  return cat && data.cats[cat] ? data.cats[cat].color : "var(--ink3)";
}

function catLabel(data: CxmData, cat: string | undefined): string {
  return cat ? (data.cats[cat] ? data.cats[cat].label : cat) : "";
}

const TH = "text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs";
const TH_R = "text-right px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs";
const TD = "px-2.5 py-1.5 border-b border-line align-top";
const TD_R = `${TD} text-right`;

export function TopicTrendBlock({ data, onGo, selectedLines = [], onToggleLine, months }: TopicTrendBlockProps) {
  const themes = data.tax
    .filter((t) => t.lv === "theme")
    .slice()
    .sort((a, b) => b.n - a.n);
  /* "topic đang tăng theo hướng xấu" — port `thSorted.filter(t=>trend(t)>0 && t.cat!=='praise').length`
     (prototype dòng 2260). CHÚ Ý: prototype gốc không xét chiều praise ở đây (chỉ complaint/help/
     improvement tăng mới tính, praise không bao giờ vào mẫu số này dù tăng hay giảm) — giữ nguyên
     1-1, khác với quy tắc tô màu "xấu" đầy đủ ở cột Thay đổi (áp cả nhánh praise giảm). Tính trên
     CHÍNH chuỗi đang hiện (đã áp range) — cùng cửa sổ thời gian với sparkline, không lệch nhau. */
  const rising = themes.filter((t) => trendOf(ptsFor(t, months)) > 0 && t.cat !== "praise").length;
  /* Số kỳ ĐANG thực sự hiện trên sparkline — dùng cho header cột, KHÔNG hardcode "6 kỳ": nếu
     range yêu cầu nhiều hơn dữ liệu thật đang có (vd '1 năm' trên theme chỉ 6 điểm), header phải
     nói đúng số điểm thật, không khẳng định một kỳ chart không vẽ. */
  const shownMonths = themes.reduce((m, t) => Math.max(m, ptsFor(t, months).length), 0);

  const [expanded, setExpanded] = useState(false);
  const shownThemes = expanded ? themes : themes.slice(0, TOP_N);
  const hidden = themes.length - shownThemes.length;

  return (
    <Card
      title="Topic & xu hướng"
      /* Mẫu số cũ ghi "Đang hiện Top {rising} trên {themes.length} topic đang tăng theo hướng xấu"
         trong khi `tbody` vẽ TOÀN BỘ themes — khai một tập con mà liệt kê tất cả. Cùng lỗi với chip
         mẫu số của @coverage (nói về flow trong khi vẽ bước), sửa cùng lượt 06/08: vế đầu nói ĐÚNG
         số đang hiện, còn `rising` giữ lại thành một vế riêng vì nó là thông tin thật, chỉ không
         phải mẫu số. */
      denomStrip={`Đang hiện ${shownThemes.length} trên ${themes.length} topic · ${rising} đang tăng theo hướng xấu`}
    >
      <div className={expanded ? "overflow-x-auto max-h-[420px] overflow-y-auto" : "overflow-x-auto"}>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={`${TH} w-9`}></th>
              <th className={TH}>Topic</th>
              <th className={TH}>Intent</th>
              <th className={TH_R}>Volume</th>
              <th className={TH}>Xu hướng {shownMonths} kỳ</th>
              <th className={TH_R}>Thay đổi</th>
              <th className={TH}>Sub-theme</th>
              <th className={TH}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {shownThemes.map((t) => {
              const pts = ptsFor(t, months);
              const d = trendOf(pts);
              const bad = t.cat !== "praise" ? d > 0 : d < 0;
              const subs = subthemesOf(data, t.id);
              const inChart = selectedLines.indexOf(t.id) > -1;
              const fixes = t.cat !== "praise" && d < 0 ? themeFixes(data, t) : [];
              return (
                <tr
                  key={t.id}
                  data-testid={`topic-row-${t.id}`}
                  className="cursor-pointer"
                  onClick={() => onGo?.(`topic/${t.id}`)}
                >
                  <td className={TD}>
                    <button
                      type="button"
                      className="text-[16px] leading-none"
                      style={{ color: inChart ? "var(--primary)" : "var(--ink3)" }}
                      title={`${inChart ? "Bỏ khỏi" : "Thêm vào"} biểu đồ đường`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLine?.(t.id);
                      }}
                    >
                      {inChart ? "★" : "☆"}
                    </button>
                  </td>
                  <td className={TD}>
                    <b className="text-[13.5px]">{t.name}</b>
                    <div className="t-meta text-[12px] mt-[3px] max-w-[46ch]">{t.why}</div>
                  </td>
                  <td className={TD}>
                    <CatChip label={catLabel(data, t.cat)} color={catColor(data, t.cat)} />
                  </td>
                  <td className={TD_R}>
                    <b className="tabular-nums">{nf(fx(t.n))}</b>
                  </td>
                  <td className={TD}>
                    {pts.length ? (
                      <Sparkline points={pts} color={bad ? "var(--crit)" : "var(--good)"} />
                    ) : (
                      <span className="t-meta">—</span>
                    )}
                  </td>
                  <td className={TD_R}>
                    <b className="tabular-nums" style={{ color: bad ? "var(--crit)" : "var(--good)" }}>
                      {d > 0 ? "+" : ""}
                      {nf(d)}
                    </b>
                    {fixes.length ? (
                      <div className="t-meta text-[11px]" style={{ color: "var(--good)" }}>
                        ✓ {fixes.length} đã phát hành
                      </div>
                    ) : null}
                  </td>
                  <td className={TD}>
                    {subs.length ? (
                      subs.map((s) => (
                        <span
                          key={s.id}
                          className="inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border border-line bg-surface-2 text-ink-2 mr-1"
                        >
                          {s.name}
                        </span>
                      ))
                    ) : (
                      <span className="t-meta">—</span>
                    )}
                  </td>
                  <td className={TD}>
                    {t.drift ? (
                      <Badge state="watch" text={D_DRIFT[t.drift] ?? t.drift} />
                    ) : t.demo ? (
                      <Badge state="unknown" text="Dữ liệu demo" />
                    ) : (
                      <Badge state="ok" text="Ổn định" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Phần bị cắt phải ĐẾM RA CHỮ và mở được tại chỗ — cắt im lặng thì người đọc tưởng taxonomy
          chỉ có 8 topic. Mở ra thì bảng cuộn trong khung cao cố định, không đẩy card dài vô tận. */}
      {themes.length > TOP_N ? (
        <button
          type="button"
          data-testid="topic-more"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[12px] font-semibold text-primary hover:underline"
        >
          {expanded ? "Thu gọn" : `Xem hết ${themes.length} topic (+${hidden} nữa)`}
        </button>
      ) : null}
      <AxisLabel>Volume · xu hướng theo kỳ</AxisLabel>
    </Card>
  );
}
