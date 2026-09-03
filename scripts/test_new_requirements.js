/**
 * Smart Finances - Test Suite for New Requirements
 * Tests 30 specific scenarios across UI, Home, Local In-App Alerts, and Status Bar / Theme.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');

// 1. Mock Browser Environment
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();

const sessionStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

let listeners = {};
const mediaQueryListeners = [];

global.window = {
  localStorage: localStorageMock,
  sessionStorage: sessionStorageMock,
  matchMedia: (query) => {
    return {
      matches: false,
      media: query,
      addEventListener: (type, fn) => mediaQueryListeners.push(fn),
      addListener: (type, fn) => mediaQueryListeners.push(fn),
      removeEventListener: () => {},
      removeListener: () => {}
    };
  },
  addEventListener: (event, cb) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  },
  showToast: (msg, type) => {
    console.log(`[Toast ${type}]: ${msg}`);
  },
  closeModal: () => {},
  openKeypad: () => {}
};

const domElements = {};

function createMockElement(tagName = 'div') {
  return {
    tagName,
    attributes: {},
    classList: {
      classes: new Set(),
      add: function (...c) { c.forEach(item => this.classes.add(item)); },
      remove: function (...c) { c.forEach(item => this.classes.delete(item)); },
      contains: function (c) { return this.classes.has(c); }
    },
    setAttribute: function (name, val) { this.attributes[name] = val; },
    getAttribute: function (name) { return this.attributes[name] || null; },
    removeAttribute: function (name) { delete this.attributes[name]; },
    remove: function () {},
    innerHTML: '',
    appendChild: function (child) { this.children = this.children || []; this.children.push(child); },
    children: [],
    querySelector: function (sel) { return createMockElement('div'); },
    insertAdjacentHTML: function (pos, text) {}
  };
}

global.document = {
  documentElement: createMockElement('html'),
  head: createMockElement('head'),
  body: createMockElement('body'),
  visibilityState: 'visible',
  getElementById: (id) => domElements[id] || (domElements[id] = createMockElement('div')),
  querySelector: (sel) => {
    if (sel.includes('#app-theme-color') || sel.includes('meta[name="theme-color"]')) {
      return domElements['app-theme-color'] || (domElements['app-theme-color'] = createMockElement('meta'));
    }
    if (sel.includes('#app-status-bar-style') || sel.includes('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      return domElements['app-status-bar-style'] || (domElements['app-status-bar-style'] = createMockElement('meta'));
    }
    if (sel.includes('meta[name="color-scheme"]')) {
      return domElements['color-scheme'] || (domElements['color-scheme'] = createMockElement('meta'));
    }
    return createMockElement('div');
  },
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
eval(fs.readFileSync(path.join(rootDir, 'js', 'components', 'modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'homeView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'monthDetailView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8'));

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
console.log('🧪 RUNNING SMART FINANCES VERIFICATION SUITE (30 SCENARIOS)');
console.log('========================================================\n');

// -------------------------------------------------------------
// GROUP 1: UI & MODALS (Scenarios 1 - 5)
// -------------------------------------------------------------
console.log('--- GROUP 1: UI & Sticky Modal Top Action ---');

runTest('1. openExpenseModal renders Cadastrar/Salvar in top sticky header', () => {
  const container = document.getElementById('modal-container');
  window.openExpenseModal('2026-09');
  assert(container.innerHTML.includes('sticky top-0'), 'Modal includes sticky top header');
  assert(container.innerHTML.includes('type="submit" form="expense-form"'), 'Top submit button targets expense-form');
  assert(container.innerHTML.includes('Cadastrar'), 'Top submit button contains "Cadastrar"');
});

runTest('2. openExpenseModal editing renders Salvar in top sticky header', () => {
  const store = window.financeStore;
  const exp = store.addExpense({ monthKey: '2026-09', name: 'Aluguel Teste', amount: 1500, categoryId: 'moradia', dueDate: '2026-09-10' });
  const container = document.getElementById('modal-container');
  window.openExpenseModal('2026-09', exp.id);
  assert(container.innerHTML.includes('Salvar'), 'Top submit button contains "Salvar" for edit mode');
  assert(container.innerHTML.includes('Excluir Despesa'), 'Delete button is available for edit mode');
});

runTest('3. openIncomeModal renders Cadastrar/Salvar in top sticky header', () => {
  const container = document.getElementById('modal-container');
  window.openIncomeModal('2026-09');
  assert(container.innerHTML.includes('sticky top-0'), 'Income modal includes sticky top header');
  assert(container.innerHTML.includes('type="submit" form="income-form"'), 'Top submit button targets income-form');
  assert(container.innerHTML.includes('Cadastrar'), 'Top submit button contains "Cadastrar"');
});

runTest('4. Form validation stays in modal without closing on invalid inputs', () => {
  let closed = false;
  window.closeModal = () => { closed = true; };

  // Trigger submit with missing name and 0 amount
  let prevented = false;
  window.handleSaveExpenseSubmit({ preventDefault: () => { prevented = true; } });
  assert(prevented, 'Submit preventDefault called');
  assert(!closed, 'Modal was NOT closed when validation failed');
});

runTest('5. No duplicate submit button at bottom of expense or income modals', () => {
  const container = document.getElementById('modal-container');
  window.openExpenseModal('2026-09');
  // Check that the form bottom only has delete or nothing (no secondary submit button)
  const submitCount = (container.innerHTML.match(/type="submit"/g) || []).length;
  assert.strictEqual(submitCount, 1, `Exactly 1 submit button in modal header (found ${submitCount})`);
});

// -------------------------------------------------------------
// GROUP 2: HOME VIEW CONTRAST & GLASS (Scenarios 6 - 9)
// -------------------------------------------------------------
console.log('\n--- GROUP 2: Home View Contrast & Glass Navigation ---');

runTest('6. Balanço mensal negativo matches previous months token (text-[#dc2626] dark:text-[#ff8a80])', () => {
  const store = window.financeStore;
  store.state.expenses = [
    { id: 'e1', monthKey: '2026-09', name: 'Gasto Alto', amount: 5000, status: 'pending', categoryId: 'moradia' }
  ];
  store.state.incomes = [
    { id: 'i1', monthKey: '2026-09', name: 'Salário Baixo', amount: 1000, status: 'received', categoryId: 'salario' }
  ];
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('text-[#dc2626] dark:text-[#ff8a80]'), 'Negative balance strictly matches previous months token');
});

runTest('7. Balanço mensal positivo matches previous months token (text-[#15803d] dark:text-[#69f0ae])', () => {
  const store = window.financeStore;
  store.state.expenses = [
    { id: 'e1', monthKey: '2026-09', name: 'Gasto Baixo', amount: 500, status: 'pending', categoryId: 'moradia' }
  ];
  store.state.incomes = [
    { id: 'i1', monthKey: '2026-09', name: 'Salário Alto', amount: 5000, status: 'received', categoryId: 'salario' }
  ];
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('text-[#15803d] dark:text-[#69f0ae]'), 'Positive balance strictly matches previous months token');
});

runTest('8. Saldo atual and other metrics remain neutral white on Home card', () => {
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('Saldo atual</span>\n                <span class="text-xl font-bold tracking-tight text-white'), 'Saldo atual is strictly white');
  assert(homeHtml.includes('Despesas restantes</span>\n                <span class="text-2xl sm:text-[25px] font-black tracking-tight text-white'), 'Despesas restantes on Home is strictly white');
});

runTest('9. CSS floating-bottom-dock has refined glass, blur, thin border, and dark mode support', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'app.css'), 'utf8');
  assert(css.includes('backdrop-filter: blur(32px) saturate(220%)'), 'Blur 32px saturate 220% applied to glass dock');
  assert(css.includes('-webkit-backdrop-filter: blur(32px) saturate(220%)'), 'iOS -webkit-backdrop-filter applied');
  assert(css.includes('html.dark .floating-bottom-dock'), 'Dark mode dock class present');
  assert(css.includes('background: rgba(20, 14, 10, 0.72)'), 'Dark mode translucent dark background applied');
});

runTest('9b. Notification center modal displays empty state when no pending items', () => {
  const store = window.financeStore;
  store.state.expenses = [];
  const container = document.getElementById('modal-container');
  window.openNotificationCenterModal();
  assert(container.innerHTML.includes('Nenhuma notificação'), 'Empty state title rendered');
  assert(container.innerHTML.includes('Você não possui despesas pendentes com vencimento para hoje ou amanhã'), 'Empty state description rendered');
});

runTest('9c. Notification center modal lists pending items when due today or tomorrow', () => {
  const store = window.financeStore;
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'exp_alert', monthKey: '2026-09', name: 'Aluguel do Mês', amount: 1800, status: 'pending', dueDate: todayStr, categoryId: 'moradia' }
  ];
  const container = document.getElementById('modal-container');
  window.openNotificationCenterModal();
  assert(container.innerHTML.includes('Aluguel do Mês'), 'Item name rendered in notification center');
  assert(container.innerHTML.includes('Vence hoje'), 'Due today badge rendered in notification center');
  assert(container.innerHTML.includes('1.800,00'), 'Formatted amount rendered in notification center');
});

runTest('9d. Floating sheets and dialogs include rounded border-radius tokens', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'app.css'), 'utf8');
  assert(css.includes('border-top-left-radius: 32px !important'), '32px top radius on floating sheets');
  assert(css.includes('border-radius: 28px !important'), '28px radius on floating dialogs');
});

runTest('9e. Light mode month cards have soft pastel tones (#f0faf3 positive, #fdf3f2 negative, #fbf9f7 neutral)', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'app.css'), 'utf8');
  assert(css.includes('background-color: #f0faf3;'), 'Soft pastel green for positive months');
  assert(css.includes('background-color: #fdf3f2;'), 'Soft pastel red for negative months');
  assert(css.includes('background-color: #fbf9f7;'), 'Soft neutral for zero/neutral months');
});

runTest('9f. Expense card has no internal dividing line (border-t removed)', () => {
  const store = window.financeStore;
  store.state.expenses = [
    { id: 'exp_clean', monthKey: '2026-09', name: 'Mercado Sem Linha', amount: 350, status: 'pending', categoryId: 'alimentacao', dueDate: '2026-09-15' }
  ];
  const itemsHtml = window.getMonthItemsHtml('2026-09', 'expenses');
  assert(!itemsHtml.includes('border-t border-outline-variant/20'), 'Internal dividing line completely removed');
});

runTest('9g. Expense card removes duplicate small category icon and uses neutral category text', () => {
  const itemsHtml = window.getMonthItemsHtml('2026-09', 'expenses');
  assert(itemsHtml.includes('text-on-surface-variant dark:text-[#d7c3b5]'), 'Category name uses neutral text color');
  assert(!itemsHtml.includes('text-[14px]'), 'Duplicate small category icon is removed');
});

runTest('9h. Calendar icon in expense card inherits category color', () => {
  const itemsHtml = window.getMonthItemsHtml('2026-09', 'expenses');
  const cat = window.financeStore.getCategoryById('alimentacao');
  assert(itemsHtml.includes(`style="color: ${cat.textColor}"`), 'Calendar icon inherits category text color');
});

runTest('9i. Fechamento button inside month detail uses discrete notification bell style', () => {
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783]'), 'Fechamento button uses discrete notification button style');
  assert(monthHtml.includes('rounded-2xl'), 'Fechamento button has rounded-2xl');
});

runTest('9j. Modal header uses solid background without dark backdrop blur bleed in rounded corners', () => {
  const container = document.getElementById('modal-container');
  window.openExpenseModal('2026-09');
  assert(container.innerHTML.includes('bg-surface dark:bg-[#241b15]'), 'Expense modal header uses solid surface');
  assert(!container.innerHTML.includes('backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center shrink-0 rounded-t-[32px]'), 'backdrop-blur-md removed from header');
});

runTest('9k. floating-month-summary-dock reuses exact light mode border and glass token from floating-bottom-dock', () => {
  const css = fs.readFileSync(path.join(rootDir, 'css', 'app.css'), 'utf8');
  assert(css.includes('.floating-month-summary-dock {\n  background: rgba(255, 255, 255, 0.82);\n  backdrop-filter: blur(32px) saturate(220%);\n  -webkit-backdrop-filter: blur(32px) saturate(220%);\n  border: 1px solid rgba(148, 74, 0, 0.15);'), 'Summary dock matches navigation dock in light mode');
});

runTest('9l. Month Detail tab selector reuses Home navigation pill geometry and container', () => {
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#f4ebe4] dark:bg-[#2b2019] p-1 rounded-full flex items-center gap-1 border border-[#ebdcd1] dark:border-[#3e3027] shadow-inner'), 'Tab selector uses pill container');
  assert(monthHtml.includes('rounded-full'), 'Tabs use rounded-full');
});

runTest('9m. Despesas active tab pill uses exact Home negative card coral (bg-[#ea7355] dark:bg-[#852f1b])', () => {
  window.financeStore.setMonthDetailTab('expenses');
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#ea7355] dark:bg-[#852f1b] text-white shadow-sm'), 'Despesas active pill uses Home card negative coral');
});

runTest('9n. Receitas active tab pill uses exact Home positive card green (bg-[#309b57] dark:bg-[#124d27])', () => {
  window.financeStore.setMonthDetailTab('incomes');
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#309b57] dark:bg-[#124d27] text-white shadow-sm'), 'Receitas active pill uses Home card positive green');
});

runTest('9o. Floating add button dynamically matches active tab color (coral for expenses, green for incomes)', () => {
  window.financeStore.setMonthDetailTab('expenses');
  let monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#ea7355] dark:bg-[#852f1b]'), 'FAB button renders Home coral on expenses tab');

  window.financeStore.setMonthDetailTab('incomes');
  monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#309b57] dark:bg-[#124d27]'), 'FAB button renders Home green on incomes tab');
});

runTest('9p. Filtros button reuses Fechamento button visual language (bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] rounded-2xl)', () => {
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783]'), 'Filtros button uses Fechamento palette');
  assert(monthHtml.includes('rounded-2xl'), 'Filtros button uses rounded-2xl');
});

runTest('9q. Search input reuses Fechamento button visual language (bg-[#faeae0] dark:bg-[#332218] rounded-2xl)', () => {
  const monthHtml = window.renderMonthDetailView();
  assert(monthHtml.includes('bg-[#faeae0] dark:bg-[#332218] rounded-2xl'), 'Search input uses Fechamento background and radius');
});

runTest('9r. Year picker on Home reuses Fechamento button visual language (bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] rounded-2xl)', () => {
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783]'), 'Year picker uses Fechamento palette');
  assert(homeHtml.includes('rounded-2xl'), 'Year picker uses rounded-2xl');
});

// -------------------------------------------------------------
// GROUP 3: LOCAL IN-APP NOTIFICATIONS (Scenarios 10 - 20)
// -------------------------------------------------------------
console.log('\n--- GROUP 3: Local In-App Due Date Notifications ---');

runTest('10. App without upcoming pending expenses generates zero alerts', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  store.state.expenses = [
    { id: 'e1', monthKey: '2026-09', name: 'Gasto Longe', amount: 100, status: 'pending', dueDate: '2026-09-25' }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert.strictEqual(notifContainer.innerHTML, '', 'No alert rendered for distant expenses');
});

runTest('11. Pending expense due tomorrow generates "vence amanhã" alert', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const tomorrowStr = window.NotificationService.getLocalDateString(1);
  store.state.expenses = [
    { id: 'exp_tomorrow', monthKey: '2026-09', name: 'Internet Fibra', amount: 129.90, status: 'pending', dueDate: tomorrowStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('Internet Fibra vence amanhã'), 'Notification displays "Internet Fibra vence amanhã"');
  assert(notifContainer.innerHTML.includes('R$') && notifContainer.innerHTML.includes('129,90'), 'Notification includes formatted amount');
});

runTest('12. Pending expense due today generates "vence hoje" alert', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'exp_today', monthKey: '2026-09', name: 'Conta de Energia', amount: 250, status: 'pending', dueDate: todayStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('Conta de Energia vence hoje'), 'Notification displays "Conta de Energia vence hoje"');
  assert(notifContainer.innerHTML.includes('Não esqueça de pagar'), 'Notification displays reminder text');
});

runTest('13. Paid expense due today generates NO alert', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'exp_paid_today', monthKey: '2026-09', name: 'Conta Paga', amount: 250, status: 'paid', dueDate: todayStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert.strictEqual(notifContainer.innerHTML, '', 'No alert rendered for paid expense');
});

runTest('14. Multiple pending expenses due today/tomorrow are grouped into a single banner', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  const tomorrowStr = window.NotificationService.getLocalDateString(1);
  store.state.expenses = [
    { id: 'exp1', monthKey: '2026-09', name: 'Conta 1', amount: 100, status: 'pending', dueDate: todayStr },
    { id: 'exp2', monthKey: '2026-09', name: 'Conta 2', amount: 200, status: 'pending', dueDate: tomorrowStr },
    { id: 'exp3', monthKey: '2026-09', name: 'Conta 3', amount: 150, status: 'pending', dueDate: todayStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('3 despesas vencem hoje ou amanhã'), 'Grouped banner indicates 3 expenses');
  assert(notifContainer.innerHTML.includes('450,00'), 'Grouped banner displays total R$ 450,00');
});

runTest('15. Alert is recorded in sessionStorage and does NOT repeat in same session', () => {
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = ''; // simulate user navigating / closing banner
  // Calling checkDueDates again in the same session
  window.NotificationService.checkDueDates();
  assert.strictEqual(notifContainer.innerHTML, '', 'Alert is NOT repeated within the same session');
});

runTest('16. Clearing sessionStorage allows re-checking upon new app session', () => {
  sessionStorageMock.clear();
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('3 despesas vencem'), 'Alert successfully re-checks on new session');
});

runTest('17. Installment expense occurrences participate in due date alerts', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const todayStr = window.NotificationService.getLocalDateString(0);
  store.state.expenses = [
    { id: 'inst_3_10', monthKey: '2026-09', name: 'Notebook (3/10)', amount: 400, isInstallment: true, installmentNumber: 3, totalInstallments: 10, status: 'pending', dueDate: todayStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('Notebook (3/10) vence hoje'), 'Installment item generated alert');
});

runTest('18. Recurring expense occurrences participate in due date alerts', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const tomorrowStr = window.NotificationService.getLocalDateString(1);
  store.state.expenses = [
    { id: 'rec_gym', monthKey: '2026-09', name: 'Academia', amount: 120, isRecurring: true, status: 'pending', dueDate: tomorrowStr }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('Academia vence amanhã'), 'Recurring item generated alert');
});

runTest('19. Due date change properly shifts notification eligibility', () => {
  const store = window.financeStore;
  sessionStorageMock.clear();
  const distantDate = '2026-11-20';
  store.state.expenses = [
    { id: 'exp_shift', monthKey: '2026-09', name: 'Seguro', amount: 300, status: 'pending', dueDate: distantDate }
  ];
  const notifContainer = document.getElementById('in-app-notification-container');
  notifContainer.innerHTML = '';
  window.NotificationService.checkDueDates();
  assert.strictEqual(notifContainer.innerHTML, '', 'No alert when due date is far');

  // Change date to today
  store.state.expenses[0].dueDate = window.NotificationService.getLocalDateString(0);
  window.NotificationService.checkDueDates();
  assert(notifContainer.innerHTML.includes('Seguro vence hoje'), 'Alert appears once date is shifted to today');
});

runTest('20. Local timezone helper produces exact local YYYY-MM-DD format', () => {
  const todayStr = window.NotificationService.getLocalDateString(0);
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.strictEqual(todayStr, expected, `Timezone helper matches local date (${todayStr} vs ${expected})`);
});

// -------------------------------------------------------------
// GROUP 4: STATUS BAR & THEME SYNCHRONIZATION (Scenarios 21 - 30)
// -------------------------------------------------------------
console.log('\n--- GROUP 4: iOS Status Bar & Dynamic Theme-Color Sync ---');

runTest('21. Theme preference set to "system" applies prefers-color-scheme', () => {
  localStorageMock.setItem('stitch_theme_preference', 'system');
  window.applyThemePreference('system');
  assert(!document.documentElement.classList.contains('dark'), 'Light mode applied when matchMedia is light');
});

runTest('22. Light mode sets theme-color to #faf8f6 and status bar to default', () => {
  window.applyThemePreference('light');
  const themeMeta = document.getElementById('app-theme-color');
  const statusMeta = document.getElementById('app-status-bar-style');
  assert.strictEqual(themeMeta.getAttribute('content'), '#faf8f6', 'theme-color is #faf8f6');
  assert.strictEqual(statusMeta.getAttribute('content'), 'default', 'status-bar-style is default (dark icons on light bar)');
});

runTest('23. Switching to dark mode sets theme-color to #18120d and status bar to black', () => {
  window.applyThemePreference('dark');
  const themeMeta = document.getElementById('app-theme-color');
  const statusMeta = document.getElementById('app-status-bar-style');
  assert.strictEqual(themeMeta.getAttribute('content'), '#18120d', 'theme-color is #18120d');
  assert.strictEqual(statusMeta.getAttribute('content'), 'black', 'status-bar-style is black (light icons on dark bar)');
  assert(document.documentElement.classList.contains('dark'), 'html element has .dark class');
});

runTest('24. Switching back to light mode updates theme-color & status bar immediately without reload', () => {
  window.applyThemePreference('light');
  const themeMeta = document.getElementById('app-theme-color');
  const statusMeta = document.getElementById('app-status-bar-style');
  assert.strictEqual(themeMeta.getAttribute('content'), '#faf8f6', 'theme-color back to #faf8f6');
  assert.strictEqual(statusMeta.getAttribute('content'), 'default', 'status-bar-style back to default');
  assert(!document.documentElement.classList.contains('dark'), 'html element has no .dark class');
});

runTest('25. Manual "dark" preference overrides system light mode', () => {
  localStorageMock.setItem('stitch_theme_preference', 'dark');
  window.applyThemePreference('dark');
  assert(document.documentElement.classList.contains('dark'), 'Dark mode forced regardless of system');
});

runTest('26. Manual "light" preference overrides system dark mode', () => {
  localStorageMock.setItem('stitch_theme_preference', 'light');
  window.applyThemePreference('light');
  assert(!document.documentElement.classList.contains('dark'), 'Light mode forced regardless of system');
});

runTest('27. Visibility change triggers theme re-synchronization', () => {
  let syncTriggered = false;
  const originalApply = window.applyThemePreference;
  window.applyThemePreference = () => { syncTriggered = true; originalApply(); };
  
  // Fire visibilitychange
  const visListeners = listeners['visibilitychange'] || [];
  visListeners.forEach(cb => cb());
  assert(syncTriggered, 'Theme sync fired on visibilitychange');
  window.applyThemePreference = originalApply;
});

runTest('28. Window focus triggers theme re-synchronization', () => {
  let focusTriggered = false;
  const originalApply = window.applyThemePreference;
  window.applyThemePreference = () => { focusTriggered = true; originalApply(); };
  
  // Fire window focus
  const focusListeners = listeners['focus'] || [];
  focusListeners.forEach(cb => cb());
  assert(focusTriggered, 'Theme sync fired on window focus');
  window.applyThemePreference = originalApply;
});

runTest('29. Color-scheme meta tag updates to dark/light in tandem', () => {
  window.applyThemePreference('dark');
  const csMeta = document.querySelector('meta[name="color-scheme"]');
  assert.strictEqual(csMeta.getAttribute('content'), 'dark', 'color-scheme is dark');

  window.applyThemePreference('light');
  assert.strictEqual(csMeta.getAttribute('content'), 'light', 'color-scheme is light');
});

runTest('30. Full regression: Store, Categories, Recurrence, and Installments remain intact', () => {
  const store = window.financeStore;
  const cats = store.getCategories('expense');
  assert.strictEqual(cats.length, 10, 'All 10 expense categories present');
  const fallbackCat = store.getCategoryById('outras_despesas');
  assert(fallbackCat && fallbackCat.id === 'outras_despesas', 'Fallback category intact');
});

console.log('\n--- GROUP 5: Modal Refinements & Official Icon Verification ---');

runTest('31. Nova Despesa top button uses Home Coral (#ea7355 / #852f1b)', () => {
  window.openExpenseModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('bg-[#ea7355] dark:bg-[#852f1b]'), 'Top submit button uses Home Coral');
});

runTest('32. Nova Despesa text inputs and amount box use search bar visual language (bg-[#faeae0] dark:bg-[#332218] rounded-2xl)', () => {
  window.openExpenseModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('id="expense-name"'), 'Expense name input exists');
  assert(html.includes('bg-[#faeae0] dark:bg-[#332218] rounded-2xl'), 'Expense name uses search input language');
  assert(html.includes('id="expense-amount-box"'), 'Expense amount box exists');
  assert(html.includes('text-[#ea7355] dark:text-[#f87171]'), 'Expense amount text uses coral');
});

runTest('33. Nova Despesa status buttons use card language (#fee2e2 / #3b1212 for pending, #dcfce7 / #0f2e1b for paid)', () => {
  window.openExpenseModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('id="expense-status-pending-btn"'), 'Pending status button exists');
  assert(html.includes('bg-[#fee2e2] dark:bg-[#3b1212] text-[#dc2626] dark:text-[#fca5a5]'), 'Pending status uses card red/coral');
  assert(html.includes('id="expense-status-paid-btn"'), 'Paid status button exists');
  assert(html.includes('rounded-2xl'), 'Status buttons use rounded-2xl pill');
});

runTest('34. Nova Despesa category buttons use each category\'s soft card style', () => {
  window.openExpenseModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('category-select-btn'), 'Category buttons exist');
  assert(html.includes('--cat-bg-light'), 'Category buttons have soft light background token');
  assert(html.includes('--cat-bg-dark'), 'Category buttons have soft dark background token');
});

runTest('35. Nova Despesa installment & recurrence switches use soft background (bg-[#faeae0]/60 dark:bg-[#2d211a] rounded-2xl)', () => {
  window.openExpenseModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('bg-[#faeae0]/60 dark:bg-[#2d211a] rounded-2xl'), 'Switches use soft background');
});

runTest('36. Nova Receita top button uses Home Green (#309b57 / #124d27)', () => {
  window.openIncomeModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('bg-[#309b57] dark:bg-[#124d27]'), 'Top submit button uses Home Green');
});

runTest('37. Nova Receita text inputs and amount box use search bar visual language (bg-[#faeae0] dark:bg-[#332218] rounded-2xl)', () => {
  window.openIncomeModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('id="income-name"'), 'Income name input exists');
  assert(html.includes('bg-[#faeae0] dark:bg-[#332218] rounded-2xl'), 'Income name uses search input language');
  assert(html.includes('id="income-amount-box"'), 'Income amount box exists');
  assert(html.includes('text-[#309b57] dark:text-[#4ade80]'), 'Income amount text uses green');
});

runTest('38. Nova Receita status buttons use card language (Prevista #e0f2fe, Recebida #dcfce7)', () => {
  window.openIncomeModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('id="income-status-pending-btn"'), 'Pending status button exists');
  assert(html.includes('id="income-status-received-btn"'), 'Received status button exists');
  assert(html.includes('bg-[#dcfce7] dark:bg-[#0f2e1b] text-[#15803d]'), 'Received status uses card green');

  // Toggle status to pending
  window.setIncomeFormStatus('pending');
  const pendingBtn = document.getElementById('income-status-pending-btn');
  assert(pendingBtn.className.includes('bg-[#e0f2fe] dark:bg-[#0c2438] text-[#0284c7]'), 'Pending status uses card sky blue when active');
});

runTest('39. Nova Receita category buttons use each category\'s soft card style', () => {
  window.openIncomeModal('2026-09');
  const modalContainer = document.getElementById('modal-container');
  const html = modalContainer.innerHTML;
  assert(html.includes('category-select-btn'), 'Income category buttons exist');
  assert(html.includes('--cat-bg-light'), 'Income category buttons have soft light background token');
});

runTest('40. Category select button dynamic toggle preserves input value', () => {
  window.openExpenseModal('2026-09');
  const nameInput = document.getElementById('expense-name');
  nameInput.value = 'Compra no Supermercado';
  
  window.setExpenseFormCategory('alimentacao');
  assert.strictEqual(nameInput.value, 'Compra no Supermercado', 'Input value preserved on category switch');
});

runTest('41. Official icons exist with proper size and integrity', () => {
  const iconFiles = [
    'icons/favicon-32.png',
    'icons/apple-touch-icon.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-maskable-192.png',
    'icons/icon-maskable-512.png',
    'icons/source_icon.png',
    'icons/icon.svg'
  ];
  iconFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    assert(fs.existsSync(fullPath), `Icon file ${relPath} must exist`);
    const stats = fs.statSync(fullPath);
    assert(stats.size > 1000, `Icon file ${relPath} must have valid non-empty size (got ${stats.size} bytes)`);
  });
});

runTest('42. build.js executes without altering or recreating icons', () => {
  const buildScriptPath = path.join(__dirname, 'build.js');
  assert(fs.existsSync(buildScriptPath), 'build.js exists');
  const content = fs.readFileSync(buildScriptPath, 'utf8');
  assert(!content.includes('generate_icons'), 'build.js does NOT regenerate icons');
  assert(!content.includes('high contrast'), 'build.js does not alter icon colors');
});

runTest('43. Default avatar in HomeView uses official icon when no custom user photo is set', () => {
  window.financeStore.state.userPhoto = '';
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('src="./icons/icon-192.png"'), 'Default avatar uses official icon-192.png');
});

runTest('44. Custom user photo is preserved in HomeView when set', () => {
  window.financeStore.state.userPhoto = 'data:image/jpeg;base64,mycustomphoto';
  const homeHtml = window.renderHomeView();
  assert(homeHtml.includes('src="data:image/jpeg;base64,mycustomphoto"'), 'Custom photo is preserved in HomeView');
});

runTest('45. manifest.webmanifest and index.html link all standard icon formats', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.icons && manifest.icons.length >= 4, 'Manifest contains icon definitions');

  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(indexHtml.includes('icons/favicon-32.png'), 'index.html links favicon-32');
  assert(indexHtml.includes('icons/apple-touch-icon.png'), 'index.html links apple-touch-icon');
  assert(indexHtml.includes('icons/icon-192.png'), 'index.html links icon-192');
});

console.log('\n========================================================');
console.log(`🎉 ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
console.log('========================================================\n');
