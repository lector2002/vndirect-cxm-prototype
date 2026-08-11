import { useState } from "react";
import type {
  Cfg,
  CxmData,
  Dim,
  QuantifyItem,
  QuantifyShow,
  QuantifyView,
  ShowMark,
  StackMode,
} from "../../data/schema/index.ts";
import { Card, QuantifyWidget, btnSecondary, btnSizeLg } from "../../design-system/index.ts";

/** State ephemeral của builder — sống ở QuantifyPage (useState cục bộ, KHÔNG Zustand). Port 1-1
    QB_DEF (prototype dòng 2398): show/metric/chart cố định, by=null (chưa ghép chéo), view='chart'. */
export type QbState = {
  show: string;
  metric: string;
  chart: ShowMark;
  by: string | null;
  view: QuantifyView;
  /** Chiều CHIA MÀU trong thanh (Module D section 1). OPTIONAL và `undefined` = không chia màu —
      KHÔNG dùng `| null` như `by`: các test dựng literal QbState (QuantifyBuilder.test.tsx:30,77,116)
      nên thêm field bắt buộc là vỡ typecheck ba chỗ đó mà chẳng đổi hành vi nào. */
  split?: string;
  /** Chỉ có nghĩa khi có `split`. `undefined` = 'abs' (mặc định), khớp đúng nghĩa field `stack` vắng
      ở QuantifyShow nên payload lưu ra không cần thêm case nào. */
  stack?: StackMode;
};

/* split/stack cố ý VẮNG ở đây (không viết `split: undefined`): vắng đã đúng nghĩa "chưa chia màu",
   và giữ literal này nguyên như trước để không có test nào phải sửa theo. */
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
const CHART_OPTIONS: [ShowMark, string][] = [
  ["rank", "Bar"],
  ["donut", "Donut"],
];

/* Cách xếp đoạn màu khi có `split` (Module D section 1). 'abs' đứng TRƯỚC vì là mặc định, và vì nó
   là cách duy nhất còn giữ so sánh độ lớn giữa các hàng — dòng "Phủ X%" dưới chart dựa vào đó. */
const STACK_OPTIONS: [StackMode, string][] = [
  ["abs", "Số tuyệt đối"],
  ["pct", "Tỷ trọng 100%"],
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
  /* Chia màu chỉ tính THẬT được khi trục hàng là thuộc tính khách — khi đó trục chia màu (cũng
     base:'cust') nằm trên CÙNG một dòng Customer nên đếm được. Xem qRunSplit. */
  const showIsCust = dims[qb.show]?.base === "cust";
  const autoName = `${dims[qb.show]?.label ?? qb.show}${qb.by ? ` × ${dims[qb.by]?.label ?? qb.by}` : ""}${
    qb.split ? ` × ${dims[qb.split]?.label ?? qb.split}` : ""
  } · ${METRIC_LABEL[qb.metric] ?? qb.metric}`;

  /* Chuẩn hóa SAU MỌI thay đổi field (không chỉ 'by') — bỏ guard này = builder bịa số cross-tab
     khi user đổi show sang dim không evAttr trong lúc đang ghép chéo → validateFixture nhóm 16 đỏ. */
  function setField<K extends keyof QbState>(field: K, value: QbState[K]) {
    const next: QbState = { ...qb, [field]: value };
    if (!dims[next.show]?.evAttr) next.by = null;
    if (next.by === next.show) next.by = null;
    /* Ghép chéo và chia màu LOẠI TRỪ NHAU (quy tắc Looker Studio; validate rule 16 chặn). Field VỪA
       ĐƯỢC BẤM thắng — nếu để guard chung quyết thì một trong hai nút sẽ im lặng không có tác dụng và
       người dùng không biết vì sao. Cùng lý do cho donut: donut không hiện được đoạn màu. */
    if (field === "split" && next.split) {
      next.by = null;
      if (next.chart === "donut") next.chart = "rank";
    }
    if (field === "by" && next.by) next.split = undefined;
    /* `metric:'pct'` (% trên TỔNG cohort — nhãn số) và `stack:'pct'` (tỷ trọng TRONG hàng — bề rộng)
       là hai mẫu số khác nhau; bật cả hai thì một hình mang hai nghĩa "%". validate cũng chặn (rule
       16), nhưng phải chặn Ở ĐÂY nữa vì builder dựng payload trước khi validate chạy — không thì user
       lưu được một item mà chỉ banner đỏ mới nói là sai. Vẫn theo lối "field vừa bấm thắng". */
    if (field === "stack" && next.stack === "pct" && next.metric === "pct") next.metric = "count";
    if (field === "metric" && next.metric === "pct" && next.stack === "pct") next.stack = "abs";
    /* Ba guard chung — chạy SAU nhánh "field vừa bấm" nên chúng chỉ dọn tổ hợp còn lại không hợp lệ,
       không hoàn tác cú bấm. Cùng tinh thần `by` bị xoá khi show mất evAttr. */
    if (next.split && (dims[next.show]?.base !== "cust" || dims[next.split]?.base !== "cust")) next.split = undefined;
    if (next.split === next.show) next.split = undefined;
    if (next.chart === "donut") next.split = undefined;
    /* `stack` không có nghĩa khi không chia màu (validate rule 16 chặn) — dọn luôn để payload không
       mang field mồ côi. */
    if (!next.split) next.stack = undefined;
    setQb(next);
  }

  const showOptions: [string, string][] = Object.entries(dims).map(([k, d]) => [k, d.label]);
  const byOptions: [string, string][] = [
    ["", "— không ghép —"],
    ...Object.entries(dims)
      .filter(([k, d]) => d.evAttr && k !== qb.show)
      .map(([k, d]): [string, string] => [k, d.label]),
  ];
  /* Lọc theo `base === 'cust'` chứ KHÔNG liệt kê tay tên dim: owner chốt loại `pf` khỏi picker chia
     màu vì `pf` có mặt ở cả Evidence lẫn Customer nên nhập nhằng — mà dims.pf là base:'ev', nên bộ
     lọc base đã loại nó về mặt cấu trúc. Hardcode thêm `k !== 'pf'` chỉ tạo chỗ để hai luật lệch nhau. */
  const splitOptions: [string, string][] = [
    ["", "— không chia màu —"],
    ...Object.entries(dims)
      .filter(([k, d]) => d.base === "cust" && k !== qb.show)
      .map(([k, d]): [string, string] => [k, d.label]),
  ];

  const usedBy = editId ? quantifyUsedBy(editId) : [];
  const finalName = name.trim() || autoName;

  /* `stack` chỉ ghi ra khi là 'pct': schema chốt "vắng ⇒ 'abs'", nên ghi 'abs' tường minh là thêm một
     cách thứ hai để nói cùng một điều — rồi sẽ có chỗ so `stack === undefined` và chỗ so `=== 'abs'`
     lệch nhau. Ba chỗ dưới (live + 2 payload) dùng CHUNG hai spread này. */
  const splitFields = qb.split ? { split: qb.split } : {};
  const stackFields = qb.split && qb.stack === "pct" ? { stack: "pct" as StackMode } : {};

  const live: QuantifyItem = {
    id: "qb-live",
    kind: "show",
    name: finalName,
    show: qb.show,
    metric: qb.metric,
    chart: qb.by ? "rank" : qb.chart,
    view: qb.view,
    ...(qb.by ? { by: qb.by } : {}),
    ...splitFields,
    ...stackFields,
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
      ...splitFields,
      ...stackFields,
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
      ...splitFields,
      ...stackFields,
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
      {/* luật 11/08: bỏ đoạn giải thích công cụ */}

      {editId && usedBy.length > 0 ? (
        <div
          data-testid="qbuilder-used-warning"
          className="border-l-[3px] border-watch bg-watch-bg text-ink-2 text-xs rounded-r px-3 py-2 mb-4"
        >
          {/* luật 11/08: bỏ "Lưu đè sẽ đổi mọi set đó — muốn biến thể thì Lưu thành bản mới." */}
          ⚠ Chart này đang dùng ở {usedBy.length} set: {usedBy.join(", ")}.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        <div className="flex flex-col gap-4">
          <Card title="Chọn dữ liệu">
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
                {/* luật 11/08: bỏ "chỉ chiều đọc từ mẫu bằng chứng mới ghép, vì fixture tổng hợp không có phân phối chung" */}
                Chiều hàng này <b>không ghép chéo được</b>.
              </div>
            )}
            {/* Chia màu (breakdown) — Module D section 1. Chỉ hiện khi trục hàng là thuộc tính khách:
                với trục tổng hợp/bằng chứng thì không có đường nào tính ra đoạn màu mà không phải bịa
                tỷ lệ, nên hiện picker rồi báo lỗi sẽ tệ hơn là không hiện. */}
            {showIsCust ? (
              <Picker
                testId="qbuilder-picker-split"
                label="Chia màu trong thanh (thuộc tính khách)"
                options={splitOptions}
                value={qb.split ?? ""}
                onSelect={(v) => setField("split", v || undefined)}
              />
            ) : (
              <div className="mb-3 text-xs text-ink-2" data-testid="qbuilder-split-locked-note">
                {/* luật 11/08: bỏ "chỉ trục thuộc tính khách mới chia, vì khi đó hai giá trị nằm trên cùng một dòng khách nên đếm được thật" */}
                Chiều hàng này <b>không chia màu được</b>.
              </div>
            )}
            {qb.split ? (
              <Picker
                testId="qbuilder-picker-stack"
                label="Cách xếp đoạn màu"
                options={STACK_OPTIONS}
                value={qb.stack ?? "abs"}
                onSelect={(v) => setField("stack", v)}
              />
            ) : null}
            <Picker testId="qbuilder-picker-metric" label="Chỉ số" options={METRIC_OPTIONS} value={qb.metric} onSelect={(v) => setField("metric", v)} />
            <Picker testId="qbuilder-picker-view" label="Cách xem" options={VIEW_OPTIONS} value={qb.view} onSelect={(v) => setField("view", v)} />
            {!isCross && qb.view === "chart" ? (
              /* Đang chia màu thì BỎ donut khỏi danh sách thay vì để bấm rồi âm thầm mất `split`:
                 donut không hiện được đoạn màu (validate rule 16 chặn), nên một cú bấm hợp lệ về mặt
                 UI mà lại xoá lựa chọn khác là kiểu hoàn tác im lặng khó lần ra nhất. */
              <Picker
                testId="qbuilder-picker-chart"
                label={qb.split ? "Kiểu chart (donut không chia màu được)" : "Kiểu chart"}
                options={qb.split ? CHART_OPTIONS.filter(([k]) => k !== "donut") : CHART_OPTIONS}
                value={qb.chart}
                onSelect={(v) => setField("chart", v)}
              />
            ) : isCross ? (
              <div className="text-xs text-ink-2">
                Ghép chéo hiển thị dạng <b>bảng ma trận</b> (View Bảng) hoặc <b>stacked bar</b> (View Chart).
              </div>
            ) : null}
          </Card>

          <Card title={editId ? "Lưu thay đổi" : "Lưu chart"}>
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
          {/* onSplitChange: preview có chip strip đổi chiều chia màu (QuantifyWidget/SplitToggle) NẰM
              CẠNH picker `qbuilder-picker-split` của builder — hai control cho cùng một field. Nối vào
              CHÍNH `setField("split")` để chỉ có một writer: chỉ `qb.split` đi vào payload lúc Lưu, nên
              nếu chip giữ state riêng thì người dùng bấm chip, thấy chart đổi, bấm Lưu và mất im lặng
              cú đổi đó. Đi qua setField ⇒ mọi guard sẵn có (donut ⇒ bỏ split, split===show ⇒ bỏ, tắt
              split ⇒ bỏ stack) vẫn chạy y như bấm picker. */}
          <QuantifyWidget
            item={live}
            data={data}
            dims={dims}
            cfg={cfg}
            view={qb.view}
            onSplitChange={(next) => setField("split", next)}
          />
        </div>
      </div>
    </div>
  );
}
