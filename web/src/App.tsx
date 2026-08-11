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
import { NAV_GROUPS, NAV_ITEMS } from './nav.tsx'

/* Route (segment đầu URL) hiện có dữ liệu/chart thật trong src/ hiện nay — TimeframeBar chỉ mount
   trên các route này. 'topics' vào set này ngày 06/08 khi TopicsPage thật được dựng: màn đó vẽ
   biểu đồ đường trên chuỗi kỳ thật và CỐ Ý không dựng cụm 3m/6m/1y riêng, mà đọc chính thanh
   timeframe chung này (docblock TopicsPage, mục 2) — hai chỗ điều khiển cùng một thứ sẽ lệch nhau.
   Các route còn lại vẫn là Placeholder nên chưa vào: thanh timeframe đứng trên một màn không chart
   nào là vi phạm quy tắc "ẩn trên Placeholder". */
const TIMEFRAME_ROUTES = new Set(['cxm', 'voc', 'quantify', 'work', 'topics'])

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

function Shell() {
  /* Tour là state của SHELL, không vào store: store cố ý không giữ UI-selection (docblock store.ts
     dòng 10-11) và "đang xem chặng nào" đúng là loại đó. Prototype để ở ST.tour toàn cục vì nó
     không có chỗ nào khác để cất. */
  const [tourOpen, setTourOpen] = useState(false)
  const tour = useCxmStore((s) => s.tour)

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-[246px] flex-none bg-surface border-r border-line flex flex-col">
        <div className="flex items-center gap-3 p-4 border-b border-line">
          <div className="w-9 h-9 rounded-[10px] bg-primary text-white grid place-items-center font-extrabold">
            V
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">VNDIRECT CXM</div>
            <div className="t-lbl mt-0.5">Control Tower</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map((grp) => (
            <div key={grp.g}>
              <div className="t-lbl px-[18px] pt-3.5 pb-1.5">{grp.g}</div>
              {grp.items.map((n) => (
                <NavLink
                  key={n.r}
                  to={`/${n.r}`}
                  className={({ isActive }) =>
                    `block mx-2 my-0.5 px-2.5 py-1.5 rounded-lg text-[13.5px] ${
                      isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`
                  }
                >
                  {n.l}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        {/* Nút mở bản giới thiệu — cùng chỗ prototype đặt (cuối sidebar, dòng 450). */}
        <div className="p-2 border-t border-line">
          <button
            type="button"
            data-testid="tour-start"
            onClick={() => setTourOpen(true)}
            className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-2 hover:border-primary-line hover:bg-primary-soft hover:text-ink"
          >
            ▶ Chạy bản giới thiệu
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <DemoBannerContainer />
        <ValidateBannerContainer />
        <FilterToolbarContainer />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/cxm" replace />} />
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
