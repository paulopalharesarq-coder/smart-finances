/**
 * Lumina Lifestyle - History & Analytics View
 * Monthly spending comparison, category breakdowns and price trend insights.
 */

window.renderHistoryView = function () {
  const store = window.shoppingStore;
  const lists = [...(store.state.lists || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const budget = Number(store.state.monthlyBudget) || 0;

  // Calculate monthly stats
  const monthlyStats = lists.map(l => {
    const totals = store.calculateListTotals(l);
    return {
      id: l.id,
      title: l.title,
      subtitle: l.subtitle || l.title,
      total: l.totalSpent || totals.currentTotal,
      itemsCount: l.itemsCount || totals.totalItems,
      status: l.status,
      notes: l.notes
    };
  });

  const maxMonthTotal = Math.max(...monthlyStats.map(m => m.total), budget, 100);
  const totalYearSpent = monthlyStats.reduce((sum, m) => sum + m.total, 0);
  const avgMonthlySpent = monthlyStats.length > 0 ? (totalYearSpent / monthlyStats.length) : 0;

  // Render monthly comparison chart bars
  const chartBarsHtml = monthlyStats.length > 0 ? monthlyStats.map(m => {
    const heightPercent = Math.min(100, Math.round((m.total / maxMonthTotal) * 100));
    const isCurrent = m.status === 'in_progress';
    const isOverBudget = budget > 0 && m.total > budget;

    return `
      <div onclick="window.shoppingStore.setActiveList('${m.id}'); window.shoppingStore.setActiveTab('cart');" 
           class="flex flex-col items-center flex-1 cursor-pointer group">
        <div class="text-[10px] font-bold ${isOverBudget ? 'text-error' : 'text-on-surface'} mb-1 group-hover:scale-110 transition-transform">
          R$ ${Math.round(m.total)}
        </div>
        <div class="w-full max-w-[40px] bg-surface-container rounded-t-xl h-36 flex items-end justify-center p-1 relative overflow-hidden border border-outline-variant/30">
          <div class="w-full rounded-t-lg transition-all duration-500 ${isCurrent ? 'bg-primary' : isOverBudget ? 'bg-error' : 'bg-primary-container'}" 
               style="height: ${heightPercent}%"></div>
        </div>
        <span class="text-[10px] font-bold text-on-surface-variant mt-2 text-center truncate max-w-[50px]">${m.subtitle.split(' ')[0]}</span>
      </div>
    `;
  }).join('') : `
    <div class="w-full text-center py-8 text-xs text-on-surface-variant">
      Nenhum histórico de compras registrado ainda.
    </div>
  `;

  return `
    <div class="pb-28">
      <!-- TopAppBar (Solid, Opaque & Seamless) -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.shoppingStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Histórico & Análises</h1>
        </div>

        <button onclick="window.openNewListModal()" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-primary" title="Nova Lista">
          <span class="material-symbols-outlined text-[24px]">add_circle</span>
        </button>
      </header>

      <main class="px-5 py-2 space-y-6">
        <!-- Overview Metrics Cards -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40">
            <span class="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider block mb-1">Média Mensal</span>
            <span class="text-xl font-bold text-on-surface block">${avgMonthlySpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span class="text-[11px] text-secondary font-semibold mt-0.5 block flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              ${monthlyStats.length} ${monthlyStats.length === 1 ? 'mês registrado' : 'meses registrados'}
            </span>
          </div>

          <div class="bg-primary-fixed rounded-2xl p-4 border border-primary-fixed-dim/50">
            <span class="text-[11px] font-bold uppercase text-primary tracking-wider block mb-1">Meta Orçamentária</span>
            <span class="text-xl font-bold text-on-surface block">${budget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            <span class="text-[11px] text-primary font-semibold mt-0.5 block">${budget > 0 ? 'por mês' : 'não definido'}</span>
          </div>
        </div>

        <!-- Monthly Comparison Chart Card -->
        <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/40 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="font-headline-md text-sm font-bold text-on-surface">Evolução Mensal de Gastos</h2>
              <span class="text-xs text-on-surface-variant">${monthlyStats.length > 0 ? 'Toque em uma barra para abrir os itens' : 'Crie listas para acompanhar seus gastos'}</span>
            </div>
            ${monthlyStats.length > 0 ? `
              <div class="flex items-center gap-2 text-[11px]">
                <span class="inline-flex items-center gap-1 font-semibold text-primary">
                  <span class="w-2 h-2 rounded-full bg-primary"></span> Atual
                </span>
                <span class="inline-flex items-center gap-1 font-semibold text-outline">
                  <span class="w-2 h-2 rounded-full bg-primary-container"></span> Passados
                </span>
              </div>
            ` : ''}
          </div>

          <div class="flex items-end justify-between gap-2 pt-4 pb-2 border-b border-outline-variant/30">
            ${chartBarsHtml}
          </div>

          <div class="flex justify-between items-center mt-3 text-xs text-on-surface-variant">
            <span>Total acumulado no período:</span>
            <strong class="text-on-surface font-bold">${totalYearSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
        </div>

        <!-- Past Lists Detailed Breakdown -->
        <section class="space-y-3">
          <h2 class="font-label-caps text-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">folder</span>
            Detalhamento por Período
          </h2>
          
          <div class="space-y-2.5">
            ${monthlyStats.length > 0 ? monthlyStats.map(m => `
              <div class="bg-surface-container rounded-xl p-3.5 flex justify-between items-center border border-outline-variant/30 hover:bg-surface-variant transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl ${m.status === 'in_progress' ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center font-bold">
                    <span class="material-symbols-outlined text-[20px]">${m.status === 'in_progress' ? 'timelapse' : 'check'}</span>
                  </div>
                  <div>
                    <h3 class="font-body-lg text-sm font-bold text-on-surface">${m.title}</h3>
                    <p class="text-xs text-on-surface-variant">${m.itemsCount} itens ${m.status === 'in_progress' ? '• Em aberto' : '• Finalizada'}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="font-price-display text-sm font-bold text-on-surface">${m.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  <button onclick="window.shoppingStore.setActiveList('${m.id}'); window.shoppingStore.setActiveTab('cart');" 
                          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 text-primary" title="Abrir">
                    <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="text-center py-6 bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
                <span class="material-symbols-outlined text-3xl text-outline mb-1">history</span>
                <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhuma lista registrada</h4>
                <p class="text-[11px] text-on-surface-variant mt-0.5">As compras criadas e finalizadas aparecerão aqui no histórico.</p>
              </div>
            `}
          </div>
        </section>
      </main>
    </div>
  `;
};
