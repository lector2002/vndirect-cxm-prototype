import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { CoverageBlock } from "./CoverageBlock.tsx";

/* 07/08 (module-i-signal-registry-charter.md D4, F10): khối này trước đây phân bố 30 bước theo dải
   trường `cov` của obs — bỏ hết theo D4 (cov mất quyền tiêu thụ ở mọi nơi, KHÔNG xoá khỏi
   schema/fixture). Bộ test cũ (coverageBuckets, phân bố dải, danh sách "mù nhất"...) đã ghim đúng
   hành vi bị gỡ nên thay hết bằng test cho trạng thái rỗng TRUNG THỰC — route/khối vẫn còn, không
   xoá. */

describe("CoverageBlock — trạng thái rỗng TRUNG THỰC sau khi bỏ trường cov (D4)", () => {
  it("hiện đúng tên khối và nói thẳng chưa có số đo được về độ phủ bằng chứng, không bịa số", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByText("Độ phủ đo lường")).toBeInTheDocument();
    expect(screen.getByTestId("cov-empty")).toHaveTextContent(
      "Chưa có số đo được về độ phủ bằng chứng.",
    );
  });

  // Đọc trực tiếp trường cov của từng obs (KHÔNG qua khối) để chứng minh không giá trị nào rò vào
  // trạng thái rỗng — đây là bằng chứng "không bịa số thay thế", không phải chỗ tiêu thụ mới.
  it("KHÔNG còn hiện bất kỳ con số % nào của trường cov (không bịa số thay thế)", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    const covValues = new Set(seed.obs.map((o) => `${o["cov"]}%`));
    const text = screen.getByTestId("cov-empty").textContent ?? "";
    for (const v of covValues) expect(text).not.toContain(v);
  });

  it("đường sang bản đồ hành trình vẫn còn khi có onGo (route không bị xoá)", () => {
    const onGo = vi.fn();
    render(<CoverageBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByTestId("cov-go-atlas"));
    expect(onGo).toHaveBeenCalledWith("atlas");
  });

  it("vắng onGo: không dựng nút dẫn sang bản đồ hành trình", () => {
    render(<CoverageBlock data={seed} cfg={cfgDefault} />);
    expect(screen.queryByTestId("cov-go-atlas")).not.toBeInTheDocument();
  });
});
