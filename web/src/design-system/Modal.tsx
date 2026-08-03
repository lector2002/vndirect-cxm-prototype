import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** Slot hàng nút dưới cùng (vd Hủy/Xóa) — căn phải, cách nội dung bằng margin-top. */
  footer?: ReactNode;
  /** Phần tử muốn nhận focus đầu tiên khi mở (vd nút xác nhận) — mặc định focus khung hộp thoại. */
  initialFocusRef?: RefObject<HTMLElement | null>;
};

/* Modal xác nhận giữa màn — dùng thay cho window.confirm/alert hay bước xác nhận inline trong
   card, cho MỌI hành động phá hủy (Xóa) của Quantify (chỉ thị owner: "khi xóa thì hiện pop up giữa
   màn thay vì hiện tại"). Portal ra document.body để không bị kẹt trong overflow/stacking context
   của card cha. Đóng bằng: click ra ngoài hộp (backdrop), phím Esc, hoặc nút trong footer do caller
   tự quyết định (thường "Hủy"/"Đóng") — click TRONG hộp không đóng (stopPropagation). Backdrop có
   blur để báo hiệu "đây là lớp tạm, click ra ngoài để rời" (ui-ux-pro-max §4 blur-purpose). Animation
   scale+fade khi mở, tôn trọng prefers-reduced-motion qua motion-reduce: (§7 modal-motion). */
export function Modal({ open, title, children, onClose, footer, initialFocusRef }: ModalProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    (initialFocusRef?.current ?? boxRef.current)?.focus();
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 p-5 outline-none transition-[opacity,transform] duration-150 motion-reduce:transition-none ${
          entered ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <b className="text-[15px] font-semibold block mb-3">{title}</b>
        <div className="text-sm text-ink-2">{children}</div>
        {footer ? <div className="mt-4 flex gap-2 justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
