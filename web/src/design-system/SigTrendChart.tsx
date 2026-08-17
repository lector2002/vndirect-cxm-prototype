import type { SigLine, SigPoint, SigTrendChart as SigTrend } from "../domain/sigTrendChart.ts";
import { CAT_CYCLE } from "../domain/themeSegments.ts";
import { nf } from "./format.ts";

/* Chart trục thời gian của MỘT điểm đo (ADR-001). `LineChart.tsx` không dùng lại được — nó nhận
   `number[]` phẳng, tức không có chỗ nào diễn đạt được ba thứ mà cả ADR này xoay quanh: kỳ ĐỨT
   (0/0), kỳ CHƯA ĐO, và kỳ CHƯA ĐỦ. Cùng kết luận Module B đã ra cho `VerifyChart` (charter §5).

   BA THÀNH NGỮ, BA NGHĨA — không được dùng lẫn (§5, sửa 13/08 sau khi owner nhìn bản dựng):
     · vạch ĐỨT DỌC  = 0/0, không tính được. "Đứt" từ nay CHỈ còn nghĩa này.
     · NỀN mờ + điểm rỗng + cột rỗng = kỳ chưa chạy hết. Ba dấu hiệu cùng một nghĩa nên không chọi
       nhau; dùng nét đứt cho nghĩa này là đưa hai nghĩa khác hẳn vào cùng một thành ngữ, phân biệt
       chỉ bằng hướng và màu — mà ở hạt tháng một kỳ tổng 0 sẽ vẽ CẢ HAI trên cùng một đường.
     · KHÔNG VẼ GÌ = chưa đo (kỳ trước mốc cắm). Không nét, không điểm, không cột khối lượng.

   Dải khối lượng dưới đường là "chân đế" của Đ2 dịch sang trục thời gian (§4): tỉ lệ vọt lên mà dải
   teo lại thì đọc ra ngay là mẫu nhỏ. Nó DÙNG CHUNG trục ngang với đường — mọi đường trên hình chia
   cùng một mẫu số nên một dải phục vụ được hết.

   PHẢI ĐỌC RA ĐƯỢC SỐ (owner 14/08, sau khi nhìn bản dựng đầu): hình không có thang thì người xem
   biết đường đang đi lên nhưng không biết đi lên tới đâu — mà "tới đâu" mới là thứ quyết định có
   mở việc hay không. Bốn chỗ mang số, chép đúng bản demo đã duyệt:
     · bốn mốc thang DỌC bên trái (tỉ lệ ghi `%`, đếm ghi số lượt),
     · số LỚN NHẤT của dải khối lượng, đặt ngay đầu dải — mẫu số đọc được mà không cần rê chuột,
     · mỗi cột khối lượng có tooltip `kỳ · N lượt bắn`,
     · chú giải in SỐ MỚI NHẤT của từng đường.

   MỘT CHART, MỌI ĐƯỜNG LỒNG VÀO NHAU — kể cả khi điểm đo có nhiều giá trị (owner 14/08:
   *"với các trường hợp có nhiều giá trị thì cho thành line graph nhiều line chung và có cả trục dọc"*,
   rồi *"nhiều đường nhưng cần lồng vào nhau đứng chung 1 chart"*). Lối lưới đường nhỏ của §2/§4b
   **bỏ**: nó tách mỗi giá trị ra một ô riêng nên muốn so hai giá trị với nhau phải nhớ hình của ô
   này rồi nhìn sang ô kia — trong khi câu người xem hỏi luôn là "cái nào đang ăn vào cái nào". Ràng
   buộc 5 màu vốn là lý do đẻ ra lưới nay giải bằng HÌNH CỦA ĐIỂM, xem `markerAt`. */

/* `W` là bề ngang tính bằng ĐƠN VỊ NGƯỜI DÙNG của viewBox, và nó phải xấp xỉ bề ngang THẬT của cột
   nội dung. Bản trước để 640 trong khi khung rộng ~1160px: mọi thứ bị phóng 1,8 lần, nên chữ 10
   đơn vị hiện ra thành 18px và cột khối lượng thành những khối xám to bằng nắm tay — owner nhìn
   đúng cái đó và nói "ko nhìn rõ được". Để W sát bề ngang thật thì 1 đơn vị ≈ 1px, cỡ chữ và độ
   dày nét ở đây đọc đúng như con số viết ra. */
const W = 1160;
const PAD_L = 44;
const PAD_R = 10;
const PAD_T = 10;
const PLOT_H = 120;
const GAP = 7;
const VOL_H = 26;
const XLBL_H = 14;
const H = PAD_T + PLOT_H + GAP + VOL_H + XLBL_H;
const VOL_TOP = PAD_T + PLOT_H + GAP;
const TICK = { fontSize: 10, fill: "var(--ink3)" } as const;

export type SigTrendChartProps = {
  chart: SigTrend & { kind: "draw" };
  /** Kỳ đang được lát cắt phía dưới đọc — bấm một kỳ khác thì lát cắt nhảy theo (§2). */
  activeBucket?: string;
  onPickBucket?: (key: string) => void;
};

function isV(p: SigPoint): p is { k: "v"; v: number } {
  return p.k === "v";
}

/** Chiều cao cột khối lượng. Kỳ `0` lượt bắn vẫn PHẢI thấy được: nó là trạng thái (2) *đo được,
    không bắn lần nào* — và cách duy nhất phân biệt nó với trạng thái (3) *chưa đo* trên dải này là
    (3) KHÔNG vẽ cột nào cả. Cột cao đúng 0 pixel thì hai trạng thái nhìn y hệt nhau, tức mất đúng
    phân biệt cả ADR-001 xoay quanh. Kỳ có bắn thì tối thiểu 1px, để một kỳ vài lượt bên cạnh một kỳ
    vài nghìn lượt không tụt xuống thành vô hình. Cùng phép clamp bản demo owner đã duyệt. */
function volH(v: number, max: number, full: number): number {
  return v > 0 ? Math.max(1, (v / max) * full) : 2;
}

/** Trần của thang dọc. KHÔNG cố định 0–100% cho tỉ lệ: phần lớn giá trị lỗi chạy ở vài phần trăm,
    ép thang 0–100% thì mọi đường nằm bẹp sát đáy và cái người xem cần thấy — nó nhúc nhích bao
    nhiêu — biến mất. Sàn `0,08` chặn chiều ngược lại: một điểm đo quanh 0,3% mà thang bám sát dữ
    liệu sẽ phóng đại nhiễu thành sóng thần. Chừa 14% khoảng thở phía trên để đỉnh không dính trần. */
/* `SigTrend` là union có nhánh `refuse` — nhánh đó không mang `unit`, nên phải rút nhánh `draw` ra
   trước khi tra khoá. */
type SigDraw = Extract<SigTrend, { kind: "draw" }>;

function scaleTop(vals: readonly number[], unit: SigDraw["unit"]): number {
  const m = vals.length > 0 ? Math.max(...vals) : 0;
  return Math.max(m, unit === "ratio" ? 0.08 : 1) * 1.14;
}

function tickLabel(v: number, unit: SigDraw["unit"]): string {
  return unit === "ratio" ? `${(v * 100).toFixed(v < 0.1 ? 1 : 0).replace(".", ",")}%` : nf(Math.round(v));
}

/** Toạ độ x của kỳ thứ i. Kỳ nằm GIỮA ô của nó chứ không ở mép: trục này là các KHOẢNG thời gian
    (tháng/tuần/ngày), không phải các mốc tức thời — vẽ ở mép sẽ đọc thành "đo lúc 00:00 ngày 1". */
function xAt(i: number, n: number, left = PAD_L, right = PAD_R): number {
  const step = (W - left - right) / n;
  return left + i * step + step / 2;
}

function bandW(n: number, left = PAD_L, right = PAD_R): number {
  return (W - left - right) / n;
}

/** Chuỗi các đoạn LIỀN NHAU của một đường. Cắt ở mọi điểm không phải `v` — nên `break` và
    `unmeasured` đều làm đứt nét, nhưng chúng được ĐÁNH DẤU khác nhau ở lớp trên. */
function segmentsOf(pts: readonly SigPoint[]): { i: number; v: number }[][] {
  const out: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  pts.forEach((p, i) => {
    if (isV(p)) cur.push({ i, v: p.v });
    else if (cur.length > 0) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length > 0) out.push(cur);
  return out;
}

/** Nhãn kỳ trên trục ngang, THƯA BỚT còn nhiều nhất 9 mốc. Cửa sổ 4 tuần có 28 kỳ — in hết thì chữ
    chồng lên nhau thành một vệt xám, tức mất luôn cả 28 nhãn. Kỳ CUỐI luôn được in: nó là kỳ người
    xem hỏi trước nhất, và cũng là kỳ hay mang nền "chưa đủ". */
function labelEvery(n: number): number {
  return Math.max(1, Math.ceil(n / 9));
}

/* Quá 5 giá trị thì bảng màu hết màu (dự án chỉ có `--cat-1..5`). KHÔNG phân biệt bằng NÉT ĐỨT:
   nét đứt trên hình này đã có nghĩa riêng — vạch đứt dọc = 0/0 — và cho nó thêm nghĩa thứ hai,
   phân biệt chỉ bằng hướng, là đúng cái lỗi §5 đã sửa một lần rồi. Phân biệt bằng HÌNH của điểm:
   vòng tròn → vuông → thoi. Năm màu × ba hình = 15 đường đọc riêng ra được, không mượn thành ngữ
   của ai. Chú giải bên dưới vẽ đúng hình đó nên tra được ngay. */
function markerAt(x: number, y: number, shape: number, color: string, key: number) {
  const r = 2.8;
  if (shape === 1) return <rect key={key} x={x - r} y={y - r} width={r * 2} height={r * 2} fill={color} />;
  if (shape === 2)
    return <polygon key={key} points={`${x},${y - r - 0.6} ${x + r + 0.6},${y} ${x},${y + r + 0.6} ${x - r - 0.6},${y}`} fill={color} />;
  return <circle key={key} cx={x} cy={y} r={r - 0.2} fill={color} />;
}

function penOf(idx: number): { color: string; shape: number } {
  return { color: CAT_CYCLE[idx % CAT_CYCLE.length], shape: Math.floor(idx / CAT_CYCLE.length) % 3 };
}

function Line({ line, idx, n, y }: { line: SigLine; idx: number; n: number; y: (v: number) => number }) {
  const { color, shape } = penOf(idx);
  return (
    <g data-testid={`sigtrend-line-${line.val}`}>
      {segmentsOf(line.pts).map((seg, si) => (
        <polyline
          key={si}
          points={seg.map((p) => `${xAt(p.i, n)},${y(p.v)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      ))}
      {line.pts.map((p, i) => (isV(p) ? markerAt(xAt(i, n), y(p.v), shape, color, i) : null))}
    </g>
  );
}

/** Chú giải: hình của đường + tên giá trị + SỐ MỚI NHẤT của chính nó. Số ở đây là dữ liệu, không
    phải lời bình — nó trả lời "đường này đang ở đâu" mà không bắt người xem rê chuột dò từng đường.
    Không có mũi tên, không có "±x điểm %": owner 14/08 — *"bỏ tất cả '+ điểm %', ko giải thích, chỉ
    vẽ và show data"*, cùng đúng luật 11/08 (app hiện dữ liệu, không luận giải). */
function Legend({ chart }: { chart: SigTrend & { kind: "draw" } }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1" data-testid="sigtrend-legend">
      {chart.lines.map((l, idx) => {
        const { color, shape } = penOf(idx);
        const seen = l.pts.filter(isV);
        const last = seen.length > 0 ? seen[seen.length - 1] : null;
        return (
          <span key={l.val} className="flex items-baseline gap-1.5 text-[12px]" data-testid={`sigtrend-key-${l.val}`}>
            <svg viewBox="0 0 18 8" className="w-[18px] h-2 shrink-0 self-center" role="presentation">
              <line x1={0} y1={4} x2={18} y2={4} stroke={color} strokeWidth={1.8} />
              {markerAt(9, 4, shape, color, 0)}
            </svg>
            <span className="truncate">{l.val}</span>
            {l.undeclared ? <span className="t-meta text-[11px]">chưa khai</span> : null}
            <b className="tabular-nums" data-testid={`sigtrend-last-${l.val}`}>
              {last === null ? "–" : tickLabel(last.v, chart.unit)}
            </b>
          </span>
        );
      })}
    </div>
  );
}

/** Tooltip của một cột khối lượng. Nói ĐỦ ba thứ người xem cần khi nghi ngờ một tỉ lệ: kỳ nào, bao
    nhiêu lượt, và nếu bằng 0 thì vì sao tỉ lệ của kỳ đó không tính được. */
function volTitle(label: string, v: number, partial: boolean): string {
  const zero = v > 0 ? "" : " — không bắn lần nào, tỉ lệ không tính được";
  return `${label} · ${nf(v)} lượt bắn${zero}${partial ? " · kỳ chưa đủ" : ""}`;
}

export function SigTrendChart({ chart, activeBucket, onPickBucket }: SigTrendChartProps) {
  const n = chart.buckets.length;
  const bw = bandW(n);
  const top = scaleTop(chart.lines.flatMap((l) => l.pts.filter(isV).map((p) => p.v)), chart.unit);
  const y = (v: number) => PAD_T + PLOT_H - (v / top) * PLOT_H;

  const maxVol = Math.max(1, ...chart.vol.filter((v): v is number => v !== null));
  const every = labelEvery(n);

  /* Chỗ NGẮT (0/0) đánh bằng vạch đứt DỌC tại đúng kỳ đó — không phải bằng nét đứt của đường, xem
     docblock. Chỉ vẽ khi ÍT NHẤT một đường ngắt ở kỳ đó; ở chart tỉ lệ thì mọi đường ngắt cùng lúc
     vì chúng chung một mẫu số. */
  const breakAt = chart.buckets.map((_b, i) => chart.lines.some((l) => l.pts[i].k === "break"));

  return (
    <div data-testid="sigtrend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
        {/* Nền kỳ CHƯA ĐỦ — vẽ trước mọi thứ để nó nằm dưới, phủ cả vùng đường lẫn dải khối lượng
            (cột cuối mới có 27/31 ngày nên thấp hơn thật, mà dải khối lượng đúng là ô có nhiệm vụ
            nói thật về mẫu số — không đánh dấu thì mọi đường đọc thành "đang tụt"). */}
        {chart.buckets.map((b, i) =>
          b.partial ? (
            <rect
              key={b.key}
              x={xAt(i, n) - bw / 2}
              y={PAD_T}
              width={bw}
              height={PLOT_H + GAP + VOL_H}
              fill="var(--line)"
              opacity={0.35}
              data-testid={`sigtrend-partial-${b.key}`}
            />
          ) : null,
        )}

        {/* Thang DỌC: bốn mốc, mỗi mốc một số. Đây là chỗ trả lời "đang nhìn số liệu bao nhiêu". */}
        <g data-testid="sigtrend-yaxis">
          {[0, 1, 2, 3].map((g) => {
            const yy = PAD_T + (PLOT_H * g) / 3;
            return (
              <g key={g}>
                <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="var(--line)" />
                <text x={PAD_L - 6} y={yy + 3} textAnchor="end" {...TICK}>
                  {tickLabel(top * (1 - g / 3), chart.unit)}
                </text>
              </g>
            );
          })}
        </g>

        {breakAt.map((on, i) =>
          on ? (
            <line
              key={i}
              x1={xAt(i, n)}
              y1={PAD_T}
              x2={xAt(i, n)}
              y2={PAD_T + PLOT_H}
              stroke="var(--ink3)"
              strokeDasharray="3 3"
              data-testid={`sigtrend-break-${chart.buckets[i].key}`}
            />
          ) : null,
        )}

        {chart.lines.map((l, idx) => (
          <Line key={l.val} line={l} idx={idx} n={n} y={y} />
        ))}

        {/* Điểm RỖNG ở kỳ chưa đủ — dấu hiệu thứ hai của cùng một nghĩa, đặt trên đường. */}
        {chart.buckets.map((b, i) =>
          b.partial
            ? chart.lines.map((l, li) =>
                isV(l.pts[i]) ? (
                  <circle
                    key={`${b.key}-${li}`}
                    cx={xAt(i, n)}
                    cy={y((l.pts[i] as { k: "v"; v: number }).v)}
                    r={2.8}
                    fill="var(--surface)"
                    stroke={CAT_CYCLE[li % CAT_CYCLE.length]}
                    strokeWidth={1.4}
                  />
                ) : null,
              )
            : null,
        )}

        {/* Dải khối lượng. `null` ⇒ KHÔNG vẽ cột (chưa đo), khác hẳn cột cao 0 (đo được, không bắn). */}
        {chart.vol.map((v, i) => {
          if (v === null) return null;
          const h = volH(v, maxVol, VOL_H);
          const b = chart.buckets[i];
          return (
            <rect
              key={b.key}
              x={xAt(i, n) - bw * 0.3}
              y={VOL_TOP + VOL_H - h}
              width={bw * 0.6}
              height={h}
              fill={b.partial ? "var(--surface)" : "var(--ink3)"}
              stroke={b.partial ? "var(--ink3)" : "none"}
              strokeWidth={b.partial ? 1 : 0}
              opacity={b.partial ? 1 : 0.28}
              data-testid={`sigtrend-vol-${b.key}`}
            >
              <title>{volTitle(b.label, v, b.partial)}</title>
            </rect>
          );
        })}
        {/* Trần của dải khối lượng — mẫu số lớn nhất trong cửa sổ, đọc được ngay không cần rê chuột. */}
        <text x={PAD_L - 6} y={VOL_TOP + VOL_H} textAnchor="end" {...TICK} data-testid="sigtrend-volmax">
          {nf(maxVol)}
        </text>

        {/* Nhãn kỳ, thưa bớt. Kỳ cuối luôn in. */}
        <g data-testid="sigtrend-axis">
          {chart.buckets.map((b, i) =>
            i % every === 0 || i === n - 1 ? (
              <text
                key={b.key}
                x={xAt(i, n)}
                y={H - 3}
                textAnchor="middle"
                {...TICK}
                opacity={b.partial ? 0.6 : 1}
              >
                {b.label}
              </text>
            ) : null,
          )}
        </g>

        {/* Vùng bấm phủ cả cột — bấm một kỳ thì lát cắt phía dưới nhảy về đúng kỳ đó (§2). */}
        {onPickBucket
          ? chart.buckets.map((b, i) => (
              <rect
                key={b.key}
                x={xAt(i, n) - bw / 2}
                y={PAD_T}
                width={bw}
                height={PLOT_H + GAP + VOL_H}
                fill={activeBucket === b.key ? "var(--ink3)" : "transparent"}
                opacity={activeBucket === b.key ? 0.1 : 1}
                className="cursor-pointer"
                onClick={() => onPickBucket(b.key)}
                data-testid={`sigtrend-pick-${b.key}`}
              >
                <title>{b.label}</title>
              </rect>
            ))
          : null}
      </svg>
      <Legend chart={chart} />
    </div>
  );
}
