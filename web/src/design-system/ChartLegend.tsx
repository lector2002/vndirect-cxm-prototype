/* Chú giải màu — hàng chip gọn hiện DƯỚI bar chart khi màu thanh mã hoá intent (data.cats), để
   người xem biết màu nghĩa là gì thay vì đoán. Component THUẦN props-only: không đọc store, không
   tự suy luận màu nào cần chú giải — logic đó (buildLegend) sống ở QuantifyWidget.tsx, nơi có sẵn
   `data.cats` và context của chart đang vẽ. */
export type ChartLegendItem = { label: string; color: string };

export type ChartLegendProps = { items: ChartLegendItem[] };

export function ChartLegend({ items }: ChartLegendProps) {
  if (items.length === 0) return null;
  return (
    <div data-testid="chart-legend" className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11.5px] text-ink-3">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
