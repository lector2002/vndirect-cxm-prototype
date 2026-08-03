import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { OutcomesBlock } from "./OutcomesBlock.tsx";

/* Số suy từ seed:
   out = [CXA-013 (improved), CXA-017 (inconclusive)] → done=2
   act.filter(dl==='released') = [CXA-017, CXA-013] → released=2 → "chưa có kết quả đo" = 2-2=0
   loop.filter(done>=need) = [CXI-013 (25>=25)] → 1/3 (loop.length=3)
   CXA-017 outcome.conf.length=2 (release trùng + nghỉ lễ) · CXA-013 outcome.conf=[] */
describe("OutcomesBlock", () => {
  it("số badge mỗi verdict khớp out theo verdict: 1 'Đã cải thiện' (state=ok), 1 'Chưa kết luận được' (state=unknown), 0 'Xấu đi'", () => {
    render(<OutcomesBlock data={seed} cfg={cfgDefault} />);
    const badges = screen.getAllByTestId("badge");
    expect(badges).toHaveLength(2);
    // Badge port 1-1 prototype badge(): state='ok' → prefix '✓ ', state='unknown' → prefix '— '
    expect(screen.getByText("✓ Đã cải thiện")).toBeInTheDocument();
    expect(screen.getByText("— Chưa kết luận được")).toBeInTheDocument();
    expect(screen.queryByText(/Xấu đi/)).not.toBeInTheDocument();
  });

});
