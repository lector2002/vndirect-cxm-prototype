export type ValidateBannerProps = {
  errors: string[];
};

/* Banner đỏ toàn cục — hiện khi validateFixture() (qua store.validate()) trả về
   lỗi liên kết dữ liệu mẫu. Trên seed hợp lệ, errors rỗng nên component render null.
   Thuần presentational: chỉ nhận errors qua props, không đọc store. */
export function ValidateBanner({ errors }: ValidateBannerProps) {
  if (errors.length === 0) return null;

  return (
    <div data-testid="validate-banner" className="bg-crit-bg border-b border-crit-line px-4 py-2.5 text-crit text-[13px]">
      <b>{errors.length} lỗi liên kết dữ liệu mẫu:</b>
      <ul className="list-disc pl-5 mt-1">
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
