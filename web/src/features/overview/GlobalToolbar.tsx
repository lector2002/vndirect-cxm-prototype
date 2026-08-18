import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildSearchIndex, queryIndex } from "../../domain/index.ts";
import type { SearchEntry } from "../../domain/index.ts";
import { SearchBox } from "../../design-system/index.ts";
import type { SearchResult } from "../../design-system/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { TimeframeBar } from "./TimeframeBar.tsx";

/* Toolbar GLOBAL kiểu Enterpret — mount 1 lần thay TimeframeBar trong Shell (App.tsx).
   18/08 (redesign MVP, nước đi S1): 2 hàng nén còn MỘT hàng — khung thời gian trái, ô
   tìm-kiếm-để-điều-hướng (KHÔNG phải lọc) co giãn ở giữa, ba nút phải. Hai hàng cũ tốn ~56px đầu
   MỌI màn có timeframe trong khi cả hai hàng đều còn quá nửa bề ngang trống; nội dung chính của
   màn phải vào tầm mắt sớm hơn (F-pattern). Không nút/nhãn nào bị bỏ — chỉ xếp lại.
   Nút "Ẩn bộ lọc" đã BỎ (owner chốt 04/08). Nó ẩn/hiện đúng một hàng mà bản thân nó lại chiếm một
   chỗ trên hàng trên nên chẳng tiết kiệm được chiều cao nào; và thứ nó ẩn là ô TÌM KIẾM — không phải
   bộ lọc — nên nhãn nút nói sai việc nó làm.
   `query` là local state THUẦN (useState) — không Zustand, không localStorage, không persistence. */
export type GlobalToolbarProps = {
  useStore?: typeof useCxmStore;
};

const btnEnabled = "border border-line rounded-lg px-3 py-1.5 text-[13px] text-ink hover:bg-surface-2";
const btnDisabled = "border border-line rounded-lg px-3 py-1.5 text-[13px] text-ink-3 opacity-50 cursor-not-allowed";

export function GlobalToolbar({ useStore = useCxmStore }: GlobalToolbarProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const data = useStore((s) => s.data);
  const index = useMemo(() => buildSearchIndex(data), [data]);
  const results: SearchEntry[] = query.trim() ? queryIndex(index, query) : [];

  function onSelect(r: SearchResult) {
    // SearchBoxProps chỉ biết SearchResult (không có `route`, generic cho design-system) — tra lại
    // SearchEntry gốc trong index bằng id để lấy route thật.
    const entry = index.find((e) => e.id === r.id);
    if (entry) navigate(`/${entry.route}`);
    setQuery("");
  }

  return (
    <div className="border-b border-line bg-surface">
      <div className="flex items-center gap-3 py-2.5 px-8">
        <TimeframeBar useStore={useStore} />
        <div className="flex-1 min-w-0">
          <SearchBox
            value={query}
            onChange={setQuery}
            results={results}
            onSelect={onSelect}
            placeholder="Search features, feedback reasons, or metadata"
          />
        </div>
        <button
          type="button"
          disabled
          // luật 11/08: bỏ "chưa bật"
          title="Lọc toàn cục cần pipeline dữ liệu gắn feedback."
          className={btnDisabled}
        >
          Apply filters
        </button>
        <button type="button" className={btnEnabled} onClick={() => setQuery("")}>
          Reset
        </button>
        <button
          type="button"
          disabled
          // luật 11/08: bỏ "tính năng chờ pipeline"
          title="Cần lưu cấu hình (persistence)."
          className={btnDisabled}
        >
          Save as default
        </button>
      </div>
    </div>
  );
}
