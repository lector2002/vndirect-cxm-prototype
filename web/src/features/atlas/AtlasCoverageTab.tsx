import type { Cfg, Obs, Signal } from "../../data/schema/index.ts";
import { Badge, Note, Stat } from "../../design-system/index.ts";
import { SIGNAL_STATUS } from "./signalStatus.ts";

/* Tab "Độ phủ dữ liệu" của hồ sơ bước — port stepInspector() nhánh `cov` (prototype
   output/cxm-platform-prototype.html dòng 3530-3548). Trả lời: những gì màn nói về bước này đáng tin
   tới đâu, và còn thiếu đo cái gì.

   Câu chốt của prototype giữ nguyên và giữ ĐÚNG chỗ: độ phủ là thuộc tính của BƯỚC, không phải một
   màn riêng — nên nó sống cạnh chính bước đang xét. */

export type AtlasCoverageTabProps = {
  obs: Obs;
  cfg: Cfg;
  /** Điểm đo của bước (đã lọc ở caller) — gồm cả gap/designed, vì tab này tồn tại để đếm đúng chúng. */
  signals: Signal[];
};

export function AtlasCoverageTab({ obs, cfg, signals }: AtlasCoverageTabProps) {
  const covWarn = obs.cov < cfg.step.covMin;
  // "Chưa hoạt động" = gap (chưa instrument) HOẶC designed (mới có spec) — hai cách chưa chạy thật.
  const inactive = signals.filter((g) => g.st === "gap" || g.st === "designed");
  /* "Không có điểm đo nào chưa hoạt động" KHÁC "có điểm đo và đều đang chạy" — bước chưa khai điểm
     đo nào cũng cho `inactive.length === 0`, và nếu cứ thế in "Đủ signal" thì màn đang khen một bước
     hoàn toàn chưa được instrument. Tách hẳn ca này ra, đúng như ba nghĩa "không biết" ở chart điểm
     đo. Có thật trong pilot: vd bước 04 flow nạp tiền (phase 03 Dòng tiền). */
  const noSignal = signals.length === 0;

  return (
    <div data-testid="atlas-cov">
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <Stat
          label="Evidence coverage"
          value={`${obs.cov}%`}
          foot={`Ngưỡng tối thiểu ${cfg.step.covMin}%`}
          srcNote="Mobile SDK event registry"
          tone={covWarn ? "var(--watch)" : undefined}
        />
        <Stat
          label="Signal chưa hoạt động"
          value={noSignal ? "—" : String(inactive.length)}
          foot={
            noSignal
              ? "Bước chưa khai signal nào"
              : inactive.length
                ? "Chưa instrument hoặc chỉ có spec"
                : "Đủ signal"
          }
          tone={noSignal ? "var(--watch)" : undefined}
        />
      </div>


      {covWarn ? (
        /* Nói bằng HỆ QUẢ chứ không bằng con số suông: "58%" tự nó không nói cho ai biết đang thiếu
           gì. Phần bù (100 − cov) mới là thứ người đọc cần — số ca rớt mà không đọc được lý do. */
        <Note tone="warn">
          <b>{`Còn ${100 - obs.cov}% trường hợp thất bại chưa biết lý do.`}</b> Thấy được số người
          rớt, nhưng không đọc được nguyên nhân cho phần lớn trong đó — nên mọi giả thuyết về bước
          này còn yếu bằng chứng.
        </Note>
      ) : (
        <Note>
          <b>Độ phủ đạt ngưỡng.</b> Phần lớn trường hợp thất bại ở bước này có reason code đọc được.
        </Note>
      )}

      {/* Caveat đứng SAU câu chốt về độ phủ, không đứng trước: nó bổ nghĩa cho câu đó ("con số trên
          chưa kiểm được"), đặt trước thì câu trấn an đọc sau sẽ lấn mất — đã thấy đúng như vậy khi
          xem trên màn, bước 04 flow nạp tiền: cov 98% "đạt ngưỡng" mà bước chưa hề có điểm đo. */}
      {noSignal ? (
        <div className="mt-2.5" data-testid="atlas-cov-nosignal">
          <Note tone="warn">
            <b>Nhưng bước này chưa khai điểm đo nào.</b> Con số độ phủ ở trên đến từ log của bước,
            trong khi không có điểm đo nào được khai để nói bước đang nghe những sự kiện gì — nên
            chưa kiểm được độ phủ đó lấy từ đâu ra.
          </Note>
        </div>
      ) : null}

      {inactive.length > 0 ? (
        <div className="mt-3.5" data-testid="atlas-cov-missing">
          <div className="t-lbl mb-2">Signal đang thiếu</div>
          <div className="border border-line rounded-[10px] divide-y divide-line">
            {inactive.map((g) => {
              const status = SIGNAL_STATUS[g.st];
              return (
                <div key={g.id} className="px-3.5 py-3" data-testid={`atlas-cov-sig-${g.id}`}>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge state={status.badge} text={status.label} />
                    <code className="font-mono text-[12px] text-primary">{g.name}</code>
                    <span className="t-meta text-[12px] ml-auto">{g.pf.join(", ")}</span>
                  </div>
                  <div className="t-meta text-[12px] mt-1.5">{g.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-3.5">
        <Note>
          <span className="text-[12px]">
            Độ phủ dữ liệu là thuộc tính của <b>bước</b>, không phải một màn riêng — nên nó sống ở
            đây, cạnh chính bước đang xét.
          </span>
        </Note>
      </div>
    </div>
  );
}
