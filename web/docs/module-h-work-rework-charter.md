# Module H Charter — rework Bảng xử lý (`#/work`) theo hướng theo dõi tiến trình

Status: **HOÃN — owner đổi hướng dự án 07/08/2026 sang ưu tiên MVP đơn giản nhất**, ưu tiên số 1 là
*quản trị các điểm data và ngưỡng*, brainstorm phạm vi ở phiên sau. Module này **không khởi động**
cho tới khi phạm vi MVP chốt xong; lúc đó phải soi lại xem bốn quyết định dưới đây có còn nằm trong
phạm vi không. Xem mục *ĐỔI HƯỚNG DỰ ÁN* đầu [REBUILD-STATUS.md](./REBUILD-STATUS.md).
(Trước khi hoãn, điều kiện khởi động là: SAU khi Module B đóng — owner chốt 07/08/2026.)
Date: 07/08/2026. Đọc kèm: [module-b-issue-charter.md](./module-b-issue-charter.md).

> Hồ sơ này viết ngay lúc owner chốt, **trước** khi có worker nào chạy, để các quyết định không rơi
> mất giữa hai module. Phần *Sections* còn thô — soạn đủ trước khi giao việc.

## Owner yêu cầu (nguyên văn 07/08/2026)

> *"phần bảng xử lý ở cxm cũng sẽ có phương án tương tự là show lịch sử, rework đi để đi theo hướng
> track các vấn đề đang xử lý và dễ dàng tiện dụng cho user để kiểm tra tình trạng/hiệu quả xử lý"*

## Màn đang có gì (đọc code 07/08, `features/work/WorkPage.tsx` 297 dòng)

Năm phần: nút **＋ Tạo điểm gãy** + câu rào · hàng **4 chip đếm** (chờ xác nhận / trong vòng xử lý ·
chờ duyệt · chờ khép vòng · Đã xong) · **banner** vừa tạo / vừa xác nhận · **form** tạo & xác nhận ·
**danh sách `IssueBar`** sắp theo `pri.total` giảm dần.

## Ba lỗ hổng ĐO ĐƯỢC so với yêu cầu

| # | Lỗ hổng | Bằng chứng |
|---|---|---|
| 1 | **Việc đã xong biến mất khỏi màn** | `WorkPage.tsx:140` lọc `lc !== 'closed'`. `CXA-013` — cái DUY NHẤT đã khép vòng, `verdict:'improved'`, loop 25/25 — không hiện ở đâu, chỉ còn con số trong chip "Đã xong 1" **bấm không vào được**. Muốn kiểm *hiệu quả xử lý* thì việc đã xong chính là bằng chứng, mà nó lại là thứ duy nhất màn giấu |
| 2 | **Thanh không nói gì về kết quả** | `IssueBar` render sev · title · `pri.total` · 4 chặng · owner/acc/due · CTA. **Không** `Outcome.verdict`, **không** trước→sau. Hai action đã có `Outcome` (`improved` và `inconclusive` kèm 2 confounder) mà nhìn bảng không biết |
| 3 | **Quá hạn không được nói ra** | Hôm nay 07/08/2026. Trong 5 thẻ đang hiện, **3 quá hạn**: `CXA-028` quá 9 ngày (`due 29/07`) · `CXA-017` quá 8 (`30/07`) · `CXA-021` quá 5 (`02/08`). Màn in `hạn 30/07/2026` như một dòng chữ xám bình thường |

## Owner chốt 07/08 — bốn quyết định

| # | Chốt | Ghi chú |
|---|---|---|
| 1 | **Lịch sử = CẢ HAI**: diễn biến chỉ số **và** nhật ký thao tác | Diễn biến chỉ số **dùng lại** `VerifyChart` + `verifyTimeline()` của Module B, KHÔNG dựng bản thứ hai. Nhật ký thao tác **chưa có trong dữ liệu** ⇒ bảng mới + dòng yêu cầu dữ liệu **D-5** |
| 2 | **Việc đã xong: bộ lọc trạng thái, mặc định ẩn, bấm là hiện** | Một hàng lọc theo chặng (Xác nhận · Duyệt · Sửa · Verify · Đã xong). Mặc định giữ nguyên "việc đang chạy" để màn không loãng; mục Đã xong luôn bấm tới được, kèm kết quả và số khách đã khép vòng |
| 3 | **Trên mỗi thanh: CHỈ thêm đường diễn biến chỉ số thu nhỏ** (sparkline), bấm vào mở chart đầy đủ | ⚠️ Owner **đã cân nhắc và KHÔNG chọn**: cảnh báo quá hạn · kết quả trước→sau + kết luận · tiến độ khép vòng với khách. **Đừng tự thêm lại** ở phiên sau vì thấy lỗ hổng 2 và 3 ở bảng trên còn đó — chúng còn đó là **do owner chọn thế**, không phải do bỏ sót. Muốn thêm thì hỏi lại |
| 4 | **Làm SAU khi Module B đóng** | `verifyTimeline()` và `VerifyChart` là section B2/B3 của Module B. Làm màn này trước là dựng cùng một thứ hai lần rồi hai bản lệch nhau |

## Nhật ký thao tác — thiết kế sơ bộ, CHƯA chốt

Chưa có gì trong dữ liệu ghi "ai làm gì lúc nào". Ba dấu vết người-và-thời-điểm duy nhất đang có là
`Snapshot.at`/`by` (lúc xác nhận), `Outcome.by` (ai kết luận), `Loop.by` (ai duyệt nội dung gửi
khách) — rời rạc, không thành chuỗi.

```ts
export type ActionEventKind =
  | 'created' | 'confirmed' | 'approved' | 'started' | 'released' | 'validated' | 'closed';
export type ActionEvent = {
  act: string;            // action id
  kind: ActionEventKind;
  at: string;             // dd/MM/yyyy
  by: string;
  demo: boolean;          // cờ minh hoạ — UI đọc cờ này, không hardcode
};
// CxmData thêm: alog: ActionEvent[]   ← KHÔNG đặt tên `ev`, tên đó đã là Evidence
```

**Hai ràng buộc phải giải trước khi code, nếu không màn sẽ nói dối:**

1. **Nhật ký phải KHỚP trạng thái hiện tại.** Không được có event `approved` cho action còn
   `ap:'pending'`. Đây là một luật `validate.ts`: tập `kind` có mặt phải tương ứng đúng vị trí của
   action trên máy trạng thái (`cf` → `ap` → `dl` → `iv` → `lc`). Thiếu luật này thì fixture demo
   sinh ra một lịch sử mâu thuẫn với chính thẻ đang hiện.
2. **`advanceAction` của store phải GHI THÊM event mỗi lần chuyển chặng.** Không ghi thì trạng thái
   chạy tiếp trong khi nhật ký đứng yên — người dùng bấm ba lần và lịch sử vẫn nói chưa có gì xảy
   ra. Chỗ chạm là `data/mock-repository.ts` (transition đầy đủ), không phải `domain/loop.ts`.

**Dòng yêu cầu dữ liệu D-5** (ghi vào bảng YÊU CẦU DỮ LIỆU của `REBUILD-STATUS.md` khi module khởi
động): *nhật ký chuyển trạng thái của mỗi action — ai, lúc nào, chuyển từ chặng nào sang chặng nào.*
Nguồn thật phải cấp; tới lúc đó giá trị sinh tất định trong `demo.ts` với `demo:true`.

## Phụ thuộc cứng vào Module B

| Cần | Đến từ |
|---|---|
| `hist` trên `CxmData` + sinh demo tất định | B1 |
| `verifyTimeline(issueId, data)` | B2 |
| `VerifyChart` | B3 |

Sparkline trên thanh là **hình thu nhỏ của cùng một chuỗi** — không được tự tính một chuỗi khác.

## Bất biến KHÔNG được tháo (giống Module B)

Thứ tự tầng · `domain/` không hằng số tỷ lệ bịa · `'chưa-biết'` ≠ `'thiếu'` · nhãn dải chỉ từ
`bandLabels()` · nhãn demo do cờ trên dữ liệu · không `localStorage` / không `any` / import tương
đối có đuôi · không thêm palette.
