import type { Reporter, File, Task, Suite } from 'vitest';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

interface TestData {
  id: string;
  name: string;
  fullName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  httpInteractions: Array<{
    request: { method: string; url: string; body?: unknown; hasAuth: boolean };
    response: { statusCode: number; body: string };
  }>;
}

interface SuiteData {
  name: string;
  tests: TestData[];
  suites: SuiteData[];
}

interface FileData {
  name: string;
  suites: SuiteData[];
  tests: TestData[];
}

function collectTests(task: Task): TestData {
  const meta = (task as Task & { meta?: Record<string, unknown> }).meta;
  const interactions = (meta?.httpInteractions as TestData['httpInteractions']) || [];
  const result = (task as Task & { result?: { state?: string; duration?: number } }).result;

  return {
    id: task.id,
    name: task.name,
    fullName: task.name,
    status: result?.state === 'pass' ? 'pass' : result?.state === 'fail' ? 'fail' : 'skip',
    duration: result?.duration || 0,
    httpInteractions: interactions,
  };
}

function collectSuite(suite: Suite): SuiteData {
  const tests: TestData[] = [];
  const suites: SuiteData[] = [];

  for (const task of suite.tasks) {
    if (task.type === 'test') {
      tests.push(collectTests(task));
    } else if (task.type === 'suite') {
      suites.push(collectSuite(task as Suite));
    }
  }

  return { name: suite.name, tests, suites };
}

function collectFile(file: File): FileData {
  const tests: TestData[] = [];
  const suites: SuiteData[] = [];

  for (const task of file.tasks) {
    if (task.type === 'test') {
      tests.push(collectTests(task));
    } else if (task.type === 'suite') {
      suites.push(collectSuite(task as Suite));
    }
  }

  const name = file.name.replace(/^.*[/\\]/, '');
  return { name, tests, suites };
}

function generateHtml(files: FileData[]): string {
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let totalRequests = 0;

  function countStats(suiteData: SuiteData) {
    for (const t of suiteData.tests) {
      totalTests++;
      if (t.status === 'pass') passed++;
      else if (t.status === 'fail') failed++;
      else skipped++;
      totalRequests += t.httpInteractions.length;
    }
    for (const s of suiteData.suites) countStats(s);
  }

  for (const f of files) {
    for (const t of f.tests) {
      totalTests++;
      if (t.status === 'pass') passed++;
      else if (t.status === 'fail') failed++;
      else skipped++;
      totalRequests += t.httpInteractions.length;
    }
    for (const s of f.suites) countStats(s);
  }

  const dataJson = JSON.stringify(files);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>API Test Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; background: #0d1117; color: #c9d1d9; display: flex; flex-direction: column; height: 100vh; }

  /* Top Bar */
  .top-bar { background: #161b22; border-bottom: 1px solid #30363d; padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
  .top-bar h1 { font-size: 16px; font-weight: 600; color: #e6edf3; white-space: nowrap; }
  .stats { display: flex; gap: 12px; font-size: 13px; }
  .stat { padding: 4px 10px; border-radius: 12px; font-weight: 500; }
  .stat-total { background: #1f2937; color: #93a3b8; }
  .stat-pass { background: #0d2818; color: #3fb950; }
  .stat-fail { background: #3d1214; color: #f85149; }
  .stat-skip { background: #2d2000; color: #d29922; }
  .stat-requests { background: #0c2d6b; color: #58a6ff; }
  .search-box { margin-left: auto; display: flex; gap: 8px; align-items: center; }
  .search-box input { background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; padding: 6px 12px; border-radius: 6px; font-size: 13px; width: 220px; }
  .search-box input:focus { outline: none; border-color: #58a6ff; }
  .filter-btn { background: #21262d; border: 1px solid #30363d; color: #8b949e; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }
  .filter-btn:hover { border-color: #58a6ff; color: #c9d1d9; }
  .filter-btn.active { background: #1f6feb; border-color: #1f6feb; color: #fff; }

  /* Layout */
  .content { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .sidebar { width: 360px; min-width: 280px; background: #161b22; border-right: 1px solid #30363d; overflow-y: auto; flex-shrink: 0; }
  .file-node { border-bottom: 1px solid #21262d; }
  .file-header { padding: 10px 14px; font-size: 13px; font-weight: 600; color: #e6edf3; cursor: pointer; display: flex; align-items: center; gap: 8px; user-select: none; }
  .file-header:hover { background: #1c2128; }
  .file-header .arrow { transition: transform 0.15s; font-size: 10px; color: #484f58; }
  .file-header .arrow.open { transform: rotate(90deg); }
  .suite-node { }
  .suite-header { padding: 6px 14px 6px 28px; font-size: 12px; font-weight: 600; color: #8b949e; cursor: pointer; display: flex; align-items: center; gap: 6px; user-select: none; }
  .suite-header:hover { background: #1c2128; }
  .test-item { padding: 5px 14px 5px 42px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; color: #8b949e; }
  .test-item:hover { background: #1c2128; }
  .test-item.selected { background: #1f2937; color: #e6edf3; }
  .test-item .icon { font-size: 11px; flex-shrink: 0; }
  .test-item .icon.pass { color: #3fb950; }
  .test-item .icon.fail { color: #f85149; }
  .test-item .icon.skip { color: #d29922; }
  .test-item .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .badge { background: #0c2d6b; color: #58a6ff; font-size: 10px; padding: 1px 6px; border-radius: 8px; font-weight: 600; flex-shrink: 0; }
  .nested-suite .suite-header { padding-left: 42px; }
  .nested-suite .test-item { padding-left: 56px; }
  .hidden { display: none; }

  /* Main Panel */
  .main-panel { flex: 1; overflow-y: auto; padding: 24px; }
  .empty-state { display: flex; align-items: center; justify-content: center; height: 100%; color: #484f58; font-size: 14px; }
  .test-detail h2 { font-size: 16px; color: #e6edf3; margin-bottom: 4px; }
  .test-meta { font-size: 12px; color: #8b949e; margin-bottom: 20px; display: flex; gap: 12px; }
  .test-meta .status-badge { padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; }
  .test-meta .status-badge.pass { background: #0d2818; color: #3fb950; }
  .test-meta .status-badge.fail { background: #3d1214; color: #f85149; }
  .test-meta .status-badge.skip { background: #2d2000; color: #d29922; }
  .no-interactions { color: #484f58; font-size: 13px; font-style: italic; }

  /* HTTP Card */
  .http-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
  .http-card-header { padding: 12px 16px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #30363d; cursor: pointer; user-select: none; }
  .http-card-header:hover { background: #1c2128; }
  .http-method { font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
  .method-GET { background: #0d2818; color: #3fb950; }
  .method-POST { background: #0c2d6b; color: #58a6ff; }
  .method-PUT { background: #2d2000; color: #d29922; }
  .method-PATCH { background: #2d2000; color: #d29922; }
  .method-DELETE { background: #3d1214; color: #f85149; }
  .http-url { font-size: 13px; color: #c9d1d9; flex: 1; font-family: monospace; }
  .http-status { font-weight: 700; font-size: 12px; padding: 2px 8px; border-radius: 4px; }
  .status-2xx { background: #0d2818; color: #3fb950; }
  .status-3xx { background: #0c2d6b; color: #58a6ff; }
  .status-4xx { background: #2d2000; color: #d29922; }
  .status-5xx { background: #3d1214; color: #f85149; }
  .http-auth { font-size: 11px; color: #8b949e; }
  .http-card-body { display: none; }
  .http-card-body.open { display: block; }
  .http-section { border-bottom: 1px solid #21262d; }
  .http-section:last-child { border-bottom: none; }
  .http-section-label { font-size: 11px; font-weight: 600; color: #8b949e; padding: 8px 16px 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .json-view { padding: 8px 16px 12px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; overflow-x: auto; }
  .json-key { color: #79c0ff; }
  .json-string { color: #a5d6ff; }
  .json-number { color: #d2a8ff; }
  .json-boolean { color: #ff7b72; }
  .json-null { color: #8b949e; }
  .json-bracket { color: #8b949e; }
  .json-none { color: #484f58; font-style: italic; }
</style>
</head>
<body>
<div class="top-bar">
  <h1>API Test Report</h1>
  <div class="stats">
    <span class="stat stat-total">${totalTests} tests</span>
    <span class="stat stat-pass">${passed} passed</span>
    ${failed > 0 ? `<span class="stat stat-fail">${failed} failed</span>` : ''}
    ${skipped > 0 ? `<span class="stat stat-skip">${skipped} skipped</span>` : ''}
    <span class="stat stat-requests">${totalRequests} requests</span>
  </div>
  <div class="search-box">
    <input type="text" id="searchInput" placeholder="Search tests..." />
    <button class="filter-btn" data-filter="all" onclick="setFilter('all')">All</button>
    <button class="filter-btn" data-filter="pass" onclick="setFilter('pass')">Pass</button>
    <button class="filter-btn" data-filter="fail" onclick="setFilter('fail')">Fail</button>
  </div>
</div>
<div class="content">
  <div class="sidebar" id="sidebar"></div>
  <div class="main-panel" id="mainPanel">
    <div class="empty-state">Select a test to view HTTP interactions</div>
  </div>
</div>
<script>
const DATA = ${dataJson};
let selectedTestId = null;
let currentFilter = 'all';
let searchTerm = '';

const allTests = [];

function indexTests(suites, tests) {
  for (const t of tests) allTests.push(t);
  for (const s of suites) indexTests(s.suites, s.tests);
}
for (const f of DATA) indexTests(f.suites, f.tests);

function statusIcon(status) {
  if (status === 'pass') return '<span class="icon pass">\\u2713</span>';
  if (status === 'fail') return '<span class="icon fail">\\u2717</span>';
  return '<span class="icon skip">\\u25CB</span>';
}

function statusClass(code) {
  if (code >= 200 && code < 300) return 'status-2xx';
  if (code >= 300 && code < 400) return 'status-3xx';
  if (code >= 400 && code < 500) return 'status-4xx';
  return 'status-5xx';
}

function syntaxHighlight(obj) {
  if (obj === undefined || obj === null) return '<span class="json-none">(none)</span>';
  let str;
  if (typeof obj === 'string') {
    try { obj = JSON.parse(obj); } catch { return escHtml(obj); }
  }
  str = JSON.stringify(obj, null, 2);
  return str.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)/g, function(match) {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
        match = match.slice(0, -1) + ':';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function matchesFilter(test) {
  if (currentFilter !== 'all' && test.status !== currentFilter) return false;
  if (searchTerm && !test.name.toLowerCase().includes(searchTerm)) return false;
  return true;
}

function renderSidebar() {
  const sb = document.getElementById('sidebar');
  let html = '';
  for (const file of DATA) {
    html += renderFileNode(file);
  }
  sb.innerHTML = html;
}

function renderFileNode(file) {
  const hasVisible = hasVisibleTests(file.suites, file.tests);
  return '<div class="file-node' + (hasVisible ? '' : ' hidden') + '">'
    + '<div class="file-header" onclick="toggleCollapse(this)">'
    + '<span class="arrow open">\\u25B6</span>' + escHtml(file.name) + '</div>'
    + '<div class="file-children">'
    + file.tests.map(t => renderTestItem(t)).join('')
    + file.suites.map(s => renderSuiteNode(s, false)).join('')
    + '</div></div>';
}

function renderSuiteNode(suite, nested) {
  const hasVisible = hasVisibleTests(suite.suites, suite.tests);
  return '<div class="suite-node' + (nested ? ' nested-suite' : '') + (hasVisible ? '' : ' hidden') + '">'
    + '<div class="suite-header" onclick="toggleCollapse(this)">'
    + '<span class="arrow open">\\u25B6</span>' + escHtml(suite.name) + '</div>'
    + '<div class="suite-children">'
    + suite.tests.map(t => renderTestItem(t)).join('')
    + suite.suites.map(s => renderSuiteNode(s, true)).join('')
    + '</div></div>';
}

function hasVisibleTests(suites, tests) {
  for (const t of tests) { if (matchesFilter(t)) return true; }
  for (const s of suites) { if (hasVisibleTests(s.suites, s.tests)) return true; }
  return false;
}

function renderTestItem(test) {
  if (!matchesFilter(test)) return '';
  const reqCount = test.httpInteractions.length;
  const sel = test.id === selectedTestId ? ' selected' : '';
  return '<div class="test-item' + sel + '" data-id="' + test.id + '" onclick="selectTest(\\'' + test.id + '\\')">'
    + statusIcon(test.status)
    + '<span class="name">' + escHtml(test.name) + '</span>'
    + (reqCount > 0 ? '<span class="badge">' + reqCount + '</span>' : '')
    + '</div>';
}

function selectTest(id) {
  selectedTestId = id;
  const test = allTests.find(t => t.id === id);
  if (!test) return;
  renderSidebar();
  renderDetail(test);
}

function renderDetail(test) {
  const mp = document.getElementById('mainPanel');
  if (!test.httpInteractions.length) {
    mp.innerHTML = '<div class="test-detail"><h2>' + escHtml(test.name) + '</h2>'
      + '<div class="test-meta"><span class="status-badge ' + test.status + '">' + test.status.toUpperCase() + '</span>'
      + '<span>' + test.duration + 'ms</span></div>'
      + '<p class="no-interactions">No HTTP interactions recorded</p></div>';
    return;
  }
  let html = '<div class="test-detail"><h2>' + escHtml(test.name) + '</h2>'
    + '<div class="test-meta"><span class="status-badge ' + test.status + '">' + test.status.toUpperCase() + '</span>'
    + '<span>' + test.duration + 'ms</span>'
    + '<span>' + test.httpInteractions.length + ' request(s)</span></div>';

  test.httpInteractions.forEach((h, i) => {
    const cardId = 'card-' + i;
    html += '<div class="http-card">'
      + '<div class="http-card-header" onclick="toggleCard(\\'' + cardId + '\\')">'
      + '<span class="http-method method-' + h.request.method + '">' + h.request.method + '</span>'
      + '<span class="http-url">' + escHtml(h.request.url) + '</span>'
      + '<span class="http-status ' + statusClass(h.response.statusCode) + '">' + h.response.statusCode + '</span>'
      + (h.request.hasAuth ? '<span class="http-auth">\\uD83D\\uDD12</span>' : '')
      + '</div>'
      + '<div class="http-card-body open" id="' + cardId + '">'
      + '<div class="http-section"><div class="http-section-label">Request Body</div>'
      + '<div class="json-view">' + syntaxHighlight(h.request.body) + '</div></div>'
      + '<div class="http-section"><div class="http-section-label">Response Body</div>'
      + '<div class="json-view">' + syntaxHighlight(h.response.body) + '</div></div>'
      + '</div></div>';
  });

  html += '</div>';
  mp.innerHTML = html;
}

function toggleCard(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}

function toggleCollapse(header) {
  const arrow = header.querySelector('.arrow');
  const children = header.nextElementSibling;
  if (children) children.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('open');
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
  renderSidebar();
}

document.getElementById('searchInput').addEventListener('input', function(e) {
  searchTerm = e.target.value.toLowerCase();
  renderSidebar();
});

// Initial render
setFilter('all');
</script>
</body>
</html>`;
}

export default class HttpHtmlReporter implements Reporter {
  onFinished(files?: File[]) {
    if (!files || files.length === 0) return;

    const collected = files.map(collectFile);
    const html = generateHtml(collected);

    const outDir = resolve(process.cwd(), 'api-test-report');
    mkdirSync(outDir, { recursive: true });
    const outPath = resolve(outDir, 'index.html');
    writeFileSync(outPath, html, 'utf-8');

    console.log(`\n  HTTP Report: ${outPath}\n`);
  }
}
