import type { Cfg, CxmData } from "../data/schema/index.ts";
import { metricDirection } from "../data/metric-direction.ts";

/* Soi cfg đang đặt NGƯỢC NHAU — vẫn chạy được (metricState/stepState không ném), nhưng nhãn trạng
   thái sinh ra sẽ vô nghĩa (vd. "watch" hiện ra khi lẽ ra phải là "crit" nặng hơn, hoặc ngược lại).
   Đây là lưới an toàn cho màn Chỉ số & ngưỡng — không phải luật validate cứng (setCfg vẫn CHO ghi
   cfg kiểu này, vì nó không vỡ bất biến dữ liệu nào), chỉ là cảnh báo để owner tự sửa.
   Port 1-1 cfgIssues() của prototype (output/cxm-platform-prototype.html:4333-4346, ở NGOÀI web/ —
   nằm cạnh web/ chứ không phải web/output/). Câu chữ giữ nguyên bản gốc; khác đúng một chỗ: bản gốc
   `const c = CFG.metric[m.id]; if (!c.on) return;` sẽ NÉM nếu chỉ số thiếu entry (đọc `.on` trên
   undefined) — Cfg.metric hôm nay không còn đảm bảo phủ đủ mọi chỉ số (module thêm chỉ số không kèm
   band ngay), nên hàm thuần này thêm `if (!band || !band.on) continue;`, bỏ qua thay vì ném.

   Hướng so sánh của từng chỉ số lấy từ metricDirection() (data/metric-direction.ts, tương đương
   mdir() của prototype) — dùng lại ĐÚNG luật mà metricState() đang dùng để xếp hạng, không tự suy
   luận hướng riêng ở đây kẻo hai nơi lệch nhau theo thời gian. */
/* 18/08 (redesign #/rules): menu nhóm cần biết mâu thuẫn nằm Ở NHÓM NÀO để treo dấu ⚠ đúng chỗ.
   Tách dạng có nhóm ra hàm riêng thay vì để RulesPage tự đoán lại từ câu chữ — hai đường đếm là
   hai đường lệch. `cfgIssues()` giữ nguyên chữ ký cũ (mọi chỗ gọi + test không đổi). */
export type CfgIssueGroup = "step" | "metric" | "signal";

export function cfgIssuesTyped(data: CxmData, cfg: Cfg): { group: CfgIssueGroup; msg: string }[] {
  const issues: { group: CfgIssueGroup; msg: string }[] = [];

  if (cfg.step.failCrit <= cfg.step.failWatch) {
    issues.push({
      group: "step",
      msg: `Bước: ngưỡng cần xử lý (${cfg.step.failCrit}%) phải cao hơn ngưỡng cần theo dõi (${cfg.step.failWatch}%).`,
    });
  }

  for (const m of data.metrics) {
    const band = cfg.metric[m.id];
    if (!band || !band.on) continue;
    const dir = metricDirection(m);
    if (dir === "down" && band.crit <= band.watch) {
      issues.push({
        group: "metric",
        msg: `${m.name}: mục tiêu là càng thấp càng tốt, nên ngưỡng cần xử lý (${band.crit}) phải cao hơn ngưỡng cần theo dõi (${band.watch}).`,
      });
    } else if (dir === "up" && band.crit >= band.watch) {
      issues.push({
        group: "metric",
        msg: `${m.name}: mục tiêu là càng cao càng tốt, nên ngưỡng cần xử lý (${band.crit}) phải thấp hơn ngưỡng cần theo dõi (${band.watch}).`,
      });
    }
  }

  /* Ngưỡng từng điểm đo (`cfg.signal`, 19/08) — chiều xấu của TỪNG KIND đã chốt trong schema
     (config.ts): badRate/ceiling vượt lên là xấu ⇒ warn < crit; goodRate/floor tụt xuống là xấu
     ⇒ warn > crit. KHÔNG kiểm "bad/good rỗng" ở đây: đó là entry khai dở (signalEval trả unknown
     `no-values`, việc còn phải làm), không phải hai ngưỡng nói ngược nhau. */
  for (const s of data.signals) {
    const band = cfg.signal[s.id];
    if (!band) continue;
    const up = band.kind === "badRate" || band.kind === "ceiling";
    if (up && band.crit <= band.warn) {
      issues.push({
        group: "signal",
        msg: `${s.name}: ${band.kind === "badRate" ? "tỉ lệ" : "số lượt"} vượt lên là xấu, nên ngưỡng xử lý (${band.crit}) phải cao hơn ngưỡng theo dõi (${band.warn}).`,
      });
    } else if (!up && band.crit >= band.warn) {
      issues.push({
        group: "signal",
        msg: `${s.name}: ${band.kind === "goodRate" ? "tỉ lệ" : "số lượt"} tụt xuống là xấu, nên ngưỡng xử lý (${band.crit}) phải thấp hơn ngưỡng theo dõi (${band.warn}).`,
      });
    }
    const vals = band.kind === "badRate" ? band.bad : band.kind === "goodRate" ? band.good : band.kind === "ceiling" ? (band.bad ?? []) : [];
    const stray = vals.filter((v) => !s.values.includes(v));
    if (stray.length > 0) {
      issues.push({
        group: "signal",
        msg: `${s.name}: giá trị ${stray.map((v) => `"${v}"`).join(", ")} không có trong bản khai giá trị của điểm đo.`,
      });
    }
    /* `minN`/`winDays` là kiểm LEAF (nguyên, ≥ 1) — việc của nhóm 24 data/validate.ts (bảng
       NUM_RANGE, cổng CHẶN khi ghi), không lặp lại ở đây: lưới mềm này chỉ soi các ngưỡng nói
       NGƯỢC NHAU, đúng phép chia đã có với band chỉ số. */
  }

  return issues;
}

export function cfgIssues(data: CxmData, cfg: Cfg): string[] {
  return cfgIssuesTyped(data, cfg).map((i) => i.msg);
}
