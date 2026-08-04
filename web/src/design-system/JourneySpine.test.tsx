import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { JourneySpine, type SpineStep } from "./JourneySpine.tsx";

const steps: SpineStep[] = [
  {
    id: "s1", code: "01", stationId: "JS-01", name: "Khởi tạo hồ sơ",
    entered: 100, completed: 90, failed: 10, cov: 80, effort: 1.1,
    state: "good", why: "trong ngưỡng",
  },
  {
    id: "s2", code: "02", stationId: "JS-02", name: "Xác thực CCCD",
    entered: 90, completed: 60, failed: 30, cov: 40, effort: 1.6,
    state: "crit", why: "fail vượt ngưỡng crit",
  },
];

describe("JourneySpine", () => {
  it("renders one card per step, mỗi thẻ hiện đúng số hoàn tất và số vào của chính nó", () => {
    render(<JourneySpine steps={steps} />);
    const card1 = screen.getByTestId("spine-step-s1");
    expect(card1).toHaveTextContent("90"); // completed
    expect(card1).toHaveTextContent("100 vào"); // entered
    const card2 = screen.getByTestId("spine-step-s2");
    expect(card2).toHaveTextContent("60");
    expect(card2).toHaveTextContent("90 vào");
  });

  it("rule 6: mỗi thẻ là button với accessible name có chứa tên bước (không chỉ testid/textContent)", () => {
    render(<JourneySpine steps={steps} />);
    expect(screen.getByRole("button", { name: /Khởi tạo hồ sơ/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xác thực CCCD/ })).toBeInTheDocument();
  });

  describe("selection (rule 4)", () => {
    it("bấm thẻ gọi onSelect đúng 1 lần với id của thẻ đó", () => {
      const onSelect = vi.fn();
      render(<JourneySpine steps={steps} onSelect={onSelect} />);
      fireEvent.click(screen.getByTestId("spine-step-s2"));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("s2");
    });

    it("vắng onSelect: không có handler nào được đính, thẻ không trông như bấm được", () => {
      render(<JourneySpine steps={steps} />);
      const card = screen.getByTestId("spine-step-s1");
      // clickable=false → không có class cursor-pointer, và onClick không được gán (undefined) nên
      // click không làm gì (không throw), khác với trường hợp có onSelect ở test trên.
      expect(card.className).not.toContain("cursor-pointer");
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe("hình học dải nối (rule 1, rule 6)", () => {
    // Fixture 3 bước tự chọn số để tính tay được, và để cả hai sàn Math.max (4px/3px) đều bị chặn
    // ở connector thứ hai: base = step0.entered = 1000.
    // Connector 0 (s0→s1): passPx = (850/1000)*112 = 95.2 (không chặn); lossPx = (150/1000)*112 =
    // 16.8 (không chặn, dùng s0.failed=150 — KHÔNG dùng s0.entered-s1.entered dù ra cùng số ở đây).
    // Connector 1 (s1→s2): passPx = (10/1000)*112 = 1.12 → chặn ở sàn 4; lossPx = (2/1000)*112 =
    // 0.224 → chặn ở sàn 3.
    const geomSteps: SpineStep[] = [
      { id: "g0", code: "01", stationId: "A", name: "Bước 1", entered: 1000, completed: 850, failed: 150, cov: 90, effort: 1, state: "good", why: "" },
      { id: "g1", code: "02", stationId: "B", name: "Bước 2", entered: 850, completed: 848, failed: 2, cov: 90, effort: 1, state: "good", why: "" },
      { id: "g2", code: "03", stationId: "C", name: "Bước 3", entered: 10, completed: 10, failed: 0, cov: 90, effort: 1, state: "good", why: "" },
    ];

    it("connector 0: passPx=95.2px, lossPx=16.8px (không chạm sàn)", () => {
      render(<JourneySpine steps={geomSteps} />);
      expect(screen.getByTestId("spine-pass-g0")).toHaveStyle({ height: "95.2px" });
      const loss = screen.getByTestId("spine-loss-g0");
      expect(loss).toHaveStyle({ height: "16.8px", top: "95.2px" });
    });

    it("connector 1: cả passPx và lossPx bị Math.max chặn xuống sàn 4px/3px", () => {
      render(<JourneySpine steps={geomSteps} />);
      expect(screen.getByTestId("spine-pass-g1")).toHaveStyle({ height: "4px" });
      expect(screen.getByTestId("spine-loss-g1")).toHaveStyle({ height: "3px", top: "4px" });
    });

    it("dải rơi dùng hatch chéo (repeating-linear-gradient), KHÔNG phải một màu đặc — phân biệt được ngoài hue", () => {
      render(<JourneySpine steps={geomSteps} />);
      const loss = screen.getByTestId("spine-loss-g0");
      expect(loss.style.backgroundImage).toContain("repeating-linear-gradient");
    });

    it("connector có title mô tả phần rơi bằng chữ (accessibility, không chỉ dựa vào màu)", () => {
      render(<JourneySpine steps={geomSteps} />);
      const conn = screen.getByTestId("spine-conn-g0");
      expect(conn).toHaveAttribute("title", expect.stringContaining("150"));
    });
  });

  it("nhãn rơi hiện % trên số vào của CHÍNH bước đó và số thô — không phải % trên base", () => {
    // steps: s1(entered=100,failed=10) → pv(10,100)=10; s2 không có connector kế (là bước cuối)
    render(<JourneySpine steps={steps} />);
    expect(screen.getByText("−10%")).toBeInTheDocument();
    expect(screen.getByText("10 rơi")).toBeInTheDocument();
  });

  it("khung cuộn ngang chỉ ở steps-row; wrapper ngoài không cuộn", () => {
    render(<JourneySpine steps={steps} />);
    expect(screen.getByTestId("spine-steps-row").className).toContain("overflow-x-auto");
    expect(screen.getByTestId("journey-spine").className).not.toContain("overflow-x-auto");
  });

  it("mảng steps rỗng: hiện đúng ghi chú 'chưa có bước nào', không vẽ dải nối nào", () => {
    render(<JourneySpine steps={[]} />);
    expect(screen.getByText(/chưa có bước nào/i)).toBeInTheDocument();
    expect(screen.queryByTestId("spine-steps-row")).not.toBeInTheDocument();
  });

  it("base=0 (bước đầu 0 khách vào): vẫn hiện thẻ, không vẽ dải nối, nói rõ lý do bằng chữ", () => {
    const zeroBase: SpineStep[] = [
      { id: "z0", code: "01", stationId: "A", name: "Bước 1", entered: 0, completed: 0, failed: 0, cov: 0, effort: 1, state: "good", why: "" },
      { id: "z1", code: "02", stationId: "B", name: "Bước 2", entered: 0, completed: 0, failed: 0, cov: 0, effort: 1, state: "good", why: "" },
    ];
    render(<JourneySpine steps={zeroBase} />);
    expect(screen.getByTestId("spine-step-z0")).toBeInTheDocument();
    expect(screen.queryByTestId("spine-conn-z0")).not.toBeInTheDocument();
    expect(screen.getByText(/0 khách vào/)).toBeInTheDocument();
  });

  /* Rule 1 — bảo vệ đối chiếu (data-level, dùng fixture thật demoData). Component tính độ rơi từ
     `step.failed` (số đo trực tiếp), KHÔNG từ `entered - next.entered`. Hôm nay hai cách tính ra
     cùng một số trên dữ liệu demo — test này khoá đúng sự trùng khớp đó. NẾU dữ liệu thật sau này
     làm hai cách tính lệch nhau, test này phải chuyển ĐỎ, và khi đó phải có người khai một luật đối
     chiếu rõ ràng (ví dụ: ưu tiên số nào, hay báo lỗi dữ liệu) — không được để component tự tiện
     chọn một trong hai số cho êm việc. */
  it("bảo vệ đối chiếu: entered-next.entered===failed và entered===completed+failed trên demoData", () => {
    const obsByStep = new Map(demoData.obs.map((o) => [o.stepId, o] as const));
    const flowIds = [...new Set(demoData.steps.map((s) => s.flowId))];
    expect(flowIds.length).toBeGreaterThan(0);

    for (const flowId of flowIds) {
      const flowSteps = demoData.steps.filter((s) => s.flowId === flowId);
      for (let i = 0; i < flowSteps.length; i++) {
        const o = obsByStep.get(flowSteps[i].id);
        expect(o).toBeDefined();
        expect(o!.entered).toBe(o!.completed + o!.failed);
        if (i < flowSteps.length - 1) {
          const next = obsByStep.get(flowSteps[i + 1].id);
          expect(next).toBeDefined();
          expect(o!.entered - next!.entered).toBe(o!.failed);
        }
      }
    }
  });
});
