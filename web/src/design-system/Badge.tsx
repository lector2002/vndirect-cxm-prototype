/* Badge trạng thái — port 1-1 từ badge()/ST_LABEL (prototype dòng 1501-1502) + CSS .st/.st.watch/
   .st.crit/.st.unknown (dòng 168-172). "ok" cố ý KHÔNG có màu riêng (spec: trạng thái được suy ra,
   "Đang kiểm soát" không phải màu tốt mặc định) — chỉ badge nền trắng viền line như .st gốc.
   `.st.unknown` gốc dùng border-color:#A8A29E — hex này KHÔNG có trong token (không phải
   --ink3/#7e756a, không phải --line/#ddd6ca). Theo constraint "không bịa hex mới", dùng --ink3
   (gần nhất về tông xám ấm) cho viền chấm — lệch nhẹ so với hex gốc, ghi rõ trong báo cáo. */

/* 18/08 tối (owner): thêm state `good` (lục, token --good) — dùng cho trạng thái ĐÃ KHAI
   (tracking-plan "Live"), không phải sức khỏe SUY RA, nên không phá spec '"ok" không màu' ở trên:
   spec đó nói về trạng thái suy diễn, còn đây là bản khai của chính đội tracking. Prefix ✓ giữ
   như "ok" — trạng thái vẫn phải đọc được không cần màu.

   18/08 tối (nối tiếp, owner): BỎ prefix ✓ ở `good` — nhãn "Live" tự phân biệt được không cần màu
   lẫn tick, nên tick là phát biểu thứ hai của cùng một điều. ✓ ở `ok` (RUNNING v.v.) GIỮ NGUYÊN:
   "ok" không có màu riêng, tick vẫn là thứ duy nhất tách nó khỏi chữ thường. */

/** Nhãn mặc định theo trạng thái — port ST_LABEL; 18/08 (owner) chuyển sang thuật ngữ Anh quy ước (OK · Warning · Critical · No data, kiểu monitor Datadog). */
const ST_LABEL = {
  ok: "OK",
  good: "OK",
  watch: "Warning",
  crit: "Critical",
  unknown: "No data",
} as const;

export type BadgeState = keyof typeof ST_LABEL;

export type BadgeProps = {
  state: BadgeState;
  /** Chữ hiển thị; vắng thì dùng ST_LABEL[state]. */
  text?: string;
};

const STATE_CLASS: Record<BadgeState, string> = {
  ok: "bg-surface border-line text-ink",
  good: "bg-good-bg border-good-line text-good",
  watch: "bg-watch-bg border-watch-line text-watch",
  crit: "bg-crit-bg border-crit-line text-crit",
  unknown: "bg-transparent border-dashed border-ink-3 text-ink-3",
};

export function Badge({ state, text }: BadgeProps) {
  const prefix = state === "ok" ? "✓ " : state === "unknown" ? "— " : "";
  return (
    <span
      data-testid="badge"
      /* 18/08 (redesign MVP, nước đi S4): pill tròn hẳn + font-semibold thay font-bold — badge đứng
         trong bảng vài trăm dòng, mỗi dòng một viên đậm là bảng ồn hơn dữ liệu. Prefix ✓/— và bộ
         class token GIỮ NGUYÊN (test ghim cả hai — chúng là cách trạng thái đọc được không cần màu). */
      className={`inline-flex items-center gap-1.5 px-2.5 py-[2px] rounded-full text-[12px] font-semibold border whitespace-nowrap ${STATE_CLASS[state]}`}
    >
      {`${prefix}${text || ST_LABEL[state]}`}
    </span>
  );
}
