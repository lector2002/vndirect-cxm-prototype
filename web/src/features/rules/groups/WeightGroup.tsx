import { Card, Note } from "../../../design-system/index.ts";
import { useCxmStore } from "../../../store/store.ts";

/* Nhóm 6 — Trọng số ưu tiên điểm gãy. Port tinh thần V.rules nhánh cuối (prototype dòng 4302-4325).

   NHÓM NÀY CHỈ ĐỌC — KHÔNG có `useCfgWrite`, không input/select/checkbox nào (đúng charter mục
   "Vì sao nhóm 6 chỉ đọc"). Lý do: fixture lưu ĐIỂM TUYỆT ĐỐI của 6 thành phần ưu tiên
   (`data.iss[].pri`) và `validateFixture()` khẳng định `sev+aff+jc+rep+tr+reg === total`. Cho sửa
   một trọng số mà không tính lại `total` của MỌI điểm gãy sẽ bắn banner đỏ trên mọi màn — sửa đúng
   cách đòi một chiến dịch tính lại dữ liệu, không phải một ô ngưỡng vận hành đổi tại chỗ. */

type PriKey = "sev" | "aff" | "jc" | "rep" | "tr" | "reg";

const ROWS: readonly { k: PriKey; name: string; q: string }[] = [
  { k: "sev", name: "Mức nghiêm trọng", q: "Hậu quả với khách nặng tới đâu" },
  { k: "aff", name: "Số khách bị ảnh hưởng", q: "Bao nhiêu khách unique gặp phải" },
  { k: "jc", name: "Mức quan trọng của bước", q: "Bước này chặn cả hành trình hay không" },
  { k: "rep", name: "Liên hệ lặp lại", q: "Khách phải hỏi lại bao nhiêu lần" },
  { k: "tr", name: "Xu hướng", q: "Đang xấu đi hay đang cải thiện" },
  { k: "reg", name: "Rủi ro pháp lý / tuân thủ", q: "Có hệ quả với cơ quan quản lý hay không" },
];

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function WeightGroup() {
  const data = useCxmStore((s) => s.data);

  const priMax = (k: PriKey): number => Math.max(...data.iss.map((i) => i.pri[k]));

  return (
    <Card
      title="Trọng số ưu tiên"
      subtitle="Chỉ đọc — trọng số là quyết định của CX Council, không phải cấu hình vận hành hằng ngày."
    >
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr>
            <th className={TH}>Thành phần</th>
            <th className={TH}>Trả lời câu hỏi gì</th>
            <th className={TH}>Điểm cao nhất đang ghi nhận</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.k} data-testid={`weight-row-${r.k}`} className="border-t border-line">
              <td className="px-1 py-1.5">
                <b className="text-[13.5px]">{r.name}</b>
              </td>
              <td className="t-meta px-1 py-1.5">{r.q}</td>
              <td className="px-1 py-1.5">
                <b className="font-mono">{priMax(r.k)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3.5 grid gap-2.5">
        <Note>
          Rủi ro pháp lý là thành phần đặc thù ngành chứng khoán — một lỗi eKYC có hệ quả tuân thủ
          khác một lỗi giao diện, dù cùng số khách bị ảnh hưởng. Đây là lý do không nên để trọng số
          này sửa được như một ngưỡng vận hành.
        </Note>
        <Note tone="crit">
          <b>Vì sao nhóm này chỉ đọc:</b> fixture lưu điểm tuyệt đối và{" "}
          <span className="font-mono">validateFixture()</span> khẳng định{" "}
          <span className="font-mono">sev + aff + jc + rep + tr + reg === total</span>. Cho sửa
          trọng số mà không tính lại <span className="font-mono">total</span> sẽ bắn banner đỏ trên
          mọi màn.
        </Note>
      </div>
    </Card>
  );
}
