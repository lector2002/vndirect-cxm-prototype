import type { CxmData } from "./schema/index.ts";

/* Dataset rỗng — dùng khi Demo Mode TẮT, mô phỏng trạng thái "đã kết nối DB thật nhưng chưa có
   dữ liệu". Mọi field mảng → [], cats (Record) → {}. Đối lập với seed.ts (luôn có dữ liệu demo). */
export const EMPTY_DATA: CxmData = {
  // Rỗng thật — chưa có dữ liệu nào để tính mốc, không bịa ngày (khác seed/demoData luôn có asOf).
  asOf: "",
  periods: [],
  scopes: [],
  phases: [],
  groups: [],
  flows: [],
  steps: [],
  obs: [],
  touchpoints: [],
  signals: [],
  metrics: [],
  sources: [],
  surveys: [],
  tax: [],
  cats: {},
  ev: [],
  ins: [],
  iss: [],
  act: [],
  out: [],
  snap: [],
  loop: [],
  hist: [],
  cust: [],
  qt: [],
  dash: [],
  ag: [],
  sigCounts: [],
};
