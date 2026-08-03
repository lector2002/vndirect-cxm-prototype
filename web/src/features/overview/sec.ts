import type { CxmData } from "../../data/schema/index.ts";
import { DEFAULT_RANGE, type RangeKey } from "../../store/timeframe.ts";

/* Hằng số + hàm thuần dùng chung cho hai màn Tổng quan (#/cxm, #/voc) — port 1-1 từ prototype
   (output/cxm-platform-prototype.html dòng 1364-1410, 2095-2104). KHÔNG đọc store/DOM: mọi hàm
   nhận data/cfg qua tham số để OverviewPage (container duy nhất đọc store) truyền vào. */

export type SecKey = "voc" | "cxm";

/** Nhãn tần suất bản tin — port 1-1 SUB_LABEL (prototype dòng 1364). */
export const SUB_LABEL: Record<string, string> = {
  off: "",
  daily: "hằng ngày",
  weekly: "hằng tuần",
  monthly: "hằng tháng",
};

/* Bỏ kỳ global: fx() cố định ở baseline 6 tháng — nhãn kỳ hiển thị cũng cố định theo baseline này
   (port 1-1 BASE_LABEL/BASE_RANGE, prototype dòng 1372). */
export const BASE_LABEL = "6 tháng gần nhất";
export const BASE_RANGE = "28/01/2026 – 27/07/2026";

/* VOC_SCOPE + scopeSources/scopeTotal đã DỜI xuống `domain/scope.ts` (hàm thuần trên CxmData).
   Lý do: `design-system/QuantifyWidget` cần mẫu số đó để ghi nhãn trục, mà design-system KHÔNG
   được import từ features/. Re-export ở đây để `overview/index.ts` + sec.test.ts giữ nguyên API. */
export { scopeSources, scopeTotal } from "../../domain/scope.ts";

type SecMeta = {
  key: SecKey;
  label: string;
};

/* Port 1-1 SEC (prototype dòng 2095-2104) — `lead`/`intro` (hero) đã CẮT theo quyết định owner
   01/08 (docs/REDESIGN-PLAN-HANDOFF.md dòng 27, 29): Overview không còn hero, chỉ còn label dùng
   cho thông báo phòng thủ (OverviewPage) + nhãn phần trong nav/chip. */
export const SEC: Record<SecKey, SecMeta> = {
  voc: { key: "voc", label: "Voice of Customer" },
  cxm: { key: "cxm", label: "CXM · Quản trị trải nghiệm" },
};

/* --- Bộ lọc thời gian GLOBAL kiểu Enterpret (App Shell, thay hero + local filter, quyết định
   owner 01/08 mở rộng 02/08) --- */

/* RangeKey/DEFAULT_RANGE giờ định nghĩa ở store/timeframe.ts (lý do tầng lớp — xem comment ở đó);
   re-export ở đây để giữ nguyên API cũ cho mọi nơi đã import từ sec.ts/overview/index.ts. */
export type { RangeKey };
export { DEFAULT_RANGE };

/** Dữ liệu hiện tại CHỈ theo tháng (monthly-only) — pipeline daily/weekly là việc tương lai.
    8 mốc: default/3m/6m/12m tra thẳng số tháng; 7d/14d/4w "mịn hơn tháng" — KHÔNG có dữ liệu ngày
    thật nên gán best-effort=1 (nhỏ nhất có thể trung thực), rồi effectiveMonths() bên dưới clamp
    lên tối thiểu 3 điểm (tránh sparkline 1 điểm = đường gãy; anomaly chart dưới 3 điểm vẫn tự nói
    "chưa đủ kỳ" một cách trung thực — xem QuantifyWidget.MIN_POINTS_FOR_ANOMALY=4 — nên KHÔNG cần
    ép floor lên 4); custom = default tạm thời (chưa có date-picker thật). */
export const RANGE_MONTHS: Record<RangeKey, number> = {
  default: 6,
  "7d": 1,
  "14d": 1,
  "4w": 1,
  "3m": 3,
  "6m": 6,
  "12m": 12,
  custom: 6,
};

/** Số tháng THẬT tối đa đang có trong toàn bộ chuỗi thời gian của data hiện hành (Quantify
    kind='series' + theme.pts) — suy từ chính data, KHÔNG hardcode. Dùng để báo khi kỳ đã chọn
    vượt quá số điểm dữ liệu thật đang có, tránh để user tưởng bộ lọc hỏng khi bấm mà chart không
    đổi gì. */
export function maxRealMonths(data: CxmData): number {
  const seriesLens = data.qt.flatMap((q) => (q.kind === "series" ? q.t.map((s) => s.p.length) : []));
  const themeLens = data.tax.filter((t) => t.lv === "theme" && t.pts).map((t) => t.pts!.length);
  return Math.max(0, ...seriesLens, ...themeLens);
}

/** Số tháng THỰC DÙNG để cắt time-series cho range đã chọn — khác RANGE_MONTHS[range] (giá trị
    "yêu cầu" tĩnh) ở chỗ CLAMP theo maxRealMonths(data) tại runtime:
    - Chặn dưới =3: 7D/14D/4W yêu cầu best-effort=1, nhưng .slice(-1) ra sparkline 1 điểm — một
      chấm, không vẽ được đoạn đường nào (LineChart/AnomalyChart cần ≥2 điểm mới có đoạn). Clamp
      lên tối thiểu 3 điểm để luôn có đường vẽ được, kèm ghi chú trung thực (TimeframeBar) rằng dữ
      liệu hiện theo tháng, mốc nhỏ hơn sẽ đủ khi có pipeline ngày/tuần. (3 điểm vẫn dưới
      MIN_POINTS_FOR_ANOMALY=4 của QuantifyWidget nên card anomaly tự hiện "chưa đủ kỳ để chấm bất
      thường" — ĐÚNG và trung thực, không cần ép floor lên 4 chỉ để né dòng chữ đó.)
    - Chặn trên =maxReal: KHÔNG cắt vượt quá số điểm thật đang có (nếu maxReal<3, `.slice(-months)`
      tự nhiên trả về nguyên chuỗi ngắn hơn — đây là giới hạn dữ liệu, không sửa được ở tầng UI). */
export function effectiveMonths(range: RangeKey, maxReal: number): number {
  const requested = RANGE_MONTHS[range];
  return Math.min(maxReal, Math.max(requested, 3));
}
