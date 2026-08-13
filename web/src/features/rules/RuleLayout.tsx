import type { ReactNode } from "react";

/* Hai khuôn dùng chung cho bảy nhóm ngưỡng của #/rules — dựng 12/08 khi redesign layout màn.

   VÌ SAO TÁCH RA: bảy nhóm đang vẽ CÙNG hai thứ bằng bảy cách hơi khác nhau — hàng "nhãn bên trái,
   ô nhập bên phải" (StepGroup dùng một lưới chung gap-y-3.5 không vạch ngăn; AlertGroup dùng hằng
   `ROW` có vạch ngăn, cột ô nhập 150px) và khối "áp ngay lúc này" (chỗ `pt-3.5`, chỗ `pt-4`, chỗ
   không vạch). Người vận hành đi qua bảy nhóm trong một phiên: mỗi nhóm nhích một nhịp khác là bảy
   lần mắt phải dò lại xem ô nhập nằm ở đâu. Khuôn ở một chỗ thì đổi nhịp là đổi cho cả bảy.

   KHÔNG đưa hai khuôn này vào `design-system/`: chúng chỉ đúng cho màn cấu hình (một nhãn ↔ một ô
   ngưỡng), không có nghĩa gì ở năm module còn lại.

   QUY ƯỚC ĐẶT TÊN — owner chốt 12/08, áp cho MỌI tiêu đề khối, tiêu đề cột và nhãn field của cả
   #/signals lẫn #/rules. Đây là chỗ ghi luật vì `FieldRow.label` là cửa vào của phần lớn nhãn:
     1. Tên là CỤM DANH TỪ, không phải câu hỏi, không phải mệnh đề có động từ chia
        ("Cần theo dõi khi tỷ lệ thất bại đạt" → "Ngưỡng theo dõi tỷ lệ thất bại").
     2. Mở đầu bằng DANH TỪ CHÍNH — thứ mà ô/cột/khối chứa: Ngưỡng · Mốc · Trạng thái · Số ngày ·
        Cách · Chỉ số. Người vận hành quét cột nhãn theo từ đầu tiên.
     3. KHÔNG kết bằng từ để hỏi: "nào", "không", "thế nào", "bao nhiêu", "mức nào".
     4. Bổ nghĩa xuất xứ hoặc mẫu số nằm CUỐI, trong ngoặc đơn hoặc sau dấu gạch:
        "(người khai)", "(ngày quá nhịp giao)", "/ngày".
     5. Đây là luật cho TÊN GỌI, không phải cho DỮ LIỆU: nhãn tình trạng ("chưa định danh",
        "chưa-biết", "thiếu", "Ngừng gửi") và câu tả số đếm giữ nguyên văn — chúng là dữ liệu.
   Luật 12/08 không đổi: đây vẫn là đổi TÊN, không phải thêm chữ giải thích. */

export function FieldRow({
  label,
  /** Công thức của ngưỡng, hiện dạng tooltip. Luật 12/08 cho phép ĐÚNG hai thứ xuống tooltip: công
      thức và cơ sở đếm — nên tham số này cố ý không nhận câu chữ tự do nào khác. */
  formula,
  children,
}: {
  label: string;
  formula?: string;
  children: ReactNode;
}) {
  return (
    /* Ô nhập rộng 170px và mọi hàng dùng CHUNG một mốc căn: NumField có `suffix` dài ngắn khác nhau
       ("%", "ngày", "khách"), để cột co theo nội dung thì bảy ô nhập của một nhóm lệch nhau từng
       chút — mắt đọc thành bảy mức thụt lề chứ không thành một cột.

       Cột nhãn có TRẦN 27rem và cả hàng dồn về trái (`justify-start`), không giãn hết bề ngang: cột
       phải của màn rộng ~850px, để nhãn giãn hết thì ô nhập bị đẩy ra tận mép phải và giữa nhãn với
       ô của chính nó là một quãng trống 400px — mỗi lần sửa một ngưỡng là một lần mắt phải bắc cầu
       qua quãng đó. Vạch ngăn vẫn kẻ hết bề ngang vì nó chia HÀNG, không chia cặp nhãn–ô. */
    <div className="grid grid-cols-[minmax(0,27rem)_170px] items-center justify-start gap-x-4 border-t border-line-soft py-2.5 first:border-t-0 first:pt-0">
      <b className="text-[13px] font-semibold text-ink" title={formula}>
        {label}
      </b>
      {children}
    </div>
  );
}

export function ApplySection({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-4 border-t border-line pt-4">
      <div className="t-lbl mb-2.5">{title}</div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}
