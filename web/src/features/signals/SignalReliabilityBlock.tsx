import type { CxmData, Dim } from "../../data/schema/index.ts";
import { sigCountReliability } from "../../domain/index.ts";
import { Card, Note } from "../../design-system/index.ts";
import { pv } from "../../design-system/format.ts";

/* Khối ② — độ tin cậy của dữ liệu ĐÃ NHẬN (module-i-signal-registry-charter.md §9 bất biến 9, §14
   lát I4a, Việc 4). KHÔNG phải độ phủ: không màn nào ở đây so được với thực tế, chỉ nói về cái đã
   nhận. Owner chốt 07/08 phương án (a): CHỈ nhãn "thiếu" tính là lỗi đo; "chưa định danh" và
   "chưa-biết" hiện RIÊNG, không trộn vào số lỗi (bất biến cứng của dự án — ba nghĩa khác nhau).

   `data.sigCounts` RỖNG (Demo Mode tắt) là trạng thái TRUNG THỰC "chưa nhận số đếm từ bên dữ liệu",
   KHÔNG được vẽ thành 0% — hai nhánh render dưới đây tách bạch đúng ca đó.

   12/08 (redesign layout): bốn cột số căn PHẢI và tiêu đề cột căn theo cùng mép — ba cột cuối là ba
   nghĩa "không biết" khác nhau, việc duy nhất người đọc làm ở đây là so chúng với nhau theo chiều
   dọc, mà so số thì mép phải phải thẳng hàng. Năm ô chờ pipeline xếp thành hai cột: chúng là danh
   sách việc đi đòi bên dữ liệu, xếp một cột dọc thì khối này cao gấp đôi bảng số nằm ngay trên nó
   và nhìn như phần chính.

   12/08 (owner) — TÊN KHỐI THEO QUY ƯỚC CỤM DANH TỪ: "② Dữ liệu đã nhận có tin được không?" →
   "② Độ tin của dữ liệu đã nhận". Chỉ đổi TÊN; phạm vi "đã nhận" giữ nguyên trong tên vì nó là mẫu
   số của cả khối (bất biến 9 vế 1), bỏ đi là mở đường cho người đọc hiểu thành so với thực tế. */

const PENDING_CELLS: { label: string; waiting: string }[] = [
  {
    label: "Giá trị lạ",
    // luật 11/08: bỏ vế "số đang có sinh từ chính bản khai... không phải bằng chứng dữ liệu sạch"
    waiting: "chờ số đếm giá trị ĐỘC LẬP với bản khai từ team data.",
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
    <Card title="② Độ tin của dữ liệu đã nhận">
      {!hasCounts ? (
        <div data-testid="reliability-empty">
          {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
          <Note tone="warn">Chưa nhận được số đếm từ bên dữ liệu.</Note>
        </div>
      ) : (
        <div className="overflow-x-auto" data-testid="reliability-table">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Chiều", "Mẫu số", "Lỗi đo (thiếu)", "Chưa định danh", "Chưa-biết"].map((h, i) => (
                  <th
                    key={h}
                    className={`border-b-2 border-line px-2.5 py-1.5 text-xs font-semibold text-ink-2 whitespace-nowrap ${
                      i === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dim} data-testid={`reliability-row-${r.dim}`}>
                  <td className="border-b border-line px-2.5 py-1.5">{dims[r.dim]?.label ?? r.dim}</td>
                  <td className="border-b border-line px-2.5 py-1.5 text-right tabular-nums">{r.total}</td>
                  <td className="border-b border-line px-2.5 py-1.5 text-right tabular-nums">
                    {r.missing} ({pv(r.missing, r.total)}%)
                  </td>
                  <td className="border-b border-line px-2.5 py-1.5 text-right tabular-nums text-ink-2">
                    {r.notIdentified} ({pv(r.notIdentified, r.total)}%)
                  </td>
                  <td className="border-b border-line px-2.5 py-1.5 text-right tabular-nums text-ink-2">
                    {r.unknownYet} ({pv(r.unknownYet, r.total)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* luật 11/08 (bổ sung): bỏ hẳn legend định nghĩa ba cột */}
        </div>
      )}

      <div className="mt-4 border-t border-line-soft pt-3">
        <div className="t-lbl mb-2">Năm ô đang chờ pipeline</div>
        <ul
          className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-[12.5px] text-ink-2 lg:grid-cols-2"
          data-testid="reliability-pending"
        >
          {PENDING_CELLS.map((c) => (
            <li key={c.label} className="flex gap-1.5">
              <span aria-hidden="true" className="flex-none text-ink-3">
                ▨
              </span>
              <span className="min-w-0">
                <b className="text-ink">{c.label}</b> — {c.waiting}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
