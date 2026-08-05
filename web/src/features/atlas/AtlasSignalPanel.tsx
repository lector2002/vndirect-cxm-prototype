import { useState } from "react";
import type { Dim, SigCount, Signal, Touchpoint } from "../../data/schema/index.ts";
import { PF_LABEL, signalChart } from "../../domain/index.ts";
import type { DimState, SigCol, SigGroup, SigSlice } from "../../domain/index.ts";
import { Badge, Note, SignalColumns } from "../../design-system/index.ts";
import type { SigColBar, SigColGroup, SigColSlice } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { SIGNAL_STATUS } from "./signalStatus.ts";

/* Bảng signal (chọn nhiều, checkbox) + chart điểm đo (SignalColumns, domain/signalChart.ts) + panel
   "gắn ở đâu" (Đ4) của MỘT bước — trước đây là khối tĩnh "Signal đang gắn vào bước này" trong
   AtlasStepInspector.tsx (đã CHUYỂN nguyên nhãn + bảng sang đây). Thiết kế:
   - output/thiet-ke-chart-signal.html §1 (ba việc người dùng làm), §9 (11 tiêu chí nghiệm thu).
   - output/thiet-ke-chart-signal-bo-sung-dot-2.html Đ3 (điểm đo một giá trị), Đ4 (panel gắn ở đâu +
     Bảng D). */

const TABLE_HEADERS = ["Event", "Nguồn", "Platform", "Volume/ngày", "Lần thấy cuối", "Trạng thái"];

export type AtlasSignalPanelProps = {
  /** Signal của các touchpoint thuộc bước đang xem (đã lọc ở caller) — PHẢI giữ cả signal
      gap/designed, không lọc bỏ (cùng bất biến AtlasStepInspector đã có). */
  signals: Signal[];
  /** Touchpoint của riêng bước này — Đ4 tra tên/kênh của điểm tiếp xúc chứa signal đang chọn. */
  touchpoints: Touchpoint[];
  /** Bảng đếm TOÀN CỤC của chart điểm đo (`data.sigCounts`) — signalChart tự lọc theo lựa chọn,
      component này không tự lọc trước. */
  rows: readonly SigCount[];
  dims: Record<string, Dim>;
  /** Mã trạm của BƯỚC đang xem, dùng cho panel Đ4 ("· trạm JS-MTK-02"). Lấy từ `Step.stationId`
      (KHÔNG phải `Step.code`, xem "tự quyết"/mâu thuẫn hợp đồng trong response của phiên làm việc
      này) — khớp đúng ví dụ chốt ở Đ4 và bảng "Mã trạm của bước" (JS-MTK-01..06). */
  stationId: string;
};

/** Tên đẹp cho nền tảng — đọc PF_LABEL LÚC GỌI (trong hàm, không gán ra const top-level của module
    này) như cảnh báo ở domain/themeSegments.ts:43-54: quantify.ts/themeSegments.ts import vòng nhau,
    một `const X = PF_LABEL` khai lúc module nạp có thể đọc bảng rỗng tuỳ thứ tự import. File này
    không nằm trong vòng import đó, nhưng giữ cùng cách viết (deref trong hàm) để không tạo thêm một
    chỗ phải nhớ luật riêng. Giá trị lạ (không có trong PF_LABEL) hiện NGUYÊN VĂN, không rơi về "khác". */
function pfLabelsOf(pf: readonly string[]): string {
  return pf.map((p) => PF_LABEL[p] ?? p).join(", ");
}

function toColSlice(s: SigSlice, dimId: string): SigColSlice {
  // Rule 7: label giữ VERBATIM `band`, TRỪ chiều sigpf — hiện tên đẹp qua PF_LABEL.
  const label = dimId === "sigpf" ? (PF_LABEL[s.band] ?? s.band) : s.band;
  return { label, n: s.n, unknown: s.unknown };
}

function toColBar(col: SigCol, dimId: string): SigColBar {
  return { val: col.val, declared: col.declared, total: col.total, slices: col.slices.map((s) => toColSlice(s, dimId)) };
}

function toColGroups(groups: readonly SigGroup[], dimId: string): SigColGroup[] {
  return groups.map((g) => ({
    sigId: g.sigId,
    title: g.sigName,
    vol: g.vol,
    bars: g.cols.map((c) => toColBar(c, dimId)),
    notIdentified: g.notIdentified,
    notIdentifiedPct: g.notIdentifiedPct,
  }));
}

function SignalTable({
  signals,
  selectedIds,
  onToggle,
}: {
  signals: Signal[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs">Chọn</th>
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                className="text-left px-2.5 py-1.5 border-b-2 border-line font-semibold text-ink-2 text-xs whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signals.map((g) => {
            const status = SIGNAL_STATUS[g.st];
            return (
              <tr key={g.id} data-testid={`atlas-signal-${g.id}`}>
                <td className="px-2.5 py-1.5 border-b border-line">
                  <input
                    type="checkbox"
                    data-testid={`atlas-sigpick-${g.id}`}
                    checked={selectedIds.includes(g.id)}
                    onChange={() => onToggle(g.id)}
                    aria-label={`Chọn điểm đo ${g.name}`}
                  />
                </td>
                <td className="px-2.5 py-1.5 border-b border-line">
                  <code className="font-mono text-[12px] text-primary">{g.name}</code>
                  <div className="t-meta text-[12px] mt-0.5">{g.desc}</div>
                </td>
                <td className="px-2.5 py-1.5 border-b border-line t-meta whitespace-nowrap">
                  {g.es === "server" ? "server" : "client"}
                </td>
                <td className="px-2.5 py-1.5 border-b border-line t-meta whitespace-nowrap">{pfLabelsOf(g.pf)}</td>
                <td className="px-2.5 py-1.5 border-b border-line tabular-nums">{g.vol ? nf(g.vol) : "—"}</td>
                <td className="px-2.5 py-1.5 border-b border-line t-meta whitespace-nowrap">
                  {g.seen || <span className="text-ink-3">chưa từng</span>}
                </td>
                <td className="px-2.5 py-1.5 border-b border-line whitespace-nowrap">
                  <Badge state={status.badge} text={status.label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Năm nút chiều, ba trạng thái tính từ `chart.dimStates` (rule 7 domain/signalChart.ts) — không
    hand-declare. `full` bấm thường; `partial` bấm được, hiện % ngay trên nút; `locked` khoá kèm lý
    do. Câu chữ ba trạng thái PORT ĐÚNG khuôn ở output/thiet-ke-chart-signal.html §1 (bảng "Tình
    trạng dữ liệu"): "x% dữ liệu không gán được {unit}" / "nguồn này không ghi {unit}". */
function DimButtons({
  dimStates,
  selectedDimId,
  dims,
  onSelect,
}: {
  dimStates: readonly DimState[];
  selectedDimId: string;
  dims: Record<string, Dim>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Chọn chiều để nhìn">
      {dimStates.map((ds) => {
        const unit = dims[ds.id].unit;
        const locked = ds.state === "locked";
        const selected = ds.id === selectedDimId;
        return (
          <button
            key={ds.id}
            type="button"
            data-testid={`atlas-dim-${ds.id}`}
            disabled={locked}
            aria-pressed={selected}
            onClick={() => onSelect(ds.id)}
            className={`text-left px-2.5 py-1.5 rounded-[8px] border text-[12.5px] ${
              selected ? "border-primary bg-primary-soft" : "border-line bg-surface"
            } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-semibold">{ds.label}</div>
            {ds.state === "partial" ? (
              <div className="text-[11px] text-ink-2">{`${Math.round(ds.missingPct * 100)}% dữ liệu không gán được ${unit}`}</div>
            ) : null}
            {locked ? <div className="text-[11px] text-ink-2">{`nguồn này không ghi ${unit}`}</div> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Đ4 — "điểm đo này gắn ở đâu", cho TỪNG signal đang chọn (kể cả signal gap/designed: đây là mô tả
    NƠI GẮN, không phải mô tả khối lượng). Field + khuôn câu port đúng ví dụ đã chốt ở
    output/thiet-ke-chart-signal-bo-sung-dot-2.html Đ4: "Điểm tiếp xúc: … (kênh …) · event … · phía
    … · … · trạm …". */
function WherePanel({
  selectedIds,
  signals,
  touchpoints,
  stationId,
}: {
  selectedIds: readonly string[];
  signals: Signal[];
  touchpoints: Touchpoint[];
  stationId: string;
}) {
  if (selectedIds.length === 0) return null;
  const selectedSignals = signals.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="mt-4">
      <div className="t-lbl mb-2">Điểm đo này gắn ở đâu</div>
      <div className="flex flex-col gap-2">
        {selectedSignals.map((sig) => {
          const tp = touchpoints.find((t) => t.id === sig.tpId);
          if (!tp) {
            // Invariant: mọi signal truyền vào panel phải thuộc một touchpoint CŨNG truyền vào panel
            // (cùng bước) — vỡ ở đây là lỗi khai props của caller, không phải trạng thái dữ liệu hợp lệ.
            throw new Error(
              `AtlasSignalPanel: signal "${sig.id}" có tpId "${sig.tpId}" không khớp touchpoint nào trong props — caller phải truyền touchpoints cùng bước với signals`,
            );
          }
          const es = sig.es === "server" ? "server" : "client";
          const line = `Điểm tiếp xúc: ${tp.name} (kênh ${tp.channel}) · event ${sig.name} · phía ${es} · ${pfLabelsOf(sig.pf)} · trạm ${stationId}`;
          return (
            <Note key={sig.id}>
              <span data-testid={`atlas-where-${sig.id}`}>{line}</span>
            </Note>
          );
        })}
      </div>
      <div className="mt-2">
        <Note tone="warn">
          Đây là mô tả nghiệp vụ, chưa phải vị trí kỹ thuật — tên screen, route/deeplink và id của
          element phát sinh event chưa có trong dữ liệu, đã đưa vào bản yêu cầu dữ liệu (Bảng D).
        </Note>
      </div>
    </div>
  );
}

export function AtlasSignalPanel({ signals, touchpoints, rows, dims, stationId }: AtlasSignalPanelProps) {
  // Rule 2: mở ra đã chọn sẵn signal ĐẦU TIÊN theo thứ tự khai có vol>0; không có thì rỗng.
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const first = signals.find((s) => s.vol > 0);
    return first ? [first.id] : [];
  });
  // Rule 6: mặc định LUÔN 'nav' — hoá locked cũng giữ nguyên, không tự chọn hộ chiều khác.
  const [selectedDimId, setSelectedDimId] = useState<string>("nav");

  function toggleSig(id: string) {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const chart = selectedIds.length > 0 ? signalChart(rows, signals, dims, selectedIds, selectedDimId) : null;
  const curDimState = chart?.dimStates.find((d) => d.id === selectedDimId);

  return (
    <div>
      <div className="t-lbl mt-4 mb-2">Signal đang gắn vào bước này</div>
      <SignalTable signals={signals} selectedIds={selectedIds} onToggle={toggleSig} />

      <div className="mt-4">
        {chart === null ? (
          // Rule 3: không chọn gì → mời chọn, không vẽ chart (không phải "không có gì để xem").
          <Note>Chọn ít nhất một điểm đo ở bảng trên để xem chart.</Note>
        ) : chart.groups.length === 0 ? (
          // Mọi signal đang chọn đều vol=0 (gap/designed) — rule 4: hiện đúng reason, không vẽ cột.
          <div className="space-y-2">
            {chart.notes.map((note) => (
              <Note key={note.sigId}>{note.reason}</Note>
            ))}
          </div>
        ) : (
          <>
            <DimButtons dimStates={chart.dimStates} selectedDimId={selectedDimId} dims={dims} onSelect={setSelectedDimId} />
            <div className="mt-2">
              {curDimState?.state === "locked" ? (
                chart.dimStates.every((d) => d.state === "locked") ? (
                  // Vòng sửa 2 (coordinator đo bằng seed.sigCounts rỗng — Demo Mode tắt, trạng thái
                  // trống TRUNG THỰC ở data/schema/index.ts:52, không phải lỗi): KHÔNG chỉ chiều đang
                  // chọn locked mà CẢ NĂM cùng locked — nguyên nhân KHÁC hẳn ("chiều này không ghi")
                  // là chưa có dòng đếm nào cho lựa chọn điểm đo hiện tại ở BẤT KỲ chiều nào. Không mời
                  // bấm chiều khác (mọi nút đều disabled, lời mời đó không làm được) và không nhắc
                  // "Demo Mode" (component này không biết khái niệm đó tồn tại, chỉ biết rows rỗng).
                  <Note tone="warn">
                    Chưa có dòng đếm nào cho lựa chọn điểm đo hiện tại ở bất kỳ chiều nào, nên chưa vẽ
                    được chart. Bảng đếm đang trống là trạng thái trung thực (chưa nhận được số đếm),
                    không phải lỗi.
                  </Note>
                ) : (
                  // Rule 5 (chỉ chiều ĐANG CHỌN hoá locked, các chiều khác vẫn dùng được): KHÔNG tự
                  // nhảy sang chiều khác trong im lặng — nói rõ bằng chữ, lời mời "chọn chiều khác" ở
                  // đây làm được thật vì có ít nhất một nút không bị khoá.
                  <Note tone="warn">{`Chiều "${curDimState.label}" không ghi được cho lựa chọn điểm đo hiện tại — chọn một chiều khác ở trên để xem chart.`}</Note>
                )
              ) : (
                <SignalColumns groups={toColGroups(chart.groups, selectedDimId)} dimLabel={dims[selectedDimId].label} />
              )}
            </div>
            {chart.notes.length > 0 ? (
              <div className="mt-2 space-y-2">
                {chart.notes.map((note) => (
                  <Note key={note.sigId}>{note.reason}</Note>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      <WherePanel selectedIds={selectedIds} signals={signals} touchpoints={touchpoints} stationId={stationId} />
    </div>
  );
}
