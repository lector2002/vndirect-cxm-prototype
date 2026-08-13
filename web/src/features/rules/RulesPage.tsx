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
      quyết định E7.

   12/08 (redesign layout) — BA quyết định:

   a. NÚT "TRẢ VỀ MẶC ĐỊNH" LÊN HÀNG TÊN MÀN, không còn nằm trong một khung `Note` riêng. Luật 12/08
      bắt màn IM LẶNG khi cfg chưa bị sửa; nhưng khung Note vẫn vẽ ra một hộp có viền, có nền, cao
      44px và rỗng ruột — im lặng bằng chữ mà vẫn nói bằng hình. Nút là một control toàn màn, chỗ
      của nó là cạnh tên màn. Khi cfg đã sửa thì câu "Đang dùng ngưỡng đã sửa trong phiên này." hiện
      ra ngay cạnh nút, tô nền primary-soft — nó là dữ liệu lệch khỏi mặc định, đúng phép thử 2.

   b. MENU NHÓM DÍNH MÉP TRÊN khi cuộn. Thân nhóm dài (bảng 30 bước, bảng 6 chỉ số, bảng dải phân
      khúc) nên cuộn tới cuối là menu trôi mất; muốn sang nhóm khác phải cuộn ngược lên hết. Menu là
      đường đi duy nhất giữa bảy nhóm, nó phải luôn ở trong tầm mắt.

   c. HAI KHỐI CẢNH BÁO (ghi hỏng · ngưỡng đặt ngược) ĐỨNG TRÊN CÙNG, trước cả menu và thân — chúng
      nói về cấu hình ĐANG có chứ không riêng nhóm đang mở, nên không được cuộn theo thân nhóm. */

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
      {/* Không dirty thì hàng này KHÔNG NÓI GÌ — luật 12/08 (owner): bỏ cả ba vế của câu cũ ("Đang
          dùng ngưỡng mặc định" · "Sửa bất kỳ ô nào bên dưới để xem toàn app đổi theo" · "Cấu hình
          chỉ tồn tại trong phiên, không lưu xuống đâu cả") — vế 2 là hướng dẫn bấm, vế 3 là lý lẽ
          thiết kế, và vế 1 nói một trạng thái KHÔNG lệch hướng. Vế còn lại chỉ hiện khi cfg đã bị
          sửa: đó mới là dữ liệu lệch khỏi mặc định, đúng phép thử 2. Nút ở lại và LUÔN hiện (khoá
          khi chưa sửa) — nó là control, không phải câu giải thích. */}
      <div className="flex flex-wrap items-end gap-x-3">
        <PageTitle route="rules" />
        <div className="mb-4 ml-auto flex items-center gap-2.5">
          {dirty ? (
            <b className="rounded-lg border border-primary-line bg-primary-soft px-2.5 py-1 text-[12.5px] text-ink-2">
              Đang dùng ngưỡng đã sửa trong phiên này.
            </b>
          ) : null}
          <button
            type="button"
            data-testid="rules-reset"
            disabled={!dirty}
            onClick={() => write(resetCfgPatch(cfg, cfgDefault))}
            className="flex-none rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 disabled:cursor-default disabled:opacity-45 enabled:hover:border-primary-line enabled:hover:bg-primary-soft enabled:hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            ↺ Trả về mặc định
          </button>
        </div>
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
            {/* luật 11/08: bỏ "vẫn chạy được nhưng nhãn trạng thái sẽ vô nghĩa" */}
            <b>⚠ {warns.length} ngưỡng đang đặt ngược nhau</b>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              {warns.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Note>
        </div>
      ) : null}

      <div className="grid grid-cols-[232px_minmax(0,1fr)] items-start gap-5">
        <nav
          aria-label="Nhóm ngưỡng"
          className="sticky top-4 flex flex-col gap-3 rounded border border-line bg-surface py-3 shadow-card"
        >
          {menu.map((grp) => (
            <div key={grp.g} className="flex flex-col gap-0.5">
              <div className="t-lbl px-4 pb-1">{grp.g}</div>
              {grp.items.map((it) => (
                <button
                  key={it.k}
                  type="button"
                  onClick={() => setGroup(it.k)}
                  aria-pressed={group === it.k}
                  className={`mx-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
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
          {/* luật 11/08: bỏ giải thích chấm đỏ */}
        </nav>

        <div className="min-w-0">
          <Body />
        </div>
      </div>
    </div>
  );
}
