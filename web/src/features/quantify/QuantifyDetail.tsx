import { useState } from "react";
import type { Cfg, CxmData, Dim, QuantifyItem, QuantifyView } from "../../data/schema/index.ts";
import { qRun } from "../../domain/index.ts";
import { QuantifyWidget, Popover, Menu, btnSecondary, btnSizeLg, type MenuItem } from "../../design-system/index.ts";
import { CountFilter, type CountValue } from "./CountFilter.tsx";

export type QuantifyDetailProps = {
  item: QuantifyItem;
  data: CxmData;
  dims: Record<string, Dim>;
  cfg: Cfg;
  /** View hiệu lực cho toggle Chart/Bảng — override tạm (viewOverride ở QuantifyPage) hoặc
      item.view mặc định; page tính sẵn và truyền xuống, component này không tự suy ra. */
  view: QuantifyView;
  onSetView: (id: string, view: QuantifyView) => void;
  /** setId đang dùng item này (từ quantifyUsedBy) — hiện ngay trong metadata, không cần xác nhận xóa trước. */
  usedByIds: string[];
  onBack: () => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  /** Mở modal xác nhận xóa ở QuantifyPage — detail không tự confirm nữa (chỉ thị owner: xóa hiện
      popup giữa màn thay vì inline). */
  onRequestDelete: (id: string) => void;
};

/* Giá trị mặc định ban đầu của CountFilter (useState<CountValue>(DEFAULT_COUNT) bên dưới) — badge
   trên Popover ▽ chỉ hiện khi count LỆCH khỏi mặc định này (spec S2.6b: "đang ở mặc định thì không
   badge"). */
const DEFAULT_COUNT: CountValue = 10;

/* Màn chi tiết một chart Quantify — widget cỡ lớn + metadata (chiều hàng/cột, chỉ số, view mặc
   định, set đang dùng) + 3 icon thao tác (ⓘ thông tin / ▽ số dòng hiển thị / ⋮ menu Chart-Bảng-Sửa-
   Nhân bản-Xóa) ở Card.actions (S2.6b — dời hẳn khỏi footer, đồng bộ với QuantifyLibrary). Thuần
   presentational: không đọc store, mọi state chỉ qua props. Xóa không còn confirm inline — chỉ gọi
   onRequestDelete, QuantifyPage hiện Modal giữa màn. */
export function QuantifyDetail({
  item,
  data,
  dims,
  cfg,
  view,
  onSetView,
  usedByIds,
  onBack,
  onEdit,
  onDuplicate,
  onRequestDelete,
}: QuantifyDetailProps) {
  const [count, setCount] = useState<CountValue>(DEFAULT_COUNT);

  const rowDim = item.kind === "show" ? (dims[item.show]?.label ?? item.show) : undefined;
  const colDim = item.kind === "show" && item.by ? (dims[item.by]?.label ?? item.by) : undefined;

  // Filter số lượng chỉ áp cho chart rank/bảng 1 chiều (không donut/series/cross-tab) và khi đủ dòng
  // — cùng điều kiện đã dùng ở thẻ lưới cũ (P1.2b).
  const isRankShow = item.kind === "show" && !item.by && item.chart !== "donut";
  const total = isRankShow ? qRun(item, data, dims).length : 0;
  const showCount = isRankShow && total > 5;
  const limit = showCount ? (count === "all" ? total : count) : undefined;

  return (
    <div data-testid="quantify-detail" className="p-8">
      <button
        type="button"
        className={`mb-4 ${btnSecondary} ${btnSizeLg}`}
        onClick={onBack}
      >
        ← Về thư viện
      </button>

      {/* Metadata + thao tác dời lên Card.actions (S2.6b).
          03/08: `item.note` (nhận định về chart) ĐÃ BỎ khỏi mọi card của QuantifyWidget theo owner chốt
          "card nên clean nhất có thể", nên nó được render Ở ĐÂY — dưới card, và CHỈ ở màn chi tiết.
          Đó cũng là chỗ đúng về nghĩa: card trên dashboard chỉ trình bày số, còn diễn giải thuộc màn mà
          người dùng chủ động mở ra để đọc. Vẫn đúng 1 lần trên toàn màn (QuantifyDetail.test.tsx:44). */}
      <QuantifyWidget
        item={item}
        data={data}
        dims={dims}
        cfg={cfg}
        view={view}
        limit={limit}
        actions={
          <div className="flex items-center gap-0.5">
            <Popover trigger={<span aria-hidden="true">ⓘ</span>} label="Thông tin chart" testId="qmeta">
              <div className="text-sm text-ink-2 flex flex-col gap-1">
                {rowDim ? <div>Chiều hàng: {rowDim}</div> : null}
                {colDim ? <div>Chiều cột: {colDim}</div> : null}
                {item.kind === "show" ? <div>Chỉ số: {item.metric}</div> : null}
                <div>View mặc định: {item.view ?? "chart"}</div>
                <div>
                  {usedByIds.length > 0
                    ? `Đang dùng ở ${usedByIds.length} set: ${usedByIds.join(", ")}`
                    : "Chưa set nào dùng"}
                </div>
              </div>
            </Popover>

            {showCount ? (
              <Popover
                trigger={<span aria-hidden="true">▽</span>}
                label="Số dòng hiển thị"
                testId="qcount"
                active={count !== DEFAULT_COUNT}
              >
                <CountFilter value={count} total={total} onChange={setCount} />
              </Popover>
            ) : null}

            <Menu
              testId={`qmenu-${item.id}`}
              items={[
                // Toggle chỉ cho item show 1 chiều — cross-tab (item.by) dùng CrossTable cho cả 2
                // view, cùng lý do đã nêu ở QuantifyLibraryCard gốc. testId qtoggle-${id} giữ NGUYÊN
                // trên mục Chart để test cũ còn neo được.
                ...(item.kind === "show" && !item.by
                  ? ([
                      {
                        label: "▮ Chart",
                        checked: view === "chart",
                        testId: `qtoggle-${item.id}`,
                        onSelect: () => onSetView(item.id, "chart"),
                      },
                      {
                        label: "▤ Bảng",
                        checked: view === "table",
                        onSelect: () => onSetView(item.id, "table"),
                      },
                    ] satisfies MenuItem[])
                  : []),
                // Series curated không sửa ở builder — ẩn mục (port qActions() prototype 2432).
                // separatorBefore chỉ khi có nhóm Chart/Bảng phía trên (đánh dấu nhóm mới) — cross-tab
                // (item.by) không có toggle nên Sửa là mục đầu, không cần sep.
                ...(item.kind === "show"
                  ? ([
                      {
                        label: "Sửa",
                        separatorBefore: !item.by,
                        onSelect: () => onEdit(item.id),
                      },
                    ] satisfies MenuItem[])
                  : []),
                {
                  // Cùng nhóm "thao tác sửa" với Sửa (nếu có) — KHÔNG lấy sep riêng, tránh 2 đường kẻ
                  // liền nhau khi cả hai cùng hiện. Khi Sửa vắng (series) và Chart/Bảng cũng vắng
                  // (series không có toggle), Nhân bản là mục đầu tiên nên cũng không cần sep.
                  label: "Nhân bản",
                  onSelect: () => onDuplicate(item.id),
                },
                {
                  label: "Xóa",
                  tone: "crit",
                  separatorBefore: true,
                  testId: `qdelete-${item.id}`,
                  onSelect: () => onRequestDelete(item.id),
                },
              ]}
            />
          </div>
        }
      />

      {/* Nhận định về chart — NGOÀI card, để card giữ đúng vai "trình bày số". Đây là nơi DUY NHẤT
          `item.note` còn hiện trong app kể từ 03/08. */}
      {item.note ? (
        <div data-testid="qdetail-note" className="t-meta mt-4 max-w-[92ch]">
          {item.note}
        </div>
      ) : null}
    </div>
  );
}
