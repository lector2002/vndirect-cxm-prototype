import type { Cfg, CxmData, Dim, QuantifyItem } from "../../data/schema/index.ts";
import { QuantifyWidget, Menu, btnSecondary, btnSizeLg, type MenuItem } from "../../design-system/index.ts";

export type QuantifyLibraryProps = {
  items: QuantifyItem[];
  data: CxmData;
  dims: Record<string, Dim>;
  cfg: Cfg;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  /** Mở modal xác nhận xóa ở QuantifyPage — card không tự confirm nữa. */
  onRequestDelete: (id: string) => void;
  /** Xóa toàn bộ filter/search — chỉ dùng cho nút "Xóa bộ lọc" ở trạng thái rỗng. */
  onClearFilters?: () => void;
};

/* Thư viện Quantify — lưới 2 cột, mỗi ô là widget thật + hàng nút thao tác gọn (Xem chi tiết/Sửa/
   Xóa). Thuần presentational: không đọc store, mọi state chỉ qua props. Bấm nội dung trong widget
   (thanh bar, dòng bảng…) KHÔNG điều hướng sang tab khác — Quantify là xưởng authoring thuần (Q7
   trong _harness.js §11c), không phải điểm drill-away. Filter số lượng + toggle Chart/Bảng + Nhân
   bản đã dời sang màn chi tiết (QuantifyDetail) — thẻ lưới chỉ giữ 3 hành động cốt lõi để nổi bật,
   rõ ràng (redesign theo chỉ thị owner + ui-ux-pro-max §4/§5). */
export function QuantifyLibrary({
  items,
  data,
  dims,
  cfg,
  onOpenDetail,
  onEdit,
  onRequestDelete,
  onClearFilters,
}: QuantifyLibraryProps) {
  if (items.length === 0) {
    return (
      <div data-testid="quantify-empty" className="py-16 text-center text-ink-2">
        <p className="mb-3">Không có chart nào khớp bộ lọc.</p>
        {onClearFilters ? (
          <button
            type="button"
            className={`${btnSecondary} ${btnSizeLg}`}
            onClick={onClearFilters}
          >
            Xóa bộ lọc
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div data-testid="quantify-library" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {items.map((item) => (
        <QuantifyLibraryCard
          key={item.id}
          item={item}
          data={data}
          dims={dims}
          cfg={cfg}
          onOpenDetail={onOpenDetail}
          onEdit={onEdit}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </div>
  );
}

type QuantifyLibraryCardProps = {
  item: QuantifyItem;
  data: CxmData;
  dims: Record<string, Dim>;
  cfg: Cfg;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
};

/* S2.6b: 3 hành động cốt lõi (Xem chi tiết/Sửa/Xóa) dời từ footer sang Menu ⋮ ở góc phải header
   (Card.actions) — chỉ thị owner "bỏ hẳn footer, mọi điều khiển lên actions". "Xem chi tiết" không
   còn là nút CTA riêng: bấm bất kỳ đâu trên thẻ (trừ vùng ⋮) đã mở chi tiết, VÀ tiêu đề giờ là nút
   bấm được (Card.onTitleClick) — hai đường trùng lặp có chủ đích: click-anywhere cho chuột, tiêu đề
   cho keyboard/screen-reader (wrapper ngoài không có tabIndex/role). */
function QuantifyLibraryCard({ item, data, dims, cfg, onOpenDetail, onEdit, onRequestDelete }: QuantifyLibraryCardProps) {
  const menuItems: MenuItem[] = [
    { label: "Xem chi tiết", onSelect: () => onOpenDetail(item.id) },
    // Chỉ item `show` sửa được ở builder (series là curated) — ẩn mục cho series, tránh no-op im
    // lặng. Port qActions() prototype dòng 2432 (isShow ? nút Sửa : '').
    ...(item.kind === "show" ? [{ label: "Sửa", onSelect: () => onEdit(item.id) } as MenuItem] : []),
    {
      label: "Xóa",
      onSelect: () => onRequestDelete(item.id),
      tone: "crit",
      separatorBefore: true,
      testId: `qdelete-${item.id}`,
    },
  ];

  return (
    <div
      data-testid={`qcard-${item.id}`}
      className="rounded transition-shadow hover:shadow-lg cursor-pointer"
      onClick={() => {
        // Bỏ qua nếu người dùng đang bôi đen text trong card (chọn để copy, không phải bấm để mở).
        if (window.getSelection()?.toString()) return;
        onOpenDetail(item.id);
      }}
    >
      <QuantifyWidget
        item={item}
        data={data}
        dims={dims}
        cfg={cfg}
        view={item.view ?? "chart"}
        onTitleClick={() => onOpenDetail(item.id)}
        actions={
          // stopPropagation: bấm ⋮ (hoặc mục trong menu) không được kích hoạt onClick mở chi tiết
          // của wrapper cha bên trên.
          <div onClick={(e) => e.stopPropagation()}>
            <Menu items={menuItems} testId={`qmenu-${item.id}`} />
          </div>
        }
      />
    </div>
  );
}
