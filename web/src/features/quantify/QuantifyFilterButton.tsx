import { useEffect, useRef, type ReactNode } from "react";
import { btnSecondary, btnSizeLg } from "../../design-system/index.ts";

export type QuantifyFilterButtonProps = {
  open: boolean;
  onToggle: (open: boolean) => void;
  /** Số tiêu chí lọc đang active (kind≠all + base≠all + view≠all + search≠'') — hiện badge chỉ khi >0. */
  activeCount: number;
  /** Nội dung popover — thực tế là <QuantifyFilterBar .../> tái dùng nguyên, component này không
      biết gì về filter, chỉ lo cơ chế mở/đóng. */
  children: ReactNode;
};

/* Nút "Bộ lọc" mở popover chứa QuantifyFilterBar — progressive disclosure: ẩn hết chip/search sau 1
   nút thay vì phơi hết ra (chỉ thị owner: "ko hiển thị phần search và filter như thế kia, cho nút
   mở filter"). Badge đếm số tiêu chí active để trạng thái lọc vẫn "thấy được" khi popover đóng
   (ui-ux-pro-max §9 state-preservation) — nội dung filter thật không mất, vẫn sống ở QuantifyPage.
   Đóng popover khi: click ra ngoài (document mousedown), phím Esc, hoặc nút "Xong" bên trong popover
   (§1 escape-routes / §9 modal-escape). */
export function QuantifyFilterButton({ open, onToggle, activeCount, children }: QuantifyFilterButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onToggle(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onToggle(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onToggle]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-testid="qfilter-toggle"
        aria-expanded={open}
        /* h-9 + flex-none: cao đúng bằng ô search đứng cạnh (QuantifySearch) — hai control cùng cụm
           mà lệch chiều cao là thứ làm hàng này trông "lạc quẻ"; flex-none để không bị bóp lại khi
           ô search nở ra. */
        className={`flex items-center gap-1.5 h-9 flex-none ${
          open
            ? "text-sm px-3 rounded border border-primary text-primary bg-primary-soft"
            : `${btnSecondary} ${btnSizeLg}`
        }`}
        onClick={() => onToggle(!open)}
      >
        Bộ lọc <span aria-hidden="true">▾</span>
        {activeCount > 0 ? (
          <span
            data-testid="qfilter-badge"
            className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold bg-primary text-white"
          >
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          data-testid="qfilter-popover"
          className="absolute left-0 top-full mt-2 z-20 w-[min(560px,90vw)] bg-surface border border-line rounded-lg shadow-xl p-4"
        >
          {children}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-hover"
              onClick={() => onToggle(false)}
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
