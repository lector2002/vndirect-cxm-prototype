import type { ReactNode } from "react";

/* Khung card dùng chung cho mọi widget Quantify — port tinh thần từ .card/.chead/.cbody của
   prototype (output/cxm-platform-prototype.html dòng ~152-160), viết lại bằng Tailwind + token vì
   web/src/index.css bản thật chỉ có design tokens (--surface/--line/...), chưa có các class
   component đó (.card/.chead/.cbody không tồn tại trong CSS thật).

   S2.6a (spec docs/superpowers/specs/2026-08-01-card-enterpret-spec.md, anatomy Enterpret): đổi
   góc phải header từ `denom` (chip mẫu số) sang `actions` (icon phễu/⋮ — R1), thêm dải `denomStrip`
   full-width ngay dưới header (R2). `denom` cũ bị XÓA: `actions` chiếm đúng góc phải header đó, và
   nội dung `denom` của mọi caller cũ (9 block Overview) chính là nội dung phải dời xuống denomStrip
   — giữ cả hai prop là hai cách nói cùng một slot, chỉ gây nhầm.

   S2.9-F: `footer?` ĐÃ XÓA. S2.6b dời mọi điều khiển Quantify lên `actions`, và grep xác nhận sau
   đó không `<Card>` nào còn truyền `footer` — giữ một slot không ai dùng chỉ mời gọi quay lại kiểu
   cũ. (`Modal` vẫn có prop `footer` riêng, không liên quan.) */
export type CardProps = {
  title: string;
  /** Kỳ tuyệt đối (hoặc phụ đề) hiện nhẹ dưới tiêu đề. */
  subtitle?: string;
  /** Slot phải header — nút/icon hành động (icon phễu filter, ⋮ menu...). Icon-only PHẢI có
   *  title/aria-label riêng ở phía caller (R1) — Card chỉ render nguyên trạng ReactNode được truyền. */
  actions?: ReactNode;
  /** Dải xám full-width NGAY dưới header, TRƯỚC children (R2) — nội dung "Đang hiện Top N/M ...". */
  denomStrip?: ReactNode;
  children: ReactNode;
  /** S2.6b: có mặt → tiêu đề render thành nút bấm được (mở màn chi tiết) — đường keyboard/screen-
   *  reader cho thao tác "bấm card mở chi tiết" ở QuantifyLibrary. KHÔNG bọc cả card thành
   *  role="button" (chỉ tiêu đề là điểm bấm có ngữ nghĩa, còn lại card vẫn chứa các nút actions khác). */
  onTitleClick?: () => void;
};

export function Card({ title, subtitle, actions, denomStrip, children, onTitleClick }: CardProps) {
  return (
    <div className="bg-surface border border-line rounded shadow-card flex flex-col">
      <div className="flex items-start gap-3.5 px-4 py-3.5 border-b border-line">
        <div className="min-w-0">
          {onTitleClick ? (
            <button
              type="button"
              className="block text-left text-[13.5px] font-semibold leading-snug hover:text-primary"
              onClick={onTitleClick}
            >
              {title}
            </button>
          ) : (
            <b className="text-[13.5px] font-semibold block leading-snug">{title}</b>
          )}
          {subtitle ? <span className="block text-[11.5px] text-ink-3 mt-0.5 truncate">{subtitle}</span> : null}
        </div>
        {actions ? <div className="ml-auto flex-none">{actions}</div> : null}
      </div>
      {denomStrip ? (
        <div
          data-testid="denom-strip"
          className="px-4 py-1.5 text-[11.5px] text-ink-3 bg-surface-2 border-b border-line-soft"
        >
          {denomStrip}
        </div>
      ) : null}
      <div className="p-4 flex-1">{children}</div>
    </div>
  );
}
