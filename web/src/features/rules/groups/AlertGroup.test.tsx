import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { sourceHealth } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import { AlertGroup } from "./AlertGroup.tsx";

/* Ghim: câu "áp ngay lúc này" của nhóm Cảnh báo & khảo sát SINH TỪ store, không phải chữ viết tay.
   Đổi `data.deadDays` qua ô nhập là phép test chính — độc lập tính lại số nguồn "Ngừng gửi" bằng
   `sourceHealth` (domain/state.ts), không chép số bằng tay, để fixture đổi thì test đổi theo. */

const cfg0 = useCxmStore.getState().cfg;
const cfg = () => useCxmStore.getState().cfg;

afterEach(() => {
  useCxmStore.getState().setCfg({ data: cfg0.data, anomaly: cfg0.anomaly });
});

function deadCount(): number {
  const { data, cfg: c } = useCxmStore.getState();
  return data.sources.filter((s) => sourceHealth(s, c, data.asOf) === "down").length;
}

describe("AlertGroup — các ngưỡng cảnh báo + áp ngay lúc này", () => {
  it("hiện đúng số nguồn Ngừng gửi ứng với deadDays mặc định", () => {
    render(<AlertGroup />);
    fireEvent.click(screen.getByTestId("apply-toggle")); // 18/08: khối "áp ngay" gấp mặc định
    const n = deadCount();
    expect(n).toBeGreaterThan(0); // seed hôm nay có src-zalo im lặng 192h > 2 ngày mặc định
    expect(screen.getAllByText(new RegExp(`${n} nguồn`)).length).toBeGreaterThan(0);
  });

  it("đổi data.deadDays qua ô nhập ⇒ câu 'bao nhiêu nguồn bị coi là Ngừng gửi' đổi theo", () => {
    render(<AlertGroup />);
    fireEvent.click(screen.getByTestId("apply-toggle"));
    const before = deadCount();
    expect(before).toBeGreaterThan(0);

    const field = screen.getByLabelText("Stopped-source threshold (days past cadence)");
    fireEvent.change(field, { target: { value: "30" } });
    fireEvent.blur(field);

    expect(cfg().data.deadDays).toBe(30);
    const after = deadCount();
    expect(after).toBe(0); // nới lên 30 ngày quá nhịp giao thì không nguồn nào còn bị coi là ngừng gửi
    expect(screen.getAllByText(/0 nguồn/).length).toBeGreaterThan(0);
  });

  it("đổi repeatWarn/churnWarn ⇒ số điểm gãy bị tô đỏ đổi theo, tính độc lập trên data.iss", () => {
    render(<AlertGroup />);
    fireEvent.click(screen.getByTestId("apply-toggle"));
    const field = screen.getByLabelText("Repeat-contact red threshold");
    fireEvent.change(field, { target: { value: "0" } });
    fireEvent.blur(field);

    const expectRep = useCxmStore.getState().data.iss.filter((i) => i.imp.rep > 0).length;
    expect(screen.getAllByText(new RegExp(`${expectRep} điểm gãy`)).length).toBeGreaterThan(0);
  });

  /* Nhóm luật 24 (data/validate.ts, thêm 12/08) đi HẾT đường tới màn: setCfg chạy lại validateFixture
     với cfg ứng viên và ném, useCfgWrite in nguyên văn vào ô "Không ghi được cấu hình" của đúng nhóm
     này. Phép kiểm là "gõ ô này có đổi được gì không" theo chiều NGƯỢC: số vô nghĩa thì KHÔNG được đổi
     gì, và người gõ phải thấy lý do — ô lặng lẽ trả về số cũ là chỗ người vận hành tin mình đã sửa. */
  it("gõ deadDays = 0 ⇒ bị chặn, cfg giữ số cũ, và màn nói lý do", () => {
    render(<AlertGroup />);
    const before = cfg().data.deadDays;

    const field = screen.getByLabelText("Stopped-source threshold (days past cadence)");
    fireEvent.change(field, { target: { value: "0" } });
    fireEvent.blur(field);

    expect(cfg().data.deadDays).toBe(before);
    expect(screen.getByText("Không ghi được cấu hình.")).toBeTruthy();
    expect(screen.getAllByText(/cfg\.data\.deadDays = 0/).length).toBeGreaterThan(0);
    expect((field as HTMLInputElement).value).toBe(String(before));
  });

  /* 12/08 (owner quyết, handoff §6) — hai ô mồ côi đã bỏ. Test này canh chiều NGƯỢC với các test
     trên: không phải "ô này đổi được nhãn nào" mà "ô không đổi được nhãn nào thì không được đứng
     trên màn". Nếu lần sau có chỗ tiêu thụ thật (chuỗi volume theo ngày cho anomalyX, log liên hệ
     theo chủ đề cho repeatMin) thì thêm lại ô VÀ xoá test này CÙNG MỘT LƯỢT — để nguyên là chặn
     đúng thứ đáng lên màn. */
  it("không còn ô nhập nào cho anomalyX/repeatMin — hai khoá đã bỏ khỏi cfg", () => {
    render(<AlertGroup />);
    expect(screen.queryByLabelText("Số lần vượt baseline thì cảnh báo")).toBeNull();
    expect(screen.queryByLabelText("Số lần liên hệ tính là repeat contact")).toBeNull();
    expect(Object.keys(cfg().data)).not.toContain("anomalyX");
    expect(Object.keys(cfg().data)).not.toContain("repeatMin");
  });

  it("mỗi ô số đều ghi đúng khoá cfg tương ứng", () => {
    render(<AlertGroup />);
    const cases: [string, number, "data" | "anomaly", string][] = [
      ["Z-score anomaly threshold", 1, "anomaly", "z"],
      ["Global survey cooldown", 7, "data", "cooldown"],
      ["Churn-signal red threshold (customers)", 40, "data", "churnWarn"],
    ];
    for (const [label, value, group, key] of cases) {
      const field = screen.getByLabelText(label);
      fireEvent.change(field, { target: { value: String(value) } });
      fireEvent.blur(field);
      const g = useCxmStore.getState().cfg[group] as unknown as Record<string, number>;
      expect(g[key]).toBe(value);
    }
  });
});
