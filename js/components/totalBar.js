/**
 * Lumina Lifestyle - Floating Total Bar & FAB Component
 * Fixed bottom bar with real-time calculations and attached FAB button.
 */

window.renderTotalBar = function (list, showPreviousPrices) {
  const totals = window.shoppingStore.calculateListTotals(list);
  const isPrevious = showPreviousPrices;
  
  const displayTotal = isPrevious ? totals.previousTotal : totals.currentTotal;
  const formattedTotal = displayTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const diff = totals.currentTotal - totals.previousTotal;
  let diffBadge = '';
  if (isPrevious && diff !== 0) {
    const isUp = diff > 0;
    const diffFormatted = Math.abs(diff).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    diffBadge = `
      <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isUp ? 'price-up' : 'price-down'}">
        <span class="material-symbols-outlined text-[13px]">${isUp ? 'trending_up' : 'trending_down'}</span>
        ${isUp ? '+' : '-'}${diffFormatted} vs anterior
      </span>
    `;
  }

  return `
    <div class="fixed bottom-0 left-0 right-0 w-full z-40 max-w-[540px] mx-auto px-4 pb-[max(1rem,calc(0.75rem+env(safe-area-inset-bottom,0px)))] pointer-events-none flex flex-col items-end gap-3 bg-transparent">
      <!-- Floating Action Button (Fixo permanentemente acima do card de total) -->
      <button onclick="window.openItemModal('${list.id}')" 
              class="pointer-events-auto w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-[0px_8px_20px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer mr-1" 
              title="Adicionar Item">
        <span class="material-symbols-outlined text-[30px] font-bold">add</span>
      </button>

      <!-- Total Previsto Card -->
      <div class="w-full glass-total-bar rounded-2xl p-3.5 flex items-center justify-between pointer-events-auto shadow-[0px_-5px_25px_rgba(0,0,0,0.08)]">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer" onclick="window.openCheckoutSummaryModal('${list.id}')" title="Ver Resumo">
            <span class="material-symbols-outlined text-[24px]">shopping_bag</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-body-lg text-on-surface font-semibold text-sm">
                ${isPrevious ? 'Estimativa Anterior' : 'Total Previsto'}
              </span>
              ${diffBadge}
            </div>
            <div class="text-xs text-on-surface-variant mt-0.5">
              <span>${totals.totalItems} ${totals.totalItems === 1 ? 'item' : 'itens'} no carrinho</span>
            </div>
          </div>
        </div>
        
        <div class="text-right">
          <div class="font-price-display text-lg text-on-surface font-bold">
            ${formattedTotal}
          </div>
          <button onclick="window.openCheckoutSummaryModal('${list.id}')" class="text-[11px] font-semibold text-primary hover:underline flex items-center justify-end gap-0.5 mt-0.5">
            Ver detalhes
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `;
};
