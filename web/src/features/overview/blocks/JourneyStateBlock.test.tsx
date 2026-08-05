import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { cfgDefault, seed } from "../../../data/fixtures/seed.ts";
import { stepState } from "../../../domain/index.ts";
import { JourneyStateBlock } from "./JourneyStateBlock.tsx";

/* Số suy từ seed + cfgDefault (đối chiếu độc lập với domain/state.test.ts đã có).
   Ngưỡng: failCrit 15% · failWatch 5% · covMin 70 · effortMax 2,0.
   Mở tài khoản (s1..s6) = ok watch crit ok watch ok → crit 1 · watch 2 · ok 3.
   Pilot mở rộng 05/08 thêm 24 bước (mở TK phái sinh · nạp · tra soát · rút · chuyển nội bộ):
     crit 1  = s-dvo-1 (190/1240 = 15,3% — chặn vì chưa có TK cơ sở / chưa xác thực CCCD)
     watch 9 = s-dvo-3, s-tra-1, s-tra-3, s-tra-4, s-rut-1, s-rut-3, s-rut-4, s-rut-6, s-ctn-2
     ok 14   = phần còn lại
   → tổng crit 2 · watch 11 · ok 17 = 30 = steps.length.
   flows.length=32, flows.filter(observed)=6 (f-open-2026 + 5 flow pilot mở rộng) → "flow chưa đo" = 26 */

const obsOf = (stepId: string) => seed.obs.find((o) => o.stepId === stepId)!;
const flowsWithSteps = [...new Set(seed.steps.map((s) => s.flowId))];

describe("JourneyStateBlock — bốn ô đếm", () => {
  it("cnt(crit)+cnt(watch)+cnt(ok) = steps.length (30) — đọc đúng .t-num, không phải substring", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    const valueOf = (el: HTMLElement) => el.querySelector(".t-num")!.textContent;
    expect(valueOf(stats[0]!)).toBe("2"); // Cần xử lý ngay = s3, s-dvo-1
    expect(valueOf(stats[1]!)).toBe("11"); // Cần theo dõi
    expect(valueOf(stats[2]!)).toBe("17"); // Đang kiểm soát
    const sum = [0, 1, 2].reduce((a, i) => a + Number(valueOf(stats[i]!)), 0);
    expect(sum).toBe(seed.steps.length);
  });

  it("'Flow chưa đo' = 26 (32 flow map, 6 flow đã quan sát)", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const stats = screen.getAllByTestId("stat");
    expect(stats[3]!.textContent).toContain("26");
    expect(stats[3]!.textContent).toContain("trên 32 flow đã map");
  });
});

/* Khối cũ render một chip cho MỖI bước — sáu chip hồi pilot có một flow, thành 30 chip sau khi
   owner mở pilot lên hai phase. Owner chốt 05/08: gộp theo hành trình, mỗi flow một dòng. */
describe("JourneyStateBlock — gộp theo hành trình", () => {
  it("một dòng cho mỗi flow ĐÃ KHAI BƯỚC, không phải một chip cho mỗi bước", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const rows = screen.getByTestId("journey-flow-rows").querySelectorAll("button");
    expect(rows).toHaveLength(flowsWithSteps.length);
    // Guard: nếu ai đó quay lại lối cũ thì số dòng sẽ vọt lên bằng số bước — chặn ngay tại đây.
    expect(rows.length).toBeLessThan(seed.steps.length);
  });

  /* Lý do gộp KHÔNG chỉ là gọn: mã bước lặp giữa các flow ("01" có 6 nghĩa), nên chip cũ không nói
     được nó thuộc hành trình nào. Tên flow phải đứng ngay trên dòng thì mập mờ đó mới hết. */
  it("mã bước lặp giữa các flow — nên mỗi dòng phải tự nêu tên hành trình", () => {
    const codeCount = new Map<string, number>();
    for (const s of seed.steps) codeCount.set(s.code, (codeCount.get(s.code) ?? 0) + 1);
    expect(Math.max(...codeCount.values())).toBeGreaterThan(1); // tiền đề của test này

    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    for (const flowId of flowsWithSteps) {
      const flow = seed.flows.find((f) => f.id === flowId)!;
      expect(screen.getByTestId(`journey-flow-${flowId}`)).toHaveTextContent(flow.name);
    }
  });

  it("mỗi dòng nêu bước NGOÀI NGƯỠNG tệ nhất của flow đó, kèm tỷ lệ của chính bước ấy", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    for (const flowId of flowsWithSteps) {
      const off = seed.steps
        .filter((s) => s.flowId === flowId)
        .map((s) => ({ s, o: obsOf(s.id), st: stepState(obsOf(s.id), cfgDefault) }))
        .filter((x) => x.st === "crit" || x.st === "watch")
        .sort((a, b) => b.o.failed / b.o.entered - a.o.failed / a.o.entered);
      if (off.length === 0) continue;
      const row = screen.getByTestId(`journey-flow-${flowId}`);
      expect(row).toHaveTextContent(`${off[0]!.s.code} ${off[0]!.s.name}`);
      // Bước tệ NHÌ không được lên dòng — nó chỉ được đếm.
      if (off.length > 1) expect(row).not.toHaveTextContent(off[1]!.s.name);
    }
  });

  it("còn bao nhiêu bước ngoài ngưỡng nữa thì nói ra, không im lặng bỏ", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    for (const flowId of flowsWithSteps) {
      const offCount = seed.steps
        .filter((s) => s.flowId === flowId)
        .filter((s) => ["crit", "watch"].includes(stepState(obsOf(s.id), cfgDefault))).length;
      const row = screen.getByTestId(`journey-flow-${flowId}`);
      if (offCount > 1) {
        expect(row).toHaveTextContent(`+${offCount - 1} bước nữa ngoài ngưỡng`);
      } else {
        expect(row).not.toHaveTextContent(/bước nữa ngoài ngưỡng/);
      }
    }
  });

  it("xếp hành trình đau nhất lên đầu; flow không có bước nào ngoài ngưỡng xuống cuối", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const rows = [...screen.getByTestId("journey-flow-rows").querySelectorAll("button")];
    const worstRate = (flowId: string) => {
      const rates = seed.steps
        .filter((s) => s.flowId === flowId)
        .filter((s) => ["crit", "watch"].includes(stepState(obsOf(s.id), cfgDefault)))
        .map((s) => obsOf(s.id).failed / obsOf(s.id).entered);
      return rates.length ? Math.max(...rates) : -1;
    };
    const order = rows.map((el) =>
      worstRate(el.getAttribute("data-testid")!.replace("journey-flow-", "")),
    );
    expect(order).toEqual([...order].sort((a, b) => b - a));
    // Đầu bảng phải là bước crit tệ nhất toàn pilot: 03 Liveness & Face match (mở TK cơ sở).
    expect(rows[0]).toHaveTextContent("03 Liveness & Face match");
  });

  /* Ba nghĩa của "không có gì để báo" phải tách hẳn — flow chưa đo bước nào KHÔNG được trông giống
     flow mọi bước đều trong ngưỡng. Seed hôm nay đo hết 30/30 nên ca "chưa đo" dựng bằng data rút
     gọn: bỏ hết obs của một flow rồi đòi màn nói đúng chuyện đó. */
  it("flow đã khai bước mà chưa đo bước nào thì nói 'chưa đo', không nói 'mọi bước trong ngưỡng'", () => {
    const target = flowsWithSteps[0]!;
    const targetSteps = seed.steps.filter((s) => s.flowId === target);
    const blind = { ...seed, obs: seed.obs.filter((o) => !targetSteps.some((s) => s.id === o.stepId)) };

    render(<JourneyStateBlock data={blind} cfg={cfgDefault} />);
    const row = screen.getByTestId(`journey-flow-${target}`);
    expect(row).toHaveTextContent(`Chưa đo bước nào trong ${targetSteps.length} bước đã khai`);
    expect(row).not.toHaveTextContent(/Mọi bước trong ngưỡng/);
  });

  it("flow đo rồi mà mọi bước trong ngưỡng thì nói đúng như vậy, kèm mẫu số", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const clean = flowsWithSteps.find((id) =>
      seed.steps
        .filter((s) => s.flowId === id)
        .every((s) => stepState(obsOf(s.id), cfgDefault) === "ok"),
    );
    expect(clean).toBeDefined(); // f-dep-4ch — seed đổi thì test này phải đỏ, không lặng lẽ bỏ qua
    const n = seed.steps.filter((s) => s.flowId === clean).length;
    expect(screen.getByTestId(`journey-flow-${clean}`)).toHaveTextContent(
      `Mọi bước trong ngưỡng (${n}/${n} bước đã đo)`,
    );
  });

  it("chip mẫu số nói rõ đang hiện bao nhiêu — 17 bước trong ngưỡng không bị giấu, chỉ không chiếm chỗ", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    const off = seed.steps.filter((s) =>
      ["crit", "watch"].includes(stepState(obsOf(s.id), cfgDefault)),
    ).length;
    expect(screen.getByTestId("denom-strip")).toHaveTextContent(
      `Đang hiện ${flowsWithSteps.length} hành trình đã khai bước trên ${seed.flows.length} flow đã map · ${off} trên ${seed.steps.length} bước ngoài ngưỡng`,
    );
  });

  it("bấm một dòng hành trình gọi onGo('atlas')", () => {
    const onGo = vi.fn();
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} onGo={onGo} />);
    fireEvent.click(screen.getByTestId(`journey-flow-${flowsWithSteps[0]}`));
    expect(onGo).toHaveBeenCalledWith("atlas");
  });

  it("tooltip của dòng = stepWhy() của chính bước tệ nhất đang hiện", () => {
    render(<JourneyStateBlock data={seed} cfg={cfgDefault} />);
    // f-open-2026: bước tệ nhất là s3 (16,7% ≥ ngưỡng xử lý 15%).
    expect(screen.getByTestId("journey-flow-f-open-2026")).toHaveAttribute(
      "title",
      expect.stringContaining("ngưỡng xử lý 15%"),
    );
  });
});
