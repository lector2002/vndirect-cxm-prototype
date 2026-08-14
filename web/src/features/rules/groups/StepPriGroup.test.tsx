import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { issueScore } from "../../../data/priority.ts";
import { useCxmStore } from "../../../store/store.ts";
import { StepPriGroup } from "./StepPriGroup.tsx";

/* Nhóm này là chỗ hai khoá `jc`/`reg` bắt đầu có nghĩa (ADR-002 §5, §6). Ba thứ đáng canh:
   1. mỗi bước có đúng hai ô, không bước nào rơi ra ngoài;
   2. bỏ trống là hợp lệ và có nghĩa "chưa tính được" — KHÔNG rơi về một mức giữa;
   3. chọn một mức thì điểm gãy trên bước đó chuyển từ *chưa tính được* sang tính được — kiểm tận
      `issueScore`, không dừng ở việc cfg có ghi hay không. */

describe("StepPriGroup — mức jc/reg của từng bước", () => {
  it("mỗi bước đúng hai ô chọn, không bước nào thiếu", () => {
    const { container } = render(<StepPriGroup />);
    const { data } = useCxmStore.getState();
    expect(container.querySelectorAll("select").length).toBe(data.steps.length * 2);
    for (const s of data.steps) {
      expect(screen.getByTestId(`steppri-row-${s.id}`)).toBeInTheDocument();
    }
  });

  it("mặc định bỏ trống ⇒ jc và reg của điểm gãy là chưa tính được, KHÔNG phải mức giữa", () => {
    render(<StepPriGroup />);
    const { data, cfg, dims } = useCxmStore.getState();
    const issue = data.iss[0];
    if (cfg.step.jc[issue.step] !== undefined) return; // đã có ai điền thì ca này không còn nghĩa
    const s = issueScore(issue, data, cfg, dims);
    expect(s.x.jc).toBeNull();
    expect(s.missing).toContain("jc");
  });

  it("chọn một mức ⇒ ghi vào cfg và khoá đó thôi nằm trong missing", () => {
    render(<StepPriGroup />);
    const stepId = useCxmStore.getState().data.steps[0].id;

    fireEvent.change(screen.getByLabelText(/Mức quan trọng của bước.*/i, { selector: `#steppri-jc-${stepId}` }), {
      target: { value: "high" },
    });

    const { data, cfg, dims } = useCxmStore.getState();
    expect(cfg.step.jc[stepId]).toBe("high");

    const onStep = data.iss.find((i) => i.step === stepId);
    if (!onStep) return; // không điểm gãy nào trên bước đó thì phần dưới không kiểm được gì
    const s = issueScore(onStep, data, cfg, dims);
    expect(s.x.jc).not.toBeNull();
    expect(s.missing).not.toContain("jc");
  });

  it("chọn lại về '— chưa chọn —' ⇒ entry bị GỠ khỏi cfg, không lưu một mức rỗng", () => {
    render(<StepPriGroup />);
    const stepId = useCxmStore.getState().data.steps[0].id;
    const sel = `#steppri-reg-${stepId}`;

    fireEvent.change(screen.getByLabelText(/Rủi ro pháp lý.*/i, { selector: sel }), { target: { value: "mid" } });
    expect(useCxmStore.getState().cfg.step.reg[stepId]).toBe("mid");

    fireEvent.change(screen.getByLabelText(/Rủi ro pháp lý.*/i, { selector: sel }), { target: { value: "" } });
    expect(stepId in useCxmStore.getState().cfg.step.reg).toBe(false);
  });
});
