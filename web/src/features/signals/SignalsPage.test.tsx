import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../../data/fixtures/demo.ts";
import { createCxmStore } from "../../store/store.ts";
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

describe("Bất biến 9 (bị owner ghi đè 11/08) — câu giới hạn đã bỏ, màn vẫn KHÔNG được nói 'độ phủ'", () => {
  it("luật 11/08 (bổ sung): câu giới hạn đầu màn đã bỏ, không còn testid signals-scope-note", () => {
    render(<SignalsPage useStore={seedStore()} />);
    expect(screen.queryByTestId("signals-scope-note")).not.toBeInTheDocument();
    expect(screen.queryByText(/không nói được đang đo bao nhiêu phần của thực tế/)).not.toBeInTheDocument();
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
      expect(screen.getByTestId("signal-drawer")).toBeInTheDocument();
      expect(container.textContent ?? "").not.toMatch(/độ phủ/i); // quét cả mặt drawer
      fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
      expect(screen.getByTestId("signal-profile")).toBeInTheDocument();
      expect(container.textContent ?? "").not.toMatch(/độ phủ/i);
      unmount();
    }
  });
});

/* T4 (hai số bước lồng nhau, tiêu chí 7) rời khối ① sang noti Overview 18/08 tối (owner) — test
   PORT sang overview/SignalHealthNoti.test.tsx, ràng "một câu duy nhất" đi theo. */

describe("D5 (qua UI) — 'có chạy' hiện đúng số đếm từ vol, không đọc st", () => {
  it("running.n trên màn khớp đếm lại vol>0 trên fixture đang dùng", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const expectedRunning = data.signals.filter((s) => s.vol > 0).length;
    const node = screen.getByTestId("inv-running");
    expect(node.textContent).toContain(`${expectedRunning} receiving traffic`);
    expect(screen.getByTestId("inv-total").textContent).toContain(`${data.signals.length} signals`);
  });
});

/* Khối ② ("Data trust") rời màn 18/08 tối (owner) — test hai hướng (a)/(b) chốt 07/08 PORT sang
   overview/SignalHealthNoti.test.tsx, không xoá phần phủ. Chốt chống tái phát nằm ở describe
   "18/08 tối..." phía dưới. */

describe("D6 — Signal.seen hiện nguyên chuỗi, không suy tuổi/số ngày im lặng", () => {
  /* 12/08 (owner): tên cột đổi theo quy ước cụm danh từ, rồi chiều cùng ngày owner chốt lối (i) của
     §10c — điểm đo nối được nguồn (`srcId`) lấy MỐC GIAO CỦA NGUỒN, máy ghi; điểm đo chưa nối vẫn
     dùng `Signal.seen` người gõ. Vì hai xuất xứ nay nằm cùng một cột nên phần "(người khai)" rời
     khỏi NHÃN CỘT và xuống TỪNG Ô.

     Điều D6 cưỡng chế hai vế: (1) không được suy tuổi/số ngày im lặng từ `seen`; (2) chỗ nào hiện
     `seen` thì KHÔNG ĐƯỢC IM về việc số đó do người gõ.

     18/08 tối (owner): bảng LẪN drawer bỏ xuất xứ — vế 2 nay neo ở tầng HỒ SƠ ("Last seen
     (self-reported)"), hai tầng ngoài hiện mốc trần. Văn bản D6 "ngay tại dòng" chưa sửa theo —
     việc của owner. */
  it("mốc gõ tay: bảng và drawer hiện mốc TRẦN — không còn chữ xuất xứ ở hai tầng ngoài", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const handTyped = data.signals.filter((s) => s.seen && s.srcId === null);
    expect(handTyped.length).toBeGreaterThan(0); // tiền đề: fixture còn mốc gõ tay
    for (const sig of handTyped) {
      const row = screen.getByTestId(`signal-row-${sig.id}`);
      expect(row.textContent).toContain(sig.seen as string);
      expect(row.textContent).not.toContain("self-reported");
      fireEvent.click(row);
      const drawerSeen = screen.getByTestId("signal-drawer-seen").textContent;
      expect(drawerSeen).toContain(sig.seen as string);
      expect(drawerSeen).not.toContain("self-reported");
    }
  });

  it("D6 vế 2 neo ở hồ sơ: mở profile của mốc gõ tay vẫn thấy 'self-reported'", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const sig = data.signals.find((s) => s.seen && s.srcId === null)!;
    fireEvent.click(screen.getByTestId(`signal-row-${sig.id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    const profileSeen = screen.getByTestId("signal-profile-seen").textContent;
    expect(profileSeen).toContain("self-reported");
    expect(profileSeen).toContain(sig.seen as string);
  });

  it("dòng đã nối nguồn: bảng lẫn drawer hiện MỐC CỦA NGUỒN trần — mốc máy vẫn thắng mốc gõ tay", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const linked = data.signals.filter((s) => s.srcId !== null);
    expect(linked.length).toBeGreaterThan(0); // tiền đề: fixture đã nối được nguồn cho vài điểm đo
    for (const sig of linked) {
      const src = data.sources.find((s) => s.id === sig.srcId)!;
      const row = screen.getByTestId(`signal-row-${sig.id}`);
      expect(row.textContent).toContain(src.last);
      expect(row.textContent).not.toContain("source feed");
      fireEvent.click(row);
      const drawerSeen = screen.getByTestId("signal-drawer-seen").textContent;
      expect(drawerSeen).toContain(src.last);
      expect(drawerSeen).not.toContain("source feed");
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

    // 18/08 (phương án A): bấm dòng mở DRAWER cạnh bảng — bảng KHÔNG mất; hồ sơ sau một nút nữa.
    expect(screen.getByTestId("signal-table")).toBeInTheDocument();
    expect(screen.getByTestId("signal-drawer")).toHaveAttribute("aria-label", target.name);

    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));

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

describe("18/08 tối (owner) — hai khối điều-kiện-đọc RỜI màn signals, thành noti ở CXM Overview", () => {
  /* Hành vi của noti + hai khối chi tiết (I5 T1·T3, khối ② hai hướng) test ở
     overview/SignalHealthNoti.test.tsx. Ở đây chỉ chốt chống tái phát: không ai dựng lại
     khối nào trên màn này — dựng lại là trưng thường trực thứ owner đã chuyển thành ngoại lệ. */
  it("màn không còn 'Data trust' lẫn 'Declared vs observed' dưới bảng", () => {
    render(<SignalsPage useStore={demoStore()} />);
    for (const id of [
      "gov-block-toggle",
      "gov-t1",
      "gov-t3",
      "reliability-block-toggle",
      "reliability-table",
      "reliability-empty",
    ]) {
      expect(screen.queryByTestId(id)).not.toBeInTheDocument();
    }
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

describe("Drawer — tầng tóm tắt giữa bảng và hồ sơ (owner 18/08, phương án A)", () => {
  it("bấm dòng mở drawer đúng signal, tóm tắt đếm lại từ data; ✕ đóng — bảng còn nguyên mọi dòng", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[0];

    fireEvent.click(screen.getByTestId(`signal-row-${target.id}`));
    expect(screen.getByTestId("signal-drawer")).toHaveAttribute("aria-label", target.name);

    const m0 = target.metrics[0];
    if (m0) {
      const name = data.metrics.find((m) => m.id === m0)?.name ?? m0;
      expect(screen.getByTestId("signal-drawer-metrics").textContent).toContain(name);
    } else {
      expect(screen.getByTestId("signal-drawer-metrics").textContent).toContain("no linked metrics");
    }

    fireEvent.click(screen.getByTestId("signal-drawer-close"));
    expect(screen.queryByTestId("signal-drawer")).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/^signal-row-/).length).toBe(data.signals.length);
  });

  it("prev/next trong drawer đi theo thứ tự bảng, vị trí khai 'n / tổng'", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();

    fireEvent.click(screen.getByTestId(`signal-row-${data.signals[0].id}`));
    expect(screen.getByTestId("signal-drawer-pos").textContent).toContain(`/ ${data.signals.length}`);

    const posBefore = screen.getByTestId("signal-drawer-pos").textContent;
    fireEvent.click(screen.getByTestId("signal-drawer-next"));
    expect(screen.getByTestId("signal-drawer-pos").textContent).not.toBe(posBefore);
  });

  it("đóng hồ sơ quay về bảng + drawer VẪN MỞ ở đúng điểm đo đang xem", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const target = data.signals[1];

    fireEvent.click(screen.getByTestId(`signal-row-${target.id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    expect(screen.getByTestId("signal-profile")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("signal-profile-back"));
    expect(screen.getByTestId("signal-table")).toBeInTheDocument();
    expect(screen.getByTestId("signal-drawer")).toHaveAttribute("aria-label", target.name);
  });
});
