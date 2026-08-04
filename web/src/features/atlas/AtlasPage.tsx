import { useState } from "react";
import type { Flow, Group, Obs } from "../../data/schema/index.ts";
import { fx, stepState, stepWhy } from "../../domain/index.ts";
import { Badge, Card, JourneySpine, Note } from "../../design-system/index.ts";
import type { SpineStep } from "../../design-system/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { AtlasStepInspector } from "./AtlasStepInspector.tsx";

/* Bản đồ hành trình #/atlas — port CẤU TRÚC (không phải điều khiển toàn cục ST.sel.*) của V.atlas
   (prototype output/cxm-platform-prototype.html dòng 3362-3420): rail phase → card flow (chip theo
   nhóm) → card chi tiết flow (JourneySpine) → hồ sơ bước (AtlasStepInspector, CHỈ tab tín hiệu — xem
   docblock file đó). Ba lựa chọn (phase/flow/step) là state LOCAL của màn này (rule 4 contract) — Zustand
   store không có state lựa chọn nào (store/store.ts) và feature khác cũng không đặt nó ở store, nên
   không đặt case lệ ở đây. */

/** Phase mà một flow thuộc về, tra qua group — flow không có `phaseId` trực tiếp (journey.ts:26-36),
    phải đi qua Group (journey.ts:19-24). Cục bộ ở màn này, không phải luật domain dùng chỗ khác. */
function phaseIdOfFlow(flow: Flow, groups: Group[]): string {
  const g = groups.find((x) => x.id === flow.groupId);
  return g ? g.phaseId : "";
}

/** Màu chấm trạng thái flow trên rail/chip — port dotOf() (prototype dòng 3370). #D6D1CB port 1-1 từ
    hex gốc (không phải hex tự bịa — xem tiền lệ JourneySpine.tsx dòng 55 dùng #8F2A23 cùng lý do). */
function flowDotColor(f: Flow): string {
  return f.observed ? "var(--primary)" : f.verified ? "var(--ink3)" : "#D6D1CB";
}

/** Tooltip chấm — port stateOf() (prototype dòng 3371); KHÁC câu chữ với legend cố định bên dưới
    (dòng 3401-3403) — đây là hai chỗ chữ khác nhau trong chính prototype, giữ đúng cả hai. */
function flowDotTitle(f: Flow): string {
  return f.observed ? "Có dữ liệu quan sát" : f.verified ? "Có nguồn · chưa có dữ liệu" : "Chờ nguồn";
}

export function AtlasPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  // Cần cho AtlasSignalPanel (chart điểm đo, domain/signalChart.ts) — nhãn/unit của năm chiều cố định.
  const dims = useCxmStore((s) => s.dims);

  /* Mặc định mở đúng flow đang có dữ liệu quan sát (hôm nay là f-open-2026, flow pilot duy nhất) —
     tra bằng `observed` thay vì hardcode id fixture, để không gãy nếu seed đổi id. */
  const defaultFlow = data.flows.find((f) => f.observed) ?? data.flows[0];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() => phaseIdOfFlow(defaultFlow, data.groups));
  const [selectedFlowId, setSelectedFlowId] = useState<string>(() => defaultFlow.id);
  // Rule 4: chưa chọn bước nào khi mới vào màn/mới đổi flow — hồ sơ bước CHỈ hiện khi bấm chọn.
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Rule 4: chọn phase → reset flow về một flow TRONG phase đó, reset luôn bước (đổi cả flow lẫn phase).
  function selectPhase(phaseId: string) {
    setSelectedPhaseId(phaseId);
    const flowsInPhase = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === phaseId);
    setSelectedFlowId(flowsInPhase[0]?.id ?? "");
    setSelectedStepId(null);
  }
  // Rule 4: chọn flow → reset bước — bước của flow cũ không được lộ ra dưới flow mới.
  function selectFlow(flowId: string) {
    setSelectedFlowId(flowId);
    setSelectedStepId(null);
  }

  const currentPhase = data.phases.find((p) => p.id === selectedPhaseId);
  const currentFlow = data.flows.find((f) => f.id === selectedFlowId);
  const groupsInPhase = data.groups.filter((g) => g.phaseId === selectedPhaseId);

  const flowSteps = currentFlow ? data.steps.filter((s) => s.flowId === currentFlow.id) : [];
  const obsOf = (stepId: string): Obs | undefined => data.obs.find((o) => o.stepId === stepId);

  /* Rule 2 (bất biến CHỐT): bước KHÔNG có obs không được lên spine dù chỉ để hiện số 0 — loại nó ra
     và nói rõ số bị loại + vì sao, để không đọc nhầm "0" thành "đã đo, bằng 0". */
  const stepsWithObs = flowSteps.filter((s) => obsOf(s.id) !== undefined);
  const excludedStepCount = flowSteps.length - stepsWithObs.length;

  const spineSteps: SpineStep[] = stepsWithObs.map((s) => {
    const o = obsOf(s.id) as Obs; // an toàn: đã lọc theo obsOf(s.id) !== undefined ở stepsWithObs
    const st = stepState(o, cfg);
    return {
      id: s.id,
      code: s.code,
      stationId: s.stationId,
      name: s.name,
      // Rule 1: entered/completed/failed là volume tổng hợp của bước — scale bằng fx() giống mọi
      // nơi khác hiện số Obs (JourneyStateBlock.tsx, prototype journeySpine() dòng 3438-3439/3466).
      entered: fx(o.entered),
      completed: fx(o.completed),
      failed: fx(o.failed),
      cov: o.cov,
      effort: o.effort,
      // stepState(o,...) với o luôn xác định (không phải undefined) không bao giờ trả 'unknown' —
      // nhánh 'unknown' ở đây chỉ để khớp kiểu, KHÔNG phải đường chạy thật.
      state: st === "crit" ? "crit" : st === "watch" ? "watch" : "good",
      why: stepWhy(o, cfg),
    };
  });

  /* Tra trong `stepsWithObs`, KHÔNG trong `flowSteps`: hồ sơ bước cần một `Obs` thật (props không
     optional). Tra trong flowSteps thì phải ép kiểu `as Obs` lúc truyền props — tức bất biến rule 2
     chỉ đúng nhờ TÌNH CỜ (dải chỉ mời bấm bước có obs). Tra ở đây thì kiểu tự lo, không ép. */
  const selectedStep = selectedStepId ? stepsWithObs.find((s) => s.id === selectedStepId) : undefined;
  const selectedObs = selectedStep ? obsOf(selectedStep.id) : undefined;
  const inspectorTouchpoints = selectedStep ? data.touchpoints.filter((t) => t.stepId === selectedStep.id) : [];
  const inspectorSignals = selectedStep
    ? data.signals.filter((g) => inspectorTouchpoints.some((t) => t.id === g.tpId))
    : [];

  if (!currentPhase || !currentFlow) {
    // Không xảy ra với dữ liệu thật (mọi flow đều có group hợp lệ, mọi group có phaseId hợp lệ) —
    // nói thẳng bằng chữ thay vì render trắng nếu dữ liệu tương lai vỡ bất biến này.
    return <Note tone="crit">Không tìm được phase/flow hợp lệ cho lựa chọn hiện tại.</Note>;
  }

  return (
    <div className="p-8">
      {/* 1. Phase rail — một nút mỗi phase, chấm theo flow, đếm flow. */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3.5" data-testid="atlas-phase-rail">
        {data.phases.map((p) => {
          const flowsOfP = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === p.id);
          return (
            <button
              key={p.id}
              type="button"
              data-testid={`atlas-phase-${p.id}`}
              title={`${p.name} · ${flowsOfP.length} flow`}
              onClick={() => selectPhase(p.id)}
              className={`flex-none min-w-[128px] text-left rounded-[10px] border p-2.5 ${
                p.id === selectedPhaseId ? "border-primary bg-primary-soft" : "border-line bg-surface"
              }`}
            >
              <div className="font-mono text-[12px] font-bold text-ink-3">{p.code}</div>
              <div className="text-[13px] font-semibold my-1 leading-tight">{p.name}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {flowsOfP.map((f) => (
                  <i
                    key={f.id}
                    className="w-[6px] h-[6px] rounded-full flex-none"
                    style={{ background: flowDotColor(f) }}
                  />
                ))}
                <span className="text-[11px] text-ink-2 ml-1">{`${flowsOfP.length} flow`}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. Flow card — chip theo nhóm trong phase đang chọn, kèm legend chấm. */}
      <div className="mb-3.5">
        <Card title={`${currentPhase.code} · ${currentPhase.name}`} subtitle="Chọn một flow để mở chuỗi bước">
          <div className="flex flex-col gap-3">
            {groupsInPhase.map((g) => (
              <div key={g.id}>
                <div className="t-lbl mb-1.5">{g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.flows
                    .filter((f) => f.groupId === g.id)
                    .map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        data-testid={`atlas-flow-${f.id}`}
                        title={flowDotTitle(f)}
                        onClick={() => selectFlow(f.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-[12.5px] ${
                          f.id === selectedFlowId ? "border-primary bg-primary-soft" : "border-line bg-surface"
                        }`}
                      >
                        <i
                          className="w-[6px] h-[6px] rounded-full flex-none"
                          style={{ background: flowDotColor(f) }}
                        />
                        {f.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
          {/* Legend — CHỮ giữ ĐÚNG nguyên văn prototype dòng 3401-3403, không diễn giải lại. */}
          <div className="flex gap-4 flex-wrap text-[12px] text-ink-2 mt-3">
            <span className="inline-flex items-center gap-1.5">
              <i className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "var(--primary)" }} />
              có dữ liệu quan sát
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "var(--ink3)" }} />
              có sơ đồ nguồn, chưa đo
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: "#D6D1CB" }} />
              chờ nguồn
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Flow detail card — JourneySpine nếu có bước, ghi chú trung thực nếu flow chưa vào pilot. */}
      <div className="mb-3.5">
        <Card
          title={currentFlow.name}
          subtitle={`${currentFlow.owner} · ${currentFlow.version} · ${
            currentFlow.verified ? `Nguồn: ${currentFlow.src}` : "chưa có sơ đồ nguồn, cần xác minh"
          }`}
        >
          {flowSteps.length === 0 ? (
            // Rule 3: flow không có bước — nói thẳng đây là CHỦ Ý (chưa vào pilot), không phải mất dữ liệu.
            <Note tone="warn">
              <Badge state="unknown" /> <b>Chưa có dữ liệu quan sát.</b> Flow này đã được map ở mức
              cấu trúc nhưng chưa nằm trong pilot, nên chưa có bước, signal hay số liệu. Đây là chủ ý,
              không phải mất dữ liệu.
              <div className="mt-2">
                Muốn đo flow này thì cần: xác minh sơ đồ nguồn → khai báo bước và stationId →
                instrument signal → chọn chỉ số theo dõi ở màn Chỉ số &amp; ngưỡng.
              </div>
            </Note>
          ) : (
            <>
              {excludedStepCount > 0 ? (
                <div className="mb-3">
                  <Note tone="warn">
                    {`${excludedStepCount} bước không hiện trên xương sống vì chưa có dữ liệu quan sát (obs) — không tự gán 0 để tránh đọc nhầm thành "đã đo được, bằng 0".`}
                  </Note>
                </div>
              ) : null}
              <JourneySpine
                steps={spineSteps}
                selectedId={selectedStepId ?? undefined}
                onSelect={setSelectedStepId}
                covMin={cfg.step.covMin}
              />
            </>
          )}
        </Card>
      </div>

      {/* 4. Hồ sơ bước — chỉ hiện khi có bước đang chọn. */}
      {selectedStep && selectedObs ? (
        <div data-testid="atlas-inspector">
          <AtlasStepInspector
            step={selectedStep}
            obs={selectedObs}
            cfg={cfg}
            touchpoints={inspectorTouchpoints}
            signals={inspectorSignals}
            dims={dims}
            sigCounts={data.sigCounts}
          />
        </div>
      ) : null}
    </div>
  );
}
