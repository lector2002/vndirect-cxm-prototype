import type { ReactNode } from "react";
import type { CxmData, Signal } from "../../data/schema/index.ts";
import { isSignalRunning, signalAllocationChain, signalFeedLast } from "../../domain/index.ts";
import { Badge } from "../../design-system/index.ts";
import { SIGNAL_STATUS } from "../atlas/signalStatus.ts";
import type { SignalProfileNav } from "./SignalProfile.tsx";

/* Drawer chi tiết một điểm đo — 18/08 (owner chốt redesign, phương án A), tầng MỚI giữa bảng và
   hồ sơ: bấm dòng mở drawer NÀY (bảng vẫn đứng cạnh, không mất ngữ cảnh), hồ sơ đầy đủ bốn mặt +
   chart (SignalProfile, lát I4b) lùi xuống một nấc sau nút "Open full profile". Đây là SỬA charter
   I4b/"MÀN 2" (bấm dòng thay cả màn bằng hồ sơ) — owner duyệt 18/08 qua bản mockup ASCII; văn bản
   charter I4b đã sửa theo (§14).

   Drawer chỉ TÓM TẮT — mỗi dữ kiện một dòng, không chart, không bảng: thứ gì cần đọc kỹ đã có hồ
   sơ. Câu chữ lấy đúng thành ngữ của hồ sơ (RUNNING "(inferred from traffic)" cùng chữ với mặt
   Operational status).

   18/08 tối (owner): bảng LẪN drawer bỏ xuất xứ mốc ("source feed"/"self-reported") — vế "khai
   người gõ" của D6 nay neo ở tầng HỒ SƠ (SignalProfile: "Last seen (self-reported)"). Văn bản D6
   đã sửa theo 18/08 (charter §5, dòng D6). Chuỗi allocate cũng tách BA DÒNG có nhãn
   (Phase/Flow/Step) thay breadcrumb "›" nén một dòng — cùng đợt owner yêu cầu. */

import { stampText } from "./stamp.ts";

function Row({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 border-t border-line-soft py-2 text-[13px] first:border-t-0">
      <span className="t-lbl self-baseline">{label}</span>
      <span className="min-w-0 break-words" data-testid={testId}>
        {children}
      </span>
    </div>
  );
}

function metricNamesOf(data: CxmData, signal: Signal): string {
  if (signal.metrics.length === 0) return "no linked metrics";
  return signal.metrics.map((id) => data.metrics.find((m) => m.id === id)?.name ?? id).join(", ");
}

export function SignalDrawer({
  data,
  signal,
  onClose,
  onOpenProfile,
  nav,
}: {
  data: CxmData;
  signal: Signal;
  onClose: () => void;
  onOpenProfile: () => void;
  nav: SignalProfileNav;
}) {
  const status = SIGNAL_STATUS[signal.st];
  const running = isSignalRunning(signal);
  const chain = signalAllocationChain(data, signal);
  const feedLast = signalFeedLast(signal, data.sources);
  const feedSource = data.sources.find((s) => s.id === signal.srcId);

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
          aria-label="Close details"
          className="ml-auto flex-none rounded text-ink-3 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
          </svg>
        </button>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]" data-testid="signal-drawer-status">
        <Badge state={status.badge} text={status.label} />
        <Badge state={running ? "ok" : "unknown"} text={running ? "RUNNING" : "NOT RUNNING"} />
        <span className="t-meta">(inferred from traffic)</span>
      </div>

      <div className="mt-3 flex flex-col">
        {/* 18/08 tối (owner, đợt tiếp): cùng giọng với nhãn cột bảng "Traffic per day" — đơn vị
            nằm trong nhãn, giá trị chỉ còn con số. Hai tầng cạnh nhau không được gọi cùng một dữ
            kiện bằng hai tên ("Volume" cũ). */}
        <Row label="Traffic per day" testId="signal-drawer-vol">
          {signal.vol ? signal.vol : "—"}
        </Row>
        {/* Mốc trần, ưu tiên mốc máy của nguồn — xuất xứ khai ở hồ sơ (D6 dời tầng, 18/08 tối).
            Cùng phép định dạng "27 Jul · 14:52" với bảng (stamp.ts) — hai tầng cạnh nhau không
            được viết một mốc hai kiểu. */}
        <Row label="Last seen" testId="signal-drawer-seen">
          {feedLast ?? signal.seen ? stampText((feedLast ?? signal.seen) as string) : <span className="text-ink-3">never</span>}
        </Row>
        <Row label="Linked metrics" testId="signal-drawer-metrics">
          {signal.metrics.length === 0 ? (
            <span className="italic text-ink-3">no linked metrics</span>
          ) : (
            metricNamesOf(data, signal)
          )}
        </Row>
        <Row label="Source feed" testId="signal-drawer-src">
          {feedSource ? feedSource.name : <span className="italic text-ink-3">No source linked</span>}
        </Row>
        {chain.ok ? (
          <>
            <Row label="Phase" testId="signal-drawer-phase">
              {chain.phase.name}
            </Row>
            <Row label="Flow" testId="signal-drawer-flow">
              {chain.flow.name}
            </Row>
            <Row label="Step" testId="signal-drawer-step">
              {chain.step.code} {chain.step.name}
            </Row>
          </>
        ) : (
          <Row label="Allocation" testId="signal-drawer-chain">
            Chuỗi allocate đứt ở "{chain.brokenAt}"
          </Row>
        )}
        <Row label="Owner" testId="signal-drawer-owner">
          {chain.ok ? chain.flow.owner : "—"}
        </Row>
      </div>

      <button
        type="button"
        data-testid="signal-drawer-open-profile"
        onClick={onOpenProfile}
        className="mt-3 self-start rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-primary hover:border-primary-line hover:bg-primary-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
      >
        Open full profile →
      </button>

      <div className="mt-3 flex items-center gap-2 border-t border-line-soft pt-3 text-[12px] text-ink-2">
        <button type="button" data-testid="signal-drawer-prev" onClick={nav.onPrev} disabled={!nav.onPrev} className={NAV_BTN}>
          ← Prev
        </button>
        <span className="tabular-nums" data-testid="signal-drawer-pos">
          {nav.index + 1} / {nav.total}
        </span>
        <button type="button" data-testid="signal-drawer-next" onClick={nav.onNext} disabled={!nav.onNext} className={NAV_BTN}>
          Next →
        </button>
      </div>
    </aside>
  );
}
