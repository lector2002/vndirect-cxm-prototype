import { useState } from "react";
import type { Flow, Obs, Step } from "../../data/schema/index.ts";
import {
  flowHasSourceCitation,
  flowStepsCopied,
  fx,
  lockReasonForPhase,
  phaseIdOfFlow,
  stepState,
  stepWhy,
} from "../../domain/index.ts";
import { Badge, Card, JourneySpine, Note } from "../../design-system/index.ts";
import type { SpineStep } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { AtlasStepInspector } from "./AtlasStepInspector.tsx";

/* Bản đồ hành trình #/atlas — port CẤU TRÚC (không phải điều khiển toàn cục ST.sel.*) của V.atlas
   (prototype output/cxm-platform-prototype.html dòng 3362-3420): rail phase → card flow (chip theo
   nhóm) → card chi tiết flow (JourneySpine) → hồ sơ bước (AtlasStepInspector, CHỈ tab tín hiệu — xem
   docblock file đó). Ba lựa chọn (phase/flow/step) là state LOCAL của màn này (rule 4 contract) — Zustand
   store không có state lựa chọn nào (store/store.ts) và feature khác cũng không đặt nó ở store, nên
   không đặt case lệ ở đây.

   05/08 — owner: "hiển thị giống với cách prototype đang làm nhưng tạm thời lock các stage ko pilot
   lại". Hai việc, làm cùng lượt:
   · Bù ba chỗ bản React còn thiếu so với V.atlas: hero đếm flow/phase (dòng 3374), đoạn dẫn đọc cách
     xem dải nối + trỏ sang VoC theo hành trình (3375), và chip mẫu số trên hai card (chead, 3390/3410).
     Rail đổi từ cuộn ngang sang LƯỚI CHIA ĐỀU như .prail (271).
   · Khoá phase ngoài pilot. "Stage" đọc là PHASE (rail trên cùng) — trong bản đồ hành trình đây là
     cấp duy nhất mang nghĩa "giai đoạn"; bước gọi là "bước" và mọi bước trong seed đều đã có obs nên
     không có bước nào "ngoài pilot" để khoá. Chip flow ngoài pilot CỐ Ý vẫn bấm được: chúng dẫn tới
     ghi chú "chưa nằm trong pilot" — nội dung có chủ ý, prototype cũng vậy.

   Cùng ngày, owner thu hẹp tiếp: "hide cả phần giao dịch đi, chỉ lấy dòng tiền và mở tk thôi" —
   phạm vi còn ĐÚNG hai phase, xem PILOT_PHASE_CODES ở domain/pilotScope.ts. "Giao dịch" bị KHOÁ MỜ chứ không gỡ khỏi rail:
   toàn dự án đang theo một luật hiển thị (SplitToggle.tsx:4-8) là thứ ngoài phạm vi phải HIỆN MỜ kèm
   lý do, không biến mất — bản đồ hành trình mà thiếu hẳn một giai đoạn thì bản đồ sai, và ba phase
   ngoài pilot còn lại cũng đang hiện mờ, gỡ riêng một phase là hai luật trong cùng một hàng. */

/** Xám "chờ nguồn" của chấm flow — không có token nào mang đúng nghĩa này (nhạt hơn `--ink3`, đậm
    hơn `--line`), nên nó là hằng ở đây. XUẤT RA để test và chú giải cùng đọc MỘT chỗ: bản trước gõ
    lại mã màu này trong test, nên đổi bảng màu là test đỏ vì một con số bị ghim chứ không phải vì
    luật nào gãy. 12/08 tối: #D6D1CB → #CFC6B6 theo "Giấy đậm"; 18/08: → #C6CDD6 theo "Trung tính lạnh". */
export const FLOW_DOT_PENDING = "#C6CDD6";

/** Màu chấm trạng thái flow trên rail/chip — port dotOf() (prototype dòng 3370). PHÉP SUY ba nhánh là
    port 1-1; hex xám chờ nguồn thì KHÔNG còn: 12\08 tối #D6D1CB (hex prototype) được kéo về "Giấy đậm"
    thành #CFC6B6 — cùng đợt, cùng lý do với hatch #8F2A23 → #7D1A12 ở JourneySpine.tsx.
    07/08 (module-i-signal-registry-charter.md D2/F8): `Flow.observed`/`Flow.verified` bị xoá khỏi
    schema — hai trục suy tại chỗ đọc qua `flowStepsCopied`/`flowHasSourceCitation`
    (domain/state.ts), không đổi kết quả trên cả 32 flow. */
function flowDotColor(f: Flow, steps: readonly Step[]): string {
  return flowStepsCopied(f, steps) ? "var(--primary)" : flowHasSourceCitation(f) ? "var(--ink3)" : FLOW_DOT_PENDING;
}

/** Tooltip chấm — port stateOf() (prototype dòng 3371); KHÁC câu chữ với legend cố định bên dưới
    (dòng 3401-3403) — đây là hai chỗ chữ khác nhau trong chính prototype, giữ đúng cả hai. */
function flowDotTitle(f: Flow, steps: readonly Step[]): string {
  return flowStepsCopied(f, steps)
    ? "Có dữ liệu quan sát"
    : flowHasSourceCitation(f)
      ? "Có nguồn · chưa có dữ liệu"
      : "Chờ nguồn";
}

/* Phạm vi pilot (phase nào mở, phase nào khoá, khoá thì nói lý do gì) đã DỜI sang
   domain/pilotScope.ts ngày 06/08 — màn "VoC theo hành trình" cũng có rail phase và phải khoá y hệt
   màn này. Để mỗi màn giữ một bản sao là mở đường cho chuyện màn này khoá còn màn kia mở. */

export function AtlasPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  // Cần cho AtlasSignalPanel (chart điểm đo, domain/signalChart.ts) — nhãn/unit của năm chiều cố định.
  const dims = useCxmStore((s) => s.dims);

  /* Mặc định mở flow ĐẦU TIÊN đã chép bước — tra bằng `flowStepsCopied` (domain/state.ts) thay vì
     hardcode id fixture, để không gãy nếu seed đổi id. Từ pilot mở rộng 05/08 đã có 6 flow đã chép
     bước (mở TK, mở TK phái sinh, nạp, tra soát nạp, rút, chuyển nội bộ) nên "flow pilot duy nhất"
     không còn đúng; thứ tự mảng `flows` vẫn đưa f-open-2026 lên trước nên màn mặc định không đổi. */
  const defaultFlow = data.flows.find((f) => flowStepsCopied(f, data.steps)) ?? data.flows[0];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() => phaseIdOfFlow(defaultFlow, data.groups));
  const [selectedFlowId, setSelectedFlowId] = useState<string>(() => defaultFlow.id);
  // Rule 4: chưa chọn bước nào khi mới vào màn/mới đổi flow — hồ sơ bước CHỈ hiện khi bấm chọn.
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  /* Bấm vào phase ĐANG KHOÁ → in lý do thành CHỮ ngay dưới rail, không chỉ để trong tooltip. Cùng
     bằng chứng đã buộc phải làm thế ở SplitToggle (05/08): lý do nằm sẵn, đúng chữ, trên `title` của
     chính nút đó mà owner vẫn phải hỏi vì sao không bấm được. Bấm là việc người ta LÀM khi thắc mắc. */
  const [lockedNote, setLockedNote] = useState<string | null>(null);

  // Rule 4: chọn phase → reset flow về một flow TRONG phase đó, reset luôn bước (đổi cả flow lẫn phase).
  function selectPhase(phaseId: string) {
    setSelectedPhaseId(phaseId);
    const flowsInPhase = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === phaseId);
    setSelectedFlowId(flowsInPhase[0]?.id ?? "");
    setSelectedStepId(null);
    setLockedNote(null);
  }
  // Rule 4: chọn flow → reset bước — bước của flow cũ không được lộ ra dưới flow mới.
  function selectFlow(flowId: string) {
    setSelectedFlowId(flowId);
    setSelectedStepId(null);
    setLockedNote(null);
  }

  const currentPhase = data.phases.find((p) => p.id === selectedPhaseId);
  const currentFlow = data.flows.find((f) => f.id === selectedFlowId);
  const groupsInPhase = data.groups.filter((g) => g.phaseId === selectedPhaseId);
  const flowsInPhaseCount = data.flows.filter(
    (f) => phaseIdOfFlow(f, data.groups) === selectedPhaseId,
  ).length;

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
      <PageTitle route="atlas" />

      {/* 0. Ngoài tên tab thì KHÔNG có gì nữa ở đầu màn — owner bỏ 05/08, chốt thành luật chung cho
          mọi màn 06/08 (kèm yêu cầu giữ lại tên tab).

          Prototype mở màn bằng một dòng đếm ("32 flow trên 6 phase…") và một đoạn hướng dẫn đọc
          ("Chọn phase ở hàng trên…", "bề dày dải nối cho biết…"). Cả hai đã bỏ theo yêu cầu owner:
          ba con số đếm không trả lời câu hỏi nào người dùng đang có, còn đoạn hướng dẫn thì dạy cách
          đọc một thứ nằm ngay bên dưới và tự nói được — đọc xong vẫn phải nhìn xuống.

          Hai thứ trong đoạn cũ có nội dung thật, và cả hai đều KHÔNG mất theo: lý do bốn phase bị
          khoá vẫn hiện thành chữ khi bấm vào phase mờ (`lockedNote`, xem rail bên dưới), và đường
          sang VoC theo hành trình vẫn nằm ở điều hướng trái. */}

      {/* 1. Phase rail — một nút mỗi phase, chấm theo flow, đếm flow. Lưới CHIA ĐỀU (port .prail,
          prototype dòng 271): prototype ghim repeat(7,...) cho 7 phase thời đó, ở đây suy theo số
          phase thật (seed nay còn 6) để vẫn thấy hết trong một màn, không phải kéo ngang. */}
      <div
        className="grid gap-[7px] mb-3.5"
        style={{ gridTemplateColumns: `repeat(${data.phases.length}, minmax(0, 1fr))` }}
        data-testid="atlas-phase-rail"
        /* Mốc tour — `seedTour` khai sẵn ba selector cho màn này (seed.ts:934-936). Gắn được từ
           05/08 vì câu cuối của tour ("Hồ sơ bước — 3 tab") nay đã ĐÚNG; trước đó màn chỉ có 1 tab
           nên gắn vào là để tour nói sai. Bộ máy tour dựng ở features/tour/TourOverlay.tsx.
           LƯU Ý: chỉ mốc này luôn có mặt. `atlas-spine` cần flow đang chọn CÓ bước, `atlas-inspector`
           cần đã chọn một bước — mà rule 4 nói mới vào màn thì chưa chọn bước nào. Đó là chủ ý, và
           TourOverlay có nhánh nói ra khi không tô sáng được. Đừng tự chọn sẵn bước để tour đẹp. */
        data-tour="atlas-prail"
      >
        {data.phases.map((p) => {
          const flowsOfP = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === p.id);
          const on = p.id === selectedPhaseId;
          const lockReason = lockReasonForPhase(p, data.flows, data.groups, data.steps) ?? undefined;
          return (
            <button
              key={p.id}
              type="button"
              data-testid={`atlas-phase-${p.id}`}
              /* aria-disabled chứ KHÔNG phải `disabled` thật: owner muốn phase ngoài pilot HIỆN MỜ
                 để biết nó tồn tại và biết vì sao chưa mở. `disabled` thật thì nút rơi khỏi tab
                 order, phần lớn screen reader bỏ qua, và lý do trở thành không tới được. */
              aria-disabled={lockReason ? true : undefined}
              aria-pressed={on}
              title={lockReason ?? `${p.name} · ${flowsOfP.length} flow`}
              onClick={lockReason ? () => setLockedNote(lockReason) : () => selectPhase(p.id)}
              style={on ? { boxShadow: "0 0 0 3px var(--primary-ring)" } : undefined}
              className={`text-left rounded-[11px] border px-[11px] py-2.5 ${
                on
                  ? "border-primary bg-primary-soft"
                  : lockReason
                    ? "border-line bg-surface opacity-45 cursor-not-allowed"
                    : "border-line bg-surface hover:border-primary-line hover:bg-primary-soft"
              }`}
            >
              <div className="font-mono text-[12px] font-bold text-ink-3 tracking-[0.08em]">{p.code}</div>
              {/* min-h giữ ba dòng của mọi ô thẳng hàng dù tên phase dài ngắn khác nhau (port .pn). */}
              <div className="text-[12.5px] font-semibold mt-1.5 mb-2 leading-[1.28] min-h-[33px]">
                {p.name}
              </div>
              {/* Hàng chấm cho XUỐNG DÒNG, số flow thì KHÔNG. Prototype (.pd, dòng 277) để một hàng
                  vì phase đông nhất thời đó chỉ vài flow; seed nay có phase 16 flow — 16 chấm trong
                  một cột rộng ~186px ép chữ "16 flow" vỡ làm hai dòng. Cho chấm quấn dòng thay vì
                  cắt bớt: cắt là giấu mất flow, mà hàng chấm chính là chỗ đọc ra phase đo tới đâu.
                  Ô trong lưới tự kéo bằng nhau nên một phase quấn hai hàng không làm rail lệch. */}
              <div className="flex items-end gap-1">
                <div className="flex flex-wrap items-center gap-[3px] min-w-0">
                  {flowsOfP.map((f) => (
                    <i
                      key={f.id}
                      className="w-[7px] h-[7px] rounded-full flex-none"
                      style={{ background: flowDotColor(f, data.steps) }}
                    />
                  ))}
                </div>
                <span className="text-[12px] text-ink-3 font-semibold ml-auto whitespace-nowrap">{`${flowsOfP.length} flow`}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vùng live LUÔN có mặt trong DOM (chỉ nội dung mới đổi): một vùng aria-live vừa được gắn vào
          cùng lúc với chữ thì screen reader thường không đọc — phải có sẵn từ trước để nghe thay đổi. */}
      <div
        className={lockedNote ? "mb-3.5" : ""}
        data-testid="atlas-phase-note"
        aria-live="polite"
      >
        {lockedNote ? <Note tone="warn">{lockedNote}</Note> : null}
      </div>

      {/* 2. Flow card — chip theo nhóm trong phase đang chọn, kèm legend chấm. */}
      <div className="mb-3.5">
        <Card
          title={`${currentPhase.code} · ${currentPhase.name}`}
          /* Port chip mẫu số của chead() (prototype dòng 3390) — ở React nó là dải denomStrip dưới
             header. 25/08 (owner, quét AI-slop): chỉ hiện khi phase THẬT SỰ là tập con — N/N là
             nói lại chính hàng chip bên dưới. */
          denomStrip={
            flowsInPhaseCount < data.flows.length
              ? `Đang hiện Top ${flowsInPhaseCount} trên ${data.flows.length} flow`
              : undefined
          }
        >
          <div className="flex flex-wrap gap-5">
            {groupsInPhase.map((g) => (
              <div key={g.id}>
                <div className="t-lbl mb-1.5">{g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.flows
                    .filter((f) => f.groupId === g.id)
                    .map((f) => {
                      const on = f.id === selectedFlowId;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          data-testid={`atlas-flow-${f.id}`}
                          title={flowDotTitle(f, data.steps)}
                          aria-pressed={on}
                          onClick={() => selectFlow(f.id)}
                          /* Chip ĐANG CHỌN tô ĐẶC màu chính, chữ trắng (port .fchips button.on,
                             prototype dòng 285) — bản cũ chỉ đổi viền + nền nhạt nên ở một hàng
                             chục chip rất khó thấy đang đứng ở chip nào. */
                          className={`inline-flex items-center gap-[7px] px-[11px] py-1.5 rounded-[9px] border text-[12.5px] font-semibold ${
                            on
                              ? "border-primary bg-primary text-white"
                              : "border-line bg-surface hover:bg-surface-2"
                          }`}
                        >
                          <i
                            className="w-[7px] h-[7px] rounded-full flex-none"
                            style={{
                              background: flowDotColor(f, data.steps),
                              // Viền trắng để chấm không chìm vào nền cam của chip đang chọn.
                              boxShadow: on ? "0 0 0 2px rgba(255,255,255,.55)" : undefined,
                            }}
                          />
                          {f.name}
                        </button>
                      );
                    })}
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
              <i className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: FLOW_DOT_PENDING }} />
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
            flowHasSourceCitation(currentFlow) ? `Nguồn: ${currentFlow.src}` : "chưa có sơ đồ nguồn, cần xác minh"
          }`}
          /* Mẫu số là số bước THẬT của flow, tử số là số bước lên được xương sống, để rule 2 (loại
             bước chưa có obs) đọc được ngay trên dải chứ không chỉ trong ghi chú. 25/08 (owner, quét
             AI-slop): dải chỉ hiện khi hai số LỆCH nhau — "N trên N bước" (mọi bước đã đo) lẫn
             "0 trên 0" (chưa vào pilot) đều là nói lại thứ đã thấy. */
          denomStrip={
            stepsWithObs.length < flowSteps.length
              ? `Đang hiện Top ${stepsWithObs.length} trên ${flowSteps.length} bước có dữ liệu quan sát`
              : undefined
          }
        >
          {flowSteps.length === 0 ? (
            // Rule 3: flow không có bước — nói thẳng đây là CHỦ Ý (chưa vào pilot), không phải mất dữ liệu.
            <Note tone="warn">
              {/* luật 11/08: bỏ "Đây là chủ ý, không phải mất dữ liệu." và đoạn hướng dẫn "Muốn đo flow này thì cần..." */}
              <Badge state="unknown" /> <b>Chưa có dữ liệu quan sát.</b> Flow này đã được map ở mức
              cấu trúc nhưng chưa nằm trong pilot, nên chưa có bước, signal hay số liệu.
            </Note>
          ) : (
            <>
              {excludedStepCount > 0 ? (
                <div className="mb-3">
                  <Note tone="warn">
                    {/* luật 11/08: bỏ vế "không tự gán 0 để tránh đọc nhầm thành đã đo được, bằng 0" */}
                    {`${excludedStepCount} bước không hiện trên xương sống vì chưa có dữ liệu quan sát (obs).`}
                  </Note>
                </div>
              ) : null}
              <div data-tour="atlas-spine">
                <JourneySpine
                  steps={spineSteps}
                  selectedId={selectedStepId ?? undefined}
                  onSelect={setSelectedStepId}
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 4. Hồ sơ bước — chỉ hiện khi có bước đang chọn. */}
      {selectedStep && selectedObs ? (
        <div data-testid="atlas-inspector" data-tour="atlas-inspector">
          <AtlasStepInspector
            step={selectedStep}
            obs={selectedObs}
            cfg={cfg}
            touchpoints={inspectorTouchpoints}
            signals={inspectorSignals}
            dims={dims}
            sigCounts={data.sigCounts}
            metrics={data.metrics}
          />
        </div>
      ) : null}
    </div>
  );
}
