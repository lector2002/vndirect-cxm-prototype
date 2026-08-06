import { nf } from "./format.ts";

/* Biểu đồ đường nhiều topic qua các kỳ — port topicLineChart() (prototype dòng 3824-3850): hình
   học SVG, bảng màu, nét đứt cho topic mới trồi lên, legend bấm được để bỏ đường. Viết lại bằng
   JSX, không thiết kế lại.

   BA CHỖ CẦN NÓI RÕ.

   1. VÌ SAO KHÔNG DÙNG `LineChart` CÓ SẴN. `LineChart.tsx` khai đúng hai màu (`COLORS` dòng 5) cho
      hợp đồng cohort hai nhóm của QuantifyWidget; đường thứ ba trở đi rơi hết về `ink3`. Sáu đường
      topic qua đó thành bốn đường xám không phân biệt nổi. Nới bảng màu của nó là đổi hợp đồng một
      chart khác đang chạy, nên đây là component riêng.

   2. MỘT THANG DỌC CHUNG CHO MỌI ĐƯỜNG — cố ý, và khác lựa chọn ở chart cột theo điểm đo (nơi mỗi
      nhóm có thang cao riêng). Lý do: ở đó câu hỏi là "hình dạng từng nhóm ra sao", mỗi nhóm một
      thang mới đọc được. Ở đây câu hỏi là "topic nào to hơn và đang chạy về đâu" — cho mỗi topic
      một thang riêng thì một topic 40 và một topic 900 trông cao bằng nhau, tức là chart trả lời
      sai chính câu nó được hỏi.

   3. TRỤC NGANG KHÔNG GHI TÊN THÁNG. Prototype dán mảng nhãn tháng cứng (`MONTHS12`) lên trục.
      Dữ liệu ở đây không mang nhãn kỳ nào cả, nên viết tên tháng ra là bịa. Trục chỉ nói hướng
      thời gian và số kỳ — khi dữ liệu thật có nhãn kỳ thì thêm vào, không đoán trước. */

/** Bảng màu theo thứ tự đường — port 1-1 LINE_PAL (prototype dòng 3798). */
const PAL = ["#D9531E", "#2563EB", "#16A34A", "#9333EA", "#0891B2", "#CA8A04", "#DB2777", "#475569"];

const W = 760;
const H = 300;
const ML = 52;
const MR = 14;
const MT = 12;
const MB = 30;

export type TopicSeries = {
  id: string;
  name: string;
  /** Chuỗi điểm THẬT của kỳ đang xem — component không nội suy, không độn. */
  pts: number[];
  /** Topic mới trồi lên: vẽ nét đứt + chấm rỗng ở kỳ đầu. */
  fresh: boolean;
};

export type TopicLineChartProps = {
  series: TopicSeries[];
  /** Bấm chip legend để bỏ đường đó khỏi biểu đồ. */
  onRemove?: (id: string) => void;
};

export function TopicLineChart({ series, onRemove }: TopicLineChartProps) {
  if (series.length === 0) {
    return (
      <div data-testid="topic-lines-empty" className="t-meta">
        Chưa chọn topic nào để vẽ. Bấm <b>★</b> ở bảng bên dưới để thêm một đường vào biểu đồ.
      </div>
    );
  }

  /* Số kỳ vẽ được = chuỗi DÀI NHẤT trong các đường đang chọn. Đường ngắn hơn vẫn vẽ đúng phần nó
     có, trải đều trên cùng bề ngang — không kéo dài giả, không cắt cụt đường dài. */
  const periods = Math.max(...series.map((s) => s.pts.length));
  const maxV = Math.max(1, ...series.flatMap((s) => s.pts));
  const pw = W - ML - MR;
  const ph = H - MT - MB;
  const yOf = (v: number) => MT + ph - (v / maxV) * ph;
  const xOf = (i: number, len: number) => ML + (len > 1 ? i / (len - 1) : 0.5) * pw;

  return (
    <div data-testid="topic-lines">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {series.map((s, si) => (
          <button
            key={s.id}
            type="button"
            data-testid={`topic-line-chip-${s.id}`}
            onClick={() => onRemove?.(s.id)}
            title="Bỏ đường này khỏi biểu đồ"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[7px] text-[12px] font-semibold border border-line bg-surface-2 text-ink-2 hover:border-ink-3"
          >
            <span
              aria-hidden="true"
              className="inline-block w-2.5 h-2.5 rounded-[2px] flex-none"
              style={{ background: PAL[si % PAL.length] }}
            />
            {s.name}
            {s.fresh ? " ✨" : ""}
            <b className="text-ink-3">✕</b>
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block"
        style={{ maxWidth: W }}
        role="img"
        aria-label={`Biểu đồ đường xu hướng ${series.length} topic qua ${periods} kỳ gần nhất`}
      >
        {[0, maxV / 2, maxV].map((v) => (
          <g key={v}>
            <line x1={ML} y1={yOf(v)} x2={W - MR} y2={yOf(v)} stroke="var(--line)" />
            <text x={ML - 7} y={yOf(v) + 4} textAnchor="end" fontSize={11} fill="var(--ink3)">
              {nf(Math.round(v))}
            </text>
          </g>
        ))}

        {series.map((s, si) => {
          const c = PAL[si % PAL.length];
          const pts = s.pts.map((v, i) => `${xOf(i, s.pts.length).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
          const lastI = s.pts.length - 1;
          return (
            <g key={s.id}>
              <polyline
                points={pts}
                fill="none"
                stroke={c}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeDasharray={s.fresh ? "6 4" : undefined}
              />
              <circle cx={xOf(lastI, s.pts.length)} cy={yOf(s.pts[lastI]!)} r={3.5} fill={c} />
              {/* Chấm rỗng ở kỳ đầu = mốc topic bắt đầu trồi lên, cho biết đường nét đứt bắt từ đâu. */}
              {s.fresh ? (
                <circle
                  cx={xOf(0, s.pts.length)}
                  cy={yOf(s.pts[0]!)}
                  r={3.2}
                  fill="var(--surface)"
                  stroke={c}
                  strokeWidth={1.6}
                />
              ) : null}
            </g>
          );
        })}

        {/* Hai đầu trục ngang: nói hướng thời gian mà không bịa tên tháng. */}
        <text x={ML} y={H - 10} textAnchor="start" fontSize={11} fill="var(--ink3)">
          kỳ xa nhất
        </text>
        <text x={W - MR} y={H - 10} textAnchor="end" fontSize={11} fill="var(--ink3)">
          kỳ gần nhất
        </text>
      </svg>
    </div>
  );
}
