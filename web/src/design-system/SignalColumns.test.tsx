import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignalColumns, type SigColGroup } from "./SignalColumns.tsx";
import { nf } from "./format.ts";

describe("SignalColumns", () => {
  it("rule 1: cùng nhãn dải được cùng màu ở hai nhóm dù thứ hạng trong từng nhóm khác nhau", () => {
    // Toàn chart: blur=50+300=350 (hạng 1 → cat-1), glare=200+10=210 (hạng 2 → cat-2). Ở nhóm A glare
    // (200) LỚN hơn blur (50) — nếu component lỡ tô màu theo thứ hạng RIÊNG của từng nhóm, glare sẽ ăn
    // cat-1 ở nhóm A. Test này khoá đúng chỗ dễ sai đó.
    const groups: SigColGroup[] = [
      {
        sigId: "a", title: "Nhóm A", vol: 250,
        bars: [{ val: "v1", declared: true, total: 250, slices: [
          { label: "blur", n: 50, unknown: null },
          { label: "glare", n: 200, unknown: null },
        ] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
      {
        sigId: "b", title: "Nhóm B", vol: 310,
        bars: [{ val: "v1", declared: true, total: 310, slices: [
          { label: "blur", n: 300, unknown: null },
          { label: "glare", n: 10, unknown: null },
        ] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    // Rule 14: props không bị mutate — chụp lại trước khi render, so sánh sau khi render xong.
    const before = JSON.stringify(groups);
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.getByTestId("sigcol-slice-a-v1-blur")).toHaveStyle({ background: "var(--cat-1)" });
    expect(screen.getByTestId("sigcol-slice-b-v1-blur")).toHaveStyle({ background: "var(--cat-1)" });
    expect(screen.getByTestId("sigcol-slice-a-v1-glare")).toHaveStyle({ background: "var(--cat-2)" });
    expect(screen.getByTestId("sigcol-slice-b-v1-glare")).toHaveStyle({ background: "var(--cat-2)" });

    // Rule 3: thứ tự xếp lát trong DOM phải GIỐNG NHAU ở hai cột, dù thứ hạng riêng của từng cột khác
    // nhau (cột a: glare>blur theo n; cột b: blur>glare theo n) — thứ tự phải theo hạng TOÀN CHART.
    const idsOf = (testId: string) =>
      [...screen.getByTestId(testId).children].map((el) => el.getAttribute("data-testid")!.split("-v1-")[1]);
    expect(idsOf("sigcol-column-a-v1")).toEqual(["blur", "glare"]);
    expect(idsOf("sigcol-column-b-v1")).toEqual(idsOf("sigcol-column-a-v1"));
    expect(JSON.stringify(groups)).toBe(before);
  });

  it("rule 2 + rule 3: lát unknown không mang màu --cat-N, luôn xếp SAU CÙNG trong cột và trong legend", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 100,
        bars: [{ val: "v1", declared: true, total: 100, slices: [
          { label: "chưa định danh", n: 10, unknown: "not-identified" },
          { label: "blur", n: 80, unknown: null },
          { label: "glare", n: 10, unknown: null },
        ] }],
        notIdentified: 10, notIdentifiedPct: 0.1,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const unk = screen.getByTestId("sigcol-slice-s-v1-chưa định danh");
    expect(unk.style.background).not.toContain("var(--cat");

    // Thứ tự DOM trong cột: unknown phải là phần tử CUỐI trong danh sách lát.
    const column = screen.getByTestId("sigcol-column-s-v1");
    const sliceIds = [...column.children].map((el) => el.getAttribute("data-testid"));
    expect(sliceIds[sliceIds.length - 1]).toBe("sigcol-slice-s-v1-chưa định danh");

    // Legend: unknown phải là mục CUỐI trong hàng chú giải.
    const legend = screen.getByTestId("chart-legend");
    const idxBlur = legend.textContent!.indexOf("blur");
    const idxGlare = legend.textContent!.indexOf("glare");
    const idxUnk = legend.textContent!.indexOf("chưa định danh");
    expect(idxUnk).toBeGreaterThan(idxBlur);
    expect(idxUnk).toBeGreaterThan(idxGlare);
  });

  it("Sửa 1: ba nghĩa 'không biết' khác nhau trong CÙNG một cột ra BA cách vẽ khác nhau, không cái nào là --cat-N hay trùng nhau", () => {
    // Ca thật với demo: chiều acq có cả ba nghĩa cùng lúc.
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 130,
        bars: [{ val: "v1", declared: true, total: 130, slices: [
          { label: "đã biết", n: 40, unknown: null },
          { label: "chưa-biết", n: 30, unknown: "unknown-yet" },
          { label: "thiếu", n: 30, unknown: "missing" },
          { label: "chưa định danh", n: 30, unknown: "not-identified" },
        ] }],
        notIdentified: 30, notIdentifiedPct: 0.23,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Nguồn lead" />);
    const yet = screen.getByTestId("sigcol-slice-s-v1-chưa-biết").style.background;
    const missing = screen.getByTestId("sigcol-slice-s-v1-thiếu").style.background;
    const notId = screen.getByTestId("sigcol-slice-s-v1-chưa định danh").style.background;
    for (const bg of [yet, missing, notId]) expect(bg).not.toContain("var(--cat");
    // Ba nghĩa phải ra BA cách vẽ khác nhau — nếu ai gộp lại thành một màu xám, test này đỏ.
    expect(new Set([yet, missing, notId]).size).toBe(3);
    expect(yet).toContain("var(--unk)");
    expect(missing).toContain("var(--unk-gap)");
    // Vân "xám có khe" xen --unk với --surface (KHÔNG xen với --unk-gap — hai màu đặc cạnh nhau ở ô
    // legend nhỏ đọc thành một màu bùn lẫn giữa hai ô "unknown-yet"/"missing" bên cạnh).
    expect(notId).toContain("repeating-linear-gradient");
    expect(notId).toContain("var(--surface)");
    expect(notId).not.toContain("var(--unk-gap)");
    // Thứ tự cố định unknown-yet → missing → not-identified, không xếp theo Σn (ba nghĩa bằng n nhau
    // ở đây nên nếu component lỡ xếp theo thứ khác, test thứ tự dưới vẫn phải đúng cố định).
    const column = screen.getByTestId("sigcol-column-s-v1");
    const sliceIds = [...column.children].map((el) => el.getAttribute("data-testid"));
    expect(sliceIds.slice(-3)).toEqual([
      "sigcol-slice-s-v1-chưa-biết",
      "sigcol-slice-s-v1-thiếu",
      "sigcol-slice-s-v1-chưa định danh",
    ]);
  });

  it("rule 4: thang chiều DÀI là CỦA RIÊNG từng nhóm — vạch dài nhất của nhóm 'nhỏ' (total=100) phải DÀI BẰNG vạch dài nhất của nhóm 'lớn' (total=2840), không bị nén theo mẫu số chung", () => {
    // sg2 (2840) đứng cạnh sg4 (100) — đúng ca thật nêu trong yêu cầu sửa. Nếu component còn dùng một
    // chartMaxTotal chung, vạch của nhóm "nhỏ" sẽ chỉ dài ~11px (100/2840*320) — test này phải đỏ.
    const groups: SigColGroup[] = [
      {
        sigId: "big", title: "Nhóm cột lớn", vol: 2840,
        bars: [{ val: "v1", declared: true, total: 2840, slices: [{ label: "x", n: 2840, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
      {
        sigId: "small", title: "Nhóm cột nhỏ", vol: 100,
        bars: [{ val: "v1", declared: true, total: 100, slices: [{ label: "x", n: 100, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const bigCol = screen.getByTestId("sigcol-column-big-v1");
    const smallCol = screen.getByTestId("sigcol-column-small-v1");
    expect(bigCol).toHaveStyle({ width: "320px" });
    expect(smallCol).toHaveStyle({ width: "320px" });
  });

  it("rule 4: TRONG CÙNG một nhóm, giá trị total gấp đôi thì vạch DÀI gấp đôi — cách đọc chính của chart", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Lý do chụp lỗi", vol: 300,
        bars: [
          { val: "blur", declared: true, total: 200, slices: [{ label: "blur", n: 200, unknown: null }] },
          { val: "glare", declared: true, total: 100, slices: [{ label: "glare", n: 100, unknown: null }] },
        ],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    // blur (total 200, lớn nhất trong nhóm) = 100% MAX_W; glare (total 100, bằng nửa) = nửa MAX_W.
    expect(screen.getByTestId("sigcol-column-s-blur")).toHaveStyle({ width: "320px" });
    expect(screen.getByTestId("sigcol-column-s-glare")).toHaveStyle({ width: "160px" });
  });

  it("luật 11/08: đã bỏ câu chống đọc nhầm 'không so chiều dài giữa hai nhóm', không còn sigcol-scale-note", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 100,
        bars: [{ val: "v1", declared: true, total: 100, slices: [{ label: "x", n: 100, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.queryByTestId("sigcol-scale-note")).not.toBeInTheDocument();
    expect(screen.getByTestId("signal-columns")).toBeInTheDocument();
  });

  it("rule 5: lát n rất nhỏ vẫn chạm sàn 3px hiển thị được; lát n=0 KHÔNG render", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 10000,
        bars: [{ val: "v1", declared: true, total: 10000, slices: [
          { label: "lớn", n: 9999, unknown: null },
          { label: "nhỏ", n: 1, unknown: null },
          { label: "rỗng", n: 0, unknown: null },
        ] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    // (1/10000)*320 = 0.032px — nếu KHÔNG có sàn Math.max(3, ...) thì test này phải đỏ.
    expect(screen.getByTestId("sigcol-slice-s-v1-nhỏ")).toHaveStyle({ width: "3px" });
    expect(screen.queryByTestId("sigcol-slice-s-v1-rỗng")).not.toBeInTheDocument();
  });

  it("rule 7: notIdentified=null hiện câu 'chưa biết', không in 0%, N/A hay không áp dụng", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 614,
        bars: [{ val: "tapped", declared: true, total: 614, slices: [{ label: "tapped", n: 614, unknown: null }] }],
        notIdentified: null, notIdentifiedPct: null,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.getByText(/chưa biết bao nhiêu lượt chưa gắn được khách/)).toBeInTheDocument();
    // Toàn bộ output, không chỉ chân đế — chart không được in 0%/N/A/"không áp dụng" ở BẤT KỲ đâu.
    const whole = screen.getByTestId("signal-columns").textContent!;
    expect(whole).not.toContain("0%");
    expect(whole).not.toContain("N/A");
    expect(whole).not.toContain("không áp dụng");
  });

  it("rule 8: bảng đếm lệch tổng hiện note crit gọi đúng tên cả hai con số", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 920,
        bars: [{ val: "v1", declared: true, total: 900, slices: [{ label: "x", n: 900, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const note = screen.getByTestId("sigcol-mismatch-s");
    expect(note.textContent).toContain("cộng các cột được 900 nhưng tổng của điểm đo là 920 — bảng đếm đang lệch");
  });

  it("rule 8 (non-vacuity): bảng đếm khớp tổng thì KHÔNG hiện note lệch", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 900,
        bars: [{ val: "v1", declared: true, total: 900, slices: [{ label: "x", n: 900, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.queryByTestId("sigcol-mismatch-s")).not.toBeInTheDocument();
  });

  it("rule 9: declared=false hiện CẢ tag 'giá trị chưa khai' VÀ dòng báo gọi đúng tên giá trị", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 410,
        bars: [
          { val: "blur", declared: true, total: 300, slices: [{ label: "blur", n: 300, unknown: null }] },
          { val: "sương mù", declared: false, total: 110, slices: [{ label: "sương mù", n: 110, unknown: null }] },
        ],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const undeclaredBar = screen.getByTestId("sigcol-bar-s-sương mù");
    expect(undeclaredBar).toHaveTextContent("giá trị chưa khai");
    // Cột đã khai KHÔNG mang tag này.
    expect(screen.getByTestId("sigcol-bar-s-blur")).not.toHaveTextContent("giá trị chưa khai");
    const report = screen.getByTestId("sigcol-undeclared-s-sương mù");
    // luật 11/08: đã bỏ "cần người khai bổ sung"
    expect(report.textContent).toContain('Giá trị "sương mù" chưa có trong danh sách đã khai của điểm đo.');
    expect(report.textContent).not.toContain("cần người khai bổ sung");
  });

  it("luật 11/08: đã bỏ ghi chú giải thích hình dạng chart, nhóm một hay nhiều giá trị đều không hiện", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "one", title: "Một giá trị", vol: 614,
        bars: [{ val: "tapped", declared: true, total: 614, slices: [{ label: "tapped", n: 614, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
      {
        sigId: "two", title: "Hai giá trị", vol: 920,
        bars: [
          { val: "success", declared: true, total: 500, slices: [{ label: "success", n: 500, unknown: null }] },
          { val: "fail", declared: true, total: 420, slices: [{ label: "fail", n: 420, unknown: null }] },
        ],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.queryByTestId("sigcol-single-one")).not.toBeInTheDocument();
    expect(screen.queryByTestId("sigcol-single-two")).not.toBeInTheDocument();
    // 19/08: chân đế bỏ "/ngày" — group.vol là TỔNG của lựa chọn đang xem, không phải tốc độ ngày.
    expect(screen.getByTestId("sigcol-footer-one").textContent).toContain(`tổng ${nf(614)} lượt`);
    expect(screen.getByTestId("sigcol-footer-one").textContent).not.toContain("lượt/ngày");
  });

  it("rule 13: groups rỗng hiện ghi chú, không phải khung trống", () => {
    render(<SignalColumns groups={[]} dimLabel="Phân khúc NAV" />);
    expect(screen.getByText(/Chưa có điểm đo nào được chọn/)).toBeInTheDocument();
    expect(screen.queryByTestId("sigcol-groups-row")).not.toBeInTheDocument();
  });

  it("rule 12: chỉ hàng nhóm cuộn ngang, khung ngoài không cuộn", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 100,
        bars: [{ val: "v1", declared: true, total: 100, slices: [{ label: "x", n: 100, unknown: null }] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.getByTestId("sigcol-groups-row").className).toContain("overflow-x-auto");
    expect(screen.getByTestId("signal-columns").className).not.toContain("overflow-x-auto");
    // Rule 11 (nửa header): tiêu đề chart phải nêu đúng dimLabel truyền vào, verbatim.
    expect(screen.getByTestId("signal-columns").textContent).toContain("Phân khúc NAV");
  });

  it("rule 7 (chân đế riêng, rule 6): hai nhóm cạnh nhau in đúng số CỦA CHÍNH NÓ, không lẫn/cộng dồn", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s4", title: "Lý do chụp lỗi", vol: 410,
        bars: [{ val: "blur", declared: true, total: 410, slices: [
          { label: "blur", n: 285, unknown: null },
          { label: "chưa định danh", n: 125, unknown: "not-identified" },
        ] }],
        notIdentified: 125, notIdentifiedPct: 0.3049,
      },
      {
        sigId: "s1", title: "Bắt đầu mở tài khoản", vol: 614,
        bars: [{ val: "tapped", declared: true, total: 614, slices: [
          { label: "tapped", n: 49, unknown: null },
          { label: "chưa định danh", n: 565, unknown: "not-identified" },
        ] }],
        notIdentified: 565, notIdentifiedPct: 0.9202,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const footerS4 = screen.getByTestId("sigcol-footer-s4");
    expect(footerS4.textContent).toContain("tổng 410 lượt");
    expect(footerS4.textContent).toContain("30,5% chưa gắn được khách"); // pv(125,410)
    const footerS1 = screen.getByTestId("sigcol-footer-s1");
    expect(footerS1.textContent).toContain("tổng 614 lượt");
    expect(footerS1.textContent).toContain("92% chưa gắn được khách"); // pv(565,614)
    // Không nhóm nào lẫn số của nhóm khác.
    expect(footerS4.textContent).not.toContain("614");
    expect(footerS1.textContent).not.toContain("410");
    // Rule 6: không tổng chung xuyên nhóm ở BẤT KỲ đâu trong output (410+614=1.024 không được xuất hiện).
    expect(screen.getByTestId("signal-columns").textContent).not.toContain("1.024");
  });

  it("Sửa 2: quá 5 nhóm giá trị (không-unknown) toàn chart hiện note cảnh báo trùng màu, nêu đúng số", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 600,
        bars: [{ val: "v1", declared: true, total: 600, slices: [
          { label: "l1", n: 100, unknown: null },
          { label: "l2", n: 100, unknown: null },
          { label: "l3", n: 100, unknown: null },
          { label: "l4", n: 100, unknown: null },
          { label: "l5", n: 100, unknown: null },
          { label: "l6", n: 100, unknown: null },
        ] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    const note = screen.getByTestId("sigcol-color-overflow");
    expect(note.textContent).toContain("chart đang có 6 nhóm giá trị nhưng bảng màu chỉ có 5");
    expect(note.textContent).toContain("1 nhóm đang");
  });

  it("Sửa 2 (non-vacuity): đúng 5 nhóm giá trị KHÔNG hiện note cảnh báo trùng màu", () => {
    const groups: SigColGroup[] = [
      {
        sigId: "s", title: "Điểm đo S", vol: 500,
        bars: [{ val: "v1", declared: true, total: 500, slices: [
          { label: "l1", n: 100, unknown: null },
          { label: "l2", n: 100, unknown: null },
          { label: "l3", n: 100, unknown: null },
          { label: "l4", n: 100, unknown: null },
          { label: "l5", n: 100, unknown: null },
        ] }],
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    expect(screen.queryByTestId("sigcol-color-overflow")).not.toBeInTheDocument();
  });

  /* Ca mà cả bộ test S3 chưa từng chạy: 8 giá trị với tên snake_case DÀI (tên thật của cổng rút tiền),
     thay vì 6 nhãn ngắn kiểu `step_01`. CSS KHÔNG coi dấu _ là chỗ được ngắt dòng, nên không có điểm
     ngắt là chữ tràn khỏi cột ra hai bên và các nhãn đè nhau thành vệt không đọc được.
     jsdom không có layout nên không đo được chồng lấn — chốt hai thứ đo được: có `<wbr>` sau MỖI dấu _
     (điểm cho phép ngắt), và `textContent` vẫn ĐÚNG tên đầy đủ, tức việc chèn `<wbr>` không làm hỏng
     tên. Cộng `title` để tên đầy đủ luôn đọc lại được khi nhãn xuống nhiều dòng. */
  it("nhãn giá trị dài có <wbr> ở mỗi dấu _ để ngắt theo từ, và không hỏng tên đầy đủ", () => {
    const vals = [
      "pass",
      "insufficient_withdrawable",
      "rtt_below_100",
      "cccd_not_verified",
      "signature_missing",
      "otp_failed",
      "over_limit_after_16h",
      "month_end_blackout",
    ];
    const groups: SigColGroup[] = [
      {
        sigId: "rut", title: "Cổng rút tiền", vol: 800,
        bars: vals.map((val) => ({
          val, declared: true, total: 100,
          slices: [{ label: "<50tr", n: 100, unknown: null }],
        })),
        notIdentified: 0, notIdentifiedPct: 0,
      },
    ];
    render(<SignalColumns groups={groups} dimLabel="Phân khúc NAV" />);
    for (const val of vals) {
      const label = screen.getByTitle(val);
      // Tên đầy đủ phải còn nguyên: <wbr> không đóng góp ký tự nào vào textContent.
      expect(label.textContent).toBe(val);
      // Số điểm cho phép ngắt = số dấu _ trong tên. `pass` không có _ nên không cần <wbr> nào.
      expect(label.querySelectorAll("wbr")).toHaveLength(val.split("_").length - 1);
    }
  });
});
