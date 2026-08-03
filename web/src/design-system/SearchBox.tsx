import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/* Combobox lookup/navigate TỐI GIẢN — không phải full WAI-ARIA combobox, chỉ input + dropdown
   nhóm theo `sub`/`kind`, chọn 1 dòng → onSelect. Đóng bằng click-outside ở CAPTURE-PHASE (copy
   pattern Popover.tsx) thay vì onBlur trên input: onBlur bắn TRƯỚC click trên dòng kết quả nên nếu
   đóng dropdown ở onBlur thì nút kết quả bị gỡ khỏi DOM trước khi click kịp tới — click-outside
   tránh được race đó. */
export type SearchResult = { id: string; label: string; kind: string; sub?: string };

export type SearchBoxProps = {
  value: string;
  onChange: (v: string) => void;
  results: SearchResult[];
  onSelect: (r: SearchResult) => void;
  placeholder?: string;
};

function groupResults(results: SearchResult[]): { group: string; items: SearchResult[] }[] {
  const groups: { group: string; items: SearchResult[] }[] = [];
  for (const r of results) {
    const key = r.sub ?? r.kind;
    const existing = groups.find((g) => g.group === key);
    if (existing) existing.items.push(r);
    else groups.push({ group: key, items: [r] });
  }
  return groups;
}

export function SearchBox({ value, onChange, results, onSelect, placeholder }: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const showDropdown = open && value.trim() !== "" && results.length > 0;

  useEffect(() => {
    if (!showDropdown) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside, true);
    return () => document.removeEventListener("click", onClickOutside, true);
  }, [showDropdown]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter" && results.length > 0) {
      onSelect(results[0]);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center gap-2 border border-line rounded-lg px-3 py-1.5 bg-surface">
        <span aria-hidden="true" className="text-ink-3">
          🔍
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-3"
        />
      </div>
      {showDropdown ? (
        <div className="absolute z-20 mt-1 w-full bg-surface border border-line rounded-lg shadow-sm max-h-[320px] overflow-auto">
          {groupResults(results).map((g) => (
            <div key={g.group}>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-ink-3 uppercase tracking-wide">{g.group}</div>
              {g.items.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onSelect(r);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-ink hover:bg-surface-2 flex items-baseline gap-2"
                >
                  <span>{r.label}</span>
                  {r.sub ? <span className="text-ink-3 text-[12px]">{r.sub}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
