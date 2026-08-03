import type { ReactNode } from "react";

/* Nhãn trục Y quay dọc sát lề trái thân chart — R3, spec 2026-08-01-card-enterpret-spec.md. Chỉ
   mang ĐƠN VỊ (vd "Số tín hiệu khách hàng"), KHÔNG mang mẫu số (đã dời sang Card.denomStrip, R2) —
   quay dọc không đủ chỗ cho cả hai.

   Tách thành component RIÊNG thay vì nhồi vào Bars — SAI LỆCH CÓ CHỦ Ý so với bảng file trong spec
   (spec ghi "Bars nhận nhãn trục dọc"), đã được Opus chấp thuận khi dispatch section S2.6a: donut/
   line/anomaly cũng cần cùng nhãn dọc, nhồi logic rotate vào Bars sẽ phải lặp lại ở 3 chỗ khác
   (donut/line/anomaly) — vi phạm DRY. Component thuần props, không đọc store.

   Nhãn trục là THÔNG TIN (đơn vị đang đo), không phải trang trí — KHÔNG đặt aria-hidden.

   D1a (owner chốt 02/08, sửa lỗi S2.6a): với bar ngang, trục dọc mã hoá TÊN CHIỀU (`dim.label`, vd
   "Theme · vì sao") — ĐƠN VỊ ĐO (vd "Số tín hiệu khách hàng") là một mảnh thông tin khác, không có
   chỗ trong nhãn dọc (quay dọc không đủ chỗ cho cả hai, xem ghi chú trên). `bottomLabel` optional
   cho mảnh thứ hai đó, đặt ngang dưới đáy chart, căn giữa — vắng thì không render (donut/table/
   line-anomaly không dùng nhãn đáy, GIỮ NGUYÊN như trước D1a). */
export type VAxisLabelProps = {
  label: string;
  /** Đơn vị đo, hiện ngang dưới đáy chart, căn giữa — CHỈ dùng cho bar ngang (D1a). */
  bottomLabel?: string;
  children: ReactNode;
};

export function VAxisLabel({ label, bottomLabel, children }: VAxisLabelProps) {
  return (
    <div>
      <div className="flex items-stretch gap-2">
        <div
          data-testid="vaxis-label"
          className="flex-none whitespace-nowrap text-[11.5px] text-ink-3"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
      {bottomLabel ? (
        <div data-testid="vaxis-bottom-label" className="text-center text-[11.5px] text-ink-3 mt-2">
          {bottomLabel}
        </div>
      ) : null}
    </div>
  );
}
