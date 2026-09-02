/**
 * Lumina Lifestyle - Home View (Minhas Compras)
 * Replicates and enhances the Stitch 'tela_inicial_hist_rico_pt' screen.
 */

window.renderHomeView = function () {
  const store = window.shoppingStore;
  const lists = store.state.lists || [];

  // Strictly separate current and past lists by completion status
  const currentLists = lists.filter(l => l.status !== 'completed');
  const pastLists = lists.filter(l => l.status === 'completed');

  // Sort both by createdAt descending (newest first)
  const sortByCreatedAtDesc = (a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  };
  currentLists.sort(sortByCreatedAtDesc);
  pastLists.sort(sortByCreatedAtDesc);

  let currentListsHtml = '';
  if (currentLists.length > 0) {
    currentListsHtml = `
      <div class="space-y-3">
        ${currentLists.map(activeList => {
          const totals = store.calculateListTotals(activeList);
          const formattedTotal = totals.currentTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

          return `
            <div class="bg-primary-fixed rounded-2xl p-4 transition-all shadow-sm border border-primary-fixed-dim/50 group">
              <div class="flex justify-between items-start mb-3">
                <div onclick="window.shoppingStore.setActiveList('${activeList.id}'); window.shoppingStore.setActiveTab('cart');" class="cursor-pointer flex-1">
                  <div class="flex items-center gap-1.5 mb-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-primary">Em andamento</span>
                  </div>
                  <h3 class="font-body-lg text-lg font-bold text-on-surface group-hover:text-primary transition-colors">${activeList.title}</h3>
                  <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">${totals.totalItems} ${totals.totalItems === 1 ? 'item no carrinho' : 'itens no carrinho'}</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-right">
                    <span class="font-price-display text-xl font-bold text-on-surface block">${formattedTotal}</span>
                    <span class="text-[11px] text-on-surface-variant">total previsto</span>
                  </div>
                  <!-- 3 Pontinhos Menu for Active List -->
                  <button onclick="window.openListActionsMenu('${activeList.id}', event)" 
                          class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-black/5 active:scale-90 transition-all -mr-1" 
                          title="Opções da lista">
                    <span class="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
              </div>

              <div class="flex justify-between items-center mt-3 pt-2 border-t border-primary-fixed-dim/30 text-xs font-semibold text-primary">
                <div onclick="window.shoppingStore.setActiveList('${activeList.id}'); window.shoppingStore.setActiveTab('cart');" class="flex items-center gap-1 cursor-pointer hover:underline">
                  <span class="material-symbols-outlined text-[16px]">shopping_cart</span>
                  Abrir carrinho
                </div>
                <button onclick="window.shoppingStore.setActiveList('${activeList.id}'); window.shoppingStore.setActiveTab('cart');" class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    currentListsHtml = `
      <div onclick="window.openNewListModal()" class="bg-surface-container rounded-2xl p-6 text-center cursor-pointer hover:bg-surface-variant transition-all border border-dashed border-outline-variant">
        <span class="material-symbols-outlined text-4xl text-primary mb-2">add_shopping_cart</span>
        <h3 class="font-body-lg font-bold text-on-surface">Nenhuma compra atual</h3>
        <p class="text-xs text-on-surface-variant mt-1">Toque aqui para criar uma nova lista</p>
      </div>
    `;
  }

  const pastListsHtml = pastLists.length > 0 ? pastLists.map(list => {
    const totals = store.calculateListTotals(list);
    const totalSpent = list.totalSpent || totals.currentTotal;
    const itemsCount = list.itemsCount || totals.totalItems;
    const formattedTotal = totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return `
      <!-- Swipeable List Card Container -->
      <div class="swipe-item-container relative rounded-xl overflow-hidden shadow-sm select-none" data-swipe-container="${list.id}">
        <!-- Background Swipe Action (Delete) -->
        <div onclick="window.confirmDeleteList('${list.id}', event)" 
             class="absolute inset-0 bg-error flex items-center justify-end px-5 rounded-xl cursor-pointer transition-colors active:bg-error-container" 
             title="Excluir lista">
          <div class="flex items-center gap-1.5 text-white font-bold text-xs pointer-events-none">
            <span class="material-symbols-outlined text-[20px]">delete</span>
            <span>Excluir</span>
          </div>
        </div>

        <!-- Foreground Card Surface -->
        <div class="swipe-card-surface relative bg-surface-container rounded-xl p-3.5 flex justify-between items-center border border-outline-variant/30 hover:bg-surface-variant group"
             data-list-id="${list.id}"
             data-swipe-card="true">
          <div onclick="window.handleListCardClick('${list.id}', event)" class="flex-1 cursor-pointer pr-2">
            <h3 class="font-body-lg text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">${list.title}</h3>
            <p class="font-body-sm text-xs text-on-surface-variant mt-0.5">
              ${itemsCount} itens ${list.notes ? `• ${list.notes}` : ''}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <div onclick="window.handleListCardClick('${list.id}', event)" class="text-right cursor-pointer">
              <span class="font-price-display text-sm font-bold text-on-surface block">${formattedTotal}</span>
              <span class="text-[10px] text-outline font-medium">fechada</span>
            </div>
            
            <!-- 3 Pontinhos Menu Button -->
            <button onclick="window.openListActionsMenu('${list.id}', event)" 
                    class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-black/5 active:scale-90 transition-all ml-1" 
                    title="Opções da lista">
              <span class="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="text-center py-6 text-on-surface-variant text-xs">
      Nenhuma lista anterior.
    </div>
  `;

  // Attach swipe listeners after DOM update
  setTimeout(() => {
    window.attachSwipeListeners();
  }, 50);

  return `
    <div class="pb-36">
      <!-- TopAppBar (Solid, Opaque & Seamless) -->
      <header class="flex justify-between items-center w-full px-5 py-4 bg-background sticky top-0 z-30">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-primary">Smart Shopping</span>
          <h1 class="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-bold">Minhas Compras</h1>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="window.openMobileConnectModal()" aria-label="Abrir no Celular" class="px-2.5 py-1.5 rounded-full bg-primary-fixed hover:bg-primary-fixed-dim/70 text-primary transition-all text-xs font-bold flex items-center gap-1 active:scale-95 shadow-sm" title="Abrir no Celular (PWA)">
            <span class="material-symbols-outlined text-[18px]">phone_iphone</span>
            <span class="hidden sm:inline">No Celular</span>
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="px-5 mt-2 space-y-6">
        <!-- Active Lists Section -->
        <section>
          <div class="flex justify-between items-center mb-3">
            <h2 class="font-label-caps text-label-caps text-primary uppercase flex items-center gap-1.5 font-bold">
              <span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings: 'FILL' 1;">star</span>
              Compras Atuais
            </h2>
          </div>
          ${currentListsHtml}
        </section>

        <!-- Previous Lists Section -->
        <section>
          <div class="flex justify-between items-center mb-3">
            <h2 class="font-label-caps text-label-caps text-outline uppercase flex items-center gap-1.5 font-bold">
              <span class="material-symbols-outlined text-[16px]">history</span>
              Listas Anteriores
            </h2>
          </div>
          <div class="space-y-2.5">
            ${pastListsHtml}
          </div>
        </section>
      </main>
    </div>
  `;
};

// Global Swipe-to-Delete Interaction Handler
let currentOpenSwipeCard = null;
let isDraggingCard = false;

window.handleListCardClick = function (listId, e) {
  if (e) e.stopPropagation();
  // If card was just being dragged or is open, reset rather than navigate
  if (isDraggingCard) return;

  const card = document.querySelector(`[data-swipe-card="true"][data-list-id="${listId}"]`);
  if (card && card.dataset.swiped === 'true') {
    window.resetSwipedCards();
    return;
  }

  window.resetSwipedCards();
  window.shoppingStore.setActiveList(listId);
  window.shoppingStore.setActiveTab('cart');
};

window.resetSwipedCards = function (exceptCard = null) {
  const cards = document.querySelectorAll('[data-swipe-card="true"]');
  cards.forEach(card => {
    if (card !== exceptCard) {
      card.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)';
      card.style.transform = 'translateX(0px)';
      card.dataset.swiped = 'false';
    }
  });
  if (!exceptCard) {
    currentOpenSwipeCard = null;
  }
};

window.attachSwipeListeners = function () {
  if (typeof document === 'undefined') return;
  const cards = document.querySelectorAll('[data-swipe-card="true"]');
  if (!cards.length) return;

  cards.forEach(card => {
    // Avoid double attaching
    if (card.dataset.swipeInitialized === 'true') return;
    card.dataset.swipeInitialized = 'true';

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isHorizontal = false;
    let isDecided = false;
    let initialOffset = 0;
    const listId = card.dataset.listId;

    const onTouchStart = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;
      currentX = startX;
      currentY = startY;
      isDraggingCard = false;
      isDecided = false;
      isHorizontal = false;

      // Check current open state
      initialOffset = card.dataset.swiped === 'true' ? -85 : 0;

      // Close other open cards
      window.resetSwipedCards(card);
    };

    const onTouchMove = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      currentX = touch.clientX;
      currentY = touch.clientY;

      const diffX = currentX - startX;
      const diffY = currentY - startY;

      if (!isDecided) {
        if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
          isDecided = true;
          isHorizontal = Math.abs(diffX) > Math.abs(diffY);
        }
      }

      if (isHorizontal) {
        // Prevent vertical scrolling while swiping
        if (e.cancelable) e.preventDefault();
        isDraggingCard = true;
        card.classList.add('swiping');

        let targetOffset = initialOffset + diffX;
        // Limit dragging bounds: max 0 (can't drag right), min -140px
        if (targetOffset > 0) {
          targetOffset = targetOffset * 0.2; // Rubber band resistance
        } else if (targetOffset < -120) {
          targetOffset = -120 + (targetOffset + 120) * 0.3;
        }

        card.style.transform = `translateX(${targetOffset}px)`;
      }
    };

    const onTouchEnd = (e) => {
      card.classList.remove('swiping');
      card.style.transition = 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)';

      const diffX = currentX - startX;
      const finalOffset = initialOffset + diffX;

      if (isHorizontal) {
        // If dragged past -140px or fast swipe left, trigger deletion directly
        if (finalOffset < -130) {
          card.style.transform = 'translateX(-100%)';
          setTimeout(() => {
            window.confirmDeleteList(listId);
          }, 150);
          return;
        }

        // If dragged enough to open (-45px threshold)
        if (finalOffset < -45) {
          card.style.transform = 'translateX(-85px)';
          card.dataset.swiped = 'true';
          currentOpenSwipeCard = card;
        } else {
          card.style.transform = 'translateX(0px)';
          card.dataset.swiped = 'false';
          if (currentOpenSwipeCard === card) currentOpenSwipeCard = null;
        }
      }

      setTimeout(() => {
        isDraggingCard = false;
      }, 50);
    };

    // Touch events
    card.addEventListener('touchstart', onTouchStart, { passive: true });
    card.addEventListener('touchmove', onTouchMove, { passive: false });
    card.addEventListener('touchend', onTouchEnd, { passive: true });
    card.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Pointer events for desktop mouse dragging
    card.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) {
        onTouchStart(e);
        const onPointerMove = (pe) => onTouchMove(pe);
        const onPointerUp = (pe) => {
          onTouchEnd(pe);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
        };
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
      }
    });
  });
};

// Global click listener to close swiped cards on outside tap
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-swipe-container]')) {
      window.resetSwipedCards();
    }
  });
}

window.confirmDeleteList = function (listId, e) {
  if (e) e.stopPropagation();
  window.resetSwipedCards();

  if (confirm('Tem certeza que deseja excluir esta lista de compras?')) {
    window.shoppingStore.deleteList(listId);
    window.showToast('Lista excluída com sucesso.', 'info');
  }
};
