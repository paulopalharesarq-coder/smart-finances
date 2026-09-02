/**
 * Test Suite for:
 * 1. PWA Icons integrity (512x512, 192x192, 180x180, maskable, favicon-32, SVG)
 * 2. Dark Mode CSS Tokens and theme-color meta configuration
 * 3. Automatic prefers-color-scheme listener
 * 4. Tailwind CSS variable mapping
 */

const fs = require('fs');
const path = require('path');

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

console.log('====================================================');
console.log('🧪 INICIANDO TESTES DE ÍCONES DO PWA E DARK MODE');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. Verificação dos Arquivos de Ícone
// ----------------------------------------------------
console.log('TESTE 1: Integridade dos Ícones do PWA');
const iconsDir = path.join(__dirname, '../icons');

function getPNGDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.readUInt32BE(0) !== 0x89504E47) {
    throw new Error('Not a PNG');
  }
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20)
  };
}

const icon512 = getPNGDimensions(path.join(iconsDir, 'icon-512.png'));
assert(icon512.width === 512 && icon512.height === 512, 'icon-512.png possui dimensões exatas de 512x512');

const icon192 = getPNGDimensions(path.join(iconsDir, 'icon-192.png'));
assert(icon192.width === 192 && icon192.height === 192, 'icon-192.png possui dimensões exatas de 192x192');

const appleTouchIcon = getPNGDimensions(path.join(iconsDir, 'apple-touch-icon.png'));
assert(appleTouchIcon.width === 180 && appleTouchIcon.height === 180, 'apple-touch-icon.png possui dimensões exatas de 180x180');

const maskable512 = getPNGDimensions(path.join(iconsDir, 'icon-maskable-512.png'));
assert(maskable512.width === 512 && maskable512.height === 512, 'icon-maskable-512.png possui dimensões exatas de 512x512');

const maskable192 = getPNGDimensions(path.join(iconsDir, 'icon-maskable-192.png'));
assert(maskable192.width === 192 && maskable192.height === 192, 'icon-maskable-192.png possui dimensões exatas de 192x192');

const favicon32 = getPNGDimensions(path.join(iconsDir, 'favicon-32.png'));
assert(favicon32.width === 32 && favicon32.height === 32, 'favicon-32.png possui dimensões exatas de 32x32');

const svgContent = fs.readFileSync(path.join(iconsDir, 'icon.svg'), 'utf8');
assert(svgContent.includes('<svg') && svgContent.includes('</svg>'), 'icon.svg é um arquivo vetorial válido');

// ----------------------------------------------------
// 2. Verificação do Manifest e index.html para Ícones
// ----------------------------------------------------
console.log('\nTESTE 2: Mapeamento no Manifest e index.html');
const manifestContent = fs.readFileSync(path.join(__dirname, '../manifest.webmanifest'), 'utf8');
const manifest = JSON.parse(manifestContent);

assert(manifest.icons.some(i => i.src === 'icons/icon-192.png' && i.sizes === '192x192'), 'Manifest inclui icon-192.png');
assert(manifest.icons.some(i => i.src === 'icons/icon-512.png' && i.sizes === '512x512'), 'Manifest inclui icon-512.png');
assert(manifest.icons.some(i => i.src === 'icons/icon-maskable-192.png' && i.purpose === 'maskable'), 'Manifest inclui icon-maskable-192.png');
assert(manifest.icons.some(i => i.src === 'icons/icon-maskable-512.png' && i.purpose === 'maskable'), 'Manifest inclui icon-maskable-512.png');

const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('href="icons/favicon-32.png"'), 'index.html referencia favicon-32.png');
assert(indexHtml.includes('href="icons/icon.svg"'), 'index.html referencia icon.svg');
assert(indexHtml.includes('href="icons/apple-touch-icon.png"'), 'index.html referencia apple-touch-icon.png');

// ----------------------------------------------------
// 3. Verificação do Dark Mode (Meta tags e CSS Tokens)
// ----------------------------------------------------
console.log('\nTESTE 3: Configuração de Dark Mode');
assert(indexHtml.includes('<meta name="color-scheme" content="light dark">'), 'index.html possui meta color-scheme light dark');
assert(indexHtml.includes('name="theme-color"') && indexHtml.includes('media="(prefers-color-scheme: light)"'), 'index.html possui theme-color com media query light');
assert(indexHtml.includes('name="theme-color"') && indexHtml.includes('media="(prefers-color-scheme: dark)"'), 'index.html possui theme-color com media query dark');

const cssContent = fs.readFileSync(path.join(__dirname, '../css/app.css'), 'utf8');
assert(cssContent.includes('--color-background: #fff8f5;'), 'app.css define background claro');
assert(cssContent.includes('--color-background: #18120d;'), 'app.css define background escuro');
assert(cssContent.includes('--color-surface-container: #feeadf;'), 'app.css define surface-container claro');
assert(cssContent.includes('--color-surface-container: #2b2019;'), 'app.css define surface-container escuro');
assert(cssContent.includes('--color-on-surface: #231a13;'), 'app.css define on-surface claro');
assert(cssContent.includes('--color-on-surface: #f2dfd4;'), 'app.css define on-surface escuro');
assert(cssContent.includes('prefers-color-scheme: dark'), 'app.css possui regra @media (prefers-color-scheme: dark)');

// ----------------------------------------------------
// 4. Verificação do JS Listener para prefers-color-scheme
// ----------------------------------------------------
console.log('\nTESTE 4: Sincronização Dinâmica em js/app.js');
const appJsContent = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
assert(appJsContent.includes("window.matchMedia('(prefers-color-scheme: dark)')"), 'js/app.js monitora prefers-color-scheme');
assert(appJsContent.includes("classList.add('dark')"), 'js/app.js adiciona classe dark no tema escuro');
assert(appJsContent.includes("classList.remove('dark')"), 'js/app.js remove classe dark no tema claro');
assert(appJsContent.includes("addEventListener('change'"), 'js/app.js possui ouvinte de mudança de preferência do SO em tempo real');

// ----------------------------------------------------
// 5. Verificação do Service Worker precache
// ----------------------------------------------------
console.log('\nTESTE 5: Service Worker Cache Version');
const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
assert(swContent.includes("CACHE_NAME = 'minhas-compras-v"), 'sw.js possui versionamento automático de cache (minhas-compras-v*)');
assert(swContent.includes("./icons/favicon-32.png"), 'sw.js inclui favicon-32.png no precache');

console.log('\n====================================================');
console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
