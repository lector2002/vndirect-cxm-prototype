import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { signalEval, signalTraffic, signalTrafficText } from "../../domain/index.ts";
import { useCxmStore } from "../../store/store.ts";
import { SignalDrawer } from "./SignalDrawer.tsx";

/* Hai hàng MỚI của drawer (19/08): Evaluation (trạng thái theo ngưỡng riêng `cfg.signal`) và
   Threshold (band đang đặt, chỉ-đọc, kèm lối sang #/rules/signal). Ba thứ đáng canh:
   1. điểm đo CHƯA đặt ngưỡng nói "not set" + lối sang Rules — không rơi về ok, không giấu hàng;
   2. điểm đo ĐÃ đặt: hàng Evaluation khớp signalEval (một nguồn trạng thái, không tự suy lại);
   3. hàng Threshold gọi kind bằng đúng nhãn của nhóm cấu hình (SIGNAL_BAND_KIND_LABEL). */

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

describe("SignalDrawer — Evaluation & Threshold", () => {
  it("điểm đo chưa đặt ngưỡng: 'not set' + link sang #/rules/signal, KHÔNG có hàng Threshold", () => {
    const { cfg, data } = useCxmStore.getState();
    const unset = data.signals.find((s) => cfg.signal[s.id] === undefined);
    if (!unset) throw new Error("fixture không còn điểm đo nào chưa đặt ngưỡng — test cần xem lại");
    renderDrawer(unset.id);

    expect(screen.getByTestId("signal-drawer-eval").textContent).toContain("not set");
    expect(screen.getByTestId("signal-drawer-band-edit").getAttribute("href")).toBe("#/rules/signal");
    expect(screen.queryByTestId("signal-drawer-band")).toBeNull();
  });

  it("điểm đo có ngưỡng: hàng Evaluation khớp signalEval — đo được thì hiện số, unknown thì hiện lý do", () => {
    const { data, cfg, signal } = renderDrawer("sg3");
    const ev = signalEval(signal, data.sigFires, cfg, data.asOf);
    const text = screen.getByTestId("signal-drawer-eval").textContent ?? "";
    if (ev.state === "unknown") {
      // seed (Demo TẮT): không có lượt bắn — hàng phải nói lý do, không rơi về ok.
      expect(text).not.toContain("not set");
      expect(text.length).toBeGreaterThan(0);
    } else {
      expect(text).toContain(`n=${ev.n}`);
    }
  });

  it("hàng Traffic per day đọc từ signalTraffic (hạt thô trong cửa sổ), KHÔNG đọc Signal.vol", () => {
    const { data, signal } = renderDrawer("sg3");
    const t = signalTraffic(signal, data.sigFires, data.asOf);
    const text = screen.getByTestId("signal-drawer-vol").textContent ?? "";
    if (t.state === "measured") {
      expect(text).toContain(signalTrafficText(t)!);
      expect(text).toContain(`${t.n} lượt/${t.winDays}d`);
    } else {
      // seed (Demo TẮT): instAt null cả 30 — hàng phải nói lý do, không hiện vol tổng cả đời.
      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain(String(signal.vol));
    }
  });

  it("hàng Threshold tả band bằng đúng nhãn kind của nhóm cấu hình", () => {
    const { cfg } = renderDrawer("sg3");
    const band = cfg.signal["sg3"];
    if (band?.kind !== "badRate") return; // preset đổi thì ca này không còn nghĩa
    const text = screen.getByTestId("signal-drawer-band").textContent ?? "";
    expect(text).toContain("Bad-value rate");
    for (const v of band.bad) expect(text).toContain(v);
    expect(text).toContain(String(band.warn));
    expect(text).toContain(String(band.crit));
  });
});
