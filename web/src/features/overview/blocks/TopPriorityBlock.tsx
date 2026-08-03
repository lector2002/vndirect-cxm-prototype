import type { Cfg, CxmData, DimRow, Issue } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @toppri — port 1-1 khối "Điểm gãy nào đáng xử lý trước" (prototype dòng 2158-2168 + topCard()
   dòng 2347-2356). Component THUẦN: không đọc store, chỉ nhận data + callback điều hướng. */
export type TopPriorityBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung của 5 block S2.3 (data+cfg+onGo) để S2.4 dispatch đồng nhất —
      @toppri không xếp hạng theo ngưỡng nên KHÔNG dùng cfg bên trong component này. */
  cfg: Cfg;
  /** Bấm một điểm gãy → điều hướng route đích (port go('issue/<id>'), prototype dòng 2350). */
  onGo?: (route: string) => void;
};

/* Kỳ tuyệt đối dưới tiêu đề mỗi card — phần 2 anatomy wHead() (prototype dòng 1858-1862). Tra
   data.periods theo BASE_FACTOR giống hệt cách QuantifyWidget.tsx làm (design-system, không sửa
   được ở đây) để nếu seed đổi baseline thì nhãn vẫn khớp fx() mà không cần sửa component này. */
function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

/* Màu chấm theo mức độ nghiêm trọng của issue — KHÔNG theo giá trị đang xếp hạng (một issue medium
   vẫn là chấm xám dù đang đứng đầu bảng "theo rủi ro tuân thủ"). Port 1-1 (prototype dòng 2160). */
function sevColor(sev: Issue["sev"]): string {
  return sev === "critical" ? "var(--crit)" : sev === "high" ? "var(--watch)" : "var(--ink3)";
}

type RankCard = { title: string; rows: DimRow[]; unit: string };

export function TopPriorityBlock({ data, onGo }: TopPriorityBlockProps) {
  const actionOf = (id: string) => data.act.find((a) => a.id === id);
  /* "Đang mở" = có action VÀ action chưa khép vòng — port đúng `action(i.act) && action(i.act).lc
     !== 'closed'` của prototype. Điều kiện lc từng phải bỏ đi vì ActionLc chỉ có 'blocked' (tsc bắt
     "no overlap"); owner mở type ngày 02/08/2026 nên khôi phục lại đúng như ghi chú cũ đã hẹn.
     Hệ quả đã đo bằng oracle riêng, KHÔNG suy từ test: CXA-013 khép vòng → CXI-013 rời cả 4 bảng,
     mỗi bảng 6 → 5 dòng, và bảng "rủi ro tuân thủ" đổi người dẫn đầu CXI-013(reg 20) → CXI-028(14).
     Đây là hành vi ĐÚNG: điểm gãy đã xử lý xong không còn tranh ưu tiên với việc đang mở. */
  const open = data.iss.filter((i) => {
    const a = actionOf(i.act);
    return a !== undefined && a.lc !== "closed";
  });

  const rank = (fn: (i: Issue) => number): DimRow[] =>
    open
      .slice()
      .sort((a, b) => fn(b) - fn(a))
      .map((i) => ({ id: i.id, l: i.title, v: fn(i), c: sevColor(i.sev) }));

  const cards: RankCard[] = [
    { title: "Top theo số khách ảnh hưởng", rows: rank((i) => i.imp.aff), unit: "khách bị ảnh hưởng" },
    { title: "Top theo khách giá trị cao", rows: rank((i) => i.imp.hv), unit: "khách high-value" },
    {
      title: "Top theo tác động CES",
      rows: rank((i) => Math.abs(i.imp.csat) * 10),
      unit: "điểm CES × 10",
    },
    { title: "Top theo rủi ro tuân thủ", rows: rank((i) => i.pri.reg), unit: "điểm rủi ro pháp lý" },
  ];

  const period = `Ảnh chụp · ${periodLabel(data)}`;

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => {
        const shown = Math.min(c.rows.length, 10);
        return (
          <Card
            key={c.title}
            title={c.title}
            subtitle={period}
            denomStrip={`Đang hiện Top ${shown} trên ${c.rows.length} điểm gãy`}
          >
            <Bars
              rows={c.rows.slice(0, 10)}
              onRowClick={onGo ? (r) => onGo(`issue/${r.id}`) : undefined}
              axisLabel={c.unit}
            />
          </Card>
        );
      })}
    </div>
  );
}
