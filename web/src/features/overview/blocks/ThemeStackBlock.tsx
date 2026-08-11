import { useState } from "react";
import type { Cfg, CxmData, Dim, DimRow } from "../../../data/schema/index.ts";
import { themeAxisOptions, themeLegend, themeSegments, SUBTHEME_AXIS, type ThemeAxis, type ThemeAxisOption } from "../../../domain/index.ts";
import { Bars, Card, ChartLegend } from "../../../design-system/index.ts";

/* @themestack — VOC-STACKED-SPEC §3. Xếp hạng theme (n desc), thanh chia đoạn theo trục chọn được.
   F1 (module-f-charter.md) bỏ trục "Nhóm khách" DEMO (bịa tỷ trọng từ data.ins.seg) — mọi đoạn giờ
   ĐẾM THẬT từ data.ev (domain/themeSegments.ts). Picker 2 nút CỐ Ý CHỈ tạm giữ 2 trục (subtheme +
   pf) để build/test xanh — chip strip đầy đủ theo `themeAxisOptions` (mọi trục của `dims`, khoá +
   lý do) là việc của section F3 (người khác làm), KHÔNG mở rộng ở đây. */
export type ThemeStackBlockProps = {
  data: CxmData;
  /** Cần để đọc `dims[axis].label` (nhãn trục) và gọi `themeSegments` — chart theo bằng chứng, không
      còn tự suy nhãn/màu như trục "Nhóm khách" DEMO trước đây. */
  dims: Record<string, Dim>;
  /** Giữ trong props theo shape chung (data+cfg+onGo) — block không dùng ngưỡng nào từ cfg, giống
      IntentBlock. */
  cfg: Cfg;
  onGo?: (route: string) => void;
};

const TOP_N = 8;

const seg = "text-[13px] px-3 py-1.5 rounded-sm font-semibold transition-colors";
const segOn = "bg-white text-primary shadow-sm";
const segOff = "bg-transparent text-ink-3 hover:text-ink";

/* Danh sách trục SINH RA từ `themeAxisOptions(dims)` (sửa 05/08, owner hỏi "sao khối này không chia
   được theo 5 slice đã nói"). Trước đó chỗ này là hai nút VIẾT TAY, trong khi engine đã tính sẵn cả
   danh sách lẫn lý do khoá từ lâu — chỉ chưa ai nối lên. Hệ quả: khối này chia được 2 trục còn thanh
   chip ở Quantify chia được 5, cùng một ý nghĩa mà hai màn nói hai kiểu.

   Lọc theo `Dim.slice` để hai màn ra CÙNG một danh sách. Không lấy mọi entry của `dims`: như thế sẽ
   lòi ra cả `theme`/`l1`/`l2`/`l3`/`sub`/`src`/`cat`/`sen` — đó là ĐỀ TÀI của chart chứ không phải
   cách cắt, và 11 chip khoá là nhiễu, không phải "nói thẳng". `subtheme` luôn đứng đầu vì nó là trục
   THẬT của riêng chart này (chia theo sub-theme con), không phải một chiều trong `dims`. */
function axisOptionsOf(dims: Record<string, Dim>): ThemeAxisOption[] {
  return themeAxisOptions(dims).filter((o) => o.key === SUBTHEME_AXIS || dims[o.key]?.slice);
}

function axisLabelOf(axis: ThemeAxis, dims: Record<string, Dim>): string {
  return axis === SUBTHEME_AXIS
    ? "Số tín hiệu, chia theo sub-theme"
    : `Số tín hiệu, chia theo ${dims[axis]?.label ?? axis}`;
}

export function ThemeStackBlock({ data, dims, onGo }: ThemeStackBlockProps) {
  /* Mặc định 'pf', KHÔNG phải trục thật 'subtheme' — cùng lý do owner chốt 03/08 cho trục demo cũ:
     chỉ 3/14 theme có sub-theme, nên để trục đó làm mặc định thì 5/8 thanh top là xám đặc 100% và
     biểu đồ trông như hỏng. Khác bản trước, 'pf' là số ĐẾM THẬT (không phải demo) nên không cần
     nhãn "demo" cạnh toggle nữa. */
  const [axis, setAxis] = useState<ThemeAxis>("pf");
  const axisOptions = axisOptionsOf(dims);

  const themes = data.tax
    .filter((t) => t.lv === "theme")
    .slice()
    .sort((a, b) => b.n - a.n);
  const rows: DimRow[] = themes.slice(0, TOP_N).map((t) => ({
    id: t.id,
    l: t.name,
    v: t.n,
    c: (t.cat && data.cats[t.cat]?.color) || "var(--ink3)",
  }));

  const themesWithSub = new Set(data.tax.filter((t) => t.lv === "subtheme").map((t) => t.parentId));
  const subCoverage = themes.filter((t) => themesWithSub.has(t.id)).length;
  // luật 11/08: bỏ vế giải thích "phần còn lại hiện thanh xám..." ở cả hai nhánh
  const denomStrip =
    axis === SUBTHEME_AXIS
      ? `${subCoverage} trên ${themes.length} theme có sub-theme thật`
      : `Đếm thật từ bằng chứng (data.ev) theo ${dims[axis]?.label ?? axis}`;

  return (
    <Card
      title="Theme theo thành phần"
      denomStrip={denomStrip}
      actions={
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Trục chia thanh" className="inline-flex gap-0.5 bg-surface-2 rounded-lg p-0.5 border border-line">
            {axisOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                aria-pressed={opt.key === axis}
                /* Khoá thì DÙNG `aria-disabled`, không dùng `disabled` thật — cùng lý do đã chốt ở
                   SplitToggle: nút disabled rơi khỏi tab order và screen reader bỏ qua, nên lý do
                   khoá không tới được đúng người cần nó nhất. Lý do in NGUYÊN VĂN từ engine. */
                aria-disabled={opt.disabledReason ? true : undefined}
                title={opt.disabledReason}
                className={`${seg} ${opt.key === axis ? segOn : segOff} ${opt.disabledReason ? "opacity-45 cursor-not-allowed" : ""}`}
                onClick={() => {
                  if (!opt.disabledReason) setAxis(opt.key);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {themes.length ? (
        <>
          <Bars
            rows={rows}
            segments={(r) => themeSegments(data, r.id, axis, dims)}
            /* Chú giải THEO TỪNG THANH chỉ còn đúng cho trục sub-theme, và chỉ vì ở đó nó là cách
               đúng duy nhất: sub-theme thuộc về đúng một theme cha, nên không có bảng màu chung nào
               để mà chú giải một lần.
               Sửa 05/08 cho mọi trục còn lại. Trước đó chỗ này chú giải theo hàng với lý do "màu gán
               theo thứ hạng TRONG một theme nên cùng màu ở hai thanh là hai thứ khác nhau" — lý do
               đó đúng, nhưng nó mô tả một CÁI SAI chứ không phải một ràng buộc: cái cần sửa là phép
               gán màu, không phải chỗ đặt chú giải. Màu nay lấy từ bảng toàn cục (axisPalette), một
               màu là một nhóm ở mọi thanh, nên tám chú giải rút về một. */
            segmentLegend={axis === SUBTHEME_AXIS}
            onRowClick={onGo ? (r) => onGo(`topic/${r.id}`) : undefined}
            axisLabel={axisLabelOf(axis, dims)}
          />
          <ChartLegend items={themeLegend(data, axis, dims).map((s) => ({ label: s.label, color: s.c }))} />
        </>
      ) : (
        <div className="t-meta">Chưa có theme nào.</div>
      )}
    </Card>
  );
}
