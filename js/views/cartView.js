/**
 * Lumina Lifestyle - Cart View (Lista de Compras & Comparador de Preços)
 * Replicates and enhances the Stitch 'lista_de_compras_pre_os_anteriores' screen.
 */

window.renderCartView = function () {
  const store = window.shoppingStore;
  const list = store.getActiveList();
  const showPreviousPrices = store.state.showPreviousPrices;
  const searchQuery = (store.state.searchQuery || '').toLowerCase();

  if (!list) {
    return `
      <div class="pb-28">
        <!-- TopAppBar -->
        <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
          <div class="flex items-center gap-2.5">
            <button onclick="window.shoppingStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar ao início">
              <span class="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface leading-tight">Carrinho</h1>
              <span class="text-on-surface-variant text-xs font-medium">0 itens</span>
            </div>
          </div>
        </header>

        <!-- Empty State Canvas -->
        <main class="px-5 pt-8 text-center flex flex-col items-center justify-center">
          <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-outline mb-4">
            <span class="material-symbols-outlined text-4xl">shopping_cart_off</span>
          </div>
          <h2 class="font-headline-md text-lg font-bold text-on-surface">Nenhuma lista ativa</h2>
          <p class="text-xs text-on-surface-variant mt-1 mb-6 max-w-xs leading-relaxed">
            Você ainda não possui nenhuma lista de compras criada. Crie uma nova lista para começar a adicionar itens ao carrinho.
          </p>
          <div class="flex flex-col gap-2.5 w-full max-w-xs">
            <button onclick="window.openNewListModal()" class="w-full py-3.5 bg-primary-container text-on-primary-container rounded-xl font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
              Criar Nova Lista
            </button>
            <button onclick="window.shoppingStore.setActiveTab('home')" class="w-full py-2.5 bg-surface-container text-on-surface rounded-xl font-semibold text-xs hover:bg-surface-variant transition-colors">
              Voltar ao Início
            </button>
          </div>
        </main>
      </div>
    `;
  }

  const totals = store.calculateListTotals(list);
  const items = list.items || [];

  // Filter items by search query only
  const filteredItems = items.filter(item => {
    return !searchQuery || item.name.toLowerCase().includes(searchQuery);
  });

  // Group filtered items by category in the user's custom category order
  const categoriesMap = {};
  store.state.categories.forEach(cat => {
    categoriesMap[cat.id] = {
      ...cat,
      items: []
    };
  });

  const uncategorizedItems = [];

  filteredItems.forEach(item => {
    if (item.categoryId && categoriesMap[item.categoryId]) {
      categoriesMap[item.categoryId].items.push(item);
    } else {
      uncategorizedItems.push(item);
    }
  });

  // Helper to render a list of items (sorted alphabetically)
  const renderItemsList = (itemsArray, categoryBgColor, categoryBorderColor, categoryTextColor) => {
    // Sort items alphabetically by name (accent- and case-insensitive)
    const sortedItems = [...itemsArray].sort((a, b) => {
      const nameA = (a.name || '').trim();
      const nameB = (b.name || '').trim();
      return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base', numeric: true });
    });

    return sortedItems.map(item => {
      const hasCurPrice = item.currentPrice !== null && item.currentPrice !== undefined && item.currentPrice !== '' && Number(item.currentPrice) > 0;
      const curPrice = hasCurPrice ? Number(item.currentPrice) : 0;
      const hasPrevPrice = item.previousPrice !== null && item.previousPrice !== undefined && item.previousPrice !== '' && Number(item.previousPrice) > 0;
      const prevPrice = hasPrevPrice ? Number(item.previousPrice) : 0;
      const qty = Number(item.quantity) || 1;
      const subtotal = qty * curPrice;
      const isMissingPrice = !hasCurPrice;

      // Price comparison badge
      let priceDiffHtml = '';
      if (showPreviousPrices && prevPrice > 0 && curPrice > 0) {
        const diff = curPrice - prevPrice;
        if (diff > 0) {
          priceDiffHtml = `
            <div class="text-[10px] font-bold text-error flex items-center justify-end gap-0.5 mt-0.5">
              <span class="material-symbols-outlined text-[12px]">arrow_upward</span>
              +${(diff * qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (+${Math.round((diff / prevPrice) * 100)}%)
            </div>
          `;
        } else if (diff < 0) {
          priceDiffHtml = `
            <div class="text-[10px] font-bold text-secondary flex items-center justify-end gap-0.5 mt-0.5">
              <span class="material-symbols-outlined text-[12px]">arrow_downward</span>
              -${(Math.abs(diff) * qty).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${Math.round((diff / prevPrice) * 100)}%)
            </div>
          `;
        }
      }

      // Stronger border line matching the category color when price is missing
      const cardBorder = isMissingPrice
        ? `2px solid ${categoryTextColor || '#e67e22'}`
        : `1px solid ${categoryBorderColor || 'transparent'}`;

      return `
        <div class="category-item-card rounded-2xl p-3.5 flex justify-between items-center transition-all shadow-sm" 
             style="--cat-bg: ${categoryBgColor}; --cat-border: ${categoryBorderColor || 'transparent'}; border: ${cardBorder}">
          
          <!-- Left Column: Name & Quantity Stepper -->
          <div class="flex flex-col gap-1.5 flex-1 min-w-0 pr-2">
            <h3 onclick="window.openItemModal('${list.id}', '${item.id}')" 
                class="font-body-lg text-sm font-bold text-on-surface truncate cursor-pointer hover:underline" 
                title="${item.name}">
              ${item.name}
            </h3>

            <!-- Quantity Stepper with High-Contrast Off-White Pill -->
            <div class="qty-stepper flex items-center rounded-full w-fit px-1 py-0.5 shadow-sm">
              <button type="button" onclick="window.shoppingStore.updateItemQuantity('${list.id}', '${item.id}', -1)" 
                      class="w-7 h-7 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      title="Diminuir">
                <span class="material-symbols-outlined text-sm">remove</span>
              </button>
              <span class="px-2 text-center font-body-lg text-xs font-bold min-w-[28px]">
                ${item.quantity} <span class="text-[10px] font-normal opacity-80">${item.unit}</span>
              </span>
              <button type="button" onclick="window.shoppingStore.updateItemQuantity('${list.id}', '${item.id}', 1)" 
                      class="w-7 h-7 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                      title="Aumentar">
                <span class="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Price Display, Numeric Keypad Trigger, More Menu -->
          <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
            <button type="button" onclick="window.openItemModal('${list.id}', '${item.id}')" class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-full hover:bg-surface-variant/50 cursor-pointer" title="Opções">
              <span class="material-symbols-outlined text-[18px]">more_vert</span>
            </button>

            ${isMissingPrice ? `
              <!-- Evident Missing Price Alert Badge -->
              <button type="button" onclick="window.openNumericKeypad('${list.id}', '${item.id}')" 
                      class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer border bg-surface-container-lowest"
                      style="color: ${categoryTextColor || '#ba1a1a'}; border-color: ${categoryTextColor || '#ba1a1a'};"
                      title="Item sem preço! Toque para inserir o valor">
                <span class="material-symbols-outlined text-[16px] font-bold">dialpad</span>
                <span>Inserir valor</span>
              </button>
            ` : showPreviousPrices ? `
              <button type="button" onclick="window.openNumericKeypad('${list.id}', '${item.id}')" class="text-right cursor-pointer group bg-transparent border-0 p-0 active:scale-95 transition-transform" title="Toque para alterar o valor">
                <div class="flex items-baseline justify-end gap-1.5">
                  ${prevPrice > 0 ? `
                    <span class="text-xs font-normal text-on-surface-variant/60 line-through tracking-tight">
                      ${prevPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  ` : ''}
                  <span class="font-price-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-end gap-0.5">
                    ${curPrice > 0 ? `${curPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span class="text-xs font-normal text-on-surface-variant">/${item.unit}</span>` : 'R$ --,--'}
                  </span>
                </div>
                <div class="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  Total: <strong class="text-on-surface font-semibold">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
                ${priceDiffHtml}
              </button>
            ` : `
              <button type="button" onclick="window.openNumericKeypad('${list.id}', '${item.id}')" class="text-right cursor-pointer group bg-transparent border-0 p-0 active:scale-95 transition-transform" title="Toque para alterar o valor">
                <div class="font-price-display text-sm font-bold text-on-surface group-hover:text-primary transition-colors flex items-center justify-end gap-0.5">
                  ${curPrice > 0 ? `${curPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}<span class="text-xs font-normal text-on-surface-variant">/${item.unit}</span>` : 'R$ --,--'}
                </div>
                <div class="text-[11px] text-on-surface-variant font-medium mt-0.5">
                  ${curPrice > 0 ? `Total: <strong class="text-on-surface font-semibold">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>` : '<span class="text-primary font-bold hover:underline flex items-center gap-0.5 justify-end"><span class="material-symbols-outlined text-[13px]">dialpad</span>Toque p/ valor</span>'}
                </div>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  };

  // Render categories HTML
  let categoriesHtml = '';
  const activeCategories = Object.values(categoriesMap).filter(cat => cat.items.length > 0);

  if (activeCategories.length === 0 && uncategorizedItems.length === 0) {
    categoriesHtml = `
      <div class="py-12 text-center bg-surface-container/50 rounded-2xl border border-dashed border-outline-variant p-6">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
        <h3 class="font-body-lg font-bold text-on-surface">Nenhum item encontrado</h3>
        <p class="text-xs text-on-surface-variant mt-1 mb-4">
          ${searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Esta lista ainda não possui itens.'}
        </p>
        <button onclick="window.openItemModal('${list.id}')" class="px-4 py-2 bg-primary-container text-on-primary-container rounded-xl font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm">
          <span class="material-symbols-outlined text-[16px]">add</span>
          Adicionar Item
        </button>
      </div>
    `;
  } else {
    // 1. Registered Categories in User Order
    const userCategoriesHtml = activeCategories.map(category => {
      const itemsHtml = renderItemsList(category.items, category.bgColor, category.borderColor, category.textColor);

      return `
        <section class="space-y-2.5">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2" style="color: ${category.textColor}">
              <span class="material-symbols-outlined text-base">${category.icon}</span>
              <h2 class="font-label-caps text-xs font-bold uppercase tracking-wider">${category.name}</h2>
            </div>
            <span class="text-xs text-on-surface-variant font-medium">${category.items.length} ${category.items.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <div class="space-y-2">
            ${itemsHtml}
          </div>
        </section>
      `;
    }).join('');

    // 2. Sem Categoria Section (Fixed at the bottom of the list)
    let uncategorizedSectionHtml = '';
    if (uncategorizedItems.length > 0) {
      const uncategorizedCategory = store.getCategoryById(null);
      const uncategorizedItemsHtml = renderItemsList(
        uncategorizedItems, 
        uncategorizedCategory.bgColor, 
        uncategorizedCategory.borderColor, 
        uncategorizedCategory.textColor
      );

      uncategorizedSectionHtml = `
        <section class="space-y-2.5 pt-1">
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2" style="color: ${uncategorizedCategory.textColor}">
              <span class="material-symbols-outlined text-base">${uncategorizedCategory.icon}</span>
              <h2 class="font-label-caps text-xs font-bold uppercase tracking-wider">${uncategorizedCategory.name}</h2>
            </div>
            <span class="text-xs text-on-surface-variant font-medium">${uncategorizedItems.length} ${uncategorizedItems.length === 1 ? 'item' : 'itens'}</span>
          </div>
          <div class="space-y-2">
            ${uncategorizedItemsHtml}
          </div>
        </section>
      `;
    }

    categoriesHtml = userCategoriesHtml + uncategorizedSectionHtml;
  }

  return `
    <div class="pb-[calc(12rem+env(safe-area-inset-bottom,0px))]">
      <!-- TopAppBar (Solid, Opaque & Seamless) -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.shoppingStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar ao início">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface leading-tight">Carrinho</h1>
            <span class="text-on-surface-variant text-xs font-medium">${totals.totalItems} ${totals.totalItems === 1 ? 'item' : 'itens'}</span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <button onclick="window.shareWhatsApp('${list.id}')" title="Compartilhar lista" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface">
            <span class="material-symbols-outlined text-[20px]">share</span>
          </button>
          <button onclick="window.openCheckoutSummaryModal('${list.id}')" title="Resumo e fechamento" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-primary">
            <span class="material-symbols-outlined text-[22px]">receipt_long</span>
          </button>
        </div>
      </header>

      <!-- Main Content Canvas -->
      <main class="px-5 pt-1 space-y-4">
        <!-- List Selector Dropdown / Context Card (Constrained with overflow protection) -->
        <div class="bg-surface-container rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 border border-outline-variant/40 w-full max-w-full box-border overflow-hidden shadow-sm">
          <div class="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
            <div class="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined text-[18px]">calendar_today</span>
            </div>
            <div class="min-w-0 flex-1 overflow-hidden">
              <span class="font-bold text-sm text-on-surface block truncate" title="${list.title}">${list.title}</span>
              <span class="text-[11px] text-on-surface-variant block truncate">${list.status !== 'completed' ? 'Lista ativa de compras' : 'Lista finalizada'}</span>
            </div>
          </div>
          
          <div class="relative shrink-0 max-w-[130px] sm:max-w-[170px] min-w-0">
            <select onchange="window.shoppingStore.setActiveList(this.value)" class="w-full max-w-full bg-surface-variant text-on-surface text-xs font-bold py-1.5 pl-2.5 pr-2 rounded-xl border-none focus:outline-none cursor-pointer truncate appearance-none text-ellipsis">
              ${[...(store.state.lists || [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(l => `
                <option value="${l.id}" ${l.id === list.id ? 'selected' : ''}>${l.title}${l.status === 'completed' ? ' (Finalizada)' : ''}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="relative">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">search</span>
          <input type="text" 
                 value="${store.state.searchQuery || ''}" 
                 oninput="window.shoppingStore.setSearchQuery(this.value)" 
                 placeholder="Buscar itens no carrinho..." 
                 class="w-full pl-10 pr-9 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-primary focus:outline-none text-xs text-on-surface placeholder:text-outline">
          ${store.state.searchQuery ? `
            <button onclick="window.shoppingStore.setSearchQuery('')" class="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          ` : ''}
        </div>

        <!-- Toggle Previous Prices Card -->
        <div class="flex items-center justify-between bg-surface-container-high p-3.5 rounded-2xl border border-outline-variant/30 shadow-sm">
          <label class="font-body-lg text-xs font-bold text-on-surface flex items-center gap-2 cursor-pointer" for="price-toggle">
            <div class="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[18px]">history</span>
            </div>
            <span>Ver preços do mês anterior</span>
          </label>
          <label class="switch">
            <input id="price-toggle" type="checkbox" ${showPreviousPrices ? 'checked' : ''} onchange="window.shoppingStore.togglePreviousPrices(this.checked)">
            <span class="slider"></span>
          </label>
        </div>

        <!-- Categories & Item Cards -->
        <div class="space-y-6 pt-1">
          ${categoriesHtml}
        </div>
      </main>

      <!-- Total Bar & Attached FAB (Permanentemente fixos na base da tela) -->
      ${window.renderTotalBar(list, showPreviousPrices)}
    </div>
  `;
};
