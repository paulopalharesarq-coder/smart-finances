/**
 * Smart Finances - Month Detail View (Enhanced Visual & Functional Refinement)
 * Features category-colored card backgrounds, status popover triggers,
 * search without input destruction / keyboard preservation, raised FAB position,
 * and contextual floating summary card showing "Despesas restantes" and "Total Contextual".
 */

window.renderMonthDetailView = function () {
  const store = window.financeStore;
  const monthKey = store.getSelectedMonthKey();
  const summary = store.calculateMonthSummary(monthKey);
  const activeTab = store.state.monthDetailTab || 'expenses';
  const hasFilters = store.hasActiveFilters();

  const allExpenses = store.getExpensesByMonth(monthKey);
  const allIncomes = store.getIncomesByMonth(monthKey);

  return `
    <div class="pb-44">
      <!-- TopAppBar com Botão Voltar para a Home & Conciliar Saldo -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all cursor-pointer" title="Voltar ao início">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 class="font-headline-xl-mobile text-lg font-bold text-on-surface leading-tight">${summary.monthName}</h1>
            <span class="text-on-surface-variant text-xs font-medium">Controle Mensal</span>
          </div>
        </div>

        <!-- Botão Conciliar Saldo do Mês -->
        <button type="button" 
                onclick="window.openReconcileBalanceModal('${monthKey}')" 
                class="px-3 py-1.5 rounded-2xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-[#944a00]/25 dark:border-[#ffb783]/25 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs" 
                title="Conciliar Saldo Real">
          <span class="material-symbols-outlined text-[16px]">tune</span>
          <span class="hidden sm:inline">Conciliar</span>
        </button>
      </header>

      <!-- Main Content -->
      <main class="px-5 pt-2 space-y-4">
        
        <!-- Seletor Segmentado: [ Despesas ] [ Receitas ] (Cores 100% alinhadas ao card da Home) -->
        <div class="bg-[#f4ebe4] dark:bg-[#2b2019] p-1 rounded-full flex items-center gap-1 border border-[#ebdcd1] dark:border-[#3e3027] shadow-inner">
          <!-- Aba Despesas: Coral do card negativo da Home (#ea7355 / #852f1b) -->
          <button onclick="window.financeStore.setMonthDetailTab('expenses')" 
                  class="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'expenses' ? 'bg-[#ea7355] dark:bg-[#852f1b] text-white shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
            <span class="material-symbols-outlined text-[17px]">trending_down</span>
            <span id="tab-expenses-count-label">Despesas (${allExpenses.length})</span>
          </button>

          <!-- Aba Receitas: Verde do card positivo da Home (#309b57 / #124d27) -->
          <button onclick="window.financeStore.setMonthDetailTab('incomes')" 
                  class="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'incomes' ? 'bg-[#309b57] dark:bg-[#124d27] text-white shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
            <span class="material-symbols-outlined text-[17px]">trending_up</span>
            <span id="tab-incomes-count-label">Receitas (${allIncomes.length})</span>
          </button>
        </div>

        <!-- Barra de Busca & Botão de Filtros -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#944a00]/70 dark:text-[#ffb783]/70 text-[18px]">search</span>
            <input type="text" 
                   id="month-search-input"
                   value="${store.state.monthSearchQuery || ''}" 
                   oninput="window.handleMonthSearchInput(this.value)" 
                   placeholder="Buscar lançamentos..." 
                   class="w-full pl-10 pr-9 py-2.5 bg-[#faeae0] dark:bg-[#332218] rounded-2xl border border-transparent dark:border-white/5 focus:border-[#944a00] dark:focus:border-[#ffb783] focus:outline-none text-xs font-semibold text-on-surface placeholder:text-[#944a00]/50 dark:placeholder:text-[#ffb783]/50 shadow-sm transition-all">
            <button id="month-search-clear-btn" 
                    type="button" 
                    onclick="window.clearMonthSearch()" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-[#944a00]/70 dark:text-[#ffb783]/70 hover:text-on-surface cursor-pointer ${store.state.monthSearchQuery ? '' : 'hidden'}">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <!-- Botão de Filtros -->
          <button onclick="window.openMonthFiltersModal('${activeTab === 'expenses' ? 'expense' : 'income'}')" 
                  class="px-3.5 py-2.5 rounded-2xl ${hasFilters ? 'bg-primary text-white border-primary shadow-sm' : 'bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-transparent dark:border-white/5'} font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Filtros">
            <span class="material-symbols-outlined text-[17px]">tune</span>
            <span>Filtros</span>
          </button>
        </div>

        <!-- Barra de Filtros Ativos (se houver) -->
        <div id="month-active-filters-bar" class="${hasFilters ? '' : 'hidden'}">
          <div class="flex items-center justify-between bg-surface-container p-2 rounded-xl border border-outline-variant/30 text-xs">
            <span class="text-primary font-bold">Filtros ativos aplicados</span>
            <button onclick="window.financeStore.clearMonthFilters()" class="text-error text-[11px] font-bold flex items-center gap-0.5 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">close</span>
              Limpar filtros
            </button>
          </div>
        </div>

        <!-- Container de Lançamentos Renderizado Dinamicamente -->
        <div id="month-items-container" class="space-y-3 pt-1">
          ${window.getMonthItemsHtml(monthKey, activeTab)}
        </div>
      </main>

      <!-- Card Flutuante Inferior de Resumo: Despesas Restantes + Total Contextual -->
      <div id="month-summary-dock-container" class="fixed bottom-4 left-0 right-0 max-w-[370px] sm:max-w-[430px] mx-auto z-40 px-3 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        ${window.getMonthSummaryDockHtml(monthKey, activeTab)}
      </div>

      <!-- FAB Flutuante de Adicionar (Cores 100% alinhadas ao card da Home: Coral para Despesas, Verde para Receitas) -->
      <button onclick="${activeTab === 'expenses' ? `window.openExpenseModal('${monthKey}')` : `window.openIncomeModal('${monthKey}')`}" 
              class="fixed bottom-36 right-6 z-40 w-14 h-14 rounded-full ${activeTab === 'expenses' ? 'bg-[#ea7355] dark:bg-[#852f1b]' : 'bg-[#309b57] dark:bg-[#124d27]'} text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer" 
              title="${activeTab === 'expenses' ? 'Adicionar Despesa' : 'Adicionar Receita'}">
        <span class="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  `;
};

window.getMonthItemsHtml = function (monthKey, activeTab) {
  const store = window.financeStore;
  const hideBalances = store.state.hideBalances || false;
  const fmtCurrency = (val, hide) => hide ? 'R$ •••••' : Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const searchQuery = (store.state.monthSearchQuery || '').toLowerCase().trim();
  const categoryFilter = store.state.monthFilterCategory || 'all';
  const statusFilter = store.state.monthFilterStatus || 'all';
  const personFilter = store.state.monthFilterPayeePayer || 'all';

  if (activeTab === 'expenses') {
    const allExpenses = store.getExpensesByMonth(monthKey);
    const filteredExpenses = allExpenses.filter(e => {
      const matchesSearch = !searchQuery || (e.name && e.name.toLowerCase().includes(searchQuery)) || (e.payee && e.payee.toLowerCase().includes(searchQuery));
      const matchesCategory = categoryFilter === 'all' || e.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesPerson = personFilter === 'all' || e.payee === personFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
    });

    if (filteredExpenses.length === 0) {
      return `
        <div class="py-10 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
          <span class="material-symbols-outlined text-3xl text-outline mb-1">receipt_long</span>
          <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhuma despesa encontrada</h4>
          <p class="text-[11px] text-on-surface-variant mt-0.5 mb-3">Toque no botão abaixo para cadastrar despesas.</p>
          <button onclick="window.openExpenseModal('${monthKey}')" class="px-4 py-2 bg-[#ea7355] dark:bg-[#852f1b] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:opacity-95 active:scale-95 transition-all">
            + Adicionar Despesa
          </button>
        </div>
      `;
    }

    return filteredExpenses.map(exp => {
      const cat = store.getCategoryById(exp.categoryId);
      const styles = store.getCategoryCardStyles(cat);
      const isPaid = exp.status === 'paid';
      const isOverdue = exp.status === 'overdue' || (exp.dueDate && exp.dueDate < new Date().toISOString().slice(0, 10) && !isPaid);
      const isMovedOut = Boolean(exp.isMoved || exp.movedToMonthKey);
      const isMovedIn = Boolean(exp.movedFromMonthKey);

      return `
        <div class="category-tinted-card rounded-2xl p-4 border transition-all shadow-sm group relative ${isMovedOut ? 'opacity-80' : ''}" 
             style="--card-bg: ${styles.cardBgLight}; --card-border: ${styles.cardBorderLight}; --card-bg-dark: ${styles.cardBgDark}; --card-border-dark: ${styles.cardBorderDark};">
          
          <div class="flex justify-between items-center gap-2">
            <div class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
              </div>
              <h4 class="font-bold text-sm text-on-surface truncate ${isPaid ? 'line-through opacity-70' : ''}">
                ${exp.name}
              </h4>
            </div>

            ${isMovedOut ? `
              <button type="button" 
                      onclick="event.stopPropagation(); window.openExpenseModal('${monthKey}', '${exp.id}')" 
                      class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-[#944a00]/30 dark:border-[#ffb783]/30"
                      title="Despesa transferida para outro mês">
                <span class="material-symbols-outlined text-[15px]">redo</span>
                <span>Movida</span>
              </button>
            ` : `
              <button type="button" 
                      onclick="event.stopPropagation(); window.openStatusPickerModal({ id: '${exp.id}', type: 'expense', currentStatus: '${exp.status}' })" 
                      class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${isPaid ? 'bg-[#dcfce7] dark:bg-[#0f2e1b] text-[#15803d] dark:text-[#86efac] border border-[#86efac] dark:border-[#166534]' : 'bg-[#fee2e2] dark:bg-[#3b1212] text-[#dc2626] dark:text-[#fca5a5] border border-[#fca5a5] dark:border-[#7f1d1d]'}"
                      title="Alterar situação">
                <span class="material-symbols-outlined text-[15px]">${isPaid ? 'check_circle' : 'schedule'}</span>
                <span>${isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}</span>
              </button>
            `}
          </div>

          <div class="my-2 cursor-pointer" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
            <span class="font-price-display text-lg sm:text-xl font-extrabold text-on-surface dark:text-[#fcf6f2] block leading-none">
              ${fmtCurrency(exp.amount, hideBalances)}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs cursor-pointer" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
            <div class="flex items-center text-[11px] font-bold text-on-surface-variant dark:text-[#d7c3b5] truncate">
              <span class="truncate">${cat.name}</span>
            </div>

            <div class="flex items-center gap-1 font-bold text-on-surface text-xs justify-end sm:justify-center">
              <span class="material-symbols-outlined text-[15px]" style="color: ${cat.textColor}">event</span>
              <span>${exp.dueDate ? exp.dueDate.split('-').reverse().slice(0, 2).join('/') : 'Sem data'}</span>
            </div>

            <div class="col-span-2 sm:col-span-1 flex items-center gap-1.5 justify-between sm:justify-end text-[11px] text-on-surface-variant font-medium flex-wrap">
              <span class="truncate">${exp.payee ? exp.payee : '—'}</span>
              ${exp.isInstallment ? `
                <span class="px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-black shrink-0 shadow-sm">
                  ${exp.installmentNumber}/${exp.totalInstallments}
                </span>
              ` : ''}
              ${exp.isRecurring ? `
                <span class="px-1.5 py-0.5 rounded-lg bg-secondary/15 text-secondary text-[10px] font-bold shrink-0 flex items-center gap-0.5" title="Despesa Recorrente">
                  <span class="material-symbols-outlined text-[12px]">repeat</span>
                  <span>Recorrente</span>
                </span>
              ` : ''}
              ${isMovedOut ? `
                <span class="px-2 py-0.5 rounded-lg bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] text-[10px] font-bold shrink-0 flex items-center gap-1 border border-[#944a00]/20 dark:border-[#ffb783]/20" title="Transferida para ${store.formatShortMonthYear(exp.movedToMonthKey)}">
                  <span class="material-symbols-outlined text-[12px]">redo</span>
                  <span>Movida para ${store.formatShortMonthYear(exp.movedToMonthKey)}</span>
                </span>
              ` : ''}
              ${isMovedIn ? `
                <span class="px-2 py-0.5 rounded-lg bg-[#e0f2fe] dark:bg-[#0c2438] text-[#0284c7] dark:text-[#7dd3fc] text-[10px] font-bold shrink-0 flex items-center gap-1 border border-[#0284c7]/20 dark:border-[#7dd3fc]/20" title="Vinda de ${store.formatShortMonthYear(exp.movedFromMonthKey)}">
                  <span class="material-symbols-outlined text-[12px]">undo</span>
                  <span>Vinda de ${store.formatShortMonthYear(exp.movedFromMonthKey)}</span>
                </span>
              ` : ''}
              ${exp.isBalanceReconciliation ? `
                <span class="px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-[#ffb783] text-[10px] font-bold shrink-0 flex items-center gap-1 border border-primary/25" title="Ajuste automático de conciliação de saldo">
                  <span class="material-symbols-outlined text-[12px]">tune</span>
                  <span>Ajuste automático</span>
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    const allIncomes = store.getIncomesByMonth(monthKey);
    const filteredIncomes = allIncomes.filter(i => {
      const matchesSearch = !searchQuery || (i.name && i.name.toLowerCase().includes(searchQuery)) || (i.payer && i.payer.toLowerCase().includes(searchQuery));
      const matchesCategory = categoryFilter === 'all' || i.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesPerson = personFilter === 'all' || i.payer === personFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
    });

    if (filteredIncomes.length === 0) {
      return `
        <div class="py-10 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
          <span class="material-symbols-outlined text-3xl text-outline mb-1">payments</span>
          <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhuma receita encontrada</h4>
          <p class="text-[11px] text-on-surface-variant mt-0.5 mb-3">Toque no botão abaixo para cadastrar receitas.</p>
          <button onclick="window.openIncomeModal('${monthKey}')" class="px-4 py-2 bg-[#309b57] dark:bg-[#124d27] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:opacity-95 active:scale-95 transition-all">
            + Adicionar Receita
          </button>
        </div>
      `;
    }

    return filteredIncomes.map(inc => {
      const cat = store.getCategoryById(inc.categoryId);
      const styles = store.getCategoryCardStyles(cat);
      const isReceived = inc.status === 'received';

      return `
        <div class="category-tinted-card rounded-2xl p-4 border transition-all shadow-sm group relative" 
             style="--card-bg: ${styles.cardBgLight}; --card-border: ${styles.cardBorderLight}; --card-bg-dark: ${styles.cardBgDark}; --card-border-dark: ${styles.cardBorderDark};">
          
          <div class="flex justify-between items-center gap-2">
            <div class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
              <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
              </div>
              <h4 class="font-bold text-sm text-on-surface truncate">
                ${inc.name}
              </h4>
            </div>

            <button type="button" 
                    onclick="event.stopPropagation(); window.openStatusPickerModal({ id: '${inc.id}', type: 'income', currentStatus: '${inc.status}' })" 
                    class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${isReceived ? 'bg-[#dcfce7] dark:bg-[#0f2e1b] text-[#15803d] dark:text-[#86efac] border border-[#86efac] dark:border-[#166534]' : 'bg-[#e0f2fe] dark:bg-[#0c2438] text-[#0284c7] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985]'}"
                    title="Alterar situação">
              <span class="material-symbols-outlined text-[15px]">${isReceived ? 'check_circle' : 'schedule'}</span>
              <span>${isReceived ? 'Recebida' : 'Prevista'}</span>
            </button>
          </div>

          <div class="my-2 cursor-pointer" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
            <span class="font-price-display text-lg sm:text-xl font-extrabold text-secondary dark:text-[#7bf8a1] block leading-none">
              ${fmtCurrency(inc.amount, hideBalances)}
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs cursor-pointer" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
            <div class="flex items-center text-[11px] font-bold text-on-surface-variant dark:text-[#d7c3b5] truncate">
              <span class="truncate">${cat.name}</span>
            </div>

            <div class="flex items-center gap-1 font-bold text-on-surface text-xs justify-end sm:justify-center">
              <span class="material-symbols-outlined text-[15px]" style="color: ${cat.textColor}">event</span>
              <span>${inc.expectedDate ? inc.expectedDate.split('-').reverse().slice(0, 2).join('/') : 'Sem data'}</span>
            </div>

            <div class="col-span-2 sm:col-span-1 flex items-center gap-1.5 justify-between sm:justify-end text-[11px] text-on-surface-variant font-medium">
              <span class="truncate">${inc.payer ? inc.payer : '—'}</span>
              ${inc.isBalanceCarriedOver ? `
                <span class="px-1.5 py-0.5 rounded-lg bg-secondary-fixed text-secondary text-[10px] font-bold shrink-0">
                  Saldo Trazido
                </span>
              ` : ''}
              ${inc.isRecurring ? `
                <span class="px-1.5 py-0.5 rounded-lg bg-secondary/15 text-secondary text-[10px] font-bold shrink-0 flex items-center gap-0.5" title="Receita Recorrente">
                  <span class="material-symbols-outlined text-[12px]">repeat</span>
                  <span>Recorrente</span>
                </span>
              ` : ''}
              ${inc.isBalanceReconciliation ? `
                <span class="px-2 py-0.5 rounded-lg bg-secondary/15 dark:bg-secondary/25 text-secondary dark:text-[#86efac] text-[10px] font-bold shrink-0 flex items-center gap-1 border border-secondary/25" title="Ajuste automático de conciliação de saldo">
                  <span class="material-symbols-outlined text-[12px]">tune</span>
                  <span>Ajuste automático</span>
                </span>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.getMonthSummaryDockHtml = function (monthKey, activeTab) {
  const store = window.financeStore;
  const summary = store.calculateMonthSummary(monthKey);
  const hideBalances = Boolean(store.state.hideBalances);
  const fmtCurrency = (val, hide) => hide ? 'R$ •••••' : Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const hasFilters = store.hasActiveFilters();
  const searchQuery = (store.state.monthSearchQuery || '').toLowerCase();
  const categoryFilter = store.state.monthFilterCategory || 'all';
  const statusFilter = store.state.monthFilterStatus || 'all';
  const personFilter = store.state.monthFilterPayeePayer || 'all';

  let visibleTotal = 0;
  if (activeTab === 'expenses') {
    const expenses = store.getExpensesByMonth(monthKey).filter(e => {
      // Exclude historical moved-out expenses from dock totals!
      if (e.isMoved || e.movedToMonthKey) return false;
      const matchesSearch = !searchQuery || (e.name && e.name.toLowerCase().includes(searchQuery)) || (e.payee && e.payee.toLowerCase().includes(searchQuery));
      const matchesCategory = categoryFilter === 'all' || e.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      const matchesPerson = personFilter === 'all' || e.payee === personFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
    });
    visibleTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  } else {
    const incomes = store.getIncomesByMonth(monthKey).filter(i => {
      const matchesSearch = !searchQuery || (i.name && i.name.toLowerCase().includes(searchQuery)) || (i.payer && i.payer.toLowerCase().includes(searchQuery));
      const matchesCategory = categoryFilter === 'all' || i.categoryId === categoryFilter;
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesPerson = personFilter === 'all' || i.payer === personFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
    });
    visibleTotal = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }

  const screenTotalLabel = hasFilters
    ? 'Total Filtrado'
    : (activeTab === 'expenses' ? 'Total de Despesas' : 'Total de Receitas');

  return `
    <div class="pointer-events-auto w-full floating-month-summary-dock rounded-[32px] py-4 sm:py-4.5 px-5 sm:px-6 flex justify-around items-center">
      
      <!-- Lado Esquerdo: DESPESAS RESTANTES (Soma de despesas pendentes) -->
      <div class="text-center flex-1 border-r border-outline-variant/30 dark:border-white/10 pr-4">
        <span class="text-[11px] sm:text-xs font-bold uppercase text-on-surface-variant dark:text-[#d7c3b5] tracking-wider block">Despesas restantes</span>
        <span class="font-price-display text-lg sm:text-xl font-black text-[#dc2626] dark:text-[#ff8a80] block mt-1 leading-tight">
          ${fmtCurrency(summary.remainingExpenses, hideBalances)}
        </span>
      </div>

      <!-- Lado Direito: Total da Tela Contextual / Filtrado -->
      <div class="text-center flex-1 pl-4">
        <span class="text-[11px] sm:text-xs font-bold uppercase text-on-surface-variant dark:text-[#d7c3b5] tracking-wider block">${screenTotalLabel}</span>
        <span class="font-price-display text-lg sm:text-xl font-black text-on-surface dark:text-[#fcf6f2] block mt-1 leading-tight">
          ${fmtCurrency(visibleTotal, hideBalances)}
        </span>
      </div>
    </div>
  `;
};

// Search Input Handler: Updates in-place without destroying input or dismissing keyboard
window.handleMonthSearchInput = function (query) {
  const store = window.financeStore;
  store.setMonthSearchQuery(query);

  const clearBtn = document.getElementById('month-search-clear-btn');
  if (clearBtn) {
    if (query && query.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  window.updateMonthViewListAndDock();
};

window.clearMonthSearch = function () {
  const input = document.getElementById('month-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  window.handleMonthSearchInput('');
};

window.updateMonthViewListAndDock = function () {
  const store = window.financeStore;
  const monthKey = store.getSelectedMonthKey();
  const activeTab = store.state.monthDetailTab || 'expenses';

  const container = document.getElementById('month-items-container');
  if (container) {
    container.innerHTML = window.getMonthItemsHtml(monthKey, activeTab);
  }

  const summaryDock = document.getElementById('month-summary-dock-container');
  if (summaryDock) {
    summaryDock.innerHTML = window.getMonthSummaryDockHtml(monthKey, activeTab);
  }

  const activeFiltersBar = document.getElementById('month-active-filters-bar');
  if (activeFiltersBar) {
    if (store.hasActiveFilters()) {
      activeFiltersBar.classList.remove('hidden');
    } else {
      activeFiltersBar.classList.add('hidden');
    }
  }
};
