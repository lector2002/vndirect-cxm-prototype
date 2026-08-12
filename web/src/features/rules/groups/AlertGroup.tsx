import type { QuantifyItem, QuantifySeries } from "../../../data/schema/index.ts";
import { Card, Note } from "../../../design-system/index.ts";
import { countAnomalies, sourceHealth } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 4 — Cảnh báo & khảo sát. Port tinh thần V.rules nhánh g==='alert' (prototype dòng 4230-4277):
   bảy ngưỡng nền dùng cho agent, chart bất thường, khảo sát, và cách tô đỏ trên hồ sơ điểm gãy.

   KHỐI "ÁP NGAY LÚC NÀY" CHỈ GIỮ NHỮNG CÂU TÍNH ĐƯỢC THẬT TỪ STORE:
   - Nguồn bị coi Ngừng gửi: dùng lại `sourceHealth(s, cfg, data.asOf) === 'down'` — tái dùng seam
     chung thay vì chép lại phép tính. 07/08 (module-i-signal-registry-charter.md I3): công thức đổi
     sang so ngày `Source.last` với `data.asOf`, không còn so `lagH` với `deadDays*24`.
     11/08 (owner, giải C5): `data.deadDays` ĐỔI NGHĨA — không còn là "im lặng bao nhiêu ngày" tính
     từ 0, mà là "quá NHỊP GIAO của chính nguồn đó bao nhiêu ngày" (`cfg.source[id]`, cũng tính bằng
     ngày, do nhóm 3 ở màn này giữ). Nhãn ô nhập dưới đây phải nói đúng nghĩa mới: với nguồn khai
     nhịp 1 ngày thì `deadDays` = 2 nghĩa là chết ở ngày thiếu thứ BA, không phải thứ hai.
   - Điểm gãy bị tô đỏ theo repeat/churn: lọc thẳng trên `data.iss[].imp`.
   - Số điểm bất thường theo ngưỡng Z: tìm chart `kind:'series', chart:'anomaly'` trong `data.qt`
     (seed hôm nay là "Bất thường theo tháng"), chạy `countAnomalies` (domain/stats.ts) trên từng
     chuỗi với đúng `cfg.anomaly.z` hiện tại — không chép số cứng nào.

   ĐÃ BỎ khỏi khối này (không tính được thật, xem báo cáo worker): dòng "Volume vượt baseline … lần"
   của prototype — nó so `data.anomalyX` với tỷ lệ CỨNG 1.180/490 (dòng 4254), không có chuỗi volume
   thật nào trong `CxmData` để tính lại con số đó. Và câu "Cooldown/repeatMin đang hiện nguyên văn
   trên #/agents" — route đó chưa tồn tại trong app thật (chỉ #/sources có, và chỉ cooldown xuất
   hiện ở đó, không phải repeatMin). */

function isAnomalySeries(q: QuantifyItem): q is QuantifySeries {
  return q.kind === "series" && q.chart === "anomaly";
}

const ROW =
  "grid grid-cols-[minmax(0,1fr)_150px] items-center gap-x-3 gap-y-1 py-2.5 border-t border-line first:border-t-0";

export function AlertGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  const dead = data.sources.filter((s) => sourceHealth(s, cfg, data.asOf) === "down");
  const redRep = data.iss.filter((i) => i.imp.rep > cfg.data.repeatWarn);
  const redChurn = data.iss.filter((i) => i.imp.churn > cfg.data.churnWarn);
  const anomalyItems = data.qt.filter(isAnomalySeries);
  const anomalyHits = anomalyItems.reduce(
    (a, q) => a + q.t.reduce((b, s) => b + countAnomalies(s.p, cfg.anomaly.z), 0),
    0,
  );

  return (
    <Card title="Cảnh báo & khảo sát">
      {error ? (
        <div className="mb-3">
          <Note tone="crit">
            <b>Không ghi được cấu hình.</b> {error}
          </Note>
        </div>
      ) : null}

      <div>
        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Ngưỡng Z-score đánh dấu bất thường trên chart</b>
            {/* luật 11/08 (bổ sung): bỏ hẳn định nghĩa đơn vị z-score */}
          </div>
          <NumField
            label="Ngưỡng Z-score đánh dấu bất thường"
            value={cfg.anomaly.z}
            suffix="σ"
            onCommit={(v) => write({ anomaly: { ...cfg.anomaly, z: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Quá nhịp giao bao nhiêu ngày thì coi là Ngừng gửi</b>
            <span className="t-meta block text-[12px]">Quality Monitor dùng ngưỡng này</span>
          </div>
          <NumField
            label="Số ngày quá nhịp giao thì coi là Ngừng gửi"
            value={cfg.data.deadDays}
            suffix="ngày"
            onCommit={(v) => write({ data: { ...cfg.data, deadDays: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Volume vượt baseline bao nhiêu lần thì cảnh báo</b>
            <span className="t-meta block text-[12px]">baseline tính trên 30 ngày</span>
          </div>
          <NumField
            label="Số lần vượt baseline thì cảnh báo"
            value={cfg.data.anomalyX}
            suffix="lần"
            onCommit={(v) => write({ data: { ...cfg.data, anomalyX: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Cooldown khảo sát toàn cục</b>
            <span className="t-meta block text-[12px]">mỗi khách tối đa 1 khảo sát trong khoảng này</span>
          </div>
          <NumField
            label="Cooldown khảo sát toàn cục"
            value={cfg.data.cooldown}
            suffix="ngày"
            onCommit={(v) => write({ data: { ...cfg.data, cooldown: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Từ bao nhiêu lần liên hệ thì tính là repeat contact</b>
            <span className="t-meta block text-[12px]">cùng một chủ đề, trong 7 ngày</span>
          </div>
          <NumField
            label="Số lần liên hệ tính là repeat contact"
            value={cfg.data.repeatMin}
            suffix="lần"
            onCommit={(v) => write({ data: { ...cfg.data, repeatMin: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Repeat contact của điểm gãy vượt mức nào thì tô đỏ</b>
            <span className="t-meta block text-[12px]">hiển thị trên tab Ảnh hưởng</span>
          </div>
          <NumField
            label="Ngưỡng tô đỏ repeat contact"
            value={cfg.data.repeatWarn}
            suffix="%"
            tone="crit"
            onCommit={(v) => write({ data: { ...cfg.data, repeatWarn: v } })}
          />
        </div>

        <div className={ROW}>
          <div>
            <b className="block text-[13px]">Số khách có tín hiệu churn vượt mức nào thì tô đỏ</b>
            <span className="t-meta block text-[12px]">hiển thị trên tab Ảnh hưởng</span>
          </div>
          <NumField
            label="Ngưỡng tô đỏ số khách có tín hiệu churn"
            value={cfg.data.churnWarn}
            suffix="khách"
            tone="crit"
            onCommit={(v) => write({ data: { ...cfg.data, churnWarn: v } })}
          />
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="t-lbl mb-2">Áp ngay lúc này</div>
        <div className="grid gap-2.5" data-testid="alert-apply-now">
          <Note tone={dead.length ? "crit" : "default"}>
            Quá nhịp giao <b>{cfg.data.deadDays} ngày</b> là Ngừng gửi → <b>{dead.length} nguồn</b> bị coi
            là ngừng gửi{dead.length ? `: ${dead.map((s) => s.name).join(", ")}` : ""}.
          </Note>

          <Note>
            Repeat contact vượt <b>{cfg.data.repeatWarn}%</b> thì tô đỏ → <b>{redRep.length} điểm gãy</b>{" "}
            bị tô{redRep.length ? `: ${redRep.map((i) => i.id).join(", ")}` : ""}. Churn vượt{" "}
            <b>{cfg.data.churnWarn} khách</b> → <b>{redChurn.length} điểm gãy</b> bị tô
            {redChurn.length ? `: ${redChurn.map((i) => i.id).join(", ")}` : ""}.
          </Note>

          {anomalyItems.length ? (
            <Note tone={anomalyHits ? "warn" : "default"}>
              Z-score từ <b>{String(cfg.anomaly.z).replace(".", ",")}σ</b> thì đánh dấu là bất thường →
              chart <i>{anomalyItems.map((q) => q.name).join(", ")}</i> đang khoanh{" "}
              <b>{anomalyHits} điểm</b>.{anomalyHits ? "" : " Không điểm nào vượt ngưỡng."}
            </Note>
          ) : null}

          <Note>
            Cooldown <b>{cfg.data.cooldown} ngày</b> đang hiện nguyên văn trên{" "}
            <a href="#/sources">Nguồn dữ liệu</a>.
          </Note>
        </div>
      </div>
    </Card>
  );
}
