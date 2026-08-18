import { useState, type ReactNode } from "react";
import type { Cfg, CxmData, Dim } from "../../data/schema/index.ts";
import { metricsWithoutSignal, stepsWithoutRunningSignal } from "../../domain/index.ts";
import { govCounts, SignalGovernanceBlock } from "../signals/SignalGovernanceBlock.tsx";
import { reliabilityGaps, SignalReliabilityBlock } from "../signals/SignalReliabilityBlock.tsx";

/* Noti ngoại lệ sức khỏe điểm đo — owner 18/08 tối: hai khối "Declared vs observed" + "Data trust"
   RỜI màn #/signals, thành dòng cảnh báo CHỈ-HIỆN-KHI-LỆCH ở đầu CXM Overview; bấm Details mới bung
   đúng khối chi tiết cũ (tái dùng component, KHÔNG viết lại). Dòng noti và thân chi tiết cùng gọi
   govCounts/reliabilityGaps — một đường đếm duy nhất, cùng lý do cfgIssuesTyped ở Rules.

   Không có gì lệch → không render gì. Đây là SỬA CHARTER §6 "buộc trưng" lần ba trong đợt 18/08
   (số chỉ trưng khi có lệch, không còn thường trực); văn bản charter chưa sửa theo — việc của
   owner. Chỉ gắn ở sec="cxm" (OverviewPage): tình trạng vận hành điểm đo, không thuộc VoC.

   18/08 tối (đợt 4, owner "lọc và bỏ hết"): T4·T7 (câu đếm bước/chỉ số của khối ① màn signals)
   cũng RỜI sang đây thành dòng noti-coverage — sửa §6 lần BỐN. Dòng này không có Details: hai con
   số là toàn bộ nội dung, và ràng T4 "hai số lồng trong MỘT câu" giữ nguyên trên dòng noti. */

function NotiRow({ testId, msg, children }: { testId: string; msg: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId} className="rounded-[9px] border border-watch-line bg-watch-bg">
      <div className="flex items-baseline gap-2 px-[13px] py-[9px] text-[12.5px] text-ink-2">
        <span aria-hidden="true" className="flex-none">
          ⚠
        </span>
        <span className="min-w-0 tabular-nums">{msg}</span>
        {children ? (
        <button
          type="button"
          data-testid={`${testId}-toggle`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto flex-none text-[12px] font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          {open ? "Hide details" : "Details"}
        </button>
        ) : null}
      </div>
      {open ? (
        <div className="px-2 pb-2" data-testid={`${testId}-body`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function SignalHealthNoti({
  data,
  cfg,
  dims,
}: {
  data: CxmData;
  cfg: Cfg;
  dims: Record<string, Dim>;
}) {
  const g = govCounts(data, cfg);
  const r = reliabilityGaps(data);
  const steps = stepsWithoutRunningSignal(data);
  const orphanMetrics = metricsWithoutSignal(data);

  /* Một trong hai vế lệch là đủ hiện dòng gov — nhưng dòng vẫn mang CẢ HAI cặp N/M (kể cả cặp
     đang 0) vì chúng là hai vế của cùng một chuyện "bản khai không khớp thực tế". */
  const govMsg =
    g.citedNotCopied.length > 0 || g.brokenFeeding.length > 0
      ? `${g.brokenFeeding.length} / ${data.sources.length} nguồn ngừng gửi vẫn khai nuôi chỉ số · ${g.citedNotCopied.length} / ${g.evaluated.length} flow đã trích dẫn mà chưa chép bước`
      : null;
  /* `sigCounts` rỗng cũng là ngoại lệ: pipeline chưa giao số đếm — đúng hạng việc owner muốn thấy
     dưới dạng noti thay vì một khối thường trực. */
  const relMsg = !r.hasCounts
    ? "Chưa nhận được số đếm từ bên dữ liệu."
    : r.dimsWithGaps > 0
      ? `Đo thiếu ở ${r.dimsWithGaps} / ${r.total} dimension của dữ liệu đã nhận.`
      : null;

  const covMsg =
    steps.noneRunning.length > 0 || orphanMetrics.length > 0
      ? `${steps.noneRunning.length} / ${data.steps.length} bước chưa có điểm đo chạy (trong đó ${steps.none.length} chưa có điểm đo nào) · ${orphanMetrics.length} / ${data.metrics.length} chỉ số không có điểm đo nuôi`
      : null;

  if (!govMsg && !relMsg && !covMsg) return null;

  return (
    <div className="mb-4 flex flex-col gap-2" data-testid="signal-health-noti">
      {govMsg ? (
        <NotiRow testId="noti-gov" msg={govMsg}>
          <SignalGovernanceBlock data={data} cfg={cfg} />
        </NotiRow>
      ) : null}
      {covMsg ? <NotiRow testId="noti-coverage" msg={covMsg} /> : null}
      {relMsg ? (
        <NotiRow testId="noti-reliability" msg={relMsg}>
          <SignalReliabilityBlock data={data} dims={dims} />
        </NotiRow>
      ) : null}
    </div>
  );
}
