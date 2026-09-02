/**
 * Smart Finances - Reports & Analytics View
 * Monthly balance evolution, expense & income breakdown by category,
 * and future installment timeline.
 */

window.renderReportsView = function () {
  const store = window.financeStore;
  const allMonths = store.getAllMonthsList().sort((a, b) => a.key.localeCompare(b.key));
  const currentKey = store.getCurrentMonthKey();

  const fmt = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calculate annual metrics
  const monthsMetrics = allMonths.map(m => {
    const summary = store.calculateMonthSummary(m.key);
    return {
      key: m.key,
      name: m.name,
      plannedExpenses: summary.plannedExpenses,
      paidExpenses: summary.paidExpenses,
      plannedIncomes: summary.plannedIncomes,
      receivedIncomes: summary.receivedIncomes,
      forecastBalance: summary.forecastBalance,
      actualBalance: summary.actualBalance,
      isCurrent: m.key === currentKey
    };
  });

  const totalForecastAnnual = monthsMetrics.reduce((sum, m) => sum + m.forecastBalance, 0);
  const totalPaidExpenses = monthsMetrics.reduce((sum, m) => sum + m.paidExpenses, 0);
  const totalReceivedIncomes = monthsMetrics.reduce((sum, m) => sum + m.receivedIncomes, 0);

  // Category breakdown for expenses
  const expensesByCategory = {};
  (store.state.expenses || []).forEach(e => {
    const catId = e.categoryId || 'outras_despesas';
    if (!expensesByCategory[catId]) {
      expensesByCategory[catId] = {
        category: store.getCategoryById(catId),
        total: 0,
        count: 0
      };
    }
    expensesByCategory[catId].total += (Number(e.plannedAmount) || 0);
    expensesByCategory[catId].count++;
  });

  const sortedExpenseCategories = Object.values(expensesByCategory).sort((a, b) => b.total - a.total);
  const totalCategoryExpenses = sortedExpenseCategories.reduce((s, c) => s + c.total, 0) || 1;

  // Active Installments
  const activePlans = store.state.installmentPlans || [];

  return `
    <div class="pb-36">
      <!-- TopAppBar -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Relatórios Financeiros</h1>
        </div>
      </header>

      <!-- Main Canvas -->
      <main class="px-5 py-2 space-y-6">
        <!-- Resumo Geral -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40">
            <span class="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider block mb-1">Total Recebido</span>
            <span class="text-lg font-extrabold text-secondary block">${fmt(totalReceivedIncomes)}</span>
            <span class="text-[10px] text-on-surface-variant mt-0.5 block">${monthsMetrics.length} meses registrados</span>
          </div>

          <div class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40">
            <span class="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider block mb-1">Total Pago</span>
            <span class="text-lg font-extrabold text-error block">${fmt(totalPaidExpenses)}</span>
            <span class="text-[10px] text-on-surface-variant mt-0.5 block">Despesas realizadas</span>
          </div>
        </div>

        <!-- Evolução Mensal do Balanço -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-headline-md text-sm font-bold text-on-surface">Evolução Mensal do Balanço</h2>
            <span class="text-xs font-bold text-primary">${monthsMetrics.length} meses</span>
          </div>

          <div class="space-y-2 pt-1">
            ${monthsMetrics.map(m => {
              const isPos = m.forecastBalance >= 0;
              return `
                <div onclick="window.financeStore.openMonthDetail('${m.key}')" 
                     class="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-variant cursor-pointer transition-colors border border-outline-variant/20">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${m.isCurrent ? 'bg-primary' : 'bg-outline'}"></span>
                    <span class="text-xs font-bold text-on-surface">${m.name}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-price-display text-xs font-extrabold ${isPos ? 'text-secondary' : 'text-error'}">
                      ${fmt(m.forecastBalance)}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Distribuição por Categoria (Despesas) -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 space-y-3">
          <h2 class="font-headline-md text-sm font-bold text-on-surface">Despesas por Categoria</h2>
          
          <div class="space-y-3 pt-1">
            ${sortedExpenseCategories.length > 0 ? sortedExpenseCategories.map(item => {
              const pct = Math.round((item.total / totalCategoryExpenses) * 100);
              return `
                <div class="space-y-1">
                  <div class="flex justify-between items-center text-xs">
                    <div class="flex items-center gap-1.5 font-semibold text-on-surface">
                      <span class="material-symbols-outlined text-[16px]" style="color: ${item.category.textColor}">${item.category.icon}</span>
                      <span>${item.category.name}</span>
                    </div>
                    <span class="font-bold text-on-surface">${fmt(item.total)} <span class="text-[10px] text-on-surface-variant font-normal">(${pct}%)</span></span>
                  </div>
                  <div class="w-full bg-surface-variant rounded-full h-2 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${item.category.textColor}"></div>
                  </div>
                </div>
              `;
            }).join('') : `
              <p class="text-xs text-on-surface-variant text-center py-4">Nenhuma despesa cadastrada ainda.</p>
            `}
          </div>
        </section>

        <!-- Parcelamentos Ativos -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-headline-md text-sm font-bold text-on-surface">Compras Parceladas Ativas</h2>
            <span class="text-xs font-bold text-primary">${activePlans.length}</span>
          </div>

          <div class="space-y-2 pt-1">
            ${activePlans.length > 0 ? activePlans.map(plan => `
              <div class="p-3 bg-surface rounded-xl border border-outline-variant/30 flex justify-between items-center">
                <div>
                  <h4 class="font-bold text-xs text-on-surface">${plan.description}</h4>
                  <span class="text-[11px] text-on-surface-variant">${plan.totalInstallments}x de ${fmt(plan.installmentAmount)} • Início: ${plan.startMonthKey}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-xs text-primary block">${fmt(plan.totalAmount)}</span>
                </div>
              </div>
            `).join('') : `
              <p class="text-xs text-on-surface-variant text-center py-4">Nenhum parcelamento ativo no momento.</p>
            `}
          </div>
        </section>
      </main>
    </div>
  `;
};
