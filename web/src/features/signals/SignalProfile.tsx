import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Cfg, CxmData, Dim, Signal } from "../../data/schema/index.ts";
import {
  PF_LABEL,
  declaredStateLabel,
  isSignalRunning,
  runningNotTrusted,
  seenAfterAsOf,
  signalAllocationChain,
  signalFeedHealth,
  signalsWithoutMetric,
  signalsWithoutValues,
} from "../../domain/index.ts";
import type { DimState, SigCol, SigGroup, SigSlice, SignalFeedHealth } from "../../domain/index.ts";
import { Badge, Card, Note, SignalColumns } from "../../design-system/index.ts";
import { SigTrendChart } from "../../design-system/SigTrendChart.tsx";
import { sigTrendChart } from "../../domain/sigTrendChart.ts";
import { sigCut } from "../../domain/sigCut.ts";
import { isoFromVn, vnFromIso } from "../../data/projectSigTrend.ts";
import { useTimeframeStore } from "../../store/timeframe.ts";
import type { BadgeState, SigColBar, SigColGroup, SigColSlice } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { SIGNAL_STATUS } from "../atlas/signalStatus.ts";

/* Hồ sơ MỘT điểm đo — MÀN 2 của output/ascii-man-diem-do.txt (bấm một dòng ở bảng I4a mở ra),
   trả lời BỐN MẶT của QĐ 9 (module-i-signal-registry-charter.md §3, §14 lát I4b). Đây là ĐÍCH
   THẬT của MVP — bốn khối dưới đây ĐÚNG THỨ TỰ owner nêu, không đảo.

   Tiêu đề dùng `signal.desc` (nhãn người đọc) — KHÔNG dùng `signal.name` (tên event) ở chỗ tiêu đề
   thân thiện, khác với ASCII gốc vốn đặt tên event lên breadcrumb (contract lát này ghi đè điểm
   này một cách tường minh). `signal.name` vẫn xuất hiện hợp lệ ở mặt 1 ("Tên event").

   Mặt 4 dựng chart phân bố giá trị từ 07/08 (I5) — DÙNG LẠI NGUYÊN `domain/signalChart.ts` +
   `design-system/SignalColumns`, cùng đường gọi với `features/atlas/AtlasSignalPanel.tsx`
   (`toColGroups`/`ValueDimButtons` dưới đây là bản COPY cục bộ của các hàm module-local cùng tên ở
   đó — không export/sửa file kia, tránh phụ thuộc chéo giữa hai feature). KHÔNG đọc
   `Metric.freshness` (D1: chuỗi gõ tay sai số ở 3/6 chỉ số).

   Độ tươi nguồn ĐÃ HIỆN từ 12/08 chiều (owner chốt lối (i) của handoff §10c): `Signal.srcId` nối
   điểm đo vào nguồn giao nó, và mặt 1 hiện tên nguồn + nhãn độ tươi lấy nguyên `signalFeedHealth`
   (bậc thang `sourceHealth` cũ, không dựng cái thứ hai). Điểm đo chưa nối nguồn hiện "chưa nối
   nguồn" — KHÔNG rơi về "đang nhận". Mốc máy sinh cho RIÊNG từng điểm đo (`lastRecordAt`, charter
   §10) vẫn là việc của đội dữ liệu và không bị field này thay thế.

   12/08 (owner) — TÊN BỐN KHỐI THEO QUY ƯỚC CỤM DANH TỪ, không còn dạng câu hỏi/mệnh đề: "Đo như
   thế nào trên hệ thống" → "Cách đo trên hệ thống", "Được allocate thế nào" → "Cách allocate",
   "Xử lý thế nào" → "Cách xử lý", "Các giá trị nó phát ra" → "Giá trị phát ra". BỐN MẶT và THỨ TỰ
   của QĐ 9 không đổi — chỉ đổi tên gọi. */

const PLACEHOLDER_D = "▨ chờ Bảng D — team data/mobile, chưa có dữ liệu";

/* Nhãn + tông của độ tươi nguồn giao. Bốn nhãn đầu CHÉP NGUYÊN VĂN từ SourcesPage.tsx — cùng một
   tình trạng của cùng một nguồn thì hai màn không được nói hai kiểu. Nhánh "unknown" là của riêng
   điểm đo (chưa nối nguồn ⇒ không có gì để chấm), và nó KHÔNG được mượn nhãn "Im lặng, chưa phân
   định": im lặng là nguồn có mà không giao, còn đây là chưa biết nguồn nào. */
const FEED_LABEL: Record<SignalFeedHealth, string> = {
  ok: "Đang nhận",
  stale: "Thiếu ngày dữ liệu",
  down: "Ngừng gửi",
  silent: "Im lặng, chưa phân định",
  unknown: "Chưa nối nguồn",
};
const FEED_BADGE: Record<SignalFeedHealth, BadgeState> = {
  ok: "ok",
  stale: "watch",
  down: "crit",
  silent: "unknown",
  unknown: "unknown",
};

function metricNamesOf(data: CxmData, signal: Signal): string {
  return signal.metrics.map((id) => data.metrics.find((m) => m.id === id)?.name ?? id).join(", ");
}

/* Nhãn ĐỨNG TRÊN giá trị, không đứng cạnh trong một cột 120px cố định (bản trước): mặt 1 và mặt 2
   nay ở cột rail hẹp, mà giá trị ở đây là chuỗi dài (câu chờ Bảng D, mã trạm, danh sách nền tảng) —
   cột nhãn cố định ăn mất một phần ba bề ngang rồi ép mọi giá trị xuống ba dòng chữ. Xếp dọc thì
   nhãn ngắn không tranh chỗ với giá trị dài, và bảy hàng của mặt 1 đọc thành một danh sách thuộc
   tính chứ không phải một bảng hai cột lệch. */
function Field({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 text-[13px]" data-testid={testId}>
      <span className="t-lbl">{label}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function DRow({ label, testId }: { label: string; testId: string }) {
  return (
    <Field label={label} testId={testId}>
      <span className="text-ink-3 italic">{PLACEHOLDER_D}</span>
    </Field>
  );
}

/* ---- Chart phân bố giá trị (F5, I5) — bản COPY cục bộ của các adapter module-local ở
   features/atlas/AtlasSignalPanel.tsx:44-63,132-171 (không export file kia, xem docblock đầu file). */

function toColSlice(s: SigSlice, dimId: string): SigColSlice {
  // Rule 7 (signalChart.ts): label giữ VERBATIM `band`, TRỪ chiều sigpf — hiện tên đẹp qua PF_LABEL.
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

function ValueDimButtons({
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
            data-testid={`signal-profile-dim-${ds.id}`}
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

/** Chart phân bố giá trị của MỘT signal — chỉ gọi khi `signal.values.length > 0` (refusal #1 xử lý
    ở caller). Refusal #2 (F5): KHÔNG có dòng `sigCounts` nào của CHÍNH signal này (ở bất kỳ chiều
    nào) ⇒ từ chối vẽ kèm lý do RIÊNG, khác hẳn lý do #1 ("chưa chạy nên chưa có giá trị nào"). Kiểm
    tra bằng `sigCounts.some(...)` TRƯỚC khi gọi `signalChart` — không suy từ `dimStates.every(locked)`
    vì `expected===0` (vol=0) trả `dimStates: []`, và `[].every(...)` đúng TRUE một cách vô nghĩa
    (bẫy chực chờ nếu đảo thứ tự hai kiểm tra). */
function SignalValueChart({ data, signal, dims }: { data: CxmData; signal: Signal; dims: Record<string, Dim> }) {
  // Rule 6 (AtlasSignalPanel.tsx:229): mặc định LUÔN 'nav', không tự chọn hộ chiều khác.
  const [dimId, setDimId] = useState("nav");
  /* Kỳ đang soi ở lát cắt — `null` = cả cửa sổ. Là state của MÀN, cùng khuôn `selectedSigId`: một
     lựa chọn để xem, không phải một cấu hình để lưu. */
  const [bucket, setBucket] = useState<string | null>(null);
  const range = useTimeframeStore((s) => s.range);
  const asOfIso = isoFromVn(data.asOf);

  /* Cả ba phép dưới đây quét TOÀN BỘ `sigFires` (demoData ~40k dòng), nên chúng phải nhớ theo đầu
     vào chứ không chạy lại mỗi lần vẽ: bấm một kỳ chỉ đổi `bucket`, mà không có `useMemo` thì cú
     bấm đó tính lại cả đường thời gian vốn không đổi. Cùng lỗi đã sửa một lần ở `measureHv`. */
  const hasRows = useMemo(
    () => data.sigCounts.some((r) => r.sig === signal.id) || data.sigFires.some((f) => f.sigId === signal.id),
    [data.sigCounts, data.sigFires, signal.id],
  );

  /* TẦNG TRÊN — đường theo thời gian (ADR-001 §2). Đứng trước lát cắt vì nó trả lời câu "xấu đi từ
     bao giờ", còn lát cắt trả lời "kỳ đó là nhóm khách nào" — thứ tự đọc đi từ câu thứ nhất sang
     câu thứ hai, và bấm một kỳ trên đường chính là chỗ chuyển giữa hai câu. */
  const trend = useMemo(
    () => (asOfIso === null || !hasRows ? null : sigTrendChart(data.sigFires, signal, asOfIso, range)),
    [data.sigFires, signal, asOfIso, range, hasRows],
  );
  const picked = trend?.kind === "draw" ? trend.buckets.find((b) => b.key === bucket) : undefined;

  /* Lát cắt đi qua `sigCut` — MỘT cửa dùng chung với `#/quantify` (ADR-003), không gọi thẳng
     `signalChart` nữa. Có kỳ đang chọn thì truyền cửa sổ của đúng kỳ đó xuống phép cộng ở `data/`;
     cắt ở tầng vẽ sẽ cho một mẫu số sai mà không ai thấy. */
  const winFrom = picked?.from ?? null;
  const winTo = picked?.to ?? null;
  const cut = useMemo(
    () =>
      hasRows
        ? sigCut(data, dims, [signal.id], dimId, winFrom !== null && winTo !== null ? { from: winFrom, to: winTo } : undefined)
        : null,
    [data, dims, signal.id, dimId, winFrom, winTo, hasRows],
  );

  if (!hasRows || cut === null) {
    return (
      <div data-testid="signal-profile-values-no-counts">
        {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
        <Note tone="warn">Điểm đo này đã khai giá trị nhưng chưa có dòng đếm nào trong bảng đếm.</Note>
      </div>
    );
  }

  if (cut.kind === "refuse") {
    return (
      <div data-testid="signal-profile-cut-refuse">
        <Note tone="warn">{cut.reason}</Note>
      </div>
    );
  }
  const chart = cut.chart;
  // Phòng thủ giống AtlasSignalPanel.tsx: signal có giá trị + có dòng đếm ở dimId khác nhưng
  // vol=0 (chưa gặp trên seed/demoData hôm nay, nhưng hàm domain không giả định điều đó).
  if (chart.groups.length === 0) {
    return (
      <div className="space-y-2" data-testid="signal-profile-values-vol-zero">
        {chart.notes.map((note) => (
          <Note key={note.sigId}>{note.reason}</Note>
        ))}
      </div>
    );
  }

  const curDimState = chart.dimStates.find((d) => d.id === dimId);

  return (
    <div data-testid="signal-profile-value-chart">
      {trend === null ? null : trend.kind === "refuse" ? (
        <div className="mb-3" data-testid="sigtrend-refuse">
          <Note tone="warn">{trend.reason}</Note>
        </div>
      ) : (
        <div className="mb-4">
          {/* Điểm đo cắm giữa cửa sổ ⇒ phần trước mốc cắm để TRỐNG, và màn TỰ KHAI vì sao trống
              (§11). Không có câu này thì khoảng trống đọc thành "chart hỏng". */}
          {trend.startsMidWindow ? (
            <div className="mb-2" data-testid="sigtrend-mid-window">
              {/* Chỉ nêu MỐC, không diễn giải hộ khoảng trống (owner 14/08: chỉ vẽ và show data).
                  Vẫn phải có: không có mốc cắm thì khoảng trống đầu trục không tra được về đâu. */}
              <Note>{`Mốc cắm đo: ${vnFromIso(trend.instAt)}`}</Note>
            </div>
          ) : null}
          {/* MỘT chart cho mọi điểm đo, bao nhiêu giá trị cũng lồng chung vào đây (owner 14/08).
              Không còn nhánh lưới đường nhỏ. */}
          <SigTrendChart chart={trend} activeBucket={bucket ?? undefined} onPickBucket={(k) => setBucket(k === bucket ? null : k)} />
          {/* Mẫu số phải viết đủ vào nhãn trục (§4) — "tỉ lệ" mà không nói tỉ lệ trên cái gì là chỗ
              người đọc tự điền một mẫu số họ đoán. */}
          <div className="t-meta text-[11.5px] mt-1" data-testid="sigtrend-unit">
            {trend.unit === "ratio"
              ? "Đường: tỉ lệ trên tổng lượt bắn của chính điểm đo trong kỳ. Dải dưới: số lượt bắn của kỳ."
              : "Đường: số lượt bắn trong kỳ. Dải dưới: cùng số đó."}
            {trend.undeclared.length > 0 ? ` · ${trend.undeclared.join(", ")} chưa có trong bản khai.` : ""}
          </div>
        </div>
      )}

      <ValueDimButtons dimStates={chart.dimStates} selectedDimId={dimId} dims={dims} onSelect={setDimId} />
      {picked ? (
        <div className="mt-2" data-testid="sigtrend-scoped">
          {/* §8: lượt bắn được cắt đúng theo kỳ, nhưng NHÓM của khách vẫn là nhóm HÔM NAY — không có
              bảng ảnh chụp thuộc tính khách theo thời gian. Cửa sổ càng lùi xa thì sai lệch đó càng
              lớn, và chính cửa sổ mới làm nó lộ ra, nên nói ra ở đúng chỗ đang cắt. */}
          <Note>{`Lát cắt đang đọc kỳ ${picked.label} — lượt bắn theo kỳ, nhóm khách tính theo hôm nay. Bấm lại kỳ đó để xem cả cửa sổ.`}</Note>
        </div>
      ) : null}
      <div className="mt-2">
        {curDimState?.state === "locked" ? (
          // luật 11/08: bỏ lời mời "chọn một chiều khác ở trên để xem chart"
          <Note tone="warn">{`Chiều "${curDimState.label}" không ghi được cho điểm đo này.`}</Note>
        ) : (
          <SignalColumns groups={toColGroups(chart.groups, dimId)} dimLabel={dims[dimId].label} />
        )}
      </div>
    </div>
  );
}

/** Đi tới/lui trong hồ sơ theo ĐÚNG thứ tự đang thấy trên bảng (caller quyết định thứ tự đó).
    Không có `nav` (test dựng hồ sơ độc lập) thì chỉ còn nút quay lại — hồ sơ không tự biết bảng. */
export type SignalProfileNav = {
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
};

export function SignalProfile({
  data,
  signal,
  onBack,
  dims,
  cfg,
  nav,
}: {
  data: CxmData;
  signal: Signal;
  onBack: () => void;
  dims: Record<string, Dim>;
  /** Ngưỡng đang đặt — chỉ dùng để chấm độ tươi nguồn giao, cùng đường với màn Nguồn dữ liệu. */
  cfg: Cfg;
  nav?: SignalProfileNav;
}) {
  const chain = signalAllocationChain(data, signal);
  const running = isSignalRunning(signal);
  const noMetricCount = signalsWithoutMetric(data).length;
  const noValuesCount = signalsWithoutValues(data).length;
  const es = signal.es === "server" ? "server" : "client";
  const seenLate = seenAfterAsOf(signal.seen, data.asOf);
  const feedSource = data.sources.find((s) => s.id === signal.srcId);
  const feedHealth = signalFeedHealth(signal, data.sources, cfg, data.asOf);

  return (
    <div data-testid="signal-profile">
      {/* Thanh đầu hồ sơ DÍNH mép trên khi cuộn: bốn mặt dài hơn một màn, mà đường về bảng và nút
          sang điểm đo kế tiếp là hai thao tác hay dùng nhất ở đây — trôi mất chúng là phải cuộn
          ngược lên mỗi lần. `-mx-8 px-8` để dải nền phủ hết bề ngang khung `p-8` của màn, không để
          lộ chữ chạy phía sau hai mép. KHÔNG kéo `-mt-8`: tiêu đề màn và mốc số liệu vẫn đứng phía
          trên hồ sơ, kéo lên là đè lên chúng. */}
      <div className="sticky top-0 z-20 -mx-8 px-8 py-2 mb-2 bg-bg border-b border-line">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="signal-profile-back"
            onClick={onBack}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] font-semibold text-primary hover:border-primary-line hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            ← Điểm đo
          </button>
          <h2 className="text-[15px] font-semibold truncate" data-testid="signal-profile-title">
            {signal.desc}
          </h2>

          <div className="ml-auto flex items-center gap-2">
            {data.asOf ? <span className="text-[12px] text-ink-3">Số liệu tính đến {data.asOf}</span> : null}
            {nav ? (
              <div className="flex items-center gap-1.5" data-testid="signal-profile-nav">
                <span className="text-[12px] text-ink-3 tabular-nums">
                  {nav.index + 1} / {nav.total}
                </span>
                <button
                  type="button"
                  data-testid="signal-profile-prev"
                  onClick={nav.onPrev}
                  disabled={!nav.onPrev}
                  aria-label="Điểm đo phía trên"
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px] text-ink-2 hover:border-primary-line hover:text-ink disabled:opacity-40 disabled:hover:border-line disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  ↑
                </button>
                <button
                  type="button"
                  data-testid="signal-profile-next"
                  onClick={nav.onNext}
                  disabled={!nav.onNext}
                  aria-label="Điểm đo phía dưới"
                  className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px] text-ink-2 hover:border-primary-line hover:text-ink disabled:opacity-40 disabled:hover:border-line disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  ↓
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* HAI CỘT, không phải bốn khối xếp dọc/hai-hai như bản trước.
          · Rail trái (mặt 1 + mặt 2) là BẢN KHAI TĨNH của điểm đo: tên event, phía, nền tảng, mã
            trạm, chuỗi allocate. Toàn thuộc tính ngắn, đọc một lần rồi để đó — đúng thứ chịu được
            cột hẹp.
          · Cột phải (mặt 3 + mặt 4) là HÀNH VI THẬT: trạng thái, lưu lượng, cảnh báo, và chart phân
            bố giá trị. Đây là thứ người dùng mở hồ sơ để xem, nên nó lấy phần rộng và bắt đầu ngay
            cạnh mép trên, thay vì nằm sau hai card thuộc tính như trước.
          Thứ tự đọc vẫn 1→2 (dọc cột trái) rồi 3→4 (dọc cột phải) — đúng thứ tự owner nêu, không
          đảo. Rail 340px vì chart của mặt 4 rộng ~510px: chia đôi màn thì chart phải cuộn ngang
          ngay ở bề rộng 1280px tối thiểu của app. */}
      <div className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-4">
        <div className="flex flex-col gap-4">
          {/* Mặt 1 — đo như thế nào trên hệ thống */}
          <Card title="Cách đo trên hệ thống">
          <div className="flex flex-col gap-2.5">
            <Field label="Tên event" testId="signal-profile-name">
              <code className="font-mono text-primary">{signal.name}</code>
            </Field>
            <Field label="Phía" testId="signal-profile-es">
              {es}
            </Field>
            <Field label="Nền tảng" testId="signal-profile-pf">
              {signal.pf.map((p) => PF_LABEL[p] ?? p).join(" · ")}
            </Field>
            <Field label="Mã trạm" testId="signal-profile-station">
              {chain.ok ? chain.step.stationId : "không tra được — chuỗi allocate đứt trước bước"}
              {/* luật 11/08 (bổ sung): bỏ "Chưa ai đối chiếu mã trạm này với tracking plan thật." */}
            </Field>
            {/* 12/08 chiều (owner, §10c lối (i)): nguồn GIAO bản ghi của điểm đo. Đứng ở mặt 1 vì
                đây là thuộc tính "đo thế nào trên hệ thống", không phải một con số đo được. Trạng
                thái lấy nguyên `signalFeedHealth` — cùng bậc thang và cùng câu chữ với màn Nguồn dữ
                liệu, không dựng nhãn thứ hai cho cùng một tình trạng. */}
            <Field label="Nguồn giao" testId="signal-profile-src">
              {feedSource ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  {feedSource.name}
                  <Badge state={FEED_BADGE[feedHealth]} text={FEED_LABEL[feedHealth]} />
                </span>
              ) : (
                <span className="text-ink-3">chưa nối nguồn</span>
              )}
            </Field>

            <div className="border-t border-line mt-1 pt-2.5 flex flex-col gap-2.5" data-testid="signal-profile-bang-d">
              <DRow label="Tên screen" testId="signal-profile-screen" />
              <DRow label="Route/deeplink" testId="signal-profile-route" />
              <DRow label="ID element" testId="signal-profile-element" />
              {/* luật 11/08: bỏ giải thích ô đã hiện placeholder ▨ */}
            </div>
          </div>
        </Card>

          {/* Mặt 2 — được allocate thế nào */}
          <Card title="Cách allocate">
          <div className="flex flex-col gap-3">
            {chain.ok ? (
              /* Bậc thụt vào NHỎ LẠI (2/4/6 thay vì 3/6/9) và mỗi bậc là một dòng riêng: ở cột
                 340px, bậc cũ ăn 36px cho dòng cuối rồi đẩy tên nhóm/phase xuống ba dòng chữ. */
              <div className="flex flex-col gap-1 text-[13px]" data-testid="signal-profile-chain">
                <div>
                  Điểm chạm: <b>{chain.touchpoint.name}</b> (kênh {chain.touchpoint.channel})
                </div>
                <div className="ml-2">
                  ↳ Bước: {chain.step.code} · {chain.step.name}
                </div>
                <div className="ml-4">↳ Hành trình: {chain.flow.name}</div>
                <div className="ml-6">
                  ↳ Nhóm: {chain.group.name} · Phase: {chain.phase.name}
                </div>
              </div>
            ) : (
              <div data-testid="signal-profile-chain">
                <Note tone="crit">
                  {`Chuỗi allocate đứt ở "${chain.brokenAt}" — không tìm được bản ghi tương ứng để đi tiếp.`}
                </Note>
              </div>
            )}

            <div className="text-[13px]" data-testid="signal-profile-owner">
              Ai chịu trách nhiệm:{" "}
              {chain.ok ? (
                <>
                  {/* luật 11/08 (bổ sung): bỏ "(suy từ hành trình — điểm đo không khai owner riêng)" */}
                  <b>{chain.flow.owner}</b>
                </>
              ) : (
                "không suy được — chuỗi allocate đứt phía trên"
              )}
            </div>

            <div data-testid="signal-profile-metrics">
              {signal.metrics.length === 0 ? (
                <Note tone="warn">
                  {/* luật 11/08: bỏ "hoặc gắn vào một chỉ số, hoặc nói rõ vì sao đo" */}
                  {`Chưa nuôi chỉ số nào. ${noMetricCount}/${data.signals.length} điểm đo đang ở tình trạng này.`}
                </Note>
              ) : (
                <div className="text-[13px]">Nuôi chỉ số: {metricNamesOf(data, signal)}</div>
              )}
            </div>
          </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
        {/* Mặt 3 — xử lý thế nào */}
        <Card title="Cách xử lý">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]" data-testid="signal-profile-running">
              <Badge state={running ? "ok" : "unknown"} text={running ? "ĐANG CHẠY" : "CHƯA CHẠY"} />{" "}
              <span className="t-meta">(suy từ lưu lượng)</span> ·{" "}
              <Badge state={SIGNAL_STATUS[signal.st].badge} text={declaredStateLabel(signal)} />{" "}
              <span className="t-meta">(người khai)</span>
            </div>
            {runningNotTrusted(signal) ? (
              <div data-testid="signal-profile-running-not-trusted">
                {/* luật 11/08: bỏ luận giải, chỉ giữ báo lệch hướng */}
                <Note tone="warn">Đang chở lưu lượng thật mà chưa được đánh dấu tin dùng.</Note>
              </div>
            ) : null}

            {/* Lưu lượng và Mốc thấy cuối đứng CẠNH NHAU: hai con số của cùng một câu hỏi "nó còn
                sống không", và cột phải đủ rộng để không phải xếp dọc. */}
            <div className="grid grid-cols-2 items-start gap-x-4 gap-y-2 border-y border-line-soft py-2.5">
            <div className="text-[13px]" data-testid="signal-profile-vol">
              Lưu lượng: <b className="tabular-nums">{signal.vol ? `${nf(signal.vol)}/ngày` : "—"}</b>
            </div>

            <div className="text-[13px]" data-testid="signal-profile-seen">
              Mốc thấy cuối (người khai):{" "}
              <b>{signal.seen ?? <span className="text-ink-3">chưa từng</span>}</b>
              {seenLate ? (
                <div data-testid="signal-profile-seen-late">
                  <Note tone="warn">
                    {/* luật 12/08: bỏ đuôi "— tức nằm ngoài cửa sổ dữ liệu hiện có", nó diễn giải
                        lại đúng vế trước bằng chữ khác. Vế trước đã là hai mốc so nhau. */}
                    {`Mốc "${signal.seen}" muộn hơn mốc số liệu (${data.asOf}).`}
                  </Note>
                </div>
              ) : null}
            </div>
            </div>

            <div className="text-[13px]" data-testid="signal-profile-source">
              {/* luật 11/08 (bổ sung): bỏ "(danh sách nguồn còn là bản tạm)" */}
              Nguồn chở nó: chưa nối được vào nguồn nào trong danh sách hiện tại.
            </div>

            <div data-testid="signal-profile-freshness-hold">
              {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
              <Note>Chưa có trường nào nối điểm đo với nguồn.</Note>
            </div>
          </div>
        </Card>

        {/* Mặt 4 — các giá trị nó phát ra, kèm chart phân bố (F5, I5) */}
        <Card title="Giá trị phát ra">
          <div className="flex flex-col gap-2">
            {signal.values.length === 0 ? (
              <div data-testid="signal-profile-values-empty">
                <Note>
                  {`Điểm đo này chưa chạy nên chưa có giá trị nào đã khai. ${noValuesCount}/${data.signals.length} điểm đo đang ở tình trạng này.`}
                </Note>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5" data-testid="signal-profile-values">
                  {signal.values.map((v) => (
                    <code
                      key={v}
                      className="px-1.5 py-0.5 rounded-[6px] text-[12px] bg-surface-2 border border-line font-mono"
                    >
                      {v}
                    </code>
                  ))}
                </div>
                <SignalValueChart data={data} signal={signal} dims={dims} />
              </>
            )}
            {/* luật 11/08: bỏ luận giải */}
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}
