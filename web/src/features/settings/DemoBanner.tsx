export type DemoBannerProps = {
  demoMode: boolean;
};

/* Banner toàn cục — hiện khi Demo Mode TẮT (mô phỏng "chưa kết nối DB thật, chưa có dữ liệu").
   Thuần presentational: chỉ nhận demoMode qua props, không đọc store (xem ValidateBanner.tsx
   cho cùng pattern). Khi demoMode=true (mặc định) → render null, không ảnh hưởng layout. */
export function DemoBanner({ demoMode }: DemoBannerProps) {
  if (demoMode) return null;

  return (
    <div data-testid="demo-banner" className="bg-surface-2 border-b border-line px-4 py-2 text-ink-2 text-[13px]">
      Demo Mode đang TẮT · chưa kết nối cơ sở dữ liệu thật — không có dữ liệu để hiển thị. Bật lại
      trong Cài đặt.
    </div>
  );
}
