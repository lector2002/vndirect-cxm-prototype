/* Chip strip đổi CHIỀU CHIA MÀU của một chart trục khách NGAY TẠI CHỖ (owner chốt 03/08, lát 1):
   "khi thấy vấn đề có thể toggle để xem insight xem tập trung vào nhóm kh nào".

   Vì sao chip "không bấm được" dùng aria-disabled chứ KHÔNG dùng attribute `disabled`:
   owner chốt chiều đang xếp hàng phải HIỆN MỜ chứ không ẩn — mục đích là để người dùng biết ĐƯỢC VÌ
   SAO. `disabled` thật thì nút rơi khỏi tab order và phần lớn screen reader bỏ qua hẳn, nên `title`
   mang lý do trở thành không tới được đúng với người không suy ra được bằng mắt. aria-disabled giữ
   nút focus được mà vẫn báo trạng thái, lý do vẫn đọc được.

   Vì sao bộ class chip lặp lại `seg/segOn/segOff` của ThemeStackBlock: đó là chỗ đầu tiên owner chốt
   hình dáng toggle này (features/overview/blocks/ThemeStackBlock.tsx:18-20) và TimeframeBar cũng có
   bản riêng. Bản ở đây là bản trong design-system (đúng tầng — features không được import xuống
   design-system). CỐ Ý không sửa hai chỗ kia trong lát này: chúng đang chạy đúng, gộp lại là việc
   riêng, không phải phần owner vừa chốt. */

export type SplitOption = {
  key: string;
  label: string;
  /** Có lý do ⇒ chip hiện MỜ, bấm không có tác dụng, tooltip mang CHÍNH lý do đó. Caller phải lấy lý
   *  do từ engine (qRunSplit) chứ không tự viết lại — xem QuantifyWidget. */
  disabledReason?: string;
};

export type SplitToggleProps = {
  options: SplitOption[];
  /** `undefined` = không chia màu (chip đầu tiên đang bật). */
  value?: string;
  onChange: (next: string | undefined) => void;
  /** Có mặt ⇒ khoá TOÀN BỘ strip (view/kiểu chart không có chỗ vẽ đoạn màu). Vẫn render thay vì ẩn,
   *  cùng lý do như `disabledReason`: một control biến mất khi đổi view thì không ai nói vì sao. */
  lockedReason?: string;
  /** Bấm vào chip ĐANG KHOÁ → đẩy lý do lên caller để in thành CHỮ, không chỉ nằm trong tooltip.
   *
   *  Thêm 05/08 vì có bằng chứng thật: owner nhìn màn rồi HỎI "tại sao chart khách theo phân khúc NAV
   *  không bấm được vào chia theo nền tảng?" — lý do đã có sẵn, đúng chữ, ngay trên `title` của chính
   *  chip đó, mà vẫn phải hỏi. Tooltip chỉ tới được người đã đoán ra là nên rê chuột và chịu đợi; ai
   *  bấm (phản xạ tự nhiên khi một nút không phản hồi), ai dùng bàn phím, ai dùng cảm ứng thì không
   *  bao giờ thấy. Bấm là hành vi người ta LÀM khi thắc mắc, nên đó là chỗ phải trả lời. */
  onLockedClick?: (reason: string) => void;
};

const chip = "text-[12px] px-2 py-1 rounded-sm font-semibold transition-colors";
const chipOn = "bg-white text-primary shadow-sm";
const chipOff = "bg-transparent text-ink-3 hover:text-ink";
const chipDim = "bg-transparent text-ink-3 opacity-40 cursor-not-allowed";

/* Chip "không chia màu" — trạng thái tắt phải là MỘT CHIP như các chiều khác, không phải nút X riêng:
   nó cũng là một cách xem, và đặt cùng hàng thì đọc ra ngay đang ở cách nào. */
const OFF_KEY = "";
const OFF_LABEL = "Không chia";

export function SplitToggle({ options, value, onChange, lockedReason, onLockedClick }: SplitToggleProps) {
  const items: SplitOption[] = [{ key: OFF_KEY, label: OFF_LABEL }, ...options];
  return (
    /* stopPropagation ở GỐC strip, không ở từng chip: handler của chip chạy trước (trên đường nổi lên)
       nên vẫn hoạt động, đồng thời chặn được CẢ chip bị khoá — chip khoá không có onClick riêng nên
       nếu chặn ở từng chip thì đúng nó lại rò. Cần thiết vì trong lưới Quantify Library cả thẻ là một
       nút "mở chi tiết" (QuantifyLibrary.tsx:99-106): đo live 04/08, bấm chip mở màn chi tiết chứ
       không đổi chiều chia màu. */
    <div
      data-testid="split-toggle"
      className="flex flex-wrap items-center gap-1.5 mb-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* "Chia màu theo" → "Chia màu" (05/08). Đo trên màn sau khi thêm chip thứ năm: thanh rộng
          595px, nhãn cũ chiếm 84px, sáu chip cần ~515px — thiếu đúng ~12px nên CẢ 12 thanh xuống hai
          hàng. Rút nhãn trả lại ~29px, vừa đủ. Chọn sửa nhãn chứ không bóp padding chip: padding là
          hình dáng dùng CHUNG với ThemeStackBlock/TimeframeBar, bóp ở đây là ba chỗ lệch nhau. */}
      <span className="text-[11.5px] text-ink-3">Chia màu</span>
      <div
        role="group"
        aria-label="Chiều chia màu trong thanh"
        className="inline-flex flex-wrap gap-0.5 bg-surface-2 rounded-lg p-0.5 border border-line"
      >
        {items.map((opt) => {
          const reason = lockedReason ?? opt.disabledReason;
          const on = (value ?? OFF_KEY) === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              /* aria-pressed VẪN giữ trên chip bị khoá: nó nói trạng thái ĐANG hiện (vd q19 khoá ở
                 view bảng nhưng vẫn đang chia theo NAV) — bỏ đi là mất thông tin, không phải thêm. */
              aria-pressed={on}
              aria-disabled={reason ? true : undefined}
              title={reason}
              className={`${chip} ${reason && !on ? chipDim : on ? chipOn : chipOff}`}
              /* Chip khoá vẫn KHÔNG đổi chiều chia — nó chỉ nói ra lý do. Giữ nguyên `aria-disabled`
                 (không phải `disabled` thật) nên nút vẫn nhận được focus và phím Enter/Space, tức là
                 đường bàn phím cũng tới được lý do y như đường chuột. */
              onClick={
                reason
                  ? () => onLockedClick?.(reason)
                  : () => onChange(opt.key === OFF_KEY ? undefined : opt.key)
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
