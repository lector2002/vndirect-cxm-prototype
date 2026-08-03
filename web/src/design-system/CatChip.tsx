/* Chip category theo intent — port 1-1 từ catChip() (prototype dòng 1572) + CSS .chip (dòng 177).
   CHỦ Ý nhận label+color qua props, KHÔNG đọc map DATA.cats: map đó (id -> {label,color}) chưa có
   trong CxmData/schema hiện tại, đang chờ owner chốt cấu trúc category. Khi map đó được thêm vào
   schema, caller tra cứu rồi truyền label/color vào đây — component này không đổi. */
export type CatChipProps = {
  label: string;
  color: string;
};

export function CatChip({ label, color }: CatChipProps) {
  return (
    <span
      data-testid="cat-chip"
      className="inline-block px-2 py-0.5 rounded-[6px] text-[12px] font-semibold border bg-surface-2"
      style={{ color, borderColor: "currentColor" }}
    >
      {label}
    </span>
  );
}
