/**
 * Smart Finances - Home View (Refined Visual Implementation)
 * Features clickable current month card, subtle closing color tones for month cards,
 * strict year-scoped month lists, and floating bottom navigation dock.
 */

window.renderHomeView = function () {
  const store = window.financeStore;
  const currentKey = store.getCurrentMonthKey();
  const currentSummary = store.calculateMonthSummary(currentKey);
  const activeSection = store.state.monthListSection || 'previous';
  const selectedYear = store.getSelectedYear();
  const hideBalances = Boolean(store.state.hideBalances);
  const userPhoto = store.state.userPhoto || '';
  const userName = store.state.userName || 'Paulo Palhares';

  // Currency Formatter (respects privacy toggle)
  const fmt = (val) => {
    if (hideBalances) return '••••••';
    const num = Number(val || 0);
    const prefix = num < 0 ? '-R$ ' : 'R$ ';
    const formattedNum = Math.abs(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${formattedNum}`;
  };

  // Card background class based on forecast balance
  let cardBgClass = 'card-month-negative';
  let badgeTextColor = '#ea7253';
  if (currentSummary.cardTone === 'positive') {
    cardBgClass = 'card-month-positive';
    badgeTextColor = '#15803d';
  } else if (currentSummary.cardTone === 'neutral') {
    cardBgClass = 'card-month-neutral';
    badgeTextColor = '#944a00';
  }

  // Month list generated dynamically STRICTLY FOR SELECTED YEAR
  const monthList = activeSection === 'previous' 
    ? store.getPreviousMonthsList() 
    : store.getFutureMonthsList();

  // Short month name for badge (e.g., "Agosto", "Setembro")
  const shortCurrentMonthName = currentSummary.monthName.split(' ')[0];

  // Dynamic color for monthly balance (Strictly matches previous months' cards token)
  let forecastColorClass = 'text-white';
  if (currentSummary.forecastBalance > 0) {
    forecastColorClass = 'text-[#15803d] dark:text-[#69f0ae]'; // Verde exato dos meses anteriores
  } else if (currentSummary.forecastBalance < 0) {
    forecastColorClass = 'text-[#dc2626] dark:text-[#ff8a80]'; // Vermelho exato dos meses anteriores
  }

  // Count pending items due today or tomorrow for notification badge
  const todayStr = (window.NotificationService ? window.NotificationService.getLocalDateString(0) : new Date().toISOString().split('T')[0]);
  const tomorrowStr = (window.NotificationService ? window.NotificationService.getLocalDateString(1) : new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const dueCount = (store.state.expenses || []).filter(e => e.status === 'pending' && (e.dueDate === todayStr || e.dueDate === tomorrowStr)).length;
  const isBackupDue = (window.NotificationService && typeof window.NotificationService.isBackupReminderDue === 'function')
    ? window.NotificationService.isBackupReminderDue()
    : false;
  const totalNotifCount = dueCount + (isBackupDue ? 1 : 0);

  const monthsCardsHtml = monthList.length > 0 ? monthList.map(m => {
    const summary = store.calculateMonthSummary(m.key);
    const val = summary.forecastBalance;
    const isPositive = val > 0;
    const isNegative = val < 0;

    // Subtle closing tone class
    let itemToneClass = 'month-card-neutral';
    if (summary.cardTone === 'positive') itemToneClass = 'month-card-positive';
    else if (summary.cardTone === 'negative') itemToneClass = 'month-card-negative';

    let itemValueColor = 'text-on-surface';
    if (isPositive) itemValueColor = 'text-[#15803d] dark:text-[#69f0ae]';
    else if (isNegative) itemValueColor = 'text-[#dc2626] dark:text-[#ff8a80]';

    return `
      <div onclick="window.financeStore.openMonthDetail('${m.key}')" 
           class="p-4 rounded-2xl flex justify-between items-center transition-all active:scale-[0.99] cursor-pointer ${itemToneClass}">
        <div>
          <span class="text-xs font-bold text-on-surface block">${m.name}</span>
          <span class="text-[11px] text-on-surface-variant">${summary.monthStatus === 'closed' ? 'Fechado' : 'Em andamento'}</span>
        </div>
        <div class="text-right">
          <span class="font-price-display text-sm font-extrabold block ${itemValueColor}">
            ${fmt(val)}
          </span>
          <span class="text-[10px] text-on-surface-variant">Balanço</span>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="text-center py-6 bg-surface-container/40 dark:bg-white/5 rounded-2xl border border-outline-variant/30">
      <p class="text-xs text-on-surface-variant font-medium">Nenhum mês para exibir neste período.</p>
    </div>
  `;

  return `
    <div class="pb-36 min-h-screen">
      <!-- TopAppBar / Header da Home -->
      <header class="flex justify-between items-center w-full px-5 py-3.5 sticky top-0 bg-background/80 backdrop-blur-md z-30">
        <div class="flex items-center gap-3">
          <!-- Avatar Clicável para Abrir Edição de Perfil (Usa Novo Ícone Oficial como padrão) -->
          <div class="relative cursor-pointer group" onclick="window.openProfileEditModal()" title="Editar perfil">
            <div class="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-container flex items-center justify-center text-on-surface font-extrabold text-sm shadow-sm transition-transform active:scale-95">
              ${userPhoto ? `
                <img src="${userPhoto}" alt="${userName}" class="w-full h-full object-cover">
              ` : `
                <img src="./icons/icon-192.png" alt="Smart Finances" class="w-full h-full object-cover">
              `}
            </div>
            <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background flex items-center justify-center">
              <span class="material-symbols-outlined text-[9px] text-white">edit</span>
            </div>
          </div>

          <div class="flex flex-col">
            <span class="text-xs text-[#8c7462] dark:text-[#b89f8d] font-medium leading-tight">Bem vindo novamente</span>
            <h1 class="text-xl font-extrabold text-[#1c1917] dark:text-[#fcf6f2] tracking-tight leading-snug mt-0.5">
              ${userName}
            </h1>
          </div>
        </div>

        <!-- Botão de Notificações com Popup Central de Avisos -->
        <button type="button" 
                onclick="window.openNotificationCenterModal()" 
                class="relative w-11 h-11 rounded-2xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer" 
                title="Central de Notificações">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
          ${totalNotifCount > 0 ? `
            <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full ${dueCount > 0 ? 'bg-[#dc2626] animate-pulse' : 'bg-secondary'} text-white text-[10px] font-black flex items-center justify-center shadow-md">
              ${totalNotifCount}
            </span>
          ` : ''}
        </button>
      </header>

      <!-- Main Dashboard Content -->
      <main class="px-5 mt-3 space-y-4">
        <!-- Label da Seção: MÊS ATUAL -->
        <div>
          <h2 class="text-[11px] font-extrabold text-[#944a00] dark:text-[#ffb783] uppercase tracking-wider mb-2">
            MÊS ATUAL
          </h2>

          <!-- Card Principal do Mês Atual (INTEIRAMENTE CLICÁVEL) -->
          <div onclick="window.financeStore.openMonthDetail('${currentKey}')" 
               class="${cardBgClass} rounded-[26px] p-5 text-white transition-all select-none cursor-pointer hover:scale-[1.005] active:scale-[0.99] shadow-lg">
            
            <!-- Topo do Card: Badge do Mês e Botão de Olho (Privacidade) -->
            <div class="flex justify-between items-center">
              <div class="bg-white/80 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span class="material-symbols-outlined text-[16px]" style="color: ${badgeTextColor}; font-variation-settings: 'FILL' 1;">calendar_month</span>
                <span class="font-extrabold text-xs" style="color: ${badgeTextColor}">${shortCurrentMonthName}</span>
              </div>

              <!-- Botão de Olho (Com stopPropagation) -->
              <button type="button" 
                      onclick="event.stopPropagation(); window.financeStore.toggleHideBalances()" 
                      class="w-9 h-9 rounded-full bg-white/30 dark:bg-black/25 backdrop-blur-md text-white flex items-center justify-center cursor-pointer hover:bg-white/40 active:scale-90 transition-transform" 
                      title="${hideBalances ? 'Mostrar valores' : 'Ocultar valores'}">
                <span class="material-symbols-outlined text-[19px]">
                  ${hideBalances ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <!-- Grid de 2 Colunas com Linha Divisória Central -->
            <div class="grid grid-cols-[1.15fr_0.85fr] gap-3.5 mt-4">
              <!-- Coluna Esquerda: Despesas restantes, Balanço mensal, Saldo atual -->
              <div class="flex flex-col border-r border-white/25 pr-3">
                <!-- 1. Despesas restantes -->
                <span class="text-[11px] text-white/85 font-medium tracking-wide">Despesas restantes</span>
                <span class="text-2xl sm:text-[25px] font-black tracking-tight text-white mt-0.5 block leading-none">
                  ${fmt(currentSummary.remainingExpenses)}
                </span>

                <!-- 2. Balanço mensal (Cores dinâmicas: verde positivo, vermelho negativo, branco neutro) -->
                <span class="text-[11px] text-white/85 font-medium tracking-wide mt-3.5">Balanço mensal</span>
                <span class="text-xl font-bold tracking-tight ${forecastColorClass} mt-0.5 block leading-tight">
                  ${fmt(currentSummary.forecastBalance)}
                </span>

                <!-- 3. Saldo atual (Cor neutra branca em conformidade com o tema) -->
                <span class="text-[11px] text-white/85 font-medium tracking-wide mt-3.5">Saldo atual</span>
                <span class="text-xl font-bold tracking-tight text-white mt-0.5 block leading-tight">
                  ${fmt(currentSummary.actualBalance)}
                </span>
              </div>

              <!-- Coluna Direita: Despesas totais e Despesas pagas -->
              <div class="flex flex-col pl-1">
                <!-- 1. Despesas totais -->
                <span class="text-[11px] text-white/85 font-medium tracking-wide">Despesas totais</span>
                <span class="text-xl font-bold tracking-tight text-white mt-0.5 block leading-tight">
                  ${fmt(currentSummary.plannedExpenses)}
                </span>

                <!-- Linha Divisória Horizontal Interna -->
                <div class="border-t border-white/25 my-3.5"></div>

                <!-- 2. Despesas pagas -->
                <span class="text-[11px] text-white/85 font-medium tracking-wide">Despesas pagas</span>
                <span class="text-xl font-bold tracking-tight text-white mt-0.5 block leading-tight">
                  ${fmt(currentSummary.paidExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Atalhos Rápidos: [+ Receita] e [+ Despesa] -->
        <div class="grid grid-cols-2 gap-3 pt-0.5">
          <!-- Botão + Receita -->
          <button onclick="window.openIncomeModal('${currentKey}')" 
                  class="bg-[#ebf8ee] dark:bg-[#183622] hover:opacity-95 active:scale-98 transition-all p-3.5 rounded-2xl flex items-center gap-3 border border-[#cbeed2] dark:border-[#235431] shadow-sm text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-[#15803d] dark:text-[#61de8a] shrink-0">
              <span class="material-symbols-outlined text-[24px]">south_west</span>
            </div>
            <div class="min-w-0">
              <span class="font-bold text-xs text-[#15803d] dark:text-[#61de8a] block leading-tight">+ Receita</span>
              <span class="text-[10px] text-[#55695b] dark:text-[#a3e9b8]/80 block truncate mt-0.5 font-medium">Adicionar nova receita</span>
            </div>
          </button>

          <!-- Botão + Despesa -->
          <button onclick="window.openExpenseModal('${currentKey}')" 
                  class="bg-[#fdeeed] dark:bg-[#381c19] hover:opacity-95 active:scale-98 transition-all p-3.5 rounded-2xl flex items-center gap-3 border border-[#fbd4d0] dark:border-[#64231d] shadow-sm text-left cursor-pointer">
            <div class="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-[#b91c1c] dark:text-[#ffb4a9] shrink-0">
              <span class="material-symbols-outlined text-[24px]">north_east</span>
            </div>
            <div class="min-w-0">
              <span class="font-bold text-xs text-[#b91c1c] dark:text-[#ffb4a9] block leading-tight">+ Despesa</span>
              <span class="text-[10px] text-[#735655] dark:text-[#ffdad4]/80 block truncate mt-0.5 font-medium">Adicionar nova despesa</span>
            </div>
          </button>
        </div>

        <!-- Seletor de Meses Segmentado com Seletor de Ano Integrado -->
        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between px-1">
            <span class="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">Navegação Temporal</span>
            <button onclick="window.openYearPickerModal()" 
                    class="px-3.5 py-1.5 rounded-2xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-transparent dark:border-white/5 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
                    title="Alterar Ano">
              <span class="material-symbols-outlined text-[16px]">calendar_month</span>
              <span>Ano: ${selectedYear}</span>
              <span class="material-symbols-outlined text-[15px]">expand_more</span>
            </button>
          </div>

          <div class="bg-[#f4ebe4] dark:bg-[#2b2019] p-1 rounded-full flex items-center gap-1 border border-[#ebdcd1] dark:border-[#3e3027] shadow-inner">
            <button onclick="window.financeStore.setMonthListSection('previous')" 
                    class="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${activeSection === 'previous' ? 'bg-white dark:bg-[#3e3027] text-[#944a00] dark:text-[#ffb783] shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
              Meses anteriores (${selectedYear})
            </button>
            <button onclick="window.financeStore.setMonthListSection('future')" 
                    class="flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${activeSection === 'future' ? 'bg-white dark:bg-[#3e3027] text-[#944a00] dark:text-[#ffb783] shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
              Próximos meses (${selectedYear})
            </button>
          </div>
        </div>

        <!-- Cards Individuais dos Meses com Cor de Fechamento Suave -->
        <div class="space-y-2.5 pt-1 pb-4">
          ${monthsCardsHtml}
        </div>
      </main>
    </div>
  `;
};
