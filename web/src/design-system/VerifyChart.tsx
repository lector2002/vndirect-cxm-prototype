import type { VerifyTimeline } from "../domain/verifyTimeline.ts";

/* Chart trước/sau của màn Điểm gãy (module-b-issue-charter.md, section B3) — thuần presentational,
   nhận VerifyTimeline đã nối sẵn. CỐ Ý không nới LineChart: file đó là port 1-1 hình học prototype
   đang đỡ trend/cohort của Quantify (quyết định thiết kế #5 charter).

   Kênh không-phải-màu cho điểm minh hoạ: đoạn nối chạm điểm demo vẽ NÉT ĐỨT và điểm demo là vòng
   rỗng — cùng lối IssueBar dùng dấu ✓ thay vì chỉ màu. Nhãn "số minh hoạ" đọc cờ `tl.demo` trên
   dữ liệu, không hardcode (bất biến 5) — nguồn thật vào là nhãn tự tắt.

   Nhãn kỳ: điểm `pre` in thẳng nhãn tháng ngắn; mốc đóng băng và điểm sau đo trên CỬA SỔ TỰ DO
   (chuỗi dài) nên trục x chỉ ghi vai trò, còn cửa sổ đầy đủ + câu trộn grain in ở caption dưới
   chart — đúng yêu cầu "chart phải nói ra bằng chữ" của charter. */

export type VerifyChartProps = {
  tl: VerifyTimeline;
};

const W = 640;
const H = 230;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 34;

/** Số đầu tiên trong chuỗi target ("≥ 90%" → 90; "≤ 15%" → 15). NaN khi target không mang số —
    khi đó không vẽ đường mục tiêu, không đoán. */
function targetNumber(target: string): number {
  return parseFloat((target.match(/[\d]+(?:[.,]\d+)?/)?.[0] ?? "").replace(",", "."));
}

export function VerifyChart({ tl }: VerifyChartProps) {
  const { points } = tl;
  if (points.length === 0) return null;

  const tnum = targetNumber(tl.target);
  const vals = points.map((p) => p.v);
  if (Number.isFinite(tnum)) vals.push(tnum);
  const vMin = Math.min(...vals);
  const vMax = Math.max(...vals);
  const span = vMax - vMin || 1;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (points.length === 1 ? innerW / 2 : (i * innerW) / (points.length - 1));
  const y = (v: number) => PAD_T + innerH - ((v - vMin) / span) * innerH;

  const frozenIdx = tl.frozenAt;
  const releaseX =
    tl.releaseAfter === null
      ? null
      : tl.releaseAfter < points.length - 1
        ? (x(tl.releaseAfter) + x(tl.releaseAfter + 1)) / 2
        : x(tl.releaseAfter) + 18;

  const num = (v: number) => String(v).replace(".", ",");

  return (
    <div data-testid="verify-chart">
      {tl.demo ? (
        <div data-testid="verify-demo" className="inline-block px-2 py-0.5 rounded-[7px] text-[11px] font-bold border border-dashed border-ink-3 text-ink-3 mb-2">
          Các kỳ trước là số minh hoạ
        </div>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Diễn biến chỉ số (${tl.unit})`}>
        {/* đường mục tiêu — ngang, nét chấm, nhãn nguyên văn Metric.target */}
        {Number.isFinite(tnum) ? (
          <g data-testid="verify-target">
            <line x1={PAD_L} x2={W - PAD_R} y1={y(tnum)} y2={y(tnum)} stroke="var(--good)" strokeDasharray="2 4" />
            {/* nhãn neo TRÁI: góc phải trên đã chật (giá trị điểm "sau" + vạch phát hành) — bên trái
                chỉ có các điểm pre thấp hơn nhiều nên luôn trống */}
            <text x={PAD_L + 2} y={y(tnum) - 4} fontSize="10" fill="var(--good)">{`mục tiêu ${tl.target}`}</text>
          </g>
        ) : null}

        {/* vạch dọc mốc đóng băng */}
        {frozenIdx !== null ? (
          <g data-testid="verify-frozen-line">
            <line x1={x(frozenIdx)} x2={x(frozenIdx)} y1={PAD_T - 6} y2={H - PAD_B} stroke="var(--ink3)" />
            {/* khi chưa có điểm "sau", mốc đóng băng là điểm cuối sát mép phải: nhãn đỉnh sẽ đè
                lên giá trị của chính điểm đó và tràn mép — bỏ, vì nhãn trục x đã ghi "đóng băng" */}
            {x(frozenIdx) <= W - 60 ? (
              <text x={x(frozenIdx)} y={PAD_T - 8} textAnchor="middle" fontSize="10" fill="var(--ink3)">
                đóng băng
              </text>
            ) : null}
          </g>
        ) : null}

        {/* vạch dọc phát hành — chỉ khi Action.rel tồn tại */}
        {releaseX !== null ? (
          <g data-testid="verify-release">
            <line x1={releaseX} x2={releaseX} y1={PAD_T - 6} y2={H - PAD_B} stroke="var(--watch)" strokeDasharray="5 3" />
            {/* neo "end" về mép trái vạch: vạch phát hành nằm sát điểm "sau" nên viết sang phải
                sẽ đè lên giá trị của điểm đó */}
            <text x={releaseX - 4} y={PAD_T + 10} textAnchor="end" fontSize="10" fill="var(--watch)">phát hành</text>
          </g>
        ) : null}

        {/* đoạn nối — nét đứt khi chạm điểm demo (kênh không-phải-màu) */}
        {points.slice(1).map((pt, i) => (
          <line
            key={`seg-${pt.kind}-${pt.p}`}
            x1={x(i)}
            y1={y(points[i].v)}
            x2={x(i + 1)}
            y2={y(pt.v)}
            stroke="var(--primary)"
            strokeWidth="1.75"
            strokeDasharray={points[i].demo || pt.demo ? "4 3" : undefined}
          />
        ))}

        {/* điểm — demo là vòng rỗng; đóng băng/sau in kèm giá trị */}
        {points.map((pt, i) => (
          <g key={`pt-${pt.kind}-${pt.p}`}>
            <circle
              cx={x(i)}
              cy={y(pt.v)}
              r={pt.kind === "pre" ? 3.2 : 4.2}
              fill={pt.demo ? "var(--surface)" : "var(--primary)"}
              stroke="var(--primary)"
              strokeWidth="1.5"
            />
            {pt.kind !== "pre" ? (
              <text
                x={x(i)}
                y={y(pt.v) - 8}
                textAnchor={x(i) > W - 60 ? "end" : "middle"}
                fontSize="11"
                fontWeight="700"
                fill="var(--ink)"
              >
                {`${num(pt.v)}${tl.unit}`}
              </text>
            ) : null}
            <text
              x={x(i)}
              y={H - PAD_B + 14}
              textAnchor={x(i) > W - 60 ? "end" : "middle"}
              fontSize="9.5"
              fill="var(--ink3)"
            >
              {pt.kind === "pre" ? pt.p : pt.kind === "frozen" ? "đóng băng" : "sau"}
            </text>
          </g>
        ))}
      </svg>

      {/* cửa sổ đo đầy đủ + câu trộn grain — chart nói ra bằng chữ, không để hình tự kể */}
      <div className="text-[11.5px] text-ink-3 mt-1 flex flex-col gap-0.5">
        {points
          .filter((pt) => pt.kind !== "pre")
          .map((pt) => (
            <span key={`cap-${pt.kind}`}>
              {pt.kind === "frozen" ? "Mốc đóng băng" : "Sau thay đổi"}: {num(pt.v)}
              {tl.unit} · cửa sổ {pt.p}
            </span>
          ))}
        {tl.releaseLabel ? <span>Phát hành: {tl.releaseLabel}</span> : null}
        {tl.note ? <span>{tl.note}</span> : null}
      </div>
    </div>
  );
}
