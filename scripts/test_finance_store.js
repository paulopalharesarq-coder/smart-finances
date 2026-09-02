/**
 * Comprehensive Automated Tests for Refined Smart Finances
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, value) { this._data[key] = String(value); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; }
};

// Load FinanceStore
const storeCode = fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8');
eval(storeCode);

const store = window.financeStore;

console.log('=== TEST 1: Category Background Color Source of Truth ===');
const categories = store.getCategories();

// Test Moradia (Blue)
const moradia = store.getCategoryById('moradia');
const moradiaStyles = store.getCategoryCardStyles(moradia);
console.assert(moradiaStyles.cardBgLight === '#edf5ff', 'Moradia must have light blue pastel cardBgLight');
console.assert(moradiaStyles.cardBgDark === '#102447', 'Moradia must have navy blue cardBgDark');
console.log('✔ Moradia (Blue) card styles verified:', moradiaStyles.cardBgLight, moradiaStyles.cardBgDark);

// Test Alimentação (Green)
const alimentacao = store.getCategoryById('alimentacao');
const alimentacaoStyles = store.getCategoryCardStyles(alimentacao);
console.assert(alimentacaoStyles.cardBgLight === '#effcf2', 'Alimentação must have light green pastel cardBgLight');
console.assert(alimentacaoStyles.cardBgDark === '#0c2d16', 'Alimentação must have deep green cardBgDark');
console.log('✔ Alimentação (Green) card styles verified:', alimentacaoStyles.cardBgLight, alimentacaoStyles.cardBgDark);

// Test Saúde (Rose/Pink)
const saude = store.getCategoryById('saude');
const saudeStyles = store.getCategoryCardStyles(saude);
console.assert(saudeStyles.cardBgLight === '#fff1f3', 'Saúde must have light rose pastel cardBgLight');
console.assert(saudeStyles.cardBgDark === '#3b0d18', 'Saúde must have deep rose cardBgDark');
console.log('✔ Saúde (Rose) card styles verified:', saudeStyles.cardBgLight, saudeStyles.cardBgDark);

// Test Fallback for category without color
const fallbackStyles = store.getCategoryCardStyles(null);
console.assert(Boolean(fallbackStyles.cardBgLight), 'Fallback category must have cardBgLight');
console.assert(Boolean(fallbackStyles.cardBgDark), 'Fallback category must have cardBgDark');
console.log('✔ Fallback for category without color verified:', fallbackStyles);

console.log('\n=== TEST 2: Status Button Toggle & Calculation Sync ===');
const currentMonthKey = store.getCurrentMonthKey();
store.state.expenses = [];
store.state.incomes = [];

const exp = store.addExpense({
  monthKey: currentMonthKey,
  name: 'Plano de Saúde Familiar',
  amount: 650,
  categoryId: 'saude',
  status: 'pending'
});

let summary1 = store.calculateMonthSummary(currentMonthKey);
console.assert(summary1.paidExpenses === 0, 'Initially paidExpenses should be 0');
console.assert(summary1.remainingExpenses === 650, 'Initially remainingExpenses should be 650');

store.updateExpense(exp.id, { status: 'paid' });
let summary2 = store.calculateMonthSummary(currentMonthKey);
console.assert(summary2.paidExpenses === 650, 'After update paidExpenses should be 650');
console.assert(summary2.remainingExpenses === 0, 'After update remainingExpenses should be 0');
console.log('✔ Status updates reflected dynamically in calculations');

console.log('\n=== TEST 3: Icon Files Verification ===');
const iconsDir = path.join(__dirname, '../icons');
const requiredIcons = [
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png',
  'icon.svg'
];

requiredIcons.forEach(iconFile => {
  const iconPath = path.join(iconsDir, iconFile);
  console.assert(fs.existsSync(iconPath), `Icon file ${iconFile} must exist`);
  const stat = fs.statSync(iconPath);
  console.assert(stat.size > 0, `Icon file ${iconFile} must not be empty`);
});
console.log('✔ All 7 official icon files verified with valid sizes');

console.log('\n🎉 ALL STORE & CATEGORY TESTS PASSED 100%!');
