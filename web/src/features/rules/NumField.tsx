import { useEffect, useState } from "react";

/* Ô nhập MỘT con số cấu hình — port `num()` của prototype (dòng 4104-4108).

   BA ĐIỀU CỐ Ý:

   1. HIỆN DẤU PHẨY THẬP PHÂN, NHẬN CẢ HAI. Người Việt gõ "2,5"; nhưng bàn phím số và thói quen copy
      từ chỗ khác cho ra "2.5". Nhận cả hai rồi chuẩn hoá — từ chối một trong hai là bắt người dùng
      đoán quy ước của màn.

   2. CHỈ GHI KHI RỜI Ô (blur) HOẶC ENTER, không ghi theo từng phím. Gõ "15" đi qua trạng thái "1",
      mà ghi "1" là một lần `setCfg` thật: chart chia lại, nhãn trạng thái đổi, và nếu "1" vi phạm
      một bất biến thì người dùng ăn một câu lỗi giữa lúc đang gõ dở.

   3. GÕ SAI THÌ TRẢ VỀ SỐ CŨ, KHÔNG ghi `NaN`. Ô trống hay chữ cái không phải "ý định đặt ngưỡng
      bằng không" — đoán hộ ý định đó là cách một ngưỡng 0 lọt vào cấu hình mà không ai gõ ra nó. */

export type NumFieldProps = {
  value: number;
  /** Gọi khi có số hợp lệ MỚI (khác giá trị đang có). Nơi gọi tự lo `setCfg` + bắt lỗi. */
  onCommit: (v: number) => void;
  /** Đơn vị hiện cạnh ô — "%" / "giờ" / "ngày" / "lần" / "σ". Luôn đi liền con số, không đứng ở
      tiêu đề cột: cùng một màn có ô đo bằng giờ và ô đo bằng %, tách đơn vị ra là mời đọc nhầm. */
  suffix?: string;
  /** Nhãn cho screen reader — bắt buộc, vì ô số không có nhãn nhìn thấy nằm liền kề. */
  label: string;
  /** Tô viền theo vai của ngưỡng: 'watch' = ngưỡng theo dõi, 'crit' = ngưỡng xử lý ngay. Chỉ là
      dấu hiệu về VAI của ô, không phải trạng thái hiện tại của đối tượng nào. */
  tone?: "watch" | "crit";
  /** Ô rộng cho số nhiều chữ số (ranh giới NAV tính bằng đồng: 5.000.000.000 là 10 chữ số). Bề
      rộng mặc định vừa đủ cho ngưỡng phần trăm/giờ; số dài hơn sẽ bị CẮT CHỮ SỐ trong ô — nhìn
      thấy "20000000" trong khi giá trị thật là 200000000, tức ô đang nói sai chính nó. */
  wide?: boolean;
  /** Cách đọc con số bằng đơn vị người dùng quen (vd "= 200tr"). Chỉ để đọc — không tham gia nhập
      liệu, vì nhóm hàng nghìn kiểu Việt dùng dấu chấm, trùng với dấu thập phân khi parse. */
  hint?: string;
  disabled?: boolean;
};

/** Hiện số theo quy ước tiếng Việt (dấu phẩy thập phân). Số nguyên không đẻ ra ",0". */
function toText(v: number): string {
  return String(v).replace(".", ",");
}

/** Đọc số người dùng gõ. Trả `null` khi không đọc được — nơi gọi hoàn nguyên, không tự đoán. */
function parse(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

const TONE_CLASS = {
  watch: "border-watch-line",
  crit: "border-crit-line",
} as const;

export function NumField({ value, onCommit, suffix, label, tone, wide, hint, disabled }: NumFieldProps) {
  const [text, setText] = useState(() => toText(value));

  // Giá trị đổi từ NGOÀI (bấm "Trả về mặc định", hoặc seam ghi từ chối nên cfg giữ số cũ) phải kéo ô
  // về theo. Không đồng bộ thì ô hiện một số mà cấu hình đang giữ số khác — đúng loại "màn nói sai
  // về chính nó" mà dự án này đã bắt được ba lần.
  useEffect(() => setText(toText(value)), [value]);

  const commit = () => {
    const v = parse(text);
    if (v === null) {
      setText(toText(value));
      return;
    }
    if (v !== value) onCommit(v);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        disabled={disabled}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setText(toText(value));
        }}
        className={`${wide ? "w-[148px]" : "w-[86px]"} rounded-lg border bg-surface px-2.5 py-1 text-[13px] font-semibold text-ink tabular-nums disabled:opacity-45 ${
          tone ? TONE_CLASS[tone] : "border-line"
        }`}
      />
      {suffix ? <span className="t-meta flex-none text-[12px]">{suffix}</span> : null}
      {hint ? <span className="t-meta flex-none text-[12px] text-ink-3">{hint}</span> : null}
    </div>
  );
}
