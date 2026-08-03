import { Note, btnSecondary, btnSizeSm } from "../../design-system/index.ts";

/* Banner cảnh báo set đang có overlay tùy chỉnh (không persist). Component THUẦN — port 1-1
   (prototype dòng 2320-2321). Chỉ được render khi OverviewPage xác định boards[setId] tồn tại. */
export type CustomBannerProps = {
  onReset: () => void;
};

export function CustomBanner({ onReset }: CustomBannerProps) {
  return (
    <div className="my-2.5 mb-4">
      <Note tone="warn">
        Set này đang có thay đổi (sửa ở <b>Quản lý set</b> trong Quantify). Không persist — refresh
        browser là về mặc định.
        <button
          type="button"
          className={`ml-2 ${btnSecondary} ${btnSizeSm}`}
          onClick={onReset}
        >
          Trả set về mặc định
        </button>
      </Note>
    </div>
  );
}
