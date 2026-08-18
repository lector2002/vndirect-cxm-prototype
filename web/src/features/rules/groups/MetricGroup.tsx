import { Badge, Card, Note } from "../../../design-system/index.ts";
import { metricState } from "../../../domain/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 2 — "Chỉ số theo dõi" (`cfg.metric[id]`, một bảng). Port tinh thần `g === 'metric'` của
   prototype (dòng 4182-4206), không port HTML thô.

   BAND RIÊNG TỪNG CHỈ SỐ, KHÔNG NGƯỠNG CHUNG: cột "Ngưỡng theo dõi"/"Ngưỡng xử lý" (12/08 đổi tên
   theo quy ước cụm danh từ ở `../RuleLayout.tsx`, trước là "Cần theo dõi khi"/"Cần xử lý khi") đọc
   `cfg.metric[m.id]`, mỗi chỉ số một cặp watch/crit của riêng nó — không có một % lệch mục tiêu
   chung nào áp được cho cả sáu chỉ số hôm nay.

   KHỐI GIẢI THÍCH CUỐI NHÓM ĐÃ BỎ (luật thiết kế 11/08, docs/DB-FIRST-HANDOFF.md §"Bỏ câu giải
   thích dưới title"): nó dạy cách đọc dấu ≥/≤ và so hai chỉ số làm ví dụ — thứ người dùng học một
   lần là xong. Lý lẽ "vì sao không có ngưỡng chung" giữ lại ở chính đoạn trên, trong tài liệu.

   HƯỚNG SO SÁNH ("vượt"/"dưới") lấy từ `metricDirection()` (`data/metric-direction.ts`) — MỘT
   nguồn sự thật duy nhất, dùng chung với `domain/state.ts` và `data/mock-repository.ts`. Không viết
   lại luật hướng ở đây (charter cấm). */

/** Style tiêu đề cột dùng chung — tránh chép cùng một chuỗi class 7 lần (khuôn SourcesPage.tsx). */
const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function MetricGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  const watched = data.metrics.filter((m) => cfg.metric[m.id]?.on).length;

  const setMetric = (id: string, patch: Partial<{ on: boolean; watch: number; crit: number }>) => {
    const c = cfg.metric[id];
    write({ metric: { ...cfg.metric, [id]: { ...c, ...patch } } });
  };


  /* luật 12/08: cắt đuôi "— bảng dưới vẫn hiện đủ cả N" của denomStrip. Vế đó tả HÀNH VI của màn,
     không tả dữ liệu; số bên trái đã là dữ liệu đủ. */
  return (
    <Card
      title="Tracked metrics"
      denomStrip={`${watched} of ${data.metrics.length} metrics being watched`}
    >
      {/* luật 11/08: bỏ nửa còn lại của đoạn giải thích band riêng từng chỉ số */}

      {error ? (
        <div className="mb-3" data-testid="metric-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      {/* Bảng có SÀN BỀ RỘNG rồi mới cho cuộn ngang. Không có `min-w` thì `w-full` ép bảy cột vào
          ~700px của cột phải, và cột tên chỉ số — cột duy nhất co được — tụt xuống mỗi dòng một
          chữ. Đã thấy bằng mắt: một dòng chỉ số cao gần 200px. Cuộn ngang là cái giá đúng ở đây,
          vì mỗi cột đều mang một thứ không bỏ được. */}
      <div className="overflow-x-auto">
        <table
          className="w-full min-w-[880px] border-collapse text-[12.5px]"
          data-testid="metric-table"
        >
          <thead>
            <tr className="border-b border-line">
              <th className={TH}>Metric</th>
              <th className={TH}>Watch</th>
              <th className={TH}>Value</th>
              <th className={TH}>Target</th>
              <th className={TH}>Watch threshold</th>
              <th className={TH}>Critical threshold</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m) => {
              const c = cfg.metric[m.id];
              const dir = metricDirection(m);
              const dirWord = dir === "down" ? "vượt" : "dưới";
              const on = c?.on ?? false;
              return (
                <tr key={m.id} data-testid={`metric-row-${m.id}`} className="border-t border-line">
                  <td className="py-1.5 px-1 max-w-[26ch]">
                    <b className="text-[13.5px] block">{m.name}</b>
                    <div className="t-meta text-[11.5px] mt-0.5">{m.grain}</div>
                    <div className="t-meta text-[11.5px] mt-0.5">
                      {m.source} · {m.owner}
                    </div>
                    {/* KHÔNG in độ tươi ở đây. Hai vòng, hai lý do khác nhau, ghi cả hai để không ai
                        khôi phục nửa vời:
                        · `m.freshness` (chuỗi gõ tay) bỏ ngày 07/08 vì SAI — lệch số ở 3/6 chỉ số,
                          đúng số mà giấu trạng thái ở 1/6 (D1, module-i §5).
                        · Chuỗi SINH RA thay nó bỏ ngày 11/08 vì LUẬN GIẢI — "trễ 4 giờ kể từ lần giao
                          cuối · đã giao đủ đến 27/07/2026 · đang nhận" là ba đoạn nói quanh một việc,
                          đúng diện luật thiết kế 11/08 (docs/DB-FIRST-HANDOFF.md).
                        Bảng này giờ KHÔNG khai gì về độ tươi — thà không nói còn hơn nói dài hoặc nói
                        sai. Độ tươi thật của từng nguồn ở `#/sources`. `metricFreshnessText()` ĐÃ XOÁ
                        khỏi domain cùng ngày 11/08 (sources.ts) — không còn hàm nào chờ chỗ hiện, và
                        C6 đóng 12/08 vì lý do đó. */}
                  </td>
                  <td className="py-1.5 px-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        aria-label={`Watch ${m.name}`}
                        checked={on}
                        onChange={(e) => setMetric(m.id, { on: e.target.checked })}
                      />
                    </label>
                  </td>
                  <td className="py-1.5 px-1">
                    <b className="font-mono text-[15px]">{m.value}</b>
                  </td>
                  <td className="py-1.5 px-1 t-meta">{m.target}</td>
                  <td className="py-1.5 px-1 w-[150px]">
                    {on && c ? (
                      <>
                        <div className="t-meta text-[12px] mb-1">{dirWord}</div>
                        <NumField
                          value={c.watch}
                          onCommit={(v) => setMetric(m.id, { watch: v })}
                          suffix={m.unit === "%" ? "%" : undefined}
                          tone="watch"
                          label={`Watch threshold — ${m.name}`}
                        />
                      </>
                    ) : (
                      <span className="t-meta">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1 w-[150px]">
                    {on && c ? (
                      <>
                        <div className="t-meta text-[12px] mb-1">{dirWord}</div>
                        <NumField
                          value={c.crit}
                          onCommit={(v) => setMetric(m.id, { crit: v })}
                          suffix={m.unit === "%" ? "%" : undefined}
                          tone="crit"
                          label={`Critical threshold — ${m.name}`}
                        />
                      </>
                    ) : (
                      <span className="t-meta">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-1 whitespace-nowrap">
                    <Badge state={metricState(m, cfg)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </Card>
  );
}
