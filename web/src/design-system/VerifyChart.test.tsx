import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoData } from "../data/fixtures/demo.ts";
import { verifyTimeline, type VerifyTimeline } from "../domain/verifyTimeline.ts";
import { VerifyChart } from "./VerifyChart.tsx";

/* Nghiệm thu B3 (module-b-issue-charter.md): nhãn "minh hoạ" do CỜ TRÊN DỮ LIỆU điều khiển;
   releaseAfter null thì KHÔNG render vạch phát hành. Timeline lấy THẬT từ verifyTimeline trên
   demoData — không dựng tay từng con số. */

const tlReal: VerifyTimeline = verifyTimeline("CXI-013", demoData)!;

describe("VerifyChart", () => {
  it("demo:true ⇒ có nhãn 'số minh hoạ'; vạch đóng băng + vạch phát hành + đường mục tiêu đều render", () => {
    render(<VerifyChart tl={tlReal} />);
    expect(tlReal.demo).toBe(true); // tiền đề: hist demoData mang demo:true
    expect(screen.getByTestId("verify-demo")).toBeInTheDocument();
    expect(screen.getByTestId("verify-frozen-line")).toBeInTheDocument();
    expect(screen.getByTestId("verify-release")).toBeInTheDocument();
    expect(screen.getByTestId("verify-target")).toBeInTheDocument();
    expect(screen.getByText(`mục tiêu ${tlReal.target}`)).toBeInTheDocument();
    // caption phải nói ra cửa sổ đo + câu trộn grain — chart không im lặng về hai grain
    expect(screen.getByText(new RegExp("hai grain khác nhau"))).toBeInTheDocument();
    expect(screen.getByText(`Phát hành: ${tlReal.releaseLabel}`)).toBeInTheDocument();
  });

  it("demo:false ⇒ KHÔNG nhãn minh hoạ; releaseAfter:null ⇒ KHÔNG vạch phát hành", () => {
    const stripped: VerifyTimeline = {
      ...tlReal,
      demo: false,
      releaseAfter: null,
      releaseLabel: null,
      points: tlReal.points.map((p) => ({ ...p, demo: false })),
    };
    render(<VerifyChart tl={stripped} />);
    expect(screen.queryByTestId("verify-demo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("verify-release")).not.toBeInTheDocument();
  });

  it("target không mang số ⇒ không vẽ đường mục tiêu (không đoán)", () => {
    render(<VerifyChart tl={{ ...tlReal, target: "chưa đặt mục tiêu" }} />);
    expect(screen.queryByTestId("verify-target")).not.toBeInTheDocument();
  });
});
