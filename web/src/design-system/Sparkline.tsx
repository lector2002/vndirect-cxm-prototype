/* Sparkline cột dọc — port 1-1 từ sparkline() (prototype dòng 1616-1619) + CSS .spark/.spark>i
   (dòng 205-206): flex hàng, căn đáy, cao 44px; mỗi cột flex:1, bo góc trên 2px, min-height 3px,
   chiều cao thật = max(6, p/max*100)%. */
export type SparklineProps = {
  points: number[];
  color: string;
};

export function Sparkline({ points, color }: SparklineProps) {
  const max = Math.max(...points) || 1;
  return (
    <div data-testid="sparkline" className="flex items-end gap-[3px] h-[44px]">
      {points.map((p, i) => (
        <i
          key={i}
          className="flex-1 rounded-t-[2px] min-h-[3px]"
          style={{ height: `${Math.max(6, (p / max) * 100)}%`, background: color }}
        />
      ))}
    </div>
  );
}
