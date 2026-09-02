/**
 * Comprehensive Test Suite for:
 * 1. PWA & Service Worker configuration integrity
 * 2. New List based on Previous List (Reset current prices to null, preserve previous price reference, untouched history)
 * 3. Strict status-based Current Lists vs Finalized Lists separation
 * 4. Empty state when all current lists are finished
 * 5. Multiple simultaneous active lists support
 * 6. Action renaming to 'Finalizar'
 * 7. Correct 'createdAt' ordering (newest first)
 * 8. Immutability of 'createdAt' on modifications/finishes
 */

const fs = require('fs');
const path = require('path');

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
  showToast: (msg, type) => {},
  closeModal: () => {},
  closeKeypad: () => {},
  renderTotalBar: () => '<div>TotalBar</div>',
  renderHomeView: () => '',
  renderCartView: () => '',
  renderCategoriesView: () => '',
  renderHistoryView: () => '',
  renderSettingsView: () => '',
  attachSwipeListeners: () => {}
};
global.localStorage = localStorageMock;

// Load store and views
eval(fs.readFileSync(path.join(__dirname, '../js/store.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/components/totalBar.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/homeView.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/cartView.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/views/historyView.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../js/components/modals.js'), 'utf8'));

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
console.log('🧪 INICIANDO BATERIA DE TESTES AUTOMATIZADOS');
console.log('====================================================\n');

// ----------------------------------------------------
// TESTE 1: PWA & Service Worker Config
// ----------------------------------------------------
console.log('TESTE 1: Configuração do Service Worker e Vercel Headers');
const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const vercelContent = fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8');
const indexContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

assert(swContent.includes("CACHE_NAME = 'minhas-compras-v"), 'sw.js possui versionamento de cache dinâmico');
assert(swContent.includes('self.skipWaiting()'), 'sw.js executa skipWaiting() sob demanda via SKIP_WAITING');
assert(swContent.includes('self.clients.claim()'), 'sw.js executa clients.claim() no activate');
assert(swContent.includes('caches.delete(cacheName)'), 'sw.js remove caches antigos automaticamente');
assert(vercelContent.includes('no-cache, no-store, must-revalidate'), 'vercel.json define no-cache para index.html e sw.js');
assert(indexContent.includes('controllerchange'), 'index.html escuta controllerchange para reload transparente na atualização');
assert(indexContent.includes('visibilitychange'), 'index.html escuta visibilitychange para iOS PWA update');

// ----------------------------------------------------
// TESTE 2: Nova Lista Baseada na Anterior — Zerar Preços Atuais
// ----------------------------------------------------
console.log('\nTESTE 2: Nova Lista Baseada na Anterior');
const store = window.shoppingStore;
store.resetToDefault();

// 2.1 Criar Lista 1 com 3 produtos e preços diferentes
store.createNewList('Lista Agosto 2026');
const listAgosto = store.getActiveList();
const agostoCreatedAt = listAgosto.createdAt;

store.addItemToList(listAgosto.id, { name: 'Arroz', categoryId: 'mercearia', quantity: 2, unit: 'pct', currentPrice: 22.50 });
store.addItemToList(listAgosto.id, { name: 'Leite', categoryId: 'laticinios', quantity: 4, unit: 'L', currentPrice: 6.90 });
store.addItemToList(listAgosto.id, { name: 'Café', categoryId: 'mercearia', quantity: 1, unit: 'pct', currentPrice: 18.00 });

const agostoTotals = store.calculateListTotals(listAgosto);
assert(agostoTotals.currentTotal === (2 * 22.50 + 4 * 6.90 + 1 * 18.00), 'Lista de Agosto total calculada corretamente (R$ 90,60)');

// 2.2 Finalizar Lista 1
store.completeActiveList(listAgosto.id);
assert(listAgosto.status === 'completed', 'Lista de Agosto finalizada com status "completed"');
assert(listAgosto.completedAt !== null, 'Lista de Agosto possui completedAt preenchido');
assert(listAgosto.createdAt === agostoCreatedAt, 'createdAt da Lista de Agosto foi preservado intacto');

// 2.3 Criar Nova Lista baseada na anterior
store.createNewList('Lista Setembro 2026', true, listAgosto.id);
const listSetembro = store.getActiveList();

assert(listSetembro.id !== listAgosto.id, 'Nova lista criada com ID próprio');
assert(listSetembro.status === 'in_progress', 'Nova lista criada com status "in_progress"');
assert(listSetembro.items.length === 3, 'Nova lista copiou os 3 produtos');

const arrozSet = listSetembro.items.find(i => i.name === 'Arroz');
const leiteSet = listSetembro.items.find(i => i.name === 'Leite');
const cafeSet = listSetembro.items.find(i => i.name === 'Café');

assert(arrozSet.previousPrice === 22.50, 'Arroz tem previousPrice = 22.50 (preço pago na compra anterior)');
assert(arrozSet.currentPrice === null, 'Arroz tem currentPrice = null (inicia vazio/zerado)');
assert(arrozSet.categoryId === 'mercearia', 'Arroz manteve categoria mercearia');
assert(arrozSet.quantity === 2, 'Arroz manteve quantidade 2');
assert(arrozSet.bought === true, 'Arroz inicia no carrinho (bought: true)');

assert(leiteSet.previousPrice === 6.90, 'Leite tem previousPrice = 6.90');
assert(leiteSet.currentPrice === null, 'Leite tem currentPrice = null');

assert(cafeSet.previousPrice === 18.00, 'Café tem previousPrice = 18.00');
assert(cafeSet.currentPrice === null, 'Café tem currentPrice = null');

// 2.4 Totais da nova lista iniciam em 0.00
const setTotals = store.calculateListTotals(listSetembro);
assert(setTotals.currentTotal === 0, 'Total previsto da nova lista é R$ 0,00 (não utiliza preços anteriores como atuais)');
assert(setTotals.previousTotal === (2 * 22.50 + 4 * 6.90 + 1 * 18.00), 'Estimativa anterior calculada corretamente (R$ 90,60)');

// 2.5 Inserir novo preço em um produto
store.updateItemPrice(listSetembro.id, arrozSet.id, 24.00);
const updatedArrozSet = listSetembro.items.find(i => i.name === 'Arroz');
assert(updatedArrozSet.currentPrice === 24.00, 'Preço atual do Arroz atualizado para 24.00');
assert(updatedArrozSet.previousPrice === 22.50, 'Preço anterior do Arroz continua 22.50');

const setTotalsAfterArroz = store.calculateListTotals(listSetembro);
assert(setTotalsAfterArroz.currentTotal === 2 * 24.00, 'Total da nova lista agora é apenas o Arroz informado (R$ 48,00)');

// 2.6 Verificar que a lista de Agosto permaneceu 100% intacta
const reloadedAgosto = store.getListById(listAgosto.id);
const reloadedAgostoArroz = reloadedAgosto.items.find(i => i.name === 'Arroz');
assert(reloadedAgostoArroz.currentPrice === 22.50, 'Histórico intacto: Arroz na lista de Agosto continua 22.50');
assert(reloadedAgosto.totalSpent === 90.60, 'Histórico intacto: Total gasto na lista de Agosto continua 90.60');

// ----------------------------------------------------
// TESTE 3: Gestão de Compras Atuais e Finalizadas
// ----------------------------------------------------
console.log('\nTESTE 3: Compras Atuais vs Listas Anteriores & Estado Vazio');
store.resetToDefault();

// 3.1 Cenário 1: Uma única lista atual
store.createNewList('Compra Única');
const listaUnica = store.getActiveList();
let currentLists = store.state.lists.filter(l => l.status !== 'completed');
let pastLists = store.state.lists.filter(l => l.status === 'completed');
assert(currentLists.length === 1 && currentLists[0].id === listaUnica.id, 'Lista única aparece em Compras Atuais');
assert(pastLists.length === 0, 'Nenhuma lista em Listas Anteriores');

// Finalizar lista única
store.completeActiveList(listaUnica.id);
currentLists = store.state.lists.filter(l => l.status !== 'completed');
pastLists = store.state.lists.filter(l => l.status === 'completed');
assert(currentLists.length === 0, 'Compras Atuais fica vazia após finalizar a única lista');
assert(pastLists.length === 1 && pastLists[0].id === listaUnica.id, 'Lista aparece em Listas Anteriores');
assert(store.getActiveList() === null, 'getActiveList() retorna null quando não há lista ativa (sem fallback indevido)');

// 3.2 Cenário 2: Existem listas antigas finalizadas
store.createNewList('Lista Antiga 1');
const antiga1 = store.getActiveList();
store.completeActiveList(antiga1.id);

store.createNewList('Lista Antiga 2');
const antiga2 = store.getActiveList();
store.completeActiveList(antiga2.id);

store.createNewList('Nova Compra Temporária');
const novaTemp = store.getActiveList();

currentLists = store.state.lists.filter(l => l.status !== 'completed');
pastLists = store.state.lists.filter(l => l.status === 'completed');
assert(currentLists.length === 1 && currentLists[0].id === novaTemp.id, 'Apenas a Nova Compra Temporária está em Compras Atuais');
assert(pastLists.length === 3, 'Existem 3 listas no histórico');

store.completeActiveList(novaTemp.id);
currentLists = store.state.lists.filter(l => l.status !== 'completed');
assert(currentLists.length === 0, 'Após finalizar nova compra, Compras Atuais continua vazia (nenhuma lista antiga voltou)');

// 3.3 Cenário 3: Múltiplas listas atuais
store.createNewList('Compra Casa');
const compraCasa = store.getActiveList();

store.createNewList('Compra Escritório');
const compraEscritorio = store.getActiveList();

store.createNewList('Compra Festa');
const compraFesta = store.getActiveList();

currentLists = store.state.lists.filter(l => l.status !== 'completed');
assert(currentLists.length === 3, 'As 3 listas não finalizadas coexistem em Compras Atuais');

// Finalizar apenas "Compra Escritório"
store.completeActiveList(compraEscritorio.id);
currentLists = store.state.lists.filter(l => l.status !== 'completed');
pastLists = store.state.lists.filter(l => l.status === 'completed');

assert(currentLists.length === 2, 'Restam exatamente 2 listas em Compras Atuais');
assert(currentLists.some(l => l.id === compraCasa.id), 'Compra Casa continua em Compras Atuais');
assert(currentLists.some(l => l.id === compraFesta.id), 'Compra Festa continua em Compras Atuais');
assert(!currentLists.some(l => l.id === compraEscritorio.id), 'Compra Escritório saiu de Compras Atuais');
assert(pastLists.some(l => l.id === compraEscritorio.id), 'Compra Escritório está em Listas Anteriores');

// ----------------------------------------------------
// TESTE 4: Ordenação por createdAt
// ----------------------------------------------------
console.log('\nTESTE 4: Ordenação por createdAt');
store.resetToDefault();

const d1 = new Date('2026-08-01T10:00:00Z').toISOString();
const d2 = new Date('2026-08-15T10:00:00Z').toISOString();
const d3 = new Date('2026-09-01T10:00:00Z').toISOString();

store.createNewList('Lista Antiga');
store.state.lists[0].createdAt = d1;
store.completeActiveList(store.state.lists[0].id);

store.createNewList('Lista Média');
store.state.lists[0].createdAt = d2;
store.completeActiveList(store.state.lists[0].id);

store.createNewList('Lista Recente');
store.state.lists[0].createdAt = d3;
store.completeActiveList(store.state.lists[0].id);

const sortedPastLists = store.state.lists
  .filter(l => l.status === 'completed')
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

assert(sortedPastLists[0].title === 'Lista Recente', 'Listas anteriores: 1º lugar é a mais recente (01/09)');
assert(sortedPastLists[1].title === 'Lista Média', 'Listas anteriores: 2º lugar é a intermediária (15/08)');
assert(sortedPastLists[2].title === 'Lista Antiga', 'Listas anteriores: 3º lugar é a mais antiga (01/08)');

// ----------------------------------------------------
// TESTE 5: Renderização do HomeView e Modals
// ----------------------------------------------------
console.log('\nTESTE 5: Renderização do HomeView e Modais');
const homeHtml = window.renderHomeView();
assert(homeHtml.includes('Compras Atuais'), 'HomeView renderiza cabeçalho "Compras Atuais"');
assert(homeHtml.includes('Listas Anteriores'), 'HomeView renderiza cabeçalho "Listas Anteriores"');

const modalsContent = fs.readFileSync(path.join(__dirname, '../js/components/modals.js'), 'utf8');
assert(!modalsContent.includes('Finalizar e Arquivar Compra'), 'Texto "Finalizar e Arquivar Compra" removido em favor de "Finalizar"');
assert(modalsContent.includes('>Finalizar<') || modalsContent.includes('Finalizar\n') || modalsContent.includes('Finalizar Lista'), 'Ação "Finalizar" presente');

console.log('\n====================================================');
console.log(`📊 RESULTADO FINAL: ${testsPassed} PASSOU | ${testsFailed} FALHOU`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
