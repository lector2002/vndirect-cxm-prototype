import type { Cfg, CxmData, Dim, DimRow, Issue, PriKey } from "../../../data/schema/index.ts";
import { PRI_LABEL, scoreIssues } from "../../../data/priority.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @toppri — khối "Nhìn theo từng khoá" (port từ "Điểm gãy nào đáng xử lý trước", prototype dòng
   2158-2168 + topCard() dòng 2347-2356).

   ĐỔI TÊN KHỐI 14/08 (ADR-002 §17), không phải sửa chữ cho đẹp: sau khi `hv` thành khoá thứ bảy
   của `pri.total`, cả ba trục của khối này đều là THÀNH PHẦN của điểm ưu tiên. Để nguyên tiêu đề
   cũ là để HAI định nghĩa "đáng xử lý trước" chạy song song trên hai màn, và người xem không biết
   tin bảng nào. `#/work` là chỗ DUY NHẤT nói thứ tự việc phải làm; khối này nói VÌ SAO — một điểm
   tổng che mất lý do, ba bảng thì thấy được điểm gãy nào lên đầu nhờ trục nào.

   BỎ CARD "Top theo tác động CES" 14/08 (§12): nó đọc `imp.csat` — một số âm gõ tay — rồi
   `Math.abs(x)*10` và in đơn vị "điểm CES × 10", trong khi KHÔNG có đường code nào nối nó với
   `m-ces` hay khảo sát `sv-ces-mtk`. Không hiện cái không đo được. */
export type TopPriorityBlockProps = {
  data: CxmData;
  /** Trọng số + mốc neo của điểm ưu tiên (`cfg.pri`, `cfg.hv`) — khối này KHÔNG xếp theo ngưỡng,
      nhưng hai trục `aff`/`hv` nay là số ĐO ĐƯỢC nên phải đi qua đúng hàm tính của `#/work`. */
  cfg: Cfg;
  /** Cần cho `cfg.hv.dim` — đếm khách giá trị cao phải đọc được nhóm của khách theo chiều đã khai. */
  dims: Record<string, Dim>;
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

export function TopPriorityBlock({ data, cfg, dims, onGo }: TopPriorityBlockProps) {
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

  const scores = scoreIssues(data, cfg, dims);

  /* LOẠI điểm gãy chưa tính được trục ĐANG XẾP, không xếp nó xuống cuối (ADR-002 §9 rule 3): xếp
     cuối là khẳng định "trục này thấp", tức bịa. Mẫu số của mỗi card vì vậy khác nhau và khác tổng
     số điểm gãy đang mở — `denomStrip` bên dưới nói ra con số thật của chính card đó. */
  const rank = (k: PriKey): DimRow[] =>
    open
      .map((i) => ({ i, v: scores.get(i.id)?.x[k] ?? null }))
      .filter((r): r is { i: Issue; v: number } => r.v !== null)
      .sort((a, b) => b.v - a.v)
      .map(({ i, v }) => ({ id: i.id, l: i.title, v, c: sevColor(i.sev) }));

  const cards: RankCard[] = (
    [
      { k: "aff", unit: "khách bị ảnh hưởng" },
      { k: "hv", unit: "khách giá trị cao" },
      { k: "reg", unit: "mức rủi ro pháp lý" },
    ] as const
  ).map(({ k, unit }) => ({ title: `Top theo ${PRI_LABEL[k].toLowerCase()}`, rows: rank(k), unit }));

  const period = `Ảnh chụp · ${periodLabel(data)}`;

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((c) => {
        const shown = Math.min(c.rows.length, 10);
        const unmeasured = open.length - c.rows.length;
        return (
          <Card
            key={c.title}
            title={c.title}
            subtitle={period}
            /* Mẫu số là số điểm gãy ĐO ĐƯỢC trục này, không phải tổng điểm gãy đang mở — và phần
               chênh được đếm ra chữ chứ không im lặng biến mất, cùng luật với khối "chưa đo" của
               StepGroup. Không có câu này thì một bảng 0 dòng đọc thành "không điểm gãy nào có rủi
               ro pháp lý", trong khi sự thật là chưa ai điền mức cho bước nào. */
            denomStrip={
              unmeasured > 0
                ? `Đang hiện Top ${shown} trên ${c.rows.length} điểm gãy đo được · ${unmeasured} chưa tính được trục này`
                : `Đang hiện Top ${shown} trên ${c.rows.length} điểm gãy`
            }
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
