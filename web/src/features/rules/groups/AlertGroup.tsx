import type { QuantifyItem, QuantifySeries } from "../../../data/schema/index.ts";
import { Card, Note } from "../../../design-system/index.ts";
import { countAnomalies, sourceHealth } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { ApplySection, FieldRow } from "../RuleLayout.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 4 — Cảnh báo & khảo sát. Port tinh thần V.rules nhánh g==='alert' (prototype dòng 4230-4277):
   các ngưỡng nền dùng cho chart bất thường, khảo sát, và cách tô đỏ trên hồ sơ điểm gãy.

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
   hiện ở đó, không phải repeatMin).

   12/08 (owner quyết, handoff §6): HAI Ô NHẬP `anomalyX` và `repeatMin` cũng đã bỏ khỏi nhóm này,
   cùng field trong `CfgData`. Chúng ở lại sau đợt trên như hai ô gõ được mà không đổi được nhãn
   nào — đúng bẫy "ô cấu hình mồ côi". Không thêm lại ô nhập nào trước khi có chỗ tiêu thụ: phép
   kiểm để thêm là "sửa ô này có đổi được nhãn nào trên màn không". */

function isAnomalySeries(q: QuantifyItem): q is QuantifySeries {
  return q.kind === "series" && q.chart === "anomaly";
}

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
    <Card title="Alerts & surveys">
      {error ? (
        <div className="mb-3">
          <Note tone="crit">
            <b>Không ghi được cấu hình.</b> {error}
          </Note>
        </div>
      ) : null}

      <div>
        {/* luật 11/08 (bổ sung): bỏ hẳn định nghĩa đơn vị z-score */}
        <FieldRow label="Z-score anomaly threshold (charts)">
          <NumField
            label="Z-score anomaly threshold"
            value={cfg.anomaly.z}
            suffix="σ"
            onCommit={(v) => write({ anomaly: { ...cfg.anomaly, z: v } })}
          />
        </FieldRow>

        {/* luật 12/08: bỏ hết dòng phụ dưới nhãn ô nhập — "Quality Monitor dùng ngưỡng này" nói
            màn nào tiêu thụ, "mỗi khách tối đa 1 khảo sát trong khoảng này" và "hiển thị trên tab
            Ảnh hưởng" dạy cách đọc. Không cái nào nói về dữ liệu của chính ô. */}
        <FieldRow label="Stopped-source threshold (days past cadence)">
          <NumField
            label="Stopped-source threshold (days past cadence)"
            value={cfg.data.deadDays}
            suffix="days"
            onCommit={(v) => write({ data: { ...cfg.data, deadDays: v } })}
          />
        </FieldRow>

        <FieldRow label="Global survey cooldown">
          <NumField
            label="Global survey cooldown"
            value={cfg.data.cooldown}
            suffix="days"
            onCommit={(v) => write({ data: { ...cfg.data, cooldown: v } })}
          />
        </FieldRow>

        <FieldRow label="Repeat-contact red threshold">
          <NumField
            label="Repeat-contact red threshold"
            value={cfg.data.repeatWarn}
            suffix="%"
            tone="crit"
            onCommit={(v) => write({ data: { ...cfg.data, repeatWarn: v } })}
          />
        </FieldRow>

        <FieldRow label="Churn-signal red threshold (customers)">
          <NumField
            label="Churn-signal red threshold (customers)"
            value={cfg.data.churnWarn}
            suffix="cust."
            tone="crit"
            onCommit={(v) => write({ data: { ...cfg.data, churnWarn: v } })}
          />
        </FieldRow>
      </div>

      <ApplySection
        title="Effect on current data"
        summary={`${dead.length} sources Stopped · ${redRep.length} repeat-contact · ${redChurn.length} churn flags${
          anomalyItems.length ? ` · ${anomalyHits} anomaly points` : ""
        }`}
      >
        <div className="flex flex-col gap-2.5" data-testid="alert-apply-now">
          <Note tone={dead.length ? "crit" : "default"}>
            Quá nhịp giao <b>{cfg.data.deadDays} ngày</b> là "Stopped" → <b>{dead.length} nguồn</b> bị coi
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

          {/* luật 12/08: bỏ Note "Cooldown N ngày đang hiện nguyên văn trên Nguồn dữ liệu" — chỉ
              đường sang màn khác, cùng diện với "hiển thị trên tab Ảnh hưởng". Ba Note còn lại ở
              khối này GIỮ: chúng đếm ra số thật (nguồn ngừng gửi, điểm gãy bị tô, điểm bất thường
              đang khoanh), tức báo dữ liệu lệch hướng — đúng phép thử 2. */}
        </div>
      </ApplySection>
    </Card>
  );
}
