import { useEffect, useRef, useState, type ReactNode } from "react";

/* Primitive icon-trigger + panel, thuần props (S2.6b, spec docs/superpowers/specs — dời điều khiển
   Quantify card từ Card.footer lên Card.actions). Tự quản state `open` bên trong — không consumer
   nào cần lift lên (khác QuantifyFilterButton, nơi `open` phải sống ở QuantifyPage để badge/nội
   dung filter chia sẻ được với page). Cơ chế đóng (click ngoài/Escape) copy đúng pattern effect của
   QuantifyFilterButton.tsx (KHÔNG sửa file đó — chỉ tham chiếu).

   `children` nhận CẢ ReactNode thường LẪN render-prop `(close) => ReactNode`: Menu.tsx (dựng trên
   Popover) cần một cách để tự đóng popover ngay sau khi một mục được chọn (onSelect rồi đóng) —
   Popover không có prop `onOpenChange`/`open` bên ngoài nên render-prop là đường duy nhất để children
   gọi ngược vào state nội bộ mà không phá vỡ "Popover tự quản open". Lựa chọn này lệch nhẹ khỏi type
   `children: ReactNode` nêu trong spec gốc — spec cũng nói rõ "chọn cách nào cũng được, miễn KISS và
   test được", nên đây là quyết định có ghi chú, không phải lệch ngầm. */
export type PopoverProps = {
  /** Nội dung nút trigger — icon hoặc ký tự. */
  trigger: ReactNode;
  /** BẮT BUỘC: nhãn cho screen reader (trigger là icon-only). */
  label: string;
  /** true → trigger đổi sang màu primary, báo "đang có gì đó khác mặc định ẩn sau đây".
   *  CỐ Ý KHÔNG phải badge số: viên pill cam đếm số đã mang nghĩa "số tiêu chí lọc" ở nút Bộ lọc
   *  (QuantifyFilterButton). Dùng lại đúng hình đó để đếm SỐ DÒNG ở ▽ là hai đơn vị chung một ký
   *  hiệu — người đọc không thể biết `5` nghĩa là 5 tiêu chí hay 5 dòng. */
  active?: boolean;
  testId?: string;
  children: ReactNode | ((close: () => void) => ReactNode);
};

export function Popover({ trigger, label, active, testId, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    /* Đóng khi bấm ra ngoài ở CAPTURE-PHASE của `click` (KHÔNG phải `mousedown`) và chặn nổi bọt:
       cú bấm "để đóng" không được kích hoạt luôn hành động bên dưới. Đo thật trên dist trước khi
       sửa: thẻ thư viện Quantify bọc cả card trong onClick mở chi tiết, nên mở ⋮ rồi bấm thân thẻ
       để đóng menu thì vừa đóng VỪA nhảy sang màn chi tiết.
       Vì sao KHÔNG dùng `mousedown` rồi nuốt click sau đó: React flush setOpen(false) ngay trong
       mousedown nên panel đã bị gỡ trước khi `click` tới — không còn cách nào nhận ra "click này là
       click đóng". Capture-phase click là chỗ DUY NHẤT còn biết được điều đó.
       Đánh đổi đã báo owner: khi ⓘ đang mở, bấm ▽ chỉ đóng ⓘ chứ không mở ▽ (mất 1 click) — chấp
       nhận, vì điều hướng ngoài ý muốn tệ hơn. Bấm chính trigger của mình vẫn toggle bình thường
       (`rootRef.contains` true → listener bỏ qua → React onClick chạy). */
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        e.stopPropagation();
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClickOutside, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClickOutside, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);
  const content = typeof children === "function" ? children(close) : children;

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        title={label}
        data-active={active ? "true" : undefined}
        data-testid={testId}
        className={`inline-flex items-center justify-center w-7 h-7 rounded hover:bg-surface-2 hover:text-primary ${
          active ? "text-primary bg-primary-soft" : "text-ink-2"
        }`}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>

      {open ? (
        <div
          data-testid={testId ? `${testId}-panel` : undefined}
          className="absolute right-0 top-full mt-2 z-20 bg-surface border border-line rounded-lg shadow-xl p-3 min-w-[220px]"
        >
          {content}
        </div>
      ) : null}
    </div>
  );
}
