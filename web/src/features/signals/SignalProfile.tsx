import type { CxmData, Signal } from "../../data/schema/index.ts";
import {
  PF_LABEL,
  declaredStateLabel,
  isSignalRunning,
  runningNotTrusted,
  seenAfterAsOf,
  signalAllocationChain,
  signalsWithoutMetric,
  signalsWithoutValues,
} from "../../domain/index.ts";
import { Badge, Card, Note } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { SIGNAL_STATUS } from "../atlas/signalStatus.ts";

/* Hồ sơ MỘT điểm đo — MÀN 2 của output/ascii-man-diem-do.txt (bấm một dòng ở bảng I4a mở ra),
   trả lời BỐN MẶT của QĐ 9 (module-i-signal-registry-charter.md §3, §14 lát I4b). Đây là ĐÍCH
   THẬT của MVP — bốn khối dưới đây ĐÚNG THỨ TỰ owner nêu, không đảo.

   Tiêu đề dùng `signal.desc` (nhãn người đọc) — KHÔNG dùng `signal.name` (tên event) ở chỗ tiêu đề
   thân thiện, khác với ASCII gốc vốn đặt tên event lên breadcrumb (contract lát này ghi đè điểm
   này một cách tường minh). `signal.name` vẫn xuất hiện hợp lệ ở mặt 1 ("Tên event").

   KHÔNG dựng chart giá trị ở đây (I5, ngoài phạm vi lát này) — mặt 4 chỉ liệt kê `values[]` đã
   khai. KHÔNG đọc `Metric.freshness` (D1: chuỗi gõ tay sai số ở 3/6 chỉ số).

   Độ tươi nguồn vẫn chưa hiện, nhưng LÝ DO ĐÃ ĐỔI từ 07/08 (I3): cách chấm đã chốt —
   `sourceHealth(s, cfg, asOf)` theo số ngày thiếu. Cái còn thiếu là **không có trường nào nối
   `Signal` → `Source`**, tức việc dữ liệu (charter §10), không phải việc quyết định. */

const PLACEHOLDER_D = "▨ chờ Bảng D — team data/mobile, chưa có dữ liệu";

function metricNamesOf(data: CxmData, signal: Signal): string {
  return signal.metrics.map((id) => data.metrics.find((m) => m.id === id)?.name ?? id).join(", ");
}

function DRow({ label, testId }: { label: string; testId: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[13px]" data-testid={testId}>
      <span className="t-lbl w-[120px] flex-none">{label}</span>
      <span className="text-ink-3 italic">{PLACEHOLDER_D}</span>
    </div>
  );
}

export function SignalProfile({ data, signal, onBack }: { data: CxmData; signal: Signal; onBack: () => void }) {
  const chain = signalAllocationChain(data, signal);
  const running = isSignalRunning(signal);
  const noMetricCount = signalsWithoutMetric(data).length;
  const noValuesCount = signalsWithoutValues(data).length;
  const es = signal.es === "server" ? "server" : "client";
  const seenLate = seenAfterAsOf(signal.seen, data.asOf);

  return (
    <div data-testid="signal-profile">
      <div className="flex items-center gap-2 mb-1">
        <button
          type="button"
          data-testid="signal-profile-back"
          onClick={onBack}
          className="text-[13px] font-semibold text-primary hover:underline"
        >
          ← Điểm đo
        </button>
        <span className="text-ink-3">/</span>
        <h2 className="text-[15px] font-semibold" data-testid="signal-profile-title">
          {signal.desc}
        </h2>
        {data.asOf ? (
          <span className="ml-auto text-[12px] text-ink-3">Số liệu tính đến {data.asOf}</span>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {/* Mặt 1 — đo như thế nào trên hệ thống */}
        <Card title="Đo như thế nào trên hệ thống">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2 text-[13px]" data-testid="signal-profile-name">
              <span className="t-lbl w-[120px] flex-none">Tên event</span>
              <code className="font-mono text-primary">{signal.name}</code>
            </div>
            <div className="flex flex-col gap-1" data-testid="signal-profile-es">
              <div className="flex items-baseline gap-2 text-[13px]">
                <span className="t-lbl w-[120px] flex-none">Phía</span>
                <span>{es}</span>
              </div>
              {es === "client" ? (
                <Note>
                  Dữ liệu phía client có thể mất — app bị kill, người dùng chặn, hoặc mạng đứt.
                  Đo phía server không có chuyện đó.
                </Note>
              ) : null}
            </div>
            <div className="flex items-baseline gap-2 text-[13px]" data-testid="signal-profile-pf">
              <span className="t-lbl w-[120px] flex-none">Nền tảng</span>
              <span>{signal.pf.map((p) => PF_LABEL[p] ?? p).join(" · ")}</span>
            </div>
            <div className="flex flex-col gap-1" data-testid="signal-profile-station">
              <div className="flex items-baseline gap-2 text-[13px]">
                <span className="t-lbl w-[120px] flex-none">Mã trạm</span>
                <span>
                  {chain.ok ? chain.step.stationId : "không tra được — chuỗi allocate đứt trước bước"}
                </span>
              </div>
              {chain.ok ? <Note>Chưa ai đối chiếu mã trạm này với tracking plan thật.</Note> : null}
            </div>

            <div className="border-t border-line mt-2 pt-2 flex flex-col gap-2" data-testid="signal-profile-bang-d">
              <DRow label="Tên screen" testId="signal-profile-screen" />
              <DRow label="Route/deeplink" testId="signal-profile-route" />
              <DRow label="ID element" testId="signal-profile-element" />
              <Note>
                ▨ = ô trống thật, chưa có dữ liệu — KHÔNG lấp bằng mô tả nghiệp vụ. Đã đưa vào bản
                yêu cầu dữ liệu gửi team data/mobile (Bảng D).
              </Note>
            </div>
          </div>
        </Card>

        {/* Mặt 2 — được allocate thế nào */}
        <Card title="Được allocate thế nào">
          <div className="flex flex-col gap-2">
            {chain.ok ? (
              <div className="text-[13px] space-y-1" data-testid="signal-profile-chain">
                <div>
                  Điểm chạm: <b>{chain.touchpoint.name}</b> (kênh {chain.touchpoint.channel})
                </div>
                <div className="ml-3">
                  ↳ Bước: {chain.step.code} · {chain.step.name}
                </div>
                <div className="ml-6">↳ Hành trình: {chain.flow.name}</div>
                <div className="ml-9">
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
                  <b>{chain.flow.owner}</b>{" "}
                  <span className="t-meta">(suy từ hành trình — điểm đo không khai owner riêng)</span>
                </>
              ) : (
                "không suy được — chuỗi allocate đứt phía trên"
              )}
            </div>

            <div data-testid="signal-profile-metrics">
              {signal.metrics.length === 0 ? (
                <Note tone="warn">
                  {`Chưa nuôi chỉ số nào. ${noMetricCount}/${data.signals.length} điểm đo đang ở tình trạng này — hoặc gắn vào một chỉ số, hoặc nói rõ vì sao đo.`}
                </Note>
              ) : (
                <div className="text-[13px]">Nuôi chỉ số: {metricNamesOf(data, signal)}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Mặt 3 — xử lý thế nào */}
        <Card title="Xử lý thế nào">
          <div className="flex flex-col gap-2">
            <div className="text-[13px]" data-testid="signal-profile-running">
              <Badge state={running ? "ok" : "unknown"} text={running ? "ĐANG CHẠY" : "CHƯA CHẠY"} />{" "}
              <span className="t-meta">(suy từ lưu lượng)</span> ·{" "}
              <Badge state={SIGNAL_STATUS[signal.st].badge} text={declaredStateLabel(signal)} />{" "}
              <span className="t-meta">(người khai)</span>
              <div className="mt-1 t-meta">
                Hai trục RỜI, không gộp: có chạy ≠ có tin dùng.
              </div>
            </div>
            {runningNotTrusted(signal) ? (
              <div data-testid="signal-profile-running-not-trusted">
                <Note tone="warn">
                  Điểm đo này đang chở lưu lượng thật mà chưa được đánh dấu tin dùng — số của nó
                  chưa ai duyệt cho vào chỉ số. Tình trạng này phải thấy được, không phải lỗi.
                </Note>
              </div>
            ) : null}

            <div className="text-[13px]" data-testid="signal-profile-vol">
              Lưu lượng: <b className="tabular-nums">{signal.vol ? `${nf(signal.vol)}/ngày` : "—"}</b>
              <div className="t-meta">
                Số của MỘT NGÀY (mốc {data.asOf || "chưa có"}) — KHÔNG phải mức ổn định.
              </div>
            </div>

            <div className="text-[13px]" data-testid="signal-profile-seen">
              Thấy lần cuối:{" "}
              <b>{signal.seen ?? <span className="text-ink-3">chưa từng</span>}</b>
              <div className="t-meta">
                Mốc do người khai — KHÔNG tính được im lặng bao lâu từ đó.
              </div>
              {seenLate ? (
                <div data-testid="signal-profile-seen-late">
                  <Note tone="warn">
                    {`Mốc "${signal.seen}" muộn hơn mốc số liệu (${data.asOf}) — tức nằm ngoài cửa sổ dữ liệu hiện có.`}
                  </Note>
                </div>
              ) : null}
            </div>

            <div className="text-[13px]" data-testid="signal-profile-source">
              Nguồn chở nó: chưa nối được vào nguồn nào trong danh sách hiện tại (danh sách nguồn
              còn là bản tạm).
            </div>

            <div data-testid="signal-profile-freshness-hold">
              <Note>
                Độ tươi của nguồn chở điểm đo này chưa hiện được — chưa có trường nào nối điểm đo
                với nguồn. Cách chấm độ tươi thì đã có.
              </Note>
            </div>
          </div>
        </Card>

        {/* Mặt 4 — các giá trị nó phát ra (KHÔNG chart, đó là I5) */}
        <Card title="Các giá trị nó phát ra">
          <div className="flex flex-col gap-2">
            {signal.values.length === 0 ? (
              <div data-testid="signal-profile-values-empty">
                <Note>
                  {`Điểm đo này chưa chạy nên chưa có giá trị nào đã khai. ${noValuesCount}/${data.signals.length} điểm đo đang ở tình trạng này.`}
                </Note>
              </div>
            ) : (
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
            )}
            <Note tone="warn">
              Chưa kiểm được giá trị lạ: bảng đếm (sigCounts) hiện sinh từ chính bản khai này, nên
              "0 giá trị ngoài khai báo" là hệ quả của cách sinh số, KHÔNG phải bằng chứng dữ liệu
              sạch.
            </Note>
          </div>
        </Card>
      </div>
    </div>
  );
}
