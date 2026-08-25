import type { Cfg, CxmData, DimRow } from "../../../data/schema/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @intent — port từ "Khách đang nói gì?" (prototype dòng 2133-2150 + hằng CATQ dòng 2134-2135).
   Bốn nhóm CỐ ĐỊNH theo bốn Category intent — không suy từ data, chỉ nhóm theme theo `cat`.

   25/08 (owner, quét AI-slop): tiêu đề card đổi từ câu hỏi ("Khách đang bức xúc về điều gì?") sang
   CỤM DANH TỪ — và không gõ tay nữa: đọc thẳng `data.cats[cat].label` ("Khiếu nại", "Cần hỗ trợ"…),
   cùng nguồn chữ mà legend/chart intent khắp app đang dùng, hết cảnh hai nơi gọi một nhóm hai tên.
   Bỏ luôn subtitle "Ảnh chụp · kỳ" (GlobalToolbar cầm timeframe); dải mẫu số chỉ hiện khi card
   THẬT SỰ cắt bớt (themes.length > TOP_N) — "Top 3 trên 3" là nói lại chính cái chart. */
export type IntentBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung (data+cfg+onGo) — nhóm theo intent không dùng ngưỡng nên
      component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  /** Bấm một thanh → điều hướng màn topic (port drillTopic, prototype dòng 2144). */
  onGo?: (route: string) => void;
};

/** Thứ tự bốn nhóm trên lưới (âm → dương) — nhãn tra từ data.cats, đây chỉ là key + fallback. */
const CAT_ORDER: { cat: string; fallback: string }[] = [
  { cat: "complaint", fallback: "Khiếu nại" },
  { cat: "improvement", fallback: "Đề xuất cải thiện" },
  { cat: "help", fallback: "Cần hỗ trợ" },
  { cat: "praise", fallback: "Khen ngợi" },
];

const TOP_N = 6;

export function IntentBlock({ data, onGo }: IntentBlockProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {CAT_ORDER.map(({ cat, fallback }) => {
        const themes = data.tax
          .filter((t) => t.lv === "theme" && t.cat === cat)
          .slice()
          .sort((a, b) => b.n - a.n);
        const total = themes.reduce((a, t) => a + t.n, 0);
        const color = data.cats[cat] ? data.cats[cat].color : "var(--ink3)";
        const rows: DimRow[] = themes.slice(0, TOP_N).map((t) => ({ id: t.id, l: t.name, v: t.n, c: color }));
        const kidsOf = (row: DimRow) =>
          data.tax
            .filter((x) => x.lv === "subtheme" && x.parentId === row.id)
            .map((s) => ({ name: s.name, n: s.n }));

        return (
          <Card
            key={cat}
            title={data.cats[cat]?.label ?? fallback}
            denomStrip={
              themes.length > TOP_N ? `Đang hiện Top ${TOP_N} trên ${themes.length} theme` : undefined
            }
          >
            {themes.length ? (
              <Bars
                rows={rows}
                total={total}
                kids={kidsOf}
                onRowClick={onGo ? (r) => onGo(`topic/${r.id}`) : undefined}
                axisLabel="Số tín hiệu khách hàng"
              />
            ) : (
              <div className="t-meta">Chưa có theme nào thuộc nhóm này.</div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
