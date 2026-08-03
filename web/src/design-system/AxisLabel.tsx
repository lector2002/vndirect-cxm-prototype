/* Nhãn trục/chú thích nhỏ dưới chart — port 1-1 từ axisLbl() (prototype dòng 1884) + CSS .axis
   (dòng 237: font-size 11.5px, color ink3, margin-top 9px, letter-spacing .01em). */
export type AxisLabelProps = {
  children: string;
};

export function AxisLabel({ children }: AxisLabelProps) {
  return <div data-testid="axis-label" className="text-[11.5px] text-ink-3 mt-[9px] tracking-[0.01em]">{children}</div>;
}
