import type { Cfg, CxmData, DimRow, Obs, Step } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Bars, Card, Note } from "../../../design-system/index.ts";

/* @coverage — "Ta đo được bao nhiêu phần hành trình?".

   Bản port 1-1 (prototype dòng 2197-2211) vẽ MỘT THANH CHO MỖI BƯỚC. Cùng cái bẫy đã làm hỏng
   @journeystate: hồi pilot có sáu bước thì sáu thanh vừa vặn, mở pilot lên hai phase thành 30 thanh,
   và full hành trình sẽ là hàng trăm. Owner chốt 05/08: đổi sang PHÂN BỐ THEO DẢI ĐỘ PHỦ.

   Điểm mấu chốt của lựa chọn này, và là lý do nó khác hai phương án còn lại: số thanh KHÔNG PHỤ
   THUỘC số bước. 30 bước hay 300 bước vẫn đúng bốn dải. Gộp theo hành trình thì gọn hơn hiện tại
   nhưng vẫn nở tới 32 thanh khi map hết — tức chỉ hoãn đúng vấn đề owner đang chỉ ra.

   Đổi lại, dải phủ không tự chỉ được chỗ cần làm, nên có thêm danh sách "mù nhất" — cắt cứng ở ba
   bước, phần còn lại đếm ra chữ chứ không kéo dài danh sách.

   Mốc chia dải SUY TỪ `cfg.step.covMin`, không ghim 70 vào code: owner đổi ngưỡng thì cả nhãn dải
   lẫn câu chốt phải đổi theo, nếu không màn sẽ khoe một ngưỡng không còn hiệu lực.

   Giữ từ bản cũ (D1, charter Phase 2, owner chốt 01/08): giá trị ở đây KHÔNG được nhân `fx()`.
   Prototype gọi `rankBars()` mặc định nên paint `fx(85)=476` — lỗi thật, chỉ sửa ở `web/`, KHÔNG
   chạm `output/cxm-platform-prototype.html`. Nay `v` là SỐ BƯỚC (đếm được, không phải volume tổng
   hợp) nên truyền thẳng `scaled={false}` thay vì chỉ vá ở `formatValue`. */
export type CoverageBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Bấm một dải → điều hướng bản đồ hành trình (port click:()=>go('atlas'), prototype dòng 2201). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

type StepObs = { step: Step; obs: Obs };

/** Số bước "mù nhất" nêu đích danh. Cắt cứng — danh sách này để CHỈ CHỖ, không để liệt kê hết. */
const BLIND_SHOWN = 3;

type Bucket = { id: string; label: string; lo: number; hi: number | null };

/* Mốc chia dải: 50 (gần như mù) · covMin (ngưỡng) · 90 (đủ để kết luận). Dùng Set nên ngưỡng trùng
   một mốc có sẵn thì ra ba dải chứ không ra một dải rỗng — và thứ tự vẫn đúng nếu owner đặt covMin
   ngoài khoảng (50, 90). */
export function coverageBuckets(covMin: number): Bucket[] {
  const edges = [...new Set([50, covMin, 90])].sort((a, b) => a - b);
  const out: Bucket[] = [];
  for (let i = edges.length - 1; i >= 0; i--) {
    const lo = edges[i]!;
    const hi = i === edges.length - 1 ? null : edges[i + 1]! - 1;
    out.push({ id: `cov-${lo}`, label: hi === null ? `≥ ${lo}%` : `${lo}–${hi}%`, lo, hi });
  }
  out.push({ id: "cov-0", label: `< ${edges[0]}%`, lo: 0, hi: edges[0]! - 1 });
  return out;
}

/** Chú cho mỗi dải, đọc theo ngưỡng chứ không theo con số cứng. */
function bucketNote(b: Bucket, covMin: number): string {
  if (b.lo > covMin) return "đủ để kết luận";
  if (b.lo === covMin) return "đạt ngưỡng";
  return b.lo === 0 ? "gần như mù" : "dưới ngưỡng";
}

export function CoverageBlock({ data, cfg, onGo }: CoverageBlockProps) {
  const covMin = cfg.step.covMin;

  const measured: StepObs[] = data.steps
    .map((step) => ({ step, obs: data.obs.find((o) => o.stepId === step.id) }))
    .filter((p): p is StepObs => p.obs !== undefined);

  /* Bước đã khai mà CHƯA ĐO không có độ phủ, nên không thuộc dải nào — và tuyệt đối không được dồn
     vào dải thấp nhất: "chưa đo" khác hẳn "đo rồi, phủ kém". Đếm riêng, nói riêng. */
  const unmeasured = data.steps.length - measured.length;

  const buckets = coverageBuckets(covMin);
  const rows: DimRow[] = buckets.map((b) => ({
    id: b.id,
    l: `${b.label} · ${bucketNote(b, covMin)}`,
    v: measured.filter((p) => p.obs.cov >= b.lo && (b.hi === null || p.obs.cov <= b.hi)).length,
    c: b.lo < covMin ? "var(--watch)" : "var(--ink3)",
  }));

  const below = measured
    .filter((p) => p.obs.cov < covMin)
    .sort((a, b) => a.obs.cov - b.obs.cov);
  const passing = measured.length - below.length;
  const flowName = (flowId: string) => data.flows.find((f) => f.id === flowId)?.name ?? flowId;
  const flowsNoSteps = data.flows.filter((f) => !data.steps.some((s) => s.flowId === f.id)).length;

  return (
    <Card
      title="Độ phủ đo lường"
      subtitle={`Ảnh chụp · ${periodLabel(data)}`}
      denomStrip={`Đang hiện ${measured.length} bước đã đo trên ${data.steps.length} bước đã khai · ${flowsNoSteps} trên ${data.flows.length} flow chưa khai bước nào`}
    >
      <p className="text-[13px] text-ink-2 mt-0 mb-2.5" data-testid="cov-headline">
        <b>
          {passing} trên {measured.length} bước
        </b>{" "}
        đạt ngưỡng phủ {covMin}%
      </p>

      <Bars
        rows={rows}
        total={measured.length}
        scaled={false}
        formatValue={(r) => String(r.v)}
        onRowClick={onGo ? () => onGo("atlas") : undefined}
        axisLabel="Số bước trong mỗi dải độ phủ"
      />

      {unmeasured > 0 ? (
        <div className="mt-2.5" data-testid="cov-unmeasured">
          <Note tone="warn">
            <b>{unmeasured} bước đã khai nhưng chưa đo.</b> Chúng không có độ phủ nên không nằm trong
            dải nào ở trên — đây là chỗ chưa biết, không phải chỗ phủ kém.
          </Note>
        </div>
      ) : null}

      <div className="mt-3" data-testid="cov-blind">
        {below.length === 0 ? (
          <p className="text-[12.5px] text-ink-3 m-0">
            Không bước nào đang dưới ngưỡng {covMin}%.
          </p>
        ) : (
          <>
            <div className="text-[12.5px] font-semibold text-ink-2 mb-1.5">Mù nhất:</div>
            <ul className="list-none p-0 m-0 flex flex-col gap-1">
              {below.slice(0, BLIND_SHOWN).map((p) => (
                <li key={p.step.id} className="text-[12.5px] text-ink-2 flex gap-2">
                  <b className="font-mono tabular-nums shrink-0" style={{ color: "var(--watch)" }}>
                    {p.obs.cov}%
                  </b>
                  {/* Tên hành trình đứng trước mã bước: mã bước lặp giữa các flow ("01" có 6 nghĩa),
                      thiếu tên flow thì dòng này mập mờ y như chip cũ của @journeystate. */}
                  <span className="truncate">
                    {flowName(p.step.flowId)} · {p.step.code} {p.step.name}
                  </span>
                </li>
              ))}
            </ul>
            {below.length > BLIND_SHOWN ? (
              <p className="text-[12px] text-ink-3 mt-1.5 mb-0" data-testid="cov-blind-more">
                +{below.length - BLIND_SHOWN} bước nữa dưới ngưỡng — mở bản đồ hành trình để xem hết.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
