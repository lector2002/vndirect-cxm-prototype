/* Danh sách điều hướng + tiêu đề đầu màn — MỘT nguồn cho cả hai.

   Quyết định owner 06/08: đầu mỗi màn chỉ còn ĐÚNG tên tab, mọi câu dẫn khác bỏ hết. Cái bẫy của
   quyết định đó là hai chỗ cùng in một cái tên: mục sáng trong sidebar và dòng tiêu đề đầu màn. Gõ
   tay ở màn thì sớm muộn hai chỗ lệch nhau, và người dùng bấm "Bảng xử lý" mà mở ra màn tự xưng
   tên khác. Nên nhãn chỉ có một chỗ khai — `NAV_GROUPS` dưới đây (trước nằm private trong
   `App.tsx`) — sidebar và `PageTitle` cùng đọc từ đó.

   KHÔNG dùng `seedNav` trong `data/fixtures/seed.ts`: đó là nav nằm trong DỮ LIỆU, còn sidebar đang
   chạy bằng mảng hardcode này. Trỏ `PageTitle` sang seed là in ra một cái tên mà sidebar không
   dùng — đúng cái lệch đang muốn tránh. Khi nào nav về hẳn một nguồn thì sửa một chỗ này. */

/** IA 13 view / 4 nhóm (giữ từ prototype). Tour đã dựng — xem features/tour/. */
export const NAV_GROUPS: { g: string; items: { r: string; l: string }[] }[] = [
  {
    g: 'CXM · Quản trị trải nghiệm',
    items: [
      { r: 'cxm', l: 'Tổng quan CXM' },
      { r: 'atlas', l: 'Bản đồ hành trình' },
      { r: 'work', l: 'Bảng xử lý' },
    ],
  },
  {
    g: 'Voice of Customer',
    items: [
      { r: 'voc', l: 'Tổng quan VoC' },
      { r: 'sources', l: 'Nguồn dữ liệu' },
      { r: 'topics', l: 'Topic & xu hướng' },
      { r: 'vocjourney', l: 'VoC theo hành trình' },
    ],
  },
  {
    g: 'Công cụ',
    items: [
      { r: 'quantify', l: 'Quantify' },
      { r: 'assistant', l: 'Trợ lý' },
    ],
  },
  {
    g: 'Quản trị',
    items: [
      { r: 'rules', l: 'Chỉ số & ngưỡng' },
      { r: 'agents', l: 'Agent & cảnh báo' },
      { r: 'signals', l: 'Điểm đo' },
      { r: 'settings', l: 'Cài đặt' },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((grp) => grp.items)

/** Nhãn của một route. NÉM khi route lạ thay vì trả chuỗi rỗng hay chính route: một màn in được
 *  tiêu đề trong khi sidebar không có mục nào trỏ tới nó là màn lọt vào app không qua điều hướng —
 *  im lặng ở đây thì nó hiện ra với dòng tiêu đề trống. */
export function navLabel(route: string): string {
  const hit = NAV_ITEMS.find((n) => n.r === route)
  if (!hit) throw new Error(`navLabel: route "${route}" không có trong NAV_GROUPS`)
  return hit.l
}

/** Tiêu đề đầu màn. Đặt trong container của CHÍNH màn (mỗi màn tự giữ padding riêng), không dựng ở
 *  shell — màn Topic canh giữa theo bề rộng tối đa còn các màn khác dùng padding đều, nên tiêu đề
 *  dựng ở shell sẽ lệch khỏi thân màn ở đúng màn đó. */
export function PageTitle({ route }: { route: string }) {
  return (
    <h1 className="t-hero mb-4" data-testid="page-title">
      {navLabel(route)}
    </h1>
  )
}
