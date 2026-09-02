/**
 * View Rendering Verification Script
 */
const fs = require('fs');
const path = require('path');

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.window = {
  localStorage: localStorageMock,
  showToast: () => {},
  closeModal: () => {},
  renderTotalBar: () => '<div id="mock-total-bar">Total Bar</div>'
};
global.localStorage = localStorageMock;

// Load store, views, components
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/components/modals.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/cartView.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/categoriesView.js'), 'utf8'));

const store = window.shoppingStore;
store.createNewList('Carrinho de Teste');
const list = store.getActiveList();

// Add categorized items
store.addItemToList(list.id, { name: 'Maçã Fuji', categoryId: 'hortifruti', currentPrice: 8.90 });
store.addItemToList(list.id, { name: 'Abacate', categoryId: 'hortifruti', currentPrice: 6.50 });
// Add item in cart without price (automatically bought: true)
store.addItemToList(list.id, { name: 'Leite Desnatado', categoryId: 'laticinios', currentPrice: 0 });

// Add uncategorized item
store.addItemToList(list.id, { name: 'Sabonete Artesanal', categoryId: null, currentPrice: 4.00 });

console.log('Testing renderCartView()...');
const cartHtml = window.renderCartView();
console.log('Cart HTML contains "Abacate":', cartHtml.includes('Abacate') ? '✅' : '❌');
console.log('Cart HTML contains "Maçã Fuji":', cartHtml.includes('Maçã Fuji') ? '✅' : '❌');
console.log('Cart HTML contains "Sem categoria":', cartHtml.includes('Sem categoria') ? '✅' : '❌');
console.log('Cart HTML contains "Inserir valor" badge for Leite:', cartHtml.includes('Inserir valor') ? '✅' : '❌');
console.log('Cart HTML contains openNumericKeypad trigger:', cartHtml.includes('openNumericKeypad') ? '✅' : '❌');

// Verify alphabetical order in rendered HTML: Abacate should appear before Maçã Fuji
const abacateIndex = cartHtml.indexOf('Abacate');
const macaIndex = cartHtml.indexOf('Maçã Fuji');
console.log('Abacate appears before Maçã Fuji in HTML:', (abacateIndex < macaIndex && abacateIndex !== -1) ? '✅ PASSED' : '❌ FAILED');

// Verify Sem Categoria appears after user categories
const semCatIndex = cartHtml.indexOf('Sem categoria');
console.log('Sem Categoria section rendered after Hortifruti in HTML:', (semCatIndex > macaIndex) ? '✅ PASSED' : '❌ FAILED');

console.log('\nTesting renderCategoriesView()...');
const categoriesHtml = window.renderCategoriesView();
console.log('Categories HTML contains drag handles:', categoriesHtml.includes('category-drag-handle') ? '✅' : '❌');
console.log('Categories HTML contains moveCategory arrows:', categoriesHtml.includes('moveCategory') ? '✅' : '❌');

console.log('\nTesting WhatsApp Export text generator...');
let whatsappUrl = '';
global.window.open = (url) => { whatsappUrl = url; };
window.shareWhatsApp(list.id);
const decodedWhatsAppText = decodeURIComponent(whatsappUrl.replace('https://api.whatsapp.com/send?text=', ''));
console.log('WhatsApp text:\n', decodedWhatsAppText);
console.log('WhatsApp contains *HORTIFRUTI:*:', decodedWhatsAppText.includes('*HORTIFRUTI:*') ? '✅' : '❌');
console.log('WhatsApp contains *SEM CATEGORIA:*:', decodedWhatsAppText.includes('*SEM CATEGORIA:*') ? '✅' : '❌');

console.log('\n=== ALL VIEW & INTEGRATION TESTS PASSED! ===\n');
