import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
import { useCxmStore } from "../../store/store.ts";
import { SEV_LABEL } from "./WorkCreateForm.tsx";
import { WorkConfirmForm } from "./WorkConfirmForm.tsx";

/* CXI-024/CXA-024: fixture DUY NHẤT ở lane 'confirm' (cf='pending', owner='Chưa gán') — dùng xuyên
   suốt các test flow xác nhận trong contract W3b (đổi tên chặng 'Gán'->'Xác nhận' 02/08/2026,
   module-a-charter.md section A4). */
const issue = seed.iss.find((i) => i.id === "CXI-024")!;
const action = seed.act.find((a) => a.id === "CXA-024")!;
const step = seed.steps.find((s) => s.id === issue.step)!;
const stepLabel = `${step.code} · ${step.name}`;
const owners = useCxmStore.getState().owners;
const approvers = useCxmStore.getState().approvers;

function renderForm(overrides: Partial<Parameters<typeof WorkConfirmForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <WorkConfirmForm
      issue={issue}
      action={action}
      stepLabel={stepLabel}
      owners={owners}
      approvers={approvers}
      error={null}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onSubmit, onCancel };
}

describe("WorkConfirmForm", () => {
  it("render tiêu đề `Xác nhận điểm gãy · {issue.id}` + subtitle = issue.title", () => {
    renderForm();
    expect(screen.getByText(`Xác nhận điểm gãy · ${issue.id}`)).toBeInTheDocument();
    expect(screen.getByText(issue.title)).toBeInTheDocument();
  });

  it("error!=null: render Note tone=crit chứa nội dung lỗi", () => {
    renderForm({ error: "Chọn một người xử lý. Đây là chỗ duy nhất biến điểm gãy thành việc của ai đó." });
    const notes = screen.getAllByTestId("note");
    expect(notes.some((n) => n.textContent?.includes("Chọn một người xử lý"))).toBe(true);
  });

  it("info block: 4 cặp label/value đúng Bước/Mức/Khách bị ảnh hưởng/Bằng chứng", () => {
    renderForm();
    expect(screen.getByText("Bước")).toBeInTheDocument();
    expect(screen.getByText(stepLabel)).toBeInTheDocument();
    expect(screen.getByText("Mức")).toBeInTheDocument();
    expect(screen.getByText(SEV_LABEL[issue.sev])).toBeInTheDocument();
    expect(screen.getByText("Khách bị ảnh hưởng")).toBeInTheDocument();
    /* `imp.aff` gõ tay đã bỏ (ADR-002 §16) và số đo thật chưa về — ô này phải nói "chưa tính
       được", KHÔNG được in số 0: người đang xác nhận một điểm gãy mà đọc "0 khách" sẽ kết luận
       ngược hẳn sự thật. */
    expect(screen.getByText("chưa tính được")).toBeInTheDocument();
    expect(screen.getByText("Bằng chứng")).toBeInTheDocument();
  });

  it("issue.ev rỗng: 'Bằng chứng' hiện 'chưa có' tô màu --crit (text-crit)", () => {
    const noEvIssue = { ...issue, ev: [] as string[] };
    renderForm({ issue: noEvIssue });
    const val = screen.getByText("chưa có");
    expect(val).toHaveClass("text-crit");
  });

  it("issue.ev có N phần tử: 'Bằng chứng' hiện `${n} bản ghi`", () => {
    expect(issue.ev.length).toBeGreaterThan(0);
    renderForm();
    expect(screen.getByText(`${issue.ev.length} bản ghi`)).toBeInTheDocument();
  });

  it("luật 11/08 (bổ sung): đã bỏ cảnh báo đóng băng baseline bằng văn", () => {
    renderForm();
    expect(screen.queryByText(/đóng băng số liệu hiện tại/)).not.toBeInTheDocument();
    expect(screen.queryByText(/KHÔNG sửa lại được/)).not.toBeInTheDocument();
  });

  it("mọi select/input có label liên kết htmlFor/id", () => {
    renderForm();
    expect(screen.getByLabelText("Người xử lý")).toBeInTheDocument();
    expect(screen.getByLabelText("Người duyệt")).toBeInTheDocument();
    expect(screen.getByLabelText("Hạn xử lý")).toBeInTheDocument();
  });

  it("select 'Người xử lý': option đầu value='' text='— chọn người —', mặc định rỗng", () => {
    renderForm();
    const sel = screen.getByLabelText("Người xử lý") as HTMLSelectElement;
    expect(sel.options[0].value).toBe("");
    expect(sel.options[0].textContent).toBe("— chọn người —");
    expect(sel.value).toBe("");
  });

  it("select 'Người duyệt': mặc định action.acc", () => {
    renderForm();
    const sel = screen.getByLabelText("Người duyệt") as HTMLSelectElement;
    expect(sel.value).toBe(action.acc);
  });

  it("hint 'Hạn xử lý' đọc đúng `Trống thì giữ hạn ${action.due}`", () => {
    renderForm();
    expect(screen.getByText(`Trống thì giữ hạn ${action.due}`)).toBeInTheDocument();
  });

  it("bấm 'Hủy' gọi onCancel đúng 1 lần", () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByText("Hủy"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("chọn người + bấm 'Xác nhận điểm gãy': onSubmit nhận {owner,acc,due} đúng, due chuyển yyyy-MM-dd -> dd/MM/yyyy", () => {
    const { onSubmit } = renderForm();
    fireEvent.change(screen.getByLabelText("Người xử lý"), { target: { value: owners[0] } });
    fireEvent.change(screen.getByLabelText("Hạn xử lý"), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByTestId("confirm-submit"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const fields = onSubmit.mock.calls[0][0];
    expect(fields.owner).toBe(owners[0]);
    expect(fields.acc).toBe(action.acc);
    expect(fields.due).toBe("01/09/2026");
  });

  it("không chọn 'Hạn xử lý' (để trống): onSubmit KHÔNG có field due (giữ nguyên action.due)", () => {
    const { onSubmit } = renderForm();
    fireEvent.change(screen.getByLabelText("Người xử lý"), { target: { value: owners[0] } });
    fireEvent.click(screen.getByTestId("confirm-submit"));
    const fields = onSubmit.mock.calls[0][0];
    expect(fields.due).toBeUndefined();
  });

  it("không chọn 'Người xử lý' (để trống): onSubmit vẫn nhận owner=''  (validate/error do container xử lý)", () => {
    const { onSubmit } = renderForm();
    fireEvent.click(screen.getByTestId("confirm-submit"));
    const fields = onSubmit.mock.calls[0][0];
    expect(fields.owner).toBe("");
  });
});
