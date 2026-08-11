import type { Signal } from "../../data/schema/index.ts";
import { Badge, Note, Stat } from "../../design-system/index.ts";
import { SIGNAL_STATUS } from "./signalStatus.ts";

/* Tab "Độ phủ dữ liệu" của hồ sơ bước — port stepInspector() nhánh `cov` (prototype
   output/cxm-platform-prototype.html dòng 3530-3548). Trả lời: những gì màn nói về bước này đáng tin
   tới đâu, và còn thiếu đo cái gì.

   Vị trí giữ ĐÚNG chỗ: độ phủ là thuộc tính của BƯỚC, không phải một màn riêng — nên nó sống cạnh
   chính bước đang xét. Câu chốt luận giải của prototype thì KHÔNG còn giữ nguyên: luật giao diện
   11/08 (`docs/DB-FIRST-HANDOFF.md` §"App hiển thị dữ liệu, không luận giải") đã cắt xuống chỉ còn
   câu nói trạng thái dữ liệu đang có, xem hai chỗ đánh dấu "luật 11/08" trong JSX dưới.

   07/08 (module-i-signal-registry-charter.md D4): bỏ Stat "Evidence coverage" (đọc trường `cov`
   của obs, số gõ tay không đối chiếu được, kèm `srcNote="Mobile SDK event registry"` hardcode
   không có căn cứ dữ liệu) và câu chốt covWarn/không-covWarn suy từ nó. Không có số đếm được để
   thay vào — hiện trạng thái rỗng TRUNG THỰC thay vì bịa số khác. `obs`/`cfg` không còn cần truyền
   vào component này vì phần duy nhất dùng chúng đã bỏ; "Signal chưa hoạt động" (dưới) đọc
   `signals`, KHÔNG đọc trường `cov` — không đổi. */

export type AtlasCoverageTabProps = {
  /** Điểm đo của bước (đã lọc ở caller) — gồm cả gap/designed, vì tab này tồn tại để đếm đúng chúng. */
  signals: Signal[];
};

export function AtlasCoverageTab({ signals }: AtlasCoverageTabProps) {
  // "Chưa hoạt động" = gap (chưa instrument) HOẶC designed (mới có spec) — hai cách chưa chạy thật.
  const inactive = signals.filter((g) => g.st === "gap" || g.st === "designed");
  /* "Không có điểm đo nào chưa hoạt động" KHÁC "có điểm đo và đều đang chạy" — bước chưa khai điểm
     đo nào cũng cho `inactive.length === 0`, và nếu cứ thế in "Đủ signal" thì màn đang khen một bước
     hoàn toàn chưa được instrument. Tách hẳn ca này ra, đúng như ba nghĩa "không biết" ở chart điểm
     đo. Có thật trong pilot: vd bước 04 flow nạp tiền (phase 03 Dòng tiền). */
  const noSignal = signals.length === 0;

  return (
    <div data-testid="atlas-cov">
      <div className="mb-3.5">
        <Stat
          label="Signal chưa hoạt động"
          value={noSignal ? "—" : String(inactive.length)}
          foot={
            noSignal
              ? "Bước chưa khai signal nào"
              : inactive.length
                ? "Chưa instrument hoặc chỉ có spec"
                : "Đủ signal"
          }
          tone={noSignal ? "var(--watch)" : undefined}
        />
      </div>

      <div data-testid="atlas-cov-empty">
        {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
        <Note tone="warn">Chưa có số đo được về độ phủ bằng chứng.</Note>
      </div>

      {noSignal ? (
        <div className="mt-2.5" data-testid="atlas-cov-nosignal">
          {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
          <Note tone="warn">Bước này chưa khai điểm đo nào.</Note>
        </div>
      ) : null}

      {inactive.length > 0 ? (
        <div className="mt-3.5" data-testid="atlas-cov-missing">
          <div className="t-lbl mb-2">Signal đang thiếu</div>
          <div className="border border-line rounded-[10px] divide-y divide-line">
            {inactive.map((g) => {
              const status = SIGNAL_STATUS[g.st];
              return (
                <div key={g.id} className="px-3.5 py-3" data-testid={`atlas-cov-sig-${g.id}`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge state={status.badge} text={status.label} />
                    <code className="font-mono text-[12px] text-primary">{g.name}</code>
                    <span className="t-meta text-[12px] ml-auto">{g.pf.join(", ")}</span>
                  </div>
                  <div className="t-meta text-[12px] mt-1.5">{g.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* luật 11/08: bỏ lý lẽ vì sao khối này nằm ở đây */}
    </div>
  );
}
