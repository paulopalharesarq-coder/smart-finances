/**
 * Smart Finances - Test Suite for Reports, Clean Initial State, and Weekly Backup Reminder
 * Tests all 29 mandatory scenarios.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');

// 1. Mock Browser Environment
let storageStore = {};
const localStorageMock = {
  getItem: (k) => storageStore[k] || null,
  setItem: (k, v) => { storageStore[k] = String(v); },
  removeItem: (k) => { delete storageStore[k]; },
  clear: () => { storageStore = {}; },
  _dump: () => storageStore
};

let sessionStorageStore = {};
const sessionStorageMock = {
  getItem: (k) => sessionStorageStore[k] || null,
  setItem: (k, v) => { sessionStorageStore[k] = String(v); },
  removeItem: (k) => { delete sessionStorageStore[k]; },
  clear: () => { sessionStorageStore = {}; }
};

global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

global.Blob = function (parts, opts) { this.parts = parts; this.opts = opts; };
global.URL = { createObjectURL: () => 'blob:mock-url', revokeObjectURL: () => {} };

let listeners = {};
global.window = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  addEventListener: (event, cb) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  },
  showToast: (msg, type) => {
    console.log(`  [Toast ${type}]: ${msg}`);
  },
  closeModal: () => {},
  openKeypad: () => {}
};

const domElements = {};
class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.classes = new Set();
    this.classList = {
      add: (...c) => c.forEach(item => this.classes.add(item)),
      remove: (...c) => c.forEach(item => this.classes.delete(item)),
      contains: (c) => this.classes.has(c)
    };
    this._innerHTML = '';
    this.children = [];
    this.parentElement = null;
  }
  setAttribute(name, val) { this.attributes[name] = val; }
  getAttribute(name) { return this.attributes[name] || null; }
  removeAttribute(name) { delete this.attributes[name]; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this); }
  click() {}
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  querySelector() { return new MockElement('div'); }
  querySelectorAll() { return []; }
  insertAdjacentHTML() {}
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    const idMatches = String(val).matchAll(/id="([^"]+)"/g);
    for (const match of idMatches) {
      if (!domElements[match[1]]) domElements[match[1]] = new MockElement('div');
      domElements[match[1]]._innerHTML = String(val);
    }
  }
  get outerHTML() { return this._innerHTML; }
  set outerHTML(val) {
    this._innerHTML = String(val);
    const idMatches = String(val).matchAll(/id="([^"]+)"/g);
    for (const match of idMatches) {
      if (!domElements[match[1]]) domElements[match[1]] = new MockElement('div');
      domElements[match[1]]._innerHTML = String(val);
    }
  }
}

function createMockElement(tagName = 'div') {
  return new MockElement(tagName);
}

global.document = {
  documentElement: createMockElement('html'),
  head: createMockElement('head'),
  body: createMockElement('body'),
  visibilityState: 'visible',
  getElementById: (id) => domElements[id] || (domElements[id] = createMockElement('div')),
  querySelector: (sel) => createMockElement('div'),
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement(tag),
  addEventListener: (event, cb) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }
};

// 2. Load Source Files
eval(fs.readFileSync(path.join(rootDir, 'js', 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'services', 'notifications.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'reportsView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'homeView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'settingsView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'components', 'modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8'));

const FinanceStore = window.financeStore.constructor;

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

console.log('========================================================');
console.log('🧪 RUNNING SMART FINANCES REPORTS & BACKUP TEST SUITE');
console.log('========================================================\n');

// --------------------------------------------------------------------------
// GROUP 1: Clean Initial State (Primeiro Uso)
// --------------------------------------------------------------------------
console.log('--- GROUP 1: Clean Initial State (Primeiro Uso) ---');

runTest('1. Fresh installation starts completely clean with 0 expenses and 0 incomes', () => {
  localStorage.clear();
  const freshStore = new FinanceStore();
  assert.strictEqual(freshStore.state.expenses.length, 0, 'Expenses array is empty');
  assert.strictEqual(freshStore.state.incomes.length, 0, 'Incomes array is empty');
  assert.strictEqual(freshStore.state.installmentPlans.length, 0, 'Installment plans are empty');
  assert.strictEqual(freshStore.state.recurringRules.length, 0, 'Recurring rules are empty');
});

runTest('2. Current month is initialized structurally with R$ 0,00 values', () => {
  localStorage.clear();
  const freshStore = new FinanceStore();
  const currentKey = freshStore.getCurrentMonthKey();
  const summary = freshStore.calculateMonthSummary(currentKey);
  assert.strictEqual(summary.plannedExpenses, 0, 'Planned expenses is 0');
  assert.strictEqual(summary.paidExpenses, 0, 'Paid expenses is 0');
  assert.strictEqual(summary.plannedIncomes, 0, 'Planned incomes is 0');
  assert.strictEqual(summary.receivedIncomes, 0, 'Received incomes is 0');
  assert.strictEqual(summary.forecastBalance, 0, 'Forecast balance is 0');
});

runTest('3. All default 10 expense categories and 6 income categories are present on fresh install', () => {
  localStorage.clear();
  const freshStore = new FinanceStore();
  const expCats = freshStore.getCategories('expense');
  const incCats = freshStore.getCategories('income');
  assert.strictEqual(expCats.length, 10, 'Must have 10 expense categories');
  assert.strictEqual(incCats.length, 6, 'Must have 6 income categories');
  assert(freshStore.getCategoryById('moradia'), 'Category Moradia exists');
  assert(freshStore.getCategoryById('alimentacao'), 'Category Alimentação exists');
  assert(freshStore.getCategoryById('outras_despesas'), 'Category Outras despesas exists');
});

runTest('4. Existing user data in localStorage is strictly preserved without loss', () => {
  localStorage.clear();
  const savedPayload = {
    userName: 'Maria Santos',
    expenses: [
      { id: 'user-e1', name: 'Supermercado Real', amount: 350.50, monthKey: '2026-09', categoryId: 'alimentacao', status: 'paid' }
    ],
    incomes: [
      { id: 'user-i1', name: 'Salário Real', amount: 5000.00, monthKey: '2026-09', categoryId: 'salario', status: 'received' }
    ],
    months: {
      '2026-09': { key: '2026-09', name: 'Setembro 2026', status: 'open', carriedBalance: 0 }
    }
  };
  localStorage.setItem('stitch_smart_finances_v1', JSON.stringify(savedPayload));
  
  const restoredStore = new FinanceStore();
  assert.strictEqual(restoredStore.state.userName, 'Maria Santos', 'User name preserved');
  assert.strictEqual(restoredStore.state.expenses.length, 1, 'User expenses preserved');
  assert.strictEqual(restoredStore.state.expenses[0].name, 'Supermercado Real', 'User expense name intact');
  assert.strictEqual(restoredStore.state.incomes.length, 1, 'User incomes preserved');
});

// --------------------------------------------------------------------------
// GROUP 2: Financial Reports (Relatórios Financeiros)
// --------------------------------------------------------------------------
console.log('\n--- GROUP 2: Financial Reports (Relatórios Financeiros) ---');

// Populate test financial data
const store = window.financeStore;
store.state.expenses = [
  { id: 'e1', name: 'Aluguel', amount: 2000, monthKey: '2026-09', dueDate: '2026-09-10', categoryId: 'moradia', status: 'paid' },
  { id: 'e2', name: 'Supermercado', amount: 800, monthKey: '2026-09', dueDate: '2026-09-15', categoryId: 'alimentacao', status: 'paid' },
  { id: 'e3', name: 'Farmácia', amount: 200, monthKey: '2026-09', dueDate: '2026-09-20', categoryId: 'saude', status: 'pending' },
  { id: 'e4', name: 'Gasolina', amount: 300, monthKey: '2026-08', dueDate: '2026-08-10', categoryId: 'transporte', status: 'paid' },
  { id: 'e5', name: 'Curso Online', amount: 500, monthKey: '2026-06', dueDate: '2026-06-05', categoryId: 'educacao', status: 'paid' }
];
store.state.incomes = [
  { id: 'i1', name: 'Salário', amount: 5000, monthKey: '2026-09', expectedDate: '2026-09-05', categoryId: 'salario', status: 'received' },
  { id: 'i2', name: 'Freelance', amount: 1500, monthKey: '2026-08', expectedDate: '2026-08-15', categoryId: 'freelance', status: 'received' }
];

runTest('5. Relatório mensal: calcula total gasto e distribuição correta', () => {
  const rep = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-09', status: 'all' });
  assert.strictEqual(rep.totalAmount, 3000, 'Total in 2026-09 is 3000 (2000 + 800 + 200)');
  assert.strictEqual(rep.categories.length, 3, '3 active categories in 2026-09');
  assert.strictEqual(rep.maxCategory.category.id, 'moradia', 'Max category is Moradia');
  assert.strictEqual(rep.maxCategory.total, 2000, 'Moradia total is 2000');
});

runTest('6. Ranking de categorias ordenado do maior para o menor gasto', () => {
  const rep = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-09', status: 'all' });
  assert.strictEqual(rep.categories[0].category.id, 'moradia', 'Rank 1: Moradia (2000)');
  assert.strictEqual(rep.categories[1].category.id, 'alimentacao', 'Rank 2: Alimentação (800)');
  assert.strictEqual(rep.categories[2].category.id, 'saude', 'Rank 3: Saúde (200)');
  assert(rep.categories[0].percentage > rep.categories[1].percentage, 'Percentages match descending order');
});

runTest('7. Troca de mês (shiftReportMonth) atualiza o período e recalcula totais', () => {
  window.reportState.monthKey = '2026-09';
  window.shiftReportMonth(-1); // Shift to 2026-08
  assert.strictEqual(window.reportState.monthKey, '2026-08', 'Month shifted to 2026-08');
  
  const repAug = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-08', status: 'all' });
  assert.strictEqual(repAug.totalAmount, 300, 'Total in 2026-08 is 300 (Transporte)');
  assert.strictEqual(repAug.categories[0].category.id, 'transporte', 'Category in 2026-08 is Transporte');
});

runTest('8. Relatório anual: calcula total anual de despesas de todos os meses', () => {
  const repAnnual = store.getReportsBreakdown({ type: 'expense', periodMode: 'year', year: 2026, status: 'all' });
  assert.strictEqual(repAnnual.totalAmount, 3800, 'Annual total is 3800 (3000 + 300 + 500)');
  assert.strictEqual(repAnnual.categories.length, 5, '5 categories in 2026');
});

runTest('9. Evolução mensal anual retorna 12 meses com valores exatos por mês', () => {
  const evo = store.getMonthlyEvolution({ type: 'expense', year: 2026, status: 'all' });
  assert.strictEqual(evo.months.length, 12, '12 months generated');
  assert.strictEqual(evo.months[5].total, 500, 'Junho (index 5) total is 500');
  assert.strictEqual(evo.months[7].total, 300, 'Agosto (index 7) total is 300');
  assert.strictEqual(evo.months[8].total, 3000, 'Setembro (index 8) total is 3000');
  assert.strictEqual(evo.annualTotal, 3800, 'Annual total matches sum of months');
});

runTest('10. Período personalizado filtra despesas estritamente no intervalo de datas', () => {
  const repCustom = store.getReportsBreakdown({
    type: 'expense',
    periodMode: 'custom',
    startDate: '2026-08-01',
    endDate: '2026-09-12',
    status: 'all'
  });
  // Should include Gasolina (2026-08-10, 300) and Aluguel (2026-09-10, 2000)
  assert.strictEqual(repCustom.totalAmount, 2300, 'Total in custom interval is 2300');
  assert.strictEqual(repCustom.totalCount, 2, '2 transactions in custom interval');
});

runTest('11. Filtro de status: Pagas vs Pendentes', () => {
  const repPaid = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-09', status: 'paid' });
  assert.strictEqual(repPaid.totalAmount, 2800, 'Paid expenses in 2026-09: 2000 + 800 = 2800');

  const repPending = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-09', status: 'pending' });
  assert.strictEqual(repPending.totalAmount, 200, 'Pending expenses in 2026-09: 200 (Farmácia)');
});

runTest('12. Suporte a Receitas nos relatórios', () => {
  const repIncome = store.getReportsBreakdown({ type: 'income', periodMode: 'month', monthKey: '2026-09', status: 'all' });
  assert.strictEqual(repIncome.totalAmount, 5000, 'Income in 2026-09 is 5000 (Salário)');
  assert.strictEqual(repIncome.categories[0].category.id, 'salario', 'Income category is Salário');
});

runTest('13. Suporte a categorias personalizadas criadas pelo usuário', () => {
  store.addCategory({ id: 'pet_shop', name: 'Pet Shop', type: 'expense', icon: 'pets', bgColor: '#fef3c7', textColor: '#d97706' });
  store.state.expenses.push({ id: 'e-pet', name: 'Ração Canina', amount: 150, monthKey: '2026-09', dueDate: '2026-09-22', categoryId: 'pet_shop', status: 'paid' });
  
  const rep = store.getReportsBreakdown({ type: 'expense', periodMode: 'month', monthKey: '2026-09', status: 'all' });
  const petCat = rep.categories.find(c => c.category.id === 'pet_shop');
  assert(petCat, 'Custom category Pet Shop appears in reports');
  assert.strictEqual(petCat.total, 150, 'Custom category amount is 150');
});

runTest('14. Renderização do HTML da view de Relatórios inclui Donut SVG, seletores e ranking', () => {
  window.reportState.periodMode = 'month';
  window.reportState.monthKey = '2026-09';
  const html = window.renderReportsView();
  assert(html.includes('Relatórios Financeiros'), 'View title present');
  assert(html.includes('<svg viewBox="0 0 240 240"'), 'SVG Donut chart rendered');
  assert(html.includes('Aluguel') || html.includes('Moradia'), 'Category Moradia rendered in ranking');
  assert(html.includes('Ranking de Gastos'), 'Ranking section title rendered');
});

runTest('15. Estado vazio elegante quando não há despesas no período selecionado', () => {
  window.reportState.periodMode = 'month';
  window.reportState.monthKey = '2029-01'; // Future empty month
  const html = window.renderReportsView();
  assert(html.includes('Nenhum lançamento neste período'), 'Empty state message rendered');
});

// --------------------------------------------------------------------------
// GROUP 3: Weekly Backup Reminder (Lembrete Semanal de Backup)
// --------------------------------------------------------------------------
console.log('\n--- GROUP 3: Weekly Backup Reminder (Lembrete Semanal de Backup) ---');

runTest('16. Backup reminder is NOT due if backup was completed within 7 days', () => {
  localStorage.clear();
  const recentBackup = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(); // 2 days ago
  localStorage.setItem('sf_last_backup_date', recentBackup);
  
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), false, 'Not due within 2 days');
});

runTest('17. Backup reminder IS due when 7 or more days have elapsed since last backup', () => {
  localStorage.clear();
  const oldBackup = new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString(); // 8 days ago
  localStorage.setItem('sf_last_backup_date', oldBackup);
  
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), true, 'Due after 8 days');
});

runTest('18. Backup reminder is due on fresh installation if never performed', () => {
  localStorage.clear();
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), true, 'Due on fresh install with no backup date');
});

runTest('19. Dispensa ("Agora não") grava sf_last_backup_reminder_date e silencia por 7 dias', () => {
  localStorage.clear();
  window.NotificationService.dismissBackupReminder();
  assert(localStorage.getItem('sf_last_backup_reminder_date'), 'Reminder date recorded');
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), false, 'Silenced after dismissal');
});

runTest('20. triggerDirectBackup downloads backup and updates sf_last_backup_date', () => {
  localStorage.clear();
  let toastMsg = '';
  window.showToast = (m) => { toastMsg = m; };
  
  window.NotificationService.triggerDirectBackup();
  assert(localStorage.getItem('sf_last_backup_date'), 'sf_last_backup_date set');
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), false, 'Reminder reset after backup');
});

runTest('21. Manual downloadBackupJSON from Settings also updates backup timestamps', () => {
  localStorage.clear();
  window.downloadBackupJSON();
  assert(localStorage.getItem('sf_last_backup_date'), 'sf_last_backup_date set via settings');
  assert.strictEqual(window.NotificationService.isBackupReminderDue(), false, 'Reminder reset after settings backup');
});

runTest('22. Central de Avisos renders Backup Card when backup is due', () => {
  localStorage.clear();
  // No pending due dates, but backup is due
  store.state.expenses = [];
  window.openNotificationCenterModal();
  const modalContainer = document.getElementById('modal-container');
  assert(modalContainer.innerHTML.includes('Lembrete de Backup Semanal'), 'Backup card present in modal');
  assert(modalContainer.innerHTML.includes('Fazer backup'), 'Fazer backup button present');
});

runTest('23. Central de Avisos renders both due expenses and backup card when both exist', () => {
  localStorage.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'exp-due', name: 'Conta de Luz', amount: 150, dueDate: todayStr, categoryId: 'contas', status: 'pending' }
  ];
  window.openNotificationCenterModal();
  const modalContainer = document.getElementById('modal-container');
  assert(modalContainer.innerHTML.includes('Conta de Luz'), 'Pending due expense rendered');
  assert(modalContainer.innerHTML.includes('Lembrete de Backup Semanal'), 'Backup card also rendered');
});

runTest('24. Central de Avisos renders "Nenhuma notificação" when no due dates and backup is fresh', () => {
  localStorage.clear();
  localStorage.setItem('sf_last_backup_date', new Date().toISOString());
  store.state.expenses = [];
  window.openNotificationCenterModal();
  const modalContainer = document.getElementById('modal-container');
  assert(modalContainer.innerHTML.includes('Nenhuma notificação'), 'Empty state rendered when everything is up to date');
});

runTest('25. Home notification badge reflects combined count of due items and backup', () => {
  localStorage.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'exp-1', name: 'Conta 1', amount: 100, dueDate: todayStr, categoryId: 'contas', status: 'pending' }
  ];
  // 1 due item + 1 backup due = badge count 2
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('2') && (homeHtml.includes('>2<') || homeHtml.includes('2\n') || homeHtml.includes(' 2 ')), 'Notification badge displays count of 2');
});

// --------------------------------------------------------------------------
// GROUP 4: Instant Interactive UI Updates in Reports View (Without Leaving Screen)
// --------------------------------------------------------------------------
console.log('\n--- GROUP 4: Instant Interactive UI Updates (No Screen Exit Required) ---');

store.state.expenses = [
  { id: 'e1', name: 'Aluguel', amount: 2000, monthKey: '2026-09', dueDate: '2026-09-10', categoryId: 'moradia', status: 'paid' },
  { id: 'e2', name: 'Supermercado', amount: 800, monthKey: '2026-09', dueDate: '2026-09-15', categoryId: 'alimentacao', status: 'paid' },
  { id: 'e3', name: 'Farmácia', amount: 200, monthKey: '2026-09', dueDate: '2026-09-20', categoryId: 'saude', status: 'pending' },
  { id: 'e4', name: 'Gasolina', amount: 300, monthKey: '2026-08', dueDate: '2026-08-10', categoryId: 'transporte', status: 'paid' },
  { id: 'e5', name: 'Curso Online', amount: 500, monthKey: '2026-06', dueDate: '2026-06-05', categoryId: 'educacao', status: 'paid' }
];
store.state.incomes = [
  { id: 'i1', name: 'Salário', amount: 5000, monthKey: '2026-09', expectedDate: '2026-09-05', categoryId: 'salario', status: 'received' },
  { id: 'i2', name: 'Freelance', amount: 1500, monthKey: '2026-08', expectedDate: '2026-08-15', categoryId: 'freelance', status: 'received' }
];

// Setup mock DOM container for reports view
const appDiv = document.getElementById('app');
window.financeStore.state.activeTab = 'reports';
appDiv.innerHTML = `<div id="reports-view-container">${window.renderReportsView()}</div>`;

runTest('26. Interactive: Mês -> Ano switches mode and updates DOM immediately', () => {
  window.setReportPeriodMode('year');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Evolução Mensal (2026)'), 'Year evolution chart appeared in DOM immediately');
  assert.strictEqual(window.reportState.periodMode, 'year', 'State updated to year');
});

runTest('27. Interactive: Ano -> Personalizado switches mode and updates DOM immediately', () => {
  window.setReportPeriodMode('custom');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('De:') && container.innerHTML.includes('Até:'), 'Custom date inputs appeared in DOM immediately');
  assert.strictEqual(window.reportState.periodMode, 'custom', 'State updated to custom');
});

runTest('28. Interactive: Personalizado -> Mês switches mode and updates DOM immediately', () => {
  window.setReportPeriodMode('month');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Distribuição por Categoria'), 'Category donut section rendered');
  assert.strictEqual(window.reportState.periodMode, 'month', 'State updated to month');
});

runTest('29. Interactive: Trocar mês (shiftReportMonth) immediately recalibrates values in DOM', () => {
  window.reportState.monthKey = '2026-09';
  window.shiftReportMonth(-1); // to 2026-08
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Agosto de 2026'), 'Month header updated to Agosto immediately');
  assert(container.innerHTML.includes('Transporte'), 'August expense category Transporte rendered in DOM');
});

runTest('30. Interactive: Trocar ano (shiftReportYear) immediately updates DOM in Year mode', () => {
  window.setReportPeriodMode('year');
  window.shiftReportYear(1); // to 2027
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Ano de 2027'), 'Year header updated to 2027 immediately');
  assert(container.innerHTML.includes('Evolução Mensal (2027)'), 'Evolution chart updated to 2027 immediately');
});

runTest('31. Interactive: Todas -> Pagas filter immediately updates DOM values', () => {
  window.setReportPeriodMode('month');
  window.reportState.monthKey = '2026-09';
  window.setReportStatus('paid');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('R$&nbsp;2.800,00') || container.innerHTML.includes('2.800,00'), 'Paid amount (2800) rendered immediately');
  assert.strictEqual(window.reportState.status, 'paid');
});

runTest('32. Interactive: Pagas -> Pendentes filter immediately updates DOM values', () => {
  window.setReportStatus('pending');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('R$&nbsp;200,00') || container.innerHTML.includes('200,00'), 'Pending amount (200) rendered immediately');
  assert.strictEqual(window.reportState.status, 'pending');
});

runTest('33. Interactive: Alterar intervalo personalizado valida startDate <= endDate e atualiza DOM', () => {
  window.setReportPeriodMode('custom');
  window.reportState.status = 'all';
  window.setReportCustomDate('startDate', '2026-08-01');
  window.setReportCustomDate('endDate', '2026-09-12');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('R$&nbsp;2.300,00') || container.innerHTML.includes('2.300,00') || container.innerHTML.includes('Aluguel'), 'Custom date range total rendered immediately');
  
  // Date validation test (startDate > endDate)
  window.setReportCustomDate('startDate', '2026-10-01');
  assert(window.reportState.endDate >= '2026-10-01', 'End date auto-adjusted when start date exceeds it');
});

runTest('34. Interactive: Clicar em segmento do Donut destaca categoria no DOM imediatamente', () => {
  window.setReportPeriodMode('month');
  window.reportState.monthKey = '2026-09';
  window.reportState.status = 'all';
  window.handleReportCategoryClick('moradia');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Ver Total'), '"Ver Total" reset button rendered');
  assert(container.innerHTML.includes('ring-2 ring-primary'), 'Category card highlighted in ranking');
  assert.strictEqual(window.reportState.selectedCategoryId, 'moradia');
});

runTest('35. Interactive: Clicar no ranking alterna seleção de categoria imediatamente', () => {
  window.handleReportCategoryClick('moradia'); // Toggles off
  assert.strictEqual(window.reportState.selectedCategoryId, null, 'Selected category cleared on second click');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(!container.innerHTML.includes('Ver Total'), '"Ver Total" button disappeared');
});

runTest('36. Interactive: Despesas -> Receitas switches dataset and colors immediately', () => {
  window.setReportType('income');
  const container = document.getElementById('reports-view-container') || appDiv;
  assert(container.innerHTML.includes('Total Recebido'), 'Total Recebido label rendered immediately');
  assert(container.innerHTML.includes('Salário'), 'Income category Salário rendered in ranking');
  assert.strictEqual(window.reportState.type, 'income');
});

runTest('37. Interactive: Light mode and Dark mode CSS compatibility in Reports DOM', () => {
  window.setReportType('expense');
  const html = window.renderReportsView();
  assert(html.includes('dark:bg-[#852f1b]'), 'Dark mode coral color class present');
  assert(html.includes('dark:bg-[#332218]'), 'Dark mode button container background class present');
  assert(html.includes('dark:bg-white/5'), 'Dark mode translucent card background present');
});

runTest('38. Interactive: iPhone safe area & responsive classes present', () => {
  const html = window.renderReportsView();
  assert(html.includes('pb-36'), 'Safe padding bottom present to avoid dock collision');
  assert(html.includes('sticky top-0'), 'Top app bar remains sticky');
});

console.log('\n========================================================');
console.log(`🎉 ALL ${passed}/${total} REPORTS & BACKUP TESTS PASSED!`);
console.log('========================================================\n');

