import { useState } from "react";
import type { ComponentType } from "react";
import { cfgIssues, metricState, resetCfgPatch, sourceHealth, stepState } from "../../domain/index.ts";
import { Note } from "../../design-system/index.ts";
import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";
import { useCfgWrite } from "./useCfgWrite.ts";
import { StepGroup } from "./groups/StepGroup.tsx";
import { MetricGroup } from "./groups/MetricGroup.tsx";
import { SourceGroup } from "./groups/SourceGroup.tsx";
import { AlertGroup } from "./groups/AlertGroup.tsx";
import { SegmentGroup } from "./groups/SegmentGroup.tsx";
import { SubGroup } from "./groups/SubGroup.tsx";
import { WeightGroup } from "./groups/WeightGroup.tsx";

/* Chỉ số & ngưỡng #/rules — port cấu trúc V.rules (prototype dòng 4103-4327): menu nhóm bên trái,
   MỘT nhóm hiện bên phải. Prototype có 6 nhóm; ở đây 7, vì `cfg.segment` (ranh giới dải phân khúc
   khách) là thứ prototype không có — nó là E7 của Module E, đặc tả từ 04/08 mà chưa ai dựng.

   BỐN ĐIỀU CỐ Ý KHÁC PROTOTYPE:

   1. ĐẦU MÀN CHỈ CÒN TÊN TAB (luật 06/08). Câu luận đề của prototype — "Ngưỡng đánh giá là cấu hình
      của người vận hành, không phải hằng số trong code" — bỏ. Nội dung của nó không mất: dòng ngay
      dưới đây nói thẳng cấu hình đang mặc định hay đã sửa, và sửa thì mất khi refresh.

   2. CHẤM ĐỎ TRÊN MENU ĐẾM ĐỐI TƯỢNG, KHÔNG ĐẾM Ô CẤU HÌNH. Nó trả lời "với ngưỡng đang đặt, nhóm
      nào đang có thứ cần nhìn" — nên số của nó tính lại mỗi lần sửa một ô, đúng như prototype.

   3. LỖI GHI KHÔNG GOM LÊN ĐẦU MÀN. Xem docblock `useCfgWrite.ts`.

   4. `rules` KHÔNG vào TIMEFRAME_ROUTES (App.tsx) — màn cấu hình, không có chart theo kỳ. Giữ nguyên
      quyết định E7. */

type GroupKey = "step" | "metric" | "source" | "alert" | "segment" | "sub" | "weight";

const BODY: Record<GroupKey, ComponentType> = {
  step: StepGroup,
  metric: MetricGroup,
  source: SourceGroup,
  alert: AlertGroup,
  segment: SegmentGroup,
  sub: SubGroup,
  weight: WeightGroup,
};

/* Số ô ngưỡng của hai nhóm KHÔNG sinh từ dữ liệu — chúng là số field cố định của `cfg.step` và của
   nhóm cảnh báo (`anomaly.z` + 6 field `cfg.data`). Đếm cứng ở đây thì thêm field mà quên sửa số là
   một lệch im lặng, nên lấy thẳng từ chính cfg lúc render (xem `menu` bên dưới). */

/** So hai cfg KHÔNG phụ thuộc thứ tự khoá. `JSON.stringify` thẳng như prototype không dùng được ở
    đây: `resetCfgPatch` dựng lại `cfg.sub` bằng cách lặp trên khoá ĐANG CÓ, nên thứ tự khoá sau khi
    reset có thể khác `cfgDefault` — so chuỗi thô sẽ báo "vẫn đang sửa" ngay sau khi vừa trả về mặc
    định. */
function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, stable(o[k])]),
    );
  }
  return v;
}

export function RulesPage() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const cfgDefault = useCxmStore((s) => s.cfgDefault);
  const { write, error } = useCfgWrite();

  const [group, setGroup] = useState<GroupKey>("step");

  const dirty = JSON.stringify(stable(cfg)) !== JSON.stringify(stable(cfgDefault));
  const warns = cfgIssues(data, cfg);

  // Chấm đỏ: chỉ đếm bước CÓ dòng quan sát. Bước chưa đo trả 'unknown' chứ không phải 'ok' — gộp nó
  // vào đây là biến "chưa biết" thành "đang ổn", đúng cái luật đọc số của dự án cấm.
  const obsById = new Map(data.obs.map((o) => [o.stepId, o]));
  const stepBad = data.steps.filter((s) => stepState(obsById.get(s.id), cfg) === "crit").length;
  const metricBad = data.metrics.filter((m) => {
    const st = metricState(m, cfg);
    return st === "watch" || st === "crit";
  }).length;
  const sourceBad = data.sources.filter((s) => sourceHealth(s, cfg, data.asOf) !== "ok").length;

  const menu: { g: string; items: { k: GroupKey; l: string; n: number; bad: number }[] }[] = [
    {
      g: "Ngưỡng đánh giá",
      items: [
        { k: "step", l: "Bước hành trình", n: Object.keys(cfg.step).length, bad: stepBad },
        { k: "metric", l: "Chỉ số theo dõi", n: data.metrics.length, bad: metricBad },
        { k: "source", l: "SLA từng nguồn", n: data.sources.length, bad: sourceBad },
        { k: "alert", l: "Cảnh báo & khảo sát", n: Object.keys(cfg.data).length + 1, bad: 0 },
      ],
    },
    {
      g: "Cách chia dữ liệu",
      items: [
        {
          k: "segment",
          l: "Phân khúc khách",
          n: Object.keys(cfg.segment.band).length + Object.keys(cfg.segment.values).length,
          bad: 0,
        },
      ],
    },
    {
      g: "Gửi đi & chính sách",
      items: [
        { k: "sub", l: "Bản tin định kỳ", n: data.dash.length, bad: 0 },
        { k: "weight", l: "Trọng số ưu tiên", n: 6, bad: 0 },
      ],
    },
  ];

  const Body = BODY[group];

  return (
    <div className="p-8">
      <PageTitle route="rules" />

      <div className="mb-4">
        <Note tone={dirty ? "bd" : "default"}>
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              {dirty ? (
                <>
                  <b>Đang dùng ngưỡng đã sửa trong phiên này.</b> Cấu hình không lưu xuống đâu cả —
                  refresh trình duyệt là về mặc định.
                </>
              ) : (
                <>
                  <b>Đang dùng ngưỡng mặc định.</b> Sửa bất kỳ ô nào bên dưới để xem toàn app đổi
                  theo. Cấu hình chỉ tồn tại trong phiên, không lưu xuống đâu cả.
                </>
              )}
            </div>
            <button
              type="button"
              data-testid="rules-reset"
              disabled={!dirty}
              onClick={() => write(resetCfgPatch(cfg, cfgDefault))}
              className="ml-auto flex-none rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 disabled:cursor-default disabled:opacity-45 enabled:hover:border-primary-line enabled:hover:bg-primary-soft enabled:hover:text-ink"
            >
              ↺ Trả về mặc định
            </button>
          </div>
        </Note>
      </div>

      {error ? (
        <div className="mb-4" data-testid="rules-reset-error">
          <Note tone="crit">
            <b>Không ghi được cấu hình.</b> {error}
          </Note>
        </div>
      ) : null}

      {warns.length ? (
        <div className="mb-4" data-testid="rules-contradictions">
          <Note tone="crit">
            <b>⚠ {warns.length} ngưỡng đang đặt ngược nhau</b> — vẫn chạy được nhưng nhãn trạng thái
            sẽ vô nghĩa.
            <ul className="mt-2 list-disc pl-5">
              {warns.map((w) => (
                <li key={w} className="my-0.5">
                  {w}
                </li>
              ))}
            </ul>
          </Note>
        </div>
      ) : null}

      <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-4">
        <div className="rounded border border-line bg-surface shadow-card">
          <div className="py-2">
            {menu.map((grp) => (
              <div key={grp.g}>
                <div className="t-lbl px-[18px] pb-1.5 pt-3.5">{grp.g}</div>
                {grp.items.map((it) => (
                  <button
                    key={it.k}
                    type="button"
                    onClick={() => setGroup(it.k)}
                    aria-pressed={group === it.k}
                    className={`mx-2 my-0.5 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                      group === it.k
                        ? "bg-primary-soft font-semibold text-ink"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <i
                      aria-hidden
                      className={`h-1.5 w-1.5 flex-none rounded-full ${it.bad ? "bg-crit" : "bg-line"}`}
                    />
                    <span className="min-w-0 truncate">{it.l}</span>
                    <span className="t-meta ml-auto flex-none text-[12px] tabular-nums">{it.n}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="t-meta border-t border-line px-3.5 py-3">
            Chấm đỏ nghĩa là với ngưỡng đang đặt, nhóm đó đang có đối tượng ở mức cần chú ý.
          </div>
        </div>

        <div className="min-w-0">
          <Body />
        </div>
      </div>
    </div>
  );
}
