import type { CxmData, Dim } from "../../data/schema/index.ts";
import { sigCountReliability } from "../../domain/index.ts";
import { Card, Note } from "../../design-system/index.ts";
import { pv } from "../../design-system/format.ts";

/* Khối ② — độ tin cậy của dữ liệu ĐÃ NHẬN (module-i-signal-registry-charter.md §9 bất biến 9, §14
   lát I4a, Việc 4). KHÔNG phải độ phủ: không màn nào ở đây so được với thực tế, chỉ nói về cái đã
   nhận. Owner chốt 07/08 phương án (a): CHỈ nhãn "thiếu" tính là lỗi đo; "chưa định danh" và
   "chưa-biết" hiện RIÊNG, không trộn vào số lỗi (bất biến cứng của dự án — ba nghĩa khác nhau).

   `data.sigCounts` RỖNG (Demo Mode tắt) là trạng thái TRUNG THỰC "chưa nhận số đếm từ bên dữ liệu",
   KHÔNG được vẽ thành 0% — hai nhánh render dưới đây tách bạch đúng ca đó. */

const PENDING_CELLS: { label: string; waiting: string }[] = [
  {
    label: "Giá trị lạ",
    waiting:
      'chờ số đếm giá trị ĐỘC LẬP với bản khai từ team data — số đang có sinh từ chính bản khai, nên "0 lệch" là hệ quả cách sinh số, không phải bằng chứng dữ liệu sạch.',
  },
  {
    label: "Trùng lặp",
    waiting: "chờ dòng event thô (case id + mốc phát sinh) từ team data.",
  },
  {
    label: "Mồ côi tham chiếu",
    waiting: "chờ dòng event thô từ team data.",
  },
  {
    label: "Đến muộn",
    waiting: "chờ mốc phát sinh + mốc nhận từ team data/pipeline.",
  },
  {
    label: "Manifest giao hàng",
    waiting:
      "chờ manifest giao hàng theo ngày (số dòng gửi · load thành công/thất bại/một phần) từ team data/pipeline.",
  },
];

export function SignalReliabilityBlock({ data, dims }: { data: CxmData; dims: Record<string, Dim> }) {
  const rows = sigCountReliability(data);
  const hasCounts = data.sigCounts.length > 0;

  return (
    <Card
      title="② Dữ liệu đã nhận có tin được không?"
      subtitle="Độ tin cậy của cái đã NHẬN — không so được với thực tế, chỉ một nguồn ghi"
    >
      {!hasCounts ? (
        <div data-testid="reliability-empty">
          <Note tone="warn">
            <b>Chưa nhận được số đếm từ bên dữ liệu.</b> Đây là trạng thái trung thực, không phải
            lỗi — không hiện tỉ lệ nào cho tới khi có số đếm thật.
          </Note>
        </div>
      ) : (
        <div className="overflow-x-auto" data-testid="reliability-table">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Chiều", "Mẫu số", "Lỗi đo (thiếu)", "Chưa định danh", "Chưa-biết"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dim} data-testid={`reliability-row-${r.dim}`}>
                  <td className="px-2.5 py-1.5 border-b border-line">{dims[r.dim]?.label ?? r.dim}</td>
                  <td className="px-2.5 py-1.5 border-b border-line tabular-nums">{r.total}</td>
                  <td className="px-2.5 py-1.5 border-b border-line tabular-nums">
                    {r.missing} ({pv(r.missing, r.total)}%)
                  </td>
                  <td className="px-2.5 py-1.5 border-b border-line tabular-nums text-ink-2">
                    {r.notIdentified} ({pv(r.notIdentified, r.total)}%)
                  </td>
                  <td className="px-2.5 py-1.5 border-b border-line tabular-nums text-ink-2">
                    {r.unknownYet} ({pv(r.unknownYet, r.total)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="t-meta mt-2">
            Chỉ cột "Lỗi đo (thiếu)" là lỗi đo. "Chưa định danh" = khách chưa có hồ sơ lúc event xảy
            ra — hợp lệ, không ai phải sửa. "Chưa-biết" = có hồ sơ khách nhưng trường đó chưa từng
            được ghi — việc của CRM/nghiệp vụ, không phải lỗi đo.
          </p>
        </div>
      )}

      <div className="mt-4">
        <div className="t-lbl mb-2">Năm ô đang chờ pipeline</div>
        <ul className="space-y-1.5 text-[12.5px]" data-testid="reliability-pending">
          {PENDING_CELLS.map((c) => (
            <li key={c.label}>
              <span aria-hidden="true">▨</span> <b>{c.label}</b> — {c.waiting}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
