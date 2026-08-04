import { useState } from "react";
import type { Cfg, CxmData, Dim, DimRow } from "../../../data/schema/index.ts";
import { themeSegments, SUBTHEME_AXIS, type ThemeAxis } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

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

/* 'pf' (Nền tảng) là trục THẬT thay cho "Nhóm khách" DEMO đã bỏ — mọi theme đều có đủ bằng chứng
   sinh (module F2/F2b) để ra ≥2 đoạn ở trục này, khác `subtheme` (chỉ 3/14 theme có sub-theme). */
const AXIS_OPTIONS: { key: ThemeAxis; label: string }[] = [
  { key: SUBTHEME_AXIS, label: "Sub-theme" },
  { key: "pf", label: "Nền tảng" },
];

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
  const denomStrip =
    axis === SUBTHEME_AXIS
      ? `${subCoverage} trên ${themes.length} theme có sub-theme thật — phần còn lại hiện thanh xám "Chưa gán sub-theme"`
      : `Đếm thật từ bằng chứng (data.ev) theo ${dims[axis]?.label ?? axis} — phần theme chưa có bằng chứng gán hiện thanh xám`;

  return (
    <Card
      title="Theme theo thành phần"
      denomStrip={denomStrip}
      actions={
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Trục chia thanh" className="inline-flex gap-0.5 bg-surface-2 rounded-lg p-0.5 border border-line">
            {AXIS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                aria-pressed={opt.key === axis}
                className={`${seg} ${opt.key === axis ? segOn : segOff}`}
                onClick={() => setAxis(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {themes.length ? (
        <Bars
          rows={rows}
          segments={(r) => themeSegments(data, r.id, axis, dims)}
          /* Legend NGAY DƯỚI TỪNG THANH, không phải một dải chung (owner chốt 03/08). Bắt buộc phải
             theo hàng: themeSegments() gán màu theo THỨ HẠNG TRONG một theme và mỗi theme có bộ
             sub-theme/giá trị chiều riêng ⇒ cùng màu ở hai thanh là hai thứ khác nhau. Xem Bars.tsx
             (prop segmentLegend) để biết vì sao chỗ này KHÔNG dùng ChartLegend như QuantifyWidget. */
          segmentLegend
          onRowClick={onGo ? (r) => onGo(`topic/${r.id}`) : undefined}
          axisLabel={axisLabelOf(axis, dims)}
        />
      ) : (
        <div className="t-meta">Chưa có theme nào.</div>
      )}
    </Card>
  );
}
