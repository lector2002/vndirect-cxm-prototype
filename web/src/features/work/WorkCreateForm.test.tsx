import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
import { useCxmStore } from "../../store/store.ts";
import { SEV_LABEL, WorkCreateForm, vnDate } from "./WorkCreateForm.tsx";

/* Props THUẦN — component không đọc store. steps/metrics lấy từ seed thật; owners/approvers lấy
   qua store.getOwners()/getApprovers() (đã có sẵn, tránh bịa danh sách người). */
const steps = seed.steps;
const metrics = seed.metrics;
const owners = useCxmStore.getState().owners;
const approvers = useCxmStore.getState().approvers;

function renderForm(overrides: Partial<Parameters<typeof WorkCreateForm>[0]> = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  render(
    <WorkCreateForm
      steps={steps}
      metrics={metrics}
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

describe("vnDate (pure — port prototype dòng 4628)", () => {
  it("yyyy-MM-dd -> dd/MM/yyyy", () => {
    expect(vnDate("2026-08-08")).toBe("08/08/2026");
  });
  it("chuỗi rỗng -> rỗng (KHÔNG có 3 phần)", () => {
    expect(vnDate("")).toBe("");
  });
});

describe("SEV_LABEL", () => {
  it("đúng 3 khóa/nhãn port từ prototype dòng 1504", () => {
    expect(SEV_LABEL).toEqual({
      critical: "Cần xử lý ngay",
      high: "Cần theo dõi",
      medium: "Đang quan sát",
    });
  });
});

describe("WorkCreateForm", () => {
  it("render tiêu đề + subtitle", () => {
    renderForm();
    expect(screen.getByText("Tạo điểm gãy mới")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Điểm gãy phải neo vào một bước trong hành trình và một chỉ số dùng để kết luận — nếu không thì sau này không ai đo được là đã sửa xong hay chưa.",
      ),
    ).toBeInTheDocument();
  });

  it("error!=null: render Note tone=crit chứa đúng nội dung lỗi", () => {
    renderForm({ error: "Cần tiêu đề — một câu nói rõ khách đang gặp gì." });
    expect(screen.getByTestId("note")).toHaveTextContent("Cần tiêu đề — một câu nói rõ khách đang gặp gì.");
  });

  it("error=null: KHÔNG render Note", () => {
    renderForm({ error: null });
    expect(screen.queryByTestId("note")).not.toBeInTheDocument();
  });

  it("mọi select/input/textarea có label liên kết qua htmlFor/id", () => {
    renderForm();
    expect(screen.getByLabelText("Bước trong hành trình")).toBeInTheDocument();
    expect(screen.getByLabelText("Chỉ số dùng để kết luận")).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề — một câu nói rõ khách đang gặp gì")).toBeInTheDocument();
    expect(screen.getByLabelText("Mức nghiêm trọng")).toBeInTheDocument();
    expect(screen.getByLabelText("Người xử lý")).toBeInTheDocument();
    expect(screen.getByLabelText("Người duyệt")).toBeInTheDocument();
    expect(screen.getByLabelText("Hạn xử lý")).toBeInTheDocument();
    expect(screen.getByLabelText("Mô tả cho người đọc — không dùng thuật ngữ nội bộ")).toBeInTheDocument();
  });

  it("select 'Bước': option text = `${code} · ${name}`, mặc định steps[0]", () => {
    renderForm();
    const sel = screen.getByLabelText("Bước trong hành trình") as HTMLSelectElement;
    expect(sel.value).toBe(steps[0].id);
    expect(screen.getByText(`${steps[0].code} · ${steps[0].name}`)).toBeInTheDocument();
  });

  it("select 'Chỉ số': option text = `${name} · ${target}`, mặc định metrics[0]", () => {
    renderForm();
    const sel = screen.getByLabelText("Chỉ số dùng để kết luận") as HTMLSelectElement;
    expect(sel.value).toBe(metrics[0].id);
    expect(screen.getByText(`${metrics[0].name} · ${metrics[0].target}`)).toBeInTheDocument();
  });

  it("select 'Mức nghiêm trọng': đúng 3 option theo thứ tự critical,high,medium, mặc định high", () => {
    renderForm();
    const sel = screen.getByLabelText("Mức nghiêm trọng") as HTMLSelectElement;
    const optionLabels = Array.from(sel.options).map((o) => o.textContent);
    expect(optionLabels).toEqual([SEV_LABEL.critical, SEV_LABEL.high, SEV_LABEL.medium]);
    expect(sel.value).toBe("high");
  });

  it("select 'Người xử lý': option đầu value='' text='— để gán sau —', mặc định rỗng", () => {
    renderForm();
    const sel = screen.getByLabelText("Người xử lý") as HTMLSelectElement;
    expect(sel.options[0].value).toBe("");
    expect(sel.options[0].textContent).toBe("— để gán sau —");
    expect(sel.value).toBe("");
  });

  it("select 'Người duyệt': mặc định approvers[0]", () => {
    renderForm();
    const sel = screen.getByLabelText("Người duyệt") as HTMLSelectElement;
    expect(sel.value).toBe(approvers[0]);
  });

  it("bấm 'Hủy' gọi onCancel đúng 1 lần", () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByText("Hủy"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("nhập đủ field rồi bấm 'Tạo điểm gãy': onSubmit nhận đúng fields, 'Hạn xử lý' chuyển yyyy-MM-dd -> dd/MM/yyyy", () => {
    const { onSubmit } = renderForm();
    fireEvent.change(screen.getByLabelText("Tiêu đề — một câu nói rõ khách đang gặp gì"), {
      target: { value: "Khách không nhận được xác nhận" },
    });
    fireEvent.change(screen.getByLabelText("Hạn xử lý"), { target: { value: "2026-08-20" } });
    fireEvent.click(screen.getByText("Tạo điểm gãy"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const fields = onSubmit.mock.calls[0][0];
    expect(fields.title).toBe("Khách không nhận được xác nhận");
    expect(fields.step).toBe(steps[0].id);
    expect(fields.metric).toBe(metrics[0].id);
    expect(fields.sev).toBe("high");
    expect(fields.owner).toBe("");
    expect(fields.acc).toBe(approvers[0]);
    expect(fields.due).toBe("20/08/2026");
    expect(fields.plain).toBe("");
  });

  it("để trống 'Hạn xử lý': onSubmit nhận due='' (giá trị ĐỘNG do repo tự đặt, form KHÔNG tự tính ngày)", () => {
    const { onSubmit } = renderForm();
    fireEvent.click(screen.getByText("Tạo điểm gãy"));
    const fields = onSubmit.mock.calls[0][0];
    expect(fields.due).toBe("");
  });
});
