import type { Cfg, Metric, Signal } from "../../data/schema/index.ts";
import { metricDirection } from "../../data/metric-direction.ts";
import { metricState } from "../../domain/index.ts";
import { Badge, Note } from "../../design-system/index.ts";

/* Tab "Chỉ số liên kết" của hồ sơ bước — port stepInspector() nhánh `met` (prototype
   output/cxm-platform-prototype.html dòng 3519-3529). Trả lời đúng một câu: bước này đang được CHẤM
   bằng những chỉ số nào, và ngưỡng nào đang áp cho chúng.

   Chỉ số KHÔNG khai trực tiếp trên bước — đi qua điểm đo (`Signal.metrics`). Nên tab lấy đúng những
   chỉ số mà điểm đo của bước có nhắc tới, không phải cả bảng chỉ số. */

export type AtlasMetricsTabProps = {
  /** Điểm đo của bước đang xem (đã lọc ở caller) — nguồn để lần ra chỉ số. */
  signals: Signal[];
  /** BẢNG chỉ số toàn cục (`data.metrics`), KHÔNG lọc sẵn: tab này cần phát hiện được cả ca một điểm
   *  đo nhắc tới id không có trong bảng — lọc ở caller thì ca đó lặng lẽ biến mất. */
  metrics: Metric[];
  cfg: Cfg;
};

/** Dấu phẩy thập phân kiểu Việt — cùng cách `pv()` làm (design-system/format.ts:15). Không dùng
    toLocaleString: repo chưa có gì chứng minh ICU của môi trường chạy test ra đúng dấu phẩy. */
function dec(n: number): string {
  return String(n).replace(".", ",");
}

export function AtlasMetricsTab({ signals, metrics, cfg }: AtlasMetricsTabProps) {
  // Một chỉ số có thể được nhiều điểm đo cùng nuôi — chỉ hiện MỘT lần.
  const ids = [...new Set(signals.flatMap((g) => g.metrics))];
  const linked = ids
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is Metric => m !== undefined);
  const dangling = ids.filter((id) => !metrics.some((m) => m.id === id));

  /* HAI kiểu trống rất khác nhau, không được nói chung một câu — bước chưa có điểm đo nào thì câu
     "điểm đo đã có nhưng chưa nuôi chỉ số" là màn nói sai về chính nó. Cả hai đều là đường chạy
     THƯỜNG GẶP, không phải ca hiếm: đo trên seed 05/08, chỉ 6 trên 30 bước pilot có chỉ số, và
     trong số còn lại có những bước chưa khai điểm đo nào (vd bước 04 của flow nạp tiền). */
  if (signals.length === 0) {
    return (
      <div data-testid="atlas-met-nosignal">
        <Note tone="warn">
          <b>Bước này chưa khai điểm đo nào.</b> Chỉ số được lần ra qua điểm đo, nên chưa có điểm đo
          thì cũng chưa thể nói bước này đang được chấm bằng chỉ số gì. Việc cần làm nằm trước một
          bậc: instrument signal cho bước, rồi mới khai chỉ số.
        </Note>
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div data-testid="atlas-met-empty">
        <Note tone="warn">
          <b>Bước này chưa gắn chỉ số nào.</b> Điểm đo của bước đã có, nhưng chưa điểm đo nào được
          khai là nuôi một chỉ số theo dõi — nên chưa có ngưỡng nào chấm bước này. Đây là chỗ còn
          thiếu khai báo, không phải chỉ số bằng 0.
        </Note>
      </div>
    );
  }

  return (
    <div data-testid="atlas-met-list">
      <p className="t-meta mb-3">
        Ngưỡng của từng chỉ số đặt ở màn <a href="#/rules">Chỉ số &amp; ngưỡng</a> — phần dưới đọc
        trực tiếp từ đó, không khai lại.
      </p>

      <div className="flex flex-col gap-2.5">
        {linked.map((metric) => {
          const band = cfg.metric[metric.id];
          // "down" = số CÀNG THẤP CÀNG TỐT (target ghi ≤) ⇒ vượt ngưỡng mới là xấu; ngược lại là dưới.
          const worse = metricDirection(metric) === "down" ? "vượt" : "dưới";
          return (
            <div key={metric.id} data-testid={`atlas-met-${metric.id}`}>
              <Note>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <b className="text-[13px] text-ink">{metric.name}</b>
                  <Badge state={metricState(metric, cfg)} />
                  <b className="text-[15px] font-bold ml-auto tabular-nums">{metric.value}</b>
                  <span className="t-meta text-[12px]">mục tiêu {metric.target}</span>
                </div>
                <div className="mt-1.5 text-[12px]">
                  {band && band.on ? (
                    <>
                      Ngưỡng đang áp: cần theo dõi khi {worse} <b>{dec(band.watch)}</b>, cần xử lý
                      khi {worse} <b>{dec(band.crit)}</b>
                    </>
                  ) : (
                    /* Tắt ngưỡng KHÔNG có nghĩa chỉ số hỏng — nói đúng hệ quả: vẫn có số, chỉ là
                       không ai bị đánh thức vì nó. `metricState` trả 'unknown' đúng cho ca này. */
                    <>
                      Chỉ số này đang <b>không được theo dõi</b> — vẫn tính và hiện số, nhưng không
                      gắn nhãn trạng thái và không vào cảnh báo.
                    </>
                  )}
                </div>
                <div className="mt-1 text-[12px] text-ink-3">
                  {`Grain ${metric.grain} · ${metric.formula} · ${metric.freshness} · ${metric.owner}`}
                </div>
              </Note>
            </div>
          );
        })}
      </div>

      {/* Điểm đo nhắc một id không có trong bảng chỉ số: NÓI RA chứ không lặng lẽ bỏ qua — im lặng là
          màn đang giấu một khai báo hỏng. Chưa xảy ra trên seed; để dữ liệu thật vỡ thì thấy ngay. */}
      {dangling.length > 0 ? (
        <div className="mt-2.5" data-testid="atlas-met-dangling">
          <Note tone="crit">
            {`${dangling.length} chỉ số được điểm đo nhắc tới nhưng không có trong bảng chỉ số: ${dangling.join(", ")}. Khai báo đang lệch nhau, cần bên dữ liệu đối chiếu.`}
          </Note>
        </div>
      ) : null}
    </div>
  );
}
