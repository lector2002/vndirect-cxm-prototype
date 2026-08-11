import type { Cfg, CxmData } from "../../../data/schema/index.ts";
import { BASE_FACTOR } from "../../../domain/index.ts";
import { Card, Note } from "../../../design-system/index.ts";

/* @coverage — "Ta đo được bao nhiêu phần hành trình?".

   07/08 (module-i-signal-registry-charter.md D4, F10): khối này từng phân bố 30 bước theo dải
   trường `cov` của obs (tỉ lệ tự khai không đối chiếu được, đang cầm quyền đẩy trạng thái bước ở
   domain/state.ts). Owner chốt bỏ `cov` khỏi MỌI chỗ tiêu thụ mà KHÔNG xoá field khỏi
   schema/fixture (charter §5 D4) — khối này mất hết nội dung khi bỏ cov (charter §7, F10 đã dự
   đoán đúng điều này). KHÔNG xoá khối, KHÔNG xoá route (owner 07/08): hiện trạng thái rỗng TRUNG
   THỰC thay vì bịa số khác hay để trống trơn. Số đếm được để thay `cov` (mã lý do rớt theo bước)
   chưa có — nằm trong bản yêu cầu dữ liệu gửi team data (charter §10). */
export type CoverageBlockProps = {
  data: CxmData;
  cfg: Cfg;
  /** Link phụ cuối khối → bản đồ hành trình (port click:()=>go('atlas'), prototype dòng 2201). */
  onGo?: (route: string) => void;
};

function periodLabel(data: CxmData): string {
  const p = data.periods.find((x) => x.factor === BASE_FACTOR);
  return p ? `${p.label} (${p.range})` : "";
}

export function CoverageBlock({ data, onGo }: CoverageBlockProps) {
  return (
    <Card title="Độ phủ đo lường" subtitle={`Ảnh chụp · ${periodLabel(data)}`}>
      <div data-testid="cov-empty">
        <Note tone="warn">
          <b>Chưa có số đo được về độ phủ bằng chứng.</b> Tỉ lệ tự khai trước đây không đối chiếu
          được với gì nên đã bỏ khỏi màn; số đếm được để thay nó (mã lý do rớt theo bước) chưa có,
          đang nằm trong bản yêu cầu dữ liệu gửi team data.
        </Note>
      </div>

      {onGo ? (
        <p className="text-[12px] text-ink-3 mt-2.5 mb-0">
          <button
            type="button"
            data-testid="cov-go-atlas"
            onClick={() => onGo("atlas")}
            className="font-semibold text-ink-3 hover:text-ink hover:underline"
          >
            Mở bản đồ hành trình
          </button>{" "}
          — để xem khách rơi ở đâu.
        </p>
      ) : null}
    </Card>
  );
}
