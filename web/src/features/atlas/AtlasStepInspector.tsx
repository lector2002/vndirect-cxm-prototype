import type { Cfg, Dim, Obs, SigCount, Signal, Step, Touchpoint } from "../../data/schema/index.ts";
import { fx, stepState, stepWhy } from "../../domain/index.ts";
import { Badge, Card, Note, Stat } from "../../design-system/index.ts";
import { nf, pv } from "../../design-system/format.ts";
import { AtlasSignalPanel } from "./AtlasSignalPanel.tsx";

/* Hồ sơ một bước — port CHỈ tab "Touchpoint & signal" của stepInspector() (prototype
   output/cxm-platform-prototype.html dòng 3475-3520). Hai tab còn lại ("Chỉ số liên kết", "Độ phủ
   dữ liệu", dòng 3478/3519-3529) CỐ Ý không dựng ở bước này (đúng contract của section này) — không
   render nút tab cho hai cái đó để không mời bấm vào chỗ chưa có gì. Component nhận step/obs/cfg/
   touchpoints/signals qua props đã lọc sẵn ở AtlasPage — không tự đọc store (giống JourneySpine).

   Khối "Signal đang gắn vào bước này" (nhãn + bảng) đã CHUYỂN sang AtlasSignalPanel.tsx — nơi đó
   giờ còn nối thêm chart điểm đo (domain/signalChart.ts) + panel "gắn ở đâu" (Đ4), xem docblock file
   đó. Component này chỉ còn forward props xuống, không tự đọc SIGNAL_STATUS/bảng gì nữa. */

export type AtlasStepInspectorProps = {
  step: Step;
  /** Bắt buộc có (không optional): caller (AtlasPage) chỉ render inspector cho bước ĐÃ có obs —
      cùng bất biến với bước được phép hiện trên JourneySpine (rule 2 của contract). */
  obs: Obs;
  cfg: Cfg;
  /** Touchpoint của riêng bước này (đã lọc theo stepId ở caller). */
  touchpoints: Touchpoint[];
  /** Signal thuộc các touchpoint trên (đã lọc ở caller) — PHẢI giữ cả signal `gap`/`designed`,
      không lọc bỏ (rule contract: "must not be filtered out"). */
  signals: Signal[];
  /** Bảng khai chiều — cần để AtlasSignalPanel dựng chart điểm đo. */
  dims: Record<string, Dim>;
  /** Bảng đếm TOÀN CỤC của chart điểm đo (`data.sigCounts`) — forward xuống AtlasSignalPanel,
      component này không tự lọc/đọc. */
  sigCounts: SigCount[];
};

export function AtlasStepInspector({ step, obs, cfg, touchpoints, signals, dims, sigCounts }: AtlasStepInspectorProps) {
  const st = stepState(obs, cfg);
  const why = stepWhy(obs, cfg);
  const covWarn = obs.cov < cfg.step.covMin;

  return (
    <Card
      title={`Bước ${step.code} · ${step.name}`}
      subtitle={`${step.stationId} · phụ trách ${step.owner}`}
      actions={<Badge state={st} />}
    >
      <div className="grid grid-cols-4 gap-2.5">
        <Stat label="Vào bước" value={nf(fx(obs.entered))} />
        <Stat label="Hoàn tất" value={nf(fx(obs.completed))} foot={`${pv(obs.completed, obs.entered)}%`} />
        <Stat
          label="Thất bại"
          value={nf(fx(obs.failed))}
          foot={`${pv(obs.failed, obs.entered)}% người vào bước`}
          tone={st === "crit" ? "var(--crit)" : undefined}
        />
        <Stat
          label="Evidence coverage"
          value={`${obs.cov}%`}
          foot={covWarn ? `Dưới ngưỡng ${cfg.step.covMin}%` : `Đạt ngưỡng ${cfg.step.covMin}%`}
          tone={covWarn ? "var(--watch)" : undefined}
        />
      </div>

      <div className="mt-3">
        <Note tone={st === "crit" ? "crit" : st === "watch" ? "warn" : "default"}>
          <b>Vì sao gắn nhãn này:</b> {why}.
        </Note>
      </div>

      {/* Rule contract: CHỈ MỘT tab, không dựng nút cho "Chỉ số liên kết"/"Độ phủ dữ liệu". */}
      <div className="flex gap-1.5 mt-3.5 border-b border-line" data-testid="atlas-inspector-tabs">
        <button
          type="button"
          data-testid="atlas-tab-sig"
          className="px-3 py-1.5 -mb-px text-[12.5px] font-semibold border-b-2 border-primary text-primary"
        >
          Touchpoint &amp; signal
        </button>
      </div>

      <div className="mt-3.5">
        <div className="t-lbl mb-2">{`Touchpoint (${touchpoints.length})`}</div>
        <div className="flex flex-col gap-2">
          {touchpoints.map((t) => (
            <Note key={t.id}>
              <div className="flex items-center gap-2 flex-wrap">
                <b className="text-[13px] text-ink">{t.name}</b>
                <span className="px-1.5 py-0.5 rounded-[6px] text-[11px] bg-surface-2 border border-line">
                  {t.channel}
                </span>
                <span className="ml-auto t-meta text-[12px]">{`${nf(fx(t.users))} khách / kỳ`}</span>
              </div>
              <div className="mt-1 text-[12.5px]">
                {t.desc} · phụ trách {t.owner}
              </div>
            </Note>
          ))}
        </div>

        <AtlasSignalPanel
          key={step.id}
          signals={signals}
          touchpoints={touchpoints}
          rows={sigCounts}
          dims={dims}
          stationId={step.stationId}
        />
      </div>
    </Card>
  );
}
