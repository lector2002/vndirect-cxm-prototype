import type { DashSet } from "../../data/schema/index.ts";

/* Chip chọn set trong cùng phần (voc/cxm) + nút "Quản lý set". Component THUẦN: không đọc store,
   chỉ nhận danh sách set của phần hiện tại + id đang chọn + boards (để biết set nào đã tùy chỉnh).
   Port 1-1 dãy chip (prototype dòng 2313-2317). */
export type SetChipsProps = {
  sets: DashSet[];
  currentId: string;
  boards: Record<string, string[][]>;
  onSelect: (id: string) => void;
  onManage: () => void;
};

const chip = "text-[13.5px] px-2.5 py-1.5 rounded border transition-colors";
const chipOff = "border-line text-ink-2 hover:bg-surface-2";
const chipOn = "bg-primary text-white border-primary";

export function SetChips({ sets, currentId, boards, onSelect, onManage }: SetChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-[7px]" data-tour="setchips">
      {sets.map((x) => (
        <button
          key={x.id}
          type="button"
          className={`${chip} ${x.id === currentId ? chipOn : chipOff}`}
          onClick={() => onSelect(x.id)}
        >
          {x.name}
          {boards[x.id] ? (
            <b className="ml-1 font-mono" title="đã tùy chỉnh">
              •
            </b>
          ) : null}
        </button>
      ))}
      {/* luật 11/08: bỏ hướng dẫn "Tạo, sửa và ghép chart vào set — trong Quantify" */}
      <button type="button" className={`${chip} ${chipOff}`} onClick={onManage}>
        ✎ Quản lý set
      </button>
    </div>
  );
}
