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
const el = () => ({ innerHTML:'', className:'', scrollTop:0, value:'', focus(){}, setSelectionRange(){} });
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
run(`(() => { const miss = Object.keys(V).filter(k => k !== 'issue' && ${JSON.stringify(ROUTES)}.indexOf(k) === -1);
     if (miss.length) throw new Error('route không có trong ROUTES: ' + miss.join(', ')); })()`, 'ROUTES phủ hết V');
run("DATA.iss.forEach(i => { location.hash = '#/issue/' + i.id; route(); })", 'issue detail loop');
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

/* ---------- 2b · Hai Tổng quan: mọi set, mọi thao tác tùy chỉnh ---------- */
run("DATA.dash.forEach(d => { location.hash = '#/' + d.sec + '/' + d.id; route(); })", 'mọi set dashboard');
['voc','cxm'].forEach((sec) => {
  const first = run(`DATA.dash.find(d => d.sec === '${sec}').id`);
  run(`ST.sub['edit-${sec}']=true`); goto('#/' + sec + '/' + first, sec + ' · chế độ tùy chỉnh');
  if (view().indexOf('blkx') === -1) errs.push(`${sec}: bật Tùy chỉnh nhưng không có nút bỏ khối`);
  /* bỏ hết khối của câu hỏi đầu rồi thêm lại — set vẫn phải render */
  run(`byId(DATA.dash,'${first}').qs[0].b.slice().forEach(b => blkDel('${first}',0,b))`, sec + ' · bỏ khối');
  goto('#/' + sec + '/' + first, sec + ' · sau khi bỏ hết khối câu 1');
  if (view().indexOf('chưa có khối nào') === -1) errs.push(`${sec}: bỏ hết khối mà không báo câu hỏi rỗng`);
  const blk = run(`Object.keys(BLOCKS).filter(k => BLOCKS[k].sec === '${sec}')[0]`);
  run(`blkAdd('${first}',0,'${blk}')`, sec + ' · thêm khối');
  goto('#/' + sec + '/' + first, sec + ' · sau khi thêm khối');
  run(`boardReset('${first}')`);
  goto('#/' + sec + '/' + first, sec + ' · sau khi trả về mặc định');
  if (run(`!!ST.boards['${first}']`)) errs.push(`${sec}: trả về mặc định nhưng ST.boards còn dấu vết`);
  run(`ST.sub['edit-${sec}']=false`);
});
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
run(`(() => { let n = 0;
  Object.keys(DIMS).forEach(s => Object.keys(METRICS).forEach(m => ['rank','donut'].forEach(c => {
    ST.sel.qb = { show:s, metric:m, chart:c };
    const h = V.quantify();
    if (!h || h.length < 2000) throw new Error('tổ hợp ' + s + '/' + m + '/' + c + ' dựng hỏng');
    n++; })));
  console.log('  Quantify builder: ' + n + ' tổ hợp dựng được'); })()`, 'Quantify builder');
run("ST.sel.qb=null");

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

/* ---------- 12 · validateFixture() sau MỌI thao tác ---------- */
const bad = run('validateFixture()');
if (bad && bad.length) { errs.push('validateFixture() trả ' + bad.length + ' lỗi:'); bad.forEach((b) => errs.push('    · ' + b)); }
ROUTES.forEach((r) => goto('#/' + r, 'lượt cuối ' + r));

/* ---------- Kết quả ---------- */
console.log('');
if (errs.length) { console.log('✗ ' + errs.length + ' vấn đề:'); errs.forEach((e) => console.log('  ' + e)); process.exit(1); }
console.log('✓ Tất cả kiểm tra đạt · validateFixture() trả rỗng sau khi tạo issue, gán người và chạy hết chuỗi advance');
