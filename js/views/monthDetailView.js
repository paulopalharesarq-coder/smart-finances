/**
 * Smart Finances - Month Detail View (Enhanced Visual & Functional Refinement)
 * Features category-colored card backgrounds, status buttons (no checkboxes),
 * fixed metadata positioning, boosted date contrast, balanced amount size,
 * and contextual floating summary card showing Previsão de Fechamento and Total da Tela.
 */

window.renderMonthDetailView = function () {
  const store = window.financeStore;
  const monthKey = store.getSelectedMonthKey();
  const summary = store.calculateMonthSummary(monthKey);
  const activeTab = store.state.monthDetailTab || 'expenses';
  const searchQuery = (store.state.monthSearchQuery || '').toLowerCase();
  const categoryFilter = store.state.monthFilterCategory || 'all';
  const statusFilter = store.state.monthFilterStatus || 'all';
  const personFilter = store.state.monthFilterPayeePayer || 'all';
  const hideBalances = Boolean(store.state.hideBalances);

  const fmt = (val) => {
    if (hideBalances) return '••••••';
    const num = Number(val || 0);
    const prefix = num < 0 ? '-R$ ' : 'R$ ';
    const formattedNum = Math.abs(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${formattedNum}`;
  };

  // Filter expenses
  const allExpenses = store.getExpensesByMonth(monthKey);
  const filteredExpenses = allExpenses.filter(e => {
    const matchesSearch = !searchQuery || (e.name && e.name.toLowerCase().includes(searchQuery)) || (e.payee && e.payee.toLowerCase().includes(searchQuery));
    const matchesCategory = categoryFilter === 'all' || e.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesPerson = personFilter === 'all' || e.payee === personFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
  });

  // Filter incomes
  const allIncomes = store.getIncomesByMonth(monthKey);
  const filteredIncomes = allIncomes.filter(i => {
    const matchesSearch = !searchQuery || (i.name && i.name.toLowerCase().includes(searchQuery)) || (i.payer && i.payer.toLowerCase().includes(searchQuery));
    const matchesCategory = categoryFilter === 'all' || i.categoryId === categoryFilter;
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesPerson = personFilter === 'all' || i.payer === personFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesPerson;
  });

  const hasFilters = store.hasActiveFilters();

  // Screen Contextual Total (Item #6)
  const screenTotal = activeTab === 'expenses'
    ? filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : filteredIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const screenTotalLabel = hasFilters
    ? (activeTab === 'expenses' ? 'Total Filtrado' : 'Total Filtrado')
    : (activeTab === 'expenses' ? 'Total de Despesas' : 'Total de Receitas');

  // Render Category-Colored Expense Cards with Fixed Metadata Alignment
  const expensesListHtml = filteredExpenses.length > 0 ? filteredExpenses.map(exp => {
    const cat = store.getCategoryById(exp.categoryId);
    const styles = store.getCategoryCardStyles(cat);
    const isPaid = exp.status === 'paid';
    const isOverdue = exp.status === 'overdue' || (exp.dueDate && exp.dueDate < new Date().toISOString().slice(0, 10) && !isPaid);

    return `
      <div class="category-tinted-card rounded-2xl p-4 border transition-all shadow-sm group relative" 
           style="--card-bg: ${styles.cardBgLight}; --card-border: ${styles.cardBorderLight}; --card-bg-dark: ${styles.cardBgDark}; --card-border-dark: ${styles.cardBorderDark};">
        
        <!-- Top Line: Nome à esquerda e Botão de Status à direita (Item #2 & #3) -->
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
              <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
            </div>
            <h4 class="font-bold text-sm text-on-surface truncate ${isPaid ? 'line-through opacity-70' : ''}">
              ${exp.name}
            </h4>
          </div>

          <!-- Botão de Status (Pago / Pendente) -->
          <button type="button" 
                  onclick="event.stopPropagation(); window.openStatusPickerModal({ id: '${exp.id}', type: 'expense', currentStatus: '${exp.status}' })" 
                  class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${isPaid ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-[#dc2626]/15 text-[#dc2626] border border-[#dc2626]/30'}"
                  title="Alterar situação">
            <span class="material-symbols-outlined text-[15px]">${isPaid ? 'check_circle' : 'schedule'}</span>
            <span>${isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}</span>
          </button>
        </div>

        <!-- Middle Line: Valor com Destaque Equilibrado (Item #5) -->
        <div class="my-2 cursor-pointer" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
          <span class="font-price-display text-lg sm:text-xl font-extrabold ${isPaid ? 'text-secondary' : isOverdue ? 'text-error' : 'text-[#dc2626] dark:text-[#ffb4ab]'} block leading-none">
            ${fmt(exp.amount)}
          </span>
        </div>

        <!-- Bottom Line: Posições FIXAS de Metadados e Data Destacada (Item #3 & #4) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-xs cursor-pointer" onclick="window.openExpenseModal('${monthKey}', '${exp.id}')">
          <!-- 1. Categoria -->
          <div class="flex items-center gap-1 text-[11px] font-bold truncate" style="color: ${cat.textColor}">
            <span class="material-symbols-outlined text-[14px]">${cat.icon}</span>
            <span class="truncate">${cat.name}</span>
          </div>

          <!-- 2. Data de Vencimento com Destaque (Item #4) -->
          <div class="flex items-center gap-1 font-bold text-on-surface text-xs justify-end sm:justify-center">
            <span class="material-symbols-outlined text-[15px] text-primary">event</span>
            <span>${exp.dueDate ? exp.dueDate.split('-').reverse().slice(0, 2).join('/') : 'Sem data'}</span>
          </div>

          <!-- 3. Recebedor e Badges Auxiliares -->
          <div class="col-span-2 sm:col-span-1 flex items-center gap-1.5 justify-between sm:justify-end text-[11px] text-on-surface-variant font-medium">
            <span class="truncate">${exp.payee ? exp.payee : '—'}</span>
            ${exp.isInstallment ? `
              <span class="px-1.5 py-0.2 rounded-md bg-primary-fixed text-primary text-[10px] font-black shrink-0">
                ${exp.installmentNumber}/${exp.totalInstallments}
              </span>
            ` : ''}
            ${exp.carriedFromMonthKey ? `
              <span class="px-1.5 py-0.2 rounded-md bg-tertiary-fixed text-tertiary text-[10px] font-bold shrink-0">
                Pendente
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="py-10 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
      <span class="material-symbols-outlined text-3xl text-outline mb-1">receipt_long</span>
      <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhuma despesa encontrada</h4>
      <p class="text-[11px] text-on-surface-variant mt-0.5 mb-3">Toque no botão abaixo para cadastrar despesas.</p>
      <button onclick="window.openExpenseModal('${monthKey}')" class="px-4 py-2 bg-[#dc2626] text-white rounded-xl text-xs font-bold shadow-sm">
        + Adicionar Despesa
      </button>
    </div>
  `;

  // Render Category-Colored Income Cards with Fixed Metadata Alignment
  const incomesListHtml = filteredIncomes.length > 0 ? filteredIncomes.map(inc => {
    const cat = store.getCategoryById(inc.categoryId);
    const styles = store.getCategoryCardStyles(cat);
    const isReceived = inc.status === 'received';

    return `
      <div class="category-tinted-card rounded-2xl p-4 border transition-all shadow-sm group relative" 
           style="--card-bg: ${styles.cardBgLight}; --card-border: ${styles.cardBorderLight}; --card-bg-dark: ${styles.cardBgDark}; --card-border-dark: ${styles.cardBorderDark};">
        
        <!-- Top Line: Nome à esquerda e Botão de Status à direita (Item #2 & #3) -->
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
              <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
            </div>
            <h4 class="font-bold text-sm text-on-surface truncate">
              ${inc.name}
            </h4>
          </div>

          <!-- Botão de Status (Recebida / Prevista) -->
          <button type="button" 
                  onclick="event.stopPropagation(); window.openStatusPickerModal({ id: '${inc.id}', type: 'income', currentStatus: '${inc.status}' })" 
                  class="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer ${isReceived ? 'bg-secondary/15 text-secondary border border-secondary/30' : 'bg-primary/15 text-primary border border-primary/30'}"
                  title="Alterar situação">
            <span class="material-symbols-outlined text-[15px]">${isReceived ? 'check_circle' : 'schedule'}</span>
            <span>${isReceived ? 'Recebida' : 'Prevista'}</span>
          </button>
        </div>

        <!-- Middle Line: Valor com Destaque Equilibrado (Item #5) -->
        <div class="my-2 cursor-pointer" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
          <span class="font-price-display text-lg sm:text-xl font-extrabold text-secondary block leading-none">
            ${fmt(inc.amount)}
          </span>
        </div>

        <!-- Bottom Line: Posições FIXAS de Metadados e Data Destacada (Item #3 & #4) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-xs cursor-pointer" onclick="window.openIncomeModal('${monthKey}', '${inc.id}')">
          <!-- 1. Categoria -->
          <div class="flex items-center gap-1 text-[11px] font-bold truncate" style="color: ${cat.textColor}">
            <span class="material-symbols-outlined text-[14px]">${cat.icon}</span>
            <span class="truncate">${cat.name}</span>
          </div>

          <!-- 2. Data com Destaque (Item #4) -->
          <div class="flex items-center gap-1 font-bold text-on-surface text-xs justify-end sm:justify-center">
            <span class="material-symbols-outlined text-[15px] text-secondary">event</span>
            <span>${inc.expectedDate ? inc.expectedDate.split('-').reverse().slice(0, 2).join('/') : 'Sem data'}</span>
          </div>

          <!-- 3. Pagador e Badges Auxiliares -->
          <div class="col-span-2 sm:col-span-1 flex items-center gap-1.5 justify-between sm:justify-end text-[11px] text-on-surface-variant font-medium">
            <span class="truncate">${inc.payer ? inc.payer : '—'}</span>
            ${inc.isBalanceCarriedOver ? `
              <span class="px-1.5 py-0.2 rounded-md bg-secondary-fixed text-secondary text-[10px] font-bold shrink-0">
                Saldo Trazido
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="py-10 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
      <span class="material-symbols-outlined text-3xl text-outline mb-1">payments</span>
      <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhuma receita encontrada</h4>
      <p class="text-[11px] text-on-surface-variant mt-0.5 mb-3">Toque no botão abaixo para cadastrar receitas.</p>
      <button onclick="window.openIncomeModal('${monthKey}')" class="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow-sm">
        + Adicionar Receita
      </button>
    </div>
  `;

  return `
    <div class="pb-36">
      <!-- TopAppBar com Botão Voltar para a Home -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar ao início">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 class="font-headline-xl-mobile text-lg font-bold text-on-surface leading-tight">${summary.monthName}</h1>
            <span class="text-on-surface-variant text-xs font-medium">${summary.monthStatus === 'closed' ? 'Mês Fechado' : 'Mês Aberto'}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button onclick="window.openMonthCloseModal('${monthKey}')" class="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-xs flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-sm" title="Fechar Mês">
            <span class="material-symbols-outlined text-[16px]">lock</span>
            <span>Fechamento</span>
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="px-5 pt-2 space-y-4">
        
        <!-- Abas Principais: [ Despesas (Vermelho) ] e [ Receitas (Verde) ] -->
        <div class="flex gap-2 p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
          <!-- Aba Despesas: Destaque em VERMELHO -->
          <button onclick="window.financeStore.setMonthDetailTab('expenses')" 
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'expenses' ? 'bg-[#dc2626] text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'}">
            <span class="material-symbols-outlined text-[18px]">trending_down</span>
            <span>Despesas (${allExpenses.length})</span>
          </button>

          <!-- Aba Receitas: Destaque em VERDE -->
          <button onclick="window.financeStore.setMonthDetailTab('incomes')" 
                  class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'incomes' ? 'bg-secondary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'}">
            <span class="material-symbols-outlined text-[18px]">trending_up</span>
            <span>Receitas (${allIncomes.length})</span>
          </button>
        </div>

        <!-- Barra de Busca & Botão de Filtros -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">search</span>
            <input type="text" 
                   value="${store.state.monthSearchQuery || ''}" 
                   oninput="window.financeStore.setMonthSearchQuery(this.value)" 
                   placeholder="Buscar lançamentos..." 
                   class="w-full pl-10 pr-9 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface placeholder:text-outline">
            ${store.state.monthSearchQuery ? `
              <button onclick="window.financeStore.setMonthSearchQuery('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            ` : ''}
          </div>

          <!-- Botão de Filtros -->
          <button onclick="window.openMonthFiltersModal('${activeTab === 'expenses' ? 'expense' : 'income'}')" 
                  class="px-3.5 py-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all ${hasFilters ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container hover:bg-surface-variant text-on-surface border-outline-variant/40'}">
            <span class="material-symbols-outlined text-[18px]">tune</span>
            <span>Filtros</span>
          </button>
        </div>

        <!-- Barra de Filtros Ativos (se houver) -->
        ${hasFilters ? `
          <div class="flex items-center justify-between bg-surface-container p-2 rounded-xl border border-outline-variant/30 text-xs">
            <span class="text-primary font-bold">Filtros ativos aplicados</span>
            <button onclick="window.financeStore.clearMonthFilters()" class="text-error text-[11px] font-bold flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[14px]">close</span>
              Limpar filtros
            </button>
          </div>
        ` : ''}

        <!-- Lista de Lançamentos com Cores de Categoria -->
        <div class="space-y-3 pt-1">
          ${activeTab === 'expenses' ? expensesListHtml : incomesListHtml}
        </div>
      </main>

      <!-- FAB Botão Adicionar (Posicionado com folga acima do Card Flutuante de Resumo) -->
      <div class="fixed bottom-28 right-6 z-40 max-w-[540px]">
        <button onclick="${activeTab === 'expenses' ? `window.openExpenseModal('${monthKey}')` : `window.openIncomeModal('${monthKey}')`}" 
                class="w-14 h-14 ${activeTab === 'expenses' ? 'bg-[#dc2626]' : 'bg-secondary'} text-white rounded-full shadow-[0px_8px_24px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer" 
                title="${activeTab === 'expenses' ? 'Nova Despesa' : 'Nova Receita'}">
          <span class="material-symbols-outlined text-[30px] font-bold">add</span>
        </button>
      </div>

      <!-- Card Flutuante Inferior de Resumo: Previsão de Fechamento + Total da Tela (Item #6 & #11) -->
      <div class="fixed bottom-4 left-0 right-0 max-w-[360px] sm:max-w-[420px] mx-auto z-40 px-3 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        <div class="pointer-events-auto w-full floating-month-summary-dock rounded-[28px] py-3 px-4 flex justify-around items-center">
          
          <!-- Lado Esquerdo: Previsão de Fechamento -->
          <div class="text-center flex-1 border-r border-outline-variant/30 pr-2">
            <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Previsão Fechamento</span>
            <span class="font-price-display text-sm font-extrabold ${summary.forecastBalance < 0 ? 'text-[#dc2626] dark:text-[#ffb4ab]' : summary.forecastBalance > 0 ? 'text-secondary' : 'text-on-surface-variant'} block mt-0.5 leading-tight">
              ${fmt(summary.forecastBalance)}
            </span>
          </div>

          <!-- Lado Direito: Total da Tela / Total de Dívidas Exibidas (Item #6) -->
          <div class="text-center flex-1 pl-2">
            <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">${screenTotalLabel}</span>
            <span class="font-price-display text-sm font-extrabold text-on-surface block mt-0.5 leading-tight">
              ${fmt(screenTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
};
