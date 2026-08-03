import type { Cfg, CxmData, DimRow } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @intent — port 1-1 "Khách đang nói gì?" (prototype dòng 2133-2150 + hằng CATQ dòng 2134-2135).
   Bốn câu hỏi CỐ ĐỊNH theo bốn Category intent — không suy từ data, chỉ nhóm theme theo `cat`. */
export type IntentBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung (data+cfg+onGo) — nhóm theo intent không dùng ngưỡng nên
      component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  /** Bấm một thanh → điều hướng màn topic (port drillTopic, prototype dòng 2144). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

const CATQ: { cat: string; label: string }[] = [
  { cat: "complaint", label: "Khách đang bức xúc về điều gì?" },
  { cat: "improvement", label: "Khách muốn cải thiện điều gì?" },
  { cat: "help", label: "Khách đang cần giúp ở đâu?" },
  { cat: "praise", label: "Khách thích điều gì?" },
];

const TOP_N = 6;

export function IntentBlock({ data, onGo }: IntentBlockProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {CATQ.map(({ cat, label }) => {
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
            title={label}
            subtitle={`Ảnh chụp · ${periodLabel(data)}`}
            denomStrip={`Đang hiện Top ${Math.min(themes.length, TOP_N)} trên ${themes.length} theme`}
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
