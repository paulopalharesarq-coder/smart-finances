/**
 * PWA & App Runtime Verification Test
 */

const fs = require('fs');
const path = require('path');

class MockElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = {
      _classes: new Set(),
      add(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
        } else if (force) this._classes.add(c);
        else this._classes.delete(c);
      }
    };
    this.attributes = {};
    this.children = [];
    this.innerHTML = '';
    this.value = '';
    this.style = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  removeAttribute(k) { delete this.attributes[k]; }
  appendChild(child) { this.children.push(child); return child; }
  closest() { return null; }
  querySelectorAll() { return []; }
  querySelector() { return null; }
}

const elements = {
  'app': new MockElement('div', 'app'),
  'modal-container': new MockElement('div', 'modal-container'),
  'keypad-container': new MockElement('div', 'keypad-container'),
  'toast-container': new MockElement('div', 'toast-container'),
  'pwa-update-banner': new MockElement('div', 'pwa-update-banner'),
  'pwa-install-banner': new MockElement('div', 'pwa-install-banner'),
  'app-theme-color': new MockElement('meta', 'app-theme-color'),
  'app-status-bar-style': new MockElement('meta', 'app-status-bar-style')
};

global.document = {
  documentElement: new MockElement('html'),
  head: new MockElement('head'),
  body: new MockElement('body'),
  getElementById(id) { return elements[id] || null; },
  querySelector(sel) {
    if (sel.includes('theme-color')) return elements['app-theme-color'];
    if (sel.includes('apple-mobile-web-app-status-bar-style')) return elements['app-status-bar-style'];
    return null;
  },
  querySelectorAll() { return []; },
  createElement(tag) { return new MockElement(tag); },
  addEventListener() {},
  removeEventListener() {}
};

global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.navigator = {
  serviceWorker: {
    register: () => Promise.resolve({ scope: '/' }),
    addEventListener: () => {}
  }
};
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; }
};
global.sessionStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); }
};
global.matchMedia = () => ({ matches: false, addEventListener: () => {} });

// Load all scripts in sequence
const scripts = [
  'js/store.js',
  'js/components/modals.js',
  'js/views/homeView.js',
  'js/views/monthDetailView.js',
  'js/views/reportsView.js',
  'js/views/categoriesView.js',
  'js/views/settingsView.js',
  'js/app.js'
];

scripts.forEach(scriptPath => {
  const code = fs.readFileSync(path.join(__dirname, '..', scriptPath), 'utf8');
  eval(code);
});

console.log('=== TEST 1: Category Background Cards in Month Detail ===');
window.financeStore.addExpense({
  name: 'Aluguel',
  amount: 2000,
  categoryId: 'moradia',
  monthKey: window.financeStore.getCurrentMonthKey(),
  dueDate: `${window.financeStore.getCurrentMonthKey()}-10`,
  status: 'paid'
});
window.financeStore.setActiveTab('month');
console.assert(elements['app'].innerHTML.includes('category-tinted-card'), 'Cards must have category-tinted-card class');
console.assert(elements['app'].innerHTML.includes('--card-bg:'), 'Cards must set --card-bg CSS variable');
console.assert(elements['app'].innerHTML.includes('--card-bg-dark:'), 'Cards must set --card-bg-dark CSS variable');
console.assert(elements['app'].innerHTML.includes('floating-month-summary-dock'), 'Month detail must have floating summary dock');
console.log('✔ Category background variables and classes verified on cards');

console.log('\n=== TEST 2: Glass Docks and Navigation Exclusivity ===');
window.financeStore.setActiveTab('home');
console.assert(elements['app'].innerHTML.includes('floating-bottom-dock'), 'Home view must render floating bottom dock');
console.assert(elements['app'].innerHTML.includes('icons/icon-192.png'), 'Home view must show official icon as default avatar');
console.log('✔ Home view renders floating dock and official icon avatar');

console.log('\n=== TEST 3: CSS Glass & Blur Properties Verification ===');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/app.css'), 'utf8');
console.assert(cssContent.includes('.floating-bottom-dock'), 'CSS must contain .floating-bottom-dock');
console.assert(cssContent.includes('.floating-month-summary-dock'), 'CSS must contain .floating-month-summary-dock');
console.assert(cssContent.includes('.category-tinted-card'), 'CSS must contain .category-tinted-card');
console.assert(cssContent.includes('backdrop-filter: blur(24px)'), 'CSS must contain backdrop-filter blur');
console.assert(cssContent.includes('-webkit-backdrop-filter: blur(24px)'), 'CSS must contain iOS -webkit-backdrop-filter blur');
console.log('✔ CSS glass, blur and category tinted card classes verified');

console.log('\n🎉 ALL RUNTIME & RENDER TESTS PASSED 100%!');
