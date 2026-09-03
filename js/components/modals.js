/**
 * Smart Finances - Modals, Custom In-App Keypad & Dialog Components
 * Includes Onboarding, In-App Numeric Keypad, Single-Amount Expense/Income forms,
 * Installment Plans with Intermediate Distribution, Controlled Recurrence,
 * Category Management CRUD, and Clean QR Code Pairing.
 */

window.closeModal = function () {
  const container = document.getElementById('modal-container');
  if (container) {
    container.innerHTML = '';
  }
};

window.closeKeypad = function () {
  const container = document.getElementById('keypad-container');
  if (container) {
    container.innerHTML = '';
  }
};

window.showToast = function (message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-secondary text-white' : type === 'error' ? 'bg-error text-white' : 'bg-surface-container-highest text-on-surface';
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs ${bgClass} slide-up transition-all pointer-events-auto max-w-[90vw]`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px]">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
};

// ==========================================================================
// 0. Notification Center Modal (Empty State & Pending Items List)
// ==========================================================================
window.openNotificationCenterModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const allExpenses = store.state.expenses || [];
  const todayStr = (window.NotificationService ? window.NotificationService.getLocalDateString(0) : new Date().toISOString().split('T')[0]);
  const tomorrowStr = (window.NotificationService ? window.NotificationService.getLocalDateString(1) : new Date(Date.now() + 86400000).toISOString().split('T')[0]);

  const upcomingItems = [];
  for (const exp of allExpenses) {
    if (exp.status === 'paid' || exp.status === 'cancelled' || !exp.dueDate) continue;
    if (exp.dueDate === todayStr) {
      upcomingItems.push({ expense: exp, type: 'today', label: 'Vence hoje', color: 'text-[#dc2626] dark:text-[#ff8a80] bg-[#fee2e2] dark:bg-[#3b1212] border-[#fca5a5] dark:border-[#7f1d1d]' });
    } else if (exp.dueDate === tomorrowStr) {
      upcomingItems.push({ expense: exp, type: 'tomorrow', label: 'Vence amanhã', color: 'text-primary dark:text-[#ffb783] bg-primary/10 border-primary/30' });
    }
  }

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-dialog w-full max-w-[420px] p-5 rounded-[28px] slide-up flex flex-col gap-4 border border-outline-variant/30 shadow-2xl max-h-[85vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            <h3 class="font-bold text-sm text-on-surface">Central de Avisos</h3>
          </div>
          <button type="button" onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer" title="Fechar">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Body -->
        <div class="overflow-y-auto space-y-3 max-h-[60vh] pr-0.5">
          ${upcomingItems.length > 0 ? `
            <p class="text-xs text-on-surface-variant font-medium">Você possui as seguintes despesas pendentes:</p>
            ${upcomingItems.map(item => {
              const cat = store.getCategoryById(item.expense.categoryId);
              return `
                <div onclick="window.financeStore.openMonthDetail('${item.expense.monthKey}'); window.closeModal();" 
                     class="p-3.5 rounded-2xl bg-surface-container/70 dark:bg-white/5 border border-outline-variant/30 hover:border-primary/50 transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                      <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">${item.expense.name}</h4>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.color}">${item.label}</span>
                        <span class="text-[10px] text-on-surface-variant font-medium truncate">${item.expense.payee || cat.name}</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-price-display text-sm font-extrabold text-on-surface block leading-tight">
                      ${fmtCurrency(item.expense.amount)}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          ` : `
            <!-- Empty State -->
            <div class="py-8 px-4 text-center flex flex-col items-center justify-center gap-2.5">
              <div class="w-14 h-14 rounded-2xl bg-surface-container dark:bg-white/5 text-outline flex items-center justify-center shadow-inner">
                <span class="material-symbols-outlined text-3xl text-primary">check_circle</span>
              </div>
              <div>
                <h4 class="font-bold text-sm text-on-surface">Nenhuma notificação</h4>
                <p class="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[260px] mx-auto">
                  Você não possui despesas pendentes com vencimento para hoje ou amanhã.
                </p>
              </div>
              <button type="button" onclick="window.closeModal()" class="mt-2 px-5 py-2.5 bg-surface-container hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer">
                Entendi
              </button>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

// ==========================================================================
// 1. In-App Custom Numeric Keypad (In-Place DOM Updates - Zero Flickering)
// ==========================================================================
window.openKeypad = function ({ initialValue = 0, onConfirm, title = 'Digitar Valor' }) {
  const container = document.getElementById('keypad-container');
  if (!container) return;

  let rawCents = Math.round((Number(initialValue) || 0) * 100);

  const formatCurrency = (cents) => {
    const val = cents / 100;
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeKeypad()">
      <div class="keypad-sheet w-full max-w-[480px] mx-auto p-5 pb-8 slide-up flex flex-col gap-4 border-t border-outline-variant/30">
        
        <!-- Keypad Header -->
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <h3 class="font-bold text-sm text-on-surface">${title}</h3>
          <button type="button" onclick="window.closeKeypad()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Value Display Displaying live formatted currency -->
        <div class="bg-surface-container rounded-2xl p-4 text-center border border-outline-variant/40 shadow-inner">
          <span class="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider block mb-1">Valor Informado</span>
          <span id="keypad-display-val" class="font-price-display text-3xl font-black text-primary tracking-tight block">
            ${formatCurrency(rawCents)}
          </span>
        </div>

        <!-- Numeric Grid: 0-9, backspace, clear, confirm -->
        <div class="grid grid-cols-3 gap-2.5 pt-1">
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('1')">1</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('2')">2</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('3')">3</button>

          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('4')">4</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('5')">5</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('6')">6</button>

          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('7')">7</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('8')">8</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('9')">9</button>

          <button type="button" class="keypad-btn text-xs text-error font-extrabold uppercase" onclick="window.handleKeypadInput('clear')">Limpar</button>
          <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('0')">0</button>
          <button type="button" class="keypad-btn text-on-surface-variant" onclick="window.handleKeypadInput('backspace')">
            <span class="material-symbols-outlined text-[22px]">backspace</span>
          </button>
        </div>

        <!-- Confirm Action Button -->
        <button id="keypad-confirm-btn" type="button" onclick="window.handleKeypadConfirm()" class="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer">
          <span class="material-symbols-outlined text-[20px]">check</span>
          <span>Confirmar Valor (${formatCurrency(rawCents)})</span>
        </button>
      </div>
    </div>
  `;

  window.handleKeypadInput = function (key) {
    if (key === 'clear') {
      rawCents = 0;
    } else if (key === 'backspace') {
      rawCents = Math.floor(rawCents / 10);
    } else if (/^\d$/.test(key)) {
      if (rawCents < 99999999) {
        rawCents = rawCents * 10 + parseInt(key, 10);
      }
    }
    
    // In-place DOM update without re-rendering modal
    const display = document.getElementById('keypad-display-val');
    if (display) display.innerText = formatCurrency(rawCents);

    const confirmBtn = document.getElementById('keypad-confirm-btn');
    if (confirmBtn) {
      confirmBtn.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">check</span>
        <span>Confirmar Valor (${formatCurrency(rawCents)})</span>
      `;
    }
  };

  window.handleKeypadConfirm = function () {
    const finalVal = rawCents / 100;
    if (typeof onConfirm === 'function') {
      onConfirm(finalVal);
    }
    window.closeKeypad();
  };
};

// ==========================================================================
// 2. Quick Status Picker Popover Modal (Pago = Verde, Pendente = Vermelho)
// ==========================================================================
window.openStatusPickerModal = function ({ id, type = 'expense', currentStatus = 'pending' }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const isExpense = type === 'expense';

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-dialog w-full max-w-[360px] p-5 rounded-3xl slide-up flex flex-col gap-4 border border-outline-variant/30 shadow-2xl">
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">toggle_on</span>
            <h3 class="font-bold text-sm text-on-surface">Alterar Situação</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant">Selecione o novo status para atualizar os cálculos:</p>

        <div class="flex flex-col gap-2.5 pt-1">
          ${isExpense ? `
            <!-- Opção Pago: VERDE com fundo verde real -->
            <button onclick="window.selectQuickStatus('${id}', 'expense', 'paid')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${currentStatus === 'paid' ? 'bg-[#15803d] text-white shadow-md' : 'bg-[#dcfce7] dark:bg-[#0f2e1b] hover:bg-[#bbf7d0] dark:hover:bg-[#154527] text-[#15803d] dark:text-[#86efac] border border-[#86efac] dark:border-[#166534]'}">
              <span class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[22px]">check_circle</span>
                <span>Pago</span>
              </span>
              ${currentStatus === 'paid' ? '<span class="material-symbols-outlined text-[20px]">done</span>' : ''}
            </button>

            <!-- Opção Pendente: VERMELHO com fundo vermelho real -->
            <button onclick="window.selectQuickStatus('${id}', 'expense', 'pending')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${currentStatus === 'pending' ? 'bg-[#dc2626] text-white shadow-md' : 'bg-[#fee2e2] dark:bg-[#3b1212] hover:bg-[#fecaca] dark:hover:bg-[#521b1b] text-[#dc2626] dark:text-[#fca5a5] border border-[#fca5a5] dark:border-[#7f1d1d]'}">
              <span class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[22px]">schedule</span>
                <span>Pendente</span>
              </span>
              ${currentStatus === 'pending' ? '<span class="material-symbols-outlined text-[20px]">done</span>' : ''}
            </button>
          ` : `
            <!-- Opção Recebida: VERDE com fundo verde real -->
            <button onclick="window.selectQuickStatus('${id}', 'income', 'received')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${currentStatus === 'received' ? 'bg-[#15803d] text-white shadow-md' : 'bg-[#dcfce7] dark:bg-[#0f2e1b] hover:bg-[#bbf7d0] dark:hover:bg-[#154527] text-[#15803d] dark:text-[#86efac] border border-[#86efac] dark:border-[#166534]'}">
              <span class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[22px]">check_circle</span>
                <span>Recebida</span>
              </span>
              ${currentStatus === 'received' ? '<span class="material-symbols-outlined text-[20px]">done</span>' : ''}
            </button>

            <!-- Opção Prevista: AZUL com fundo azul real -->
            <button onclick="window.selectQuickStatus('${id}', 'income', 'pending')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all cursor-pointer ${currentStatus === 'pending' ? 'bg-[#0284c7] text-white shadow-md' : 'bg-[#e0f2fe] dark:bg-[#0c2438] hover:bg-[#bae6fd] dark:hover:bg-[#113a5a] text-[#0284c7] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985]'}">
              <span class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[22px]">schedule</span>
                <span>Prevista</span>
              </span>
              ${currentStatus === 'pending' ? '<span class="material-symbols-outlined text-[20px]">done</span>' : ''}
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  window.selectQuickStatus = function (itemId, itemType, newStatus) {
    if (itemType === 'expense') {
      window.financeStore.updateExpense(itemId, { status: newStatus });
      window.showToast(newStatus === 'paid' ? 'Despesa marcada como Paga!' : 'Despesa marcada como Pendente.', 'success');
    } else {
      window.financeStore.updateIncome(itemId, { status: newStatus });
      window.showToast(newStatus === 'received' ? 'Receita marcada como Recebida!' : 'Receita marcada como Prevista.', 'success');
    }
    window.closeModal();
  };
};

// ==========================================================================
// 3. Expense Modal with Installment & Recurrence Controls (Input Preserved)
// ==========================================================================
window.openExpenseModal = function (monthKey, expenseId = null) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const targetMonthKey = monthKey || store.getSelectedMonthKey();
  const expense = expenseId ? store.getExpenseById(expenseId) : null;
  const categories = store.getCategories('expense');

  // Form State in Closure (Never destroyed during selection)
  let selectedAmount = expense ? expense.amount : 0;
  let selectedCategory = expense ? (expense.categoryId || 'outras_despesas') : 'outras_despesas';
  let selectedStatus = expense ? expense.status : 'pending';
  let isInstallment = Boolean(expense && expense.isInstallment);
  let isRecurring = Boolean(expense && expense.isRecurring);

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-0 slide-up flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Sticky Header with Title and Primary Top Action (Cadastrar / Salvar) -->
        <div class="sticky top-0 z-30 px-5 py-3.5 bg-surface dark:bg-[#241b15] border-b border-outline-variant/20 flex justify-between items-center shrink-0 rounded-t-[32px]">
          <div class="flex items-center gap-2.5">
            <button type="button" onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer" title="Fechar">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 class="font-headline-md text-base font-bold text-on-surface">
              ${expense ? 'Editar Despesa' : 'Nova Despesa'}
            </h3>
          </div>

          <!-- Botão Principal no Topo -->
          <button type="submit" form="expense-form" 
                  class="px-4 py-2 bg-[#dc2626] text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">save</span>
            <span>${expense ? 'Salvar' : 'Cadastrar'}</span>
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="p-5 pb-8 overflow-y-auto space-y-4">
          <form id="expense-form" onsubmit="window.handleSaveExpenseSubmit(event)" class="space-y-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Nome da Despesa *</label>
              <input type="text" id="expense-name" required placeholder="Ex: Supermercado, Aluguel, Farmácia" 
                     value="${expense ? expense.name : ''}" 
                     class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-[#dc2626] focus:outline-none text-sm text-on-surface font-semibold transition-all">
            </div>

            <!-- Single Amount Field with Custom In-App Keypad Trigger -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Valor * (Toque para digitar)</label>
              <div id="expense-amount-box" onclick="window.openKeypadForExpenseForm()" 
                   class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 hover:border-[#dc2626] cursor-pointer flex items-center justify-between shadow-inner transition-all">
                <span id="expense-amount-display" class="font-price-display text-xl font-extrabold text-[#dc2626]">
                  ${fmtCurrency(selectedAmount)}
                </span>
                <span class="material-symbols-outlined text-outline text-[20px]">dialpad</span>
              </div>
              <input type="hidden" id="expense-amount" value="${selectedAmount}">
            </div>

            <!-- Status Toggle: Pendente / Pago -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Status do Pagamento</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" id="expense-status-pending-btn" onclick="window.setExpenseFormStatus('pending')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedStatus === 'pending' ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Pendente</span>
                </button>
                <button type="button" id="expense-status-paid-btn" onclick="window.setExpenseFormStatus('paid')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedStatus === 'paid' ? 'bg-[#15803d] text-white border-[#15803d] shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Pago</span>
                </button>
              </div>
            </div>

            <!-- Category Selector (Direct DOM Selection - No Input Wiping) -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Categoria</label>
              <div id="expense-categories-grid" class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                ${categories.map(cat => `
                  <button type="button" onclick="window.setExpenseFormCategory('${cat.id}')" data-cat-id="${cat.id}"
                          class="category-select-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedCategory === cat.id ? 'border-[#dc2626] bg-[#dc2626]/10 font-bold' : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-[18px]" style="color: ${cat.textColor}">${cat.icon}</span>
                    <span class="text-[10px] text-on-surface truncate w-full text-center">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Due Date & Payee -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Vencimento</label>
                <input type="date" id="expense-date" value="${expense ? expense.dueDate : `${targetMonthKey}-10`}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Recebedor / Local</label>
                <input type="text" id="expense-payee" placeholder="Ex: Imobiliária" value="${expense ? (expense.payee || '') : ''}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>
            </div>

            <!-- Switches: Despesa Parcelada & Despesa Recorrente (Only when creating new) -->
            ${!expense ? `
              <div class="pt-2 border-t border-outline-variant/20 space-y-3">
                <!-- Switch Despesa Parcelada -->
                <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-primary text-[20px]">credit_card</span>
                    <div>
                      <h4 class="font-bold text-xs text-on-surface">Despesa parcelada</h4>
                      <span class="text-[10px] text-on-surface-variant">Dividir compra em vários meses</span>
                    </div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" id="expense-is-installment-toggle" onchange="window.toggleExpenseInstallmentFields(this.checked)">
                    <span class="slider"></span>
                  </label>
                </div>

                <!-- Installment Config Fields (Initially Hidden) -->
                <div id="expense-installment-fields" class="hidden p-3 bg-primary-fixed/30 rounded-2xl border border-primary-fixed-dim/60 space-y-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-on-surface block">Total de Parcelas</label>
                      <input type="number" id="expense-total-installments" min="2" max="96" value="10" 
                             class="w-full px-3 py-2 bg-surface rounded-xl border border-outline-variant/40 text-xs text-on-surface font-bold">
                    </div>
                    <div class="space-y-1">
                      <label class="text-[11px] font-bold text-on-surface block">Parcela Atual</label>
                      <input type="number" id="expense-current-installment" min="1" max="96" value="1" 
                             class="w-full px-3 py-2 bg-surface rounded-xl border border-outline-variant/40 text-xs text-on-surface font-bold">
                    </div>
                  </div>
                  <p class="text-[10px] text-on-surface-variant leading-tight">
                    Se a parcela atual for intermediária (ex: 4/10 em Setembro), as anteriores (1 a 3) serão organizadas nos meses passados e as futuras nos meses seguintes.
                  </p>
                </div>

                <!-- Switch Despesa Recorrente -->
                <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="material-symbols-outlined text-secondary text-[20px]">repeat</span>
                    <div>
                      <h4 class="font-bold text-xs text-on-surface">Despesa recorrente</h4>
                      <span class="text-[10px] text-on-surface-variant">Repetir automaticamente nos próximos meses</span>
                    </div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" id="expense-is-recurring-toggle" onchange="window.toggleExpenseRecurringFields(this.checked)">
                    <span class="slider"></span>
                  </label>
                </div>

                <!-- Recurring Config Fields (Initially Hidden) -->
                <div id="expense-recurring-fields" class="hidden p-3 bg-secondary-fixed/30 rounded-2xl border border-secondary-fixed-dim/60 space-y-2">
                  <label class="text-[11px] font-bold text-on-surface block">Frequência</label>
                  <select id="expense-recurring-frequency" class="w-full px-3 py-2 bg-surface rounded-xl border border-outline-variant/40 text-xs text-on-surface font-bold">
                    <option value="monthly" selected>Mensal (Próximos 12 meses)</option>
                  </select>
                </div>
              </div>
            ` : ''}

            <!-- Delete Action (Only for existing expenses) -->
            ${expense ? `
              <div class="pt-2">
                <button type="button" onclick="window.handleDeleteExpense('${expense.id}')" 
                        class="w-full py-3 bg-error-container text-error rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-98 transition-all">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                  <span>Excluir Despesa</span>
                </button>
              </div>
            ` : ''}
          </form>
        </div>
      </div>
    </div>
  `;

  window.openKeypadForExpenseForm = function () {
    window.openKeypad({
      initialValue: selectedAmount,
      title: 'Valor da Despesa',
      onConfirm: (val) => {
        selectedAmount = val;
        const display = document.getElementById('expense-amount-display');
        if (display) display.innerText = fmtCurrency(selectedAmount);
        const input = document.getElementById('expense-amount');
        if (input) input.value = selectedAmount;
        const amountBox = document.getElementById('expense-amount-box');
        if (amountBox && selectedAmount > 0) {
          amountBox.classList.remove('border-error', 'ring-2', 'ring-error/20');
        }
      }
    });
  };

  window.setExpenseFormCategory = function (catId) {
    selectedCategory = catId;
    const btns = document.querySelectorAll('#expense-categories-grid .category-select-btn');
    btns.forEach(btn => {
      const isSelected = btn.getAttribute('data-cat-id') === catId;
      if (isSelected) {
        btn.className = 'category-select-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer border-[#dc2626] bg-[#dc2626]/10 font-bold';
      } else {
        btn.className = 'category-select-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer border-outline-variant/30 bg-surface-container text-on-surface-variant';
      }
    });
  };

  window.setExpenseFormStatus = function (status) {
    selectedStatus = status;
    const pendingBtn = document.getElementById('expense-status-pending-btn');
    const paidBtn = document.getElementById('expense-status-paid-btn');
    if (pendingBtn && paidBtn) {
      if (status === 'pending') {
        pendingBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#dc2626] text-white border-[#dc2626] shadow-sm';
        paidBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      } else {
        paidBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#15803d] text-white border-[#15803d] shadow-sm';
        pendingBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      }
    }
  };

  window.toggleExpenseInstallmentFields = function (checked) {
    const fields = document.getElementById('expense-installment-fields');
    const recurringToggle = document.getElementById('expense-is-recurring-toggle');
    if (fields) {
      if (checked) {
        fields.classList.remove('hidden');
        if (recurringToggle && recurringToggle.checked) {
          recurringToggle.checked = false;
          window.toggleExpenseRecurringFields(false);
        }
      } else {
        fields.classList.add('hidden');
      }
    }
  };

  window.toggleExpenseRecurringFields = function (checked) {
    const fields = document.getElementById('expense-recurring-fields');
    const installmentToggle = document.getElementById('expense-is-installment-toggle');
    if (fields) {
      if (checked) {
        fields.classList.remove('hidden');
        if (installmentToggle && installmentToggle.checked) {
          installmentToggle.checked = false;
          window.toggleExpenseInstallmentFields(false);
        }
      } else {
        fields.classList.add('hidden');
      }
    }
  };

  window.handleSaveExpenseSubmit = function (e) {
    e.preventDefault();
    const nameInput = document.getElementById('expense-name');
    const name = (nameInput?.value || '').trim();
    const dueDate = document.getElementById('expense-date')?.value || `${targetMonthKey}-10`;
    const payee = (document.getElementById('expense-payee')?.value || '').trim();
    const dayStr = dueDate.split('-')[2] || '10';

    if (!name) {
      if (nameInput) {
        nameInput.classList.add('border-error', 'ring-2', 'ring-error/20');
        if (typeof nameInput.focus === 'function') nameInput.focus();
      }
      window.showToast('Por favor, informe o nome da despesa.', 'error');
      return;
    } else if (nameInput) {
      nameInput.classList.remove('border-error', 'ring-2', 'ring-error/20');
    }

    if (selectedAmount <= 0) {
      const amountBox = document.getElementById('expense-amount-box');
      if (amountBox) {
        amountBox.classList.add('border-error', 'ring-2', 'ring-error/20');
      }
      window.showToast('Por favor, digite um valor maior que zero.', 'error');
      return;
    }

    const installmentChecked = document.getElementById('expense-is-installment-toggle')?.checked || false;
    const recurringChecked = document.getElementById('expense-is-recurring-toggle')?.checked || false;

    if (expenseId) {
      store.updateExpense(expenseId, {
        name,
        amount: selectedAmount,
        dueDate,
        payee,
        categoryId: selectedCategory || 'outras_despesas',
        status: selectedStatus
      });
      window.showToast('Despesa atualizada com sucesso!', 'success');
    } else if (installmentChecked) {
      const totalCount = parseInt(document.getElementById('expense-total-installments')?.value, 10) || 10;
      const currentK = parseInt(document.getElementById('expense-current-installment')?.value, 10) || 1;
      
      store.createInstallmentPlan({
        description: name,
        totalAmount: selectedAmount * totalCount,
        totalInstallments: totalCount,
        currentInstallment: currentK,
        startMonthKey: targetMonthKey,
        categoryId: selectedCategory || 'outras_despesas',
        payee,
        dueDateDay: dayStr
      });
      window.showToast(`Parcelamento (${totalCount}x) criado com sucesso!`, 'success');
    } else if (recurringChecked) {
      const frequency = document.getElementById('expense-recurring-frequency')?.value || 'monthly';
      store.createRecurringExpense({
        name,
        amount: selectedAmount,
        startMonthKey: targetMonthKey,
        categoryId: selectedCategory || 'outras_despesas',
        payee,
        dueDateDay: dayStr,
        frequency,
        horizonMonths: 12
      });
      window.showToast('Despesa recorrente mensal programada!', 'success');
    } else {
      store.addExpense({
        monthKey: targetMonthKey,
        name,
        amount: selectedAmount,
        dueDate,
        payee,
        categoryId: selectedCategory || 'outras_despesas',
        status: selectedStatus
      });
      window.showToast('Despesa cadastrada com sucesso!', 'success');
    }

    // Trigger in-app notification check if new pending expense is due today/tomorrow
    if (window.NotificationService && typeof window.NotificationService.checkDueDates === 'function') {
      setTimeout(() => window.NotificationService.checkDueDates(), 200);
    }

    window.closeModal();
  };

  window.handleDeleteExpense = function (id) {
    if (confirm('Deseja realmente excluir esta despesa?')) {
      store.deleteExpense(id);
      window.closeModal();
      window.showToast('Despesa excluída.', 'info');
    }
  };
};

// ==========================================================================
// 4. Income Modal (Input Preserved - Sticky Header with Top Submit Action)
// ==========================================================================
window.openIncomeModal = function (monthKey, incomeId = null) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const targetMonthKey = monthKey || store.getSelectedMonthKey();
  const income = incomeId ? store.getIncomeById(incomeId) : null;
  const categories = store.getCategories('income');

  let selectedAmount = income ? income.amount : 0;
  let selectedCategory = income ? (income.categoryId || 'salario') : 'salario';
  let selectedStatus = income ? income.status : 'received';

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-0 slide-up flex flex-col max-h-[90vh] overflow-hidden">
        
        <!-- Sticky Header with Title and Primary Top Action (Cadastrar / Salvar) -->
        <div class="sticky top-0 z-30 px-5 py-3.5 bg-surface dark:bg-[#241b15] border-b border-outline-variant/20 flex justify-between items-center shrink-0 rounded-t-[32px]">
          <div class="flex items-center gap-2.5">
            <button type="button" onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer" title="Fechar">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
            <h3 class="font-headline-md text-base font-bold text-on-surface">
              ${income ? 'Editar Receita' : 'Nova Receita'}
            </h3>
          </div>

          <!-- Botão Principal no Topo -->
          <button type="submit" form="income-form" 
                  class="px-4 py-2 bg-[#15803d] text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
            <span class="material-symbols-outlined text-[16px]">save</span>
            <span>${income ? 'Salvar' : 'Cadastrar'}</span>
          </button>
        </div>

        <!-- Scrollable Form Body -->
        <div class="p-5 pb-8 overflow-y-auto space-y-4">
          <form id="income-form" onsubmit="window.handleSaveIncomeSubmit(event)" class="space-y-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Nome da Receita *</label>
              <input type="text" id="income-name" required placeholder="Ex: Salário, Freelance, Rendimentos" 
                     value="${income ? income.name : ''}" 
                     class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-[#15803d] focus:outline-none text-sm text-on-surface font-semibold transition-all">
            </div>

            <!-- Single Amount Field with Custom In-App Keypad Trigger -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Valor * (Toque para digitar)</label>
              <div id="income-amount-box" onclick="window.openKeypadForIncomeForm()" 
                   class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 hover:border-[#15803d] cursor-pointer flex items-center justify-between shadow-inner transition-all">
                <span id="income-amount-display" class="font-price-display text-xl font-extrabold text-[#15803d] dark:text-[#86efac]">
                  ${fmtCurrency(selectedAmount)}
                </span>
                <span class="material-symbols-outlined text-outline text-[20px]">dialpad</span>
              </div>
              <input type="hidden" id="income-amount" value="${selectedAmount}">
            </div>

            <!-- Status Toggle: Prevista / Recebida -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Status do Recebimento</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" id="income-status-pending-btn" onclick="window.setIncomeFormStatus('pending')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedStatus === 'pending' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Prevista</span>
                </button>
                <button type="button" id="income-status-received-btn" onclick="window.setIncomeFormStatus('received')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedStatus === 'received' ? 'bg-[#15803d] text-white border-[#15803d] shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Recebida</span>
                </button>
              </div>
            </div>

            <!-- Category Selector -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Categoria</label>
              <div id="income-categories-grid" class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                ${categories.map(cat => `
                  <button type="button" onclick="window.setIncomeFormCategory('${cat.id}')" data-cat-id="${cat.id}"
                          class="income-cat-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${selectedCategory === cat.id ? 'border-[#15803d] bg-[#15803d]/10 font-bold' : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-[18px]" style="color: ${cat.textColor}">${cat.icon}</span>
                    <span class="text-[10px] text-on-surface truncate w-full text-center">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Expected Date & Payer -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Data</label>
                <input type="date" id="income-date" value="${income ? income.expectedDate : `${targetMonthKey}-05`}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Pagador / Origem</label>
                <input type="text" id="income-payer" placeholder="Ex: Empresa" value="${income ? (income.payer || '') : ''}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>
            </div>

            <!-- Delete Action (Only for existing incomes) -->
            ${income ? `
              <div class="pt-2">
                <button type="button" onclick="window.handleDeleteIncome('${income.id}')" 
                        class="w-full py-3 bg-error-container text-error rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 active:scale-98 transition-all">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                  <span>Excluir Receita</span>
                </button>
              </div>
            ` : ''}
          </form>
        </div>
      </div>
    </div>
  `;

  window.openKeypadForIncomeForm = function () {
    window.openKeypad({
      initialValue: selectedAmount,
      title: 'Valor da Receita',
      onConfirm: (val) => {
        selectedAmount = val;
        const display = document.getElementById('income-amount-display');
        if (display) display.innerText = fmtCurrency(selectedAmount);
        const input = document.getElementById('income-amount');
        if (input) input.value = selectedAmount;
        const amountBox = document.getElementById('income-amount-box');
        if (amountBox && selectedAmount > 0) {
          amountBox.classList.remove('border-error', 'ring-2', 'ring-error/20');
        }
      }
    });
  };

  window.setIncomeFormCategory = function (catId) {
    selectedCategory = catId;
    const btns = document.querySelectorAll('#income-categories-grid .income-cat-btn');
    btns.forEach(btn => {
      const isSelected = btn.getAttribute('data-cat-id') === catId;
      if (isSelected) {
        btn.className = 'income-cat-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer border-[#15803d] bg-[#15803d]/10 font-bold';
      } else {
        btn.className = 'income-cat-btn p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer border-outline-variant/30 bg-surface-container text-on-surface-variant';
      }
    });
  };

  window.setIncomeFormStatus = function (status) {
    selectedStatus = status;
    const pendingBtn = document.getElementById('income-status-pending-btn');
    const receivedBtn = document.getElementById('income-status-received-btn');
    if (pendingBtn && receivedBtn) {
      if (status === 'pending') {
        pendingBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-primary text-white border-primary shadow-sm';
        receivedBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      } else {
        receivedBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-[#15803d] text-white border-[#15803d] shadow-sm';
        pendingBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      }
    }
  };

  window.handleSaveIncomeSubmit = function (e) {
    e.preventDefault();
    const nameInput = document.getElementById('income-name');
    const name = (nameInput?.value || '').trim();
    const expectedDate = document.getElementById('income-date')?.value || `${targetMonthKey}-05`;
    const payer = (document.getElementById('income-payer')?.value || '').trim();

    if (!name) {
      if (nameInput) {
        nameInput.classList.add('border-error', 'ring-2', 'ring-error/20');
        if (typeof nameInput.focus === 'function') nameInput.focus();
      }
      window.showToast('Por favor, informe o nome da receita.', 'error');
      return;
    } else if (nameInput) {
      nameInput.classList.remove('border-error', 'ring-2', 'ring-error/20');
    }

    if (selectedAmount <= 0) {
      const amountBox = document.getElementById('income-amount-box');
      if (amountBox) {
        amountBox.classList.add('border-error', 'ring-2', 'ring-error/20');
      }
      window.showToast('Por favor, digite um valor maior que zero.', 'error');
      return;
    }

    if (incomeId) {
      store.updateIncome(incomeId, {
        name,
        amount: selectedAmount,
        expectedDate,
        payer,
        categoryId: selectedCategory || 'salario',
        status: selectedStatus
      });
      window.showToast('Receita atualizada com sucesso!', 'success');
    } else {
      store.addIncome({
        monthKey: targetMonthKey,
        name,
        amount: selectedAmount,
        expectedDate,
        payer,
        categoryId: selectedCategory || 'salario',
        status: selectedStatus
      });
      window.showToast('Receita cadastrada com sucesso!', 'success');
    }

    window.closeModal();
  };

  window.handleDeleteIncome = function (id) {
    if (confirm('Deseja realmente excluir esta receita?')) {
      store.deleteIncome(id);
      window.closeModal();
      window.showToast('Receita excluída.', 'info');
    }
  };
};

// ==========================================================================
// 5. Category Management Modal (CRUD + Extensive Colors & Icons)
// ==========================================================================
const CURATED_CATEGORY_COLORS = [
  { id: 'blue', name: 'Azul', bgColor: '#dbeafe', textColor: '#1d4ed8', borderColor: '#bfdbfe', cardBgLight: '#edf5ff', cardBgDark: '#102447', cardBorderLight: '#bfdbfe', cardBorderDark: '#1e3a8a' },
  { id: 'green', name: 'Verde', bgColor: '#dcfce7', textColor: '#15803d', borderColor: '#bbf7d0', cardBgLight: '#effcf2', cardBgDark: '#0c2d16', cardBorderLight: '#bbf7d0', cardBorderDark: '#155e2e' },
  { id: 'sky', name: 'Azul Claro', bgColor: '#e0f2fe', textColor: '#0284c7', borderColor: '#bae6fd', cardBgLight: '#f0f9ff', cardBgDark: '#082f49', cardBorderLight: '#bae6fd', cardBorderDark: '#075985' },
  { id: 'rose', name: 'Rosa / Vermelho', bgColor: '#ffe4e6', textColor: '#e11d48', borderColor: '#fecdd3', cardBgLight: '#fff1f3', cardBgDark: '#3b0d18', cardBorderLight: '#fecdd6', cardBorderDark: '#6b152b' },
  { id: 'amber', name: 'Amarelo / Âmbar', bgColor: '#fef08a', textColor: '#ca8a04', borderColor: '#fde047', cardBgLight: '#fefce8', cardBgDark: '#382305', cardBorderLight: '#fde047', cardBorderDark: '#6b4609' },
  { id: 'violet', name: 'Roxo / Violeta', bgColor: '#f3e8ff', textColor: '#9333ea', borderColor: '#e9d5ff', cardBgLight: '#faf5ff', cardBgDark: '#2b0b47', cardBorderLight: '#e9d5ff', cardBorderDark: '#581c87' },
  { id: 'teal', name: 'Verde Petróleo', bgColor: '#ccfbf1', textColor: '#0d9488', borderColor: '#99f6e4', cardBgLight: '#f0fdfa', cardBgDark: '#062b27', cardBorderLight: '#99f6e4', cardBorderDark: '#115e59' },
  { id: 'fuchsia', name: 'Fúcsia / Magenta', bgColor: '#fce7f3', textColor: '#c026d3', borderColor: '#fbcfe8', cardBgLight: '#fdf4ff', cardBgDark: '#380a42', cardBorderLight: '#f5d0fe', cardBorderDark: '#701a75' },
  { id: 'indigo', name: 'Índigo', bgColor: '#e0e7ff', textColor: '#4338ca', borderColor: '#c7d2fe', cardBgLight: '#eef2ff', cardBgDark: '#1e1b4b', cardBorderLight: '#c7d2fe', cardBorderDark: '#3730a3' },
  { id: 'orange', name: 'Laranja', bgColor: '#ffedd5', textColor: '#c2410c', borderColor: '#fed7aa', cardBgLight: '#fff7ed', cardBgDark: '#3a1508', cardBorderLight: '#fed7aa', cardBorderDark: '#6e2a0f' },
  { id: 'emerald', name: 'Esmeralda', bgColor: '#d1fae5', textColor: '#047857', borderColor: '#a7f3d0', cardBgLight: '#ecfdf5', cardBgDark: '#064e3b', cardBorderLight: '#a7f3d0', cardBorderDark: '#065f46' },
  { id: 'neutral', name: 'Neutro Quente', bgColor: '#f2dfd4', textColor: '#564337', borderColor: '#dcc1b1', cardBgLight: '#faf8f6', cardBgDark: '#271d17', cardBorderLight: '#ede3dc', cardBorderDark: '#443329' }
];

const CURATED_CATEGORY_ICONS = [
  'home', 'restaurant', 'directions_car', 'medical_services', 'checkroom', 'receipt_long', 
  'flight', 'sports_esports', 'school', 'more_horiz', 'work', 'trending_up', 'laptop_mac', 
  'assignment_return', 'move_to_inbox', 'attach_money', 'shopping_bag', 'credit_card', 
  'local_gas_station', 'fitness_center', 'local_bar', 'pets', 'local_cafe', 'build', 
  'movie', 'music_note', 'diamond', 'savings', 'sell', 'payments', 'account_balance', 
  'phone_android', 'wifi', 'tv', 'shopping_cart', 'fastfood', 'local_hospital', 'directions_bus', 
  'flight_takeoff', 'redeem', 'celebration', 'park', 'water_drop', 'bolt', 'subscriptions'
];

window.openCategoryEditModal = function (categoryId = null, defaultType = 'expense') {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const category = categoryId ? store.getCategoryById(categoryId) : null;
  const isEditing = Boolean(category && category.id);

  let selectedColor = category ? {
    bgColor: category.bgColor,
    textColor: category.textColor,
    borderColor: category.borderColor,
    cardBgLight: category.cardBgLight,
    cardBgDark: category.cardBgDark,
    cardBorderLight: category.cardBorderLight,
    cardBorderDark: category.cardBorderDark
  } : CURATED_CATEGORY_COLORS[0];

  let selectedIcon = category ? category.icon : 'category';
  let selectedType = category ? category.type : defaultType;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-5 pb-8 slide-up flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <h3 class="font-headline-md text-base font-bold text-on-surface">
            ${isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </h3>
          <button type="button" onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onsubmit="window.handleSaveCategorySubmit(event)" class="space-y-4">
          <!-- Name -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface block">Nome da Categoria *</label>
            <input type="text" id="cat-name-input" required placeholder="Ex: Farmácia, Viagens, Investimentos" 
                   value="${category ? category.name : ''}" 
                   class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none text-sm text-on-surface font-semibold">
          </div>

          <!-- Type -->
          <div class="space-y-1">
            <label class="text-xs font-bold text-on-surface block">Tipo</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" id="cat-type-expense-btn" onclick="window.setCatModalType('expense')" 
                      class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedType === 'expense' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                <span class="material-symbols-outlined text-[16px]">trending_down</span>
                <span>Despesa</span>
              </button>
              <button type="button" id="cat-type-income-btn" onclick="window.setCatModalType('income')" 
                      class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${selectedType === 'income' ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                <span class="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Receita</span>
              </button>
            </div>
          </div>

          <!-- Color Swatches Grid -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Cor de Fundo e Destaque</label>
            <div class="grid grid-cols-6 gap-2 p-1">
              ${CURATED_CATEGORY_COLORS.map(c => `
                <button type="button" onclick="window.setCatModalColor('${c.id}')" data-color-id="${c.id}"
                        class="color-swatch-btn h-10 rounded-xl flex items-center justify-center shadow-sm border-2 transition-transform active:scale-95 cursor-pointer ${selectedColor.bgColor === c.bgColor ? 'border-primary scale-105' : 'border-transparent'}" 
                        style="background-color: ${c.bgColor}; color: ${c.textColor}">
                  <span class="material-symbols-outlined text-[18px]">${selectedColor.bgColor === c.bgColor ? 'check' : ''}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Icons Grid -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Ícone</label>
            <div id="cat-icons-grid" class="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
              ${CURATED_CATEGORY_ICONS.map(ic => `
                <button type="button" onclick="window.setCatModalIcon('${ic}')" data-icon-name="${ic}"
                        class="cat-icon-select-btn p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${selectedIcon === ic ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-variant text-on-surface'}">
                  <span class="material-symbols-outlined text-[20px]">${ic}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2.5 pt-2">
            ${isEditing && category.id !== 'outras_despesas' && category.id !== 'outras_receitas' ? `
              <button type="button" onclick="window.handleDeleteCategoryAction('${category.id}')" class="p-3 bg-error-container text-error rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer">
                <span class="material-symbols-outlined text-[20px]">delete</span>
              </button>
            ` : ''}
            <button type="submit" class="flex-1 py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">save</span>
              <span>${isEditing ? 'Salvar Alterações' : 'Criar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  window.setCatModalType = function (tp) {
    selectedType = tp;
    const expBtn = document.getElementById('cat-type-expense-btn');
    const incBtn = document.getElementById('cat-type-income-btn');
    if (expBtn && incBtn) {
      if (tp === 'expense') {
        expBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-primary text-white border-primary shadow-sm';
        incBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      } else {
        incBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-secondary text-white border-secondary shadow-sm';
        expBtn.className = 'py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-surface-container text-on-surface-variant border-outline-variant/30';
      }
    }
  };

  window.setCatModalColor = function (colorId) {
    const found = CURATED_CATEGORY_COLORS.find(c => c.id === colorId) || CURATED_CATEGORY_COLORS[0];
    selectedColor = found;
    const btns = document.querySelectorAll('.color-swatch-btn');
    btns.forEach(btn => {
      const match = btn.getAttribute('data-color-id') === colorId;
      btn.className = `color-swatch-btn h-10 rounded-xl flex items-center justify-center shadow-sm border-2 transition-transform active:scale-95 cursor-pointer ${match ? 'border-primary scale-105' : 'border-transparent'}`;
      btn.innerHTML = match ? '<span class="material-symbols-outlined text-[18px]">check</span>' : '';
    });
  };

  window.setCatModalIcon = function (iconName) {
    selectedIcon = iconName;
    const btns = document.querySelectorAll('#cat-icons-grid .cat-icon-select-btn');
    btns.forEach(btn => {
      const match = btn.getAttribute('data-icon-name') === iconName;
      btn.className = `cat-icon-select-btn p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${match ? 'bg-primary text-white shadow-sm' : 'hover:bg-surface-variant text-on-surface'}`;
    });
  };

  window.handleSaveCategorySubmit = function (e) {
    e.preventDefault();
    const name = (document.getElementById('cat-name-input')?.value || '').trim();
    if (!name) {
      window.showToast('Por favor, informe o nome da categoria.', 'error');
      return;
    }

    if (isEditing) {
      store.updateCategory(categoryId, {
        name,
        type: selectedType,
        icon: selectedIcon,
        bgColor: selectedColor.bgColor,
        textColor: selectedColor.textColor,
        borderColor: selectedColor.borderColor,
        cardBgLight: selectedColor.cardBgLight,
        cardBgDark: selectedColor.cardBgDark,
        cardBorderLight: selectedColor.cardBorderLight,
        cardBorderDark: selectedColor.cardBorderDark
      });
      window.showToast('Categoria atualizada com sucesso!', 'success');
    } else {
      store.addCategory({
        name,
        type: selectedType,
        icon: selectedIcon,
        bgColor: selectedColor.bgColor,
        textColor: selectedColor.textColor,
        borderColor: selectedColor.borderColor,
        cardBgLight: selectedColor.cardBgLight,
        cardBgDark: selectedColor.cardBgDark,
        cardBorderLight: selectedColor.cardBorderLight,
        cardBorderDark: selectedColor.cardBorderDark
      });
      window.showToast('Categoria criada com sucesso!', 'success');
    }

    window.closeModal();
  };

  window.handleDeleteCategoryAction = function (catId) {
    if (confirm('Deseja realmente excluir esta categoria? Os lançamentos associados serão mantidos e transferidos para "Outras despesas".')) {
      store.deleteCategory(catId);
      window.closeModal();
      window.showToast('Categoria excluída.', 'info');
    }
  };
};

// ==========================================================================
// 6. Mobile Connect PWA Modal (Clean QR Code & Canonical URL)
// ==========================================================================
window.openMobileConnectModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  // Use clean public URL without hashes or query artifacts
  const cleanPublicUrl = (window.location.origin + window.location.pathname).replace(/\/$/, '') || window.location.href;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="bg-surface rounded-3xl p-6 w-full max-w-[400px] shadow-2xl border border-outline-variant/30 flex flex-col items-center gap-4 text-center slide-up">
        
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[24px]">phone_iphone</span>
            <h3 class="font-headline-md text-base font-bold text-on-surface">Instalar no Smartphone</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div id="pwa-qrcode" class="p-3.5 bg-white rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-center min-w-[190px] min-h-[190px]"></div>

        <div class="w-full bg-surface-container p-2.5 rounded-xl border border-outline-variant/30 flex items-center justify-between gap-2 text-left">
          <span class="text-[11px] text-on-surface font-mono truncate select-all">${cleanPublicUrl}</span>
          <button type="button" onclick="window.copyPublicAppUrl('${cleanPublicUrl}')" class="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer active:scale-95">
            Copiar
          </button>
        </div>

        <div class="space-y-1 text-xs text-on-surface-variant">
          <p>Aponte a câmera do seu celular para o QR Code acima.</p>
          <p class="text-[11px]"><strong>iPhone (Safari):</strong> Toque em Compartilhar ➔ "Adicionar à Tela de Início".</p>
          <p class="text-[11px]"><strong>Android (Chrome):</strong> Toque no menu ➔ "Instalar aplicativo".</p>
        </div>

        <button onclick="window.closeModal()" class="w-full py-2.5 bg-surface-container hover:bg-surface-variant font-bold text-xs rounded-xl text-on-surface transition-colors cursor-pointer">
          Fechar
        </button>
      </div>
    </div>
  `;

  window.copyPublicAppUrl = function (url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        window.showToast('Link copiado para a área de transferência!', 'success');
      }).catch(() => {
        window.showToast('Link: ' + url, 'info');
      });
    } else {
      window.showToast('Link: ' + url, 'info');
    }
  };

  setTimeout(() => {
    const qrContainer = document.getElementById('pwa-qrcode');
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: cleanPublicUrl,
        width: 170,
        height: 170,
        colorDark: '#18120d',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else if (qrContainer && typeof window.generateQRCodeSVG === 'function') {
      qrContainer.innerHTML = window.generateQRCodeSVG(cleanPublicUrl, 170, '#18120d', '#ffffff');
    }
  }, 30);
};

// ==========================================================================
// 7. Profile Modals & Month Close Assistants
// ==========================================================================
window.openOnboardingModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  let uploadedPhotoBase64 = '';

  const renderOnboardingUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md fade-in">
        <div class="bg-surface rounded-3xl p-6 w-full max-w-[420px] shadow-2xl border border-outline-variant/30 flex flex-col gap-5 slide-up">
          
          <div class="text-center space-y-1.5">
            <div class="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container mx-auto flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[30px]">account_circle</span>
            </div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">Bem-vindo ao Smart Finances</h2>
            <p class="text-xs text-on-surface-variant">Configure seu perfil para personalizar sua experiência financeira.</p>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="relative group cursor-pointer" onclick="document.getElementById('onboarding-photo-input').click()">
              <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md bg-surface-container flex items-center justify-center text-outline">
                ${uploadedPhotoBase64 ? `
                  <img src="${uploadedPhotoBase64}" alt="Foto de perfil" class="w-full h-full object-cover">
                ` : `
                  <img src="./icons/icon-192.png" alt="Smart Finances" class="w-full h-full object-cover">
                `}
              </div>
              <div class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-surface">
                <span class="material-symbols-outlined text-[15px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="onboarding-photo-input" accept="image/*" class="hidden" onchange="window.handlePhotoSelected(event)">
            <span class="text-[11px] text-on-surface-variant">Toque para adicionar foto (opcional)</span>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Seu Nome *</label>
            <input type="text" id="onboarding-name-input" placeholder="Ex: Paulo Palhares" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-sm text-on-surface font-semibold" value="${window.financeStore.state.userName || ''}">
          </div>

          <button type="button" onclick="window.submitOnboarding()" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <span>Começar a Usar</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    `;
  };

  window.handlePhotoSelected = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        uploadedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        renderOnboardingUI();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.submitOnboarding = function () {
    const nameInput = document.getElementById('onboarding-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      window.showToast('Por favor, digite seu nome.', 'error');
      return;
    }

    window.financeStore.saveProfile({
      userName: name,
      userPhoto: uploadedPhotoBase64 || window.financeStore.state.userPhoto || ''
    });

    window.closeModal();
    window.showToast(`Olá, ${name}! Perfil configurado com sucesso.`, 'success');
  };

  renderOnboardingUI();
};

window.openProfileEditModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  let currentPhoto = store.state.userPhoto || '';

  const renderEditProfileUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
        <div class="bg-surface rounded-3xl p-6 w-full max-w-[400px] shadow-2xl border border-outline-variant/30 flex flex-col gap-4 slide-up">
          
          <div class="flex justify-between items-center">
            <h3 class="font-headline-md text-base font-bold text-on-surface">Editar Perfil</h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="flex flex-col items-center gap-2">
            <div class="relative cursor-pointer" onclick="document.getElementById('edit-profile-photo-input').click()">
              <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md bg-surface-container flex items-center justify-center text-outline">
                ${currentPhoto ? `
                  <img src="${currentPhoto}" alt="Foto de perfil" class="w-full h-full object-cover">
                ` : `
                  <img src="./icons/icon-192.png" alt="Smart Finances" class="w-full h-full object-cover">
                `}
              </div>
              <div class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-surface">
                <span class="material-symbols-outlined text-[15px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="edit-profile-photo-input" accept="image/*" class="hidden" onchange="window.handleEditPhotoSelected(event)">
            ${currentPhoto ? `
              <button type="button" onclick="window.removeProfilePhoto()" class="text-[11px] text-error font-bold">Remover foto</button>
            ` : ''}
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Nome</label>
            <input type="text" id="edit-profile-name" value="${store.state.userName || ''}" class="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-sm text-on-surface font-semibold">
          </div>

          <button type="button" onclick="window.saveProfileEdit()" class="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer">
            Salvar Alterações
          </button>
        </div>
      </div>
    `;
  };

  window.handleEditPhotoSelected = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        currentPhoto = canvas.toDataURL('image/jpeg', 0.85);
        renderEditProfileUI();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.removeProfilePhoto = function () {
    currentPhoto = '';
    renderEditProfileUI();
  };

  window.saveProfileEdit = function () {
    const nameInput = document.getElementById('edit-profile-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      window.showToast('Por favor, digite seu nome.', 'error');
      return;
    }
    store.saveProfile({
      userName: name,
      userPhoto: currentPhoto
    });
    window.closeModal();
    window.showToast('Perfil atualizado com sucesso!', 'success');
  };

  renderEditProfileUI();
};

window.openYearPickerModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const currentYear = new Date().getFullYear();
  let years = [];
  for (let y = currentYear + 4; y >= currentYear - 4; y--) {
    years.push(y);
  }

  const selectedYear = window.financeStore.getSelectedYear();

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-5 pb-8 slide-up flex flex-col gap-4">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <h3 class="font-bold text-sm text-on-surface">Selecionar Ano</h3>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant">
          Escolha o ano para navegar pelos meses correspondentes:
        </p>

        <div class="grid grid-cols-3 gap-2.5 pt-1">
          ${years.map(yr => {
            const isSelected = selectedYear === yr;
            return `
              <button onclick="window.selectYearFilter(${yr})" 
                      class="py-3 rounded-2xl border text-sm font-bold transition-all active:scale-95 cursor-pointer ${isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container hover:bg-surface-variant text-on-surface border-outline-variant/30'}">
                ${yr}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  window.selectYearFilter = function (yr) {
    window.financeStore.setSelectedYear(yr);
    window.closeModal();
  };
};

window.openMonthFiltersModal = function (type = 'expense') {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const monthKey = store.getSelectedMonthKey();
  const categories = store.getCategories(type);

  const items = type === 'expense' ? store.getExpensesByMonth(monthKey) : store.getIncomesByMonth(monthKey);
  const payeesPayers = Array.from(new Set(items.map(i => type === 'expense' ? i.payee : i.payer).filter(Boolean)));

  const currentCat = store.state.monthFilterCategory || 'all';
  const currentStatus = store.state.monthFilterStatus || 'all';
  const currentPerson = store.state.monthFilterPayeePayer || 'all';

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-5 pb-8 slide-up flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">filter_list</span>
            <h3 class="font-bold text-sm text-on-surface">Filtros de ${type === 'expense' ? 'Despesas' : 'Receitas'}</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Status Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-on-surface block">Status</label>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.applyTempFilter('status', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentStatus === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todos</button>
            ${type === 'expense' ? `
              <button onclick="window.applyTempFilter('status', 'pending')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentStatus === 'pending' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Pendente</button>
              <button onclick="window.applyTempFilter('status', 'paid')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentStatus === 'paid' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}">Pago</button>
            ` : `
              <button onclick="window.applyTempFilter('status', 'pending')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentStatus === 'pending' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Prevista</button>
              <button onclick="window.applyTempFilter('status', 'received')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentStatus === 'received' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}">Recebida</button>
            `}
          </div>
        </div>

        <!-- Category Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-on-surface block">Categoria</label>
          <div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            <button onclick="window.applyTempFilter('category', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentCat === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todas</button>
            ${categories.map(cat => `
              <button onclick="window.applyTempFilter('category', '${cat.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${currentCat === cat.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">
                <span class="material-symbols-outlined text-[15px]">${cat.icon}</span>
                <span>${cat.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Payee/Payer Filter -->
        ${payeesPayers.length > 0 ? `
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">${type === 'expense' ? 'Recebedor / Local' : 'Pagador / Origem'}</label>
            <div class="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              <button onclick="window.applyTempFilter('person', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPerson === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todos</button>
              ${payeesPayers.map(p => `
                <button onclick="window.applyTempFilter('person', '${p}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPerson === p ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Actions: Limpar e Fechar -->
        <div class="flex gap-2.5 pt-2">
          <button onclick="window.financeStore.clearMonthFilters(); window.closeModal();" class="flex-1 py-3 bg-surface-container hover:bg-surface-variant text-error font-bold rounded-2xl text-xs border border-outline-variant/30 cursor-pointer">
            Limpar Filtros
          </button>
          <button onclick="window.closeModal()" class="flex-1 py-3 bg-primary text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  `;

  window.applyTempFilter = function (filterType, val) {
    if (filterType === 'status') store.setMonthFilterStatus(val);
    if (filterType === 'category') store.setMonthFilterCategory(val);
    if (filterType === 'person') store.setMonthFilterPayeePayer(val);
    window.openMonthFiltersModal(type);
  };
};

window.openMonthCloseModal = function (monthKey) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const summary = store.calculateMonthSummary(monthKey);
  const fmt = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet rounded-t-[32px] p-5 pb-8 slide-up flex flex-col gap-4">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">lock</span>
            <h3 class="font-headline-md text-base font-bold text-on-surface">Fechamento de ${summary.monthName}</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="bg-surface-container rounded-2xl p-4 space-y-2 border border-outline-variant/30">
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Balanço Mensal:</span>
            <strong class="${summary.forecastBalance >= 0 ? 'text-secondary' : 'text-[#dc2626]'} font-bold">${fmt(summary.forecastBalance)}</strong>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Saldo Atual Realizado:</span>
            <strong class="${summary.actualBalance >= 0 ? 'text-secondary' : 'text-[#dc2626]'} font-bold">${fmt(summary.actualBalance)}</strong>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Despesas Restantes:</span>
            <strong class="text-on-surface font-bold">${fmt(summary.remainingExpenses)}</strong>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          <label class="flex items-start gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/30 cursor-pointer">
            <input type="checkbox" id="carry-positive-balance" checked class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4">
            <div class="text-xs">
              <span class="font-bold text-on-surface block">Adicionar saldo restante (${fmt(summary.actualBalance)}) ao próximo mês?</span>
              <span class="text-on-surface-variant text-[11px]">Cria uma entrada de "Saldo Trazido" no mês seguinte.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/30 cursor-pointer">
            <input type="checkbox" id="carry-unpaid-expenses" checked class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4">
            <div class="text-xs">
              <span class="font-bold text-on-surface block">Carregar pendências não pagas para o próximo mês?</span>
              <span class="text-on-surface-variant text-[11px]">Mantém o registro original neste mês e cria réplica com tag "Pendente do mês anterior".</span>
            </div>
          </label>
        </div>

        <button onclick="window.confirmCloseMonth('${monthKey}')" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all cursor-pointer">
          Confirmar Fechamento do Mês
        </button>
      </div>
    </div>
  `;

  window.confirmCloseMonth = function (mKey) {
    const carryBal = document.getElementById('carry-positive-balance')?.checked || false;
    const carryExp = document.getElementById('carry-unpaid-expenses')?.checked || false;

    store.closeMonth(mKey, {
      carryPositiveBalance: carryBal,
      carryUnpaidExpenses: carryExp
    });

    window.closeModal();
    window.showToast(`Mês fechado com sucesso!`, 'success');
  };
};
