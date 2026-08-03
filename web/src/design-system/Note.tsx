import type { ReactNode } from "react";

/* Ghi chú/cảnh báo trong card — port 1-1 từ CSS .note/.note.warn/.note.crit/.note.bd (prototype
   dòng 405-408). "default" = .note gốc (nền surface2/viền line/chữ ink2); "warn"/"crit"/"bd" đổi
   nền+viền theo token trạng thái/primary đã có sẵn trong tailwind.config.js. Bán kính 9px là giá
   trị riêng của .note (không trùng --radius=12px) nên port thẳng bằng arbitrary value, không phải
   màu nên không vi phạm constraint "không thêm palette mới". */
export type NoteTone = "default" | "warn" | "crit" | "bd";

export type NoteProps = {
  tone?: NoteTone;
  children: ReactNode;
};

const TONE_CLASS: Record<NoteTone, string> = {
  default: "bg-surface-2 border-line text-ink-2",
  warn: "bg-watch-bg border-watch-line text-ink-2",
  crit: "bg-crit-bg border-crit-line text-ink-2",
  bd: "bg-primary-soft border-primary-line text-ink-2",
};

export function Note({ tone = "default", children }: NoteProps) {
  return (
    <div
      data-testid="note"
      className={`rounded-[9px] border px-[13px] py-[11px] text-[12.5px] ${TONE_CLASS[tone]}`}
    >
      {children}
    </div>
  );
}
