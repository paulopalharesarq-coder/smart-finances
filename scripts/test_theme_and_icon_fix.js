/**
 * Test Suite for Icon Quality, Auto Dark Mode & Manual Theme Selector
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('====================================================');
console.log('🧪 BATERIA DE TESTES: ÍCONES FULL-BLEED E SELETOR DE TEMAS');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. Verificação dos Ícones Full Bleed
// ----------------------------------------------------
console.log('TESTE 1: Integridade e Full-Bleed dos Ícones do PWA');

function readPNGInfo(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8, width, height, idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    pos += 8 + len + 4;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
  }
  const decompressed = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const topLeftAlpha = decompressed[4];
  const bottomRightAlpha = decompressed[(height - 1) * (stride + 1) + (width - 1) * 4 + 4];
  const topLeftR = decompressed[1];
  const topLeftG = decompressed[2];
  const topLeftB = decompressed[3];

  return { width, height, topLeftAlpha, bottomRightAlpha, topLeftR, topLeftG, topLeftB };
}

const appleTouch = readPNGInfo(path.join(__dirname, '../icons/apple-touch-icon.png'));
assert(appleTouch.width === 180 && appleTouch.height === 180, 'apple-touch-icon.png tem dimensões exatas 180x180');
assert(appleTouch.topLeftAlpha === 255, 'apple-touch-icon.png é 100% opaco no canto superior esquerdo (sem transparência de recorte)');
assert(appleTouch.topLeftR > 240 && appleTouch.topLeftG > 220, 'apple-touch-icon.png possui fundo creme full-bleed no canto (sem borda preta ou branca externa)');

const icon512 = readPNGInfo(path.join(__dirname, '../icons/icon-512.png'));
assert(icon512.width === 512 && icon512.height === 512, 'icon-512.png tem dimensões 512x512');
assert(icon512.topLeftAlpha === 255, 'icon-512.png é 100% full bleed opaco');

const maskable512 = readPNGInfo(path.join(__dirname, '../icons/icon-maskable-512.png'));
assert(maskable512.width === 512 && maskable512.height === 512, 'icon-maskable-512.png tem dimensões 512x512');
assert(maskable512.topLeftAlpha === 255, 'icon-maskable-512.png é 100% full bleed no fundo');

assert(fs.existsSync(path.join(__dirname, '../icons/favicon-32.png')), 'favicon-32.png existe');
assert(fs.existsSync(path.join(__dirname, '../icons/icon.svg')), 'icon.svg existe');

// ----------------------------------------------------
// 2. Validação da Sintaxe CSS do Dark Mode
// ----------------------------------------------------
console.log('\nTESTE 2: Validação de Sintaxe CSS do Dark Mode');
const cssContent = fs.readFileSync(path.join(__dirname, '../css/app.css'), 'utf8');

assert(!cssContent.includes('html.dark,') || !cssContent.includes('@media (prefers-color-scheme: dark) { :root'), 'NÃO existe @media agrupado com vírgula em seletor de classe no CSS');
assert(cssContent.includes('html.dark {'), 'css/app.css define regras limpas sob html.dark');
assert(cssContent.includes('@media (prefers-color-scheme: dark) {'), 'css/app.css define regras sob @media (prefers-color-scheme: dark)');

// ----------------------------------------------------
// 3. Validação do Anti-FOUC no index.html
// ----------------------------------------------------
console.log('\nTESTE 3: Anti-FOUC no index.html');
const indexContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexContent.includes('stitch_theme_preference'), 'index.html lê stitch_theme_preference imediatamente no head');
assert(indexContent.includes('document.documentElement.classList.add'), 'index.html inicializa classe do tema antes da renderização do body');

// ----------------------------------------------------
// 4. Validação da Lógica do Motor de Temas
// ----------------------------------------------------
console.log('\nTESTE 4: Motor de Temas (Automático, Claro, Escuro)');

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v.toString(); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

let currentSystemDark = false;
const docClassList = new Set();
const docElementMock = {
  classList: {
    add: (c) => docClassList.add(c),
    remove: (c) => docClassList.delete(c),
    contains: (c) => docClassList.has(c)
  }
};

global.window = {
  localStorage: localStorageMock,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: (query) => ({
    matches: query.includes('dark') ? currentSystemDark : !currentSystemDark,
    addEventListener: () => {},
    addListener: () => {}
  }),
  showToast: () => {},
  closeModal: () => {},
  closeKeypad: () => {},
  renderTotalBar: () => '',
  renderHomeView: () => '',
  renderCartView: () => '',
  renderCategoriesView: () => '',
  renderHistoryView: () => '',
  renderSettingsView: () => ''
};
global.document = {
  documentElement: docElementMock,
  readyState: 'complete',
  getElementById: (id) => ({ innerHTML: '', classList: { add: () => {}, remove: () => {} } }),
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.localStorage = localStorageMock;

// Load store and app
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/settingsView.js'), 'utf8'));

const store = window.shoppingStore;

// Caso A: Padrão é 'system', SO está claro -> app fica claro
currentSystemDark = false;
window.applyThemePreference('system');
assert(!docClassList.has('dark') && docClassList.has('light'), 'Modo Automático + Celular Claro = App em tema Claro');

// Caso B: Padrão é 'system', SO muda para escuro -> app muda para escuro sem reload
currentSystemDark = true;
window.applyThemePreference('system');
assert(docClassList.has('dark') && !docClassList.has('light'), 'Modo Automático + Celular Escuro = App em tema Escuro');

// Caso C: Seleção manual 'light' + SO em escuro -> app permanece claro
store.setThemePreference('light');
assert(localStorageMock.getItem('stitch_theme_preference') === 'light', 'Preferência "light" salva no localStorage');
window.applyThemePreference('light');
assert(!docClassList.has('dark') && docClassList.has('light'), 'Modo Claro manual + Celular Escuro = App permanece Claro');

// Caso D: Seleção manual 'dark' + SO em claro -> app permanece escuro
currentSystemDark = false;
store.setThemePreference('dark');
assert(localStorageMock.getItem('stitch_theme_preference') === 'dark', 'Preferência "dark" salva no localStorage');
window.applyThemePreference('dark');
assert(docClassList.has('dark') && !docClassList.has('light'), 'Modo Escuro manual + Celular Claro = App permanece Escuro');

// Caso E: Voltar para 'system' -> volta a respeitar SO (que agora é claro)
store.setThemePreference('system');
assert(localStorageMock.getItem('stitch_theme_preference') === 'system', 'Preferência "system" salva no localStorage');
window.applyThemePreference('system');
assert(!docClassList.has('dark') && docClassList.has('light'), 'Retorno para Automático + Celular Claro = App volta para Claro');

// ----------------------------------------------------
// 5. Validação da Renderização do Seletor na View de Configurações
// ----------------------------------------------------
console.log('\nTESTE 5: Renderização do Seletor de Tema em Configurações');
const settingsHtml = window.renderSettingsView();

assert(settingsHtml.includes('Aparência do Aplicativo'), 'Tela de configurações exibe seção "Aparência do Aplicativo"');
assert(settingsHtml.includes("setThemePreference('system')"), 'Contém botão para selecionar tema Automático');
assert(settingsHtml.includes("setThemePreference('light')"), 'Contém botão para selecionar tema Claro');
assert(settingsHtml.includes("setThemePreference('dark')"), 'Contém botão para selecionar tema Escuro');
assert(settingsHtml.includes('phone_iphone') && settingsHtml.includes('light_mode') && settingsHtml.includes('dark_mode'), 'Botões possuem ícones correspondentes');

console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${testsPassed} PASSOU | ${testsFailed} FALHOU`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
