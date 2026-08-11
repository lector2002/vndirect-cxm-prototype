import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, seed } from "../../data/fixtures/seed.ts";
import { flowHasSourceCitation, flowStepsCopied, sourceHealth } from "../../domain/index.ts";
import { SignalGovernanceBlock } from "./SignalGovernanceBlock.tsx";
import { SignalInventoryBlock } from "./SignalInventoryBlock.tsx";

/* module-i-signal-registry-charter.md §6/§14 lát I5 — T1·T3·T4·T5·T7. Mọi số ĐẾM LẠI từ fixture
   ngay trong test bằng chính các hàm domain component dùng, không ghim số (§7 charter — dự án đã
   dính ba lần). Chốt chống rỗng ở mỗi tình trạng để vòng lặp/điều kiện không xanh vì dữ liệu không
   chứa ca lệch (luật 2 của contract). */

describe("T1 — flow đã trích dẫn sơ đồ mà chưa chép bước, tách 'chưa đánh giá được' khỏi mẫu số", () => {
  it("N/M đếm lại đúng bằng flowHasSourceCitation/flowStepsCopied, kèm số flow chưa đánh giá được", () => {
    const evaluated = seed.flows.filter((f) => flowHasSourceCitation(f) || flowStepsCopied(f, seed.steps));
    const citedNotCopied = evaluated.filter((f) => flowHasSourceCitation(f) && !flowStepsCopied(f, seed.steps));
    const notEvaluated = seed.flows.length - evaluated.length;
    // Chốt chống rỗng: seed phải có cả hai tình trạng để test không xanh vì thiếu ca.
    expect(citedNotCopied.length).toBeGreaterThan(0);
    expect(notEvaluated).toBeGreaterThan(0);

    render(<SignalGovernanceBlock data={seed} cfg={cfgDefault} />);
    const node = screen.getByTestId("gov-t1");
    expect(node.textContent).toContain(`${citedNotCopied.length} / ${evaluated.length}`);
    expect(screen.getByTestId("gov-t1-not-evaluated").textContent).toContain(String(notEvaluated));
  });

  it("flow chưa đánh giá được (không citation, không steps) KHÔNG lọt vào mẫu số M", () => {
    const evaluated = seed.flows.filter((f) => flowHasSourceCitation(f) || flowStepsCopied(f, seed.steps));
    const blank = seed.flows.find((f) => !flowHasSourceCitation(f) && !flowStepsCopied(f, seed.steps));
    expect(blank).toBeDefined(); // tiền đề: seed có ít nhất một flow "chưa đánh giá được"
    expect(evaluated).not.toContain(blank);
  });
});

describe("T3 — nguồn đã ngừng gửi (down) mà vẫn khai nuôi ít nhất một chỉ số", () => {
  it("N/M đếm lại đúng bằng sourceHealth==='down' && metrics.length>0, KHÔNG gộp 'stale'/'silent'", () => {
    const broken = seed.sources.filter(
      (s) => sourceHealth(s, cfgDefault, seed.asOf) === "down" && s.metrics.length > 0,
    );
    expect(broken.length).toBeGreaterThan(0); // src-zalo: down, khai nuôi m-repeat

    render(<SignalGovernanceBlock data={seed} cfg={cfgDefault} />);
    expect(screen.getByTestId("gov-t3").textContent).toContain(`${broken.length} / ${seed.sources.length}`);
  });

  it("nguồn 'stale' hoặc 'silent' KHÔNG được tính vào T3 — chỉ 'down' mới là đứt hẳn", () => {
    const staleOrSilent = seed.sources.filter((s) => {
      const h = sourceHealth(s, cfgDefault, seed.asOf);
      return h === "stale" || h === "silent";
    });
    expect(staleOrSilent.length).toBeGreaterThan(0); // src-survey: stale trên seed hôm nay
    const broken = seed.sources.filter(
      (s) => sourceHealth(s, cfgDefault, seed.asOf) === "down" && s.metrics.length > 0,
    );
    for (const s of staleOrSilent) expect(broken).not.toContain(s);
  });
});

/* T5 và T7 trưng ở KHỐI ① (`SignalInventoryBlock`), không ở khối này — bản đầu của lát I5 hiện chúng
   ở CẢ HAI khối trên cùng một màn, đã cắt (xem docblock `SignalGovernanceBlock.tsx`). Hai test dưới
   đây KHÔNG xoá theo, chỉ đổi khối soi: trước lát này chưa có test nào chạm `inv-signal-no-metric` /
   `inv-metric-no-signal`, xoá đi là mất hẳn phần phủ chứ không phải dọn trùng.
   T4 không lặp ở đây vì `inv-steps-nested` ĐÃ có test riêng ở `SignalsPage.test.tsx`. */

describe("T5 — điểm đo không nuôi chỉ số nào (trưng ở khối ①)", () => {
  it("N/M đếm lại đúng bằng signalsWithoutMetric", () => {
    const withoutMetric = seed.signals.filter((s) => s.metrics.length === 0);
    expect(withoutMetric.length).toBeGreaterThan(0);
    render(<SignalInventoryBlock data={seed} />);
    expect(screen.getByTestId("inv-signal-no-metric").textContent).toContain(
      `${withoutMetric.length} / ${seed.signals.length}`,
    );
  });
});

describe("T7 — chỉ số không có điểm đo nào nuôi (trưng ở khối ①)", () => {
  it("N/M đếm lại đúng bằng metricsWithoutSignal", () => {
    const fed = new Set(seed.signals.flatMap((s) => s.metrics));
    const withoutSignal = seed.metrics.filter((m) => !fed.has(m.id));
    expect(withoutSignal.length).toBeGreaterThan(0); // m-ces, m-repeat (charter §6 T7)
    render(<SignalInventoryBlock data={seed} />);
    expect(screen.getByTestId("inv-metric-no-signal").textContent).toContain(
      `${withoutSignal.length} / ${seed.metrics.length}`,
    );
  });
});

/* Chốt chống tái phát: ba tình trạng của khối ① KHÔNG được xuất hiện lại ở khối này. Không có test
   này thì lần sau ai đó thêm lại một dòng cho "đủ năm" là im lặng dựng lại đúng bug vừa cắt. */
describe("không trưng lại tình trạng đã có ở khối ①", () => {
  it("khối này KHÔNG chứa T4/T5/T7 — trùng khối trên cùng một màn là bug đọc, không phải bug số", () => {
    render(<SignalGovernanceBlock data={seed} cfg={cfgDefault} />);
    for (const id of ["gov-t4", "gov-t5", "gov-t7"]) {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
    // Tiền đề: hai dòng đúng phạm vi vẫn còn, để test trên không xanh vì khối rỗng.
    expect(screen.getByTestId("gov-t1")).toBeInTheDocument();
    expect(screen.getByTestId("gov-t3")).toBeInTheDocument();
  });
});

describe("F6 — flow chưa chép bước KHÔNG vào mẫu số của bất kỳ tỉ lệ nào", () => {
  it("thêm một flow trống (không trích dẫn, không chép bước) vào BẢN SAO ⇒ bốn tình trạng khác + N/M của T1 không đổi, chỉ đếm 'chưa đánh giá được' tăng đúng 1", () => {
    // Tỉ lệ N/M của T1 đứng CHUNG một <li> với ô "chưa đánh giá được" (advisor: fold vào đuôi dòng
    // T1, không phải dòng thứ sáu) — nên so sánh phải TÁCH RA đúng phần "N / M" bằng regex, KHÔNG so
    // toàn bộ textContent của cả <li> (ô đuôi thay đổi là ĐÚNG chủ ý, không phải hồi quy).
    const ratioOf = (text: string | null) => text?.match(/^\s*\d+\s*\/\s*\d+/)?.[0];
    /* Dựng CẢ HAI khối của màn, không riêng khối này: F6 nói "mọi tỉ lệ", nên phép so phải phủ luôn
       ba tỉ lệ ở khối ① — chỗ T4/T5/T7 thật sự đang hiện sau khi cắt trùng lặp. */
    const Man = ({ d }: { d: typeof seed }) => (
      <>
        <SignalInventoryBlock data={d} />
        <SignalGovernanceBlock data={d} cfg={cfgDefault} />
      </>
    );
    const { unmount: unmountBefore } = render(<Man d={seed} />);
    const before = {
      t1Ratio: ratioOf(screen.getByTestId("gov-t1").textContent),
      stub: screen.getByTestId("gov-t1-not-evaluated").textContent,
      t3: screen.getByTestId("gov-t3").textContent,
      /* Ba tình trạng của khối ① kiểm ngay tại khối ① — cùng bản sao dữ liệu, cùng phép so. Thêm một
         flow trống KHÔNG được đổi số nào ở đó (F6 áp cho MỌI tỉ lệ trên màn, không riêng khối này). */
      inv: [
        screen.getByTestId("inv-steps-nested").textContent,
        screen.getByTestId("inv-signal-no-metric").textContent,
        screen.getByTestId("inv-metric-no-signal").textContent,
      ],
    };
    expect(before.t1Ratio).toBeTruthy(); // tiền đề: dòng T1 có đúng khuôn "N / M"
    const evaluatedBefore = seed.flows.filter(
      (f) => flowHasSourceCitation(f) || flowStepsCopied(f, seed.steps),
    ).length;
    const notEvaluatedBefore = seed.flows.length - evaluatedBefore;
    unmountBefore();

    // Flow trống: src:'—' (chưa trích dẫn) và KHÔNG thêm Step nào trỏ flowId của nó (chưa chép bước).
    // "chỉ cần steps: []" (contract) = không thêm Step tham chiếu, KHÔNG phải field `steps` trên Flow
    // (Flow không có field đó).
    const blankFlow = { ...seed.flows[0]!, id: "f-test-blank-i5", name: "Flow test trống (I5 F6)", src: "—" };
    const copy = { ...seed, flows: [...seed.flows, blankFlow] };

    render(<Man d={copy} />);
    expect(ratioOf(screen.getByTestId("gov-t1").textContent)).toBe(before.t1Ratio);
    expect(screen.getByTestId("gov-t3").textContent).toBe(before.t3);
    expect([
      screen.getByTestId("inv-steps-nested").textContent,
      screen.getByTestId("inv-signal-no-metric").textContent,
      screen.getByTestId("inv-metric-no-signal").textContent,
    ]).toEqual(before.inv);

    const evaluatedAfter = copy.flows.filter(
      (f) => flowHasSourceCitation(f) || flowStepsCopied(f, copy.steps),
    ).length;
    const notEvaluatedAfter = copy.flows.length - evaluatedAfter;
    expect(notEvaluatedAfter).toBe(notEvaluatedBefore + 1);
    expect(screen.getByTestId("gov-t1-not-evaluated").textContent).not.toBe(before.stub);
    expect(screen.getByTestId("gov-t1-not-evaluated").textContent).toContain(String(notEvaluatedAfter));
  });
});
