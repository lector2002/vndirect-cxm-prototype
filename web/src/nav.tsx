/* Danh sách điều hướng + tiêu đề đầu màn — MỘT nguồn cho cả hai.

   Quyết định owner 06/08: đầu mỗi màn chỉ còn ĐÚNG tên tab, mọi câu dẫn khác bỏ hết. Cái bẫy của
   quyết định đó là hai chỗ cùng in một cái tên: mục sáng trong sidebar và dòng tiêu đề đầu màn. Gõ
   tay ở màn thì sớm muộn hai chỗ lệch nhau, và người dùng bấm "Bảng xử lý" mà mở ra màn tự xưng
   tên khác. Nên nhãn chỉ có một chỗ khai — `NAV_GROUPS` dưới đây (trước nằm private trong
   `App.tsx`) — sidebar và `PageTitle` cùng đọc từ đó.

   KHÔNG dùng `seedNav` trong `data/fixtures/seed.ts`: đó là nav nằm trong DỮ LIỆU, còn sidebar đang
   chạy bằng mảng hardcode này. Trỏ `PageTitle` sang seed là in ra một cái tên mà sidebar không
   dùng — đúng cái lệch đang muốn tránh. Khi nào nav về hẳn một nguồn thì sửa một chỗ này. */

/** IA 13 view / 4 nhóm (giữ từ prototype). Tour đã dựng — xem features/tour/.
 *  18/08 (owner): nhãn nav + tên nhóm sang TIẾNG ANH — tiêu đề màn tự đổi theo vì header đọc
 *  navLabel() (luật 06/08). Route `r` và khoá ICON_PATHS GIỮ NGUYÊN — đổi là navLabel/navIcon ném. */
export const NAV_GROUPS: { g: string; items: { r: string; l: string }[] }[] = [
  {
    g: 'CXM · Experience Management',
    items: [
      { r: 'cxm', l: 'CXM Overview' },
      { r: 'atlas', l: 'Journey Map' },
      { r: 'work', l: 'Workboard' },
    ],
  },
  {
    g: 'Voice of Customer',
    items: [
      { r: 'voc', l: 'VoC Overview' },
      { r: 'sources', l: 'Data Sources' },
      { r: 'topics', l: 'Topics & Trends' },
      { r: 'vocjourney', l: 'VoC by Journey' },
    ],
  },
  {
    g: 'Tools',
    items: [
      { r: 'quantify', l: 'Quantify' },
      { r: 'assistant', l: 'Assistant' },
    ],
  },
  {
    g: 'Administration',
    items: [
      { r: 'rules', l: 'Metrics & Thresholds' },
      /* 25/08 (owner): 'Agents & Alerts' GỘP vào màn Assistant — phát hiện agent trả lời qua câu
         hỏi mẫu ở đó. Mục nav bỏ hẳn; #/agents redirect về #/assistant (App.tsx) nên link cũ
         không chết. IA còn 12 view / 4 nhóm. */
      { r: 'signals', l: 'Signals' },
      { r: 'settings', l: 'Settings' },
    ],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((grp) => grp.items)

/** Ba màn thuộc MVP nhỏ — owner chốt 17/08. Mười mục còn lại vẫn NẰM trong sidebar nhưng làm mờ và
 *  không bấm được.
 *
 *  Vì sao mờ chứ không gỡ khỏi `NAV_GROUPS`: gỡ đi thì `navLabel`/`navIcon` NÉM cho mọi route đó
 *  (chúng tra ngược từ `NAV_GROUPS`), tức mọi màn kia vỡ ngay khi tới được bằng hash — mà đây là
 *  trạng thái TẠM. Giữ mục lại còn nói đúng sự thật: app có 13 màn, 10 màn đang ngoài phạm vi, chứ
 *  không phải app chỉ có 3 màn.
 *
 *  Chỉ chặn đường BẤM, không chặn route (owner: *"user ko bấm vào được thôi"*). Gõ thẳng hash vẫn
 *  mở được — cố ý, để còn đường vào lúc cần đối chiếu.
 *
 *  BẬT LẠI: thêm route vào Set này, không sửa chỗ nào khác.
 *  25/08 (owner duyệt màn Assistant gộp): thêm 'assistant' — màn đã dựng thật, hết placeholder. */
export const MVP_ROUTES: ReadonlySet<string> = new Set(['signals', 'rules', 'settings', 'assistant'])

/** Màn đầu tiên khi vào app. Phải là màn TRONG MVP — mặc định cũ trỏ `cxm`, nay là một màn mờ, nên
 *  để nguyên là app tự mở vào đúng thứ sidebar vừa nói là ngoài phạm vi. */
export const HOME_ROUTE = 'signals'

/** Bản giới thiệu có dẫn — TẮT cùng lúc với mười màn kia (owner 17/08). `seedTour` dẫn qua 7 chặng
 *  thuộc `atlas · cxm · sources · topics · voc · vocjourney · work`, toàn màn đang mờ; để nút sáng
 *  là mở đúng một đường vòng vào những màn vừa tắt.
 *
 *  Là CỜ chứ không xoá nút: tính năng còn nguyên, `TourOverlay.test.tsx` bật cờ này lên để vẫn chứng
 *  được mỗi chặng có mốc `data-tour` thật trên màn của nó — mất bộ test đó là mất cái duy nhất canh
 *  tour khỏi mục vào hư. Bật lại: đổi thành `true`. */
export const TOUR_ENABLED = false

/* ===== Icon điều hướng (owner chốt 12/08 tối) =====
   Sinh ra vì sidebar thu gọn được: ở dải hẹp không còn chỗ cho nhãn chữ, mà một dải ô trống thì
   không bấm được vào đâu cả. Icon hiện Ở CẢ HAI trạng thái — mở rộng cũng có — vì nếu chỉ hiện lúc
   thu gọn thì người dùng gặp một bộ ký hiệu chưa từng thấy đúng vào lúc không còn chữ để đối chiếu.

   Khai Ở ĐÂY, cạnh chính danh sách nav, chứ không thành file riêng: thêm một mục nav mà quên icon
   là mục đó biến thành ô trống khi thu gọn, và `navIcon()` bên dưới NÉM đúng như `navLabel()` để
   lỗi đó nổ ngay ở test chứ không lặng lẽ hiện ra một dải trống.

   Hình vẽ theo một quy ước: khung 16×16, chỉ nét (`stroke="currentColor"`, không tô đặc), nét 1,5px,
   đầu nét bo tròn. `currentColor` là điều kiện bắt buộc — mục đang mở có nền cam chữ trắng, icon
   phải trắng theo mà không cần khai màu lần hai. */
const ICON_PATHS: Record<string, string[]> = {
  // Tổng quan CXM — bốn ô bảng điều khiển
  cxm: ["M2.5 2.5h4.2v4.2H2.5zM9.3 2.5h4.2v4.2H9.3zM2.5 9.3h4.2v4.2H2.5zM9.3 9.3h4.2v4.2H9.3z"],
  // Bản đồ hành trình — một tuyến đường có điểm đầu và điểm cuối
  atlas: [
    "M3 12.2h2.6l2.2-8h2.6l1.6 4.4h1.4",
    "M3 11a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z",
    "M13.4 7.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z",
  ],
  // Bảng xử lý — danh sách việc đã tích
  work: ["M2 4.4 3.2 5.6 5.4 3.4", "M2 10.4l1.2 1.2 2.2-2.2", "M7.6 4.6h6.4", "M7.6 10.6h4.6"],
  // Tổng quan VoC — bong bóng lời khách
  voc: ["M2.6 7.4c0-2.4 2.4-4.4 5.4-4.4s5.4 2 5.4 4.4-2.4 4.4-5.4 4.4c-.8 0-1.5-.1-2.2-.4L3 13l.8-2.3C3 9.9 2.6 8.7 2.6 7.4z"],
  // Nguồn dữ liệu — kho dữ liệu
  sources: ["M8 2.2c3 0 5.4.9 5.4 2s-2.4 2-5.4 2-5.4-.9-5.4-2 2.4-2 5.4-2z", "M2.6 4.2v7.6c0 1.1 2.4 2 5.4 2s5.4-.9 5.4-2V4.2", "M2.6 8c0 1.1 2.4 2 5.4 2s5.4-.9 5.4-2"],
  // Topic & xu hướng — đường xu hướng đi lên
  topics: ["M2.2 11.6 5.8 8l2.6 2.6 5.4-5.4", "M10.6 5.2h3.2v3.2"],
  // VoC theo hành trình — lời khách gắn vào tuyến
  vocjourney: ["M8.8 2.2h4.4a1 1 0 0 1 1 1v2.4a1 1 0 0 1-1 1h-1.6L9.4 8.6V6.6h-.6a1 1 0 0 1-1-1V3.2a1 1 0 0 1 1-1z", "M2.2 12.4h3l2.2-3.4h3.2l1.6-2"],
  // Quantify — cột số liệu
  quantify: ["M2.4 13.4h11.2", "M4.4 13.4V8.6", "M8 13.4V3.4", "M11.6 13.4V6.6"],
  // Trợ lý — tia sáng
  assistant: ["M8 2.2 9.4 6 13.2 7.4 9.4 8.8 8 12.6 6.6 8.8 2.8 7.4 6.6 6z"],
  // Chỉ số & ngưỡng — cần gạt đặt mức
  rules: [
    "M2.2 4.6h3.4",
    "M8.6 4.6h5.2",
    "M2.2 11.4h5.2",
    "M10.6 11.4h3.2",
    "M7.1 3.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
    "M9.1 9.9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z",
  ],
  // Điểm đo — tâm ngắm
  signals: ["M8 2.6a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8z", "M8 6.2a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6z"],
  // Cài đặt — bánh răng
  settings: ["M8 5.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z", "M8 1.6v2M8 12.4v2M1.6 8h2M12.4 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4"],
}

/** Icon của một route. NÉM khi thiếu — cùng lý do `navLabel` ném: một mục nav không có icon sẽ hiện
 *  ra thành ô trống bấm được ở dải thu gọn, và im lặng thì không ai thấy cho tới lúc dùng thật. */
export function navIcon(route: string) {
  const paths = ICON_PATHS[route]
  if (!paths) throw new Error(`navIcon: route "${route}" chưa có icon trong ICON_PATHS`)
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

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
    /* 18/08 (redesign MVP, nước đi S2): t-hero 36px → t-block 22px. Tên màn là MỘT từ định vị, không
       phải nội dung — 36px cộng margin chiếm ~70px đầu mọi màn trong khi sidebar ngay bên trái đã
       tô đậm đúng cái tên đó. Nội dung màn phải vào tầm mắt sớm hơn (F-pattern). Vẫn là <h1>, vẫn
       navLabel() — luật đầu màn 06/08 không đổi. */
    <h1 className="t-block mb-4" data-testid="page-title">
      {navLabel(route)}
    </h1>
  )
}
