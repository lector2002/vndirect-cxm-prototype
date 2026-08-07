import { useEffect, useState } from "react";
import type { CfgBandAxis, Customer } from "../../../data/schema/index.ts";
import { bandLabels, bandOf, formatBound } from "../../../data/bands.ts";
import { CUST_NUM, RAW_LABEL } from "../../../data/rawFields.ts";
import { isSegUnknown } from "../../../data/segment.ts";
import { Card, Note } from "../../../design-system/index.ts";
import { nf } from "../../../design-system/format.ts";
import { useCxmStore } from "../../../store/store.ts";
import { NumField } from "../NumField.tsx";
import { useCfgWrite } from "../useCfgWrite.ts";

/* Nhóm "Phân khúc khách" — chỗ owner sửa RANH GIỚI DẢI của các chiều cắt ngưỡng.

   Đây là E7 của Module E (docs/module-e-charter.md dòng 149), đặc tả từ 04/08 cùng lúc với quyết
   định "nguồn trong setting sẽ là source of truth" nhưng chưa ai dựng — nên tới hôm nay ranh giới
   dải là thứ chỉ sửa được bằng cách sửa code, đúng cái quyết định đó nói là không nên.

   BỐN ĐIỀU QUYẾT ĐỊNH HÌNH DẠNG CỦA NHÓM NÀY:

   1. XEM TRƯỚC RỒI MỚI LƯU. Sửa một ranh giới là chia lại toàn bộ khách trên mọi chart đọc chiều
      đó. Nên ô nhập ghi vào một BẢN NHÁP tại chỗ; dải mới và số khách rơi vào từng dải hiện ngay
      cạnh, tính trên chính `data.cust` — người sửa thấy hậu quả TRƯỚC khi bấm lưu. Đây là tiêu chí
      nghiệm thu E7, không phải trang trí.

   2. NHÃN DẢI KHÔNG CÓ Ô NÀO ĐỂ GÕ. Mọi chuỗi nhãn ở đây đều đi qua `bandLabels(axis)` — bất biến
      E-c của Module E. Có một ô cho gõ nhãn tay là mở đường cho nhãn nói khác ranh giới, đúng thứ
      cả module E tồn tại để chặn.

   3. TỰ KIỂM RỒI VẪN PHẢI BẮT LỖI NÉM RA. Nhóm này chặn trước ba ca nói được thành câu cho người
      dùng (rỗng · không tăng dần · sàn chồng ranh giới đầu) cộng ca hai dải ra cùng một nhãn. Nhưng
      luật ở `data/validate.ts` rộng hơn, nên `setCfg` vẫn có thể ném — `useCfgWrite` in nguyên văn
      lý do. UI không được giả vờ mình biết hết luật.

   4. HAI NGHĨA "KHÔNG BIẾT" ĐẾM RIÊNG, GHIM CUỐI. `bandOf` trả nguyên sentinel, và 'chưa-biết' với
      'thiếu' không bao giờ gộp (data/segment.ts). Chúng là hai dòng riêng dưới các dải có tên —
      không phải một dải nữa, nên không nằm lẫn vào giữa.

   `cfg.segment.values` (danh sách giá trị hợp lệ của chiều lấy nguyên giá trị) hiện CHỈ ĐỌC — xem
   lý do ở khối cuối màn. */

/** Chú thích cách đọc đặt cạnh ô nhập ranh giới — `undefined` khi số thô ĐÃ là cách đọc đúng, để ô
    không tự chú thích thừa (`18` → "= 18") hay tệ hơn là chú thích SAI chính nó (mốc `1` đồng mà
    ghi "= 0đ"). Quy tắc gọn/không-gọn nằm ở `formatBound`, đây chỉ bọc thành text. */
function boundHint(v: number, unit: CfgBandAxis['unit']): string | undefined {
  const read = formatBound(v, unit);
  return read === null ? undefined : `= ${read}`;
}

/** Ba ca sai nói được thành câu cho người sửa. Trả `null` khi ranh giới hợp lệ. */
function axisError(axis: CfgBandAxis): string | null {
  if (axis.cuts.length === 0) return "Phải có ít nhất một ranh giới — không có ranh giới thì không có dải nào để xếp khách vào.";
  for (let i = 1; i < axis.cuts.length; i++) {
    if (axis.cuts[i] <= axis.cuts[i - 1]) {
      return `Ranh giới phải tăng dần: ranh giới thứ ${i + 1} (${nf(axis.cuts[i])}) không lớn hơn ranh giới thứ ${i} (${nf(axis.cuts[i - 1])}).`;
    }
  }
  if (axis.min !== null && axis.min >= axis.cuts[0]) {
    return `Sàn của dải đầu (${nf(axis.min)}) phải nhỏ hơn ranh giới đầu tiên (${nf(axis.cuts[0])}).`;
  }
  const labels = bandLabels(axis);
  if (new Set(labels).size !== labels.length) {
    return `Hai dải khác nhau đang cho ra cùng một nhãn (${labels.join(" · ")}) — từ biểu đồ sẽ không tách lại được chúng.`;
  }
  return null;
}

/** Đếm khách rơi vào từng dải theo ranh giới ĐANG NHÁP, cộng hai nghĩa "không biết" đếm riêng. */
function previewCounts(cust: readonly Customer[], source: string, axis: CfgBandAxis) {
  const read = CUST_NUM[source];
  const byLabel = new Map<string, number>(bandLabels(axis).map((l) => [l, 0]));
  const unknown = new Map<string, number>();
  if (!read) return { byLabel, unknown, unreadable: cust.length };
  for (const c of cust) {
    const raw = read(c);
    if (isSegUnknown(raw)) {
      unknown.set(raw, (unknown.get(raw) ?? 0) + 1);
      continue;
    }
    const l = bandOf(raw, axis);
    byLabel.set(l, (byLabel.get(l) ?? 0) + 1);
  }
  return { byLabel, unknown, unreadable: 0 };
}

const eqAxis = (a: CfgBandAxis, b: CfgBandAxis): boolean =>
  a.min === b.min && a.unit === b.unit && a.cuts.length === b.cuts.length && a.cuts.every((v, i) => v === b.cuts[i]);

function AxisEditor({ dimId }: { dimId: string }) {
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);
  const cust = useCxmStore((s) => s.data.cust);
  const { write, error } = useCfgWrite();

  const saved = cfg.segment.band[dimId];
  const [draft, setDraft] = useState<CfgBandAxis>(saved);

  // Cfg đổi từ NGOÀI (nút "Trả về mặc định" ở đầu màn, hoặc một trục khác vừa ghi) phải kéo bản nháp
  // về theo — nếu không, bản nháp cũ sẽ ghi đè lại thứ vừa được trả về mặc định.
  useEffect(() => setDraft(saved), [saved]);

  const dim = dims[dimId];
  const source = dim?.cut?.kind === "band" ? dim.cut.source : "";
  const err = axisError(draft);
  const dirty = !eqAxis(draft, saved);
  const { byLabel, unknown, unreadable } = previewCounts(cust, source, err ? saved : draft);

  const setCut = (i: number, v: number) =>
    setDraft((d) => ({ ...d, cuts: d.cuts.map((c, j) => (j === i ? v : c)) }));
  const addCut = () =>
    setDraft((d) => ({ ...d, cuts: [...d.cuts, d.cuts.length ? d.cuts[d.cuts.length - 1] * 2 : 1] }));
  const dropCut = (i: number) => setDraft((d) => ({ ...d, cuts: d.cuts.filter((_, j) => j !== i) }));

  const save = () => {
    if (err) return;
    write({ segment: { ...cfg.segment, band: { ...cfg.segment.band, [dimId]: draft } } });
  };

  return (
    <div data-testid={`axis-${dimId}`}>
      <Card
        title={dim?.label ?? dimId}
        subtitle={`Cắt trên dữ kiện: ${RAW_LABEL[source] ?? source} · đơn vị ${draft.unit}`}
        denomStrip={`${draft.cuts.length} ranh giới ⇒ ${draft.cuts.length + 1} dải · đang xếp ${nf(cust.length)} khách`}
      >
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="t-lbl mb-2">Ranh giới</div>
            <div className="grid gap-1.5">
              {draft.cuts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="t-meta w-14 flex-none text-[12px]">Mốc {i + 1}</span>
                  <NumField
                    value={c}
                    label={`Ranh giới thứ ${i + 1} của ${dim?.label ?? dimId}`}
                    suffix={draft.unit}
                    wide
                    hint={boundHint(c, draft.unit)}
                    onCommit={(v) => setCut(i, v)}
                  />
                  <button
                    type="button"
                    onClick={() => dropCut(i)}
                    aria-label={`Bỏ ranh giới thứ ${i + 1}`}
                    className="rounded-lg border border-line px-2 py-1 text-[12px] text-ink-2 hover:border-crit-line hover:text-crit"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div>
                <button
                  type="button"
                  onClick={addCut}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 hover:border-primary-line hover:bg-primary-soft hover:text-ink"
                >
                  + Thêm ranh giới
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="t-lbl mb-1.5">Sàn của dải đầu</div>
              {draft.min === null ? (
                <div className="t-meta text-[12px]">
                  Không có sàn — dải đầu là “nhỏ hơn ranh giới thứ nhất”. Đúng với trục không có mốc
                  tự nhiên nào ở dưới.
                </div>
              ) : (
                <NumField
                  value={draft.min}
                  label={`Sàn của dải đầu, trục ${dim?.label ?? dimId}`}
                  suffix={draft.unit}
                  wide
                  hint={boundHint(draft.min, draft.unit)}
                  onCommit={(v) => setDraft((d) => ({ ...d, min: v }))}
                />
              )}
            </div>
          </div>

          <div>
            <div className="t-lbl mb-2">
              {dirty ? "Dải sẽ thành thế này sau khi lưu" : "Dải đang dùng"}
            </div>
            <div className="grid gap-1">
              {[...byLabel.entries()].map(([l, n]) => (
                <div key={l} className="flex items-baseline gap-2 text-[12.5px]">
                  <span className="min-w-0 truncate font-semibold text-ink">{l}</span>
                  <span className="ml-auto flex-none tabular-nums text-ink-2">{nf(n)} khách</span>
                </div>
              ))}
              {[...unknown.entries()].map(([l, n]) => (
                <div key={l} className="flex items-baseline gap-2 border-t border-line-soft pt-1 text-[12.5px]">
                  <span className="min-w-0 truncate text-ink-3">{l}</span>
                  <span className="ml-auto flex-none tabular-nums text-ink-3">{nf(n)} khách</span>
                </div>
              ))}
              {unreadable ? (
                <div className="t-meta text-[12px]">
                  Không đọc được dữ kiện “{source}” trên hồ sơ khách — chiều này chưa nối được vào
                  danh mục dữ kiện.
                </div>
              ) : null}
            </div>
            <div className="t-meta mt-2 text-[12px]">
              Biên dưới đóng, biên trên mở: khách có giá trị đúng bằng một ranh giới thuộc dải TRÊN
              ranh giới đó.
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-3">
            <Note tone="crit">
              <b>Chưa lưu được.</b> {err}
            </Note>
          </div>
        ) : null}
        {error ? (
          <div className="mt-3">
            <Note tone="crit">
              <b>Không ghi được cấu hình.</b> {error}
            </Note>
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            disabled={!dirty || err !== null}
            onClick={save}
            className="rounded-lg border border-primary-line bg-primary-soft px-2.5 py-1 text-[12.5px] font-semibold text-ink disabled:cursor-default disabled:border-line disabled:bg-surface disabled:text-ink-3 disabled:opacity-60"
          >
            Lưu ranh giới
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => setDraft(saved)}
            className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 disabled:cursor-default disabled:opacity-45"
          >
            Hoàn tác
          </button>
          {dirty ? (
            <span className="t-meta text-[12px]">Bản nháp — chưa áp lên chart nào.</span>
          ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function SegmentGroup() {
  const cfg = useCxmStore((s) => s.cfg);
  const dims = useCxmStore((s) => s.dims);

  const bandDims = Object.keys(cfg.segment.band);
  const valueDims = Object.keys(cfg.segment.values);

  return (
    <div className="grid gap-4">
      <Note>
        Ranh giới dải là <b>cấu hình</b>, không phải hằng số trong code — sửa ở đây là mọi chart cắt
        theo chiều đó chia lại nhóm ngay, kể cả bảng đếm của chart theo điểm đo. Nhãn của từng dải
        không có ô nào để gõ: nó luôn được sinh ra từ chính các ranh giới, để nhãn không thể nói
        khác ranh giới.
      </Note>

      {bandDims.map((id) => (
        <AxisEditor key={id} dimId={id} />
      ))}

      {valueDims.length ? (
        <Card
          title="Chiều lấy nguyên giá trị"
          subtitle="Danh sách giá trị hợp lệ — chỉ đọc trong bản này"
          denomStrip={`${valueDims.length} chiều đã chốt danh sách đóng`}
        >
          <div className="grid gap-3">
            {valueDims.map((id) => (
              <div key={id}>
                <div className="text-[13px] font-semibold text-ink">{dims[id]?.label ?? id}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {cfg.segment.values[id].map((v) => (
                    <span
                      key={v}
                      className="rounded-[7px] border border-line bg-surface-2 px-2 py-0.5 text-[12px] text-ink-2"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <Note>
              <b>Vì sao chỉ đọc:</b> danh sách này là <i>tập giá trị hợp lệ</i>, nên bỏ một giá trị
              đang có khách mang nó không phải là “đổi cách chia” mà là tuyên bố dữ liệu đang có là
              sai. Đó là một quyết định về dữ liệu, phải đi cùng việc chữa hồ sơ khách — không phải
              một ô ngưỡng vận hành. Chiều chưa chốt danh sách đóng thì cố ý <b>không</b> có mặt ở
              đây: khai một danh sách rỗng nghĩa là “mọi giá trị đều lạ”.
            </Note>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
