/* Badge trạng thái — port 1-1 từ badge()/ST_LABEL (prototype dòng 1501-1502) + CSS .st/.st.watch/
   .st.crit/.st.unknown (dòng 168-172). "ok" cố ý KHÔNG có màu riêng (spec: trạng thái được suy ra,
   "Đang kiểm soát" không phải màu tốt mặc định) — chỉ badge nền trắng viền line như .st gốc.
   `.st.unknown` gốc dùng border-color:#A8A29E — hex này KHÔNG có trong token (không phải
   --ink3/#8c8681, không phải --line/#e5e1db). Theo constraint "không bịa hex mới", dùng --ink3
   (gần nhất về tông xám ấm) cho viền chấm — lệch nhẹ so với hex gốc, ghi rõ trong báo cáo. */

/** Nhãn mặc định theo trạng thái — port ST_LABEL. */
const ST_LABEL = {
  ok: "Đang kiểm soát",
  watch: "Cần theo dõi",
  crit: "Cần xử lý ngay",
  unknown: "Chưa đo được",
} as const;

export type BadgeState = keyof typeof ST_LABEL;

export type BadgeProps = {
  state: BadgeState;
  /** Chữ hiển thị; vắng thì dùng ST_LABEL[state]. */
  text?: string;
};

const STATE_CLASS: Record<BadgeState, string> = {
  ok: "bg-surface border-line text-ink",
  watch: "bg-watch-bg border-watch-line text-watch",
  crit: "bg-crit-bg border-crit-line text-crit",
  unknown: "bg-transparent border-dashed border-ink-3 text-ink-3",
};

export function Badge({ state, text }: BadgeProps) {
  const prefix = state === "ok" ? "✓ " : state === "unknown" ? "— " : "";
  return (
    <span
      data-testid="badge"
      className={`inline-flex items-center gap-1.5 px-[9px] py-[3px] rounded-[7px] text-[12px] font-bold border whitespace-nowrap ${STATE_CLASS[state]}`}
    >
      {`${prefix}${text || ST_LABEL[state]}`}
    </span>
  );
}
