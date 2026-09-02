/**
 * Comprehensive Validation Test Suite for UI Refinements and Custom Icon Preservation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

console.log('====================================================');
console.log('🧪 BATERIA DE TESTES: REFINAMENTOS VISUAIS E ÍCONES');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Validar CSS (Preservação de cor de card, glassmorphism e classes)
console.log('TESTE 1: Validação do CSS (css/app.css)');
const cssContent = fs.readFileSync('css/app.css', 'utf8');

// Verificar que a cor do card NÃO é sobrescrita para surface-container no dark mode
assert(
  !cssContent.includes('html.dark .category-item-card {\n  background-color: var(--color-surface-container) !important;'),
  'Dark mode NÃO substitui cor dos cards por surface-container'
);
assert(
  cssContent.includes('.category-item-card {\n  background-color: var(--cat-bg, var(--color-surface-container)) !important;'),
  'Cards de categoria mantêm var(--cat-bg) com prioridade'
);

// Verificar variáveis de glassmorphism no dark mode
assert(
  cssContent.includes('--glass-bg: rgba(31, 23, 18, 0.72);'),
  '--glass-bg no dark mode tem translucidez restaurada (0.72)'
);
assert(
  cssContent.includes('--glass-border: rgba(255, 255, 255, 0.12);'),
  '--glass-border no dark mode tem brilho sutil refinado'
);

// Verificar estilos de quantidade e modais
assert(
  cssContent.includes('.qty-stepper {'),
  'Classe .qty-stepper existe no CSS com visual off-white e blur'
);
assert(
  cssContent.includes('.floating-modal-sheet {'),
  'Classe .floating-modal-sheet existe no CSS com elevação e profundidade'
);

// 2. Validar Carrinho (cartView.js)
console.log('\nTESTE 2: Validação do Carrinho (js/views/cartView.js)');
const cartViewContent = fs.readFileSync('js/views/cartView.js', 'utf8');

assert(
  cartViewContent.includes('qty-stepper'),
  'Seletor de quantidade no carrinho utiliza classe qty-stepper'
);
assert(
  cartViewContent.includes('overflow-hidden') && cartViewContent.includes('truncate'),
  'Seletor de lista no topo do carrinho possui proteção contra overflow'
);
assert(
  !cartViewContent.includes('backdrop-blur-md sticky top-0') && cartViewContent.includes('bg-background'),
  'Cabeçalho do carrinho é 100% sólido e opaco (sem backdrop blur)'
);

// 3. Validar Ajustes / Perfil (settingsView.js)
console.log('\nTESTE 3: Validação do Perfil (js/views/settingsView.js)');
const settingsViewContent = fs.readFileSync('js/views/settingsView.js', 'utf8');

assert(
  settingsViewContent.includes('icons/icon-192.png') || settingsViewContent.includes('./icons/icon-192.png'),
  'Imagem de perfil em Ajustes utiliza o ícone oficial do app'
);
assert(
  !settingsViewContent.includes('backdrop-blur-md sticky top-0') && settingsViewContent.includes('bg-background'),
  'Cabeçalho de Ajustes é 100% sólido e opaco (sem backdrop blur)'
);

// 4. Validar Modais (modals.js)
console.log('\nTESTE 4: Validação dos Modais (js/components/modals.js)');
const modalsContent = fs.readFileSync('js/components/modals.js', 'utf8');

assert(
  modalsContent.includes('backdrop-blur-md'),
  'Modais utilizam backdrop-blur-md para separação nítida do fundo'
);
assert(
  modalsContent.includes('floating-modal-sheet'),
  'Telas flutuantes utilizam floating-modal-sheet'
);

// 5. Validar Diferenciação da Paleta de Categorias
console.log('\nTESTE 5: Diferenciação da Paleta de Cores');
const storeContent = fs.readFileSync('js/store.js', 'utf8');

// Greens: folha (#dcfce7) vs teal (#ccfbf1)
assert(
  modalsContent.includes('#dcfce7') && modalsContent.includes('#ccfbf1'),
  'Dois tons de verde claramente diferenciados (#dcfce7 Verde Folha vs #ccfbf1 Teal)'
);
// Beige (#feeadf) vs Yellow (#fef08a)
assert(
  modalsContent.includes('#feeadf') && modalsContent.includes('#fef08a'),
  'Bege e Amarelo claramente diferenciados (#feeadf Bege vs #fef08a Amarelo Solar)'
);
// Red (#fee2e2) vs Pink (#fce7f3)
assert(
  modalsContent.includes('#fee2e2') && modalsContent.includes('#fce7f3'),
  'Vermelho e Rosa claramente diferenciados (#fee2e2 Vermelho vs #fce7f3 Rosa Pink)'
);

// 6. Validar Preservação dos Ícones no Build
console.log('\nTESTE 6: Preservação de Ícones no Build (scripts/build.js)');
const buildContent = fs.readFileSync('scripts/build.js', 'utf8');

assert(
  !buildContent.includes("require('./generate_icons.js')") && !buildContent.includes('generate_icons'),
  'scripts/build.js NÃO chama mais o gerador de ícones automático'
);

const iconFiles = [
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png',
  'icons/favicon-32.png',
  'icons/source_icon.png'
];

const hashesBefore = iconFiles.map(f => ({ file: f, hash: crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex') }));
cp.execSync('node scripts/build.js');
const hashesAfter = iconFiles.map(f => ({ file: f, hash: crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex') }));

let allMatch = true;
for (let i = 0; i < iconFiles.length; i++) {
  if (hashesBefore[i].hash !== hashesAfter[i].hash) {
    allMatch = false;
    console.error(`  Hash mismatch on ${iconFiles[i]}`);
  }
}
assert(allMatch, 'Todos os arquivos de ícone mantiveram hash binário 100% idêntico após node scripts/build.js');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
