import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MockRepository } from "../../data/mock-repository.ts";
import { demoData, recountDemoSignals } from "../../data/fixtures/demo.ts";
import { seed } from "../../data/fixtures/seed.ts";
import { sourceDaysMissing, sourceHealth } from "../../domain/index.ts";
import { signalRowStatus } from "./feedStatus.ts";
import { createCxmStore } from "../../store/store.ts";
import { SignalsPage } from "./SignalsPage.tsx";
import { stampParts, stampText } from "./stamp.ts";

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

describe("Chip khối ① — số trên chip đếm lại từ signalRowStatus, không gõ tay", () => {
  it("chip 'Đang chạy' khớp đếm lại kind running; chip 'Tất cả' mang đúng mẫu số", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data, cfg } = store.getState();
    /* 25/08: chip đi theo trạng thái gộp — "Đang chạy" KHÔNG còn là mọi vol>0 (validating tách
       sang "Đang thử", feed đứt sang "Mất dữ liệu"). D5 vẫn nguyên ở tầng dưới: signalRowStatus
       đọc isSignalRunning (vol), không đọc st để suy "có chạy". */
    const expectedRunning = data.signals.filter((s) => signalRowStatus(s, data, cfg).kind === "running").length;
    const node = screen.getByTestId("inv-running");
    expect(node.textContent).toContain(`${expectedRunning} Đang chạy`);
    expect(screen.getByTestId("inv-total").textContent).toContain(`${data.signals.length} Tất cả`);
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
     (self-reported)"), hai tầng ngoài hiện mốc trần. Văn bản D6 đã sửa theo 18/08 (charter §5, dòng D6).

     18/08 tối (owner, đợt chỉnh ba cột): mốc được ĐỊNH DẠNG lại "27 Jul · 14:52" (stamp.ts) — chỉ
     đổi cách viết. Các bài dưới đối chiếu qua stampText() (một đường định dạng duy nhất); nghĩa
     của chính stampText ghim ở stamp.test.ts bằng cặp vào/ra chữ.

     18/08 tối (owner, đợt đảo thứ bậc ô): trên BẢNG mốc chỉ còn NGÀY (stampParts().date) đứng nhỏ
     dưới badge trạng thái giao nhận — GIỜ rời mặt bảng, nên các bài dưới đối chiếu bảng bằng
     phần ngày và chốt luôn "giờ không còn trên dòng". Drawer và hồ sơ VẪN mốc đầy đủ stampText(). */
  /* 25/08 (owner duyệt mock rd-2508-signals): mốc RỜI HẲN bảng và drawer — ngày chỉ còn xuất hiện
     TRONG nhãn trạng thái khi feed đứt ("Mất dữ liệu · N ngày", số máy đếm từ nguồn). Hồ sơ vẫn
     giữ mốc đầy đủ, nhưng nhãn xuất xứ "(self-reported)" bỏ (owner 25/08 — một nguồn report).
     D6 vế 1 nay được thoả bằng cách KHÔNG hiện mốc: không hiện thì không suy gì từ nó. */
  it("mốc gõ tay RỜI bảng + drawer: dòng không mang mốc, drawer không còn hàng Last seen", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const handTyped = data.signals.filter((s) => s.seen && s.srcId === null);
    expect(handTyped.length).toBeGreaterThan(0); // tiền đề: fixture còn mốc gõ tay
    for (const sig of handTyped) {
      const row = screen.getByTestId(`signal-row-${sig.id}`);
      const p = stampParts(sig.seen as string);
      if (p?.time) expect(row.textContent).not.toContain(p.time);
      expect(row.textContent).not.toContain("self-reported");
      fireEvent.click(row);
      expect(screen.queryByTestId("signal-drawer-seen")).not.toBeInTheDocument();
    }
  });

  it("mốc đầy đủ neo ở hồ sơ, KHÔNG còn nhãn xuất xứ (owner 25/08)", () => {
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const sig = data.signals.find((s) => s.seen && s.srcId === null)!;
    fireEvent.click(screen.getByTestId(`signal-row-${sig.id}`));
    fireEvent.click(screen.getByTestId("signal-drawer-open-profile"));
    const profileSeen = screen.getByTestId("signal-profile-seen").textContent;
    expect(profileSeen).not.toContain("self-reported");
    expect(profileSeen).toContain(stampText(sig.seen as string));
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
  it("18/08 tối (owner): chú thích asOf đầu trang ĐÃ BỎ — mốc neo duy nhất là của thanh công cụ bảng", () => {
    /* Trước đây mặt bảng in "Data as of …" HAI lần cách nhau ~40px (đầu trang + thanh công cụ
       bảng) — một dữ kiện đọc thành hai. Test cũ ("hiện đúng data.asOf") đổi nghĩa thành chốt
       chiều ngược lại; vế "bảng mang đúng asOf" sống ở test ngay dưới. */
    const store = demoStore();
    render(<SignalsPage useStore={store} />);
    expect(screen.queryByTestId("signals-asof")).not.toBeInTheDocument();
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
      expect(screen.getByTestId("signal-drawer-metrics").textContent).toContain("chưa gắn chỉ số");
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
/* 25/08 (owner duyệt mock rd-2508-signals-f1) — CỘT TRẠNG THÁI GỘP thay hai cột Status + Feed
   status. Fixture thật hiện KHÔNG có điểm đo nào nối vào nguồn đang sự cố (hai nguồn sự cố của
   seed đều chưa được nối), nên hai bài đầu DỰNG dữ liệu: nhặt nguồn down/stale bằng cách đếm lại
   `sourceHealth` trên seed (không ghim id), rồi nối điểm đo đầu bảng vào nguồn đó. Số ngày trong
   nhãn ĐẾM LẠI từ chính nguồn (sourceDaysMissing), không ghim số. */
describe("Cột Trạng thái gộp — một badge bốn bậc, ngày chỉ hiện khi đứt (25/08)", () => {
  function storeWithFirstSignalOn(srcHealth: "down" | "stale") {
    const store = seedStore();
    const { cfg } = store.getState();
    const src = seed.sources.find((x) => sourceHealth(x, cfg, seed.asOf) === srcHealth);
    if (!src) throw new Error(`fixture phải còn ít nhất một nguồn ${srcHealth}`);
    const signals = seed.signals.map((sig, i) => (i === 0 ? { ...sig, srcId: src.id } : sig));
    return { store: createCxmStore(new MockRepository({ ...seed, signals })), sigId: signals[0].id, src };
  }

  it("nối nguồn ĐỨT HẲN (down) → 'Mất dữ liệu · N ngày' (N máy đếm)", () => {
    const { store, sigId, src } = storeWithFirstSignalOn("down");
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const text = screen.getByTestId(`signal-status-${sigId}`).textContent ?? "";
    expect(text).toContain("Mất dữ liệu");
    expect(text).toContain(`${sourceDaysMissing(src, data.asOf)} ngày`);
  });

  it("nối nguồn THIẾU NGÀY (stale) → 'Thiếu dữ liệu · N ngày', không phải Mất", () => {
    const { store, sigId, src } = storeWithFirstSignalOn("stale");
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const text = screen.getByTestId(`signal-status-${sigId}`).textContent ?? "";
    expect(text).toContain("Thiếu dữ liệu");
    expect(text).not.toContain("Mất dữ liệu");
    expect(text).toContain(`${sourceDaysMissing(src, data.asOf)} ngày`);
  });

  it("CHƯA NỐI NGUỒN mà đang chở lưu lượng → 'Đang chạy', không ngày, không suy sự cố (D6)", () => {
    const store = seedStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const unlinked = data.signals.find((sig) => sig.srcId === null && sig.vol > 0 && sig.st === "live");
    if (!unlinked) throw new Error("fixture phải còn điểm đo chưa nối nguồn, live, có lưu lượng");
    const text = screen.getByTestId(`signal-status-${unlinked.id}`).textContent ?? "";
    expect(text).toContain("Đang chạy");
    expect(text).not.toMatch(/\d+ ngày/);
  });

  it("chưa chạy → nhãn nói rõ phân nhóm: 'Chưa chạy · có spec' (designed) / 'Chưa đo' (gap)", () => {
    const store = seedStore();
    render(<SignalsPage useStore={store} />);
    const { data } = store.getState();
    const designed = data.signals.find((s) => s.st === "designed" && s.vol === 0);
    const gap = data.signals.find((s) => s.st === "gap" && s.vol === 0);
    if (designed)
      expect(screen.getByTestId(`signal-status-${designed.id}`).textContent).toContain("Chưa chạy · có spec");
    if (gap) expect(screen.getByTestId(`signal-status-${gap.id}`).textContent).toContain("Chưa đo");
    if (!designed && !gap) throw new Error("fixture phải còn ít nhất một điểm đo chưa chạy");
  });
});
