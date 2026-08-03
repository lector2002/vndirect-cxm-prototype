import { Popover } from "./Popover.tsx";

export type MenuItem = {
  label: string;
  onSelect: () => void;
  /** "crit" → chữ đỏ --crit, dùng cho Xóa. */
  tone?: "crit";
  /** Có mặt (true/false) → mục là lựa chọn radio, render dấu ✓ khi true. */
  checked?: boolean;
  /** Vẽ đường kẻ ngang phía trên mục này. */
  separatorBefore?: boolean;
  testId?: string;
};

export type MenuProps = { items: MenuItem[]; label?: string; testId?: string };

/* Menu ⋮ dựng TRÊN Popover — dùng render-prop `children` của Popover để tự đóng NGAY sau khi một
   mục được chọn (bấm mục → onSelect() RỒI đóng, spec S2.6b). checked !== undefined → mục radio
   (role="menuitemradio" + aria-checked); còn lại role="menuitem" thường. */
export function Menu({ items, label = "Thao tác", testId }: MenuProps) {
  return (
    <Popover trigger={<span aria-hidden="true">⋮</span>} label={label} testId={testId}>
      {(close) => (
        <div role="menu" className="flex flex-col min-w-[180px]">
          {items.map((it) => {
            const isRadio = it.checked !== undefined;
            return (
              <button
                key={it.label}
                type="button"
                role={isRadio ? "menuitemradio" : "menuitem"}
                aria-checked={isRadio ? it.checked : undefined}
                data-testid={it.testId}
                className={`text-left text-sm px-3 py-2 rounded hover:bg-surface-2 flex items-center gap-2 whitespace-nowrap ${
                  it.separatorBefore ? "mt-1 pt-2 border-t border-line-soft" : ""
                } ${it.tone === "crit" ? "text-crit" : "text-ink"}`}
                onClick={() => {
                  it.onSelect();
                  close();
                }}
              >
                {isRadio ? <span className="w-3 inline-block text-center">{it.checked ? "✓" : ""}</span> : null}
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
