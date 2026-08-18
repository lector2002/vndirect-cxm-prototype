import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { cfgDefault, dims, seed } from "../../data/fixtures/seed.ts";
import { demoData } from "../../data/fixtures/demo.ts";
import { seenAfterAsOf, signalAllocationChain, signalChart } from "../../domain/index.ts";
import { SignalProfile } from "./SignalProfile.tsx";

/* module-i-signal-registry-charter.md §14 lát I4b — F2/F4/D5/D6. Mọi con số/tập hợp ĐẾM LẠI từ
   fixture bằng find()/filter() thô ngay trong test, không ghim id/số theo §7 charter. */

const noop = () => {};

describe("F2 — hồ sơ đi hết chuỗi allocate, quét MỌI signal trong demoData", () => {
  it("mọi signal: chain hiện đúng tên touchpoint/bước/flow/phase, hoặc nói rõ đứt ở đâu", () => {
    for (const sig of demoData.signals) {
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
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
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
      expect(screen.getByTestId("signal-profile-metrics").textContent).toMatch(/chưa nuôi chỉ số nào/i);
      // Owner 18/08 tối: đuôi đếm toàn cục "X/Y điểm đo đang ở tình trạng này" đã bỏ.
      expect(screen.getByTestId("signal-profile-metrics").textContent).not.toMatch(/tình trạng này/);
      unmount();
    }
  });

  it("signal có metrics thì hồ sơ hiện đúng TÊN chỉ số (đối chiếu data.metrics), không phải id thô", () => {
    const withMetric = demoData.signals.find((s) => s.metrics.length > 0);
    expect(withMetric).toBeDefined();
    render(<SignalProfile data={demoData} signal={withMetric!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-metrics");
    for (const mid of withMetric!.metrics) {
      const metric = demoData.metrics.find((m) => m.id === mid);
      expect(node.textContent).toContain(metric?.name ?? mid);
    }
  });

  it("Ai chịu trách nhiệm suy đúng Flow.owner của flow trong chuỗi (luật 11/08: đã bỏ chú giải 'suy từ hành trình')", () => {
    const sig = demoData.signals.find((s) => signalAllocationChain(demoData, s).ok)!;
    const chain = signalAllocationChain(demoData, sig);
    if (!chain.ok) throw new Error("fixture phải có ít nhất một signal đi hết chuỗi");
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-owner");
    expect(node.textContent).toContain(chain.flow.owner);
    expect(node.textContent).not.toMatch(/suy từ hành trình/);
  });
});

describe("F4 — ba ô chờ Bảng D, không lấy chuỗi từ desc/name/Touchpoint.name/stationId", () => {
  const FORBIDDEN_TESTIDS = ["signal-profile-screen", "signal-profile-route", "signal-profile-element"];

  it("cả ba ô, trên MỌI signal của demoData: không ô nào chứa desc/name/touchpoint.name/stationId", () => {
    for (const sig of demoData.signals) {
      const { unmount } = render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
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
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
    for (const testId of FORBIDDEN_TESTIDS) {
      expect(screen.getByTestId(testId).textContent).toMatch(/chờ Bảng D — team data\/mobile/);
    }
  });
});

describe("D5 (UI) — 'đang chạy' suy từ vol, KHÔNG đọc st", () => {
  it("st='designed' mà vol>0 (dữ liệu giả) vẫn phải hiện ĐANG CHẠY", () => {
    const fake = { ...seed.signals[0], id: "sig-test-profile-d5", st: "designed" as const, vol: 777 };
    render(<SignalProfile data={{ ...seed, signals: [...seed.signals, fake] }} signal={fake} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("signal-profile-running").textContent).toMatch(/✓ RUNNING/);
  });

  it("st='live' mà vol=0 (dữ liệu giả, ngược lại) vẫn phải hiện CHƯA CHẠY", () => {
    const fake = { ...seed.signals[0], id: "sig-test-profile-d5b", st: "live" as const, vol: 0 };
    render(<SignalProfile data={{ ...seed, signals: [...seed.signals, fake] }} signal={fake} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("signal-profile-running").textContent).toMatch(/NOT RUNNING/);
  });

  it("ca thật trên demoData (validating ∧ vol>0) phải hiện cảnh báo 'chưa được đánh dấu tin dùng'", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.st === "validating");
    expect(sig).toBeDefined(); // fixture đo được (charter T8): sg-nap-3/sg4/sg-rut-3/sg11
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("signal-profile-running-not-trusted").textContent).toMatch(
      /chưa được đánh dấu tin dùng/,
    );
  });

  it("signal đang tin dùng (st='live' ∧ vol>0) KHÔNG hiện cảnh báo đó", () => {
    const sig = demoData.signals.find((s) => s.vol > 0 && s.st === "live");
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.queryByTestId("signal-profile-running-not-trusted")).not.toBeInTheDocument();
  });
});

describe("D6 (UI) — Signal.seen hiện verbatim, KHÔNG suy số ngày/giờ im lặng", () => {
  it("chuỗi seen thật hiện nguyên văn", () => {
    const sig = demoData.signals.find((s) => s.seen);
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-seen");
    expect(node.textContent).toContain(sig!.seen as string);
  });

  it("không nơi nào trên hồ sơ hiện cụm 'im lặng N ngày/giờ' suy ra từ seen", () => {
    const sig = demoData.signals.find((s) => s.seen);
    const { container } = render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(container.textContent ?? "").not.toMatch(/im lặng \d+ (ngày|giờ)/);
  });

  it("ca seen MUỘN HƠN asOf (thật trên demoData) PHẢI được nói ra, không bị chặn/ẩn", () => {
    const lateSig = demoData.signals.find((s) => seenAfterAsOf(s.seen, demoData.asOf));
    expect(lateSig).toBeDefined(); // charter §13: '04/08' muộn hơn asOf '27/07/2026'
    render(<SignalProfile data={demoData} signal={lateSig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-seen-late");
    /* luật 12/08 bỏ đuôi "— tức nằm ngoài cửa sổ dữ liệu hiện có" nên assertion đó đi theo. Điều
       test canh KHÔNG đổi: ca seen muộn hơn asOf phải hiện ra, kèm ĐỦ HAI MỐC để người đọc tự so. */
    expect(node.textContent).toContain(lateSig!.seen as string);
    expect(node.textContent).toContain(demoData.asOf);
  });

  it("ca seen KHÔNG muộn hơn asOf thì KHÔNG hiện ghi chú so hai mốc", () => {
    const onTimeSig = demoData.signals.find((s) => s.seen && !seenAfterAsOf(s.seen, demoData.asOf));
    expect(onTimeSig).toBeDefined();
    render(<SignalProfile data={demoData} signal={onTimeSig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.queryByTestId("signal-profile-seen-late")).not.toBeInTheDocument();
  });
});

describe("Mặt 3 — phía client/server hiện đúng giá trị, kèm chuỗi chưa nối được vào nguồn nào", () => {
  it("hiện đúng dòng 'Phía: client' hoặc 'Phía: server' khớp Signal.es (luật 11/08: đã bỏ câu 'có thể mất dữ liệu')", () => {
    for (const es of ["client", "server"] as const) {
      const sig = demoData.signals.find((s) => (s.es === "server" ? "server" : "client") === es);
      expect(sig).toBeDefined();
      const { unmount } = render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
      const node = screen.getByTestId("signal-profile-es");
      expect(node.textContent).toContain("Side");
      expect(node.textContent).toContain(es);
      expect(node.textContent).not.toMatch(/có thể mất/);
      unmount();
    }
  });

  it("18/08 tối (owner): 'Nguồn chở nó...' + 'Chưa có trường nào nối...' đã XOÁ — sai từ khi có srcId (§10c)", () => {
    render(<SignalProfile data={demoData} signal={demoData.signals[0]} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.queryByTestId("signal-profile-source")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signal-profile-freshness-hold")).not.toBeInTheDocument();
  });
});

describe("Mặt 4 — liệt kê values[] đã khai, KÈM chart phân bố giá trị (F5, I5)", () => {
  it("values rỗng ⇒ MỘT câu trạng thái ngắn, không đếm hộ toàn cục (owner 18/08 tối)", () => {
    const sig = demoData.signals.find((s) => s.values.length === 0);
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-values-empty");
    expect(node.textContent).toContain("Chưa có giá trị nào đã khai.");
    expect(node.textContent).not.toMatch(/tình trạng này/);
    // Từ chối vẽ chart theo lý do #1 — KHÔNG dựng chart, KHÔNG hiện chip values.
    expect(screen.queryByTestId("signal-profile-values")).not.toBeInTheDocument();
    expect(screen.queryByTestId("signal-profile-value-chart")).not.toBeInTheDocument();
  });

  it("values có dữ liệu ⇒ liệt kê đúng nguyên mảng values (chip), không đổi hành vi cũ", () => {
    const sig = demoData.signals.find((s) => s.values.length > 0);
    expect(sig).toBeDefined();
    render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
    const node = screen.getByTestId("signal-profile-values");
    for (const v of sig!.values) expect(node.textContent).toContain(v);
  });

  it("luật 11/08: đã bỏ cảnh báo '0 giá trị ngoài khai báo', hồ sơ vẫn hiện đúng khối giá trị", () => {
    const sig = demoData.signals[0];
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.queryByText(/giá trị ngoài khai báo/)).not.toBeInTheDocument();
    const expectedTestId = sig.values.length === 0 ? "signal-profile-values-empty" : "signal-profile-values";
    expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
  });

  describe("F5 — chart phân bố giá trị, hai lý do TỪ CHỐI khác nhau", () => {
    it("lý do #2: values có khai mà KHÔNG có dòng sigCounts nào của chính signal đó (đường seed — sigCounts rỗng) ⇒ từ chối vẽ, KHÁC câu của lý do #1", () => {
      const sig = seed.signals.find((s) => s.values.length > 0);
      expect(sig).toBeDefined(); // tiền đề: seed có ít nhất một signal đã khai values
      expect(seed.sigCounts.length).toBe(0); // tiền đề: đường "sigCounts rỗng" của seed

      render(<SignalProfile data={seed} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
      const node = screen.getByTestId("signal-profile-values-no-counts");
      expect(node.textContent).toMatch(/chưa có dòng đếm nào/);
      // Hai lý do phải nói KHÁC NHAU — không lẫn câu "chưa chạy" của lý do #1 vào đây.
      expect(node.textContent).not.toMatch(/chưa chạy nên chưa có giá trị nào/);
      expect(screen.queryByTestId("signal-profile-value-chart")).not.toBeInTheDocument();
      // Chip values vẫn hiện — khác lý do #1, ở đây signal ĐÃ khai giá trị, chỉ thiếu số đếm.
      expect(screen.getByTestId("signal-profile-values")).toBeInTheDocument();
    });

    it("lý do #2 KHÔNG áp cho signal đang có dòng sigCounts thật (đường demoData) — vẽ chart thay vì từ chối", () => {
      const sig = demoData.signals.find(
        (s) => s.values.length > 0 && demoData.sigCounts.some((r) => r.sig === s.id),
      );
      expect(sig).toBeDefined(); // tiền đề: demoData có ≥1 signal vừa khai values vừa có dòng đếm
      render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
      expect(screen.queryByTestId("signal-profile-values-no-counts")).not.toBeInTheDocument();
      expect(screen.getByTestId("signal-profile-value-chart")).toBeInTheDocument();
    });

    it("chart hiện đúng nhóm cột của signalChart() — đối chiếu độc lập, không đọc lại DOM để tự xác nhận DOM", () => {
      const sig = demoData.signals.find(
        (s) => s.values.length > 0 && demoData.sigCounts.some((r) => r.sig === s.id),
      );
      expect(sig).toBeDefined();
      const chart = signalChart(demoData.sigCounts, [sig!], dims, [sig!.id], "nav");
      expect(chart.groups.length).toBeGreaterThan(0); // tiền đề: sig có rows nên vol>0 ⇒ group thật

      render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
      const navBtn = screen.getByTestId("signal-profile-dim-nav");
      const navState = chart.dimStates.find((d) => d.id === "nav")!;
      if (navState.state === "locked") {
        expect(navBtn).toBeDisabled();
        // luật 11/08: đã bỏ lời mời "chọn một chiều khác ở trên để xem chart"
        expect(screen.getByText(/không ghi được cho điểm đo này/)).toBeInTheDocument();
        expect(screen.queryByText(/chọn một chiều khác/)).not.toBeInTheDocument();
      } else {
        expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
      }
    });

    it("bấm một chiều khác thì đổi chiều đang chọn (aria-pressed), không tự vẽ theo chiều mặc định mãi", () => {
      const sig = demoData.signals.find(
        (s) => s.values.length > 0 && demoData.sigCounts.some((r) => r.sig === s.id),
      );
      expect(sig).toBeDefined();
      render(<SignalProfile data={demoData} signal={sig!} onBack={noop} dims={dims} cfg={cfgDefault} />);
      const sigpfBtn = screen.getByTestId("signal-profile-dim-sigpf");
      // sigpf KHÔNG BAO GIỜ khoá khi signal có ≥1 dòng sigCounts: projectSignalCounts.ts ghi một
      // dòng sigpf cho MỌI lần bắn (SIG_FIRE_DIM vô điều kiện) — nếu điều này sai thì test phải ĐỎ,
      // không lặng lẽ bỏ qua (luật 2: test không được rỗng).
      expect(sigpfBtn).not.toBeDisabled();
      fireEvent.click(sigpfBtn);
      expect(sigpfBtn).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("signal-profile-dim-nav")).toHaveAttribute("aria-pressed", "false");
    });
  });
});

describe("Tiêu đề hồ sơ dùng Signal.desc, không đặt Signal.name vào chỗ tiêu đề thân thiện", () => {
  it("signal-profile-title hiện đúng desc, KHÁC với name (chọn signal có desc !== name)", () => {
    const sig = demoData.signals.find((s) => s.desc !== s.name)!;
    render(<SignalProfile data={demoData} signal={sig} onBack={noop} dims={dims} cfg={cfgDefault} />);
    expect(screen.getByTestId("signal-profile-title").textContent).toBe(sig.desc);
  });
});
