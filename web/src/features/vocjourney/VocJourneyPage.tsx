import { useState } from "react";
import type { Step } from "../../data/schema/index.ts";
import {
  coverageGapLine,
  evidenceAtStep,
  flowStepsCopied,
  phaseIdOfFlow,
  phaseLockNote,
  quietButVoicedSteps,
  sentimentAtStep,
  themeRowsAtStep,
  voiceCountAtPhase,
} from "../../domain/index.ts";
import { Badge, Card, Note } from "../../design-system/index.ts";
import { nf } from "../../design-system/format.ts";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { VocTouchpointInspector } from "./VocTouchpointInspector.tsx";

/* VoC theo hành trình #/vocjourney — port V.vocjourney (prototype dòng 2671-2759).

   CÙNG BA NHỊP ĐIỀU HƯỚNG với bản đồ hành trình (phase → flow → chuỗi điểm chạm) nhưng đo thứ
   khác: #/atlas đo HÀNH VI (bao nhiêu người vào, hoàn tất, rơi), màn này đo TIẾNG NÓI (khách nói
   gì ở đó, sắc thái ra sao). Đặt cạnh nhau mới lộ ra thứ không màn nào thấy một mình — xem ghi chú
   "Đối chiếu hai lớp" cuối card chuỗi điểm chạm, `quietButVoicedSteps` sinh ra nó.

   PHẠM VI PILOT DÙNG CHUNG với bản đồ hành trình (domain/pilotScope.ts). Hai màn có cùng rail
   phase; màn này khoá thì màn kia cũng khoá, không có bản sao thứ hai để trôi.

   BA CHỖ CỐ Ý KHÔNG PORT:
   · Đoạn dẫn cách đọc (dòng 2695) — bỏ, cùng lý do đã bỏ ở bản đồ hành trình: nó dạy cách đọc một
     thứ nằm ngay bên dưới và tự nói được. Câu luận đề (2694) LÚC PORT thì giữ vì đó là nội dung,
     nói ra màn này khác bản đồ hành trình ở chỗ nào — nhưng owner sau đó bỏ khối câu mở đầu trên
     MỌI màn (06/08), nên câu này KHÔNG còn in trên màn nữa; xem chỗ đánh dấu ngay trên `PageTitle`.
   · Banner "bạn vừa mở từ node …" (2697-2701) — nó đọc `ST.sel.vocTax`, đặt bởi màn Topic. Bản
     React chưa có màn Topic nào đặt được giá trị đó, nên nhánh này không tới được. Port một nhánh
     chết là để nó mục đi trước khi có ai dùng.
   · Số "phản hồi" của taxonomy trên rail (2709). Rail nay mang ĐÚNG MỘT ĐƠN VỊ — bằng chứng mẫu,
     cùng đơn vị với spine bên dưới. Lý do dài ở docblock domain/vocJourney.ts; tóm tắt: taxonomy
     khai phase "04 Giao dịch" 1.900 phản hồi trong khi phase đó chỉ có 51 bằng chứng gắn tới điểm
     chạm, nên để nguyên số đó trên rail là hứa gấp gần bốn mươi lần thứ mở ra đọc được. Con số của
     taxonomy
     vẫn hiện, nhưng ở chỗ nó có nghĩa: câu nói ra khoảng cách giữa hai mẫu số. */

export function VocJourneyPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);

  /* Mặc định mở flow đầu tiên CÓ BẰNG CHỨNG, không phải flow đầu tiên đã chép bước: màn này đo tiếng
     nói, mà một flow đo được hành vi vẫn có thể chưa có tiếng nói nào. Tra bằng dữ liệu thay vì
     hardcode id fixture. */
  const defaultFlow =
    data.flows.find((f) => data.steps.some((s) => s.flowId === f.id && evidenceAtStep(data, s.id).length > 0)) ??
    data.flows.find((f) => flowStepsCopied(f, data.steps)) ??
    data.flows[0];

  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() =>
    defaultFlow ? phaseIdOfFlow(defaultFlow, data.groups) : "",
  );
  const [selectedFlowId, setSelectedFlowId] = useState<string>(() => defaultFlow?.id ?? "");
  // Chưa chọn điểm chạm nào khi mới vào màn — hồ sơ CHỈ hiện khi bấm chọn (cùng rule 4 với #/atlas).
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [lockedNote, setLockedNote] = useState<string | null>(null);

  function selectPhase(phaseId: string) {
    setSelectedPhaseId(phaseId);
    const flowsInPhase = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === phaseId);
    setSelectedFlowId(flowsInPhase[0]?.id ?? "");
    setSelectedStepId(null);
    setLockedNote(null);
  }
  function selectFlow(flowId: string) {
    setSelectedFlowId(flowId);
    setSelectedStepId(null);
    setLockedNote(null);
  }

  const currentPhase = data.phases.find((p) => p.id === selectedPhaseId);
  const currentFlow = data.flows.find((f) => f.id === selectedFlowId);
  const groupsInPhase = data.groups.filter((g) => g.phaseId === selectedPhaseId);
  const flowsInPhaseCount = data.flows.filter((f) => phaseIdOfFlow(f, data.groups) === selectedPhaseId).length;

  const flowSteps: Step[] = currentFlow ? data.steps.filter((s) => s.flowId === currentFlow.id) : [];
  const selectedStep = flowSteps.find((s) => s.id === selectedStepId) ?? null;

  if (!currentPhase) {
    return (
      <div className="p-8">
        <Note tone="crit">Không tìm được phase hợp lệ cho lựa chọn hiện tại.</Note>
      </div>
    );
  }

  const quiet = quietButVoicedSteps(data, cfg, flowSteps);
  const stepsWithVoice = flowSteps.filter((s) => evidenceAtStep(data, s.id).length > 0);

  return (
    <div className="p-8">
      {/* Chỗ này từng là câu luận đề port từ prototype dòng 2694 ("Bản đồ hành trình đo hành vi.
          Màn này đo tiếng nói tại cùng những điểm chạm đó"). Owner bỏ khối câu mở đầu trên mọi màn
          06/08, để lại đúng tên tab. Câu đó là lý lẽ THIẾT KẾ — nó thuộc về tài liệu, không phải
          thứ người dùng phải đọc lại mỗi lần mở màn; nội dung đã ghi ở docs/DB-FIRST-HANDOFF.md. */}
      <PageTitle route="vocjourney" />

      {/* 1. Rail phase — MỘT đơn vị: bằng chứng mẫu gắn tới điểm chạm trong phase. */}
      <div
        className="grid gap-[7px] mb-3.5"
        style={{ gridTemplateColumns: `repeat(${data.phases.length}, minmax(0, 1fr))` }}
        data-testid="voc-phase-rail"
      >
        {data.phases.map((p) => {
          const on = p.id === selectedPhaseId;
          const lockReason = phaseLockNote(data, p) ?? undefined;
          const voice = voiceCountAtPhase(data, p.id);
          const groupCount = data.groups.filter((g) => g.phaseId === p.id).length;
          return (
            <button
              key={p.id}
              type="button"
              data-testid={`voc-phase-${p.id}`}
              /* aria-disabled chứ không `disabled` thật — cùng lý do ở #/atlas: phase ngoài pilot
                 phải HIỆN MỜ để biết nó tồn tại, và bấm được để đọc lý do. */
              aria-disabled={lockReason ? true : undefined}
              aria-pressed={on}
              title={lockReason ?? `${p.name} · ${groupCount} nhóm`}
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
              <div className="text-[12.5px] font-semibold mt-1.5 mb-2 leading-[1.28] min-h-[33px]">{p.name}</div>
              {/* "chưa gắn bằng chứng nào" ≠ "0 bằng chứng": số 0 đọc như một phép đo, chữ thì không. */}
              <div className="text-[12px] text-ink-3">
                {voice === 0 ? "chưa gắn bằng chứng nào" : `${nf(voice)} bằng chứng mẫu`} · {groupCount} nhóm
              </div>
            </button>
          );
        })}
      </div>

      <div className={lockedNote ? "mb-3.5" : ""} data-testid="voc-phase-note" aria-live="polite">
        {lockedNote ? <Note tone="warn">{lockedNote}</Note> : null}
      </div>

      {/* 2. Card flow — chip theo nhóm, kèm câu nói ra khoảng cách giữa hai mẫu số. */}
      <div className="mb-3.5">
        <Card
          title={`${currentPhase.code} · ${currentPhase.name}`}
          denomStrip={`Đang hiện Top ${flowsInPhaseCount} trên ${data.flows.length} flow`}
        >
          <div className="mb-3" data-testid="voc-gap-line">
            <Note>{coverageGapLine(data, currentPhase.id)}</Note>
          </div>
          <div className="flex flex-wrap gap-5">
            {groupsInPhase.map((g) => (
              <div key={g.id}>
                <div className="t-lbl mb-1.5">{g.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {data.flows
                    .filter((f) => f.groupId === g.id)
                    .map((f) => {
                      const on = f.id === selectedFlowId;
                      const n = data.steps
                        .filter((s) => s.flowId === f.id)
                        .reduce((a, s) => a + evidenceAtStep(data, s.id).length, 0);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          data-testid={`voc-flow-${f.id}`}
                          title={n === 0 ? "Chưa có bằng chứng mẫu nào ở flow này" : `${nf(n)} bằng chứng mẫu`}
                          aria-pressed={on}
                          onClick={() => selectFlow(f.id)}
                          className={`inline-flex items-center gap-[7px] px-[11px] py-1.5 rounded-[9px] border text-[12.5px] font-semibold ${
                            on ? "border-primary bg-primary text-white" : "border-line bg-surface hover:bg-surface-2"
                          }`}
                        >
                          {f.name}
                          {n > 0 ? <b className="font-mono text-[12px] font-bold">{nf(n)}</b> : null}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 3. Chuỗi điểm chạm của flow đang chọn. */}
      {currentFlow ? (
        <div className="mb-3.5">
          <Card
            title={currentFlow.name}
            /* Luật 11/08: bỏ câu ngắn giải thích dưới title. Nhánh CÓ bước trước đây nói "Chuỗi điểm
               chạm — mỗi thẻ hiện tiếng nói tại đó" — đó là dạy cách đọc, bỏ. Nhánh KHÔNG bước phải
               GIỮ: "chưa nằm trong pilot" là sự thật về trạng thái, và là câu duy nhất trên màn nói
               vì sao khối này trống. Bỏ cả prop là xoá luôn nhánh thứ hai. */
            subtitle={flowSteps.length ? undefined : "Flow này chưa nằm trong pilot"}
            denomStrip={
              flowSteps.length > 0
                ? `Đang hiện ${stepsWithVoice.length} trên ${flowSteps.length} điểm chạm có bằng chứng mẫu`
                : undefined
            }
          >
            {flowSteps.length === 0 ? (
              // luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu
              <Note tone="warn">
                <Badge state="unknown" /> Chưa có phản hồi gán vào flow này. Flow chưa nằm trong
                pilot.
              </Note>
            ) : (
              <>
                <div className="flex gap-2.5 overflow-x-auto pb-1" data-tour="voc-spine" data-testid="voc-spine">
                  {flowSteps.map((s) => {
                    const evs = evidenceAtStep(data, s.id);
                    const sen = sentimentAtStep(evs);
                    const top = themeRowsAtStep(data, evs)[0];
                    const on = s.id === selectedStepId;
                    /* Ba nghĩa tách hẳn nhau: CHƯA ĐO (không bằng chứng nào) tô trung tính; đã đo và
                       âm thì watch/crit; đã đo và không âm thì ok. Gộp "chưa đo" vào "ok" là để một
                       điểm mù trông y hệt một điểm chạm khoẻ. */
                    const tone =
                      sen === null
                        ? { border: "var(--line)", color: "var(--ink3)" }
                        : sen < -0.5
                          ? { border: "var(--crit-line)", color: "var(--crit)" }
                          : sen < 0
                            ? { border: "var(--watch-line)", color: "var(--watch)" }
                            : { border: "var(--line)", color: "var(--good)" };
                    return (
                      <button
                        key={s.id}
                        type="button"
                        data-testid={`voc-step-${s.id}`}
                        aria-pressed={on}
                        onClick={() => setSelectedStepId(on ? null : s.id)}
                        className="text-left rounded-[11px] border bg-surface px-3 py-2.5 min-w-[176px] flex-none hover:bg-surface-2"
                        style={{
                          borderColor: tone.border,
                          boxShadow: on ? "0 0 0 3px var(--primary-ring)" : undefined,
                        }}
                      >
                        <div className="font-mono text-[11.5px] text-ink-3">
                          {s.code} · {s.stationId}
                        </div>
                        <div className="text-[12.5px] font-semibold mt-1 mb-2 leading-[1.28] min-h-[32px]">
                          {s.name}
                        </div>
                        {evs.length === 0 ? (
                          <div className="text-[12px] text-ink-3">chưa có bằng chứng mẫu</div>
                        ) : (
                          <>
                            <div className="font-mono text-[17px] font-bold leading-none">{nf(evs.length)}</div>
                            <div className="text-[11.5px] text-ink-3 mt-1">bằng chứng mẫu</div>
                            <div className="text-[11.5px] text-ink-3 mt-2">
                              Sentiment{" "}
                              <b className="font-mono" style={{ color: tone.color }}>
                                {`${sen !== null && sen > 0 ? "+" : ""}${(sen ?? 0).toFixed(1).replace(".", ",")}`}
                              </b>
                            </div>
                            <div className="text-[11.5px] text-ink-3 truncate">{top ? top.name : "chưa có topic"}</div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Đối chiếu hai lớp — nội dung thật của màn này, sinh từ dữ liệu + ngưỡng, không
                    ghim mã bước nào. */}
                <div className="mt-3.5" data-testid="voc-two-layer">
                  <Note>
                    <b>Đối chiếu hai lớp:</b>{" "}
                    {quiet.length > 0 ? (
                      <>
                        {quiet.length === 1 ? "bước " : "các bước "}
                        <b>{quiet.map((s) => `${s.code} ${s.name}`).join(" · ")}</b> có mọi tiêu chí
                        hành vi <b>trong ngưỡng</b> nên trên bản đồ hành trình trông ổn — nhưng vẫn có
                        phản hồi dồn vào đó. Hành vi im lặng không có nghĩa là không có vấn đề.
                      </>
                    ) : (
                      <>
                        mọi điểm chạm có tiếng nói đều đã vượt ngưỡng theo dõi trên bản đồ hành trình —
                        hai lớp đang nói cùng một điều.
                      </>
                    )}
                    {/* luật 11/08: bỏ hướng dẫn "Xem lớp hành vi ở Bản đồ hành trình" */}
                  </Note>
                </div>
              </>
            )}
          </Card>
        </div>
      ) : null}

      {/* 4. Hồ sơ điểm chạm — chỉ hiện khi đã bấm chọn. */}
      {selectedStep ? (
        <div data-tour="voc-inspector">
          <VocTouchpointInspector
            key={selectedStep.id}
            step={selectedStep}
            evs={evidenceAtStep(data, selectedStep.id)}
            ins={data.ins.filter((i) => i.step === selectedStep.id)}
            data={data}
            evTotal={data.ev.length}
          />
        </div>
      ) : null}
    </div>
  );
}
