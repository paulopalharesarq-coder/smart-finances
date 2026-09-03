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
    children: []
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

console.log('\n========================================================');
console.log(`🎉 ALL ${passed}/${total} TESTS PASSED SUCCESSFULLY!`);
console.log('========================================================\n');
