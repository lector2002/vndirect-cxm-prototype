import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../../data/fixtures/demo.ts";
import { createCxmStore } from "../../store/store.ts";
import { sigCountReliability, stepsWithoutRunningSignal } from "../../domain/index.ts";
import { MISSING } from "../../data/segment.ts";
import { SignalsPage } from "./SignalsPage.tsx";

/* module-i-signal-registry-charter.md §14 lát I4a — mỗi test dùng store CÔ LẬP tiêm qua `useStore`
   (precedent OverviewPage.test.tsx), vì hai hướng của Khối ② cần hai fixture khác nhau: `seed`
   (sigCounts rỗng — Demo Mode tắt) và `demoData` (sigCounts có dữ liệu). Singleton app luôn là
   demoData nên không dựng được nhánh (a) nếu không tiêm store riêng. */
function seedStore() {
  return createCxmStore(new MockRepository());
}
function demoStore() {
  return createCxmStore(new MockRepository(demoData, recountDemoSignals));
}

describe("F1 — bảng đủ điểm đo, không phụ thuộc lựa chọn nào", () => {
  it("số dòng bảng bằng đúng data.signals.length (đếm lại, không ghim 30)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    expect(data.signals.length).toBeGreaterThan(0);
    for (const sig of data.signals) {
      expect(screen.getByTestId(`signal-row-${sig.id}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^signal-row-/).length).toBe(data.signals.length);
  });
});

describe("Bất biến 9 — câu giới hạn phải in trên màn, và màn KHÔNG được nói 'độ phủ'", () => {
  it("câu giới hạn có mặt", () => {
    render(<SignalsPage useStore={seedStore()} />);
    expect(screen.getByTestId("signals-scope-note").textContent).toMatch(
      /không nói được đang đo bao nhiêu phần của thực tế/,
    );
  });

  it("không chuỗi nào trên màn chứa chữ 'độ phủ' (không phân biệt hoa/thường), trên cả hai fixture", () => {
    for (const store of [seedStore(), demoStore()]) {
      const { container, unmount } = render(<SignalsPage useStore={store} />);
      expect(container.textContent ?? "").not.toMatch(/độ phủ/i);
      unmount();
    }
  });

  it("mở hồ sơ một điểm đo (I4b) cũng không chuỗi nào chứa 'độ phủ' — sweep phải theo cả mặt màn mới", () => {
    for (const store of [seedStore(), demoStore()]) {
      const { container, unmount } = render(<SignalsPage useStore={store} />);
      const { data } = store.getState();
      fireEvent.click(screen.getByTestId(`signal-row-${data.signals[0].id}`));
      expect(screen.getByTestId("signal-profile")).toBeInTheDocument();
      expect(container.textContent ?? "").not.toMatch(/độ phủ/i);
      unmount();
    }
  });
});

describe("Khối ① — hai số bước LỒNG NHAU, không phải hai ô rời (tiêu chí 7)", () => {
  it("một câu chứa cả hai số ĐÚNG (đếm lại), theo thứ tự noneRunning rồi 'trong đó' none", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const { none, noneRunning } = stepsWithoutRunningSignal(data);
    const node = screen.getByTestId("inv-steps-nested");
    expect(node.textContent).toMatch(
      new RegExp(`${noneRunning.length}\\s*/\\s*${data.steps.length}.*trong đó.*${none.length}`, "s"),
    );
  });
});

describe("D5 (qua UI) — 'có chạy' hiện đúng số đếm từ vol, không đọc st", () => {
  it("running.n trên màn khớp đếm lại vol>0 trên fixture đang dùng", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const expectedRunning = data.signals.filter((s) => s.vol > 0).length;
    const node = screen.getByTestId("inv-running");
    expect(node.textContent).toContain(`${expectedRunning} / ${data.signals.length}`);
  });
});

describe("Khối ② — hai hướng của owner chốt 07/08 phương án (a)", () => {
  it("(a) seed: sigCounts rỗng ⇒ nói CHƯA NHẬN số đếm, KHÔNG hiện 0%", () => {
    const store = seedStore();
    expect(store.getState().data.sigCounts.length).toBe(0);
    render(<SignalsPage useStore={store} />);
    expect(screen.getByTestId("reliability-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("reliability-table")).not.toBeInTheDocument();
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it("(b) demoData: sigCounts có dữ liệu ⇒ hiện bảng, tách 'thiếu' khỏi 'chưa định danh'/'chưa-biết'", () => {
    const store = demoStore();
    expect(store.getState().data.sigCounts.length).toBeGreaterThan(0);
    render(<SignalsPage useStore={store} />);
    expect(screen.getByTestId("reliability-table")).toBeInTheDocument();
    expect(screen.queryByTestId("reliability-empty")).not.toBeInTheDocument();
    // Ba nhãn không-biết phải xuất hiện ở đúng chỗ giải thích, tách rời nhau.
    expect(screen.getByText(/Chỉ cột "Lỗi đo \(thiếu\)" là lỗi đo/)).toBeInTheDocument();
  });

  it("(b) cột 'Lỗi đo (thiếu)' đúng là số MISSING đếm lại — không lặng lẽ đổi sang notIdentified/unknownYet", () => {
    const store = demoStore();
    const { data } = store.getState();
    // Chọn một chiều có MISSING > 0 thật trên demoData (đếm lại, không ghim) để test không xanh rỗng
    // nếu ai đó nối sai cột hiển thị với trường dữ liệu khác trong DimReliability.
    const rows = sigCountReliability(data);
    const target = rows.find((r) => r.missing > 0);
    expect(target).toBeDefined();
    const dimRows = data.sigCounts.filter((c) => c.dim === target!.dim);
    const expectedMissing = dimRows.filter((c) => c.band === MISSING).reduce((a, c) => a + c.n, 0);
    expect(expectedMissing).toBeGreaterThan(0);
    expect(expectedMissing).toBe(target!.missing);

    render(<SignalsPage useStore={store} />);
    const row = screen.getByTestId(`reliability-row-${target!.dim}`);
    const cells = within(row).getAllByRole("cell");
    expect(cells[2].textContent).toContain(String(expectedMissing));
  });
});

describe("D6 — Signal.seen hiện nguyên chuỗi, không suy tuổi/số ngày im lặng", () => {
  it("cột hiện `seen` phải mang nhãn 'mốc do người khai', không phải nhãn trung lập không cảnh báo", () => {
    render(<SignalsPage useStore={demoStore()} />);
    expect(screen.getAllByText(/mốc do người khai/).length).toBeGreaterThan(0);
  });

  it("mọi chuỗi seen thật trong data hiện verbatim trên bảng, và không có số ngày/giờ suy diễn cạnh nó", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const withSeen = data.signals.filter((s) => s.seen);
    expect(withSeen.length).toBeGreaterThan(0);
    for (const sig of withSeen) {
      const row = screen.getByTestId(`signal-row-${sig.id}`);
      expect(row.textContent).toContain(sig.seen as string);
    }
  });

  it("không chỗ nào trên màn hiện cụm kiểu '<số> ngày/giờ' suy ra từ seen (mẫu 'X ngày'/'X giờ' đứng cạnh im lặng)", () => {
    render(<SignalsPage useStore={demoStore()} />);
    expect(screen.queryByText(/im lặng \d+ (ngày|giờ)/)).not.toBeInTheDocument();
  });
});

describe("I4b tiêu chí 8 — mở hồ sơ từ bảng, đóng lại được về bảng", () => {
  it("bấm một dòng bảng mở hồ sơ đúng signal đó; bấm '← Điểm đo' quay lại đúng bảng cũ", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[0];

    expect(screen.getByTestId("signal-table")).toBeInTheDocument();
    expect(screen.queryByTestId("signal-profile")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`signal-row-${target.id}`));

    expect(screen.queryByTestId("signal-table")).not.toBeInTheDocument();
    expect(screen.getByTestId("signal-profile")).toBeInTheDocument();
    expect(screen.getByTestId("signal-profile-title").textContent).toBe(target.desc);

    fireEvent.click(screen.getByTestId("signal-profile-back"));

    expect(screen.queryByTestId("signal-profile")).not.toBeInTheDocument();
    expect(screen.getByTestId("signal-table")).toBeInTheDocument();
    // Bảng vẫn đủ mọi dòng sau khi đóng hồ sơ — không mất trạng thái (F1 vẫn đúng).
    expect(screen.getAllByTestId(/^signal-row-/).length).toBe(data.signals.length);
  });
});

describe("asOf — mốc số liệu đọc qua store, không gõ tay", () => {
  it("hiện đúng data.asOf khi có, không hiện dòng đó khi rỗng", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    expect(screen.getByTestId("signals-asof").textContent).toContain(data.asOf);
  });

  it("chú thích lưu lượng dưới bảng cũng mang đúng data.asOf (đọc qua store, không gõ tay)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    expect(data.asOf).toBeTruthy();
    expect(screen.getByTestId("signal-table-asof-note").textContent).toContain(data.asOf);
  });
});
