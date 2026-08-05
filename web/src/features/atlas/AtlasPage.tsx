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
   phạm vi còn ĐÚNG hai phase, xem PILOT_PHASE_CODES. "Giao dịch" bị KHOÁ MỜ chứ không gỡ khỏi rail:
   toàn dự án đang theo một luật hiển thị (SplitToggle.tsx:4-8) là thứ ngoài phạm vi phải HIỆN MỜ kèm
   lý do, không biến mất — bản đồ hành trình mà thiếu hẳn một giai đoạn thì bản đồ sai, và ba phase
   ngoài pilot còn lại cũng đang hiện mờ, gỡ riêng một phase là hai luật trong cùng một hàng. */

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

/* PHẠM VI PILOT ĐANG TRÌNH BÀY — owner chốt 05/08: chỉ "Mở tài khoản" và "Dòng tiền".
   Đây là một QUYẾT ĐỊNH phạm vi, KHÔNG suy được từ dữ liệu: "04 Giao dịch" cũng đã có 1 flow được đo
   (1/16) mà owner vẫn để ngoài lượt trình bày này. Nên ghim tường minh, không đoán bằng cờ `observed`
   — đoán thì Giao dịch sẽ tự mở khoá trở lại và không ai biết vì sao.
   Ghim theo `code` của phase (chuỗi "02"/"03" hiện ngay trên rail, ổn định hơn id fixture). */
const PILOT_PHASE_CODES = new Set(["02", "03"]);

/* Lý do một phase bị KHOÁ — MỘT chuỗi duy nhất dùng cho CẢ tooltip lẫn dòng chữ in ra khi bấm. Cùng
   luật với SplitToggle (design-system/SplitToggle.tsx:19-21): chỗ hiển thị không được viết lại lý do
   bằng câu chữ của mình, nếu không hai chỗ trôi khỏi nhau và người đọc gặp hai câu trả lời.

   Câu chữ nói ĐÚNG tình trạng đo của từng phase, không nói bừa "chưa đo gì": phase khoá có hai kiểu
   rất khác nhau — chưa có flow nào được đo (01/05/06) và đã đo một phần nhưng để ngoài lượt này (04). */
function phaseLockReason(phaseName: string, flowCount: number, observedCount: number): string {
  const measured =
    observedCount === 0
      ? `chưa flow nào trong ${flowCount} flow có dữ liệu quan sát`
      : `mới ${observedCount} trên ${flowCount} flow có dữ liệu quan sát`;
  return `${phaseName} tạm khoá vì chưa nằm trong phạm vi pilot đang trình bày (${measured}).`;
}

export function AtlasPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  // Cần cho AtlasSignalPanel (chart điểm đo, domain/signalChart.ts) — nhãn/unit của năm chiều cố định.
  const dims = useCxmStore((s) => s.dims);

  /* Mặc định mở flow ĐẦU TIÊN đang có dữ liệu quan sát — tra bằng `observed` thay vì hardcode id
     fixture, để không gãy nếu seed đổi id. Từ pilot mở rộng 05/08 đã có 6 flow `observed` (mở TK, mở
     TK phái sinh, nạp, tra soát nạp, rút, chuyển nội bộ) nên "flow pilot duy nhất" không còn đúng;
     thứ tự mảng `flows` vẫn đưa f-open-2026 lên trước nên màn mặc định không đổi. */
  const defaultFlow = data.flows.find((f) => f.observed) ?? data.flows[0];

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

  // Ba số của hero + số phase đang khoá cho đoạn dẫn — đếm từ dữ liệu, không ghim hằng.
  const verifiedCount = data.flows.filter((f) => f.verified).length;
  const observedCount = data.flows.filter((f) => f.observed).length;
  const lockedPhaseCount = data.phases.filter((p) => !PILOT_PHASE_CODES.has(p.code)).length;

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
      {/* 0. Hero + đoạn dẫn — port prototype dòng 3374-3375. Số đếm suy từ dữ liệu, không viết tay. */}
      <h1 className="t-hero max-w-[38ch] mb-2">
        {`${data.flows.length} flow trên ${data.phases.length} phase, ${verifiedCount} flow có nguồn xác minh, ${observedCount} flow đang có dữ liệu quan sát.`}
      </h1>
      <p className="t-meta max-w-[92ch] mb-4">
        Chọn phase ở hàng trên, chọn nhóm sản phẩm và flow ở hàng dưới, rồi đọc chuỗi bước theo chiều
        ngang. Bề dày dải nối cho biết <b>còn bao nhiêu khách đi tiếp</b>; vạch đỏ cho biết{" "}
        <b>rơi bao nhiêu ở bước trước đó</b>. Màn này đo <b>hành vi</b>; tiếng nói của khách tại cùng
        những điểm chạm này nằm ở <a href="#/vocjourney">VoC theo hành trình</a>.
        {lockedPhaseCount > 0 ? (
          /* Nói ngay ở đoạn dẫn vì sao rail có ô mờ — nếu không, ô mờ trông như lỗi hiển thị chứ
             không như một quyết định phạm vi. */
          <>
            {" "}
            {/* KHÔNG viết "chưa có flow nào được đo": trong bốn phase khoá có Giao dịch, đã đo 1/16.
                Câu chung phải đúng cho cả bốn, chi tiết từng phase để dành cho lý do khi bấm. */}
            {`${lockedPhaseCount} phase đang khoá vì nằm ngoài phạm vi pilot đang trình bày`} — bấm
            vào một phase khoá để xem lý do.
          </>
        ) : null}
      </p>

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
          const lockReason = PILOT_PHASE_CODES.has(p.code)
            ? undefined
            : phaseLockReason(p.name, flowsOfP.length, flowsOfP.filter((f) => f.observed).length);
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
                      style={{ background: flowDotColor(f) }}
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
          subtitle="Chọn một flow để mở chuỗi bước"
          /* Port chip mẫu số của chead() (prototype dòng 3390) — ở React nó là dải denomStrip dưới
             header, đúng chỗ 9 block Overview đang dùng, không phải góc phải header. */
          denomStrip={`Đang hiện Top ${flowsInPhaseCount} trên ${data.flows.length} flow`}
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
                          title={flowDotTitle(f)}
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
                              background: flowDotColor(f),
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
          /* Prototype in "N trên N bước" (dòng 3410) — luôn đầy, nên không nói gì. Ở đây mẫu số là
             số bước THẬT của flow, tử số là số bước lên được xương sống, để rule 2 (loại bước chưa
             có obs) đọc được ngay trên dải chứ không chỉ trong ghi chú. Flow chưa vào pilot không có
             dải: "0 trên 0 bước" chỉ gây nhiễu (cùng lý do QuantifyWidget bỏ dải khi không cắt gì). */
          denomStrip={
            flowSteps.length > 0
              ? `Đang hiện Top ${stepsWithObs.length} trên ${flowSteps.length} bước có dữ liệu quan sát`
              : undefined
          }
        >
          {flowSteps.length === 0 ? (
            // Rule 3: flow không có bước — nói thẳng đây là CHỦ Ý (chưa vào pilot), không phải mất dữ liệu.
            <Note tone="warn">
              <Badge state="unknown" /> <b>Chưa có dữ liệu quan sát.</b> Flow này đã được map ở mức
              cấu trúc nhưng chưa nằm trong pilot, nên chưa có bước, signal hay số liệu. Đây là chủ ý,
              không phải mất dữ liệu.
              <div className="mt-2">
                Muốn đo flow này thì cần: xác minh sơ đồ nguồn → khai báo bước và stationId →
                instrument signal → chọn chỉ số theo dõi ở màn{" "}
                <a href="#/rules">Chỉ số &amp; ngưỡng</a>. {/* link port prototype dòng 3413 */}
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
              <div data-tour="atlas-spine">
                <JourneySpine
                  steps={spineSteps}
                  selectedId={selectedStepId ?? undefined}
                  onSelect={setSelectedStepId}
                  covMin={cfg.step.covMin}
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
