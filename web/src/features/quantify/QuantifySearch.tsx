export type QuantifySearchProps = {
  value: string;
  onChange: (v: string) => void;
};

/* Ô tìm chart LUÔN HIỆN trên toolbar Quantify (owner chốt 02/08). Trước đây input này sống bên trong
   popover "Bộ lọc" (QuantifyFilterBar) theo chỉ thị cũ "ko hiển thị phần search và filter như thế
   kia, cho nút mở filter" — nhưng chôn nó sau một nút làm owner tưởng thư viện không có search.
   Phân biệt: search là để TÌM một chart đã biết tên → phải 0 click; 3 nhóm chip là để THU HẸP tập
   chưa biết → nấp sau nút vẫn ổn. Vì vậy chip ở lại popover, chỉ search ra ngoài.

   Giữ NGUYÊN `data-testid="q-search"` và placeholder cũ: đây là cùng một ô, chỉ đổi chỗ đứng. */
/* Root KHÔNG tự cap chiều rộng: cụm cha trong QuantifyPage đã cap (`max-w-[680px]`), cap hai lần thì
   ô search bị bó ngắn dù còn chỗ trống ("thanh search đang bị ngắn"). `min-w-0` để flexbox được phép
   co lại thay vì tràn khi hẹp. */
export function QuantifySearch({ value, onChange }: QuantifySearchProps) {
  return (
    <div className="relative flex-1 min-w-0">
      <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-sm">
        ⌕
      </span>
      <input
        type="search"
        data-testid="q-search"
        aria-label="Tìm chart trong thư viện"
        /* h-9 = 36px, khớp đúng chiều cao nút "Bộ lọc" đứng cạnh — hai control cùng cụm mà lệch cao
           là thứ làm hàng này trông "lạc quẻ". */
        className="w-full h-9 border border-line rounded-lg pl-8 pr-8 text-sm"
        placeholder="Tìm theo tên hoặc chiều dữ liệu…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Nút xóa riêng cho search: "Xóa bộ lọc" trong popover giờ CHỈ xóa 3 nhóm chip, nên search phải
          có đường tự xóa của mình — nếu không, đã gõ vào đây thì không có cách nào bỏ trong 1 bước. */}
      {value !== "" ? (
        <button
          type="button"
          data-testid="q-search-clear"
          aria-label="Xóa từ khóa tìm"
          title="Xóa từ khóa tìm"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded text-ink-3 hover:bg-surface-2 hover:text-ink"
          onClick={() => onChange("")}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
