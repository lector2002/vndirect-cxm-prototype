import { create } from "zustand";

/* Store UI-selection RIÊNG cho thanh timeframe GLOBAL kiểu Enterpret (App Shell, mọi route có
   dữ liệu) — tách khỏi `store.ts` vì store đó cố ý KHÔNG chứa UI-selection (route/tab/filter),
   chỉ chứa snapshot phản ứng của CxmRepository (xem comment đầu store.ts).

   RangeKey/DEFAULT_RANGE SỐNG Ở ĐÂY (không phải sec.ts) vì lý do tầng lớp: layer đi
   data→store→domain→design-system→features, nên store KHÔNG được phụ thuộc features/. sec.ts
   (features/overview) import+re-export lại hai cái này để giữ API cũ cho các nơi đã import từ
   sec.ts/index.ts — cùng tinh thần với scopeSources/scopeTotal (domain/scope.ts) đã áp dụng.

   KHÔNG localStorage — range chỉ sống trong bộ nhớ phiên làm việc. */
export type RangeKey = "default" | "7d" | "14d" | "4w" | "3m" | "6m" | "12m" | "custom";

export const DEFAULT_RANGE: RangeKey = "6m";

export type TimeframeStore = {
  range: RangeKey;
  setRange(r: RangeKey): void;
};

export const useTimeframeStore = create<TimeframeStore>((set) => ({
  range: DEFAULT_RANGE,
  setRange: (r) => set({ range: r }),
}));
