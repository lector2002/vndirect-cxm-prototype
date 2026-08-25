import type { ReactNode } from "react";
import type { Cfg, CfgSignalBand, CxmData, Signal } from "../../data/schema/index.ts";
import {
  SIGNAL_BAND_KIND_LABEL,
  signalAllocationChain,
  signalEvalWhyText,
  signalTraffic,
  signalTrafficText,
  signalWinDays,
} from "../../domain/index.ts";
import { Badge } from "../../design-system/index.ts";
import { signalRowStatus } from "./feedStatus.ts";
import type { SignalProfileNav } from "./SignalProfile.tsx";

/* Drawer chi tiết một điểm đo — 18/08 (owner chốt redesign, phương án A), tầng giữa bảng và hồ sơ:
   bấm dòng mở drawer NÀY (bảng vẫn đứng cạnh), hồ sơ đầy đủ lùi sau nút "Mở hồ sơ đầy đủ".

   25/08 (owner duyệt mock rd-2508-signals-f2) — DRAWER THÔI LẶP LẠI BẢNG. Những thứ đã BỎ so với
   bản 18/08, mỗi cái một lý do:
   · badge RUNNING + "(inferred from traffic)": trùng badge trạng thái gộp ngay trên nó, và nhãn
     xuất xứ bỏ theo quyết định owner 25/08 (chỉ một nguồn report — phân biệt xuất xứ hết mang tin);
   · dòng Last seen: khi đang chạy thì mốc không mang tin ("hôm nay"); khi đứt thì SỐ NGÀY đã nằm
     trong nhãn badge ("Mất dữ liệu · N ngày"). Mốc đầy đủ vẫn tra được ở hồ sơ;
   · dòng Evaluation: trùng Lưu lượng (số) + Ngưỡng (mức) — trạng thái eval nay tô ngay trên SỐ
     ở cột bảng, drawer không nhắc lại;
   · Phase/Flow/Step ba dòng: về MỘT breadcrumb "Vị trí" — ba dòng cho một chuỗi chứa nhau là ba
     lần đọc cho một dữ kiện.
   Đơn vị thuần Việt ("lượt/7 ngày", "theo dõi ≤ … · xử lý ≤ …") — cùng đợt Việt hóa nhãn lửng. */

function Row({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-x-3 border-t border-line-soft py-2 text-[13px] first:border-t-0">
      <span className="t-lbl self-baseline">{label}</span>
      <span className="min-w-0 break-words" data-testid={testId}>
        {children}
      </span>
    </div>
  );
}

function metricNamesOf(data: CxmData, signal: Signal): string {
  return signal.metrics.map((id) => data.metrics.find((m) => m.id === id)?.name ?? id).join(", ");
}

/** Một dòng tả ngưỡng đang đặt — cùng tên kind với nhóm cấu hình (SIGNAL_BAND_KIND_LABEL, một
    nguồn). Thuần Việt: watch = "theo dõi", crit = "xử lý", cửa sổ viết "N ngày". */
function bandText(band: CfgSignalBand): string {
  const win = `${signalWinDays(band)} ngày`;
  const label = SIGNAL_BAND_KIND_LABEL[band.kind];
  if (band.kind === "badRate")
    return `${label}: ${band.bad.join(", ")} — theo dõi ≥${band.warn}% · xử lý ≥${band.crit}% / ${win}`;
  if (band.kind === "goodRate")
    return `${label}: ${band.good.join(", ")} — theo dõi ≤${band.warn}% · xử lý ≤${band.crit}% / ${win}`;
  if (band.kind === "floor")
    return `${label} — theo dõi ≤${band.warn} · xử lý ≤${band.crit} lượt/${win}`;
  const what = band.bad && band.bad.length > 0 ? `: ${band.bad.join(", ")}` : " (đếm tất)";
  return `${label}${what} — theo dõi ≥${band.warn} · xử lý ≥${band.crit} lượt/${win}`;
}

/* Deep link sang đúng nhóm cấu hình. Thẻ <a> thường chứ không <Link>: app chạy HashRouter nên href
   hash điều hướng đúng, còn drawer thì được render TRẦN (không Router) trong cả bộ test của màn —
   một <Link> ở đây bắt mọi test bọc thêm Router chỉ vì một đường dẫn tĩnh. */
const EDIT_IN_RULES = (
  <a
    href="#/rules/signal"
    data-testid="signal-drawer-band-edit"
    className="font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
  >
    Sửa trong Rules ↗
  </a>
);

export function SignalDrawer({
  data,
  signal,
  cfg,
  onClose,
  onOpenProfile,
  nav,
}: {
  data: CxmData;
  signal: Signal;
  cfg: Cfg;
  onClose: () => void;
  onOpenProfile: () => void;
  nav: SignalProfileNav;
}) {
  const rowStatus = signalRowStatus(signal, data, cfg);
  const chain = signalAllocationChain(data, signal);
  const feedSource = data.sources.find((s) => s.id === signal.srcId);
  const band = cfg.signal[signal.id];
  const tr = signalTraffic(signal, data.sigFires, data.asOf);

  const NAV_BTN =
    "rounded-lg border border-line bg-surface px-2 py-0.5 text-[12px] font-semibold text-ink-2 disabled:cursor-default disabled:opacity-45 enabled:hover:border-primary-line enabled:hover:bg-primary-soft enabled:hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

  return (
    <aside
      data-testid="signal-drawer"
      aria-label={signal.name}
      className="sticky top-4 flex w-[320px] flex-none flex-col rounded border border-line bg-surface p-4 shadow-card"
    >
      <div className="flex items-start gap-2">
        <code className="min-w-0 break-words font-mono text-[13px] font-semibold text-primary">
          {signal.name}
        </code>
        <button
          type="button"
          data-testid="signal-drawer-close"
          onClick={onClose}
          aria-label="Đóng chi tiết"
          className="ml-auto flex-none rounded text-ink-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
          </svg>
        </button>
      </div>

      {/* MỘT badge trạng thái — cùng hàm với cột bảng (signalRowStatus): hai tầng cạnh nhau không
          được chấm cùng một điểm đo bằng hai thang. */}
      <div className="mt-1.5" data-testid="signal-drawer-status">
        <Badge state={rowStatus.badge} text={rowStatus.label} />
      </div>

      <div className="mt-3 flex flex-col">
        <Row label="Lưu lượng" testId="signal-drawer-vol">
          {tr.state === "measured" ? (
            <span className="tabular-nums">
              {signalTrafficText(tr)} lượt/ngày{" "}
              <span className="t-meta">
                ({tr.n} lượt/{tr.winDays} ngày)
              </span>
            </span>
          ) : (
            <span className="text-ink-2">{signalEvalWhyText(tr)}</span>
          )}
        </Row>
        <Row label="Ngưỡng" testId="signal-drawer-band">
          {band !== undefined ? (
            <>
              <span className="block">{bandText(band)}</span>
              {EDIT_IN_RULES}
            </>
          ) : (
            <span className="flex flex-wrap items-center gap-x-2">
              <span className="italic text-ink-3">chưa đặt</span>
              {EDIT_IN_RULES}
            </span>
          )}
        </Row>
        <Row label="Chỉ số gắn" testId="signal-drawer-metrics">
          {signal.metrics.length === 0 ? (
            <span className="italic text-ink-3">chưa gắn chỉ số</span>
          ) : (
            metricNamesOf(data, signal)
          )}
        </Row>
        <Row label="Nguồn" testId="signal-drawer-src">
          {feedSource ? feedSource.name : <span className="italic text-ink-3">chưa nối nguồn</span>}
        </Row>
        {/* Breadcrumb MỘT dòng thay ba dòng Phase/Flow/Step (mock f2) — chuỗi chứa nhau đọc một
            lần. Đứt chuỗi thì nói đứt ở đâu, không render rỗng (F2). */}
        <Row label="Vị trí" testId="signal-drawer-place">
          {chain.ok ? (
            <span>
              {chain.phase.name}
              <span className="px-1 text-ink-3">›</span>
              {chain.flow.name}
              <span className="px-1 text-ink-3">›</span>
              {chain.step.code} {chain.step.name}
            </span>
          ) : (
            <>Chuỗi allocate đứt ở "{chain.brokenAt}"</>
          )}
        </Row>
        <Row label="Owner" testId="signal-drawer-owner">
          {chain.ok ? chain.flow.owner : "—"}
        </Row>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3">
        <button
          type="button"
          data-testid="signal-drawer-open-profile"
          onClick={onOpenProfile}
          className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-primary hover:border-primary-line hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          Mở hồ sơ đầy đủ →
        </button>
        <span className="ml-auto text-[12px] tabular-nums text-ink-2" data-testid="signal-drawer-pos">
          {nav.index + 1} / {nav.total}
        </span>
        <button type="button" data-testid="signal-drawer-prev" onClick={nav.onPrev} disabled={!nav.onPrev} aria-label="Điểm đo trước" className={NAV_BTN}>
          ←
        </button>
        <button type="button" data-testid="signal-drawer-next" onClick={nav.onNext} disabled={!nav.onNext} aria-label="Điểm đo kế tiếp" className={NAV_BTN}>
          →
        </button>
      </div>
    </aside>
  );
}
