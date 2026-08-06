import type { Cfg, CxmData, Evidence, Phase, Step, TaxNode } from "../data/schema/index.ts";
import { lockReasonForPhase } from "./pilotScope.ts";
import { stepState } from "./state.ts";

/* Phép đếm của màn "VoC theo hành trình" (#/vocjourney) — TIẾNG NÓI tại từng điểm chạm, đối lại
   HÀNH VI mà bản đồ hành trình đo. Hàm THUẦN, không đọc store, để cả màn lẫn test gọi được.

   HAI MẪU SỐ KHÁC NHAU CÙNG SỐNG TRÊN MÀN NÀY — đây là cái bẫy chính, ghi lại để không ai gộp:

   · `TaxNode.n` (tầng L1 gắn với phase) là VOLUME TỔNG HỢP mà taxonomy khai — phase "04 Giao dịch"
     khai 1.900, cao nhất trong sáu phase.
   · `Evidence` là BẰNG CHỨNG MẪU đếm được từng cái, gắn đúng tới một bước — phase 04 chỉ có 51
     (đo 06/08 trên `demoData`). Cùng một phase, hai con số cách nhau gần bốn mươi lần.

   Prototype in `n` lên rail phase kèm chữ "phản hồi" và in số evidence ở hồ sơ điểm chạm kèm chữ
   "bằng chứng mẫu". Hai đơn vị, hai chỗ, không nói với nhau. Người đọc lướt rail sẽ kết luận phase
   04 có nhiều tiếng nói nhất, rồi xuống tới điểm chạm chỉ đọc được 51 — đúng loại lỗi "mẫu số nói
   một đằng, chart vẽ
   một nẻo" đã sửa ba lần trong stream này. Nên ở bản React: RAIL CHỈ MANG MỘT ĐƠN VỊ (bằng chứng
   mẫu, cùng đơn vị với spine), còn `n` của taxonomy xuất hiện ĐÚNG MỘT CHỖ — trong câu nói ra
   khoảng cách giữa hai con số (`coverageGapLine`), nơi chênh lệch chính là nội dung. */

/** Bằng chứng mẫu gắn vào một bước. */
export function evidenceAtStep(data: CxmData, stepId: string): Evidence[] {
  return data.ev.filter((e) => e.step === stepId);
}

/** Sentiment trung bình của một bước — `null` nghĩa là CHƯA ĐO (không có bằng chứng nào), KHÁC hẳn
    0 nghĩa là đã đo và trung tính. Chỗ hiển thị phải giữ nguyên phân biệt này. */
export function sentimentAtStep(evs: readonly Evidence[]): number | null {
  if (evs.length === 0) return null;
  return evs.reduce((a, e) => a + e.sen, 0) / evs.length;
}

/** Một topic tại điểm chạm: theme cha + các sub-theme của nó đếm riêng. */
export type StepThemeRow = {
  id: string;
  name: string;
  /** Số bằng chứng CHẠM tới theme này (kể cả chạm qua một sub-theme con) — đếm mỗi bằng chứng
      một lần dù nó gắn nhiều node cùng nhánh. */
  n: number;
  kids: { id: string; name: string; n: number }[];
};

/* Vì sao GỘP THEO THEME CHA thay vì xếp hạng phẳng như prototype (dòng 2770): danh sách phẳng trộn
   hai cấp, bước s2 có tới 16 hàng theme+subtheme. Cắt một danh sách trộn cấp theo số đếm thô sẽ âm
   thầm đẩy theme cha xuống dưới sub-theme con của chính nó — cắt xong mất cha, còn con. Gộp lại thì
   hàng luôn là một theme, sub-theme thành chip nằm dưới đúng cha của nó, và số hàng bám theo số
   theme (14 trong seed) chứ không theo số node. */
export function themeRowsAtStep(data: CxmData, evs: readonly Evidence[]): StepThemeRow[] {
  const nodeOf = (id: string): TaxNode | undefined => data.tax.find((t) => t.id === id);

  const rows = new Map<
    string,
    { name: string; n: number; kids: Map<string, { name: string; n: number }> }
  >();

  for (const e of evs) {
    // Dedup TRONG một bằng chứng: gắn cả theme cha lẫn sub-theme con thì vẫn là một tiếng nói.
    const touchedThemes = new Set<string>();
    const touchedKids = new Set<string>();
    for (const tid of e.tax) {
      const node = nodeOf(tid);
      if (!node) continue;
      if (node.lv === "theme") {
        touchedThemes.add(node.id);
        continue;
      }
      if (node.lv !== "subtheme") continue;
      const parent = nodeOf(node.parentId);
      /* Sub-theme mồ côi (cha không tồn tại hoặc không phải theme) đứng thành hàng RIÊNG thay vì bị
         bỏ — bỏ là giấu mất tiếng nói. Đây là dữ liệu vỡ bất biến chứ không phải chuyện thường, nên
         phải nhìn thấy được. */
      if (parent && parent.lv === "theme") {
        touchedThemes.add(parent.id);
        touchedKids.add(node.id);
      } else {
        touchedThemes.add(node.id);
      }
    }

    for (const id of touchedThemes) {
      const row = rows.get(id) ?? { name: nodeOf(id)?.name ?? id, n: 0, kids: new Map() };
      row.n += 1;
      rows.set(id, row);
    }
    for (const kid of touchedKids) {
      const node = nodeOf(kid);
      const row = node ? rows.get(node.parentId) : undefined;
      if (!node || !row) continue;
      const cur = row.kids.get(kid) ?? { name: node.name, n: 0 };
      cur.n += 1;
      row.kids.set(kid, cur);
    }
  }

  return [...rows.entries()]
    .map(([id, r]) => ({
      id,
      name: r.name,
      n: r.n,
      kids: [...r.kids.entries()]
        .map(([kid, k]) => ({ id: kid, name: k.name, n: k.n }))
        .sort((a, b) => b.n - a.n),
    }))
    .sort((a, b) => b.n - a.n);
}

/** Intent của khách tại điểm chạm — bốn category cố định theo `data.cats`, không nở theo dữ liệu.
    Chỉ giữ category CÓ bằng chứng: một hàng bằng 0 ở đây đọc thành "không ai nói kiểu này", dễ lẫn
    với "chưa đo" — mà số đã đo nằm ngay ở mẫu số phía trên. */
export function intentRowsAtStep(
  data: CxmData,
  evs: readonly Evidence[],
): { id: string; label: string; color: string; n: number }[] {
  return Object.entries(data.cats)
    .map(([id, c]) => ({ id, label: c.label, color: c.color, n: evs.filter((e) => e.cat === id).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
}

/** Tổng bằng chứng mẫu gắn vào các bước thuộc một phase — ĐƠN VỊ DUY NHẤT của rail phase. */
export function voiceCountAtPhase(data: CxmData, phaseId: string): number {
  const groupIds = new Set(data.groups.filter((g) => g.phaseId === phaseId).map((g) => g.id));
  const flowIds = new Set(data.flows.filter((f) => groupIds.has(f.groupId)).map((f) => f.id));
  const stepIds = new Set(data.steps.filter((s) => flowIds.has(s.flowId)).map((s) => s.id));
  return data.ev.filter((e) => stepIds.has(e.step)).length;
}

/** Node taxonomy tầng L1 gắn với một phase — nguồn của con số "taxonomy khai bao nhiêu". */
export function phaseTaxNode(data: CxmData, phaseId: string): TaxNode | undefined {
  return data.tax.find((t) => t.lv === "L1" && t.maps === phaseId);
}

/* Câu nói ra KHOẢNG CÁCH giữa hai mẫu số. Đây là chỗ DUY NHẤT `TaxNode.n` được in trên màn, và nó
   luôn đứng cạnh số bằng chứng thật — một mình nó thì gây hiểu nhầm (xem docblock đầu file). */
export function coverageGapLine(data: CxmData, phaseId: string): string {
  const node = phaseTaxNode(data, phaseId);
  const voice = voiceCountAtPhase(data, phaseId);
  if (!node) {
    return voice === 0
      ? "Chưa node taxonomy nào gắn với phase này, và cũng chưa bằng chứng mẫu nào xuống tới mức điểm chạm."
      : `Chưa node taxonomy nào gắn với phase này, nhưng đã có ${voice} bằng chứng mẫu gắn tới điểm chạm.`;
  }
  if (voice === 0) {
    return `Taxonomy khai ${node.n} phản hồi thuộc phase này, nhưng chưa bằng chứng mẫu nào xuống được tới mức điểm chạm — chưa điểm chạm nào trong phase được instrument.`;
  }
  return `Taxonomy khai ${node.n} phản hồi thuộc phase này; ${voice} trong số đó đã xuống được tới mức điểm chạm và đọc được từng cái ở dưới.`;
}

/* Lý do khoá của một phase, ĐỌC TRÊN MÀN NÀY — `null` nghĩa là phase đang mở.

   Lý do gốc (domain/pilotScope.ts) đếm theo HÀNH VI: "mới 1 trên 16 flow có dữ liệu quan sát". Trên
   màn tiếng nói câu đó chưa đủ, vì đo được (06/08) rằng phase "04 Giao dịch" đang KHOÁ mà vẫn có 51
   bằng chứng mẫu gắn tới điểm chạm — flow "Mở tài khoản phái sinh" nằm ở phase 04 chứ không phải
   phase 02 như tên gọi khiến người ta tưởng. Rail in "51 bằng chứng mẫu" trên một ô bấm không vào
   được, mà không nói gì thêm, là mời người đọc vào một chỗ màn từ chối mở.

   Nên nói thẳng cả hai vế. KHÔNG sửa lý do dùng chung: bản đồ hành trình đo hành vi, thêm số bằng
   chứng vào đó là nhét đơn vị của màn này sang màn kia. */
export function phaseLockNote(data: CxmData, phase: Phase): string | null {
  const base = lockReasonForPhase(phase, data.flows, data.groups);
  if (!base) return null;
  const voice = voiceCountAtPhase(data, phase.id);
  if (voice === 0) return base;
  return `${base} Phase này đã có ${voice} bằng chứng mẫu gắn tới điểm chạm, nhưng vẫn nằm ngoài lượt trình bày — tiếng nói ở đây chưa đọc được trên màn.`;
}

/** Bước "hành vi im lặng mà tiếng nói thì không": mọi tiêu chí hành vi TRONG ngưỡng nhưng vẫn có
    bằng chứng dồn vào. Đây là thứ không lớp nào nhìn thấy một mình. */
export function quietButVoicedSteps(data: CxmData, cfg: Cfg, steps: readonly Step[]): Step[] {
  return steps.filter((s) => {
    const o = data.obs.find((x) => x.stepId === s.id);
    if (!o) return false;
    if (stepState(o, cfg) !== "ok") return false;
    return evidenceAtStep(data, s.id).length > 0;
  });
}
