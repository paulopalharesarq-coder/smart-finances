/**
 * Lumina Lifestyle - Categories & Pantry View
 * Replicates and enhances the Stitch 'gerenciar_categorias_pt' screen.
 */

window.renderCategoriesView = function () {
  const store = window.shoppingStore;
  const categories = store.state.categories;
  const pantry = store.state.pantry || [];
  const activeList = store.getActiveList();

  const categoriesListHtml = categories.map((cat, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === categories.length - 1;
    const totalItems = store.state.lists.reduce((acc, l) => acc + (l.items?.filter(i => i.categoryId === cat.id).length || 0), 0);

    return `
      <div class="category-draggable category-item-card w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border border-outline-variant/30 hover:opacity-95 shadow-sm" 
           style="--cat-bg: ${cat.bgColor}; --cat-border: ${cat.borderColor || 'transparent'}; --cat-text: ${cat.textColor}; border-color: ${cat.borderColor || 'transparent'}"
           draggable="true"
           data-cat-id="${cat.id}"
           data-index="${idx}">
        
        <!-- Drag Handle & Category Info -->
        <div class="flex items-center gap-2.5 flex-1 min-w-0">
          <div class="category-drag-handle flex items-center justify-center p-1 text-on-surface-variant/60 hover:text-on-surface cursor-grab active:cursor-grabbing shrink-0" title="Arraste para reordenar">
            <span class="material-symbols-outlined text-[20px]">drag_indicator</span>
          </div>

          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm shrink-0" style="color: ${cat.textColor}">
            <span class="material-symbols-outlined text-[22px]">${cat.icon}</span>
          </div>

          <div class="flex-1 min-w-0 pr-1">
            <h3 class="font-headline-md text-sm font-bold text-on-surface truncate">${cat.name}</h3>
            <span class="text-[11px] text-on-surface-variant">${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no total</span>
          </div>
        </div>

        <!-- Action Controls: Up/Down reorder + Edit -->
        <div class="flex items-center gap-1 shrink-0">
          <div class="flex items-center bg-surface-container-lowest/70 backdrop-blur-sm rounded-xl p-0.5 border border-outline-variant/30 mr-1">
            <button onclick="window.shoppingStore.moveCategory('${cat.id}', -1)" 
                    class="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer" 
                    ${isFirst ? 'disabled' : ''} 
                    title="Mover para cima">
              <span class="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
            <button onclick="window.shoppingStore.moveCategory('${cat.id}', 1)" 
                    class="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface disabled:opacity-20 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer" 
                    ${isLast ? 'disabled' : ''} 
                    title="Mover para baixo">
              <span class="material-symbols-outlined text-[18px]">arrow_downward</span>
            </button>
          </div>

          <button onclick="window.openCategoryModal('${cat.id}')" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant/50 text-on-surface-variant active:scale-90 transition-transform" title="Editar">
            <span class="material-symbols-outlined text-[19px]">edit</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  const pantryListHtml = pantry.length > 0 ? pantry.map(p => {
    const cat = store.getCategoryById(p.categoryId);
    return `
      <div class="flex items-center justify-between p-3 bg-surface-container rounded-xl border border-outline-variant/30 hover:bg-surface-variant transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest/80 border border-outline-variant/30" style="color: ${cat.textColor}">
            <span class="material-symbols-outlined text-[18px]">${cat.icon}</span>
          </div>
          <div>
            <h4 class="font-body-lg text-xs font-bold text-on-surface">${p.name}</h4>
            <span class="text-[11px] text-on-surface-variant">${cat.name} • ${p.defaultPrice > 0 ? `R$ ${p.defaultPrice.toFixed(2)}/${p.unit}` : p.unit}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          ${activeList ? `
            <button onclick="window.addPantryItemToList('${activeList.id}', '${p.id}')" class="px-2.5 py-1 bg-primary-container text-on-primary-container rounded-lg text-xs font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 shadow-sm">
              <span class="material-symbols-outlined text-[14px]">add_shopping_cart</span>
              Adicionar
            </button>
          ` : ''}
          <button onclick="window.deletePantryItem('${p.id}')" class="text-outline hover:text-error transition-colors p-1" title="Remover da despensa">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="py-6 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
      <span class="material-symbols-outlined text-3xl text-outline mb-1">inventory_2</span>
      <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhum item na despensa</h4>
      <p class="text-[11px] text-on-surface-variant mt-0.5 mb-3">Cadastre seus itens frequentes para adicioná-los rapidamente ao carrinho.</p>
      <button onclick="window.openNewPantryModal()" class="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-xl font-bold text-xs inline-flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all">
        <span class="material-symbols-outlined text-[14px]">add</span>
        Cadastrar Item
      </button>
    </div>
  `;

  // Attach category drag and drop listeners
  setTimeout(() => {
    window.attachCategoryDragListeners();
  }, 50);

  return `
    <div class="pb-28">
      <!-- TopAppBar (Solid, Opaque & Seamless) -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.shoppingStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Categorias</h1>
        </div>
      </header>

      <!-- Main Content -->
      <main class="px-5 py-2 space-y-6">
        <!-- Section: Categories -->
        <section>
          <div class="flex justify-between items-center mb-1.5">
            <div>
              <h2 class="font-label-caps text-label-caps text-primary uppercase font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">category</span>
                Ordem das Categorias
              </h2>
              <p class="text-[11px] text-on-surface-variant">Arraste ou use as setas para definir a ordem no carrinho</p>
            </div>
            <button onclick="window.openCategoryModal()" class="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[14px]">add</span>
              Nova
            </button>
          </div>
          <div id="categories-list-container" class="space-y-2.5 pt-1">
            ${categoriesListHtml}
          </div>
        </section>

        <!-- Section: Despensa / Frequent Items -->
        <section>
          <div class="flex justify-between items-center mb-3">
            <div>
              <h2 class="font-label-caps text-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">inventory_2</span>
                Itens Frequentes da Despensa
              </h2>
              <p class="text-[11px] text-on-surface-variant">Adicione à lista ativa com 1 toque</p>
            </div>
            <button onclick="window.openNewPantryModal()" class="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
              <span class="material-symbols-outlined text-[14px]">add</span>
              Item
            </button>
          </div>
          <div class="space-y-2">
            ${pantryListHtml}
          </div>
        </section>
      </main>
    </div>
  `;
};

// Drag and drop listener installer
window.attachCategoryDragListeners = function () {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('categories-list-container');
  if (!container) return;

  let draggedItem = null;
  let draggedIndex = null;

  const items = container.querySelectorAll('.category-draggable');
  items.forEach(item => {
    // Desktop Drag and Drop
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      draggedIndex = parseInt(item.dataset.index, 10);
      item.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.catId);
      }
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      items.forEach(i => i.classList.remove('drop-target-above', 'drop-target-below'));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const targetIndex = parseInt(item.dataset.index, 10);
      if (targetIndex !== draggedIndex) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        items.forEach(i => i.classList.remove('drop-target-above', 'drop-target-below'));
        if (e.clientY < midY) {
          item.classList.add('drop-target-above');
        } else {
          item.classList.add('drop-target-below');
        }
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drop-target-above', 'drop-target-below');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drop-target-above', 'drop-target-below');
      const targetIndex = parseInt(item.dataset.index, 10);
      if (draggedIndex !== null && targetIndex !== draggedIndex) {
        window.shoppingStore.reorderCategories(draggedIndex, targetIndex);
      }
    });

    // Touch Drag Reorder Support for Mobile
    const handle = item.querySelector('.category-drag-handle');
    if (handle) {
      let isTouching = false;

      handle.addEventListener('touchstart', () => {
        isTouching = true;
        item.classList.add('dragging');
      }, { passive: true });

      handle.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        const touchCurrentY = e.touches[0].clientY;
        const targetElement = document.elementFromPoint(e.touches[0].clientX, touchCurrentY);
        const targetCard = targetElement ? targetElement.closest('.category-draggable') : null;

        if (targetCard && targetCard !== item) {
          const fromIdx = parseInt(item.dataset.index, 10);
          const toIdx = parseInt(targetCard.dataset.index, 10);
          if (!isNaN(fromIdx) && !isNaN(toIdx) && fromIdx !== toIdx) {
            window.shoppingStore.reorderCategories(fromIdx, toIdx);
            isTouching = false;
          }
        }
      }, { passive: true });

      handle.addEventListener('touchend', () => {
        isTouching = false;
        item.classList.remove('dragging');
      });
    }
  });
};

window.addPantryItemToList = function (listId, pantryId) {
  const store = window.shoppingStore;
  const p = store.state.pantry.find(item => item.id === pantryId);
  if (!p) return;

  store.addItemToList(listId, {
    name: p.name,
    categoryId: p.categoryId,
    quantity: 1,
    unit: p.unit,
    currentPrice: p.defaultPrice,
    previousPrice: p.defaultPrice
  });

  window.showToast(`"${p.name}" adicionado à lista!`, 'success');
};

window.deletePantryItem = function (pantryId) {
  window.shoppingStore.deletePantryItem(pantryId);
  window.showToast('Item removido da despensa.', 'info');
};

window.openNewPantryModal = function () {
  const store = window.shoppingStore;
  const categories = store.state.categories;

  const modalHtml = `
    <div id="modal-backdrop" class="fixed inset-0 bg-black/50 dark:bg-black/65 backdrop-blur-md z-50 flex items-end justify-center transition-opacity fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="w-full max-w-[540px] floating-modal-sheet rounded-t-3xl p-6 pointer-events-auto relative z-10 slide-up max-h-[90vh] overflow-y-auto">
        <div class="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-5"></div>
        
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-headline-md text-headline-md text-on-surface">Novo Item na Despensa</h2>
          <button onclick="window.closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <form id="pantry-form" onsubmit="window.savePantryItem(event)" class="space-y-4">
          <div>
            <label class="block font-label-caps text-on-surface-variant uppercase text-xs mb-1.5 font-bold">Nome do Produto</label>
            <input id="pantry-name-input" required type="text" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-on-surface font-body-lg" placeholder="Ex: Arroz 5kg, Azeite...">
          </div>

          <div>
            <label class="block font-label-caps text-on-surface-variant uppercase text-xs mb-1.5 font-bold">Categoria</label>
            <select id="pantry-cat-input" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-on-surface text-sm font-semibold">
              <option value="">Sem categoria</option>
              ${categories.map(c => `
                <option value="${c.id}">${c.name}</option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-label-caps text-on-surface-variant uppercase text-xs mb-1.5 font-bold">Unidade</label>
              <select id="pantry-unit-input" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-on-surface text-sm font-semibold">
                <option value="unid">unid (Unidade)</option>
                <option value="kg">kg (Quilograma)</option>
                <option value="g">g (Gramas)</option>
                <option value="L">L (Litros)</option>
                <option value="pct">pct (Pacote)</option>
                <option value="cx">cx (Caixa)</option>
              </select>
            </div>

            <div>
              <label class="block font-label-caps text-on-surface-variant uppercase text-xs mb-1.5 font-bold">Preço Padrão (R$)</label>
              <input id="pantry-price-input" type="number" step="0.01" min="0" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-on-surface font-body-lg" placeholder="0,00">
            </div>
          </div>

          <button type="submit" class="w-full py-3.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md mt-2">
            <span class="material-symbols-outlined">add</span>
            Salvar na Despensa
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('modal-container').innerHTML = modalHtml;
};

window.savePantryItem = function (e) {
  e.preventDefault();
  const name = document.getElementById('pantry-name-input').value;
  const categoryId = document.getElementById('pantry-cat-input').value;
  const unit = document.getElementById('pantry-unit-input').value;
  const defaultPrice = parseFloat(document.getElementById('pantry-price-input').value) || 0;

  window.shoppingStore.addPantryItem({ name, categoryId, unit, defaultPrice });
  window.closeModal();
  window.showToast('Item adicionado à despensa!', 'success');
};
