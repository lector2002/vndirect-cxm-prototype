import { Card } from "../../../design-system/index.ts";
import { useCxmStore } from "../../../store/store.ts";

/* Nhóm 6 — Trọng số ưu tiên điểm gãy. Port tinh thần V.rules nhánh cuối (prototype dòng 4302-4325).

   NHÓM NÀY CHỈ ĐỌC — KHÔNG có `useCfgWrite`, không input/select/checkbox nào (đúng charter mục
   "Vì sao nhóm 6 chỉ đọc"). Lý do: fixture lưu ĐIỂM TUYỆT ĐỐI của 6 thành phần ưu tiên
   (`data.iss[].pri`) và `validateFixture()` khẳng định `sev+aff+jc+rep+tr+reg === total`. Cho sửa
   một trọng số mà không tính lại `total` của MỌI điểm gãy sẽ bắn banner đỏ trên mọi màn — sửa đúng
   cách đòi một chiến dịch tính lại dữ liệu, không phải một ô ngưỡng vận hành đổi tại chỗ. */

type PriKey = "sev" | "aff" | "jc" | "rep" | "tr" | "reg";

/* Cột "Trả lời câu hỏi gì" ĐÃ BỎ 12/08 (owner quyết) cùng sáu chuỗi của nó — chúng là ĐỊNH NGHĨA
   từng thành phần ưu tiên ("Bao nhiêu khách unique gặp phải"…), đúng diện luật giao diện cấm. Bảng
   còn tên thành phần + điểm cao nhất đang ghi nhận, tức chỉ còn dữ liệu. Nghĩa của sáu thành phần
   nằm ở tài liệu, không nằm trên màn. */
const ROWS: readonly { k: PriKey; name: string }[] = [
  { k: "sev", name: "Mức nghiêm trọng" },
  { k: "aff", name: "Số khách bị ảnh hưởng" },
  { k: "jc", name: "Mức quan trọng của bước" },
  { k: "rep", name: "Liên hệ lặp lại" },
  { k: "tr", name: "Xu hướng" },
  { k: "reg", name: "Rủi ro pháp lý / tuân thủ" },
];

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function WeightGroup() {
  const data = useCxmStore((s) => s.data);

  const priMax = (k: PriKey): number => Math.max(...data.iss.map((i) => i.pri[k]));

  return (
    <Card title="Trọng số ưu tiên">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className={TH}>Thành phần</th>
            <th className={TH}>Điểm cao nhất đang ghi nhận</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.k} data-testid={`weight-row-${r.k}`} className="border-t border-line">
              <td className="px-1 py-1.5">
                <b className="text-[13.5px]">{r.name}</b>
              </td>
              <td className="px-1 py-1.5">
                <b className="font-mono">{priMax(r.k)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* luật 11/08: bỏ cả hai ghi chú luận giải (vì sao trọng số đặc thù, vì sao nhóm chỉ đọc) */}
    </Card>
  );
}
