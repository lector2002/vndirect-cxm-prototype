/* Chú giải màu — hàng chip gọn hiện DƯỚI bar chart khi màu thanh mã hoá intent (data.cats), để
   người xem biết màu nghĩa là gì thay vì đoán. Component THUẦN props-only: không đọc store, không
   tự suy luận màu nào cần chú giải — logic đó (buildLegend) sống ở QuantifyWidget.tsx, nơi có sẵn
   `data.cats` và context của chart đang vẽ. */
export type ChartLegendItem = { label: string; color: string };

export type ChartLegendProps = { items: ChartLegendItem[] };

export function ChartLegend({ items }: ChartLegendProps) {
  if (items.length === 0) return null;
  return (
    /* Cỡ nâng lên (owner chốt 03/08: "legend các màu của bar cần to hơn để user dễ nhìn và phân biệt
       các màu hơn"). Ô màu 14px thay vì 8px — ở 8px hai token --cat-* cạnh nhau gần như không phân
       biệt nổi, mà phân biệt màu chính là toàn bộ công dụng của legend. Chữ 13px/ink-2 khớp cỡ nhãn
       hàng của Bars (text-[13px]): legend giải mã cho các hàng đó nên phải đọc cùng một cỡ. */
    <div data-testid="chart-legend" className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-[13px] text-ink-2">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <span
            className="inline-block w-3.5 h-3.5 rounded-[3px] flex-none border border-black/5"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
