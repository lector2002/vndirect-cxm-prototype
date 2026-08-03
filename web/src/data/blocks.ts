/* Khối đặc biệt của set dashboard — mỗi khối tự khai phần (sec) + route drill-down (go)
   + tên hiển thị (n). Port 1-1 từ prototype BLOCKS (~dòng 2108); bỏ cờ `wide` vì đó là
   mối lo layout của Overview (Phase 2), composer P1.3 không cần.

   Single source of truth: `validate.ts` đọc {sec,go} để kiểm block trỏ def thật đúng sec
   (nhóm 10), composer đọc {n,sec} để list & đặt tên khối thêm-được. Đừng nhân bản registry
   này ở nơi khác — thêm/bớt @block sửa DUY NHẤT ở đây. */
export type BlockDef = { n: string; sec: "voc" | "cxm"; go: string };

export const BLOCKS: Record<string, BlockDef> = {
  "@srcmatrix": { n: "Độ toàn vẹn nguồn", sec: "voc", go: "sources" },
  "@intent": { n: "Bốn khối theo intent", sec: "voc", go: "topics" },
  "@themestack": { n: "Theme theo thành phần", sec: "voc", go: "topics" },
  "@anomlanes": { n: "Ba làn bất thường", sec: "voc", go: "agents" },
  /* Tên KỲ-AGNOSTIC (S2.7): trước ghi cứng "6 kỳ" trong khi cột trong bảng đổi số kỳ theo
     bộ lọc runtime (3/6/12 tháng) và seed giờ có 12 điểm/chuỗi — tên tĩnh nói sai số kỳ ngay khi
     người dùng đổi bộ lọc khác baseline. Kỳ là runtime nên tên registry không được đóng cứng số. */
  "@topictrend": { n: "Topic & xu hướng", sec: "voc", go: "vocjourney" },
  "@toppri": { n: "Quantified Top — bốn cách xếp", sec: "cxm", go: "work" },
  "@journeystate": { n: "Trạng thái hành trình", sec: "cxm", go: "atlas" },
  "@coverage": { n: "Độ phủ đo lường", sec: "cxm", go: "atlas" },
  "@lanes": { n: "Bốn làn công việc", sec: "cxm", go: "work" },
  "@outcomes": { n: "Kết quả đo được", sec: "cxm", go: "work" },
};
