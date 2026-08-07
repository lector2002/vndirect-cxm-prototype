import { Badge, Card, Note } from "../../../design-system/index.ts";
import { metricState } from "../../../domain/index.ts";
import { metricDirection } from "../../../data/metric-direction.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 2 — "Chỉ số theo dõi" (`cfg.metric[id]`, một bảng). Port tinh thần `g === 'metric'` của
   prototype (dòng 4182-4206), không port HTML thô.

   BAND RIÊNG TỪNG CHỈ SỐ, KHÔNG NGƯỠNG CHUNG: cột "Cần theo dõi khi"/"Cần xử lý khi" đọc
   `cfg.metric[m.id]`, mỗi chỉ số một cặp watch/crit của riêng nó — không có một % lệch mục tiêu
   chung nào áp được cho cả sáu chỉ số hôm nay, lý do nằm trong khối giải thích cuối nhóm.

   HƯỚNG SO SÁNH ("vượt"/"dưới") lấy từ `metricDirection()` (`data/metric-direction.ts`) — MỘT
   nguồn sự thật duy nhất, dùng chung với `domain/state.ts` và `data/mock-repository.ts`. Không viết
   lại luật hướng ở đây (charter cấm). */

/** Câu giải thích cuối nhóm SO HAI CHỈ SỐ THẬT (Liveness vs Evidence coverage), y hệt tinh thần
    prototype dòng 4205 — nhưng số đọc từ `data.metrics` + trạng thái tính bằng band MẶC ĐỊNH
    (`cfgDefault`), không gõ cứng "83,3%"/"71%" như prototype. Đổi fixture (giá trị hai chỉ số này,
    hoặc band mặc định của chúng) là câu tự đổi theo — không cần sửa file này.
    Dùng `cfgDefault` (không phải cfg đang sửa dở trên chính màn này) để câu giải thích không lung
    lay theo thao tác thử ngưỡng của người vận hành ngay trên bảng phía trên nó. */
const STATE_WORD: Record<"ok" | "watch" | "crit" | "unknown", string> = {
  ok: "đang kiểm soát",
  watch: "cần theo dõi",
  crit: "cần xử lý ngay",
  unknown: "chưa đo được",
};

/** Style tiêu đề cột dùng chung — tránh chép cùng một chuỗi class 7 lần (khuôn SourcesPage.tsx). */
const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";

export function MetricGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const cfgDefault = useCxmStore((s) => s.cfgDefault);
  const { write, error } = useCfgWrite();

  const watched = data.metrics.filter((m) => cfg.metric[m.id]?.on).length;

  const setMetric = (id: string, patch: Partial<{ on: boolean; watch: number; crit: number }>) => {
    const c = cfg.metric[id];
    write({ metric: { ...cfg.metric, [id]: { ...c, ...patch } } });
  };

  const liveness = data.metrics.find((m) => m.id === "m-liveness");
  const ocr = data.metrics.find((m) => m.id === "m-ocr");
  /* Câu so sánh dưới cùng nói nguyên văn "so CÙNG mục tiêu" — nên nó chỉ đúng khi hai chỉ số thật
     sự đang cùng một mục tiêu. Hôm nay cả hai là "≥ 90%", nhưng mục tiêu nằm trong fixture và sẽ
     đổi khi số thật về; thiếu vế kiểm này thì một ngày nào đó màn in ra một câu so sánh sai mà
     không có gì đỏ. Cùng loại lỗi "một con số đứng dưới cái nhãn không thuộc về nó" mà stream này
     đã chặn ba lần. */
  const canCompare =
    liveness &&
    ocr &&
    liveness.target === ocr.target &&
    cfgDefault.metric["m-liveness"] &&
    cfgDefault.metric["m-ocr"];

  return (
    <Card
      title="Chỉ số đang theo dõi"
      denomStrip={`${watched} trên ${data.metrics.length} chỉ số đang bật theo dõi — bảng dưới vẫn hiện đủ cả ${data.metrics.length}`}
    >
      {/* Câu này dài hơn một dòng nên KHÔNG vào `subtitle` — slot đó cắt cụt (xem StepGroup). */}
      <p className="t-meta mb-3 text-[12.5px]">
        Mỗi chỉ số có band riêng — không dùng một ngưỡng chung cho tất cả. Tắt công tắc thì vẫn tính
        và hiện số, nhưng nhãn trạng thái đổi thành “Chưa đo được” và không vào cảnh báo.
      </p>

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
              <th className={TH}>Chỉ số</th>
              <th className={TH}>Theo dõi</th>
              <th className={TH}>Giá trị</th>
              <th className={TH}>Mục tiêu</th>
              <th className={TH}>Cần theo dõi khi</th>
              <th className={TH}>Cần xử lý khi</th>
              <th className={TH}>Trạng thái</th>
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
                      {m.source} · {m.freshness} · {m.owner}
                    </div>
                  </td>
                  <td className="py-1.5 px-1">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        aria-label={`Theo dõi ${m.name}`}
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
                          label={`Ngưỡng theo dõi ${m.name}`}
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
                          label={`Ngưỡng xử lý ngay ${m.name}`}
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

      <div className="mt-3.5">
        <Note>
          Hướng so sánh suy ra từ dấu trong mục tiêu: <span className="font-mono">≥</span> là càng cao
          càng tốt, <span className="font-mono">≤</span> là càng thấp càng tốt. Repeat contact dùng{" "}
          <span className="font-mono">≤</span> nên ngưỡng đọc theo chiều "vượt".{" "}
          <b>Cố ý không có một ngưỡng chung cho mọi chỉ số:</b>{" "}
          {canCompare ? (
            <>
              {liveness!.name} {liveness!.value} so mục tiêu {liveness!.target} là{" "}
              {STATE_WORD[metricState(liveness!, cfgDefault)]}, còn {ocr!.name} {ocr!.value} so cùng
              mục tiêu {ocr!.target} chỉ là {STATE_WORD[metricState(ocr!, cfgDefault)]} — chỉ số
              chạm khách và chỉ số chất lượng dữ liệu không đọc cùng một cách.
            </>
          ) : (
            // Không tìm thấy m-liveness/m-ocr trong fixture hoặc band mặc định — không đoán số, chỉ
            // giữ lý do bằng lời (xem báo cáo worker: fixture hiện tại luôn có đủ hai chỉ số này).
            <>chỉ số chạm khách và chỉ số chất lượng dữ liệu không đọc cùng một cách.</>
          )}
        </Note>
      </div>
    </Card>
  );
}
