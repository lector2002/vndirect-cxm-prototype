import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { signalTraffic, signalTrafficText } from "../../domain/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { SignalDrawer } from "./SignalDrawer.tsx";

/* 25/08 (owner duyệt mock rd-2508-signals-f2): drawer bỏ hàng Evaluation (trùng Lưu lượng +
   Ngưỡng), hàng Ngưỡng luôn hiện (chưa đặt thì "chưa đặt" + lối sang Rules). Ba thứ đáng canh:
   1. điểm đo CHƯA đặt ngưỡng nói "chưa đặt" + lối sang Rules — không rơi về ok, không giấu hàng;
   2. hàng Lưu lượng đọc signalTraffic (hạt thô trong cửa sổ), không đọc Signal.vol;
   3. hàng Ngưỡng gọi kind bằng đúng nhãn của nhóm cấu hình (SIGNAL_BAND_KIND_LABEL). */

function renderDrawer(signalId: string) {
  const { data, cfg } = useCxmStore.getState();
  const signal = data.signals.find((s) => s.id === signalId);
  if (!signal) throw new Error(`fixture không có điểm đo ${signalId}`);
  render(
    <SignalDrawer
      data={data}
      signal={signal}
      cfg={cfg}
      onClose={() => {}}
      onOpenProfile={() => {}}
      nav={{ index: 0, total: data.signals.length }}
    />,
  );
  return { data, cfg, signal };
}

describe("SignalDrawer — Lưu lượng & Ngưỡng", () => {
  it("điểm đo chưa đặt ngưỡng: hàng Ngưỡng nói 'chưa đặt' + link sang #/rules/signal", () => {
    const { cfg, data } = useCxmStore.getState();
    const unset = data.signals.find((s) => cfg.signal[s.id] === undefined);
    if (!unset) throw new Error("fixture không còn điểm đo nào chưa đặt ngưỡng — test cần xem lại");
    renderDrawer(unset.id);

    expect(screen.getByTestId("signal-drawer-band").textContent).toContain("chưa đặt");
    expect(screen.getByTestId("signal-drawer-band-edit").getAttribute("href")).toBe("#/rules/signal");
  });

  it("hàng Lưu lượng đọc từ signalTraffic (hạt thô trong cửa sổ), KHÔNG đọc Signal.vol", () => {
    const { data, signal } = renderDrawer("sg3");
    const t = signalTraffic(signal, data.sigFires, data.asOf);
    const text = screen.getByTestId("signal-drawer-vol").textContent ?? "";
    if (t.state === "measured") {
      expect(text).toContain(signalTrafficText(t)!);
      expect(text).toContain(`${t.n} lượt/${t.winDays} ngày`);
    } else {
      // seed (Demo TẮT): instAt null cả 30 — hàng phải nói lý do, không hiện vol tổng cả đời.
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain(String(signal.vol));
    }
  });

  it("hàng Ngưỡng tả band bằng đúng nhãn kind của nhóm cấu hình", () => {
    const { cfg } = renderDrawer("sg3");
    const band = cfg.signal["sg3"];
    if (band?.kind !== "badRate") return; // preset đổi thì ca này không còn nghĩa
    const text = screen.getByTestId("signal-drawer-band").textContent ?? "";
    expect(text).toContain("Tỉ lệ xấu");
    for (const v of band.bad) expect(text).toContain(v);
    expect(text).toContain(String(band.warn));
    expect(text).toContain(String(band.crit));
  });
});
