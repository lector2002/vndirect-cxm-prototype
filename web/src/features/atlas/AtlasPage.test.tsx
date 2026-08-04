import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
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

const otherPhase = seed.phases.find((p) => p.id !== pilotPhase.id)!;
const otherPhaseFlow = seed.flows.find(
  (f) => seed.groups.find((g) => g.id === f.groupId)?.phaseId === otherPhase.id,
)!;

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

  it("bấm một bước mở hồ sơ: đúng 1 tab 'Touchpoint & signal', không có nút cho 2 tab bị lùi", () => {
    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
    fireEvent.click(screen.getByTestId(`spine-step-${pilotSteps[0].id}`));

    const inspector = screen.getByTestId("atlas-inspector");
    expect(within(inspector).getByText("Touchpoint & signal")).toBeInTheDocument();
    expect(within(inspector).getAllByTestId(/^atlas-tab-/)).toHaveLength(1);
    expect(within(inspector).queryByText("Chỉ số liên kết")).not.toBeInTheDocument();
    expect(within(inspector).queryByText("Độ phủ dữ liệu")).not.toBeInTheDocument();
  });

  it("hồ sơ liệt kê touchpoint của bước và signal của các touchpoint đó, gồm signal 'gap' hiện đúng trạng thái bằng chữ", () => {
    // s3 (Liveness & Face match) có tp3, và tp3 có sg5 (live) + sg6 (gap, vol:0) — sg6 PHẢI vẫn hiện.
    const step = seed.steps.find((s) => s.id === "s3")!;
    const tp = seed.touchpoints.find((t) => t.stepId === step.id)!;
    const gapSignal = seed.signals.find((g) => g.tpId === tp.id && g.st === "gap")!;
    expect(gapSignal).toBeDefined();

    render(<AtlasPage />);
    fireEvent.click(screen.getByTestId(`atlas-flow-${pilotFlow.id}`));
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
