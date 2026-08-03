import { useState } from "react";
import { BLOCKS } from "../../data/blocks.ts";
import type { CxmData, DashSet } from "../../data/schema/index.ts";
import { btnSecondary, btnSizeSm, btnSizeLg } from "../../design-system/index.ts";

/** Hai set CỐ ĐỊNH khóa cấu trúc — đúng 1 set mặc định mỗi phần. Port 1-1 SET_LOCKED (prototype
    dòng 2600). */
const LOCKED_SET_IDS = new Set(["b-cxm-exec", "b-voc-all"]);

/** Port 1-1 SEC.label (prototype dòng 2095-2103). */
const SEC_LABEL: Record<"voc" | "cxm", string> = {
  voc: "Voice of Customer",
  cxm: "CXM · Quản trị trải nghiệm",
};

/** Danh sách block hiện tại của một câu hỏi — đọc overlay (boards) nếu có, không thì qs gốc.
    Port 1-1 curB() (prototype dòng 2286). */
function curB(set: DashSet, qi: number, boards: Record<string, string[][]>): string[] {
  return boards[set.id]?.[qi] ?? set.qs[qi].b;
}

/** Tên hiển thị của một khối — @block đọc từ registry BLOCKS, chart thường đọc tên trong data.qt.
    Port 1-1 blkName() (prototype dòng 2287). */
function blkName(b: string, data: CxmData): string {
  if (b.startsWith("@")) return BLOCKS[b]?.n ?? b;
  return data.qt.find((q) => q.id === b)?.name ?? b;
}

export type QuantifySetsProps = {
  data: CxmData;
  /** Overlay set dashboard đã tùy chỉnh — setId -> mảng-theo-câu-hỏi các block (lazy). */
  boards: Record<string, string[][]>;
  createSet: (sec: "voc" | "cxm") => DashSet;
  duplicateSet: (id: string) => DashSet;
  /** CHẶN nếu là set khóa — nhưng set khóa không có nút Xóa nên callback chỉ được gọi cho set sửa được. */
  deleteSet: (id: string) => void;
  renameSet: (id: string, name: string) => void;
  setBoardBlocks: (setId: string, qIndex: number, blocks: string[]) => void;
  resetBoard: (setId: string) => void;
  onBack: () => void;
};

/* Màn Quản lý set (composer) — ghép chart từ thư viện vào set cho Tổng quan. Port tinh thần
   quantifySets() (prototype dòng 2602-2662): 2 nhóm voc/cxm, mỗi set là một card với hàng câu hỏi +
   danh sách block thêm/bớt/đổi-thứ-tự. Hai set cố định khóa cấu trúc (nhân bản để sửa). Thuần
   presentational: mọi mutation qua props, không đọc store. */
export function QuantifySets({
  data,
  boards,
  createSet,
  duplicateSet,
  deleteSet,
  renameSet,
  setBoardBlocks,
  resetBoard,
  onBack,
}: QuantifySetsProps) {
  function handleBlkAdd(set: DashSet, qi: number, b: string) {
    const bs = curB(set, qi, boards);
    if (bs.includes(b)) return;
    setBoardBlocks(set.id, qi, [...bs, b]);
  }
  function handleBlkDel(set: DashSet, qi: number, b: string) {
    const bs = curB(set, qi, boards);
    setBoardBlocks(
      set.id,
      qi,
      bs.filter((x) => x !== b),
    );
  }
  function handleBlkMove(set: DashSet, qi: number, b: string, dir: -1 | 1) {
    const bs = curB(set, qi, boards).slice();
    const i = bs.indexOf(b);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= bs.length) return;
    const tmp = bs[i]!;
    bs[i] = bs[j]!;
    bs[j] = tmp;
    setBoardBlocks(set.id, qi, bs);
  }

  return (
    <div className="p-8" data-testid="quantify-sets">
      <button
        type="button"
        className={`mb-4 ${btnSecondary} ${btnSizeLg}`}
        onClick={onBack}
      >
        ← Về thư viện
      </button>
      <h1 className="t-hero mb-2">Quản lý set</h1>
      <p className="t-meta mb-5 max-w-[92ch]">
        Ghép chart từ thư viện vào set để hiện trên Tổng quan. Thêm/bớt/đổi thứ tự khối, tạo hoặc xóa
        set. Hai set <b>cố định</b> khóa cấu trúc — nhân bản để tạo biến thể sửa được.
      </p>

      {(["voc", "cxm"] as const).map((sec) => (
        <section key={sec} className="mb-6" data-testid={`qsets-group-${sec}`}>
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <h2 className="text-base font-semibold">{SEC_LABEL[sec]}</h2>
            <button
              type="button"
              data-testid={`qsets-new-${sec}`}
              className={`${btnSecondary} ${btnSizeLg}`}
              onClick={() => createSet(sec)}
            >
              ＋ Set mới
            </button>
          </div>
          {data.dash
            .filter((d) => d.sec === sec)
            .map((set) => (
              <SetCard
                key={set.id}
                set={set}
                data={data}
                boards={boards}
                onDuplicate={() => duplicateSet(set.id)}
                onDelete={() => deleteSet(set.id)}
                onRename={(name) => renameSet(set.id, name)}
                onResetBoard={() => resetBoard(set.id)}
                onBlkAdd={(qi, b) => handleBlkAdd(set, qi, b)}
                onBlkDel={(qi, b) => handleBlkDel(set, qi, b)}
                onBlkMove={(qi, b, dir) => handleBlkMove(set, qi, b, dir)}
              />
            ))}
        </section>
      ))}
    </div>
  );
}

type SetCardProps = {
  set: DashSet;
  data: CxmData;
  boards: Record<string, string[][]>;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onResetBoard: () => void;
  onBlkAdd: (qi: number, b: string) => void;
  onBlkDel: (qi: number, b: string) => void;
  onBlkMove: (qi: number, b: string, dir: -1 | 1) => void;
};

const actionBtn = `${btnSecondary} ${btnSizeSm}`;

/* Một set = header (tên + đổi tên/nhân bản/xóa) + hàng câu hỏi (mỗi câu hỏi là danh sách khối +
   chọn thêm khối). State đổi-tên/xác-nhận-xóa sống CỤC BỘ ở đây (mirror QuantifyLibraryCard),
   KHÔNG lift lên QuantifySets/QuantifyPage — chỉ 1 card đổi tên/xóa tại một thời điểm là đủ. */
function SetCard({
  set,
  data,
  boards,
  onDuplicate,
  onDelete,
  onRename,
  onResetBoard,
  onBlkAdd,
  onBlkDel,
  onBlkMove,
}: SetCardProps) {
  const locked = LOCKED_SET_IDS.has(set.id);
  const hasOverlay = !!boards[set.id];
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(set.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleRenameOpen() {
    setNameInput(set.name);
    setRenaming(true);
  }
  function handleRenameSave() {
    onRename(nameInput);
    setRenaming(false);
  }

  return (
    <div data-testid={`qset-${set.id}`} className="bg-surface border border-line rounded shadow-card mb-3.5">
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3.5 border-b border-line">
        <div className="min-w-[180px] flex-1">
          {renaming ? (
            <input
              type="text"
              data-testid={`qset-rename-input-${set.id}`}
              className="w-full border border-primary rounded px-2 py-1 text-sm font-semibold"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          ) : (
            <b className="text-[15px]">{set.name}</b>
          )}
          <div className="text-[11.5px] text-ink-3 mt-0.5">
            {set.role} · {locked ? "cố định" : "tùy biến"}
            {hasOverlay ? " · đã sửa" : ""}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap items-center">
          {renaming ? (
            <>
              <button
                type="button"
                data-testid={`qset-rename-save-${set.id}`}
                className="text-xs px-2 py-1 rounded bg-primary text-white"
                onClick={handleRenameSave}
              >
                Lưu tên
              </button>
              <button type="button" className={actionBtn} onClick={() => setRenaming(false)}>
                Hủy
              </button>
            </>
          ) : locked ? (
            <>
              <span className="text-[11px] text-ink-3 border border-line rounded px-1.5 py-0.5">🔒 cố định</span>
              <button type="button" className={actionBtn} onClick={onDuplicate}>
                Nhân bản để sửa
              </button>
            </>
          ) : confirmingDelete ? (
            <span className="flex items-center gap-1.5 text-xs">
              <span className="text-crit">Xóa set này?</span>
              <button
                type="button"
                data-testid={`qset-delete-confirm-${set.id}`}
                className="text-xs px-2 py-1 rounded border border-crit text-crit hover:bg-crit-bg"
                onClick={() => {
                  onDelete();
                  setConfirmingDelete(false);
                }}
              >
                Xác nhận
              </button>
              <button type="button" className={actionBtn} onClick={() => setConfirmingDelete(false)}>
                Hủy
              </button>
            </span>
          ) : (
            <>
              <button type="button" className={actionBtn} onClick={handleRenameOpen}>
                Đổi tên
              </button>
              <button type="button" className={actionBtn} onClick={onDuplicate}>
                Nhân bản
              </button>
              {hasOverlay ? (
                <button type="button" className={actionBtn} onClick={onResetBoard}>
                  Về mặc định
                </button>
              ) : null}
              <button
                type="button"
                data-testid={`qset-delete-${set.id}`}
                className={actionBtn}
                onClick={() => setConfirmingDelete(true)}
              >
                Xóa
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {set.qs.map((qq, qi) => {
          const bs = curB(set, qi, boards);
          // Chỉ liệt kê @block CÙNG PHẦN (sec) với set — load-bearing: bỏ filter này sẽ cho phép
          // ghép block sai sec, validateFixture nhóm 10 sẽ đỏ ngay lần render sau.
          const avail = Object.keys(BLOCKS)
            .filter((b) => BLOCKS[b].sec === set.sec && !bs.includes(b))
            .concat(data.qt.map((q) => q.id).filter((id) => !bs.includes(id)));
          return (
            <div key={qq.q}>
              <div className="text-xs font-medium text-ink-2 mb-1.5">{qq.q}</div>
              {bs.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {bs.map((b, bi) => (
                    <div key={b} className="flex items-center gap-2 border border-line rounded px-2.5 py-1.5 text-sm">
                      <span className="flex-1">
                        {blkName(b, data)}
                        {b.startsWith("@") ? <span className="text-[10.5px] text-ink-3 ml-1.5">khối tổng hợp</span> : null}
                      </span>
                      {locked ? null : (
                        <>
                          <button
                            type="button"
                            className={actionBtn}
                            disabled={bi === 0}
                            onClick={() => onBlkMove(qi, b, -1)}
                            title="Lên"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className={actionBtn}
                            disabled={bi === bs.length - 1}
                            onClick={() => onBlkMove(qi, b, 1)}
                            title="Xuống"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            data-testid={`qblk-del-${set.id}-${qi}-${b}`}
                            className={actionBtn}
                            onClick={() => onBlkDel(qi, b)}
                            title="Bỏ khỏi set"
                          >
                            ×
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-ink-2 py-2.5">Chưa có khối nào.</div>
              )}
              {locked ? null : (
                <select
                  data-testid={`qblk-add-${set.id}-${qi}`}
                  className="mt-2 border border-line rounded px-2 py-1.5 text-xs max-w-[340px] bg-surface"
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) {
                      onBlkAdd(qi, v);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">＋ Thêm khối…</option>
                  {avail.map((b) => (
                    <option key={b} value={b}>
                      {blkName(b, data)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
