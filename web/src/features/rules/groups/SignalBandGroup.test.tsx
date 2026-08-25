import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useCxmStore } from "../../../store/store.ts";
import { SignalBandGroup } from "./SignalBandGroup.tsx";

/* Nhóm "Signal thresholds" (`cfg.signal`, 19/08). Bốn thứ đáng canh:
   1. mỗi điểm đo đúng một dòng + một ô chọn dụng cụ — kiểm kê đủ, không dòng nào rơi;
   2. bỏ trống là hợp lệ: "— not set —" gỡ hẳn entry, không lưu một band rỗng;
   3. đổi kind là về bộ số khởi điểm của kind MỚI (khác đơn vị, khác chiều xấu — không kéo số cũ);
   4. chips giá trị ghi đúng vào bad/good, và ceiling bỏ chip cuối là quay về ĐẾM TẤT (gỡ khoá). */

const cfg0 = useCxmStore.getState().cfg;

afterEach(() => {
  useCxmStore.getState().setCfg(cfg0);
});

const cfgSignal = () => useCxmStore.getState().cfg.signal;

/** Một điểm đo CHƯA có entry trong cfg mặc định — không ghim id, tự dò từ dữ liệu. */
function unsetSignalId(): string {
  const { data, cfg } = useCxmStore.getState();
  const s = data.signals.find((x) => cfg.signal[x.id] === undefined && x.values.length > 0);
  if (!s) throw new Error("fixture không còn điểm đo nào chưa đặt ngưỡng — test cần xem lại");
  return s.id;
}

describe("SignalBandGroup — ngưỡng riêng từng điểm đo", () => {
  it("mỗi điểm đo một dòng và một ô chọn dụng cụ, không dòng nào rơi", () => {
    render(<SignalBandGroup />);
    const { data } = useCxmStore.getState();
    for (const s of data.signals) {
      expect(screen.getByTestId(`sigband-row-${s.id}`)).toBeInTheDocument();
      expect(document.getElementById(`sigband-kind-${s.id}`)).toBeInTheDocument();
    }
  });

  it("preset trong cfgDefault hiện đúng kind và chip giá trị đang chọn", () => {
    render(<SignalBandGroup />);
    const band = cfgSignal()["sg3"];
    if (band?.kind !== "badRate") return; // preset đổi thì ca này không còn nghĩa
    expect((document.getElementById("sigband-kind-sg3") as HTMLSelectElement).value).toBe("badRate");
    for (const v of band.bad) {
      expect(screen.getByTestId(`sigband-val-sg3-${v}`).getAttribute("aria-pressed")).toBe("true");
    }
  });

  it("chọn kind cho điểm đo chưa đặt ⇒ entry mới với bộ số khởi điểm; chọn lại '— not set —' ⇒ entry bị GỠ", () => {
    render(<SignalBandGroup />);
    const id = unsetSignalId();
    const sel = document.getElementById(`sigband-kind-${id}`)!;

    fireEvent.change(sel, { target: { value: "floor" } });
    expect(cfgSignal()[id]?.kind).toBe("floor");

    fireEvent.change(sel, { target: { value: "" } });
    expect(id in cfgSignal()).toBe(false);
  });

  it("đổi kind ⇒ về bộ số khởi điểm của kind mới, KHÔNG kéo warn/crit cũ theo", () => {
    render(<SignalBandGroup />);
    const id = unsetSignalId();
    const sel = document.getElementById(`sigband-kind-${id}`)!;

    fireEvent.change(sel, { target: { value: "floor" } });
    const floorBand = cfgSignal()[id]!;
    // floor tụt-xuống-là-xấu: bộ khởi điểm phải đúng chiều warn > crit.
    expect(floorBand.warn).toBeGreaterThan(floorBand.crit);

    fireEvent.change(sel, { target: { value: "badRate" } });
    const rateBand = cfgSignal()[id]!;
    expect(rateBand.kind).toBe("badRate");
    // badRate vượt-lên-là-xấu: nếu warn/crit của floor bị kéo nguyên qua thì chiều này vỡ.
    expect(rateBand.warn).toBeLessThan(rateBand.crit);
    // và danh sách giá trị bắt đầu RỖNG — trạng thái "chưa chọn giá trị để đo", không đoán hộ.
    expect(rateBand.kind === "badRate" && rateBand.bad).toEqual([]);
  });

  it("chip giá trị: bấm thêm vào bad, bấm lại gỡ ra", () => {
    render(<SignalBandGroup />);
    const band = cfgSignal()["sg3"];
    if (band?.kind !== "badRate") return;
    const other = useCxmStore
      .getState()
      .data.signals.find((s) => s.id === "sg3")!
      .values.find((v) => !band.bad.includes(v));
    if (!other) return;

    fireEvent.click(screen.getByTestId(`sigband-val-sg3-${other}`));
    const after = cfgSignal()["sg3"];
    expect(after?.kind === "badRate" && after.bad).toContain(other);

    fireEvent.click(screen.getByTestId(`sigband-val-sg3-${other}`));
    const back = cfgSignal()["sg3"];
    expect(back?.kind === "badRate" && back.bad.includes(other)).toBe(false);
  });

  it("ceiling bỏ chip cuối cùng ⇒ khoá bad bị gỡ (về đếm tất), không để lại mảng rỗng", () => {
    render(<SignalBandGroup />);
    const band = cfgSignal()["sg8"];
    if (band?.kind !== "ceiling" || (band.bad ?? []).length !== 1) return; // preset đổi thì ca này không còn nghĩa
    const only = band.bad![0];

    fireEvent.click(screen.getByTestId(`sigband-val-sg8-${only}`));
    const after = cfgSignal()["sg8"];
    expect(after?.kind).toBe("ceiling");
    expect(after && "bad" in after && after.bad !== undefined).toBe(false);
    // Chú thích "(đếm tất)" phải hiện trong CHÍNH dòng sg8 — dòng ceiling-đếm-tất khác
    // (preset sg4) cũng mang câu này nên không query toàn màn.
    expect(within(screen.getByTestId("sigband-row-sg8")).getByText("(đếm tất)")).toBeInTheDocument();
  });

  it("hai lần sửa liên tiếp trên CÙNG dòng: winDays rồi warn — cả hai phải sống trong cfg (bẫy spread band cũ)", () => {
    render(<SignalBandGroup />);
    const id = unsetSignalId();
    fireEvent.change(document.getElementById(`sigband-kind-${id}`)!, { target: { value: "ceiling" } });

    const winInput = screen.getByLabelText(`Window — ${useCxmStore.getState().data.signals.find((s) => s.id === id)!.name}`);
    fireEvent.change(winInput, { target: { value: "30" } });
    fireEvent.blur(winInput);

    const name = useCxmStore.getState().data.signals.find((s) => s.id === id)!.name;
    const warnInput = screen.getByLabelText(`Watch threshold — ${name}`);
    fireEvent.change(warnInput, { target: { value: "99" } });
    fireEvent.blur(warnInput);

    const band = cfgSignal()[id];
    expect(band?.kind).toBe("ceiling");
    expect(band?.winDays).toBe(30);
    expect(band?.warn).toBe(99);
  });

  it("dòng chưa đặt: cột status im ('—'), không rơi về một nhãn nào", () => {
    render(<SignalBandGroup />);
    const id = unsetSignalId();
    expect(screen.getByTestId(`sigband-status-${id}`).textContent).toBe("—");
  });
});
