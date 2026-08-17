import { useMemo, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { OverviewPage } from './features/overview/OverviewPage.tsx'
import { GlobalToolbar } from './features/overview/GlobalToolbar.tsx'
import { QuantifyPage } from './features/quantify/QuantifyPage.tsx'
import { ValidateBanner } from './features/quantify/ValidateBanner.tsx'
import { WorkPage } from './features/work/WorkPage.tsx'
import { AtlasPage } from './features/atlas/AtlasPage.tsx'
import { VocJourneyPage } from './features/vocjourney/VocJourneyPage.tsx'
import { SourcesPage } from './features/sources/SourcesPage.tsx'
import { TopicsPage } from './features/topics/TopicsPage.tsx'
import { ThemeDetailPage } from './features/topic/ThemeDetailPage.tsx'
import { RulesPage } from './features/rules/RulesPage.tsx'
import { SignalsPage } from './features/signals/SignalsPage.tsx'
import { SettingsPage } from './features/settings/SettingsPage.tsx'
import { TourOverlay } from './features/tour/TourOverlay.tsx'
import { DemoBanner } from './features/settings/DemoBanner.tsx'
import { useCxmStore } from './store/store.ts'
import { HOME_ROUTE, MVP_ROUTES, NAV_GROUPS, NAV_ITEMS, TOUR_ENABLED, navIcon } from './nav.tsx'

/* Route (segment đầu URL) hiện có dữ liệu/chart thật trong src/ hiện nay — TimeframeBar chỉ mount
   trên các route này. 'topics' vào set này ngày 06/08 khi TopicsPage thật được dựng: màn đó vẽ
   biểu đồ đường trên chuỗi kỳ thật và CỐ Ý không dựng cụm 3m/6m/1y riêng, mà đọc chính thanh
   timeframe chung này (docblock TopicsPage, mục 2) — hai chỗ điều khiển cùng một thứ sẽ lệch nhau.
   Các route còn lại vẫn là Placeholder nên chưa vào: thanh timeframe đứng trên một màn không chart
   nào là vi phạm quy tắc "ẩn trên Placeholder". */
/* `signals` vào danh sách 14/08: hồ sơ điểm đo nay có chart theo kỳ (ADR-001 §5) nên màn đó cần
   thanh mốc chung. Dùng THANH CHUNG chứ không dựng cụm mốc riêng — tiền lệ 06/08 của TopicsPage:
   hai chỗ điều khiển cùng một thứ sẽ lệch nhau. */
const TIMEFRAME_ROUTES = new Set(['cxm', 'voc', 'quantify', 'work', 'topics', 'signals'])

/* NAV_GROUPS dời sang `nav.tsx` ngày 06/08: từ khi mỗi màn in tên tab ở đầu trang, cái nhãn đó có
   HAI nơi hiện — mục sáng ở sidebar và tiêu đề màn — nên nó phải có đúng một nơi khai. */
const ALL = NAV_ITEMS

function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-8">
      <h1 className="t-hero">{name}</h1>
      <p className="t-meta mt-3">Màn đang được dựng ở giai đoạn code thật.</p>
    </div>
  )
}

/** Đọc validate() từ store và render banner đỏ toàn cục. validate là action ổn định
    tham chiếu (không đổi giữa các lần render) nhưng TRẢ VỀ mảng mới mỗi lần gọi —
    useMemo khóa theo `data` (đổi reference mỗi khi có mutation/refresh()) để tránh
    gọi lại validate() mỗi render và tránh vòng lặp getSnapshot với Zustand v5. */
function ValidateBannerContainer() {
  const validate = useCxmStore((s) => s.validate)
  const data = useCxmStore((s) => s.data)
  const errors = useMemo(() => validate(), [validate, data])
  return <ValidateBanner errors={errors} />
}

/** Đọc demoMode từ store và render DemoBanner toàn cục. */
function DemoBannerContainer() {
  const demoMode = useCxmStore((s) => s.demoMode)
  return <DemoBanner demoMode={demoMode} />
}

/** Đọc segment đầu của pathname để quyết định hiện/ẩn GlobalToolbar — HashRouter nên
    location.pathname bên trong Router context đã là phần sau '#' (vd '/cxm', '/cxm/xyz'). */
function FilterToolbarContainer() {
  const location = useLocation()
  const seg = location.pathname.split('/')[1]
  if (!TIMEFRAME_ROUTES.has(seg)) return null
  return <GlobalToolbar />
}

/* Mũi tên của nút thu gọn sidebar — chỉ HƯỚNG dải sẽ chạy về khi bấm, nên nó lật theo trạng thái. */
function SidebarChevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 ${collapsed ? '' : 'rotate-180'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 3.5 5 4.5-5 4.5" />
    </svg>
  )
}

/* Dấu "?" trong vòng tròn cho nút bản giới thiệu (owner chốt 13/08) — khuôn icon "trợ giúp" quen mắt,
   thay ký tự ▶ vốn hứa một video sẽ chạy. Viewbox 24 chứ không 16 như `navIcon`: dấu hỏi cần nhiều
   điểm neo hơn một hình khối, ở lưới 16 nét cong bị bẹt. */
function HelpCircle() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.2 9.2a2.9 2.9 0 0 1 5.64.97c0 1.93-2.9 2.9-2.9 2.9" />
      <path d="M12 17.1h.01" />
    </svg>
  )
}

function Shell() {
  /* Tour là state của SHELL, không vào store: store cố ý không giữ UI-selection (docblock store.ts
     dòng 10-11) và "đang xem chặng nào" đúng là loại đó. Prototype để ở ST.tour toàn cục vì nó
     không có chỗ nào khác để cất. */
  const [tourOpen, setTourOpen] = useState(false)
  /* Sidebar thu gọn (owner chốt 12/08 tối). Cùng loại state với `tourOpen`: một trạng thái NHÌN của
     shell, không phải dữ liệu — không vào store, không nhớ qua lần mở app sau (chưa ai yêu cầu).
     Thu gọn còn lại dải icon 56px chứ không ẩn hẳn: owner chọn giữ đường chuyển màn, ẩn hẳn thì
     muốn sang màn khác phải bung sidebar ra trước. */
  const [navCollapsed, setNavCollapsed] = useState(false)
  const tour = useCxmStore((s) => s.tour)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        data-testid="sidebar"
        data-collapsed={navCollapsed ? 'true' : 'false'}
        className={`flex-none bg-surface border-r border-line flex flex-col ${
          navCollapsed ? 'w-[56px]' : 'w-[246px]'
        }`}
      >
        <div
          className={`flex items-center gap-3 border-b border-line ${
            navCollapsed ? 'justify-center px-2 py-3' : 'p-4'
          }`}
        >
          <div className="w-9 h-9 flex-none rounded-[10px] bg-primary text-white grid place-items-center font-extrabold">
            V
          </div>
          {navCollapsed ? null : (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight">VNDIRECT CXM</div>
              <div className="t-lbl mt-0.5">Control Tower</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.g}>
              {/* Thu gọn thì tên nhóm nhường chỗ cho một vạch: bốn nhãn chữ hoa dài 20+ ký tự không
                  nhét vào dải 56px, mà bỏ hẳn thì bốn nhóm dính liền thành một danh sách 13 icon. */}
              {navCollapsed ? (
                <div className="mx-3 my-2 border-t border-line-soft" />
              ) : (
                <div className="t-lbl px-[18px] pt-3.5 pb-1.5">{grp.g}</div>
              )}
              {grp.items.map((n) =>
                !MVP_ROUTES.has(n.r) ? (
                  /* Ngoài MVP nhỏ (owner 17/08): mục ở lại cho thấy app còn những màn này, nhưng làm
                     mờ và KHÔNG dựng `NavLink` — không có `href` thì bàn phím cũng không tab tới
                     được, tức "không bấm được" đúng cả bằng chuột lẫn bàn phím. `aria-disabled` để
                     trình đọc màn hình nói ra trạng thái thay vì đọc một dòng chữ im lặng. */
                  <div
                    key={n.r}
                    aria-disabled="true"
                    data-testid={`nav-off-${n.r}`}
                    title={navCollapsed ? `${n.l} — ngoài phạm vi MVP` : undefined}
                    className={`my-0.5 flex items-center gap-2.5 rounded-lg text-[13.5px] text-ink-3 opacity-40 ${
                      navCollapsed ? 'mx-2 justify-center px-0 py-2' : 'mx-2 px-2.5 py-1.5'
                    }`}
                  >
                    {navIcon(n.r)}
                    {navCollapsed ? null : <span className="truncate">{n.l}</span>}
                  </div>
                ) : (
                <NavLink
                  key={n.r}
                  to={`/${n.r}`}
                  /* Thu gọn thì nhãn chữ rời màn, nên `title` là chỗ duy nhất còn nói được mục này
                     là gì — đây không phải câu hướng dẫn (luật giao diện 12/08) mà là chính cái
                     nhãn đang bị dải hẹp cắt mất. */
                  title={navCollapsed ? n.l : undefined}
                  className={({ isActive }) =>
                    `my-0.5 flex items-center gap-2.5 rounded-lg text-[13.5px] ${
                      navCollapsed ? 'mx-2 justify-center px-0 py-2' : 'mx-2 px-2.5 py-1.5'
                    } ${
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`
                  }
                >
                  {navIcon(n.r)}
                  {navCollapsed ? null : <span className="truncate">{n.l}</span>}
                </NavLink>
                ),
              )}
            </div>
          ))}
        </nav>
        {/* Chân sidebar: bản giới thiệu + nút thu gọn. Nút thu gọn xuống đây 13/08 theo owner — nó là
            việc của cả dải chứ không của khối logo, và ở chân thì tay không phải rời chuột khỏi vùng
            nav để bấm. Thu gọn thì hai nút xếp dọc, vì 56px không đủ cho hai ô cạnh nhau. */}
        <div
          className={`flex gap-2 border-t border-line p-2 ${
            navCollapsed ? 'flex-col items-center' : 'items-center'
          }`}
        >
          {/* Tắt cùng mười màn mờ (owner 17/08): tour dẫn qua 7 chặng nằm trên những màn đó, nên nút
              sáng là một đường vòng vào đúng chỗ vừa tắt. `disabled` thật chứ không chỉ mờ — nút
              disabled không nhận chuột và cũng rời khỏi thứ tự tab. */}
          <button
            type="button"
            data-testid="tour-start"
            disabled={!TOUR_ENABLED}
            onClick={() => setTourOpen(true)}
            title={
              TOUR_ENABLED
                ? navCollapsed
                  ? 'Chạy bản giới thiệu'
                  : undefined
                : 'Bản giới thiệu — ngoài phạm vi MVP'
            }
            className={`flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface py-1.5 text-[12.5px] font-semibold ${
              TOUR_ENABLED
                ? 'text-ink-2 hover:border-primary-line hover:bg-primary-soft hover:text-ink'
                : 'text-ink-3 opacity-40'
            } ${navCollapsed ? 'h-7 w-7 flex-none px-0' : 'min-w-0 flex-1 px-2.5'}`}
          >
            <HelpCircle />
            {navCollapsed ? null : <span className="truncate">Chạy bản giới thiệu</span>}
          </button>
          <button
            type="button"
            data-testid="sidebar-toggle"
            aria-expanded={!navCollapsed}
            aria-label={navCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            title={navCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            onClick={() => setNavCollapsed((v) => !v)}
            className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-line text-ink-3 hover:border-primary-line hover:bg-primary-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
          >
            <SidebarChevron collapsed={navCollapsed} />
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <DemoBannerContainer />
        <ValidateBannerContainer />
        <FilterToolbarContainer />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to={`/${HOME_ROUTE}`} replace />} />
            {ALL.map((n) => (
              <Route
                key={n.r}
                path={`/${n.r}`}
                element={
                  n.r === 'quantify' ? (
                    <QuantifyPage />
                  ) : n.r === 'cxm' ? (
                    <OverviewPage sec="cxm" />
                  ) : n.r === 'voc' ? (
                    <OverviewPage sec="voc" />
                  ) : n.r === 'work' ? (
                    <WorkPage />
                  ) : n.r === 'atlas' ? (
                    <AtlasPage />
                  ) : n.r === 'vocjourney' ? (
                    <VocJourneyPage />
                  ) : n.r === 'sources' ? (
                    <SourcesPage />
                  ) : n.r === 'topics' ? (
                    <TopicsPage />
                  ) : n.r === 'rules' ? (
                    <RulesPage />
                  ) : n.r === 'signals' ? (
                    <SignalsPage />
                  ) : n.r === 'settings' ? (
                    <SettingsPage />
                  ) : (
                    <Placeholder name={n.l} />
                  )
                }
              />
            ))}
            <Route path="/cxm/:setId" element={<OverviewPage sec="cxm" />} />
            <Route path="/voc/:setId" element={<OverviewPage sec="voc" />} />
            {/* Stub — drill-down từ block Overview trỏ tới đây (F8); thân màn thật là Phase 3/5. */}
            <Route path="/issue/:id" element={<Placeholder name="Điểm gãy" />} />
            <Route path="/topic/:id" element={<ThemeDetailPage />} />
            <Route path="*" element={<Placeholder name="Không tìm thấy màn" />} />
          </Routes>
        </main>
      </div>
      {tourOpen ? <TourOverlay stops={tour} onClose={() => setTourOpen(false)} /> : null}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  )
}
