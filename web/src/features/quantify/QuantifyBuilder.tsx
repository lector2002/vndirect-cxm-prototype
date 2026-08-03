import { useState } from "react";
import type {
  Cfg,
  ChartKind,
  CxmData,
  Dim,
  QuantifyItem,
  QuantifyShow,
  QuantifyView,
} from "../../data/schema/index.ts";
import { Card, QuantifyWidget, btnSecondary, btnSizeLg } from "../../design-system/index.ts";

/** State ephemeral của builder — sống ở QuantifyPage (useState cục bộ, KHÔNG Zustand). Port 1-1
    QB_DEF (prototype dòng 2398): show/metric/chart cố định, by=null (chưa ghép chéo), view='chart'. */
export type QbState = {
  show: string;
  metric: string;
  chart: ChartKind;
  by: string | null;
  view: QuantifyView;
};

export const QB_DEF: QbState = { show: "theme", metric: "count", chart: "rank", by: null, view: "chart" };

const METRIC_OPTIONS: [string, string][] = [
  ["count", "Count"],
  ["pct", "Percentage"],
];
/** Port 1-1 METRICS.label (prototype dòng 1461-1464) — dùng cho autoName. */
const METRIC_LABEL: Record<string, string> = { count: "Count", pct: "Percentage" };

const VIEW_OPTIONS: [QuantifyView, string][] = [
  ["chart", "▮ Chart"],
  ["table", "▤ Bảng"],
];

/** Port 1-1 CHARTS.rank/donut (prototype dòng 1465) — anomaly/trend/cohort không dựng được ở builder
    (chỉ dùng cho series curated), nên không liệt kê ở đây. */
const CHART_OPTIONS: [ChartKind, string][] = [
  ["rank", "Bar"],
  ["donut", "Donut"],
];

export type QuantifyBuilderProps = {
  qb: QbState;
  setQb: (qb: QbState) => void;
  editId: string | null;
  dims: Record<string, Dim>;
  data: CxmData;
  cfg: Cfg;
  /** Tạo item mới (id do repo cấp) — dùng cho "Lưu thành bản mới" / tạo lần đầu. */
  createQuantify: (fields: Omit<QuantifyShow, "id">) => QuantifyItem;
  /** Upsert theo id — dùng cho "Lưu đè" (giữ id cũ). */
  saveQuantify: (item: QuantifyItem) => void;
  /** setId đang dùng editId này — hiện banner cảnh báo trước khi lưu đè. */
  quantifyUsedBy: (id: string) => string[];
  onBack: () => void;
  /** Gọi sau khi lưu thành công — page reset qb/editId + điều hướng về thư viện. */
  onSaved: () => void;
};

const chip = "text-xs px-2 py-1 rounded border";
const chipOff = "border-line text-ink-2 hover:bg-surface-2";
const chipOn = "bg-primary text-white border-primary";

/* Chip-picker dùng chung cho mọi field builder — port 1-1 pick() (prototype dòng 2516-2520).
   testId khoanh vùng mỗi nhóm chip để test truy vấn đúng nhóm (nhiều nhãn dim trùng tên giữa
   picker "Chiều hàng" và "Chiều cột"). */
function Picker<T extends string>({
  testId,
  label,
  options,
  value,
  onSelect,
}: {
  testId: string;
  label: string;
  options: [T, string][];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="mb-3" data-testid={testId}>
      <div className="text-xs font-medium text-ink-2 mb-1.5">{label}</div>
      <div className="flex gap-1.5 flex-wrap">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            className={`${chip} ${value === v ? chipOn : chipOff}`}
            onClick={() => onSelect(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* Builder Quantify — tạo/sửa chart `show` qua dropdown đóng (không nhập tự do, không join tùy ý).
   Port tinh thần quantifyCreate() (prototype dòng 2505-2570): setQ() chuẩn hóa gate cross-tab SAU
   MỌI thay đổi field (dòng 4533-4541) — chiều hàng không evAttr thì by=null, by trùng show thì
   by=null; qSave() build payload tường minh, KHÔNG spread field cũ (dòng 4564-4581) để tránh `by`
   cũ sót lại khi bỏ ghép chéo. Thuần presentational: mọi mutation qua props, không đọc store. */
export function QuantifyBuilder({
  qb,
  setQb,
  editId,
  dims,
  data,
  cfg,
  createQuantify,
  saveQuantify,
  quantifyUsedBy,
  onBack,
  onSaved,
}: QuantifyBuilderProps) {
  const editItem = editId ? data.qt.find((q) => q.id === editId) : undefined;
  const [name, setName] = useState(editItem?.name ?? "");

  const isCross = !!qb.by;
  const showEvAttr = !!dims[qb.show]?.evAttr;
  const autoName = `${dims[qb.show]?.label ?? qb.show}${qb.by ? ` × ${dims[qb.by]?.label ?? qb.by}` : ""} · ${
    METRIC_LABEL[qb.metric] ?? qb.metric
  }`;

  /* Chuẩn hóa SAU MỌI thay đổi field (không chỉ 'by') — bỏ guard này = builder bịa số cross-tab
     khi user đổi show sang dim không evAttr trong lúc đang ghép chéo → validateFixture nhóm 16 đỏ. */
  function setField<K extends keyof QbState>(field: K, value: QbState[K]) {
    const next: QbState = { ...qb, [field]: value };
    if (!dims[next.show]?.evAttr) next.by = null;
    if (next.by === next.show) next.by = null;
    setQb(next);
  }

  const showOptions: [string, string][] = Object.entries(dims).map(([k, d]) => [k, d.label]);
  const byOptions: [string, string][] = [
    ["", "— không ghép —"],
    ...Object.entries(dims)
      .filter(([k, d]) => d.evAttr && k !== qb.show)
      .map(([k, d]): [string, string] => [k, d.label]),
  ];

  const usedBy = editId ? quantifyUsedBy(editId) : [];
  const finalName = name.trim() || autoName;

  const live: QuantifyItem = {
    id: "qb-live",
    kind: "show",
    name: finalName,
    show: qb.show,
    metric: qb.metric,
    chart: qb.by ? "rank" : qb.chart,
    view: qb.view,
    ...(qb.by ? { by: qb.by } : {}),
  };

  function handleSaveOverwrite() {
    if (!editId) return;
    const existing = data.qt.find((q) => q.id === editId);
    if (!existing || existing.kind !== "show") return;
    const next: QuantifyShow = {
      id: existing.id,
      kind: "show",
      name: finalName,
      show: qb.show,
      metric: qb.metric,
      chart: qb.by ? "rank" : qb.chart,
      view: qb.view,
      ...(qb.by ? { by: qb.by } : {}),
      ...(existing.note ? { note: existing.note } : {}),
    };
    saveQuantify(next);
    onSaved();
  }

  function handleSaveNew() {
    const fields: Omit<QuantifyShow, "id"> = {
      kind: "show",
      name: finalName,
      show: qb.show,
      metric: qb.metric,
      chart: qb.by ? "rank" : qb.chart,
      view: qb.view,
      ...(qb.by ? { by: qb.by } : {}),
    };
    createQuantify(fields);
    onSaved();
  }

  return (
    <div className="p-8" data-testid="quantify-builder">
      <button
        type="button"
        className={`mb-4 ${btnSecondary} ${btnSizeLg}`}
        onClick={onBack}
      >
        ← Về thư viện
      </button>
      <h1 className="t-hero mb-2 max-w-[40ch]">{editId ? "Sửa chart" : "Tạo chart mới"}</h1>
      <p className="t-meta mb-4 max-w-[92ch]">
        Mọi ô là danh sách đóng, không có ô nhập tự do — thấy được toàn bộ giới hạn của công cụ. Ghép
        chéo 2 chiều <b>chỉ tính từ mẫu bằng chứng</b> (Intent/Sentiment/Nền tảng/Theme…); chiều tổng
        hợp (Nguồn/Segment/Tier) không có phân phối chung nên bị khóa, tránh bịa số.
      </p>

      {editId && usedBy.length > 0 ? (
        <div
          data-testid="qbuilder-used-warning"
          className="border-l-[3px] border-watch bg-watch-bg text-ink-2 text-xs rounded-r px-3 py-2 mb-4"
        >
          ⚠ Chart này đang dùng ở {usedBy.length} set: {usedBy.join(", ")}. <b>Lưu đè</b> sẽ đổi mọi
          set đó — muốn biến thể thì <b>Lưu thành bản mới</b>.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card title="Chọn dữ liệu" subtitle="Danh sách đóng">
            <Picker testId="qbuilder-picker-show" label="Chiều hàng" options={showOptions} value={qb.show} onSelect={(v) => setField("show", v)} />
            {showEvAttr ? (
              <Picker
                testId="qbuilder-picker-by"
                label="Chiều cột · ghép chéo (mẫu bằng chứng)"
                options={byOptions}
                value={qb.by ?? ""}
                onSelect={(v) => setField("by", v || null)}
              />
            ) : (
              <div className="mb-3 text-xs text-ink-2" data-testid="qbuilder-by-locked-note">
                Chiều hàng này <b>không ghép chéo được</b> — chỉ chiều đọc từ mẫu bằng chứng mới ghép,
                vì fixture tổng hợp không có phân phối chung.
              </div>
            )}
            <Picker testId="qbuilder-picker-metric" label="Chỉ số" options={METRIC_OPTIONS} value={qb.metric} onSelect={(v) => setField("metric", v)} />
            <Picker testId="qbuilder-picker-view" label="Cách xem" options={VIEW_OPTIONS} value={qb.view} onSelect={(v) => setField("view", v)} />
            {!isCross && qb.view === "chart" ? (
              <Picker testId="qbuilder-picker-chart" label="Kiểu chart" options={CHART_OPTIONS} value={qb.chart} onSelect={(v) => setField("chart", v)} />
            ) : isCross ? (
              <div className="text-xs text-ink-2">
                Ghép chéo hiển thị dạng <b>bảng ma trận</b> (View Bảng) hoặc <b>stacked bar</b> (View Chart).
              </div>
            ) : null}
          </Card>

          <Card
            title={editId ? "Lưu thay đổi" : "Lưu chart"}
            subtitle={editId ? "Đè bản cũ hoặc tạo bản mới" : "Đặt tên rồi thêm vào thư viện"}
          >
            <div className="text-xs font-medium text-ink-2 mb-1.5">Tên chart</div>
            <input
              type="text"
              data-testid="qbuilder-name"
              className="w-full border border-line rounded px-3 py-2 text-sm mb-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={autoName}
            />
            {editId ? (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  data-testid="qbuilder-save-overwrite"
                  className="text-sm px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-hover"
                  onClick={handleSaveOverwrite}
                >
                  Lưu đè
                </button>
                <button
                  type="button"
                  data-testid="qbuilder-save-new"
                  className={`${btnSecondary} ${btnSizeLg}`}
                  onClick={handleSaveNew}
                >
                  Lưu thành bản mới
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="qbuilder-save-new"
                className="text-sm px-3 py-1.5 rounded bg-primary text-white hover:bg-primary-hover"
                onClick={handleSaveNew}
              >
                ＋ Lưu vào thư viện
              </button>
            )}
          </Card>
        </div>

        <div>
          <QuantifyWidget item={live} data={data} dims={dims} cfg={cfg} view={qb.view} />
        </div>
      </div>
    </div>
  );
}
