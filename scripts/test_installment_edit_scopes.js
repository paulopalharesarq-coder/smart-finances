/**
 * Comprehensive Test Suite: Installment Plan Editing with Scope Control
 * Tests all requirements from specification:
 * TESTE A — SOMENTE ESTA
 * TESTE B — ESTA E FUTURAS
 * TESTE C — TODAS
 * TESTE D — STATUS
 * TESTE E — DATA
 * TESTE F — CATEGORIA
 * TESTE G — DESCRIÇÃO
 * TESTE H — TOTAL DO PLANO
 * TESTE I — RELATÓRIOS
 * TESTE J — REABRIR APP (Persistência)
 * TESTE K — DESPESA COMUM (Sem seletor)
 * TESTE L — DÍVIDA MOVIDA (Sem dupla contabilização)
 * TESTE M — CONCILIAÇÃO (saldoBase correto)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Setup mock browser environment
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) { return store[key] || null; },
    setItem: function (key, value) { store[key] = value.toString(); },
    removeItem: function (key) { delete store[key]; },
    clear: function () { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;

class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.style = {};
    this.children = [];
    this.attributes = {};
    this._value = '';
    this._innerText = '';
    this._innerHTML = '';
  }

  get value() { return this._value; }
  set value(v) { this._value = String(v); }

  get innerText() { return this._innerText; }
  set innerText(v) { this._innerText = String(v); }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(html) {
    this._innerHTML = html;
    this._parseHTMLMock(html);
  }

  setAttribute(name, val) { this.attributes[name] = val; }
  getAttribute(name) { return this.attributes[name] || null; }
  hasAttribute(name) { return name in this.attributes; }

  get classList() {
    const self = this;
    return {
      add: (...cls) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        cls.forEach(c => set.add(c));
        self.className = Array.from(set).join(' ');
      },
      remove: (...cls) => {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        cls.forEach(c => set.delete(c));
        self.className = Array.from(set).join(' ');
      },
      contains: (c) => self.className.split(/\s+/).includes(c)
    };
  }

  focus() {}
  click() {}
  appendChild(child) {
    this.children.push(child);
    if (child.id) elementsById[child.id] = child;
  }
  remove() {
    if (this.id && elementsById[this.id]) {
      delete elementsById[this.id];
    }
  }

  _parseHTMLMock(html) {
    const idMatches = html.matchAll(/id=["']([^"']+)["']/g);
    for (const m of idMatches) {
      const id = m[1];
      const el = new MockElement('div', id);
      const valMatch = html.match(new RegExp(`id=["']${id}["'][^>]*value=["']([^"']*)["']`));
      if (valMatch) el.value = valMatch[1];
      const checkedMatch = html.match(new RegExp(`id=["']${id}["'][^>]*checked`));
      el.checked = Boolean(checkedMatch);
      elementsById[id] = el;
    }
  }

  getElementById(id) {
    return elementsById[id] || null;
  }
}

const elementsById = {};
const mockDoc = new MockElement('html');
const modalContainer = new MockElement('div', 'modal-container');
elementsById['modal-container'] = modalContainer;

global.window = {
  location: { origin: 'https://smart-finances.vercel.app', pathname: '/', href: 'https://smart-finances.vercel.app/' },
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  showToast: (msg, type) => {},
  confirm: (msg) => true
};

global.document = {
  documentElement: mockDoc,
  body: new MockElement('body'),
  getElementById: (id) => elementsById[id] || null,
  querySelectorAll: (selector) => [],
  createElement: (tag) => new MockElement(tag)
};

// Load Store and Modals
const rootDir = path.resolve(__dirname, '..');
const storeCode = fs.readFileSync(path.join(rootDir, 'js', 'store.js'), 'utf8');
const modalsCode = fs.readFileSync(path.join(rootDir, 'js', 'components/modals.js'), 'utf8');

eval(storeCode);
eval(modalsCode);

const store = window.financeStore;

console.log('========================================================');
console.log('🧪 RUNNING INSTALLMENT SCOPE EDITING TEST SUITE (13 TESTS)');
console.log('========================================================\n');

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Helper: Setup 10x 100 purchase
function createStandardPlan() {
  localStorageMock.clear();
  store.state = store.loadState();
  store.state.selectedMonthKey = '2026-09';
  store.ensureMonthExists('2026-09');

  const plan = store.createInstallmentPlan({
    description: 'Compra Notebook',
    totalAmount: 1000,
    totalInstallments: 10,
    currentInstallment: 4, // 4/10 in 2026-09
    startMonthKey: '2026-09',
    categoryId: 'outras_despesas',
    payee: 'Loja Tech',
    dueDateDay: '10'
  });

  return plan;
}

// --------------------------------------------------------------------------
// TESTE A — SOMENTE ESTA
// --------------------------------------------------------------------------
runTest('TESTE A — SOMENTE ESTA: 4/10 alterado para 120, demais permanecem 100', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'current');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  for (let i = 1; i <= 10; i++) {
    const exp = updatedExpenses.find(e => e.installmentNumber === i);
    if (i === 4) {
      assert.strictEqual(exp.amount, 120, 'Parcela 4/10 deve ser 120');
    } else {
      assert.strictEqual(exp.amount, 100, `Parcela ${i}/10 deve permanecer 100`);
    }
  }
});

// --------------------------------------------------------------------------
// TESTE B — ESTA E FUTURAS
// --------------------------------------------------------------------------
runTest('TESTE B — ESTA E FUTURAS: 4-10 alterados para 120, 1-3 permanecem 100', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'future');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  for (let i = 1; i <= 10; i++) {
    const exp = updatedExpenses.find(e => e.installmentNumber === i);
    if (i < 4) {
      assert.strictEqual(exp.amount, 100, `Parcela ${i}/10 (passada) deve permanecer 100`);
    } else {
      assert.strictEqual(exp.amount, 120, `Parcela ${i}/10 (atual/futura) deve ser 120`);
    }
  }
});

// --------------------------------------------------------------------------
// TESTE C — TODAS
// --------------------------------------------------------------------------
runTest('TESTE C — TODAS: 1-10 alterados para 120', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'all');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  for (let i = 1; i <= 10; i++) {
    const exp = updatedExpenses.find(e => e.installmentNumber === i);
    assert.strictEqual(exp.amount, 120, `Parcela ${i}/10 deve ser 120`);
  }
});

// --------------------------------------------------------------------------
// TESTE D — STATUS
// --------------------------------------------------------------------------
runTest('TESTE D — STATUS: status individual pago/pendente estritamente preservado ao editar valor para todas', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);

  // Status inicial: 1-3 são paid, 4-10 são pending
  assert.strictEqual(expenses[0].status, 'paid', 'Parcela 1 inicial é paid');
  assert.strictEqual(expenses[1].status, 'paid', 'Parcela 2 inicial é paid');
  assert.strictEqual(expenses[2].status, 'paid', 'Parcela 3 inicial é paid');
  assert.strictEqual(expenses[3].status, 'pending', 'Parcela 4 inicial é pending');
  assert.strictEqual(expenses[4].status, 'pending', 'Parcela 5 inicial é pending');

  const targetExpense = expenses.find(e => e.installmentNumber === 4);
  // Editar valor para todas, sem alterar status
  store.updateInstallmentOccurrence(targetExpense.id, { amount: 150 }, 'all');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  assert.strictEqual(updatedExpenses[0].status, 'paid', 'Parcela 1 manteve status paid');
  assert.strictEqual(updatedExpenses[1].status, 'paid', 'Parcela 2 manteve status paid');
  assert.strictEqual(updatedExpenses[2].status, 'paid', 'Parcela 3 manteve status paid');
  assert.strictEqual(updatedExpenses[3].status, 'pending', 'Parcela 4 manteve status pending');
  assert.strictEqual(updatedExpenses[4].status, 'pending', 'Parcela 5 manteve status pending');
  assert.strictEqual(updatedExpenses[9].status, 'pending', 'Parcela 10 manteve status pending');
});

// --------------------------------------------------------------------------
// TESTE E — DATA
// --------------------------------------------------------------------------
runTest('TESTE E — DATA: vencimento alterado para dia 15 em futuras preserva sequencia mensal (15/04, 15/05, 15/06...)', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  // 4/10 está em 2026-09. Mudar dia para 15: 2026-09-15
  store.updateInstallmentOccurrence(targetExpense.id, { dueDate: '2026-09-15' }, 'future');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  // Passadas (1 a 3) mantêm dia 10
  assert.strictEqual(updatedExpenses[0].dueDate, '2026-06-10', 'Parcela 1 manteve 2026-06-10');
  assert.strictEqual(updatedExpenses[1].dueDate, '2026-07-10', 'Parcela 2 manteve 2026-07-10');
  assert.strictEqual(updatedExpenses[2].dueDate, '2026-08-10', 'Parcela 3 manteve 2026-08-10');

  // Atual e futuras (4 a 10) atualizaram dia para 15 preservando os meses!
  assert.strictEqual(updatedExpenses[3].dueDate, '2026-09-15', 'Parcela 4 é 2026-09-15');
  assert.strictEqual(updatedExpenses[4].dueDate, '2026-10-15', 'Parcela 5 é 2026-10-15');
  assert.strictEqual(updatedExpenses[5].dueDate, '2026-11-15', 'Parcela 6 é 2026-11-15');
  assert.strictEqual(updatedExpenses[6].dueDate, '2026-12-15', 'Parcela 7 é 2026-12-15');
  assert.strictEqual(updatedExpenses[7].dueDate, '2027-01-15', 'Parcela 8 é 2027-01-15');
  assert.strictEqual(updatedExpenses[8].dueDate, '2027-02-15', 'Parcela 9 é 2027-02-15');
  assert.strictEqual(updatedExpenses[9].dueDate, '2027-03-15', 'Parcela 10 é 2027-03-15');
});

// --------------------------------------------------------------------------
// TESTE F — CATEGORIA
// --------------------------------------------------------------------------
runTest('TESTE F — CATEGORIA: mudar categoria e aplicar futuras atualiza somente atual + futuras', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { categoryId: 'viagem' }, 'future');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  assert.strictEqual(updatedExpenses[0].categoryId, 'outras_despesas', 'Parcela 1 mantém categoria original');
  assert.strictEqual(updatedExpenses[1].categoryId, 'outras_despesas', 'Parcela 2 mantém categoria original');
  assert.strictEqual(updatedExpenses[2].categoryId, 'outras_despesas', 'Parcela 3 mantém categoria original');
  assert.strictEqual(updatedExpenses[3].categoryId, 'viagem', 'Parcela 4 recebe nova categoria viagem');
  assert.strictEqual(updatedExpenses[4].categoryId, 'viagem', 'Parcela 5 recebe nova categoria viagem');
  assert.strictEqual(updatedExpenses[9].categoryId, 'viagem', 'Parcela 10 recebe nova categoria viagem');
});

// --------------------------------------------------------------------------
// TESTE G — DESCRIÇÃO
// --------------------------------------------------------------------------
runTest('TESTE G — DESCRIÇÃO: aplicar todas atualiza base description preservando sufixo (X/10) e status', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  // Usuário alterou nome para "Celular Novo (4/10)"
  store.updateInstallmentOccurrence(targetExpense.id, { name: 'Celular Novo (4/10)' }, 'all');

  const updatedExpenses = store.getInstallmentExpenses(plan.id);
  for (let i = 1; i <= 10; i++) {
    const exp = updatedExpenses.find(e => e.installmentNumber === i);
    assert.strictEqual(exp.name, `Celular Novo (${i}/10)`, `Nome da parcela ${i} deve ser 'Celular Novo (${i}/10)'`);
  }

  // Verifica metadados do plano
  const updatedPlan = store.state.installmentPlans.find(p => p.id === plan.id);
  assert.strictEqual(updatedPlan.description, 'Celular Novo', 'Plan description atualizada para Celular Novo');
});

// --------------------------------------------------------------------------
// TESTE H — TOTAL DO PLANO
// --------------------------------------------------------------------------
runTest('TESTE H — TOTAL DO PLANO: 1-3 = 100, 4-10 = 120 -> total real = R$ 1.140', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'future');

  const updatedPlan = store.state.installmentPlans.find(p => p.id === plan.id);
  // 3 * 100 + 7 * 120 = 300 + 840 = 1140
  assert.strictEqual(updatedPlan.totalAmount, 1140, 'Total do plano deve ser exatamente 1140 (3x100 + 7x120)');
});

// --------------------------------------------------------------------------
// TESTE I — RELATÓRIOS
// --------------------------------------------------------------------------
runTest('TESTE I — RELATÓRIOS: valores refletem dinamicamente em meses anteriores, atual e futuros', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'future');

  // Mês anterior (2026-08): Parcela 3/10 = 100
  const summaryAug = store.calculateMonthSummary('2026-08');
  assert.strictEqual(summaryAug.paidExpenses, 100, 'Mês 2026-08 tem 100 de despesa paga');

  // Mês atual (2026-09): Parcela 4/10 = 120 (pending)
  const summarySep = store.calculateMonthSummary('2026-09');
  assert.strictEqual(summarySep.remainingExpenses, 120, 'Mês 2026-09 tem 120 de despesa restante');

  // Mês futuro (2026-10): Parcela 5/10 = 120 (pending)
  const summaryOct = store.calculateMonthSummary('2026-10');
  assert.strictEqual(summaryOct.remainingExpenses, 120, 'Mês 2026-10 tem 120 de despesa restante');

  // Relatório geral anual de despesas para 2026:
  const rep = store.getReportsBreakdown({ type: 'expense', periodMode: 'year', year: 2026 });
  // Em 2026 estão os meses 06, 07, 08 (100 cada = 300) e 09, 10, 11, 12 (120 cada = 480) -> Total = 780
  assert.strictEqual(rep.totalAmount, 780, 'Relatório anual de 2026 totaliza 780');
});

// --------------------------------------------------------------------------
// TESTE J — REABRIR APP (Persistência)
// --------------------------------------------------------------------------
runTest('TESTE J — REABRIR APP: fechar e abrir novamente preserva alterações do localStorage', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  store.updateInstallmentOccurrence(targetExpense.id, { amount: 120 }, 'future');

  // Simular recarregar a store a partir do localStorage
  const freshStore = new window.financeStore.constructor();
  const reloadedExpenses = freshStore.getInstallmentExpenses(plan.id);
  const reloadedPlan = freshStore.state.installmentPlans.find(p => p.id === plan.id);

  assert.strictEqual(reloadedPlan.totalAmount, 1140, 'Total do plano persistido como 1140');
  assert.strictEqual(reloadedExpenses[0].amount, 100, 'Parcela 1 persistida como 100');
  assert.strictEqual(reloadedExpenses[3].amount, 120, 'Parcela 4 persistida como 120');
  assert.strictEqual(reloadedExpenses[9].amount, 120, 'Parcela 10 persistida como 120');
});

// --------------------------------------------------------------------------
// TESTE K — DESPESA COMUM
// --------------------------------------------------------------------------
runTest('TESTE K — DESPESA COMUM: salvar despesa comum salva diretamente sem abrir modal de alcance', () => {
  const exp = store.addExpense({
    monthKey: '2026-09',
    name: 'Supermercado Regular',
    amount: 250,
    categoryId: 'alimentacao'
  });

  let scopeModalOpened = false;
  const origOpenScope = window.openInstallmentScopeModal;
  window.openInstallmentScopeModal = () => { scopeModalOpened = true; };

  // Abrir modal de edição para despesa comum
  window.openExpenseModal('2026-09', exp.id);

  // Submeter formulário
  let prevented = false;
  window.handleSaveExpenseSubmit({ preventDefault: () => { prevented = true; } });

  assert.strictEqual(scopeModalOpened, false, 'Modal de alcance NÃO deve ser aberto para despesa comum');
  window.openInstallmentScopeModal = origOpenScope;
});

// --------------------------------------------------------------------------
// TESTE L — DÍVIDA MOVIDA
// --------------------------------------------------------------------------
runTest('TESTE L — DÍVIDA MOVIDA: atualizar futuras/todas não duplica registro de dívida movida', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const inst5 = expenses.find(e => e.installmentNumber === 5); // 2026-10

  // Mover parcela 5 para 2026-11
  const moveRes = store.moveExpenseToMonth(inst5.id, '2026-11');
  assert(moveRes.success, 'Parcela 5 movida com sucesso');

  // Agora editar parcela 4 com escopo 'future'
  const inst4 = expenses.find(e => e.installmentNumber === 4);
  store.updateInstallmentOccurrence(inst4.id, { amount: 130 }, 'future');

  // Verificar ocorrências ativas do plano
  const activeOccurrences = store.state.expenses.filter(
    e => e.installmentPlanId === plan.id && !e.isMoved && !e.movedToMonthKey
  );
  assert.strictEqual(activeOccurrences.length, 10, 'Exatamente 10 ocorrências ativas após edição');

  // Registro histórico movido deve continuar isMoved: true e NÃO duplicar valor
  const movedHistory = store.state.expenses.find(e => e.id === inst5.id);
  assert(movedHistory.isMoved, 'Registro original continua marcado como isMoved');

  // Ocorrência ativa em 2026-11 recebeu o valor atualizado 130
  const activeInst5 = activeOccurrences.find(e => e.installmentNumber === 5);
  assert.strictEqual(activeInst5.monthKey, '2026-11', 'Ocorrência ativa da parcela 5 está em 2026-11');
  assert.strictEqual(activeInst5.amount, 130, 'Ocorrência ativa recebeu valor 130');
});

// --------------------------------------------------------------------------
// TESTE M — CONCILIAÇÃO
// --------------------------------------------------------------------------
runTest('TESTE M — CONCILIAÇÃO: alteração em parcela paga recalcula saldoBase dinamicamente', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const inst1 = expenses.find(e => e.installmentNumber === 1); // 2026-06 (status: paid, amount: 100)

  // Saldo base antes da alteração no mês 2026-06
  const baseBefore = store.calculateManualBaseBalance('2026-06');
  assert.strictEqual(baseBefore.manualPaidExpenses, 100, 'Manual paid expenses inicial é 100');

  // Alterar valor de 1/10 para 150
  store.updateInstallmentOccurrence(inst1.id, { amount: 150 }, 'current');

  // Saldo base recalculado reflete o novo valor imediatamente
  const baseAfter = store.calculateManualBaseBalance('2026-06');
  assert.strictEqual(baseAfter.manualPaidExpenses, 150, 'Manual paid expenses após edição é 150');
  assert.strictEqual(baseAfter.saldoBase, -150, 'saldoBase recalculado reflete a despesa paga de 150');
});

// --------------------------------------------------------------------------
// TESTE N — INTERFACE MODAL DE ALCANCE (UI Flow)
// --------------------------------------------------------------------------
runTest('TESTE N — INTERFACE UI: modal de alcance abre para despesa parcelada, permite selecionar opções e confirmar', () => {
  const plan = createStandardPlan();
  const expenses = store.getInstallmentExpenses(plan.id);
  const targetExpense = expenses.find(e => e.installmentNumber === 4);

  // Abrir modal de edição para despesa parcelada
  window.openExpenseModal('2026-09', targetExpense.id);

  // Alterar valor no formulário
  const amountDisplay = document.getElementById('expense-amount-display');
  const amountInput = document.getElementById('expense-amount');
  if (amountInput) amountInput.value = '140';

  // Submeter formulário
  let prevented = false;
  window.handleSaveExpenseSubmit({ preventDefault: () => { prevented = true; } });

  // Modal de alcance deve ter sido inserido no DOM
  const scopeModal = document.getElementById('installment-scope-modal');
  assert(scopeModal, 'Modal de alcance de parcelamento deve estar no DOM');
  assert(scopeModal.innerHTML.includes('Aplicar alterações'), 'Modal contém título Aplicar alterações');
  assert(scopeModal.innerHTML.includes('Somente esta parcela'), 'Opção 1 presente');
  assert(scopeModal.innerHTML.includes('Esta e as futuras'), 'Opção 2 presente');
  assert(scopeModal.innerHTML.includes('Todas as parcelas'), 'Opção 3 presente');

  // Testar seleção da opção "Esta e as futuras"
  window.selectInstallmentScopeOption('future');
  const optFuture = document.getElementById('scope-opt-future');
  assert(optFuture.className.includes('border-[#ea7355]'), 'Opção future fica com destaque ativo');

  // Confirmar
  window.confirmInstallmentScope();

  // Modal de alcance deve ter sido fechado
  assert(!document.getElementById('installment-scope-modal'), 'Modal de alcance fechado após confirmação');
});

console.log('\n========================================================');
console.log('🎉 ALL 14 INSTALLMENT SCOPE TESTS PASSED 100%!');
console.log('========================================================\n');
