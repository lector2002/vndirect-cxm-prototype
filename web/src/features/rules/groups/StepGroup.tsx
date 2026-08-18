import { useState } from "react";
import { Badge, Card, Note } from "../../../design-system/index.ts";
import type { BadgeState } from "../../../design-system/index.ts";
import { stepState, stepWhy } from "../../../domain/index.ts";
import { useCxmStore } from "../../../store/store.ts";
import type { Step } from "../../../data/schema/index.ts";
import { NumField } from "../NumField.tsx";
import { ApplySection, FieldRow } from "../RuleLayout.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm 1 — "Bước hành trình" (`cfg.step`, 4 số). Port tinh thần `g === 'step'` của prototype
   (dòng 4159-4181), không port HTML thô.

   VÌ SAO KHỐI "ÁP NGAY LÚC NÀY" PHẢI LOẠI BƯỚC CHƯA CÓ OBS: prototype cũ chỉ có 6 bước và cả 6 đều
   có quan sát nên chưa từng gặp ca này. Pilot mở rộng 05/08 có 30 bước; `stepState(undefined, cfg)`
   trả `'unknown'` — gộp bước đó vào danh sách "trong ngưỡng" là biến "chưa đo" thành "đang ổn", đúng
   luật đọc số dự án đã cấm (xem docblock RulesPage.tsx và AtlasPage.tsx dòng ~320-336). Nên bước
   không có obs bị loại khỏi danh sách VÀ số bị loại phải đếm ra chữ, không im lặng biến mất.

   Đo thật từ fixture lúc viết file này (06/08/2026): 30/30 bước đang có dòng obs — tức hôm nay
   KHÔNG có bước nào bị loại, và khối "chưa đo" (`step-excluded-note`) vì vậy không hiện (chỉ hiện
   khi `excluded > 0`, cùng luật ẩn-khi-rỗng của AtlasPage.tsx dòng ~332). Luật loại bước-chưa-đo vẫn
   được cài CHUNG cho mọi lô dữ liệu, không riêng hôm nay — pilot mở thêm bước mới chưa lên obs là
   lúc khối này tự lộ ra mà không cần sửa code (xem StepGroup.test.tsx ca giả lập bước thiếu obs).

   XẾP crit → watch → ok, CẮT TOP 6: 30 bước không còn vừa một màn hình, cùng luật đã áp cho
   JourneyStateBlock/CoverageBlock/TopicTrendBlock (owner 05-06/08: hiện phần đáng nhìn, đếm phần còn
   lại ra chữ, mở hết khi được yêu cầu). */

const TOP_N = 6;
const RANK: Record<"crit" | "watch" | "ok", number> = { crit: 0, watch: 1, ok: 2 };

type StepRow = { step: Step; state: "crit" | "watch" | "ok"; why: string };

export function StepGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();
  const [expanded, setExpanded] = useState(false);

  const obsById = new Map(data.obs.map((o) => [o.stepId, o]));

  const rows: StepRow[] = [];
  for (const step of data.steps) {
    const o = obsById.get(step.id);
    if (!o) continue; // chưa có quan sát — loại khỏi danh sách, đếm ở `excluded` bên dưới.
    const st = stepState(o, cfg) as "crit" | "watch" | "ok"; // `o` xác định nên không rơi vào 'unknown'.
    rows.push({ step, state: st, why: stepWhy(o, cfg) });
  }
  rows.sort((a, b) => RANK[a.state] - RANK[b.state]);

  const excluded = data.steps.length - rows.length;
  const nCrit = rows.filter((r) => r.state === "crit").length;
  const nWatch = rows.filter((r) => r.state === "watch").length;
  const nOk = rows.filter((r) => r.state === "ok").length;
  const shown = expanded ? rows : rows.slice(0, TOP_N);
  const hidden = rows.length - shown.length;

  const setStep = (field: keyof typeof cfg.step) => (v: number) => write({ step: { ...cfg.step, [field]: v } });

  /* Câu giải thích dài KHÔNG đặt vào `subtitle` của Card: slot đó `truncate` một dòng (Card.tsx),
     nên câu bị cắt giữa chừng ngay ở bề rộng thật của cột phải màn này — đã thấy bằng mắt. */
  return (
    <Card title="Journey step status thresholds">
      {/* luật 11/08: bỏ đoạn giải thích áp ngưỡng */}

      {error ? (
        <div className="mb-3" data-testid="step-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      {/* Công thức XUỐNG TOOLTIP, không còn dòng chữ dưới nhãn — luật 12/08 (owner): dòng phụ dạy
          cách đọc màn thì bỏ, riêng CÔNG THỨC được giữ ở dạng tooltip. `title` là đường rẻ nhất và
          screen reader đọc được; không dựng popover cho một chuỗi bảy ký tự. */}
      <div>
        <FieldRow label="Fail-rate watch threshold" formula="failed ÷ entered của bước">
          <NumField
            value={cfg.step.failWatch}
            onCommit={setStep("failWatch")}
            suffix="%"
            tone="watch"
            label="Fail-rate watch threshold"
          />
        </FieldRow>

        {/* luật 12/08: bỏ "phải cao hơn ngưỡng theo dõi" — đó là RÀNG BUỘC, không phải dữ liệu.
            Gõ sai thứ tự thì `cfgIssues()` báo bằng câu lỗi thật, không cần dặn trước. */}
        <FieldRow label="Fail-rate critical threshold" formula="failed ÷ entered của bước">
          <NumField
            value={cfg.step.failCrit}
            onCommit={setStep("failCrit")}
            suffix="%"
            tone="crit"
            label="Fail-rate critical threshold"
          />
        </FieldRow>

        {/* luật 11/08: bỏ giải thích */}
        <FieldRow label="Minimum evidence coverage">
          <NumField
            value={cfg.step.covMin}
            onCommit={setStep("covMin")}
            suffix="%"
            label="Minimum evidence coverage"
          />
        </FieldRow>

        {/* luật 11/08 (bổ sung): bỏ hẳn định nghĩa đơn vị */}
        <FieldRow label="Maximum allowed effort">
          <NumField
            value={cfg.step.effortMax}
            onCommit={setStep("effortMax")}
            suffix="times"
            label="Maximum allowed effort"
          />
        </FieldRow>
      </div>

      {/* 18/08: dòng đếm ba trạng thái thay vế "showing N of M" trên tiêu đề — số bị loại vì chưa
          đo KHÔNG được biến mất khi gấp (luật của khối này), nên nó đứng ngay trong dòng đếm. */}
      <ApplySection
        title="Effect on steps right now"
        summary={`${nCrit} Critical · ${nWatch} Warning · ${nOk} OK${
          excluded > 0 ? ` · ${excluded} not measured` : ""
        }`}
      >
        {excluded > 0 ? (
          <div data-testid="step-excluded-note">
            {/* luật 11/08 (bổ sung): bỏ vế 2 "không tự gán trạng thái đang ổn cho bước chưa đo" */}
            <Note>{`${excluded} bước chưa có dữ liệu quan sát nên không chấm được.`}</Note>
          </div>
        ) : null}

        {/* 18/08 (redesign MVP, nước đi R2): lưới thẻ 2 cột → DANH SÁCH DÒNG một cột, zebra nhẹ.
            Sáu thẻ be hai cột chiếm nửa màn cho sáu dữ kiện một-dòng-đọc-hết; dạng dòng cùng mật
            độ với bảng Điểm đo, cùng thứ tự đọc (mã · tên · lý do · badge phải) trên MỘT đường
            ngang nên so hai bước không phải nhảy mắt chéo lưới. Tên bước vẫn XUỐNG DÒNG chứ không
            cắt (flex-wrap) — lý do cũ giữ nguyên: tên là thứ duy nhất dòng này cần nói. */}
        <div
          className={`flex flex-col${expanded ? " max-h-[420px] overflow-y-auto pr-1" : ""}`}
          data-testid="step-apply-rows"
        >
          {shown.map(({ step, state, why }) => (
            <div
              key={step.id}
              data-testid={`step-apply-${step.id}`}
              className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 rounded-md px-2.5 py-1.5 odd:bg-surface-2"
            >
              <span className="font-mono text-[12px] text-ink-3 flex-none">{step.code}</span>
              <b className="text-[13px] min-w-0 break-words">{step.name}</b>
              <span className="t-meta ml-auto text-right text-[12px]">{why}</span>
              <span className="flex-none">
                <Badge state={state as BadgeState} />
              </span>
            </div>
          ))}
        </div>

        {rows.length > TOP_N ? (
          <button
            type="button"
            data-testid="step-apply-more"
            onClick={() => setExpanded((v) => !v)}
            className="self-start text-[12px] font-semibold text-primary hover:underline"
          >
            {expanded ? "Collapse" : `Show all ${rows.length} steps (+${hidden} more)`}
          </button>
        ) : null}
      </ApplySection>
    </Card>
  );
}
