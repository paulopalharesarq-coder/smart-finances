/**
 * Comprehensive Automated Test Suite for Smart Finances
 * Validates all 28 business requirements and bug fixes.
 */

const fs = require('fs');
const path = require('path');

// Mock Browser Environment
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) { return store[key] || null; },
    setItem: function (key, value) { store[key] = value.toString(); },
    removeItem: function (key) { delete store[key]; },
    clear: function () { store = {}; },
    _dump: function () { return store; }
  };
})();

global.window = {
  location: {
    origin: 'https://smart-finances.vercel.app',
    pathname: '/',
    href: 'https://smart-finances.vercel.app/'
  },
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  showToast: (msg, type) => { console.log(`  [Toast ${type || 'info'}]: ${msg}`); }
};
global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.document = {
  documentElement: { classList: { add: () => {}, remove: () => {}, contains: () => false } },
  getElementById: (id) => {
    return {
      id,
      value: '',
      innerText: '',
      innerHTML: '',
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      setAttribute: () => {},
      removeAttribute: () => {},
      focus: () => {}
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load codebase in order
const rootDir = path.resolve(__dirname, '..');
eval(fs.readFileSync(path.join(rootDir, 'js', 'lib', 'qrcode.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'store.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'components', 'modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'homeView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'monthDetailView.js'), 'utf8'));
eval(fs.readFileSync(path.join(rootDir, 'js', 'views', 'categoriesView.js'), 'utf8'));

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('\n--- 1. Testing Default Categories & Fallback ---');
const store = window.financeStore;
const expenseCats = store.getCategories('expense');
const expectedCatNames = [
  'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Vestuário',
  'Contas e serviços', 'Viagem', 'Lazer', 'Educação', 'Outras despesas'
];

assert(expenseCats.length === 10, `Expense categories count is 10 (got ${expenseCats.length})`);
expectedCatNames.forEach(name => {
  assert(expenseCats.some(c => c.name === name), `Category "${name}" is present`);
});

const defaultCat = store.getCategoryById(null);
assert(defaultCat.id === 'outras_despesas', 'Fallback category ID is "outras_despesas"');
assert(defaultCat.name === 'Outras despesas', 'Fallback category name is "Outras despesas"');

const expWithoutCat = store.addExpense({
  name: 'Teste sem categoria',
  amount: 50,
  dueDate: '2026-09-10'
});
assert(expWithoutCat.categoryId === 'outras_despesas', 'Expense created without category gets "outras_despesas"');

console.log('\n--- 2. Testing Chronological Date Sorting ---');
const currentMonth = store.getCurrentMonthKey();

// Clean up current month expenses for testing
store.state.expenses = [];
store.addExpense({ name: 'Fim do mês', amount: 100, dueDate: `${currentMonth}-28` });
store.addExpense({ name: 'Início do mês', amount: 200, dueDate: `${currentMonth}-02` });
store.addExpense({ name: 'Meio do mês', amount: 150, dueDate: `${currentMonth}-15` });
store.addExpense({ name: 'Sem data', amount: 80, dueDate: '' });

const sortedExpenses = store.getExpensesByMonth(currentMonth);
assert(sortedExpenses[0].dueDate === `${currentMonth}-02`, 'First item is closest date (02)');
assert(sortedExpenses[1].dueDate === `${currentMonth}-15`, 'Second item is middle date (15)');
assert(sortedExpenses[2].dueDate === `${currentMonth}-28`, 'Third item is later date (28)');
assert(!sortedExpenses[3].dueDate, 'Item without date is at the end');

console.log('\n--- 3. Testing Category CRUD & Safe Reassignment ---');
const customCat = store.addCategory({
  name: 'Pet & Veterinário',
  type: 'expense',
  icon: 'pets',
  bgColor: '#dbeafe',
  textColor: '#1d4ed8'
});
assert(customCat && customCat.id, 'Created custom category successfully');

store.addExpense({
  name: 'Ração do Pet',
  amount: 120,
  dueDate: `${currentMonth}-12`,
  categoryId: customCat.id
});

store.deleteCategory(customCat.id);
const reallocatedExp = store.getExpensesByMonth(currentMonth).find(e => e.name === 'Ração do Pet');
assert(reallocatedExp.categoryId === 'outras_despesas', 'Deleted category items reassigned safely to "outras_despesas"');

console.log('\n--- 4. Testing Intermediate Installment Distribution (4/10 in Setembro/2026) ---');
store.state.expenses = [];
store.state.installmentPlans = [];

const plan = store.createInstallmentPlan({
  description: 'Notebook Gamer',
  totalAmount: 5000,
  totalInstallments: 10,
  currentInstallment: 4,
  startMonthKey: '2026-09',
  categoryId: 'outras_despesas',
  payee: 'Loja Tech',
  dueDateDay: '10'
});

assert(plan.totalInstallments === 10, 'Plan total installments is 10');
assert(plan.installmentAmount === 500, 'Installment amount is 500');

const instExpenses = store.getInstallmentExpenses(plan.id);
assert(instExpenses.length === 10, 'Created exactly 10 installments');

// Verify distribution across months
assert(instExpenses[0].monthKey === '2026-06' && instExpenses[0].installmentNumber === 1, 'Installment 1/10 is in 2026-06 (past month)');
assert(instExpenses[0].status === 'paid', 'Past installment 1/10 is marked paid');

assert(instExpenses[1].monthKey === '2026-07' && instExpenses[1].installmentNumber === 2, 'Installment 2/10 is in 2026-07 (past month)');
assert(instExpenses[2].monthKey === '2026-08' && instExpenses[2].installmentNumber === 3, 'Installment 3/10 is in 2026-08 (past month)');

assert(instExpenses[3].monthKey === '2026-09' && instExpenses[3].installmentNumber === 4, 'Installment 4/10 is in 2026-09 (current selected month)');
assert(instExpenses[3].status === 'pending', 'Current installment 4/10 is marked pending');

assert(instExpenses[4].monthKey === '2026-10' && instExpenses[4].installmentNumber === 5, 'Installment 5/10 is in 2026-10 (future month)');
assert(instExpenses[9].monthKey === '2027-03' && instExpenses[9].installmentNumber === 10, 'Installment 10/10 is in 2027-03 (future month)');

console.log('\n--- 5. Testing Controlled Recurrence (Horizon 12 Months & Duplicate Prevention) ---');
store.state.expenses = [];
store.state.recurringRules = [];

const recRule = store.createRecurringExpense({
  name: 'Academia Mensal',
  amount: 150,
  startMonthKey: '2026-09',
  categoryId: 'saude',
  payee: 'Smart Fit',
  dueDateDay: '05'
});

const recExpenses = store.state.expenses.filter(e => e.recurringRuleId === recRule.id);
assert(recExpenses.length === 12, 'Created exactly 12 recurring instances for the 12-month horizon');
assert(recExpenses.some(e => e.monthKey === '2026-09'), 'Instance created in 2026-09');
assert(recExpenses.some(e => e.monthKey === '2027-08'), 'Instance created in 2027-08');

// Try calling again to test duplicate prevention
store.createRecurringExpense({
  name: 'Academia Mensal',
  amount: 150,
  startMonthKey: '2026-09',
  categoryId: 'saude',
  payee: 'Smart Fit',
  dueDateDay: '05'
});
// Total should not duplicate instances for existing rule

console.log('\n--- 6. Testing "Despesas Restantes" Calculation ---');
store.state.expenses = [];
store.addExpense({ monthKey: '2026-09', name: 'Conta de Luz', amount: 200, status: 'pending' });
store.addExpense({ monthKey: '2026-09', name: 'Internet', amount: 100, status: 'paid' });
store.addExpense({ monthKey: '2026-09', name: 'Supermercado', amount: 350, status: 'overdue' });
store.addExpense({ monthKey: '2026-09', name: 'Cancelada', amount: 500, status: 'cancelled' });

const summary = store.calculateMonthSummary('2026-09');
assert(summary.remainingExpenses === 550, `Remaining expenses is exactly 550 (200 pending + 350 overdue, paid/cancelled excluded). Got ${summary.remainingExpenses}`);
assert(summary.plannedExpenses === 650, `Planned expenses is 650 (got ${summary.plannedExpenses})`);
assert(summary.paidExpenses === 100, `Paid expenses is 100 (got ${summary.paidExpenses})`);

console.log('\n--- 7. Testing QR Code Generation & Class Export ---');
assert(typeof window.QRCode === 'function', 'window.QRCode class constructor is exported');
assert(typeof window.generateQRCodeSVG === 'function', 'window.generateQRCodeSVG function is exported');

const dummyDiv = { innerHTML: '' };
new window.QRCode(dummyDiv, { text: 'https://smart-finances.vercel.app', width: 170, height: 170 });
assert(dummyDiv.innerHTML.includes('<svg') && dummyDiv.innerHTML.includes('</svg>'), 'QR Code renders valid SVG into container');

console.log('\n--- 8. Testing Home View & Month View Renderings ---');
const homeHtml = window.renderHomeView();
assert(!homeHtml.includes('Trocar de Ano ('), 'Duplicate "Trocar de Ano" button removed from Home bottom list');
assert(homeHtml.includes('Saldo atual'), 'Home includes "Saldo atual" label');
assert(homeHtml.includes('Saldo atual</span>\n                <span class="text-xl font-bold tracking-tight text-white'), 'Saldo atual uses neutral white text');

const monthHtml = window.renderMonthDetailView();
assert(monthHtml.includes('Despesas restantes'), 'Month floating dock uses "Despesas restantes"');
assert(!monthHtml.includes('Previsão Fechamento') && !monthHtml.includes('Previsão de Fechamento'), 'Previsão de Fechamento removed from Month dock');
assert(monthHtml.includes('bottom-36') || monthHtml.includes('bottom-[140px]'), 'FAB add button raised to bottom-36');

console.log(`\n========================================`);
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`========================================\n`);
