import { fx } from "../domain/format.ts";
import type { DrillLine, DrillResult } from "../domain/quantify.ts";
import { nf } from "./format.ts";
import { Modal } from "./Modal.tsx";

/* Panel "bản ghi dưới một hàng" — đích đến của drill-down (owner chốt 03/08, phương án (a): "bấm một
   thanh nên mở ra danh sách bằng chứng/verbatim đã lọc theo hàng đó").

   Dùng `Modal wide` chứ KHÔNG dựng drawer mới: design-system chưa có drawer, và panel này cần đúng
   những gì Modal đã làm (portal ra khỏi overflow của card, Esc, click backdrop, focus, animation).
   Thêm một surface thứ hai là mời hai lối đóng/mở trôi lệch nhau.

   VIỆC CHÍNH của component này KHÔNG phải liệt kê — mà là nói đúng QUAN HỆ giữa danh sách và con số
   trên thanh vừa bấm. Ba quan hệ khác nhau (xem qRunDrill):
   - `sample`: số trên thanh là tổng hợp sẵn, danh sách chỉ là tập mẫu — lệch tới ~50 lần. Không nói
     ra thì người dùng đọc "8 bằng chứng" thành "hàng 412 này có 8 cái".
   - `full`: số trên thanh CHÍNH LÀ số bản ghi đang liệt kê.
   - `unknown`: tách lại `chưa-biết` vs `thiếu` mà chart đã gộp (bài học D0).
   Vì thế mỗi kind có MỘT câu mẫu số riêng, cố ý không viết chung một câu "đang hiện N/M". */

/** Hàng "Khác (+N)" là chuyện của TẦNG HIỂN THỊ (foldRowTail ở QuantifyWidget quyết định cắt ở đâu),
    domain không biết tới nó — nên biến thể này khai ở đây, cạnh chỗ dùng, thay vì nhét vào DrillResult. */
export type DrillContent = DrillResult | { kind: "groups"; lines: DrillLine[]; total: number };

export type DrillPanelProps = {
  open: boolean;
  /** Nhãn hàng vừa bấm — vào tiêu đề hộp thoại để không bao giờ mất ngữ cảnh "đang xem hàng nào". */
  rowLabel: string;
  content: DrillContent;
  /** Loại bản ghi đang liệt kê. KHÔNG suy ra được từ `content`: cùng một kind `full` phục vụ cả danh
      sách bằng chứng (trục ev) lẫn danh sách khách (trục cust), nên caller — chỗ biết `dim.base` —
      phải nói. Quyết định cả DANH TỪ trong câu mẫu số lẫn việc có bọc ngoặc kép hay không. */
  recordKind: DrillRecordKind;
  onClose: () => void;
};

export type DrillRecordKind = "ev" | "cust" | "group";

/* Chỉ `ev` được bọc ngoặc kép — đó là LỜI KHÁCH NÓI. Khoá khách và tên nhóm không phải lời ai nói;
   bọc chúng lại là gán cho chúng một thứ trạng thái mà chúng không có. */
const RECORD: Record<DrillRecordKind, { noun: string; quoted: boolean }> = {
  ev: { noun: "bằng chứng", quoted: true },
  cust: { noun: "khách", quoted: false },
  group: { noun: "nhóm", quoted: false },
};

/* Câu mẫu số. Trả chuỗi, KHÔNG phải JSX, để test kiểm được bằng một phép so text. */
function denomSentence(content: DrillContent, noun: string): string {
  const n = content.kind === "none" ? 0 : content.lines.length;
  switch (content.kind) {
    case "sample":
      /* fx() PHẢI áp ở đây: kind 'sample' chỉ xảy ra với base:'agg', đúng tập hợp mà Bars vẽ số đã
         scale (`scaled = dim.base === 'agg'`). Không áp thì panel in 412 trong khi thanh in 2,3K —
         cùng một hàng, hai con số, và người dùng không biết tin cái nào. */
      return n === 0
        ? `Hàng này đếm ${nf(fx(content.total))} tín hiệu tổng hợp, nhưng CHƯA có bằng chứng mẫu nào gắn vào nó. Tập mẫu hiện có ${content.poolN} bản ghi cho toàn hệ thống.`
        : `Hàng này đếm ${nf(fx(content.total))} tín hiệu tổng hợp — con số đó KHÔNG đếm từ danh sách dưới. Đang liệt kê ${n} bằng chứng mẫu, trong tập ${content.poolN} bản ghi của toàn hệ thống.`;
    case "full":
      return n < content.total
        ? `Đang liệt kê ${n} ${noun} đầu trong ${nf(content.total)} — danh sách bị cắt cho vừa panel, số trên thanh vẫn là ${nf(content.total)}.`
        : `Đang liệt kê đủ ${nf(content.total)} ${noun} của hàng này — đúng con số trên thanh.`;
    case "unknown":
      return `${nf(content.total)} khách không xác định: ${content.unknownYet} chưa biết${
        content.missing > 0 ? ` và ${content.missing} thiếu (lỗi thu thập)` : ""
      }. Hai loại này cách chữa ngược nhau nên KHÔNG gộp: "chưa biết" là chờ, "thiếu" là phải đi sửa pipeline.`;
    case "groups":
      return `Hàng "Khác" gộp ${content.total} nhóm nhỏ bị cắt khỏi Top-N. Đây là các NHÓM, không phải bản ghi — muốn xem bản ghi của một nhóm thì nâng mốc số dòng để nó hiện thành hàng riêng.`;
    case "none":
      return content.reason;
  }
}

export function DrillPanel({ open, rowLabel, content, recordKind, onClose }: DrillPanelProps) {
  const { noun, quoted } = RECORD[recordKind];
  const lines = content.kind === "none" ? [] : content.lines;
  return (
    <Modal open={open} title={rowLabel} onClose={onClose} wide>
      <div data-testid="drill-denom" className="text-[12px] text-ink-3 mb-3">
        {denomSentence(content, noun)}
      </div>
      {lines.length ? (
        /* Markup dòng dùng LẠI đúng `ThemeDetailPage.tsx` (Card "Evidence mẫu"): verbatim trong ngoặc
           kép, dòng meta nhỏ bên dưới. Cùng một khái niệm thì phải trông giống nhau ở mọi màn. Nhóm
           gộp và khoá khách KHÔNG bọc ngoặc kép — chúng không phải lời ai nói. */
        <ul data-testid="drill-lines" className="flex flex-col gap-2.5">
          {lines.map((l) => (
            <li key={l.id} className="text-[13px]">
              <div>{quoted ? `“${l.text}”` : l.text}</div>
              <div className="t-meta mt-0.5">{l.meta}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
