/**
 * Interactive DOM & User Flow Simulation Test
 * Simulates user actions: clicking, typing, keypad pressing, installment creation, category switching.
 */

const fs = require('fs');
const path = require('path');

// Mock a complete browser DOM environment
class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.style = {};
    this.children = [];
    this.attributes = {};
    this._value = '';
    this._innerText = '';
    this._innerHTML = '';
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get innerText() { return this._innerText; }
  set innerText(v) { this._innerText = String(v); }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(html) {
    this._innerHTML = html;
    this._parseHTMLMock(html);
  }

  setAttribute(name, val) { this.attributes[name] = val; }
  getAttribute(name) { return this.attributes[name] || null; }
  hasAttribute(name) { return name in this.attributes; }

  get classList() {
    const self = this;
    return {
      add: (...cls) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        cls.forEach(c => set.add(c));
        self.className = Array.from(set).join(' ');
      },
      remove: (...cls) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        cls.forEach(c => set.delete(c));
        self.className = Array.from(set).join(' ');
      },
      contains: (c) => self.className.split(/\s+/).includes(c)
    };
  }

  focus() {}
  click() {}
  appendChild(child) { this.children.push(child); }
  remove() {}

  _parseHTMLMock(html) {
    this._elementsById = this._elementsById || {};
    const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
    for (const m of idMatches) {
      const id = m[1];
      const el = new MockElement('div', id);
      const valMatch = html.match(new RegExp(`id=["']${id}["'][^>]*value=["']([^"']*)["']`));
      if (valMatch) el.value = valMatch[1];
      const checkedMatch = html.match(new RegExp(`id=["']${id}["'][^>]*checked`));
      el.checked = Boolean(checkedMatch);
      this._elementsById[id] = el;
    }
  }

  getElementById(id) {
    if (!this._elementsById) this._elementsById = {};
    return this._elementsById[id] || null;
  }
}

const mockDoc = new MockElement('html');
const modalContainer = new MockElement('div', 'modal-container');
const keypadContainer = new MockElement('div', 'keypad-container');
const toastContainer = new MockElement('div', 'toast-container');
const appContainer = new MockElement('div', 'app');

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) { return store[key] || null; },
    setItem: function (key, value) { store[key] = value.toString(); },
    removeItem: function (key) { delete store[key]; },
    clear: function () { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

global.window = {
  location: {
    origin: 'https://smart-finances.vercel.app',
    pathname: '/',
    href: 'https://smart-finances.vercel.app/'
  },
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  showToast: (msg, type) => { console.log(`    📢 Toast [${type || 'info'}]: ${msg}`); }
};

const domElements = {
  'modal-container': modalContainer,
  'keypad-container': keypadContainer,
  'toast-container': toastContainer,
  'app': appContainer
};

global.document = {
  documentElement: mockDoc,
  getElementById: (id) => domElements[id] || modalContainer.getElementById(id) || keypadContainer.getElementById(id) || appContainer.getElementById(id) || new MockElement('div', id),
  querySelectorAll: (selector) => [],
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {}
};

const rootDir = path.resolve(__dirname, '..');
eval(fs.readFileSync(path.join(rootDir, 'js', 'lib', 'qrcode.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'components', 'modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'homeView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'monthDetailView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'categoriesView.js'), 'utf8'));

let passed = 0;
let total = 0;
function testAssert(cond, desc) {
  total++;
  if (cond) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    throw new Error(desc);
  }
}

console.log('\n=== TESTING USER FLOW 1: Custom Numeric Keypad Simulation ===');
let keypadValue = 0;
window.openKeypad({
  initialValue: 0,
  title: 'Valor da Despesa',
  onConfirm: (val) => { keypadValue = val; }
});

testAssert(keypadContainer.innerHTML.includes('Valor Informado'), 'Keypad opened with header and display');

// Type: 1, 5, 0, 0, 0 -> R$ 150,00
window.handleKeypadInput('1');
window.handleKeypadInput('5');
window.handleKeypadInput('0');
window.handleKeypadInput('0');
window.handleKeypadInput('0');
window.handleKeypadConfirm();

testAssert(keypadValue === 150.00, `Keypad confirmed exact value R$ 150,00 (got ${keypadValue})`);

console.log('\n=== TESTING USER FLOW 2: Form Input Retention on Category Switch ===');
window.openExpenseModal('2026-09');
testAssert(modalContainer.innerHTML.includes('Nova Despesa'), 'Expense modal opened');

// Simulate user typing into name input
const nameEl = document.getElementById('expense-name');
nameEl.value = 'Curso de Inglês Avançado';

// Select category "Educação"
window.setExpenseFormCategory('educacao');

// Check that the name wasn't wiped by re-rendering
const currentName = document.getElementById('expense-name').value;
testAssert(currentName === 'Curso de Inglês Avançado', 'Expense name was preserved when clicking category');

console.log('\n=== TESTING USER FLOW 3: Intermediate Installments Creation (3/5) ===');
// Set amount to 100 using in-app keypad
window.openKeypadForExpenseForm();
window.handleKeypadInput('1');
window.handleKeypadInput('0');
window.handleKeypadInput('0');
window.handleKeypadInput('0');
window.handleKeypadInput('0');
window.handleKeypadConfirm();

const isInstToggle = document.getElementById('expense-is-installment-toggle');
if (isInstToggle) isInstToggle.checked = true;

const totalInstEl = document.getElementById('expense-total-installments');
if (totalInstEl) totalInstEl.value = '5';

const curInstEl = document.getElementById('expense-current-installment');
if (curInstEl) curInstEl.value = '3';

// Save installment plan
const mockSubmitEvent = { preventDefault: () => {} };
window.handleSaveExpenseSubmit(mockSubmitEvent);

const store = window.financeStore;
const plans = store.state.installmentPlans || [];
testAssert(plans.length > 0, 'Installment plan was created in store');

const createdPlan = plans[plans.length - 1];
testAssert(createdPlan.totalInstallments === 5, 'Plan total installments is 5');
testAssert(createdPlan.currentInstallment === 3, 'Plan current installment is 3');

const instItems = store.getInstallmentExpenses(createdPlan.id);
testAssert(instItems.length === 5, 'Generated exactly 5 installment expense records');

// Month distribution for 3/5 starting in 2026-09:
// 1 -> 2026-07 (past, paid)
// 2 -> 2026-08 (past, paid)
// 3 -> 2026-09 (current, pending)
// 4 -> 2026-10 (future, pending)
// 5 -> 2026-11 (future, pending)
testAssert(instItems[0].monthKey === '2026-07' && instItems[0].status === 'paid', 'Installment 1 is 2026-07 paid');
testAssert(instItems[1].monthKey === '2026-08' && instItems[1].status === 'paid', 'Installment 2 is 2026-08 paid');
testAssert(instItems[2].monthKey === '2026-09' && instItems[2].status === 'pending', 'Installment 3 is 2026-09 pending');
testAssert(instItems[3].monthKey === '2026-10' && instItems[3].status === 'pending', 'Installment 4 is 2026-10 pending');
testAssert(instItems[4].monthKey === '2026-11' && instItems[4].status === 'pending', 'Installment 5 is 2026-11 pending');

console.log('\n=== TESTING USER FLOW 4: Status Picker Popover ===');
const sampleExp = instItems[2];
window.openStatusPickerModal({ id: sampleExp.id, type: 'expense', currentStatus: sampleExp.status });
testAssert(modalContainer.innerHTML.includes('Alterar Situação'), 'Status popover opened');
testAssert(modalContainer.innerHTML.includes('Pago') && modalContainer.innerHTML.includes('Pendente'), 'Status options present');

// Toggle to paid
window.selectQuickStatus(sampleExp.id, 'expense', 'paid');
const updatedExp = store.getExpenseById(sampleExp.id);
testAssert(updatedExp.status === 'paid', 'Status updated to paid immediately');

console.log('\n=== TESTING USER FLOW 5: QR Code Modal ===');
window.openMobileConnectModal();
testAssert(modalContainer.innerHTML.includes('Instalar no Smartphone'), 'QR code modal opened');
testAssert(modalContainer.innerHTML.includes('pwa-qrcode'), 'QR code container exists');
testAssert(modalContainer.innerHTML.includes('Copiar'), 'Copy link button exists');

console.log(`\n============================================`);
console.log(`🎉 ALL ${passed}/${total} INTERACTIVE FLOW TESTS PASSED!`);
console.log(`============================================\n`);
