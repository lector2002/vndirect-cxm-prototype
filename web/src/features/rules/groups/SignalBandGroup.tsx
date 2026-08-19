import { Fragment, useMemo } from "react";
import { Badge, Card, Note } from "../../../design-system/index.ts";
import {
  SIGNAL_BAND_KIND_LABEL,
  signalEvalAll,
  signalEvalWhyText,
  signalWinDays,
} from "../../../domain/index.ts";
import type { CfgSignalBand } from "../../../data/schema/index.ts";
import { groupSignalsByPhase } from "../../signals/facets.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm "Signal thresholds" — `cfg.signal[id]` (owner chốt schema 19/08 sau ba vòng ASCII).

   MỖI DÒNG MỘT ĐIỂM ĐO, MỖI ĐIỂM ĐO MỘT DỤNG CỤ: bốn kind của CfgSignalBand là bốn dụng cụ đo với
   bốn chiều xấu (schema/config.ts) — dòng nào cần cả rate lẫn count là dấu hiệu nên lên thành
   metric, không phải lý do nới schema. Chọn dụng cụ ở cột Measure; "— not set —" xoá entry, và
   BỎ TRỐNG LÀ CÂU TRẢ LỜI HỢP LỆ (cùng luật Per-step levels): điểm đo chưa đặt thì *chưa đánh giá*,
   không rơi về "đang ổn".

   ĐỔI KIND LÀ VỀ BỘ SỐ KHỞI ĐIỂM CỦA KIND MỚI, không giữ warn/crit cũ: bốn kind không cùng đơn vị
   (% vs lượt) và không cùng chiều xấu — giữ số cũ qua một lần đổi kind là lén đổi nghĩa của con số
   mà không ai gõ lại nó.

   BẢNG CHIA NHÓM THEO PHASE bằng CHÍNH groupSignalsByPhase của #/signals (một đường phân hoạch,
   hai màn cùng thứ tự — người vừa xem kiểm kê sang đây không phải học lại trật tự mới).

   CHIPS GIÁ TRỊ chọn từ `Signal.values` (bản khai) — rate chưa chọn giá trị nào thì trạng thái là
   "chưa chọn giá trị để đo" (unknown), KHÔNG phải mâu thuẫn ngưỡng; ceiling không chọn gì nghĩa là
   ĐẾM TẤT (signal fail-reason: mỗi lượt bắn là một ca hỏng). */

const TH = "text-left font-medium text-ink-3 text-[11px] uppercase tracking-[0.04em] pb-[7px] px-1";
const SEL = "w-full border border-line rounded px-2 py-1 text-[12.5px] bg-surface";

const KINDS = ["badRate", "goodRate", "floor", "ceiling"] as const;

/** Bộ số khởi điểm khi owner vừa chọn kind — thứ để sửa tiếp, không phải khuyến nghị nghiệp vụ. */
const FRESH: Record<CfgSignalBand["kind"], CfgSignalBand> = {
  badRate: { kind: "badRate", bad: [], warn: 10, crit: 20 },
  goodRate: { kind: "goodRate", good: [], warn: 80, crit: 60 },
  floor: { kind: "floor", warn: 10, crit: 3 },
  ceiling: { kind: "ceiling", warn: 10, crit: 20 },
};

function selectedValues(band: CfgSignalBand): readonly string[] {
  if (band.kind === "badRate") return band.bad;
  if (band.kind === "goodRate") return band.good;
  if (band.kind === "ceiling") return band.bad ?? [];
  return [];
}

function withToggledValue(band: CfgSignalBand, v: string): CfgSignalBand {
  if (band.kind === "floor") return band;
  const cur = selectedValues(band);
  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  if (band.kind === "badRate") return { ...band, bad: next };
  if (band.kind === "goodRate") return { ...band, good: next };
  // ceiling: bỏ chip cuối cùng là quay về "đếm tất" — xoá hẳn khoá, không để lại mảng rỗng mơ hồ.
  if (next.length === 0) {
    const { bad: _drop, ...rest } = band;
    return rest;
  }
  return { ...band, bad: next };
}

/** Đơn vị của warn/crit đọc theo kind — luôn đứng cạnh con số (quy ước NumField). */
function unitOf(band: CfgSignalBand): string {
  return band.kind === "badRate" || band.kind === "goodRate" ? "%" : `lượt/${signalWinDays(band)}d`;
}

function fmtPct(v: number): string {
  return `${(Math.round(v * 10) / 10).toString().replace(".", ",")}%`;
}

export function SignalBandGroup() {
  const data = useCxmStore((s) => s.data);
  const cfg = useCxmStore((s) => s.cfg);
  const { write, error } = useCfgWrite();

  const groups = useMemo(() => groupSignalsByPhase(data, null), [data]);
  const evals = useMemo(
    () => signalEvalAll(data.signals, data.sigFires, cfg, data.asOf),
    [data, cfg],
  );

  const setBand = (id: string, band: CfgSignalBand | null) => {
    const next = { ...cfg.signal };
    if (band === null) delete next[id];
    else next[id] = band;
    write({ signal: next });
  };

  const setCount = data.signals.filter((s) => cfg.signal[s.id] !== undefined).length;

  return (
    <Card title="Signal thresholds" denomStrip={`${setCount} of ${data.signals.length} signals have thresholds`}>
      {error ? (
        <div className="mb-3" data-testid="sigband-write-error">
          <Note tone="crit">
            <b>Không ghi được.</b> {error}
          </Note>
        </div>
      ) : null}

      {/* Cùng vai với câu đếm của Per-step levels: nói ra nghĩa của ô trống, để một bảng phần lớn
          "— not set —" không bị đọc thành bảng bình thường. */}
      <div className="mb-3" data-testid="sigband-progress">
        <Note>
          {`Điểm đo bỏ trống thì chưa đánh giá — không mang nhãn nào, không rơi về "đang ổn". ` +
            `Mỗi điểm đo một dụng cụ đo: tỉ lệ đọc bằng %, floor/ceiling đếm lượt trong cửa sổ của chính nó.`}
        </Note>
      </div>

      <div className="max-h-[560px] overflow-y-auto pr-1">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-[12.5px]" data-testid="sigband-table">
            <thead>
              <tr>
                <th className={TH}>Signal</th>
                <th className={TH}>Measure</th>
                <th className={TH}>Values</th>
                <th className={TH}>Window</th>
                <th className={TH}>Min n</th>
                <th className={TH}>Watch threshold</th>
                <th className={TH}>Critical threshold</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.phaseId}>
                  <tr>
                    <td colSpan={8} className="t-lbl border-t border-line px-1 pb-1 pt-3">
                      {g.code ? `${g.code} ${g.name}` : g.name}
                    </td>
                  </tr>
                  {g.signals.map((s) => {
                    const band = cfg.signal[s.id];
                    const isRate = band?.kind === "badRate" || band?.kind === "goodRate";
                    const ev = evals.get(s.id)!;
                    const why = signalEvalWhyText(ev);
                    return (
                      <tr key={s.id} data-testid={`sigband-row-${s.id}`} className="border-t border-line-soft align-top">
                        <td className="max-w-[24ch] px-1 py-1.5">
                          <code className="block break-words font-mono text-[12px] font-semibold">{s.name}</code>
                        </td>
                        <td className="w-[150px] px-1 py-1.5">
                          <label className="sr-only" htmlFor={`sigband-kind-${s.id}`}>{`Measure — ${s.name}`}</label>
                          <select
                            id={`sigband-kind-${s.id}`}
                            className={SEL}
                            value={band?.kind ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setBand(s.id, v === "" ? null : structuredClone(FRESH[v as CfgSignalBand["kind"]]));
                            }}
                          >
                            <option value="">— not set —</option>
                            {KINDS.map((k) => (
                              <option key={k} value={k}>
                                {SIGNAL_BAND_KIND_LABEL[k]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="max-w-[26ch] px-1 py-1.5">
                          {!band || band.kind === "floor" ? (
                            <span className="t-meta">—</span>
                          ) : s.values.length === 0 ? (
                            // Bản khai giá trị rỗng (chưa instrument) — không có gì để chọn, nói thẳng.
                            <span className="t-meta italic">no declared values</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {s.values.map((v) => {
                                const on = selectedValues(band).includes(v);
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    aria-pressed={on}
                                    data-testid={`sigband-val-${s.id}-${v}`}
                                    onClick={() => setBand(s.id, withToggledValue(band, v))}
                                    className={`rounded-lg border px-1.5 py-0.5 font-mono text-[11.5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary ${
                                      on
                                        ? "border-primary-line bg-primary-soft font-semibold text-primary"
                                        : "border-line bg-surface text-ink-3 hover:text-ink"
                                    }`}
                                  >
                                    {v}
                                  </button>
                                );
                              })}
                              {band.kind === "ceiling" && selectedValues(band).length === 0 ? (
                                <span className="t-meta self-center text-[11.5px]">(counting all fires)</span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="w-[104px] px-1 py-1.5">
                          {band ? (
                            <NumField
                              value={signalWinDays(band)}
                              onCommit={(v) => setBand(s.id, { ...band, winDays: v })}
                              suffix="d"
                              label={`Window — ${s.name}`}
                            />
                          ) : (
                            <span className="t-meta">—</span>
                          )}
                        </td>
                        <td className="w-[104px] px-1 py-1.5">
                          {band && isRate ? (
                            <NumField
                              value={(band.kind === "badRate" || band.kind === "goodRate" ? band.minN : undefined) ?? 1}
                              onCommit={(v) => setBand(s.id, { ...band, minN: v })}
                              label={`Min n — ${s.name}`}
                            />
                          ) : (
                            <span className="t-meta">—</span>
                          )}
                        </td>
                        <td className="w-[140px] px-1 py-1.5">
                          {band ? (
                            <NumField
                              value={band.warn}
                              onCommit={(v) => setBand(s.id, { ...band, warn: v })}
                              suffix={unitOf(band)}
                              tone="watch"
                              label={`Watch threshold — ${s.name}`}
                            />
                          ) : (
                            <span className="t-meta">—</span>
                          )}
                        </td>
                        <td className="w-[140px] px-1 py-1.5">
                          {band ? (
                            <NumField
                              value={band.crit}
                              onCommit={(v) => setBand(s.id, { ...band, crit: v })}
                              suffix={unitOf(band)}
                              tone="crit"
                              label={`Critical threshold — ${s.name}`}
                            />
                          ) : (
                            <span className="t-meta">—</span>
                          )}
                        </td>
                        <td className="w-[170px] whitespace-nowrap px-1 py-1.5" data-testid={`sigband-status-${s.id}`}>
                          {ev.state !== "unknown" ? (
                            <span className="flex items-center gap-1.5">
                              <Badge state={ev.state} />
                              <span className="t-meta tabular-nums">
                                {band && (band.kind === "badRate" || band.kind === "goodRate")
                                  ? `${fmtPct(ev.value)} (n=${ev.n})`
                                  : `${ev.value} lượt`}
                              </span>
                            </span>
                          ) : ev.why === "unset" ? (
                            <span className="t-meta">—</span>
                          ) : (
                            <span className="t-meta">{why}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
