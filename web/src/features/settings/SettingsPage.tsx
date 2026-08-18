import { PageTitle } from "../../nav.tsx";
import { useCxmStore } from "../../store/store.ts";

export type SettingsPageProps = {
  /** Store hook injectable — mặc định dùng store thật của app (singleton). Test dùng
      createCxmStore(new MockRepository()) để cô lập khỏi mutation của test khác (xem
      OverviewPage.tsx cho cùng pattern). */
  useStore?: typeof useCxmStore;
};

/* Màn #/settings — MỘT switch duy nhất: Demo Mode. Bật (mặc định) = dữ liệu demo như hiện tại;
   Tắt = data rỗng toàn app (mô phỏng "đã kết nối DB thật nhưng chưa có dữ liệu"), kèm
   DemoBanner toàn cục (App.tsx). Không có setting nào khác — giữ tối giản đúng hợp đồng. */
export function SettingsPage({ useStore = useCxmStore }: SettingsPageProps) {
  const demoMode = useStore((s) => s.demoMode);
  const setDemoMode = useStore((s) => s.setDemoMode);

  return (
    <div className="p-8">
      <PageTitle route="settings" />

      <div className="mt-6 max-w-xl border border-line rounded-xl bg-surface p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-ink">Demo Mode</div>
          {/* luật 11/08: bỏ luận giải, chỉ giữ trạng thái dữ liệu */}
          <p className="t-meta mt-1">Dữ liệu thật từ DB chưa kết nối — tắt Demo Mode thì app trống.</p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <span className="t-meta">{demoMode ? "ON" : "OFF"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => setDemoMode(!demoMode)}
            className={`w-11 h-6 rounded-full relative transition-colors ${
              demoMode ? "bg-primary" : "bg-surface-2 border border-line"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                demoMode ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
