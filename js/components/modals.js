/**
 * Smart Finances - Modals, Custom In-App Keypad & Dialog Components
 * Includes Onboarding, In-App Numeric Keypad, Single-Amount Expense/Income forms,
 * Filter Bottom Sheets, Year Pickers, and explicit Month Close Assistant.
 */

window.closeModal = function () {
  const container = document.getElementById('modal-container');
  if (container) {
    container.innerHTML = '';
  }
};

window.closeKeypad = function () {
  const container = document.getElementById('keypad-container');
  if (container) {
    container.innerHTML = '';
  }
};

window.showToast = function (message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-secondary text-white' : type === 'error' ? 'bg-error text-white' : 'bg-surface-container-highest text-on-surface';
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

  toast.className = `flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs ${bgClass} slide-up transition-all pointer-events-auto max-w-[90vw]`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[18px]">${icon}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 250);
  }, 2800);
};

// ==========================================================================
// 1. In-App Custom Numeric Keypad Engine for Currency Values
// ==========================================================================
window.openKeypad = function ({ initialValue = 0, onConfirm, title = 'Digitar Valor' }) {
  const container = document.getElementById('keypad-container');
  if (!container) return;

  let rawCents = Math.round((Number(initialValue) || 0) * 100);

  const formatCurrency = (cents) => {
    const val = cents / 100;
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderKeypadUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeKeypad()">
        <div class="keypad-sheet w-full max-w-[480px] mx-auto p-5 pb-8 slide-up flex flex-col gap-4 border-t border-outline-variant/30">
          
          <!-- Keypad Header -->
          <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <h3 class="font-bold text-sm text-on-surface">${title}</h3>
            <button type="button" onclick="window.closeKeypad()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Value Display Displaying live formatted currency -->
          <div class="bg-surface-container rounded-2xl p-4 text-center border border-outline-variant/40 shadow-inner">
            <span class="text-[11px] font-bold uppercase text-on-surface-variant tracking-wider block mb-1">Valor Informado</span>
            <span id="keypad-display-val" class="font-price-display text-3xl font-black text-primary tracking-tight block">
              ${formatCurrency(rawCents)}
            </span>
          </div>

          <!-- Numeric Grid: 0-9, backspace, clear, confirm -->
          <div class="grid grid-cols-3 gap-2.5 pt-1">
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('1')">1</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('2')">2</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('3')">3</button>

            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('4')">4</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('5')">5</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('6')">6</button>

            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('7')">7</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('8')">8</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('9')">9</button>

            <button type="button" class="keypad-btn text-xs text-error font-extrabold uppercase" onclick="window.handleKeypadInput('clear')">Limpar</button>
            <button type="button" class="keypad-btn" onclick="window.handleKeypadInput('0')">0</button>
            <button type="button" class="keypad-btn text-on-surface-variant" onclick="window.handleKeypadInput('backspace')">
              <span class="material-symbols-outlined text-[22px]">backspace</span>
            </button>
          </div>

          <!-- Confirm Action Button -->
          <button type="button" onclick="window.handleKeypadConfirm()" class="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-98 transition-all">
            <span class="material-symbols-outlined text-[20px]">check</span>
            <span>Confirmar Valor (${formatCurrency(rawCents)})</span>
          </button>
        </div>
      </div>
    `;
  };

  window.handleKeypadInput = function (key) {
    if (key === 'clear') {
      rawCents = 0;
    } else if (key === 'backspace') {
      rawCents = Math.floor(rawCents / 10);
    } else if (/^\d$/.test(key)) {
      if (rawCents < 99999999) { // Prevent overflow
        rawCents = rawCents * 10 + parseInt(key, 10);
      }
    }
    const display = document.getElementById('keypad-display-val');
    if (display) display.innerText = formatCurrency(rawCents);
    renderKeypadUI();
  };

  window.handleKeypadConfirm = function () {
    const finalVal = rawCents / 100;
    if (typeof onConfirm === 'function') {
      onConfirm(finalVal);
    }
    window.closeKeypad();
  };

  renderKeypadUI();
};

// ==========================================================================
// 2. Onboarding Profile Modal (First App Launch)
// ==========================================================================
window.openOnboardingModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  let uploadedPhotoBase64 = '';

  const renderOnboardingUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md fade-in">
        <div class="bg-surface rounded-3xl p-6 w-full max-w-[420px] shadow-2xl border border-outline-variant/30 flex flex-col gap-5 slide-up">
          
          <div class="text-center space-y-1.5">
            <div class="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container mx-auto flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[30px]">account_circle</span>
            </div>
            <h2 class="font-headline-md text-xl font-bold text-on-surface">Bem-vindo ao Smart Finances</h2>
            <p class="text-xs text-on-surface-variant">Configure seu perfil para personalizar sua experiência financeira.</p>
          </div>

          <!-- Photo Picker -->
          <div class="flex flex-col items-center gap-2">
            <div class="relative group cursor-pointer" onclick="document.getElementById('onboarding-photo-input').click()">
              <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md bg-surface-container flex items-center justify-center text-outline">
                ${uploadedPhotoBase64 ? `
                  <img src="${uploadedPhotoBase64}" alt="Foto de perfil" class="w-full h-full object-cover">
                ` : `
                  <img src="./icons/icon-192.png" alt="Smart Finances" class="w-full h-full object-cover">
                `}
              </div>
              <div class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-surface">
                <span class="material-symbols-outlined text-[15px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="onboarding-photo-input" accept="image/*" class="hidden" onchange="window.handlePhotoSelected(event)">
            <span class="text-[11px] text-on-surface-variant">Toque para adicionar foto (opcional)</span>
          </div>

          <!-- Name Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Seu Nome *</label>
            <input type="text" id="onboarding-name-input" placeholder="Ex: Paulo Palhares" class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-sm text-on-surface font-semibold" value="${window.financeStore.state.userName || ''}">
          </div>

          <!-- Submit Button -->
          <button type="button" onclick="window.submitOnboarding()" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-sm shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2">
            <span>Começar a Usar</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    `;
  };

  window.handlePhotoSelected = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        // Resize image to max 256x256 to optimize localStorage size
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        uploadedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        renderOnboardingUI();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.submitOnboarding = function () {
    const nameInput = document.getElementById('onboarding-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      window.showToast('Por favor, digite seu nome.', 'error');
      return;
    }

    window.financeStore.saveProfile({
      userName: name,
      userPhoto: uploadedPhotoBase64 || window.financeStore.state.userPhoto || ''
    });

    window.closeModal();
    window.showToast(`Olá, ${name}! Perfil configurado com sucesso.`, 'success');
  };

  renderOnboardingUI();
};

// ==========================================================================
// 3. Edit Profile Modal (Accessible from Settings)
// ==========================================================================
window.openProfileEditModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  let currentPhoto = store.state.userPhoto || '';

  const renderEditProfileUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
        <div class="bg-surface rounded-3xl p-6 w-full max-w-[400px] shadow-2xl border border-outline-variant/30 flex flex-col gap-4 slide-up">
          
          <div class="flex justify-between items-center">
            <h3 class="font-headline-md text-base font-bold text-on-surface">Editar Perfil</h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Photo Picker -->
          <div class="flex flex-col items-center gap-2">
            <div class="relative cursor-pointer" onclick="document.getElementById('edit-profile-photo-input').click()">
              <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md bg-surface-container flex items-center justify-center text-outline">
                ${currentPhoto ? `
                  <img src="${currentPhoto}" alt="Foto de perfil" class="w-full h-full object-cover">
                ` : `
                  <img src="./icons/icon-192.png" alt="Smart Finances" class="w-full h-full object-cover">
                `}
              </div>
              <div class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-surface">
                <span class="material-symbols-outlined text-[15px]">photo_camera</span>
              </div>
            </div>
            <input type="file" id="edit-profile-photo-input" accept="image/*" class="hidden" onchange="window.handleEditPhotoSelected(event)">
            ${currentPhoto ? `
              <button type="button" onclick="window.removeProfilePhoto()" class="text-[11px] text-error font-bold">Remover foto</button>
            ` : ''}
          </div>

          <!-- Name Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">Nome</label>
            <input type="text" id="edit-profile-name" value="${store.state.userName || ''}" class="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant/50 focus:border-primary focus:outline-none text-sm text-on-surface font-semibold">
          </div>

          <!-- Save Button -->
          <button type="button" onclick="window.saveProfileEdit()" class="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all">
            Salvar Alterações
          </button>
        </div>
      </div>
    `;
  };

  window.handleEditPhotoSelected = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        currentPhoto = canvas.toDataURL('image/jpeg', 0.85);
        renderEditProfileUI();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.removeProfilePhoto = function () {
    currentPhoto = '';
    renderEditProfileUI();
  };

  window.saveProfileEdit = function () {
    const nameInput = document.getElementById('edit-profile-name');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      window.showToast('Por favor, digite seu nome.', 'error');
      return;
    }
    store.saveProfile({
      userName: name,
      userPhoto: currentPhoto
    });
    window.closeModal();
    window.showToast('Perfil atualizado com sucesso!', 'success');
  };

  renderEditProfileUI();
};

// ==========================================================================
// 4. Quick Status Picker Bottom Sheet Modal (Replaces checkbox)
// ==========================================================================
window.openStatusPickerModal = function ({ id, type = 'expense', currentStatus = 'pending' }) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const isExpense = type === 'expense';

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-3 max-w-[420px] mx-auto">
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <h3 class="font-bold text-sm text-on-surface">Alterar Situação</h3>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant">Selecione o status deste lançamento:</p>

        <div class="flex flex-col gap-2 pt-1">
          ${isExpense ? `
            <button onclick="window.selectQuickStatus('${id}', 'expense', 'paid')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all ${currentStatus === 'paid' ? 'bg-secondary text-white shadow-md' : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30'}">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Pago</span>
              </span>
              ${currentStatus === 'paid' ? '<span class="material-symbols-outlined text-[18px]">done</span>' : ''}
            </button>

            <button onclick="window.selectQuickStatus('${id}', 'expense', 'pending')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all ${currentStatus === 'pending' ? 'bg-[#dc2626] text-white shadow-md' : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30'}">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
                <span>Pendente</span>
              </span>
              ${currentStatus === 'pending' ? '<span class="material-symbols-outlined text-[18px]">done</span>' : ''}
            </button>
          ` : `
            <button onclick="window.selectQuickStatus('${id}', 'income', 'received')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all ${currentStatus === 'received' ? 'bg-secondary text-white shadow-md' : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30'}">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                <span>Recebida</span>
              </span>
              ${currentStatus === 'received' ? '<span class="material-symbols-outlined text-[18px]">done</span>' : ''}
            </button>

            <button onclick="window.selectQuickStatus('${id}', 'income', 'pending')" 
                    class="w-full py-3.5 px-4 rounded-2xl flex items-center justify-between font-bold text-sm transition-all ${currentStatus === 'pending' ? 'bg-primary text-white shadow-md' : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-outline-variant/30'}">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[20px]">schedule</span>
                <span>Prevista</span>
              </span>
              ${currentStatus === 'pending' ? '<span class="material-symbols-outlined text-[18px]">done</span>' : ''}
            </button>
          `}
        </div>
      </div>
    </div>
  `;

  window.selectQuickStatus = function (itemId, itemType, newStatus) {
    if (itemType === 'expense') {
      window.financeStore.updateExpense(itemId, { status: newStatus });
      window.showToast(newStatus === 'paid' ? 'Despesa marcada como Paga!' : 'Despesa marcada como Pendente.', 'success');
    } else {
      window.financeStore.updateIncome(itemId, { status: newStatus });
      window.showToast(newStatus === 'received' ? 'Receita marcada como Recebida!' : 'Receita marcada como Prevista.', 'success');
    }
    window.closeModal();
  };
};

// ==========================================================================
// 5. Year Picker Modal (Historical & Future Navigation)
// ==========================================================================
window.openYearPickerModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const currentYear = new Date().getFullYear();
  let years = [];
  for (let y = currentYear + 4; y >= currentYear - 4; y--) {
    years.push(y);
  }

  const selectedYear = window.financeStore.getSelectedYear();

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-4">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <h3 class="font-bold text-sm text-on-surface">Selecionar Ano</h3>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p class="text-xs text-on-surface-variant">
          Escolha o ano para navegar pelos meses correspondentes:
        </p>

        <div class="grid grid-cols-3 gap-2.5 pt-1">
          ${years.map(yr => {
            const isSelected = selectedYear === yr;
            return `
              <button onclick="window.selectYearFilter(${yr})" 
                      class="py-3 rounded-2xl border text-sm font-bold transition-all active:scale-95 ${isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container hover:bg-surface-variant text-on-surface border-outline-variant/30'}">
                ${yr}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  window.selectYearFilter = function (yr) {
    window.financeStore.setSelectedYear(yr);
    window.closeModal();
  };
};

// ==========================================================================
// 5. Month Filter Bottom Sheet Modal (Category, Payee/Payer, Status)
// ==========================================================================
window.openMonthFiltersModal = function (type = 'expense') {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const monthKey = store.getSelectedMonthKey();
  const categories = store.getCategories(type);

  // Extract unique payees or payers in the month
  const items = type === 'expense' ? store.getExpensesByMonth(monthKey) : store.getIncomesByMonth(monthKey);
  const payeesPayers = Array.from(new Set(items.map(i => type === 'expense' ? i.payee : i.payer).filter(Boolean)));

  const currentCat = store.state.monthFilterCategory || 'all';
  const currentStatus = store.state.monthFilterStatus || 'all';
  const currentPerson = store.state.monthFilterPayeePayer || 'all';

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">filter_list</span>
            <h3 class="font-bold text-sm text-on-surface">Filtros de ${type === 'expense' ? 'Despesas' : 'Receitas'}</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Status Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-on-surface block">Status</label>
          <div class="flex flex-wrap gap-2">
            <button onclick="window.applyTempFilter('status', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentStatus === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todos</button>
            ${type === 'expense' ? `
              <button onclick="window.applyTempFilter('status', 'pending')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentStatus === 'pending' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Pendente</button>
              <button onclick="window.applyTempFilter('status', 'paid')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentStatus === 'paid' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}">Pago</button>
            ` : `
              <button onclick="window.applyTempFilter('status', 'pending')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentStatus === 'pending' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Prevista</button>
              <button onclick="window.applyTempFilter('status', 'received')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentStatus === 'received' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'}">Recebida</button>
            `}
          </div>
        </div>

        <!-- Category Filter -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-on-surface block">Categoria</label>
          <div class="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            <button onclick="window.applyTempFilter('category', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentCat === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todas</button>
            ${categories.map(cat => `
              <button onclick="window.applyTempFilter('category', '${cat.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${currentCat === cat.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">
                <span class="material-symbols-outlined text-[15px]">${cat.icon}</span>
                <span>${cat.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Payee/Payer Filter -->
        ${payeesPayers.length > 0 ? `
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-on-surface block">${type === 'expense' ? 'Recebedor / Local' : 'Pagador / Origem'}</label>
            <div class="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
              <button onclick="window.applyTempFilter('person', 'all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentPerson === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">Todos</button>
              ${payeesPayers.map(p => `
                <button onclick="window.applyTempFilter('person', '${p}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentPerson === p ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Actions: Limpar e Fechar -->
        <div class="flex gap-2.5 pt-2">
          <button onclick="window.financeStore.clearMonthFilters(); window.closeModal();" class="flex-1 py-3 bg-surface-container hover:bg-surface-variant text-error font-bold rounded-2xl text-xs border border-outline-variant/30">
            Limpar Filtros
          </button>
          <button onclick="window.closeModal()" class="flex-1 py-3 bg-primary text-white font-bold rounded-2xl text-xs shadow-md">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  `;

  window.applyTempFilter = function (filterType, val) {
    if (filterType === 'status') store.setMonthFilterStatus(val);
    if (filterType === 'category') store.setMonthFilterCategory(val);
    if (filterType === 'person') store.setMonthFilterPayeePayer(val);
    window.openMonthFiltersModal(type);
  };
};

// ==========================================================================
// 6. Expense Modal with Single Amount Model & In-App Keypad
// ==========================================================================
window.openExpenseModal = function (monthKey, expenseId = null) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const targetMonthKey = monthKey || store.getSelectedMonthKey();
  const expense = expenseId ? store.getExpenseById(expenseId) : null;
  const categories = store.getCategories('expense');

  let selectedAmount = expense ? expense.amount : 0;
  let selectedCategory = expense ? expense.categoryId : (categories[0]?.id || 'outras_despesas');
  let selectedStatus = expense ? expense.status : 'pending';

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderExpenseModalUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
        <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <h3 class="font-headline-md text-base font-bold text-on-surface">
              ${expense ? 'Editar Despesa' : 'Nova Despesa'}
            </h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onsubmit="window.handleSaveExpense(event, '${targetMonthKey}', '${expenseId || ''}')" class="space-y-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Nome da Despesa *</label>
              <input type="text" id="expense-name" required placeholder="Ex: Supermercado, Aluguel, Farmácia" 
                     value="${expense ? expense.name : ''}" 
                     class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-[#dc2626] focus:outline-none text-sm text-on-surface font-semibold">
            </div>

            <!-- Single Amount Field with Custom In-App Keypad Trigger -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Valor * (Toque para editar)</label>
              <div onclick="window.openKeypadForExpense()" 
                   class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 hover:border-[#dc2626] cursor-pointer flex items-center justify-between shadow-inner">
                <span id="expense-amount-display" class="font-price-display text-xl font-extrabold text-[#dc2626]">
                  ${fmtCurrency(selectedAmount)}
                </span>
                <span class="material-symbols-outlined text-outline text-[20px]">dialpad</span>
              </div>
              <input type="hidden" id="expense-amount" value="${selectedAmount}">
            </div>

            <!-- Status Toggle: Pendente / Pago -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Status do Pagamento</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="window.setExpenseStatus('pending')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedStatus === 'pending' ? 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Pendente</span>
                </button>
                <button type="button" onclick="window.setExpenseStatus('paid')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedStatus === 'paid' ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Pago</span>
                </button>
              </div>
            </div>

            <!-- Category Selector -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Categoria</label>
              <div class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                ${categories.map(cat => `
                  <button type="button" onclick="window.setExpenseCategory('${cat.id}')" 
                          class="p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${selectedCategory === cat.id ? 'border-[#dc2626] bg-[#dc2626]/10 font-bold' : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-[18px]" style="color: ${cat.textColor}">${cat.icon}</span>
                    <span class="text-[10px] text-on-surface truncate w-full text-center">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Due Date & Payee -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Vencimento</label>
                <input type="date" id="expense-date" value="${expense ? expense.dueDate : `${targetMonthKey}-10`}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Recebedor / Local</label>
                <input type="text" id="expense-payee" placeholder="Ex: Imobiliária" value="${expense ? (expense.payee || '') : ''}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>
            </div>

            <!-- Submit & Delete Actions -->
            <div class="flex gap-2.5 pt-2">
              ${expense ? `
                <button type="button" onclick="window.handleDeleteExpense('${expense.id}')" class="p-3 bg-error-container text-error rounded-2xl font-bold text-xs flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              ` : ''}
              <button type="submit" class="flex-1 py-3.5 bg-[#dc2626] text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">save</span>
                <span>${expense ? 'Salvar Alterações' : 'Cadastrar Despesa'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  };

  window.openKeypadForExpense = function () {
    window.openKeypad({
      initialValue: selectedAmount,
      title: 'Valor da Despesa',
      onConfirm: (val) => {
        selectedAmount = val;
        renderExpenseModalUI();
      }
    });
  };

  window.setExpenseCategory = function (catId) {
    selectedCategory = catId;
    renderExpenseModalUI();
  };

  window.setExpenseStatus = function (status) {
    selectedStatus = status;
    renderExpenseModalUI();
  };

  window.handleSaveExpense = function (e, monthKey, id) {
    e.preventDefault();
    const name = document.getElementById('expense-name').value.trim();
    const dueDate = document.getElementById('expense-date').value;
    const payee = document.getElementById('expense-payee').value.trim();

    if (!name) {
      window.showToast('Por favor, informe o nome da despesa.', 'error');
      return;
    }
    if (selectedAmount <= 0) {
      window.showToast('Por favor, digite um valor maior que zero.', 'error');
      return;
    }

    if (id) {
      store.updateExpense(id, {
        name,
        amount: selectedAmount,
        dueDate,
        payee,
        categoryId: selectedCategory,
        status: selectedStatus
      });
      window.showToast('Despesa atualizada com sucesso!', 'success');
    } else {
      store.addExpense({
        monthKey,
        name,
        amount: selectedAmount,
        dueDate,
        payee,
        categoryId: selectedCategory,
        status: selectedStatus
      });
      window.showToast('Despesa cadastrada com sucesso!', 'success');
    }
    window.closeModal();
  };

  window.handleDeleteExpense = function (id) {
    if (confirm('Deseja realmente excluir esta despesa?')) {
      store.deleteExpense(id);
      window.closeModal();
      window.showToast('Despesa excluída.', 'info');
    }
  };

  renderExpenseModalUI();
};

// ==========================================================================
// 7. Income Modal with Single Amount Model & In-App Keypad
// ==========================================================================
window.openIncomeModal = function (monthKey, incomeId = null) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const targetMonthKey = monthKey || store.getSelectedMonthKey();
  const income = incomeId ? store.getIncomeById(incomeId) : null;
  const categories = store.getCategories('income');

  let selectedAmount = income ? income.amount : 0;
  let selectedCategory = income ? income.categoryId : (categories[0]?.id || 'salario');
  let selectedStatus = income ? income.status : 'received';

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderIncomeModalUI = () => {
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
        <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
            <h3 class="font-headline-md text-base font-bold text-on-surface">
              ${income ? 'Editar Receita' : 'Nova Receita'}
            </h3>
            <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form onsubmit="window.handleSaveIncome(event, '${targetMonthKey}', '${incomeId || ''}')" class="space-y-4">
            <!-- Name -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Nome da Receita *</label>
              <input type="text" id="income-name" required placeholder="Ex: Salário, Freelance, Rendimentos" 
                     value="${income ? income.name : ''}" 
                     class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 focus:border-secondary focus:outline-none text-sm text-on-surface font-semibold">
            </div>

            <!-- Single Amount Field with Custom In-App Keypad Trigger -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Valor * (Toque para editar)</label>
              <div onclick="window.openKeypadForIncome()" 
                   class="w-full px-4 py-3 bg-surface-container rounded-xl border border-outline-variant/40 hover:border-secondary cursor-pointer flex items-center justify-between shadow-inner">
                <span id="income-amount-display" class="font-price-display text-xl font-extrabold text-secondary">
                  ${fmtCurrency(selectedAmount)}
                </span>
                <span class="material-symbols-outlined text-outline text-[20px]">dialpad</span>
              </div>
              <input type="hidden" id="income-amount" value="${selectedAmount}">
            </div>

            <!-- Status Toggle: Prevista / Recebida -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Status do Recebimento</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" onclick="window.setIncomeStatus('pending')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedStatus === 'pending' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">schedule</span>
                  <span>Prevista</span>
                </button>
                <button type="button" onclick="window.setIncomeStatus('received')" 
                        class="py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${selectedStatus === 'received' ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}">
                  <span class="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Recebida</span>
                </button>
              </div>
            </div>

            <!-- Category Selector -->
            <div class="space-y-1">
              <label class="text-xs font-bold text-on-surface block">Categoria</label>
              <div class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                ${categories.map(cat => `
                  <button type="button" onclick="window.setIncomeCategory('${cat.id}')" 
                          class="p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${selectedCategory === cat.id ? 'border-secondary bg-secondary/10 font-bold' : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'}">
                    <span class="material-symbols-outlined text-[18px]" style="color: ${cat.textColor}">${cat.icon}</span>
                    <span class="text-[10px] text-on-surface truncate w-full text-center">${cat.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Expected Date & Payer -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Data</label>
                <input type="date" id="income-date" value="${income ? income.expectedDate : `${targetMonthKey}-05`}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>

              <div class="space-y-1">
                <label class="text-xs font-bold text-on-surface block">Pagador / Origem</label>
                <input type="text" id="income-payer" placeholder="Ex: Empresa" value="${income ? (income.payer || '') : ''}" 
                       class="w-full px-3 py-2.5 bg-surface-container rounded-xl border border-outline-variant/40 text-xs text-on-surface">
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2.5 pt-2">
              ${income ? `
                <button type="button" onclick="window.handleDeleteIncome('${income.id}')" class="p-3 bg-error-container text-error rounded-2xl font-bold text-xs flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">delete</span>
                </button>
              ` : ''}
              <button type="submit" class="flex-1 py-3.5 bg-secondary text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[18px]">save</span>
                <span>${income ? 'Salvar Alterações' : 'Cadastrar Receita'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  };

  window.openKeypadForIncome = function () {
    window.openKeypad({
      initialValue: selectedAmount,
      title: 'Valor da Receita',
      onConfirm: (val) => {
        selectedAmount = val;
        renderIncomeModalUI();
      }
    });
  };

  window.setIncomeCategory = function (catId) {
    selectedCategory = catId;
    renderIncomeModalUI();
  };

  window.setIncomeStatus = function (status) {
    selectedStatus = status;
    renderIncomeModalUI();
  };

  window.handleSaveIncome = function (e, monthKey, id) {
    e.preventDefault();
    const name = document.getElementById('income-name').value.trim();
    const expectedDate = document.getElementById('income-date').value;
    const payer = document.getElementById('income-payer').value.trim();

    if (!name) {
      window.showToast('Por favor, informe o nome da receita.', 'error');
      return;
    }
    if (selectedAmount <= 0) {
      window.showToast('Por favor, digite um valor maior que zero.', 'error');
      return;
    }

    if (id) {
      store.updateIncome(id, {
        name,
        amount: selectedAmount,
        expectedDate,
        payer,
        categoryId: selectedCategory,
        status: selectedStatus
      });
      window.showToast('Receita atualizada com sucesso!', 'success');
    } else {
      store.addIncome({
        monthKey,
        name,
        amount: selectedAmount,
        expectedDate,
        payer,
        categoryId: selectedCategory,
        status: selectedStatus
      });
      window.showToast('Receita cadastrada com sucesso!', 'success');
    }
    window.closeModal();
  };

  window.handleDeleteIncome = function (id) {
    if (confirm('Deseja realmente excluir esta receita?')) {
      store.deleteIncome(id);
      window.closeModal();
      window.showToast('Receita excluída.', 'info');
    }
  };

  renderIncomeModalUI();
};

// ==========================================================================
// 8. Month Close Assistant Modal with Explicit Carryover Options
// ==========================================================================
window.openMonthCloseModal = function (monthKey) {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const store = window.financeStore;
  const summary = store.calculateMonthSummary(monthKey);
  const fmt = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="floating-modal-sheet p-5 pb-8 slide-up flex flex-col gap-4">
        
        <div class="flex justify-between items-center pb-2 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-primary">lock</span>
            <h3 class="font-headline-md text-base font-bold text-on-surface">Fechamento de ${summary.monthName}</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="bg-surface-container rounded-2xl p-4 space-y-2 border border-outline-variant/30">
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Previsão de Fechamento:</span>
            <strong class="${summary.forecastBalance >= 0 ? 'text-secondary' : 'text-[#dc2626]'} font-bold">${fmt(summary.forecastBalance)}</strong>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Saldo Atual Realizado:</span>
            <strong class="${summary.actualBalance >= 0 ? 'text-secondary' : 'text-[#dc2626]'} font-bold">${fmt(summary.actualBalance)}</strong>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-on-surface-variant font-medium">Despesas Restantes:</span>
            <strong class="text-on-surface font-bold">${fmt(summary.remainingExpenses)}</strong>
          </div>
        </div>

        <div class="space-y-3 pt-1">
          <label class="flex items-start gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/30 cursor-pointer">
            <input type="checkbox" id="carry-positive-balance" checked class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4">
            <div class="text-xs">
              <span class="font-bold text-on-surface block">Adicionar saldo restante (${fmt(summary.actualBalance)}) ao próximo mês?</span>
              <span class="text-on-surface-variant text-[11px]">Cria uma entrada de "Saldo Trazido" no mês seguinte.</span>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 bg-surface-container rounded-xl border border-outline-variant/30 cursor-pointer">
            <input type="checkbox" id="carry-unpaid-expenses" checked class="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4">
            <div class="text-xs">
              <span class="font-bold text-on-surface block">Carregar pendências não pagas para o próximo mês?</span>
              <span class="text-on-surface-variant text-[11px]">Mantém o registro original neste mês e cria réplica com tag "Pendente do mês anterior".</span>
            </div>
          </label>
        </div>

        <button onclick="window.confirmCloseMonth('${monthKey}')" class="w-full py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-md hover:opacity-95 active:scale-98 transition-all">
          Confirmar Fechamento do Mês
        </button>
      </div>
    </div>
  `;

  window.confirmCloseMonth = function (mKey) {
    const carryBal = document.getElementById('carry-positive-balance')?.checked || false;
    const carryExp = document.getElementById('carry-unpaid-expenses')?.checked || false;

    store.closeMonth(mKey, {
      carryPositiveBalance: carryBal,
      carryUnpaidExpenses: carryExp
    });

    window.closeModal();
    window.showToast(`Mês fechado com sucesso!`, 'success');
  };
};

// ==========================================================================
// 9. Mobile Connect PWA Modal (QR Code)
// ==========================================================================
window.openMobileConnectModal = function () {
  const container = document.getElementById('modal-container');
  if (!container) return;

  const currentUrl = window.location.href;

  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in" onclick="if(event.target === this) window.closeModal()">
      <div class="bg-surface rounded-3xl p-6 w-full max-w-[400px] shadow-2xl border border-outline-variant/30 flex flex-col items-center gap-4 text-center slide-up">
        
        <div class="flex justify-between items-center w-full">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[24px]">phone_iphone</span>
            <h3 class="font-headline-md text-base font-bold text-on-surface">Instalar no Smartphone</h3>
          </div>
          <button onclick="window.closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div id="pwa-qrcode" class="p-3 bg-white rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-center"></div>

        <div class="space-y-1 text-xs text-on-surface-variant">
          <p>Aponte a câmera do seu celular para o QR Code acima.</p>
          <p class="text-[11px]"><strong>iPhone (Safari):</strong> Toque em Compartilhar ➔ "Adicionar à Tela de Início".</p>
          <p class="text-[11px]"><strong>Android (Chrome):</strong> Toque no menu ➔ "Instalar aplicativo".</p>
        </div>

        <button onclick="window.closeModal()" class="w-full py-2.5 bg-surface-container hover:bg-surface-variant font-bold text-xs rounded-xl text-on-surface transition-colors">
          Fechar
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const qrContainer = document.getElementById('pwa-qrcode');
    if (qrContainer && typeof QRCode !== 'undefined') {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: currentUrl,
        width: 170,
        height: 170,
        colorDark: '#18120d',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, 50);
};
