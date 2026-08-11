import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seed } from "../../data/fixtures/seed.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import { seenAfterAsOf, signalAllocationChain } from "../../domain/index.ts";
import { SignalProfile } from "./SignalProfile.tsx";

/* module-i-signal-registry-charter.md §14 lát I4b — F2/F4/D5/D6. Mọi con số/tập hợp ĐẾM LẠI từ
   fixture bằng find()/filter() thô ngay trong test, không ghim id/số theo §7 charter. */

const noop = () => {};

describe("F2 — hồ sơ đi hết chuỗi allocate, quét MỌI signal trong demoData", () => {
  it("mọi signal: chain hiện đúng tên touchpoint/bước/flow/phase, hoặc nói rõ đứt ở đâu", () => {
    for (const sig of demoData.signals) {
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
      const chain = signalAllocationChain(demoData, sig);
      const chainNode = screen.getByTestId("signal-profile-chain");
      if (chain.ok) {
        expect(chainNode.textContent).toContain(chain.touchpoint.name);
        expect(chainNode.textContent).toContain(chain.step.name);
        expect(chainNode.textContent).toContain(chain.flow.name);
        expect(chainNode.textContent).toContain(chain.phase.name);
      } else {
        expect(chainNode.textContent).toMatch(new RegExp(chain.brokenAt));
      }
      unmount();
    }
  });

  it("mọi signal có metrics rỗng phải nói 'chưa nuôi chỉ số nào' — KHÔNG để trống", () => {
    const withoutMetric = demoData.signals.filter((s) => s.metrics.length === 0);
    expect(withoutMetric.length).toBeGreaterThan(0);
    for (const sig of withoutMetric) {
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
      expect(screen.getByTestId("signal-profile-metrics").textContent).toMatch(/chưa nuôi chỉ số nào/i);
      unmount();
    }
  });

  it("signal có metrics thì hồ sơ hiện đúng TÊN chỉ số (đối chiếu data.metrics), không phải id thô", () => {
    const withMetric = demoData.signals.find((s) => s.metrics.length > 0);
    expect(withMetric).toBeDefined();
    render(<SignalProfile data={demoData} signal={withMetric!} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-metrics");
    for (const mid of withMetric!.metrics) {
      const metric = demoData.metrics.find((m) => m.id === mid);
      expect(node.textContent).toContain(metric?.name ?? mid);
    }
  });

  it("Ai chịu trách nhiệm suy đúng Flow.owner của flow trong chuỗi, ghi rõ là SUY, không khai riêng", () => {
    const sig = demoData.signals.find((s) => signalAllocationChain(demoData, s).ok)!;
    const chain = signalAllocationChain(demoData, sig);
    if (!chain.ok) throw new Error("fixture phải có ít nhất một signal đi hết chuỗi");
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-owner");
    expect(node.textContent).toContain(chain.flow.owner);
    expect(node.textContent).toMatch(/suy từ hành trình/);
  });
});

describe("F4 — ba ô chờ Bảng D, không lấy chuỗi từ desc/name/Touchpoint.name/stationId", () => {
  const FORBIDDEN_TESTIDS = ["signal-profile-screen", "signal-profile-route", "signal-profile-element"];

  it("cả ba ô, trên MỌI signal của demoData: không ô nào chứa desc/name/touchpoint.name/stationId", () => {
    for (const sig of demoData.signals) {
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
      const chain = signalAllocationChain(demoData, sig);
      for (const testId of FORBIDDEN_TESTIDS) {
        const text = screen.getByTestId(testId).textContent ?? "";
        expect(text).not.toContain(sig.desc);
        expect(text).not.toContain(sig.name);
        if (chain.ok) {
          expect(text).not.toContain(chain.touchpoint.name);
          expect(text).not.toContain(chain.step.stationId);
        }
      }
      unmount();
    }
  });

  it("ba ô hiện đúng placeholder tường minh có tên người nợ (team data/mobile), không phải chuỗi rỗng", () => {
    const sig = demoData.signals[0];
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
    for (const testId of FORBIDDEN_TESTIDS) {
      expect(screen.getByTestId(testId).textContent).toMatch(/chờ Bảng D — team data\/mobile/);
    }
  });
});

describe("D5 (UI) — 'đang chạy' suy từ vol, KHÔNG đọc st", () => {
  it("st='designed' mà vol>0 (dữ liệu giả) vẫn phải hiện ĐANG CHẠY", () => {
    const fake = { ...seed.signals[0], id: "sig-test-profile-d5", st: "designed" as const, vol: 777 };
    render(<SignalProfile data={{ ...seed, signals: [...seed.signals, fake] }} signal={fake} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-running").textContent).toMatch(/ĐANG CHẠY/);
  });

  it("st='live' mà vol=0 (dữ liệu giả, ngược lại) vẫn phải hiện CHƯA CHẠY", () => {
    const fake = { ...seed.signals[0], id: "sig-test-profile-d5b", st: "live" as const, vol: 0 };
    render(<SignalProfile data={{ ...seed, signals: [...seed.signals, fake] }} signal={fake} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-running").textContent).toMatch(/CHƯA CHẠY/);
  });

  it("ca thật trên demoData (validating ∧ vol>0) phải hiện cảnh báo 'chưa được đánh dấu tin dùng'", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.st === "validating");
    expect(sig).toBeDefined(); // fixture đo được (charter T8): sg-nap-3/sg4/sg-rut-3/sg11
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-running-not-trusted").textContent).toMatch(
      /chưa được đánh dấu tin dùng/,
    );
  });

  it("signal đang tin dùng (st='live' ∧ vol>0) KHÔNG hiện cảnh báo đó", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.st === "live");
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    expect(screen.queryByTestId("signal-profile-running-not-trusted")).not.toBeInTheDocument();
  });
});

describe("D6 (UI) — Signal.seen hiện verbatim, KHÔNG suy số ngày/giờ im lặng", () => {
  it("chuỗi seen thật hiện nguyên văn, kèm nhãn 'mốc do người khai'", () => {
    const sig = demoData.signals.find((s) => s.seen);
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-seen");
    expect(node.textContent).toContain(sig!.seen as string);
    expect(node.textContent).toMatch(/mốc do người khai/i);
  });

  it("không nơi nào trên hồ sơ hiện cụm 'im lặng N ngày/giờ' suy ra từ seen", () => {
    const sig = demoData.signals.find((s) => s.seen);
    const { container } = render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    expect(container.textContent ?? "").not.toMatch(/im lặng \d+ (ngày|giờ)/);
  });

  it("ca seen MUỘN HƠN asOf (thật trên demoData) PHẢI được nói ra, không bị chặn/ẩn", () => {
    const lateSig = demoData.signals.find((s) => seenAfterAsOf(s.seen, demoData.asOf));
    expect(lateSig).toBeDefined(); // charter §13: '04/08' muộn hơn asOf '27/07/2026'
    render(<SignalProfile data={demoData} signal={lateSig!} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-seen-late");
    expect(node.textContent).toContain(lateSig!.seen as string);
    expect(node.textContent).toContain(demoData.asOf);
    expect(node.textContent).toMatch(/ngoài cửa sổ dữ liệu/);
  });

  it("ca seen KHÔNG muộn hơn asOf thì KHÔNG hiện ghi chú 'ngoài cửa sổ dữ liệu'", () => {
    const onTimeSig = demoData.signals.find((s) => s.seen && !seenAfterAsOf(s.seen, demoData.asOf));
    expect(onTimeSig).toBeDefined();
    render(<SignalProfile data={demoData} signal={onTimeSig!} onBack={noop} />);
    expect(screen.queryByTestId("signal-profile-seen-late")).not.toBeInTheDocument();
  });
});

describe("Mặt 3 — client có thể mất dữ liệu, kèm chuỗi chưa nối được vào nguồn nào", () => {
  it("es==='client' hiện câu client có thể mất dữ liệu", () => {
    const sig = demoData.signals.find((s) => s.es === "client");
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-es").textContent).toMatch(/có thể mất/);
  });

  it("es==='server' KHÔNG hiện câu đó (fact chỉ áp cho client)", () => {
    const sig = demoData.signals.find((s) => s.es === "server");
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-es").textContent).not.toMatch(/có thể mất/);
  });

  it("mọi signal: 'nguồn chở nó' nói rõ chưa nối được vào nguồn nào trong danh sách hiện tại", () => {
    render(<SignalProfile data={demoData} signal={demoData.signals[0]} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-source").textContent).toMatch(
      /chưa nối được vào nguồn nào trong danh sách hiện tại/,
    );
  });
});

describe("Mặt 4 — chỉ liệt kê values[] đã khai, KHÔNG dựng chart (I5 ngoài phạm vi)", () => {
  it("values rỗng ⇒ nói rõ lý do đọc được (chưa chạy), kèm đếm lại số điểm đo khác cùng tình trạng", () => {
    const sig = demoData.signals.find((s) => s.values.length === 0);
    expect(sig).toBeDefined();
    const expectedOthers = demoData.signals.filter((s) => s.values.length === 0).length;
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-values-empty");
    expect(node.textContent).toMatch(/chưa chạy nên chưa có giá trị nào/);
    expect(node.textContent).toContain(`${expectedOthers}/${demoData.signals.length}`);
  });

  it("values có dữ liệu ⇒ liệt kê đúng nguyên mảng values, không vẽ chart", () => {
    const sig = demoData.signals.find((s) => s.values.length > 0);
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} />);
    const node = screen.getByTestId("signal-profile-values");
    for (const v of sig!.values) expect(node.textContent).toContain(v);
  });

  it("luôn cảnh báo sigCounts sinh từ chính bản khai — '0 giá trị ngoài khai báo' không phải bằng chứng sạch", () => {
    render(<SignalProfile data={demoData} signal={demoData.signals[0]} onBack={noop} />);
    expect(screen.getByText(/0 giá trị ngoài khai báo/).textContent).toMatch(/hệ quả/);
  });
});

describe("Tiêu đề hồ sơ dùng Signal.desc, không đặt Signal.name vào chỗ tiêu đề thân thiện", () => {
  it("signal-profile-title hiện đúng desc, KHÁC với name (chọn signal có desc !== name)", () => {
    const sig = demoData.signals.find((s) => s.desc !== s.name)!;
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} />);
    expect(screen.getByTestId("signal-profile-title").textContent).toBe(sig.desc);
  });
});
