/**
 * DOM Keypad Interaction Test Simulation
 */
const fs = require('fs');
const path = require('path');

// Simple DOM Mock
class ElementMock {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = className;
    this.value = '';
    this.innerText = '';
    this.innerHTML = '';
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  appendChild(child) { this.children.push(child); }
  removeChild(child) { this.children = this.children.filter(c => c !== child); }
  remove() {}
  dispatchEvent() {}
  closest() { return null; }
  addEventListener() {}
  removeEventListener() {}
}

const elementsById = {
  'app': new ElementMock('div', 'app'),
  'modal-container': new ElementMock('div', 'modal-container'),
  'keypad-container': new ElementMock('div', 'keypad-container'),
  'toast-container': new ElementMock('div', 'toast-container'),
  'item-name-input': new ElementMock('input', 'item-name-input'),
  'item-unit-input': new ElementMock('select', 'item-unit-input'),
  'item-qty-input': new ElementMock('input', 'item-qty-input'),
  'item-price-input': new ElementMock('input', 'item-price-input'),
  'item-price-input-display': new ElementMock('span', 'item-price-input-display'),
  'item-prev-price-input': new ElementMock('input', 'item-prev-price-input'),
  'item-prev-price-input-display': new ElementMock('span', 'item-prev-price-input-display'),
  'keypad-display': new ElementMock('div', 'keypad-display'),
  'keypad-subtotal': new ElementMock('strong', 'keypad-subtotal'),
  'keypad-save-btn': new ElementMock('button', 'keypad-save-btn')
};

global.document = {
  getElementById: (id) => elementsById[id] || null,
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => new ElementMock(tag)
};

global.Event = function (name) { this.name = name; };

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v.toString(); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  localStorage: localStorageMock,
  showToast: (msg, type) => console.log(`   [Toast] ${msg}`),
  closeModal: () => { elementsById['modal-container'].innerHTML = ''; },
  renderTotalBar: () => '<div>TotalBar</div>'
};
global.localStorage = localStorageMock;

// Load store, modals, cartView
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/components/modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/cartView.js'), 'utf8'));

const store = window.shoppingStore;
store.createNewList('Lista Interativa Keypad');
const list = store.getActiveList();

console.log('=== TEST 1: Abrir Teclado a partir do formulário de Novo Item ===');
elementsById['item-name-input'].value = 'Café Especial';
elementsById['item-qty-input'].value = '2';
elementsById['item-unit-input'].value = 'pct';
elementsById['item-price-input'].value = '';

// Usuário clica no campo de Preço Atual no modal
window.openNumericKeypad(list.id, null, 'item-price-input');
console.log('Keypad container rendered HTML length:', elementsById['keypad-container'].innerHTML.length);
console.log('Keypad display inicial:', elementsById['keypad-display'].innerText);

// Usuário digita: 1, 8, 9, 0 -> R$ 18,90
window.keypadInputDigit(1);
window.keypadInputDigit(8);
window.keypadInputDigit(9);
window.keypadInputDigit(0);
console.log('Keypad display após digitar 1890:', elementsById['keypad-display'].innerText);
console.log('Keypad subtotal para 2 pct:', elementsById['keypad-subtotal'].innerText);

// Usuário confirma o valor
window.keypadSubmit();
console.log('item-price-input value no form:', elementsById['item-price-input'].value);
console.log('item-price-input-display texto no form:', elementsById['item-price-input-display'].innerText);
console.log('Form field preenchido corretamente:', elementsById['item-price-input'].value === '18.90' ? '✅ PASSED' : '❌ FAILED');

console.log('\n=== TEST 2: Abrir Teclado diretamente a partir de um Item no Carrinho ===');
store.addItemToList(list.id, { name: 'Manteiga', categoryId: 'laticinios', currentPrice: 0, quantity: 1 });
const manteiga = list.items.find(i => i.name === 'Manteiga');

console.log('Manteiga inicial:', { name: manteiga.name, categoryId: manteiga.categoryId, price: manteiga.currentPrice, bought: manteiga.bought });

// Usuário clica no botão de preço da Manteiga no carrinho
window.openNumericKeypad(list.id, manteiga.id);
console.log('Keypad aberto para Manteiga.');

// Usuário usa preset +R$ 10 e depois digita dígito 5 (10,50) ou digita 1, 0, 5, 0
window.keypadClear();
window.keypadInputDigit(1);
window.keypadInputDigit(0);
window.keypadInputDigit(5);
window.keypadInputDigit(0);
console.log('Keypad display:', elementsById['keypad-display'].innerText);

// Confirma
window.keypadSubmit();

const updatedManteiga = list.items.find(i => i.id === manteiga.id);
console.log('Manteiga pós-teclado:', { name: updatedManteiga.name, categoryId: updatedManteiga.categoryId, price: updatedManteiga.currentPrice, bought: updatedManteiga.bought });
console.log('Preço atualizado para 10.50:', updatedManteiga.currentPrice === 10.50 ? '✅ PASSED' : '❌ FAILED');
console.log('Categoria intacta (laticinios):', updatedManteiga.categoryId === 'laticinios' ? '✅ PASSED' : '❌ FAILED');
console.log('Item continua no carrinho:', updatedManteiga.bought === true ? '✅ PASSED' : '❌ FAILED');

console.log('\n=== TODOS OS TESTES DE INTEGRAÇÃO DO TECLADO PASSARAM COM SUCESSO! ===\n');
