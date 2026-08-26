import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  /* 26/08 (owner "mở thêm nút bấm"): tiêu đề mỗi dòng → hồ sơ điểm gãy của action đó. Cặp
     outcome↔issue suy từ seed qua join act, không ghim id. */
  it("có onGo: tiêu đề mỗi dòng bấm được, gọi onGo('issue/<id>') đúng issue của action", () => {
    const onGo = vi.fn();
    render(<OutcomesBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    for (const o of seed.out) {
      const issue = seed.iss.find((i) => i.act === o.act)!;
      fireEvent.click(screen.getByTestId(`outcome-open-${issue.id}`));
      expect(onGo).toHaveBeenLastCalledWith(`issue/${issue.id}`);
    }
    expect(onGo).toHaveBeenCalledTimes(seed.out.length);
  });

  it("không truyền onGo: tiêu đề là chữ tĩnh, không còn nút bấm", () => {
    render(<OutcomesBlock data={seed} cfg={cfgDefault} />);
    for (const o of seed.out) {
      const issue = seed.iss.find((i) => i.act === o.act)!;
      expect(screen.queryByTestId(`outcome-open-${issue.id}`)).not.toBeInTheDocument();
    }
  });
});
