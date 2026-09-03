/**
 * Smart Finances - Categories Management View
 * Manage expense and income categories with color accents and Material icons.
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
          <button onclick="window.financeStore.setActiveTab('settings')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all cursor-pointer" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Categorias</h1>
        </div>

        <button onclick="window.openCategoryEditModal(null, 'expense')" 
                class="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
          <span class="material-symbols-outlined text-[16px]">add</span>
          <span>Nova Categoria</span>
        </button>
      </header>

      <!-- Main Canvas -->
      <main class="px-5 py-2 space-y-6">
        <!-- Categorias de Despesas -->
        <section class="space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-label-caps text-label-caps text-primary uppercase font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">trending_down</span>
              Categorias de Despesas (${expenseCategories.length})
            </h2>
            <button onclick="window.openCategoryEditModal(null, 'expense')" class="text-xs font-bold text-primary flex items-center gap-0.5 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span> Adicionar
            </button>
          </div>

          <div class="space-y-2">
            ${expenseCategories.map(cat => `
              <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex justify-between items-center shadow-sm group hover:border-primary/40 transition-colors">
                <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="window.openCategoryEditModal('${cat.id}', 'expense')">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                    <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-xs text-on-surface truncate">${cat.name}</h4>
                    <span class="text-[10px] text-on-surface-variant font-medium">Despesa ${cat.id === 'outras_despesas' ? '• Padrão' : ''}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button onclick="window.openCategoryEditModal('${cat.id}', 'expense')" 
                          class="p-2 text-outline hover:text-primary rounded-lg transition-colors cursor-pointer" title="Editar">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  ${cat.id !== 'outras_despesas' ? `
                    <button onclick="window.handleDeleteCategoryAction('${cat.id}')" 
                            class="p-2 text-outline hover:text-error rounded-lg transition-colors cursor-pointer" title="Excluir">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  ` : ''}
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
              Categorias de Receitas (${incomeCategories.length})
            </h2>
            <button onclick="window.openCategoryEditModal(null, 'income')" class="text-xs font-bold text-secondary flex items-center gap-0.5 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add</span> Adicionar
            </button>
          </div>

          <div class="space-y-2">
            ${incomeCategories.map(cat => `
              <div class="p-3 bg-surface-container rounded-2xl border border-outline-variant/30 flex justify-between items-center shadow-sm group hover:border-secondary/40 transition-colors">
                <div class="flex items-center gap-3 min-w-0 cursor-pointer flex-1" onclick="window.openCategoryEditModal('${cat.id}', 'income')">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0" style="background-color: ${cat.bgColor}; color: ${cat.textColor}">
                    <span class="material-symbols-outlined text-[20px]">${cat.icon}</span>
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-xs text-on-surface truncate">${cat.name}</h4>
                    <span class="text-[10px] text-on-surface-variant font-medium">Receita ${cat.id === 'outras_receitas' ? '• Padrão' : ''}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <button onclick="window.openCategoryEditModal('${cat.id}', 'income')" 
                          class="p-2 text-outline hover:text-secondary rounded-lg transition-colors cursor-pointer" title="Editar">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  ${cat.id !== 'outras_receitas' ? `
                    <button onclick="window.handleDeleteCategoryAction('${cat.id}')" 
                            class="p-2 text-outline hover:text-error rounded-lg transition-colors cursor-pointer" title="Excluir">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </main>
    </div>
  `;
};
