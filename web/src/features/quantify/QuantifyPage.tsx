import { useRef, useState } from "react";
import type { QuantifyView } from "../../data/schema/index.ts";
import { Modal, btnPrimary, btnSecondary, btnSizeLg } from "../../design-system/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { QB_DEF, QuantifyBuilder, type QbState } from "./QuantifyBuilder.tsx";
import { QuantifyDetail } from "./QuantifyDetail.tsx";
import { QuantifyFilterBar, type ChipOption } from "./QuantifyFilterBar.tsx";
import { QuantifyFilterButton } from "./QuantifyFilterButton.tsx";
import { QuantifyLibrary } from "./QuantifyLibrary.tsx";
import { QuantifySearch } from "./QuantifySearch.tsx";
import { QuantifySets } from "./QuantifySets.tsx";
import {
  filterItems,
  qBaseKey,
  type BaseFilterValue,
  type KindFilterValue,
  type ViewFilterValue,
} from "./quantifyFilter.ts";

/** 4 màn con của tab Quantify. */
type QView = "lib" | "detail" | "build" | "sets";

/** Port 1-1 TYPES (prototype dòng 2443). */
const KIND_OPTIONS: [KindFilterValue, string][] = [
  ["all", "Tất cả"],
  ["rank", "Bar"],
  ["donut", "Donut"],
  ["trend", "Line"],
  ["cohort", "Cohort"],
  ["anomaly", "Anomaly"],
];

/** Port 1-1 VIEWS (prototype dòng 2445). */
const VIEW_OPTIONS: [ViewFilterValue, string][] = [
  ["all", "Mọi view"],
  ["chart", "▮ Chart"],
  ["table", "▤ Bảng"],
];

/** Port 1-1 GROUP_LABEL/BASE_GROUP (prototype dòng 1460, 2412). */
const BASE_LABEL: Record<string, string> = {
  all: "Mọi nền",
  agg: "Taxonomy & nguồn",
  ev: "Bằng chứng (mẫu)",
  cust: "Cohort khách",
  series: "Chuỗi thời gian",
};

/* Container Quantify — đọc store, sở hữu state điều hướng con (qview) và mọi UI state ephemeral
   (filter/search/detailId, viewOverride). TẤT CẢ là useState cục bộ, KHÔNG Zustand: filter/search
   không cần dai dẳng qua session, và viewOverride dùng chung giữa lưới lẫn màn chi tiết (P1.2b)
   khi điều hướng qua lại. */
export function QuantifyPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);
  const boards = useCxmStore((s) => s.boards);
  const duplicateQuantify = useCxmStore((s) => s.duplicateQuantify);
  const deleteQuantify = useCxmStore((s) => s.deleteQuantify);
  const quantifyUsedBy = useCxmStore((s) => s.quantifyUsedBy);
  const createQuantify = useCxmStore((s) => s.createQuantify);
  const saveQuantify = useCxmStore((s) => s.saveQuantify);
  const createSet = useCxmStore((s) => s.createSet);
  const duplicateSet = useCxmStore((s) => s.duplicateSet);
  const deleteSet = useCxmStore((s) => s.deleteSet);
  const renameSet = useCxmStore((s) => s.renameSet);
  const setBoardBlocks = useCxmStore((s) => s.setBoardBlocks);
  const resetBoard = useCxmStore((s) => s.resetBoard);

  const [qview, setQview] = useState<QView>("lib");
  const [viewOverride, setViewOverride] = useState<Record<string, QuantifyView>>({});
  const [kind, setKind] = useState<KindFilterValue>("all");
  const [base, setBase] = useState<BaseFilterValue>("all");
  const [view, setView] = useState<ViewFilterValue>("all");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  /* State builder — sống ở page (KHÔNG Zustand), thread xuống QuantifyBuilder. */
  const [qb, setQb] = useState<QbState>(QB_DEF);
  const [editId, setEditId] = useState<string | null>(null);
  /* Popover filter đóng mặc định (progressive disclosure) + id chart đang chờ xác nhận xóa —
     bấm Xóa ở card/detail chỉ set id này, Modal giữa màn tự quyết định nội dung/footer bên dưới. */
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState<string | undefined>(undefined);
  const deleteConfirmRef = useRef<HTMLButtonElement>(null);

  /* Nạp một item `show` về builder để sửa (Lưu đè cùng id) — port qGoEdit (prototype dòng 4590).
     Series không sửa ở builder (kind !== 'show' thì bỏ qua, giữ nguyên màn hiện tại). */
  function openBuilderFor(id: string) {
    const item = data.qt.find((q) => q.id === id);
    if (item && item.kind === "show") {
      setQb({ show: item.show, metric: item.metric, chart: item.chart, by: item.by ?? null, view: item.view ?? "chart" });
      setEditId(id);
      setQview("build");
    }
  }

  function handleBuilderSaved() {
    setQb(QB_DEF);
    setEditId(null);
    setQview("lib");
  }

  function handleSetView(id: string, v: QuantifyView) {
    setViewOverride((prev) => ({ ...prev, [id]: v }));
  }

  function handleDelete(id: string): { ok: boolean; reason?: string } {
    try {
      deleteQuantify(id);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  }

  /** Xóa MỌI tiêu chí kể cả search — dùng cho empty state của thư viện ("không chart nào khớp"),
      nơi người dùng muốn thoát hẳn khỏi trạng thái lọc bằng một bấm. */
  function handleClearFilters() {
    setKind("all");
    setBase("all");
    setView("all");
    setSearch("");
  }

  /** Chỉ xóa 3 nhóm chip — dùng cho nút trong popover "Bộ lọc". Search nằm ngoài popover và tự có
      nút × riêng, nên nút bên trong popover không được xóa nó (xóa cái người dùng đang thấy ở chỗ
      khác thì khó hiểu). */
  function handleClearFilterChips() {
    setKind("all");
    setBase("all");
    setView("all");
  }

  /* Bấm Xóa ở card/detail chỉ mở modal — chưa xóa gì. Modal tự tính usedBy để quyết định chặn hay
     cho xóa; xác nhận thật sự xảy ra ở handleConfirmDelete bên dưới. */
  function handleRequestDelete(id: string) {
    setDeleteReason(undefined);
    setDeletingId(id);
  }
  function handleCloseDeleteModal() {
    setDeletingId(null);
    setDeleteReason(undefined);
  }
  function handleConfirmDelete() {
    if (!deletingId) return;
    // Nhánh !ok phòng thủ: nút Xóa trong Modal chỉ render khi deleteBlocked=false (usedBy rỗng), và
    // deleteQuantify hiện chỉ throw khi usedBy không rỗng — nên trên đường thực thi hiện tại,
    // handleDelete luôn trả {ok:true} tại đây. Giữ lại theo đúng chỉ thị (Modal phải tự hiện được lý
    // do khi bị chặn) để không giả định store không bao giờ đổi/ throw vì lý do khác.
    const result = handleDelete(deletingId);
    if (result.ok) {
      setDeletingId(null);
      setDeleteReason(undefined);
    } else {
      setDeleteReason(result.reason);
    }
  }

  const items = filterItems(data.qt, dims, { kind, base, view, search });
  const hasActiveFilter = search.trim() !== "" || kind !== "all" || base !== "all" || view !== "all";
  /* Badge trên nút "Bộ lọc" đếm 3 nhóm chip, KHÔNG đếm search: badge tồn tại để trạng thái bị ẩn
     vẫn thấy được, mà search giờ luôn hiện trên toolbar nên đếm nó là báo trùng — và tệ hơn, badge
     hiện 1 trong khi mở popover ra chẳng thấy chip nào active. `hasActiveFilter` bên dưới thì VẪN
     xét search, vì nhãn "· đã lọc" nói về con số N/M và con số đó do search ảnh hưởng thật. */
  const activeFilterCount = (kind !== "all" ? 1 : 0) + (base !== "all" ? 1 : 0) + (view !== "all" ? 1 : 0);

  // Count per chip = tổng theo data.qt CHƯA lọc (không phải theo items đã lọc).
  const kindOptions: ChipOption<KindFilterValue>[] = KIND_OPTIONS.map(([value, label]) => ({
    value,
    label,
    count: value === "all" ? data.qt.length : data.qt.filter((q) => q.chart === value).length,
  }));
  const baseKeys: BaseFilterValue[] = ["all", ...new Set(data.qt.map((q) => qBaseKey(q, dims)))];
  const baseOptions: ChipOption<BaseFilterValue>[] = baseKeys.map((value) => ({
    value,
    label: BASE_LABEL[value] ?? value,
    count: value === "all" ? data.qt.length : data.qt.filter((q) => qBaseKey(q, dims) === value).length,
  }));
  const viewOptions: ChipOption<ViewFilterValue>[] = VIEW_OPTIONS.map(([value, label]) => ({
    value,
    label,
    count: value === "all" ? data.qt.length : data.qt.filter((q) => (q.view ?? "chart") === value).length,
  }));

  // Item đang chờ xác nhận xóa + set đang dùng nó — tính 1 lần, dùng chung cho Modal ở mọi qview
  // (Card lưới và Detail đều có thể gọi onRequestDelete, nên Modal phải render ở mọi nhánh return).
  const deletingItem = deletingId ? data.qt.find((q) => q.id === deletingId) : undefined;
  const deletingUsedBy = deletingId ? quantifyUsedBy(deletingId) : [];
  const deleteBlocked = deletingUsedBy.length > 0;

  const deleteModal = (
    <Modal
      open={deletingId !== null}
      title="Xóa chart?"
      onClose={handleCloseDeleteModal}
      initialFocusRef={deleteConfirmRef}
      footer={
        deleteBlocked ? (
          <button
            type="button"
            className={`${btnSecondary} ${btnSizeLg}`}
            onClick={handleCloseDeleteModal}
          >
            Đóng
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`${btnSecondary} ${btnSizeLg}`}
              onClick={handleCloseDeleteModal}
            >
              Hủy
            </button>
            <button
              ref={deleteConfirmRef}
              type="button"
              data-testid="qdelete-modal-confirm"
              className="text-sm px-3 py-1.5 rounded bg-crit text-white hover:opacity-90"
              onClick={handleConfirmDelete}
            >
              Xóa
            </button>
          </>
        )
      }
    >
      {deletingItem ? (
        deleteBlocked ? (
          <div>
            Không thể xóa «{deletingItem.name}»: đang dùng ở {deletingUsedBy.length} set: {deletingUsedBy.join(", ")}.
          </div>
        ) : (
          <div>Xóa vĩnh viễn «{deletingItem.name}»? Không thể hoàn tác.</div>
        )
      ) : null}
      {deleteReason ? <div className="text-xs text-crit mt-2">{deleteReason}</div> : null}
    </Modal>
  );

  if (qview === "detail" && detailId) {
    const item = data.qt.find((q) => q.id === detailId);
    if (item) {
      return (
        <>
          <QuantifyDetail
            item={item}
            data={data}
            dims={dims}
            cfg={cfg}
            view={viewOverride[item.id] ?? item.view ?? "chart"}
            onSetView={handleSetView}
            usedByIds={quantifyUsedBy(detailId)}
            onBack={() => setQview("lib")}
            onEdit={openBuilderFor}
            onDuplicate={(id) => duplicateQuantify(id)}
            onRequestDelete={handleRequestDelete}
          />
          {deleteModal}
        </>
      );
    }
    // item không còn tồn tại (vd vừa bị xóa) → rơi xuống render thư viện bên dưới.
  }

  if (qview === "build") {
    return (
      <QuantifyBuilder
        qb={qb}
        setQb={setQb}
        editId={editId}
        dims={dims}
        data={data}
        cfg={cfg}
        createQuantify={createQuantify}
        saveQuantify={saveQuantify}
        quantifyUsedBy={quantifyUsedBy}
        onBack={() => setQview("lib")}
        onSaved={handleBuilderSaved}
      />
    );
  }

  if (qview === "sets") {
    return (
      <QuantifySets
        data={data}
        boards={boards}
        createSet={createSet}
        duplicateSet={duplicateSet}
        deleteSet={deleteSet}
        renameSet={renameSet}
        setBoardBlocks={setBoardBlocks}
        resetBoard={resetBoard}
        onBack={() => setQview("lib")}
      />
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
        <h1 className="t-hero">Quantify</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${btnSecondary} ${btnSizeLg}`}
            onClick={() => setQview("sets")}
          >
            Quản lý set
          </button>
          <button
            type="button"
            className={`${btnPrimary} ${btnSizeLg}`}
            onClick={() => {
              setQb(QB_DEF);
              setEditId(null);
              setQview("build");
            }}
          >
            ＋ Tạo
          </button>
        </div>
      </div>

      {/* Search + "Bộ lọc" là MỘT cụm tìm-kiếm, phải đứng liền nhau bên trái; meta N/M là kết quả,
          đẩy sang phải. Trước đây cả 3 nằm chung `justify-between` nên nút Bộ lọc bị đùn ra giữa
          trang, trông như không thuộc về đâu (chỉ thị owner: "nút bộ lọc đang bay giữa trang").
          Cụm trái `flex-1` để ô search nở ra thay vì bị bó cứng ở 420px. */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[300px] max-w-[680px]">
          <QuantifySearch value={search} onChange={setSearch} />
          <QuantifyFilterButton open={filterOpen} onToggle={setFilterOpen} activeCount={activeFilterCount}>
            <QuantifyFilterBar
              kind={kind}
              base={base}
              view={view}
              kindOptions={kindOptions}
              baseOptions={baseOptions}
              viewOptions={viewOptions}
              onKind={setKind}
              onBase={setBase}
              onView={setView}
              onClear={handleClearFilterChips}
            />
          </QuantifyFilterButton>
        </div>
        <div className="t-meta ml-auto whitespace-nowrap">
          Hiển thị <b>{items.length}</b> / {data.qt.length} chart{hasActiveFilter ? " · đã lọc" : ""}
        </div>
      </div>

      <QuantifyLibrary
        items={items}
        data={data}
        dims={dims}
        cfg={cfg}
        onOpenDetail={(id) => {
          setDetailId(id);
          setQview("detail");
        }}
        onEdit={openBuilderFor}
        onRequestDelete={handleRequestDelete}
        onClearFilters={handleClearFilters}
      />
      {deleteModal}
    </div>
  );
}
