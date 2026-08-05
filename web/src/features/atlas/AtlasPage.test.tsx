import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../data/fixtures/seed.ts";
import { fx } from "../../domain/index.ts";
import { nf } from "../../design-system/format.ts";
import { AtlasPage } from "./AtlasPage.tsx";

/* Container dùng store singleton thật (useCxmStore, singleton = demoData) như WorkPage.test.tsx.
   demoData spread NGUYÊN `seed` cho phases/groups/flows/steps/obs/touchpoints/signals (chỉ `cust`
   được sinh thêm — xem data/fixtures/demo.ts dòng 687/695) nên mọi kỳ vọng suy từ `seed` ở đây khớp
   ĐÚNG những gì AtlasPage render từ singleton, không chép hằng tay. */

const pilotFlow = seed.flows.find((f) => f.observed)!;
const pilotGroup = seed.groups.find((g) => g.id === pilotFlow.groupId)!;
const pilotPhase = seed.phases.find((p) => p.id === pilotGroup.phaseId)!;
const pilotSteps = seed.steps.filter((s) => s.flowId === pilotFlow.id);

// Flow không có bước, CÙNG PHASE với pilot (không nhất thiết cùng group — g-open chỉ có 1 flow) —
// để bấm được từ chip đang hiện ngay khi phase mặc định (pilotPhase) đã mở, không cần đổi phase trước.
const noStepFlow = seed.flows.find(
  (f) => f.id !== pilotFlow.id && seed.groups.find((g) => g.id === f.groupId)?.phaseId === pilotPhase.id,
)!;
const obsOf = (stepId: string) => seed.obs.find((o) => o.stepId === stepId)!;

/* Phạm vi pilot owner chốt 05/08: ĐÚNG hai phase "02 Mở tài khoản" và "03 Dòng tiền"; bốn phase còn
   lại khoá mờ trên rail. Test ghim lại chính hai mã đó — nếu ai đó đổi PILOT_PHASE_CODES thì đây là
   chỗ phải đỏ, vì phạm vi trình bày là quyết định của owner chứ không phải chi tiết cài đặt.
   Kéo theo: test "đổi phase" không dùng `phases[0]` được nữa (đó là 01, đang khoá). */
const PILOT_CODES = ["02", "03"];
const phaseIdOfFlow = (f: (typeof seed.flows)[number]) =>
  seed.groups.find((g) => g.id === f.groupId)!.phaseId;

const otherPhase = seed.phases.find((p) => p.id !== pilotPhase.id && PILOT_CODES.includes(p.code))!;
const otherPhaseFlow = seed.flows.find((f) => phaseIdOfFlow(f) === otherPhase.id)!;

/* "04 Giao dịch" — phase khoá ĐÃ CÓ 1 flow đo được (1/16): ca mà lý do khoá không được nói bừa
   "chưa đo gì". Lấy đích danh để test câu chữ hai kiểu, không lấy phase khoá đầu tiên gặp được. */
const lockedPhase = seed.phases.find((p) => p.code === "04")!;
const lockedPhaseFlow = seed.flows.find((f) => phaseIdOfFlow(f) === lockedPhase.id)!;
const emptyLockedPhase = seed.phases.find((p) => p.code === "01")!;

/* Bước KHÔNG CÓ điểm đo nào — khác hẳn bước có điểm đo mà chưa nuôi chỉ số, và cũng có thật trong
   pilot (đo trên seed 05/08). Phải kèm obs, vì spine chỉ dựng bước đã có obs. */
const signalsOfStep = (stepId: string) => {
  const tps = seed.touchpoints.filter((t) => t.stepId === stepId);
  return seed.signals.filter((g) => tps.some((t) => t.id === g.tpId));
};
const noSignalStep = seed.steps.find((s) => {
  const f = seed.flows.find((x) => x.id === s.flowId)!;
  if (!PILOT_CODES.includes(seed.phases.find((p) => p.id === phaseIdOfFlow(f))!.code)) return false;
  return signalsOfStep(s.id).length === 0 && seed.obs.some((o) => o.stepId === s.id);
})!;
const noSignalFlow = seed.flows.find((f) => f.id === noSignalStep?.flowId)!;
const noSignalPhase = seed.phases.find((p) => p.id === phaseIdOfFlow(noSignalFlow))!;

describe("AtlasPage — #/atlas", () => {
  it("hiện rail phase; bấm một phase khác đổi tập flow đang chào (rule: phase → flow trong phase đó)", () => {
    render(<AtlasPage />);
    expect(screen.getByTestId(`atlas-phase-${pilotPhase.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`atlas-phase-${otherPhase.id}`)).toBeInTheDocument();
    // Mặc định mở phase của flow đang observed (pilot) — chip flow của phase đó có mặt.
    expect(screen.getByTestId(`atlas-flow-${pilotFlow.id}`)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`atlas-phase-${otherPhase.id}`));

    expect(screen.queryByTestId(`atlas-flow-${pilotFlow.id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`atlas-flow-${otherPhaseFlow.id}`)).toBeInTheDocument();
  });

  /* Owner 05/08: "tạm thời lock các stage ko pilot lại để ko bấm được nữa". Ba khẳng định phải cùng
     đúng thì mới gọi là khoá tử tế: nút KHÔNG mất khỏi màn, bấm KHÔNG đổi được lựa chọn, và người
     bấm ĐỌC ĐƯỢC vì sao — bài học 05/08 từ chip chia màu: lý do chỉ nằm trong tooltip thì owner vẫn
     phải hỏi. */
  it("phase ngoài pilot bị khoá: vẫn hiện, báo aria-disabled, bấm không đổi tập flow", () => {
    render(<AtlasPage />);
    const locked = screen.getByTestId(`atlas-phase-${lockedPhase.id}`);
    expect(locked).toHaveAttribute("aria-disabled", "true");
    // aria-disabled chứ KHÔNG phải `disabled` thật — nút phải còn trong tab order để lý do tới được
    // người dùng bàn phím / screen reader.
    expect(locked).not.toBeDisabled();

    fireEvent.click(locked);

    // Vẫn đứng nguyên ở phase pilot mặc định: chip của flow pilot còn đó, chip của phase khoá không có.
    expect(screen.getByTestId(`atlas-flow-${pilotFlow.id}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`atlas-flow-${lockedPhaseFlow.id}`)).not.toBeInTheDocument();
  });

  it("bấm phase khoá in LÝ DO thành chữ; chọn một phase mở khoá thì lý do biến mất", () => {
    render(<AtlasPage />);
    const note = screen.getByTestId("atlas-phase-note");
    expect(note).toBeEmptyDOMElement();

    fireEvent.click(screen.getByTestId(`atlas-phase-${lockedPhase.id}`));
    expect(note).toHaveTextContent(
      `${lockedPhase.name} tạm khoá vì chưa nằm trong phạm vi pilot đang trình bày`,
    );
    // Cùng một câu ở tooltip và ở dòng chữ — không được là hai cách nói khác nhau.
    expect(screen.getByTestId(`atlas-phase-${lockedPhase.id}`).getAttribute("title")).toBe(
      note.textContent,
    );

    fireEvent.click(screen.getByTestId(`atlas-phase-${otherPhase.id}`));
    expect(screen.getByTestId("atlas-phase-note")).toBeEmptyDOMElement();
  });

  /* Hai kiểu phase khoá, hai câu chữ khác nhau. Nếu gộp một câu "chưa có dữ liệu quan sát" thì với
     Giao dịch (1/16 flow đã đo) màn đang nói sai về chính dữ liệu của nó. */
  it("lý do khoá nói ĐÚNG tình trạng đo: 'mới 1 trên 16' cho Giao dịch, 'chưa flow nào' cho phase chưa đo", () => {
    render(<AtlasPage />);
    const flowsOf = (pid: string) => seed.flows.filter((f) => phaseIdOfFlow(f) === pid);

    const tx = flowsOf(lockedPhase.id);
    expect(screen.getByTestId(`atlas-phase-${lockedPhase.id}`)).toHaveAttribute(
      "title",
      `${lockedPhase.name} tạm khoá vì chưa nằm trong phạm vi pilot đang trình bày (mới ${
        tx.filter((f) => f.observed).length
      } trên ${tx.length} flow có dữ liệu quan sát).`,
    );

    const empty = flowsOf(emptyLockedPhase.id);
    expect(empty.filter((f) => f.observed)).toHaveLength(0);
    expect(screen.getByTestId(`atlas-phase-${emptyLockedPhase.id}`)).toHaveAttribute(
      "title",
      `${emptyLockedPhase.name} tạm khoá vì chưa nằm trong phạm vi pilot đang trình bày (chưa flow nào trong ${empty.length} flow có dữ liệu quan sát).`,
    );
  });

  it("đúng hai phase 02 và 03 mở khoá, bốn phase còn lại khoá — kể cả phase đã đo một phần", () => {
    render(<AtlasPage />);
    for (const p of seed.phases) {
      const btn = screen.getByTestId(`atlas-phase-${p.id}`);
      expect(btn.getAttribute("aria-disabled")).toBe(PILOT_CODES.includes(p.code) ? null : "true");
    }
    // Guard: hai mã pilot phải thật sự có trong seed — gõ sai mã thì mọi phase khoá hết mà test trên
    // vẫn xanh.
    expect(seed.phases.filter((p) => PILOT_CODES.includes(p.code))).toHaveLength(PILOT_CODES.length);
  });

  /* Ba chỗ bản React trước đây thiếu so với prototype V.atlas (dòng 3374/3390/3410) — port 05/08. */
  it("hero đếm flow/phase và hai card có chip mẫu số, tất cả suy từ dữ liệu", () => {
    render(<AtlasPage />);
    const verified = seed.flows.filter((f) => f.verified).length;
    const observed = seed.flows.filter((f) => f.observed).length;
    expect(
      screen.getByText(
        `${seed.flows.length} flow trên ${seed.phases.length} phase, ${verified} flow có nguồn xác minh, ${observed} flow đang có dữ liệu quan sát.`,
      ),
    ).toBeInTheDocument();

    const strips = screen.getAllByTestId("denom-strip");
    const flowsInPilotPhase = seed.flows.filter((f) => phaseIdOfFlow(f) === pilotPhase.id).length;
    expect(strips[0]).toHaveTextContent(
      `Đang hiện Top ${flowsInPilotPhase} trên ${seed.flows.length} flow`,
    );
    expect(strips[1]).toHaveTextContent(
      `Đang hiện Top ${pilotSteps.length} trên ${pilotSteps.length} bước có dữ liệu quan sát`,
    );
  });

  it("flow chưa vào pilot không có chip mẫu số bước — '0 trên 0 bước' chỉ gây nhiễu", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${noStepFlow.id}`));
    expect(screen.getAllByTestId("denom-strip")).toHaveLength(1);
  });

  it("chọn flow pilot render xương sống đúng 1 thẻ mỗi bước của flow đó", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    for (const s of pilotSteps) {
      expect(screen.getByTestId(`spine-step-${s.id}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^spine-step-/)).toHaveLength(pilotSteps.length);
  });

  it("chọn flow chưa có bước: hiện đúng ghi chú trung thực 'chưa vào pilot', không vẽ xương sống", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${noStepFlow.id}`));
    expect(screen.getByText(/Chưa có dữ liệu quan sát\./)).toBeInTheDocument();
    expect(screen.getByText(/đã được map ở mức\s*cấu trúc nhưng chưa nằm trong pilot/)).toBeInTheDocument();
    expect(screen.queryByTestId("journey-spine")).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^spine-step-/)).not.toBeInTheDocument();
  });

  /* 05/08: hồ sơ bước lên ĐỦ BA TAB. Test cũ ở đây canh đúng trạng thái ngược lại ("chỉ 1 tab, không
     dựng nút cho 2 tab bị lùi") — đó là khẳng định về một quyết định TẠM, nay đã hết hiệu lực, nên
     thay chứ không nới. Mốc tour `atlas-inspector` gắn được cũng nhờ chỗ này (seed.ts:936 khai
     "Hồ sơ bước — 3 tab"). */
  it("bấm một bước mở hồ sơ: đủ 3 tab, mặc định đứng ở 'Touchpoint & signal'", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${pilotSteps[0].id}`));

    const inspector = screen.getByTestId("atlas-inspector");
    expect(within(inspector).getAllByTestId(/^atlas-tab-/)).toHaveLength(3);
    expect(within(inspector).getByTestId("atlas-tab-sig")).toHaveAttribute("aria-selected", "true");
    expect(within(inspector).getByTestId("atlas-tab-met")).toHaveAttribute("aria-selected", "false");
    expect(within(inspector).getByTestId("atlas-tab-cov")).toHaveAttribute("aria-selected", "false");
    // Mốc tour chỉ được gắn khi câu "3 tab" đã đúng — canh cả hai cùng một chỗ.
    expect(inspector).toHaveAttribute("data-tour", "atlas-inspector");
  });

  it("tab 'Chỉ số liên kết' liệt kê đúng chỉ số mà điểm đo của bước nuôi, kèm ngưỡng đang áp", () => {
    const step = pilotSteps[0];
    const tps = seed.touchpoints.filter((t) => t.stepId === step.id);
    const sigs = seed.signals.filter((g) => tps.some((t) => t.id === g.tpId));
    const ids = [...new Set(sigs.flatMap((g) => g.metrics))];
    expect(ids.length).toBeGreaterThan(0); // guard: bước này phải CÓ chỉ số, nếu không test rỗng nghĩa

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${step.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-met"));

    const list = screen.getByTestId("atlas-met-list");
    expect(within(list).getAllByTestId(/^atlas-met-m/)).toHaveLength(ids.length);
    for (const id of ids) {
      const m = seed.metrics.find((x) => x.id === id)!;
      const row = within(list).getByTestId(`atlas-met-${id}`);
      expect(row).toHaveTextContent(m.name);
      expect(row).toHaveTextContent(m.value);
      expect(row).toHaveTextContent(`mục tiêu ${m.target}`);
      // Ngưỡng đọc từ cfg, KHÔNG khai lại trong màn.
      const band = cfgDefault.metric[id];
      expect(band.on).toBe(true);
      expect(row).toHaveTextContent(String(band.watch).replace(".", ","));
      expect(row).toHaveTextContent(String(band.crit).replace(".", ","));
    }
    expect(screen.queryByTestId("atlas-met-dangling")).not.toBeInTheDocument();
  });

  /* Đo trên seed 05/08: 24 trên 30 bước pilot chưa khai chỉ số nào — đây là đường chạy THƯỜNG GẶP,
     không phải ca hiếm, nên nó phải nói ra bằng chữ chứ không để tab trắng. */
  it("bước chưa khai chỉ số: tab 'Chỉ số liên kết' nói rõ thiếu KHAI BÁO, không phải chỉ số bằng 0", () => {
    /* Phải nằm trong phase PILOT — phase khoá thì không bấm tới được flow của nó, test sẽ đỏ vì lý
       do chẳng liên quan gì tới chỉ số. */
    const step = seed.steps.find((s) => {
      const f = seed.flows.find((x) => x.id === s.flowId)!;
      if (!PILOT_CODES.includes(seed.phases.find((p) => p.id === phaseIdOfFlow(f))!.code)) return false;
      const tps = seed.touchpoints.filter((t) => t.stepId === s.id);
      const sigs = seed.signals.filter((g) => tps.some((t) => t.id === g.tpId));
      return sigs.length > 0 && sigs.every((g) => g.metrics.length === 0);
    })!;
    const flow = seed.flows.find((f) => f.id === step.flowId)!;
    const phase = seed.phases.find((p) => p.id === phaseIdOfFlow(flow))!;

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-phase-${phase.id}`));
    fireEvent.click(screen.getByTestId(`atlas-flow-${flow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${step.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-met"));

    expect(screen.getByTestId("atlas-met-empty")).toHaveTextContent(
      /chưa gắn chỉ số nào.*thiếu khai báo, không phải chỉ số bằng 0/is,
    );
    expect(screen.queryByTestId("atlas-met-list")).not.toBeInTheDocument();
  });

  /* Hai kiểu trống KHÔNG được nói chung một câu. Bước chưa khai điểm đo nào mà in "điểm đo đã có,
     chỉ chưa nuôi chỉ số" là màn nói sai về chính nó — cùng lỗi hạng với chart điểm đo trước đây gộp
     ba nghĩa "không biết". Ca này có thật trong pilot, không phải giả định. */
  it("bước chưa khai điểm đo nào: tab 'Chỉ số liên kết' nói thiếu ĐIỂM ĐO, không nói thiếu chỉ số", () => {
    expect(signalsOfStep(noSignalStep.id)).toHaveLength(0);

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-phase-${noSignalPhase.id}`));
    fireEvent.click(screen.getByTestId(`atlas-flow-${noSignalFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${noSignalStep.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-met"));

    expect(screen.getByTestId("atlas-met-nosignal")).toHaveTextContent(
      /chưa khai điểm đo nào.*instrument signal cho bước, rồi mới khai chỉ số/is,
    );
    expect(screen.queryByTestId("atlas-met-empty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("atlas-met-list")).not.toBeInTheDocument();
  });

  it("bước chưa khai điểm đo nào: tab 'Độ phủ dữ liệu' KHÔNG khen 'Đủ signal'", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-phase-${noSignalPhase.id}`));
    fireEvent.click(screen.getByTestId(`atlas-flow-${noSignalFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${noSignalStep.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-cov"));

    const cov = screen.getByTestId("atlas-cov");
    expect(cov).not.toHaveTextContent("Đủ signal");
    expect(cov).toHaveTextContent("Bước chưa khai signal nào");
    expect(within(cov).getByTestId("atlas-cov-nosignal")).toHaveTextContent(
      /chưa khai điểm đo nào.*chưa kiểm được độ phủ đó lấy từ đâu ra/is,
    );
    /* Caveat phải đọc được SAU câu chốt về độ phủ — đặt trước thì câu trấn an đọc sau lấn mất nó
       (thấy đúng vậy khi xem trên màn). Canh bằng thứ tự chữ trong tab, không canh bằng class. */
    const text = cov.textContent ?? "";
    expect(text.indexOf("Độ phủ đạt ngưỡng")).toBeGreaterThan(-1);
    expect(text.indexOf("chưa khai điểm đo nào")).toBeGreaterThan(text.indexOf("Độ phủ đạt ngưỡng"));
    expect(screen.queryByTestId("atlas-cov-missing")).not.toBeInTheDocument();
  });

  it("tab 'Độ phủ dữ liệu': bước dưới ngưỡng nói phần CHƯA biết lý do và liệt kê signal đang thiếu", () => {
    /* Phải thoả CẢ HAI: dưới ngưỡng độ phủ VÀ có signal chưa hoạt động. Trên seed hai điều kiện này
       KHÔNG trùng nhau (bước 03 cov 64 nhưng đủ signal; bước 05 cov 58 và thiếu 1) — lấy bước đầu
       tiên dưới ngưỡng là canh nhầm bước. */
    const sigsOf = (stepId: string) => {
      const tps = seed.touchpoints.filter((t) => t.stepId === stepId);
      return seed.signals.filter((g) => tps.some((t) => t.id === g.tpId));
    };
    const step = pilotSteps.find(
      (s) =>
        obsOf(s.id).cov < cfgDefault.step.covMin &&
        sigsOf(s.id).some((g) => g.st === "gap" || g.st === "designed"),
    )!;
    const o = obsOf(step.id);
    const inactive = sigsOf(step.id).filter((g) => g.st === "gap" || g.st === "designed");

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${step.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-cov"));

    const cov = screen.getByTestId("atlas-cov");
    // Nói PHẦN BÙ (100 − cov), không phải nhắc lại con số cov.
    expect(cov).toHaveTextContent(`Còn ${100 - o.cov}% trường hợp thất bại chưa biết lý do.`);
    expect(cov).toHaveTextContent(`${o.cov}%`);
    expect(within(cov).getByTestId("atlas-cov-missing")).toBeInTheDocument();
    for (const g of inactive) {
      expect(within(cov).getByTestId(`atlas-cov-sig-${g.id}`)).toHaveTextContent(g.name);
    }
  });

  it("tab 'Độ phủ dữ liệu': bước đạt ngưỡng nói đạt, và không dựng danh sách signal thiếu khi không thiếu", () => {
    const step = pilotSteps.find((s) => {
      const tps = seed.touchpoints.filter((t) => t.stepId === s.id);
      const sigs = seed.signals.filter((g) => tps.some((t) => t.id === g.tpId));
      // `sigs.length > 0`: bước không có điểm đo nào cũng thoả `every(...)` một cách rỗng — canh nhầm
      // sang đúng ca mà hai test trên vừa tách ra.
      return (
        obsOf(s.id).cov >= cfgDefault.step.covMin &&
        sigs.length > 0 &&
        sigs.every((g) => g.st !== "gap" && g.st !== "designed")
      );
    })!;

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${step.id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-cov"));

    expect(screen.getByTestId("atlas-cov")).toHaveTextContent("Độ phủ đạt ngưỡng.");
    expect(screen.queryByTestId("atlas-cov-missing")).not.toBeInTheDocument();
  });

  /* Đổi bước mà bị ném về tab đầu là hỏng đúng việc người ta đang làm: so độ phủ giữa các bước.
     Prototype giữ tab ở state toàn cục (`ST.sub.atlasTab`) — giữ đúng hành vi đó. */
  it("đổi bước KHÔNG reset tab đang xem", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${pilotSteps[0].id}`));
    fireEvent.click(screen.getByTestId("atlas-tab-cov"));
    expect(screen.getByTestId("atlas-cov")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`spine-step-${pilotSteps[1].id}`));
    expect(screen.getByTestId("atlas-tab-cov")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("atlas-cov")).toHaveTextContent(`${obsOf(pilotSteps[1].id).cov}%`);
  });

  it("hồ sơ liệt kê touchpoint của bước và signal của các touchpoint đó, gồm signal 'gap' hiện đúng trạng thái bằng chữ", () => {
    /* 05/08: `sg6 ekyc_face_device_context` — signal gap DUY NHẤT của flow mở TK — đã bỏ, vì chiều
       Nền tảng trả lời sẵn câu hỏi nó định hỏi. Nên test KHÔNG ghim `s3` nữa mà tự tìm signal gap đầu
       tiên trong seed rồi lần ngược ra bước/flow/phase của nó. Khẳng định giữ NGUYÊN: signal vol 0
       vẫn phải hiện trong hồ sơ, kèm trạng thái viết bằng chữ. */
    const gapSignal = seed.signals.find((g) => g.st === "gap")!;
    expect(gapSignal).toBeDefined();
    const tp = seed.touchpoints.find((t) => t.id === gapSignal.tpId)!;
    const step = seed.steps.find((s) => s.id === tp.stepId)!;
    const flow = seed.flows.find((f) => f.id === step.flowId)!;
    const phase = seed.phases.find(
      (p) => p.id === seed.groups.find((g) => g.id === flow.groupId)!.phaseId,
    )!;

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-phase-${phase.id}`));
    fireEvent.click(screen.getByTestId(`atlas-flow-${flow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${step.id}`));

    const inspector = screen.getByTestId("atlas-inspector");
    expect(within(inspector).getByText(tp.name)).toBeInTheDocument();
    const gapRow = within(inspector).getByTestId(`atlas-signal-${gapSignal.id}`);
    expect(gapRow).toHaveTextContent(gapSignal.name);
    expect(gapRow).toHaveTextContent("Chưa đo (gap)");
  });

  it("đổi flow xoá lựa chọn bước cũ: hồ sơ biến mất hẳn, không hiện lại bước của flow khác", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${pilotSteps[0].id}`));
    expect(screen.getByTestId("atlas-inspector")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`atlas-flow-${noStepFlow.id}`));
    expect(screen.queryByTestId("atlas-inspector")).not.toBeInTheDocument();
  });

  /* Rule 2 — bảo vệ bất biến. Hôm nay MỌI step trong fixture có đúng 1 obs khớp, nên AtlasPage
     không cần đường "loại bước vì thiếu obs" trong vận hành thật. Nếu dữ liệu tương lai thêm một
     step chưa có obs, test này phải chuyển ĐỎ — đó là tín hiệu để người sửa MỞ RỘNG kiểu
     `SpineStep.state` một cách có chủ ý (thêm 'unknown'), không phải để AtlasPage tự lặng lẽ vẽ 0. */
  it("guard: mọi step trong seed có đúng 1 obs khớp (điều kiện để không phải loại bước nào khỏi spine)", () => {
    for (const s of seed.steps) {
      const matches = seed.obs.filter((o) => o.stepId === s.id);
      expect(matches).toHaveLength(1);
    }
  });

  it("scale baseline: số hiện trên thẻ bước bằng đúng số fixture đi qua fx() — rớt scale phải đỏ ở đây", () => {
    const step = pilotSteps[0];
    const o = obsOf(step.id);
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    const card = screen.getByTestId(`spine-step-${step.id}`);
    expect(card).toHaveTextContent(nf(fx(o.completed)));
    expect(card).toHaveTextContent(`${nf(fx(o.entered))} vào`);
  });
});
