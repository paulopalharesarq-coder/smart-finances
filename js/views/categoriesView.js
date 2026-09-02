/**
 * Smart Finances - Categories & Payees View
 * Manage expense and income categories with Lumina color accents.
 */

window.renderCategoriesView = function () {
  const store = window.financeStore;
  const expenseCategories = store.getCategories('expense');
  const incomeCategories = store.getCategories('income');

  return `
    <div class="pb-36">
      <!-- TopAppBar -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Categorias</h1>
        </div>
      </header>

      <!-- Main Canvas -->
      <main class="px-5 py-2 space-y-6">
        <!-- Categorias de Despesas -->
        <section class="space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-label-caps text-label-caps text-primary uppercase font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">trending_down</span>
              Categorias de Despesas
            </h2>
          </div>

          <div class="space-y-2">
            ${expenseCategories.map(cat => `
              <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex justify-between items-center shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                    <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-xs text-on-surface">${cat.name}</h4>
                    <span class="text-[10px] text-on-surface-variant">Despesa</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Categorias de Receitas -->
        <section class="space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-label-caps text-label-caps text-secondary uppercase font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">trending_up</span>
              Categorias de Receitas
            </h2>
          </div>

          <div class="space-y-2">
            ${incomeCategories.map(cat => `
              <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex justify-between items-center shadow-sm">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                    <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-xs text-on-surface">${cat.name}</h4>
                    <span class="text-[10px] text-on-surface-variant">Receita</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </main>
    </div>
  `;
};
