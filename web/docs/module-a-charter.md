# Module A Charter — Chặng Xác nhận + đóng băng baseline

Owner chốt 02/08/2026. Opus giữ charter; worker chỉ thực thi section được giao.

## Vì sao có module này

`mock-repository.ts` nhánh `!outcome` trong `advanceAction` lấy `base.v` từ `metric.value` — giá trị
ĐỌC SAU khi bản sửa đã release (nhánh chỉ chạy khi `dl === 'released'`), và `verdict` hardcode
`'improved'`. Tức là số "trước" đang là một số "sau", và verify lane **không thể phát hiện ca xấu đi**.

Sửa bằng cách đóng băng số liệu tại đúng lúc ghi nhận vấn đề, rồi bắt `advanceAction` đọc số đông cứng
đó thay vì đọc lại metric hiện tại.

## Quyết định của owner

1. Bỏ chặng **Gán** → chặng **Xác nhận**. Dải 4 chặng: Xác nhận → Duyệt → Sửa → Verify.
   `Action.owner/acc/due` GIỮ NGUYÊN trong schema, chỉ gộp vào form xác nhận thay vì là chặng riêng.
2. Đóng băng baseline đúng lúc bấm **Xác nhận**. Dùng lại shape `OutcomeMeasure {v,u,p,n}`.
   Lưu **số thô**, nhân `fx` lúc render ở cả hai vế — không bao giờ đóng băng số đã nhân.
3. Giữ **cả hai nguồn ticket**: hệ thống tự sinh + người nêu tay. Cả hai dừng ở Chờ xác nhận.
4. (Module B, sau) Màn chi tiết điểm gãy port đủ 5 tab `V.issue`.

## Shape chốt

```ts
// data/schema/cxm.ts
export type ActionCf = 'pending' | 'confirmed';
// thêm vào Action:  cf: ActionCf;

/* Ảnh chụp số liệu tại đúng lúc điểm gãy được XÁC NHẬN. Một issue tối đa MỘT snapshot — đóng băng
   một lần, không ghi đè, vì mốc so sánh mà đổi được thì nó không còn là mốc. */
export type Snapshot = {
  iss: string;        // issue id
  at: string;         // dd/MM/yyyy — lúc đóng băng
  by: string;         // ai xác nhận
  m: OutcomeMeasure;  // chỉ số kết luận tại mốc; m.p là chuỗi KỲ, m.n là cỡ mẫu
  obs: Obs;           // ảnh chụp Obs của bước trong hành trình tại mốc (schema/journey.ts)
};
// thêm vào CxmData:  snap: Snapshot[];
```

`Obs` import từ `./journey.ts`. `Verdict` chỉ có `'improved' | 'inconclusive' | 'worse'` — KHÔNG có
giá trị "không đổi", nên bằng nhau phải map về `'inconclusive'`.

## Luật seed baseline — KHÔNG được bịa số

- Issue **đã có `Outcome`** → `snap.m` = **chính `outcome.base`**. Nhất quán với số đã có, không đẻ số mới.
- Issue **chưa có `Outcome`** → `snap.m.v` = giá trị metric hiện tại, `snap.obs` = dòng `obs` hiện tại của
  `issue.step`. Delta = 0, và **đó là sự thật**: chưa sửa gì thì chưa đổi gì. Không được nống số cho
  "đẹp demo".
- `snap.m.p` = chuỗi kỳ mô tả cửa sổ quan sát cố định 6 tháng; `snap.m.n` = `obs.entered` của bước.

## Bất biến mới (validate.ts) — mỗi luật PHẢI có test làm nó đỏ được

Nhóm 4 (thứ tự trạng thái action) và nhóm 11 (agent/loop/outcome):

1. `snap.iss` phải trỏ issue có thật.
2. Mỗi issue **tối đa 1** snapshot (không trùng `iss`).
3. `snap.obs.stepId` phải trỏ step có thật.
4. **Ràng buộc cặp — luật xương sống của module:**
   `action.cf === 'confirmed'` ⟺ tồn tại snapshot cho `action.iss`.
   `cf === 'pending'` ⟹ KHÔNG có snapshot.
5. `cf === 'pending'` ⟹ `ap === 'pending'` (chưa xác nhận thì không thể đã duyệt).

## Bán kính ảnh hưởng (đã đo bằng grep)

| File | Chỗ chạm |
|---|---|
| `data/schema/cxm.ts` | `ActionCf`, `Action.cf`, `Snapshot`, `CxmData.snap` |
| `data/fixtures/seed.ts` | **6** action thêm `cf`; mảng `snap` (charter bản đầu ghi 28 — SAI, đã sửa sau A1) |
| `data/validate.ts` | 5 luật trên |
| `data/repository.ts` | `AssignFields` → `ConfirmFields`; đổi chữ ký |
| `data/mock-repository.ts` | `assignOwner`→`confirmIssue`; `createIssue` set `cf:'pending'`; `advanceAction` đọc snapshot |
| `domain/state.ts` | `LaneKey` `'assign'`→`'confirm'`; `laneOf()` nhánh 1 |
| `domain/loop.ts` | `getPrimaryAction` nhánh chặng đầu |
| `design-system/IssueBar.tsx` | `STAGES[0]` nhãn + key |
| **`features/overview/blocks/LanesBlock.tsx`** | **màn ĐÃ CERT — đọc lane `'assign'` ở dòng 27, 70** |
| `features/work/WorkAssignForm.tsx` | → `WorkConfirmForm.tsx` |
| `features/work/WorkPage.tsx` | số dẫn, banner |

DƯƠNG TÍNH GIẢ, không đụng: `QuantifyWidget.tsx:192` "chưa gán intent" — nói về taxonomy intent,
không liên quan owner.

## Bất biến toàn dự án (mọi section đều phải giữ)

- `validateFixture()` trả **rỗng** sau MỌI mutation.
- Không `localStorage`. Không `any`. Import tương đối có đuôi `.ts`/`.tsx`, `import type` cho type.
- `design-system/` KHÔNG được import từ `features/`. Feature không import chéo feature.
- Design token VND: cam `#d9531e` chỉ cho tương tác/định danh; xám ấm. **KHÔNG thêm palette** —
  mọi class màu phải đã có thật trong `tailwind.config.js`.
- Không `git commit`.

## Bốn section (owner chốt cách chia)

- **A1** — schema + seed + validate. *Không đụng repository/domain/UI.*
- **A2** — `repository.ts` + `mock-repository.ts`: `confirmIssue`, `createIssue` set `cf`,
  `advanceAction` đọc snapshot làm `base` + suy `verdict` thay vì hardcode.
- **A3** — `domain/state.ts` + `domain/loop.ts` + `design-system/IssueBar.tsx` +
  `features/overview/blocks/LanesBlock.tsx`. **Overview phải chứng thực lại sau section này.**
- **A4** — `WorkConfirmForm.tsx` + `WorkPage.tsx`.

Một writer tại một thời điểm. Opus chứng thực độc lập từng section trước khi mở section kế.

---

## SỬA CHARTER (02/08/2026, sau review độc lập) — luật `verdict` bản đầu SAI

Bản đầu của charter (và prompt dispatch A2) ghi luật suy `verdict` là `post.v > base.v → 'improved'`.
**SAI** — nó giả định ngầm mọi chỉ số đều càng cao càng tốt.

`src/domain/state.ts:41` đã có sẵn quy tắc chiều chỉ số: `target` chứa `≤` → chiều `'down'`.
Seed có `m-repeat` với `target:'≤ 15%'` — chiều down. `CXA-028` neo vào nó, nên post thấp hơn base là
**cải thiện**, mà luật cũ kết luận `'worse'`.

**Luật ĐÚNG:**
- `conf.length > 0` → `'inconclusive'` (confounder thắng mọi thứ)
- chiều `up`:   `post.v > base.v` → `'improved'` · `post.v < base.v` → `'worse'`
- chiều `down`: `post.v < base.v` → `'improved'` · `post.v > base.v` → `'worse'`
- bằng nhau → `'inconclusive'`

**Quy tắc chiều chỉ số phải tồn tại ĐÚNG MỘT CHỖ** ở tầng `data/`, dùng bởi cả `mock-repository.ts` và
`domain/state.ts`. Hai bản sao của "chiều nào là tốt" trôi lệch nhau chính là cách sinh ra một màn hình
ghi "Xấu đi" cho một cải thiện. `data/` KHÔNG được import từ `domain/` (đảo thứ tự lớp).

**Bất biến bổ sung (nhóm 4):** `action.sm === issue.metric`. Vì `base` đóng băng từ `issue.metric` còn
`post`/`goal` đọc từ `action.sm` — hai field nuôi hai vế của CÙNG một phép so sánh.

**Bài học cho mọi module sau:** Opus chứng thực bằng cách đối chiếu worker với đặc tả của Opus, nên
KHÔNG THỂ bắt được một đặc tả sai. **Review độc lập context sạch là BẮT BUỘC, không phải tuỳ chọn** —
và reviewer phải được yêu cầu đối chiếu đặc tả với code sẵn có, không chỉ đối chiếu code với đặc tả.
