/* Harness kiểm bản HTML tự chứa bằng Node. Dựng DOM tối thiểu, chạy script trong
   file, render mọi route và mọi thao tác state, rồi khẳng định validateFixture()
   trả rỗng.  Chạy:  node output/_harness.js

   ĐÂY LÀ CÔNG CỤ CỦA DỰ ÁN, không phải file tạm — mọi tuyên bố "đã verify" trong
   AI-CONTEXT.md dựa vào nó. Sửa prototype thì chạy lại cái này trước khi commit.

   Khi thêm route mới PHẢI thêm vào ROUTES bên dưới. Một route không nằm trong
   danh sách là một route không ai kiểm. */
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/cxm-platform-prototype.html', 'utf8');
const src = html.match(/<script>([\s\S]*)<\/script>/)[1];

const errs = [];
/* Stub DOM robust: prototype dùng classList/style/getBoundingClientRect cho tour
   spotlight (thêm sau lần verify trước). render() gọi classList.remove mỗi lần
   nên stub phải có, nếu không load là crash. */
const el = () => ({ innerHTML:'', className:'', scrollTop:0, value:'', focus(){}, setSelectionRange(){},
  remove(){}, setAttribute(){}, appendChild(){}, style:{},
  classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  getBoundingClientRect:() => ({ top:0, left:0, width:0, height:0, bottom:0, right:0 }) });
const nodes = { '#nav':el(), '#ptitle':el(), '#fperiod':el(), '#fscope':el(), '#tour':el(), '#view':el() };
const FIELDS = {};   /* giá trị giả cho input của form — set trước khi bấm */

const sandbox = {
  console,
  location:{ hash:'#/cxm' },
  document:{
    querySelector:(s) => nodes[s] || el(),
    getElementById:(id) => (id in FIELDS ? { value:FIELDS[id] } : null),
  },
  window:{ addEventListener(){} },
  requestAnimationFrame:() => {},
  Date, Math, JSON, Number, String, Array, Object, parseFloat, parseInt, isNaN, Set,
};
sandbox.window.document = sandbox.document;
vm.createContext(sandbox);
try { vm.runInContext(src, sandbox); } catch (e) { console.log('LOAD FAIL: ' + e.message); process.exit(1); }

const view = () => nodes['#view'].innerHTML;
function goto(hash, label) {
  sandbox.location.hash = hash;
  try { vm.runInContext('route()', sandbox); } catch (e) { errs.push(`${label || hash}: THROW ${e.message}`); return ''; }
  const h = view();
  if (!h || h.length < 200) errs.push(`${label || hash}: render rỗng hoặc quá ngắn (${h.length} ký tự)`);
  if (h.indexOf('undefined') > -1) errs.push(`${label || hash}: có chuỗi "undefined" trong HTML`);
  if (h.indexOf('NaN') > -1) errs.push(`${label || hash}: có chuỗi "NaN" trong HTML`);
  if (h.indexOf('liên kết dữ liệu mẫu đang sai') > -1) errs.push(`${label || hash}: BANNER ĐỎ validateFixture`);
  return h;
}
const run = (code, label) => { try { return vm.runInContext(code, sandbox); } catch (e) { errs.push(`${label}: THROW ${e.message}`); } };

/* ---------- 1 · Mọi route thật + hồ sơ điểm gãy ---------- */
const ROUTES = ['cxm','atlas','work','voc','sources','topics','vocjourney','quantify','assistant','rules','agents'];
ROUTES.forEach((r) => goto('#/' + r));
/* Danh sách này phải khớp đúng V — nếu lệch thì có route không ai kiểm */
run(`(() => { const miss = Object.keys(V).filter(k => ['issue','topic'].indexOf(k) === -1 && ${JSON.stringify(ROUTES)}.indexOf(k) === -1);
     if (miss.length) throw new Error('route không có trong ROUTES: ' + miss.join(', ')); })()`, 'ROUTES phủ hết V');
run("DATA.iss.forEach(i => { location.hash = '#/issue/' + i.id; route(); })", 'issue detail loop');
/* topic detail (#/topic/<id>) — route có arg như issue, kiểm mọi theme node */
run("DATA.tax.filter(n => n.lv === 'theme').forEach(t => { location.hash = '#/topic/' + t.id; route(); })", 'topic detail loop');
['ev','imp','cust','act','out'].forEach((t) => { run(`ST.sub.issue='${t}'`); goto('#/issue/CXI-021', 'issue tab ' + t); });

/* ---------- 2 · Redirect route cũ — link, bookmark, slide cũ không được đứt ---------- */
const ALIASES = { issues:'work', actions:'work', outcomes:'work', health:'work',
                  dashboard:'cxm', board:'cxm', feed:'sources', surveys:'sources', taxonomy:'topics' };
Object.keys(ALIASES).forEach((r) => {
  goto('#/' + r, 'alias ' + r);
  const cur = run('ST.route');
  if (cur !== ALIASES[r]) errs.push(`alias #/${r} → ST.route = "${cur}", đáng lẽ "${ALIASES[r]}"`);
});
goto('#/khong-ton-tai', 'hash rác');
if (run('ST.route') !== 'cxm') errs.push('Hash không tồn tại phải rơi về #/cxm');

/* ---------- 2b · Tổng quan HIỂN THỊ set + Quản lý set (compose) trong Quantify ----
   Redesign 31/07: Overview KHÔNG sửa inline nữa (không còn blkx/✎ Tùy chỉnh); mọi
   thao tác compose dời về màn Quản lý set trong Quantify (ST.sel.qview='sets'). */
run("DATA.dash.forEach(d => { location.hash = '#/' + d.sec + '/' + d.id; route(); })", 'mọi set dashboard');
['voc','cxm'].forEach((sec) => {
  const first = run(`DATA.dash.find(d => d.sec === '${sec}').id`);
  const ov = goto('#/' + sec + '/' + first, sec + ' · Tổng quan hiển thị');
  if (ov.indexOf('Quản lý set') === -1) errs.push(`${sec}: Tổng quan thiếu link Quản lý set`);
  if (ov.indexOf('blkx') > -1) errs.push(`${sec}: Tổng quan không được còn sửa khối inline`);
});
/* Màn Quản lý set: thêm/bỏ/đổi-thứ-tự khối trên set SỬA ĐƯỢC (không phải set cố định) */
run("qGoSets(); route()", 'mở Quản lý set');
if (view().indexOf('Quản lý set') === -1) errs.push('Quản lý set: màn không render');
['voc','cxm'].forEach((sec) => {
  const ed = run(`(DATA.dash.find(d => d.sec === '${sec}' && !SET_LOCKED(d.id))||{}).id`);
  if (!ed) { errs.push(`${sec}: không có set sửa được để test`); return; }
  run(`byId(DATA.dash,'${ed}').qs[0].b.slice().forEach(b => blkDel('${ed}',0,b))`, sec + ' · bỏ hết khối câu 1');
  if (run(`curB(byId(DATA.dash,'${ed}'),0).length`) !== 0) errs.push(`${sec}: bỏ hết khối mà overlay còn khối`);
  if (run('quantifySets()').indexOf('Chưa có khối nào') === -1) errs.push(`${sec}: Quản lý set không báo câu hỏi rỗng`);
  const blk = run(`Object.keys(BLOCKS).filter(k => BLOCKS[k].sec === '${sec}')[0]`);
  run(`blkAdd('${ed}',0,'${blk}'); blkAdd('${ed}',0,'q1')`, sec + ' · thêm 2 khối');
  run(`blkMove('${ed}',0,'q1',-1)`, sec + ' · đổi thứ tự khối');
  if (run(`curB(byId(DATA.dash,'${ed}'),0)[0]`) !== 'q1') errs.push(`${sec}: blkMove không đổi được thứ tự`);
  run(`boardReset('${ed}')`);
  if (run(`!!ST.boards['${ed}']`)) errs.push(`${sec}: trả về mặc định nhưng ST.boards còn dấu vết`);
});
/* Set cố định khóa xóa; tạo + xóa set người dùng phải kèm CFG.sub (§12b), không sót */
run("setDelete('b-voc-all')");
if (!run(`!!byId(DATA.dash,'b-voc-all')`)) errs.push('set cố định b-voc-all bị xóa (đáng lẽ khóa)');
const dashN = run('DATA.dash.length');
run("setNew('cxm')");
const madeSet = run('DATA.dash[DATA.dash.length-1].id');
if (run('DATA.dash.length') !== dashN + 1) errs.push('setNew không thêm set');
if (!run(`!!CFG.sub['${madeSet}']`)) errs.push('setNew thiếu CFG.sub → §12b sẽ đỏ');
run(`ST.sel.set.cxm = '${madeSet}'`);                 /* chọn set sắp xóa để kiểm Overview fallback */
run(`setDelete('${madeSet}')`);
if (run('DATA.dash.length') !== dashN) errs.push('setDelete không xóa set người dùng');
if (run(`!!CFG.sub['${madeSet}']`)) errs.push('setDelete để sót CFG.sub');
goto('#/cxm', 'Overview sau khi xóa set đang chọn');  /* không được throw; phải fallback về set mặc định */
run("ST.sel.qview='lib'");
/* Mọi khối đặc biệt phải dựng được và không được rỗng */
run(`Object.keys(BLOCKS).forEach(k => { const h = blockBody(k);
     if (!h || h.length < 300 || h.indexOf('không tồn tại') > -1) throw new Error('khối ' + k + ' dựng hỏng'); })`, 'mọi khối đặc biệt');

/* ---------- 2c · Hồ sơ dữ liệu từng nguồn (thay màn Feed cũ) ----------
   LƯU Ý VỀ SANDBOX: `location` ở đây là object thường, gán `.hash` KHÔNG phát
   hashchange, nên go() bên trong drillSource()/tourGo() không kích hoạt route().
   Trên browser thật thì có. Vì vậy mọi chỗ dùng go() gián tiếp đều phải gọi
   route() ngay sau — nếu không, bài kiểm sẽ đọc màn cũ và luôn "đạt". */
DATA_SOURCES().forEach((id) => {
  run(`drillSource('${id}')`, 'drillSource ' + id);
  const h = goto('#/sources', 'hồ sơ nguồn ' + id);
  if (h.indexOf('Hồ sơ dữ liệu ·') === -1) errs.push(`drillSource('${id}') không mở được hồ sơ nguồn`);
  if (h.indexOf('Feedback trong nguồn này trông thế nào') === -1) errs.push(`hồ sơ ${id}: thiếu khối phân bố dữ liệu`);
});
run("ST.sel.srcOpen=null");
function DATA_SOURCES() { return run('DATA.sources.map(s => s.id)'); }

/* ---------- 2d · Guided tour phải chạy hết, không rơi vào route rỗng ----------
   Đây là điều "gõ hash cũ không vỡ router" KHÔNG phủ được: tourGo() điều hướng
   bằng lệnh, nên một bước trỏ route đã xóa sẽ hỏng giữa buổi trình bày. */
const TOURN = run('DATA.tour.length');
run('startTour()', 'startTour');
for (let i = 0; i < TOURN; i++) {
  const r = run('DATA.tour[ST.tour - 1].r');
  const h = goto('#/' + r, 'tour bước ' + (i + 1) + ' → ' + r);
  if (!h || h.length < 200) errs.push(`tour bước ${i + 1} (${r}): màn rỗng`);
  if (i < TOURN - 1) run('tourGo(1)', 'tourGo ' + i);
}
run('stopTour()');

/* ---------- 3 · Bốn làn phải phủ hết action đang mở ---------- */
goto('#/work');
console.log('  Làn ban đầu: ' + run("ACT.map(a => laneOf(a)).join(', ')", 'laneOf'));
if (run("ACT.some(a => laneOf(a) === 'off' && a.lc !== 'closed' && a.iv !== 'validated')"))
  errs.push('Có action chưa xong mà không thuộc làn nào — thẻ sẽ biến mất khỏi board');

/* ---------- 4 · Nhóm cấu hình #/rules ---------- */
['step','metric','source','alert','sub','weight'].forEach((k) => { run(`ST.sub.rules='${k}'`); goto('#/rules', 'rules · ' + k); });

/* ---------- 5 · Taxonomy: chọn từng node + tìm kiếm ---------- */
run("DATA.tax.forEach(n => { ST.sel.tx = n.id; location.hash='#/topics'; route(); })", 'topics mọi node');
run("ST.sel.tx='x-l1-mtk'; ST.sel.txq='liveness'"); goto('#/topics', 'topics · search khớp');
run("ST.sel.txq='zzzz'"); goto('#/topics', 'topics · search không khớp');
run("ST.sel.txq=''");

/* ---------- 6 · Bộ lọc 3 màn nền dữ liệu ---------- */
['all','down','stale','ok'].forEach((f) => { run(`ST.sel.srcF='${f}'`); goto('#/sources', 'sources · ' + f); });
/* Ba tab PHẢI ra ba nội dung khác nhau — nếu chúng giống hệt thì vòng lặp này
   là no-op và ta đang tự lừa mình là đã kiểm. */
const tabHtml = {};
['health','matrix','active'].forEach((t) => { run("ST.sub.srcTab='" + t + "'"); tabHtml[t] = goto('#/sources', 'sources · tab ' + t); });
if (tabHtml.health === tabHtml.matrix || tabHtml.health === tabHtml.active || tabHtml.matrix === tabHtml.active)
  errs.push('Ba tab của #/sources ra nội dung giống nhau — vòng lặp kiểm tab không có tác dụng');
run("ST.sub.srcTab='health'");
['lanes','pri'].forEach((t) => { run("ST.sub.work='" + t + "'"); goto('#/work', 'work · chế độ ' + t); });
/* Nút Tạo điểm gãy phải sống ở CẢ HAI chế độ, không chỉ chế độ theo làn */
['lanes','pri'].forEach((t) => {
  run("ST.sub.work='" + t + "'; ST.sel.mkiss=true"); const h = goto('#/work', 'work · form tạo ở ' + t);
  if (h.indexOf('ni-title') === -1) errs.push(`Chế độ "${t}" của #/work: bấm Tạo điểm gãy không hiện form`);
});
run("ST.sel.mkiss=false; ST.sub.work='lanes'");
['open','crit','watch','all'].forEach((f) => { run(`ST.sel.agF='${f}'`); goto('#/agents', 'agents · ' + f); });
run("ST.sel.srcF='all'; ST.sel.agF='open'");

/* Quantify builder: mọi tổ hợp chiều × chỉ số × chart phải dựng được */
run(`(() => { let n = 0; ST.sel.qview = 'create';
  Object.keys(DIMS).forEach(s => Object.keys(METRICS).forEach(m => ['rank','donut'].forEach(c => {
    ST.sel.qb = { show:s, metric:m, chart:c };
    const h = V.quantify();
    if (!h || h.length < 2000) throw new Error('tổ hợp ' + s + '/' + m + '/' + c + ' dựng hỏng');
    n++; })));
  console.log('  Quantify builder (màn tạo chart): ' + n + ' tổ hợp dựng được'); })()`, 'Quantify builder');
run("ST.sel.qb=null; ST.sel.qview=null");

/* ---------- 7 · Tạo điểm gãy: thiếu tiêu đề thì phải chặn ---------- */
const n0 = run('DATA.iss.length');
Object.assign(FIELDS, { 'ni-title':'', 'ni-step':'s3', 'ni-metric':'m-liveness', 'ni-sev':'high',
                        'ni-owner':'', 'ni-acc':'Head of CX', 'ni-due':'', 'ni-plain':'' });
run('createIssue()', 'createIssue rỗng');
if (run('DATA.iss.length') !== n0) errs.push('createIssue() tạo bản ghi dù tiêu đề rỗng');
if (!run('!!ST.sel.mkerr')) errs.push('createIssue() rỗng nhưng không báo lỗi cho người dùng');

/* ---------- 8 · Tạo điểm gãy không owner → phải vào làn 1 ---------- */
FIELDS['ni-title'] = 'Khách không nhận được xác nhận sau khi ký';
run('createIssue()', 'createIssue không owner');
const newId = run('ST.sel.mkok');
console.log('  Đã tạo: ' + newId + ' · làn "' + run('ST.sel.mkokLane') + '"');
if (run('DATA.iss.length') !== n0 + 1) errs.push('createIssue() không thêm được bản ghi');
if (run("laneOf(ACT[ACT.length-1]) !== 'assign'")) errs.push('Issue tạo mà không gán owner phải vào làn Cần gán người');
if (run(`(() => { const i = iss('${newId}'); return i.pri.sev+i.pri.aff+i.pri.jc+i.pri.rep+i.pri.tr+i.pri.reg !== i.pri.total })()`))
  errs.push(`${newId}: pri.total không bằng tổng 6 thành phần`);
goto('#/work', 'work sau khi tạo');
goto('#/issue/' + newId, 'hồ sơ ' + newId);
goto('#/atlas', 'atlas sau khi tạo');
goto('#/work', 'work sau khi tạo');

/* ---------- 9 · Gán người: thiếu người thì phải chặn ---------- */
const aid = run('ACT[ACT.length-1].id');
Object.assign(FIELDS, { 'as-owner':'', 'as-acc':'Head of Onboarding', 'as-due':'2026-08-20' });
run(`saveAssign('${aid}')`, 'saveAssign rỗng');
if (run(`action('${aid}').owner !== 'Chưa gán'`)) errs.push('saveAssign() gán dù chưa chọn người');
FIELDS['as-owner'] = 'Ngọc Mai';
run(`saveAssign('${aid}')`, 'saveAssign hợp lệ');
if (run(`action('${aid}').owner !== 'Ngọc Mai'`)) errs.push('saveAssign() không ghi được owner');
if (run(`action('${aid}').due !== '20/08/2026'`)) errs.push('saveAssign() ghi sai định dạng hạn: ' + run(`action('${aid}').due`));
if (run(`laneOf(action('${aid}')) !== 'approve'`)) errs.push('Sau khi gán, thẻ phải sang làn Chờ duyệt');
console.log('  Sau khi gán: làn "' + run(`laneOf(action('${aid}'))`) + '" · hạn ' + run(`action('${aid}').due`));

/* ---------- 10 · Chạy hết chuỗi advance() tới khép vòng ---------- */
const seq = [];
for (let i = 0; i < 12; i++) {
  run(`advance('${aid}')`, 'advance ' + i);
  seq.push(run(`laneOf(action('${aid}'))`));
  if (run(`action('${aid}').lc === 'closed'`)) break;
}
console.log('  Chuỗi làn khi bấm advance: ' + seq.join(' → '));
if (run(`action('${aid}').lc !== 'closed'`)) errs.push('Không bấm hết được chuỗi tới trạng thái đã khép vòng');
if (run(`laneOf(action('${aid}')) !== 'off'`)) errs.push('Thẻ đã khép vòng vẫn còn trên board');
run("ST.sel['wk-out']=true; ST.sel['wk-loop']=true"); goto('#/work', 'work · mở 2 khối cuối');
run("ST.sel['wk-out']=false; ST.sel['wk-loop']=false");

/* ---------- 11 · Đổi ngưỡng phải làm trạng thái đổi theo ---------- */
const before = run("DATA.steps.map(s => stepState(obs(s.id))).join(' ')");
run("setCfg('step.failCrit','10','num')");
const after = run("DATA.steps.map(s => stepState(obs(s.id))).join(' ')");
console.log('  Bước, ngưỡng 15%: ' + before);
console.log('  Bước, ngưỡng 10%: ' + after);
if (before === after) errs.push('Đổi ngưỡng xử lý 15% → 10% mà trạng thái bước không đổi');
run('resetCfg()');
if (run("DATA.steps.map(s => stepState(obs(s.id))).join(' ')") !== before) errs.push('Trả về mặc định không quay lại trạng thái gốc');

/* ---------- 11b · Quantify: lưu / xóa (có guard) / đổi tên chart ----------
   Chứng minh validateFixture() vẫn rỗng SAU khi lưu chart mới và xóa chart —
   phần static của fixture không đủ, phải kiểm chính đường tạo-tại-runtime. */
const qN0 = run('DATA.qt.length');
run("ST.sel.qb = { show:'theme', metric:'count', chart:'rank' }");
FIELDS['q-name'] = 'Chart test tạm';
run('qSave()', 'qSave');
if (run('DATA.qt.length') !== qN0 + 1) errs.push('qSave() không thêm chart vào thư viện');
const newQ = run('ST.sel.quantify');
if (run(`(() => { const q = qt('${newQ}'); return !q || q.kind !== 'show' || q.name !== 'Chart test tạm' || String(q.id).indexOf('qu') !== 0; })()`))
  errs.push('qSave() tạo chart sai shape (kind/name/id)');
const hQ = goto('#/quantify', 'quantify sau khi lưu chart');
if (hQ.indexOf('Chart test tạm') === -1) errs.push('Chart vừa lưu không hiện trong thư viện');
if (!run("qUsedBy('q14').length")) errs.push("qUsedBy('q14') phải > 0 — q14 đang được set dùng");
if (run(`qUsedBy('${newQ}').length`)) errs.push('Chart mới tạo chưa vào set nào, qUsedBy phải = 0');
run("qDelete('q14')", 'qDelete chart đang được set dùng (DATA.dash)');
if (run('DATA.qt.length') !== qN0 + 1) errs.push('qDelete() xóa chart đang được set dùng — guard DATA.dash hỏng');
/* Đường ST.boards: thêm chart mới vào set qua Tùy chỉnh (ghi ST.boards, KHÔNG phải
   DATA.dash) — guard vẫn phải chặn, nếu không renderSet sẽ throw qWidget(undefined). */
run(`blkAdd('b-voc-all', 0, '${newQ}')`, 'blkAdd chart mới vào set tùy chỉnh');
if (!run(`qUsedBy('${newQ}').length`)) errs.push('qUsedBy() không thấy chart trong set đã tùy chỉnh (ST.boards)');
run(`qDelete('${newQ}')`, 'qDelete chart đang dùng ở set tùy chỉnh');
if (run('DATA.qt.length') !== qN0 + 1) errs.push('qDelete() xóa chart đang dùng ở ST.boards — guard ST.boards hỏng');
run("boardReset('b-voc-all')");
if (run(`qUsedBy('${newQ}').length`)) errs.push('Sau boardReset chart vẫn bị coi là đang dùng');
FIELDS['q-ren'] = 'Tên đã đổi';
run(`qRenSave('${newQ}')`, 'qRenSave');
if (run(`qt('${newQ}').name !== 'Tên đã đổi'`)) errs.push('qRenSave() không đổi được tên chart');
run(`qDelete('${newQ}')`, 'qDelete chart tự do');
if (run('DATA.qt.length') !== qN0) errs.push('qDelete() chart không set nào dùng phải xóa được — thư viện chưa về gốc');
if (run(`!!qt('${newQ}')`)) errs.push('qDelete() xóa rồi mà qt() vẫn tìm thấy chart');
/* Ba màn con của tab Quantify (thư viện / tạo chart / chi tiết) + search + filter */
run("ST.sel.qview='create'"); const hCreate = goto('#/quantify', 'quantify · màn tạo chart');
if (hCreate.indexOf('Tạo chart mới') === -1) errs.push('Màn tạo chart không render');
run("ST.sel.qview='lib'; ST.sel.qDetail='q1'"); const hDet = goto('#/quantify', 'quantify · chi tiết chart');
const q1name = run("qt('q1').name");
if (hDet.indexOf(q1name) === -1) errs.push('Màn chi tiết chart không render tên chart');
run("ST.sel.qDetail=null; ST.sel.qFilter='donut'"); const hFil = goto('#/quantify', 'quantify · lọc donut');
const donutName = run("(DATA.qt.find(q => q.chart==='donut')||{}).name");
const barName = run("(DATA.qt.find(q => q.chart==='rank')||{}).name");
if (donutName && hFil.indexOf(donutName) === -1) errs.push('Lọc donut không hiện chart donut');
if (barName && hFil.indexOf(barName) > -1) errs.push('Lọc donut vẫn hiện chart bar — filter không tác dụng');
run("ST.sel.qFilter='all'; ST.sel.qSearch='zzzzz'"); const hEmpty = goto('#/quantify', 'quantify · search không khớp');
if (hEmpty.indexOf('Không có chart nào khớp') === -1) errs.push('Search không khớp nhưng không báo rỗng');

/* ---------- 11c · Redesign 31/07: view bảng · cross-tab · builder sửa/nhân bản · lọc mới · no-drill ---------- */
/* View bảng là view thứ hai của item `show`; series luôn chart, không có toggle */
if (!run("qWidget(qt('q1'),{view:'table'}).indexOf('<table')>-1")) errs.push('view bảng không render <table>');
if (!run("qWidget(qt('q1'),{view:'chart'}).indexOf('class=\"bars\"')>-1")) errs.push('view chart không render bars');
if (run("qViewToggle(qt('q5'))") !== '') errs.push('series không được có toggle view');
if (!run("qViewToggle(qt('q1')).indexOf('qSetView')>-1")) errs.push('item show thiếu toggle view');
/* Cross-tab seed q16: bảng ma trận + nhãn "mẫu", không bịa số */
if (!run("qt('q16') && qt('q16').by === 'pf'")) errs.push('seed cross-tab q16 thiếu/sai');
if (!run("qWidget(qt('q16'),{}).indexOf('<table')>-1 && qWidget(qt('q16'),{}).indexOf('mẫu')>-1")) errs.push('cross-tab q16 không render bảng ma trận + nhãn mẫu');
/* Gate: cross-tab trỏ chiều KHÔNG có evAttr (show=src) phải bị validateFixture bắt */
run("DATA.qt.push({id:'qbad',kind:'show',show:'src',by:'pf',metric:'count',view:'table',chart:'rank',name:'bịa',note:''})");
if (!run("validateFixture().some(e => e.indexOf('qbad')>-1)")) errs.push('validateFixture không bắt cross-tab bịa số (show=src thiếu evAttr)');
run("DATA.qt = DATA.qt.filter(q => q.id !== 'qbad')");
/* Gate series: series chỉ chart — không được view bảng, không được ghép chéo (by) */
run("DATA.qt.push({id:'qbadv',kind:'series',view:'table',chart:'trend',name:'sai view',dim:'x',unit:'kỳ',shown:1,total:1,t:[{l:'a',p:[1]}]})");
if (!run("validateFixture().some(e => e.indexOf('qbadv')>-1 && e.indexOf('bảng')>-1)")) errs.push('validateFixture không bắt series view:bảng');
run("DATA.qt = DATA.qt.filter(q => q.id !== 'qbadv')");
run("DATA.qt.push({id:'qbadb',kind:'series',by:'pf',chart:'trend',name:'sai ghép',dim:'x',unit:'kỳ',shown:1,total:1,t:[{l:'a',p:[1]}]})");
if (!run("validateFixture().some(e => e.indexOf('qbadb')>-1)")) errs.push('validateFixture không bắt series có by (ghép chéo)');
run("DATA.qt = DATA.qt.filter(q => q.id !== 'qbadb')");
/* Builder: Lưu đè giữ id + cập nhật định nghĩa; Nhân bản tạo id mới */
const qEditN = run('DATA.qt.length');
run("qGoEdit('q1'); setQ('metric','pct')"); FIELDS['q-name'] = 'q1 sửa đè';
run("qSave(false)");
if (run("DATA.qt.length") !== qEditN || run("qt('q1').metric") !== 'pct' || run("qt('q1').name") !== 'q1 sửa đè')
  errs.push('Builder Lưu đè: không giữ id / không cập nhật định nghĩa');
run("qDuplicate('q1')");
const dupId = run("DATA.qt[DATA.qt.length-1].id");
if (run("DATA.qt.length") !== qEditN + 1 || !run(`qt('${dupId}').name.indexOf('(bản sao)')>-1`)) errs.push('Nhân bản: không tạo item mới / thiếu (bản sao)');
run(`qDelete('${dupId}')`);
run("qGoEdit('q1'); setQ('metric','count')"); FIELDS['q-name'] = 'Volume theo Theme'; run("qSave(false)");   /* khôi phục q1 */
/* Lọc theo view mặc định + theo nền dữ liệu */
run("ST.sel.qview='lib'; ST.sel.qSearch=''; ST.sel.qFilter='all'; ST.sel.qFilterV='table'");
if (goto('#/quantify', 'lọc view=bảng').indexOf('Theme × Nền tảng') === -1) errs.push('Lọc view=bảng không hiện item bảng (q16)');
run("ST.sel.qFilterV='all'; ST.sel.qFilterG='ev'");
const hG = goto('#/quantify', 'lọc nền=bằng chứng');
if (hG.indexOf('User Sentiment') === -1) errs.push('Lọc nền=ev không hiện item ev (q12)');
if (hG.indexOf('Volume theo Theme') > -1) errs.push('Lọc nền=ev vẫn hiện item agg — filter nền không tác dụng');
run("ST.sel.qFilterG='all'");
/* Thư viện KHÔNG còn drill-away (Q7 · thuần authoring) */
const hLib = goto('#/quantify', 'thư viện không drill');
if (hLib.indexOf('drillTopic') > -1 || hLib.indexOf('drillVoc') > -1 || hLib.indexOf('drillSource') > -1)
  errs.push('Thư viện Quantify vẫn còn drill-away (đáng lẽ thuần authoring)');

run("ST.sel.qb=null; ST.sel.quantify=null; ST.sel.qDel=null; ST.sel.qRen=null; ST.sel.qview=null; ST.sel.qDetail=null; ST.sel.qSearch=''; ST.sel.qFilter='all'; ST.sel.qFilterG='all'; ST.sel.qFilterV='all'; ST.sel.qViewOverride={}");
console.log('  Quantify thư viện: lưu +1, guard chặn xóa q14, đổi tên OK, xóa chart tự do → về ' + run('DATA.qt.length') + ' chart · 3 màn con render OK');

/* ---------- 12 · validateFixture() sau MỌI thao tác ---------- */
const bad = run('validateFixture()');
if (bad && bad.length) { errs.push('validateFixture() trả ' + bad.length + ' lỗi:'); bad.forEach((b) => errs.push('    · ' + b)); }
ROUTES.forEach((r) => goto('#/' + r, 'lượt cuối ' + r));

/* ---------- Kết quả ---------- */
console.log('');
if (errs.length) { console.log('✗ ' + errs.length + ' vấn đề:'); errs.forEach((e) => console.log('  ' + e)); process.exit(1); }
console.log('✓ Tất cả kiểm tra đạt · validateFixture() trả rỗng sau khi tạo issue, gán người và chạy hết chuỗi advance');
