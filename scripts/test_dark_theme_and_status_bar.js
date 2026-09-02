/**
 * Automated Verification Suite for Solid Headers, Dark Mode Cards & Dynamic Status Bar Sync
 */

const fs = require('fs');
const cp = require('child_process');

console.log('================================================================');
console.log('🧪 BATERIA DE TESTES: CABEÇALHOS SÓLIDOS, CARDS ESCUROS & STATUS BAR');
console.log('================================================================\n');

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

// 1. Cabeçalhos 100% Sólidos (Sem transparência / sem blur)
console.log('TESTE 1: Cabeçalhos das Telas 100% Sólidos e Opacos');
const views = [
  { name: 'Home', file: 'js/views/homeView.js' },
  { name: 'Cart', file: 'js/views/cartView.js' },
  { name: 'Categories', file: 'js/views/categoriesView.js' },
  { name: 'History', file: 'js/views/historyView.js' },
  { name: 'Settings', file: 'js/views/settingsView.js' }
];

views.forEach(v => {
  const content = fs.readFileSync(v.file, 'utf8');
  assert(
    !content.includes('header class="bg-background/80') && !content.includes('backdrop-blur-md sticky top-0'),
    `${v.name} header NÃO possui classes de transparência/blur`
  );
  assert(
    content.includes('<header class="bg-background') || content.includes('<header class="flex justify-between items-center w-full px-5 py-4 bg-background'),
    `${v.name} header possui classe sólida bg-background`
  );
  assert(
    !content.includes('<header') || !content.match(/<header[^>]*border-b/i),
    `${v.name} header NÃO possui classe border-b ou linha divisória`
  );
});

const cssContent = fs.readFileSync('css/app.css', 'utf8');
assert(
  cssContent.includes('header.bg-background') && 
  cssContent.includes('border: none !important;') && 
  cssContent.includes('border-bottom: none !important;') &&
  cssContent.includes('backdrop-filter: none !important;'),
  'css/app.css garante ausência total de bordas, linhas e filtros no cabeçalho'
);

// 2. Mapeamento de Cores dos Cards no Tema Escuro
console.log('\nTESTE 2: Cards de Categoria no Tema Escuro (Cores Escuras Saturadas + Alto Contraste)');
const darkColorMappings = [
  { name: 'Bege/Terracota', light: '#feeadf', dark: '#382318' },
  { name: 'Verde Folha', light: '#dcfce7', dark: '#133822' },
  { name: 'Vermelho/Açougue', light: '#fee2e2', dark: '#421717' },
  { name: 'Azul Céu', light: '#e0f2fe', dark: '#142d47' },
  { name: 'Amarelo Solar', light: '#fef08a', dark: '#3d3008' },
  { name: 'Lilás/Roxo', light: '#f3e8ff', dark: '#34194c' },
  { name: 'Verde Petróleo/Teal', light: '#ccfbf1', dark: '#0f383a' },
  { name: 'Rosa Pink', light: '#fce7f3', dark: '#471530' }
];

darkColorMappings.forEach(mapping => {
  assert(
    cssContent.includes(`html.dark .category-item-card[style*="${mapping.light}"]`) &&
    cssContent.includes(`background-color: ${mapping.dark} !important`),
    `Card ${mapping.name} (${mapping.light}) mapeado para tom escuro e saturado (${mapping.dark}) no dark mode`
  );
});

assert(
  cssContent.includes('html.dark .category-item-card h3') &&
  cssContent.includes('color: #fcf6f2 !important;'),
  'Títulos dos produtos nos cards possuem cor clara de alto contraste (#fcf6f2) no dark mode'
);

// 3. Seletor de Quantidade no Dark Mode
console.log('\nTESTE 3: Seletor de Quantidade no Dark Mode');
assert(
  cssContent.includes('html.dark .qty-stepper') &&
  cssContent.includes('background-color: rgba(255, 255, 255, 0.18) !important;'),
  '.qty-stepper tem superfície elevada fosca translúcida no dark mode'
);
assert(
  cssContent.includes('html.dark .qty-stepper') &&
  cssContent.includes('color: #ffffff !important;'),
  '.qty-stepper usa texto e botões brancos no dark mode para máximo destaque'
);

// 4. Sincronização Dinâmica da Barra de Status / Theme-Color no iPhone e PWA
console.log('\nTESTE 4: Sincronização Dinâmica da Barra de Status / Theme-Color');
const indexContent = fs.readFileSync('index.html', 'utf8');
const appJsContent = fs.readFileSync('js/app.js', 'utf8');

assert(
  indexContent.includes('id="app-theme-color" content="#fff8f5"') &&
  indexContent.includes('id="app-status-bar-style" content="default"'),
  'index.html possui tags dinâmicas de theme-color e apple-mobile-web-app-status-bar-style'
);

assert(
  indexContent.includes('const themeColorMeta = document.getElementById(\'app-theme-color\');') &&
  indexContent.includes('themeColorMeta.setAttribute(\'content\', isDark ? \'#18120d\' : \'#fff8f5\');'),
  'index.html inicializa theme-color imediatamente antes da renderização'
);

assert(
  appJsContent.includes('function updateStatusBarTheme(isDark)') &&
  appJsContent.includes('themeColorMeta.setAttribute(\'content\', effectiveColor);') &&
  appJsContent.includes('appleStatusBarMeta.setAttribute(\'content\', isDark ? \'black\' : \'default\');'),
  'js/app.js possui função updateStatusBarTheme para atualizar barra de status em tempo real'
);

assert(
  appJsContent.includes('updateStatusBarTheme(isDark);'),
  'applyThemePreference chama updateStatusBarTheme ao alterar tema (manual ou automático)'
);

// 5. Preservação dos Ícones no Build
console.log('\nTESTE 5: Preservação de Ícones no Build');
const buildOutput = cp.execSync('node scripts/build.js').toString();
assert(
  buildOutput.includes('Preserved all custom icon assets'),
  'Build executado com sucesso e confirmou preservação de ícones'
);

console.log('\n================================================================');
console.log(`📊 RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
