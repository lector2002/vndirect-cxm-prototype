/* Số liệu neo — port 1-1 từ stat() (prototype dòng 1564-1571). CSS .stat/.stat .t-lbl/.stat .src/
   .stat .foot (prototype dòng 146-149): nền surface, viền line, radius var(--radius), padding
   15px 16px. `.t-lbl`/`.t-num` đã có sẵn trong web/src/index.css (@layer components, dòng 65-92) —
   dùng thẳng hai class đó thay vì viết lại thang chữ. */
export type StatProps = {
  label: string;
  value: string;
  /** Dòng phụ dưới số — vd "bước vượt ngưỡng xử lý". */
  foot?: string;
  /** Nguồn + độ tươi, tách bằng viền chấm phía trên (prototype: border-top dashed). */
  srcNote?: string;
  /** Màu chữ của value, vd 'var(--crit)' khi cần nhấn trạng thái xấu. */
  tone?: string;
};

export function Stat({ label, value, foot, srcNote, tone }: StatProps) {
  return (
    <div data-testid="stat" className="bg-surface border border-line rounded relative px-4 py-[15px]">
      <div className="t-lbl mb-[7px]">{label}</div>
      <div className="t-num" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      {foot ? <div className="text-[12px] text-ink-2 mt-[3px]">{foot}</div> : null}
      {srcNote ? (
        <div className="text-[12px] text-ink-3 mt-[7px] pt-[7px] border-t border-dashed border-line">{srcNote}</div>
      ) : null}
    </div>
  );
}
