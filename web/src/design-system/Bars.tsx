import type { DimRow } from "../data/schema/index.ts";
import { fx } from "../domain/format.ts";
import { AxisLabel } from "./AxisLabel.tsx";
import { nf, nfK, pv } from "./format.ts";

/* Màu mặc định khi row.c không có. Spec P1.1b ghi "mặc định primary-soft/ink" nhưng --primary chỉ
   dành cho TƯƠNG TÁC/ĐỊNH DANH (web/src/index.css dòng ~49, đúng ghi chú prototype dòng 49-50) và
   --primary-soft (#FDF3EE) không đủ tương phản trên nền --surface trắng cho một thanh chart — dùng
   ink3 khớp 1-1 rankBars() gốc (prototype dòng 1877: `background:${r.c || 'var(--ink3)'}`).
   CẦN OPUS XÁC NHẬN lại lựa chọn này so với câu chữ spec. */
const DEFAULT_BAR_COLOR = "var(--ink3)";

export type BarsProps = {
  rows: DimRow[];
  /** true khi item.metric === 'pct' — hiện % thay vì count đã fx(). */
  pctMode?: boolean;
  /** Mẫu số dùng cho tooltip/pctMode; vắng thì tính rows.reduce((a,r)=>a+r.v,0) như trước. */
  total?: number;
  /** Có thì hàng thành bấm được (role=button, Enter/Space kích hoạt); vắng thì hàng tĩnh như cũ. */
  onRowClick?: (row: DimRow) => void;
  /** Có và trả mảng không rỗng thì render chip sub-item ngay dưới thanh của hàng đó. */
  kids?: (row: DimRow) => { name: string; n: number }[];
  /** Ghi đè cách in giá trị (dùng cho CẢ số trên thanh LẪN phần giá trị trong tooltip).
      Cần khi `v` KHÔNG phải count thô nên không được nhân fx(): `@coverage` truyền
      `obs.cov` đơn vị % — prototype áp fx() vào đây nên paint 85% thành "476" (defect
      thật, owner chốt 01/08 sửa ở web/; xem charter Phase 2 mục D1). Vắng thì giữ đúng
      thứ tự cũ: pctMode ? `pv(v,total)%` : `nf(fx(v))`. */
  formatValue?: (row: DimRow) => string;
  /** D0a (owner chốt 02/08, defect số sai): fx() (baseline 6 tháng, BASE_FACTOR) chỉ hợp lệ cho
   *  volume TỔNG HỢP (dim.base==='agg'). Với base='ev' (tập bằng chứng liệt kê được, đếm được từng
   *  cái) hay 'cust' (số khách trong cohort, cũng đếm được), fx() nhân sai lệch số — q3 (base='ev',
   *  tổng thô 17) từng hiện "50" cho hàng lớn nhất thay vì đúng "9". Mặc định `true` để MỌI caller
   *  hiện tại (TopPriorityBlock/IntentBlock/CoverageBlock — không có khái niệm `dim.base`, đều là
   *  volume tổng hợp) giữ NGUYÊN hành vi cũ. `QuantifyWidget` là caller DUY NHẤT truyền
   *  `dim?.base === 'agg'` vì đó là nơi duy nhất biết `dim`. Áp cho CẢ nhãn giá trị, tooltip `title`
   *  LẪN chip `kids` — không nhân fx() ở nhãn mà vẫn nhân ở tooltip sẽ ra hai số khác nhau cho cùng
   *  một hàng. KHÔNG áp cho pctMode (tỷ trọng % không đổi dù có scale hay không, tử và mẫu cùng
   *  nhân một hệ số). */
  scaled?: boolean;
  /** Nhãn đơn vị trục — render canh dưới CỘT BAR (col 2 của lưới `[1fr_44%_56px]`) thay vì căn trái
      dưới cột tên, để nhãn nằm ngay dưới các thanh. Vắng thì không render (caller tự đặt AxisLabel
      nếu cần đặt chỗ khác). */
  axisLabel?: string;
  /** VOC-STACKED-SPEC §1: có & trả mảng non-empty cho một row → phần FILL của thanh (bề rộng tổng
      GIỮ NGUYÊN, vẫn ∝ r.v/max) chia thành nhiều đoạn màu ngang, rộng mỗi đoạn ∝ seg.n/Σseg.n
      (chuẩn hoá TRONG PHẠM VI FILL — caller tự đảm bảo Σseg.n = r.v, Bars không tự bịa phần
      "chưa gán"). Mỗi đoạn có tooltip `title` = "label: nf(n)". Vắng/rỗng cho một row → fill row
      đó giữ nguyên 1 màu (r.c ?? DEFAULT_BAR_COLOR) như cũ.

      `parts` (tuỳ chọn): đoạn này là MỘT KHỐI GỘP từ nhiều nhóm nhỏ ⇒ tooltip xuống dòng, liệt kê
      từng nhóm kèm số. Owner chốt 05/08 sau khi xem trên màn: các đoạn "không biết" đứng cạnh nhau ở
      đuôi thanh đọc gần như một màu, nên gộp phần NHÌN mà KHÔNG gộp SỐ — số tách ra ở đây. Đoạn
      KHÔNG có `parts` giữ nguyên tooltip một dòng (bất biến: mọi test đang ghim chuỗi "label: n"
      đều thuộc loại đó). */
  segments?: (row: DimRow) => { label: string; n: number; c: string; parts?: { label: string; n: number }[] }[];
  /** Stacking 100% (Module D section 1): mọi thanh CÓ ĐOẠN dài bằng nhau, đoạn màu thành tỷ trọng
   *  trong hàng ⇒ dễ so HÌNH DẠNG giữa các hàng, nhưng ĐÁNH MẤT so sánh độ lớn. Cố ý chỉ áp cho hàng
   *  thực sự có `segments`: thanh full-width mà không chia đoạn sẽ nói dối rằng mọi nhóm bằng nhau.
   *  Caller PHẢI đổi nhãn trục để nói rõ bề rộng không còn mã hoá giá trị (xem QuantifyWidget). */
  stackPct?: boolean;
  /** Chú giải màu NGAY DƯỚI TỪNG THANH (owner chốt 03/08: "cần cho thêm phần legend note các màu
   *  phân chia là nhóm nào"). Chỉ dành cho caller mà màu đoạn gán THEO HÀNG, không toàn cục.
   *  Hôm nay còn ĐÚNG MỘT caller như vậy: `ThemeStackBlock` ở trục `subtheme` — sub-theme thuộc về
   *  đúng một theme cha nên không tồn tại bảng màu chung nào để chú giải một lần.
   *  SỬA MỘT KHẲNG ĐỊNH NAY ĐÃ SAI (05/08): chỗ này từng ghi `themeSegments()` gán `CAT_CYCLE[i]`
   *  theo thứ hạng TRONG một theme nên "cùng một màu ở hai thanh là hai thứ khác nhau". Đó là mô tả
   *  một LỖI chứ không phải một ràng buộc, và lỗi đó đã sửa: mọi trục CHIỀU nay lấy màu từ bảng toàn
   *  cục (`axisPalette` trong domain/themeSegments.ts) và dùng `ChartLegend` một dải chung, y như
   *  `QuantifyWidget` vẫn làm với mảng `order` của `qRunSplit`.
   *  Cố ý KHÔNG in `n`: legend trả lời "màu này là nhóm nào", còn số đã có ở bề rộng đoạn + tooltip;
   *  in thêm số sẽ trưng tỷ trọng DEMO của trục "Nhóm khách" ra như thể là phép đo. */
  segmentLegend?: boolean;
};

/* Tooltip một đoạn. Có `parts` ⇒ khối gộp: dòng đầu là tổng, các dòng sau thụt vào cho từng nhóm
   nhỏ. Xuống dòng bằng "\n" — thuộc tính `title` của trình duyệt hiển thị đúng nhiều dòng, không cần
   tooltip tự dựng. Không có `parts` ⇒ TRẢ ĐÚNG chuỗi cũ, không thêm bớt ký tự nào. */
function segTitle(s: { label: string; n: number; parts?: { label: string; n: number }[] }): string {
  const head = `${s.label}: ${nf(s.n)}`;
  if (!s.parts?.length) return head;
  return [head, ...s.parts.map((p) => `    ${p.label}: ${nf(p.n)}`)].join("\n");
}

/* S2.6a (spec 2026-08-01-card-enterpret-spec.md, R4): grid đổi từ `label | value | bar` sang
   `label | bar | value` (giá trị sang phải, đúng anatomy Enterpret) — cột value giữ 56px, cột bar
   giữ 44%, chỉ đổi VỊ TRÍ trong DOM/grid-template-columns, không đổi tỷ lệ. */

/* Thanh xếp hạng ngang — port tinh thần từ rankBars() (prototype dòng 1866), viết lại bằng
   Tailwind. Số hiển thị áp fx() (scale baseline 6 tháng) đúng cách prototype làm ở tầng render,
   engine domain/quantify.ts trả count thô.
   `total`/`onRowClick`/`kids` port thêm từ rankBars() (dòng 1866-1883): tooltip `title` khôi phục
   đúng dòng 1874, chip con đúng dòng 1878-1879. Mọi prop mới đều optional và không đổi output khi
   vắng — hành vi mặc định (không click, không total, không kids) y hệt bản trước khi thêm. */
export function Bars({ rows, pctMode, total, onRowClick, kids, formatValue, scaled = true, axisLabel, segments, stackPct, segmentLegend }: BarsProps) {
  const max = Math.max(...rows.map((r) => r.v), 1);
  const totalUsed = total ?? rows.reduce((a, r) => a + r.v, 0);
  // D0a: fx() chỉ hợp lệ khi caller xác nhận `scaled` (dim.base==='agg'); mặc định true giữ hành vi
  // cũ cho caller chưa biết tới prop này.
  const scaleVal = (n: number) => (scaled ? fx(n) : n);
  // Nhãn TRÊN BAR viết tắt K (nfK) để đọc nhanh; tooltip `title` bên dưới vẫn dùng nf() số đầy đủ —
  // hai mức chính xác, không phải bất đồng (S2.6a, R4).
  const valueOf = (r: DimRow) =>
    formatValue ? formatValue(r) : pctMode ? `${pv(r.v, totalUsed)}%` : nfK(scaleVal(r.v));
  // D2a: thanh dày tự điều chỉnh theo số hàng — rows.length<=3 (ít hàng, mỗi hàng đáng chú ý hơn)
  // dày 42px; nhiều hàng hơn thì 26px để không đẩy card quá cao. Trước đây `h-2.5` (10px) cố định,
  // trông như progress bar chứ không phải bar chart xếp hạng.
  const barHeightClass = rows.length <= 3 ? "h-[42px]" : "h-[26px]";
  return (
    <>
    <div data-testid="bars" className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const rowKids = kids ? kids(r) : [];
        const rowSegments = segments ? segments(r) : [];
        const segTotal = rowSegments.reduce((a, s) => a + s.n, 0);
        return (
          <div
            key={r.id}
            title={`${r.l} — ${formatValue ? formatValue(r) : nf(scaleVal(r.v))} (${pv(r.v, totalUsed)}%)`}
            className={`grid grid-cols-[1fr_44%_56px] gap-2.5 items-center${onRowClick ? " cursor-pointer" : ""}`}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            /* stopPropagation: một hàng bấm được đã TIÊU THỤ cú click đó. Thiếu dòng này, trong lưới
               Quantify Library (QuantifyLibrary.tsx:99-106 bọc cả thẻ bằng "bấm đâu cũng mở chi tiết")
               click vào thanh mở màn chi tiết thay vì mở drill panel — widget bị tháo khỏi cây trước
               khi panel kịp hiện. Đo live 04/08: lưới 3 card tụt còn 1 sau một cú bấm.
               KHÔNG ảnh hưởng caller nào khác: mọi nơi còn lại (ThemeStackBlock, ThemeDetailPage,
               TopPriorityBlock) tự điều hướng BẰNG onRowClick, không nhờ bubble lên tổ tiên. */
            onClick={
              onRowClick
                ? (e) => {
                  e.stopPropagation();
                  onRowClick(r);
                }
                : undefined
            }
            onKeyDown={
              onRowClick
                ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(r);
                  }
                }
                : undefined
            }
          >
            <div className="flex items-center min-w-0 text-[13px]">
              <span className="truncate">{r.l}</span>
            </div>
            <div className={`${barHeightClass} bg-surface-2 rounded-[4px] overflow-hidden`}>
              <div
                className="h-full rounded-[4px] overflow-hidden flex"
                style={{
                  /* stackPct CHỈ áp khi hàng có đoạn: thanh full-width không chia đoạn sẽ đọc thành
                     "nhóm này bằng mọi nhóm khác". Hàng không có đoạn giữ nguyên ∝ r.v/max. */
                  width: stackPct && rowSegments.length ? "100%" : `${Math.max(2, (r.v / max) * 100)}%`,
                  background: rowSegments.length ? undefined : r.c ?? DEFAULT_BAR_COLOR,
                }}
              >
                {rowSegments.map((s, i) => (
                  <div
                    key={i}
                    title={segTitle(s)}
                    style={{ width: `${segTotal ? (s.n / segTotal) * 100 : 0}%`, background: s.c }}
                  />
                ))}
              </div>
            </div>
            <div className="text-right font-bold text-[13px] tabular-nums">{valueOf(r)}</div>
            {/* Ngưỡng > 1: thanh chỉ có MỘT đoạn thì màu không mã hoá gì để phải giải mã (vd theme
                chưa có sub-theme nào → 1 đoạn xám), thêm chip vào đó chỉ là nhiễu. */}
            {segmentLegend && rowSegments.length > 1 ? (
              <div data-testid={`bars-seglegend-${r.id}`} className="col-span-3 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {rowSegments.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                    <span
                      className="inline-block w-3 h-3 rounded-[3px] flex-none border border-black/5"
                      style={{ background: s.c }}
                    />
                    {s.label}
                  </span>
                ))}
              </div>
            ) : null}
            {rowKids.length ? (
              <div className="col-span-3 flex flex-wrap gap-1.5 mt-1">
                {rowKids.map((k) => (
                  <span
                    key={k.name}
                    className="inline-block px-2 py-0.5 rounded-[6px] text-[11px] font-semibold border border-line bg-surface-2 text-ink-2"
                  >
                    {k.name} <b className="font-mono">{nf(scaleVal(k.n))}</b>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
      {axisLabel ? (
        <div className="grid grid-cols-[1fr_44%_56px] gap-2.5">
          <div aria-hidden="true" />
          <AxisLabel>{axisLabel}</AxisLabel>
        </div>
      ) : null}
    </>
  );
}
