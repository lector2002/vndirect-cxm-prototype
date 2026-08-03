import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { BASE_FACTOR, laneOf } from "../../../domain/index.ts";
import type { LaneKey } from "../../../domain/index.ts";
import { AxisLabel, Card } from "../../../design-system/index.ts";

/* @lanes — port 1-1 "Việc đang chạy tới đâu?" (prototype dòng 2213-2229 + hằng LANES dòng
   2882-2895). Drill-down CHỈ điều hướng route: prototype gọi setSub('work','lanes') trước
   go('work') — ý định sub-tab work/lanes DEFER sang Phase 3 (charter, bất biến F2+F3), ở đây
   chỉ gọi onGo('work'). */
export type LanesBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung 5 block S2.3 (data+cfg+onGo) — laneOf() không cần cfg nên
      component này KHÔNG dùng cfg bên trong. */
  cfg: Cfg;
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

/* Port 1-1 hằng LANES (prototype dòng 2882-2895) — thứ tự và nhãn cố định, KHÔNG suy từ cfg vì
   đây là 4 giai đoạn quy trình xử lý, không phải ngưỡng đo lường. */
const LANES: { k: LaneKey; n: string; l: string }[] = [
  { k: "confirm", n: "1", l: "Cần xác nhận" },
  { k: "approve", n: "2", l: "Chờ duyệt" },
  { k: "fix", n: "3", l: "Đang sửa" },
  { k: "verify", n: "4", l: "Đang verify" },
];

export function LanesBlock({ data, onGo }: LanesBlockProps) {
  const issOf = (id: string) => data.iss.find((i) => i.id === id);
  const inWork = data.act.filter((a) => laneOf(a) !== "off").length;

  return (
    <Card
      title="Bốn làn công việc"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      /* Mẫu số là TỔNG action đã ghi nhận, tử số là số còn nằm trong 4 làn. Trước 02/08/2026 hai số
         này đều bằng 6 nên nhãn cũ ("… trên 6 việc còn cần tay người") đọc vẫn trót lọt; từ khi
         CXA-013 khép vòng (laneOf → 'off') thì thành 5/6, và nhãn cũ hoá ra nói sai về mẫu số. */
      denomStrip={`Đang hiện Top ${inWork} trên ${data.act.length} action đã ghi nhận`}
    >
      <div className="grid grid-cols-4 gap-3">
        {LANES.map((L) => {
          const list = data.act
            .filter((a) => laneOf(a) === L.k)
            .sort((x, y) => (issOf(y.iss)?.pri.total ?? 0) - (issOf(x.iss)?.pri.total ?? 0));
          const hot = L.k === "confirm" && list.length > 0;
          return (
            <button
              key={L.k}
              type="button"
              onClick={() => onGo?.("work")}
              className={`text-left p-[13px] rounded border bg-surface ${hot ? "border-crit" : "border-line"}`}
            >
              <div className="t-lbl">
                {L.n} · {L.l}
              </div>
              <div
                data-testid="lane-count"
                className={`text-[26px] font-bold mt-1 mb-0.5 ${hot ? "text-crit" : ""}`}
              >
                {list.length}
              </div>
            </button>
          );
        })}
      </div>
      <AxisLabel>Số hành động trong mỗi làn</AxisLabel>
    </Card>
  );
}
