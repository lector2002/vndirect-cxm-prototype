import { useState } from "react";
import type { Cfg, Dim, Metric, Obs, SigCount, Signal, Step, Touchpoint } from "../../data/schema/index.ts";
import { fx, stepState, stepWhy } from "../../domain/index.ts";
import { Badge, Card, Note, Stat } from "../../design-system/index.ts";
import { nf, pv } from "../../design-system/format.ts";
import { AtlasCoverageTab } from "./AtlasCoverageTab.tsx";
import { AtlasMetricsTab } from "./AtlasMetricsTab.tsx";
import { AtlasSignalPanel } from "./AtlasSignalPanel.tsx";

/* Hồ sơ một bước — port stepInspector() (prototype output/cxm-platform-prototype.html dòng
   3475-3548) với ĐỦ BA TAB: "Touchpoint & signal", "Chỉ số liên kết", "Độ phủ dữ liệu".

   05/08: hai tab sau lên muộn hơn tab đầu một nhịp (S3c cố ý chỉ ship tab 1). Chúng phải lên CÙNG
   LÚC với việc gắn mốc tour `atlas-inspector`: mốc đó khai "Hồ sơ bước — 3 tab" (seed.ts:936), gắn
   khi màn mới có 1 tab là để tour nói một câu sai.

   Component nhận step/obs/cfg/touchpoints/signals/metrics qua props đã lọc sẵn ở AtlasPage — không
   tự đọc store (giống JourneySpine).

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
  /** BẢNG chỉ số toàn cục (`data.metrics`) — forward thẳng xuống tab "Chỉ số liên kết", không lọc ở
      đây: tab đó cần thấy cả id mồ côi (điểm đo nhắc một chỉ số không có trong bảng). */
  metrics: Metric[];
  /** Bảng đếm TOÀN CỤC của chart điểm đo (`data.sigCounts`) — forward xuống AtlasSignalPanel,
      component này không tự lọc/đọc. */
  sigCounts: SigCount[];
};

const TABS = [
  ["sig", "Touchpoint & signal"],
  ["met", "Chỉ số liên kết"],
  ["cov", "Độ phủ dữ liệu"],
] as const;

type TabKey = (typeof TABS)[number][0];

export function AtlasStepInspector({
  step,
  obs,
  cfg,
  touchpoints,
  signals,
  dims,
  sigCounts,
  metrics,
}: AtlasStepInspectorProps) {
  /* Tab đang mở KHÔNG reset khi đổi bước — cùng hành vi prototype (`ST.sub.atlasTab` là state toàn
     cục, dòng 3477). Đúng việc người ta làm: đang so độ phủ giữa các bước thì bấm bước kế tiếp phải
     vẫn ở tab độ phủ, không bị ném về tab đầu. */
  const [tab, setTab] = useState<TabKey>("sig");
  const st = stepState(obs, cfg);
  const why = stepWhy(obs, cfg);

  return (
    <Card
      title={`Bước ${step.code} · ${step.name}`}
      subtitle={`${step.stationId} · phụ trách ${step.owner}`}
      actions={<Badge state={st} />}
    >
      {/* 07/08 (module-i-signal-registry-charter.md D4): bỏ Stat "Evidence coverage" — đọc trường
          `cov` của obs, số gõ tay không đối chiếu được. Còn lại 3 Stat đếm được. */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Vào bước" value={nf(fx(obs.entered))} />
        <Stat label="Hoàn tất" value={nf(fx(obs.completed))} foot={`${pv(obs.completed, obs.entered)}%`} />
        <Stat
          label="Thất bại"
          value={nf(fx(obs.failed))}
          foot={`${pv(obs.failed, obs.entered)}% người vào bước`}
          tone={st === "crit" ? "var(--crit)" : undefined}
        />
      </div>

      <div className="mt-3">
        <Note tone={st === "crit" ? "crit" : st === "watch" ? "warn" : "default"}>
          <b>Vì sao gắn nhãn này:</b> {why}.
        </Note>
      </div>

      {/* role=tablist + aria-selected: ba nút này là MỘT lựa chọn, không phải ba nút rời — người
          dùng bàn phím/screen reader phải nghe ra điều đó. */}
      <div
        className="flex gap-1.5 mt-3.5 border-b border-line"
        role="tablist"
        aria-label="Cách xem hồ sơ bước"
        data-testid="atlas-inspector-tabs"
      >
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`atlas-tab-${k}`}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 -mb-px text-[12.5px] font-semibold border-b-2 ${
              tab === k
                ? "border-primary text-primary"
                : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3.5">
        {tab === "sig" ? (
          <>
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
          </>
        ) : tab === "met" ? (
          <AtlasMetricsTab signals={signals} metrics={metrics} cfg={cfg} />
        ) : (
          <AtlasCoverageTab signals={signals} />
        )}
      </div>
    </Card>
  );
}
