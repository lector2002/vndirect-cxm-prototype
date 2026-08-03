import { useState } from "react";
import type { Cfg, CxmData, DimRow } from "../../../data/schema/index.ts";
import { themeSegments, type ThemeAxis } from "../../../domain/index.ts";
import { Bars, Card } from "../../../design-system/index.ts";

/* @themestack — VOC-STACKED-SPEC §3. Xếp hạng theme (n desc), thanh chia đoạn theo hai trục thay
   phiên: sub-theme (THẬT) hoặc nhóm khách (DEMO — nhãn thật, tỷ trọng bịa xem domain/themeSegments.ts). */
export type ThemeStackBlockProps = {
  data: CxmData;
  /** Giữ trong props theo shape chung (data+cfg+onGo) — block không dùng ngưỡng nào từ cfg, giống
      IntentBlock. */
  cfg: Cfg;
  onGo?: (route: string) => void;
};

const TOP_N = 8;

const seg = "text-[13px] px-3 py-1.5 rounded-sm font-semibold transition-colors";
const segOn = "bg-white text-primary shadow-sm";
const segOff = "bg-transparent text-ink-3 hover:text-ink";

const AXIS_OPTIONS: { key: ThemeAxis; label: string }[] = [
  { key: "subtheme", label: "Sub-theme" },
  { key: "group", label: "Nhóm khách" },
];

function axisLabelOf(axis: ThemeAxis): string {
  return axis === "subtheme" ? "Số tín hiệu, chia theo sub-theme" : "Số tín hiệu, chia theo nhóm khách (demo)";
}

export function ThemeStackBlock({ data, onGo }: ThemeStackBlockProps) {
  /* Mặc định 'group', KHÔNG phải trục thật 'subtheme' — owner chốt 03/08. Lý do: chỉ 3/14 theme có
     sub-theme, nên để trục thật làm mặc định thì 5/8 thanh top là xám đặc 100% và biểu đồ trông
     như hỏng. Đánh đổi: mặc định là số DEMO, nên nhãn "demo" cạnh toggle + denomStrip nói rõ tỷ
     trọng là minh hoạ KHÔNG được bỏ — chúng là thứ duy nhất chặn người xem đọc nhầm thành số thật. */
  const [axis, setAxis] = useState<ThemeAxis>("group");

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
    axis === "subtheme"
      ? `${subCoverage} trên ${themes.length} theme có sub-theme thật — phần còn lại hiện thanh xám "Chưa gán sub-theme"`
      : `Số nhóm khách là dữ liệu demo (nhãn thật, tỷ trọng minh hoạ)`;

  return (
    <Card
      title="Theme theo thành phần"
      denomStrip={denomStrip}
      actions={
        <div className="flex items-center gap-2">
          {axis === "group" ? <span className="text-[11px] text-ink-3 font-semibold">demo</span> : null}
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
          segments={(r) => themeSegments(data, r.id, axis)}
          /* Legend NGAY DƯỚI TỪNG THANH, không phải một dải chung (owner chốt 03/08). Bắt buộc phải
             theo hàng: themeSegments() gán màu theo THỨ HẠNG TRONG một theme và mỗi theme có bộ
             sub-theme/nhóm khách riêng ⇒ cùng màu ở hai thanh là hai thứ khác nhau. Xem Bars.tsx
             (prop segmentLegend) để biết vì sao chỗ này KHÔNG dùng ChartLegend như QuantifyWidget. */
          segmentLegend
          onRowClick={onGo ? (r) => onGo(`topic/${r.id}`) : undefined}
          axisLabel={axisLabelOf(axis)}
        />
      ) : (
        <div className="t-meta">Chưa có theme nào.</div>
      )}
    </Card>
  );
}
