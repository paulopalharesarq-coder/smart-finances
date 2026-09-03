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

  // Dynamic color for monthly balance
  let forecastColorClass = 'text-white';
  if (currentSummary.forecastBalance > 0) {
    forecastColorClass = 'text-[#82f5b5]'; // Verde suave
  } else if (currentSummary.forecastBalance < 0) {
    forecastColorClass = 'text-[#ffdad4]'; // Vermelho suave
  }

  const monthsCardsHtml = monthList.length > 0 ? monthList.map(m => {
    const summary = store.calculateMonthSummary(m.key);
    const val = summary.forecastBalance;
    const isPositive = val > 0;
    const isNegative = val < 0;
    const shortName = m.name.split(' ')[0];

    // Subtle closing tone class
    const cardToneClass = isPositive ? 'month-card-positive' : isNegative ? 'month-card-negative' : 'month-card-neutral';

    return `
      <div onclick="window.financeStore.openMonthDetail('${m.key}')" 
           class="month-card-item ${cardToneClass} rounded-2xl p-4 flex justify-between items-center cursor-pointer group active:scale-[0.99] transition-all shadow-sm">
        <!-- Lado Esquerdo: Nome do Mês -->
        <div class="flex items-center gap-3">
          <h3 class="font-body-lg text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors">
            ${shortName}
          </h3>
        </div>

        <!-- Lado Direito: Balanço Mensal e Seta -->
        <div class="flex items-center gap-3">
          <div class="text-right">
            <span class="font-price-display text-sm font-extrabold ${isNegative ? 'text-[#dc2626] dark:text-[#ffb4ab]' : isPositive ? 'text-[#15803d] dark:text-[#61de8a]' : 'text-on-surface-variant'} block leading-tight">
              ${fmt(val)}
            </span>
            <span class="text-[10px] text-on-surface-variant/80 font-medium block mt-0.5">
              Balanço mensal
            </span>
          </div>
          <span class="material-symbols-outlined text-[20px] text-outline/80 group-hover:translate-x-0.5 group-hover:text-primary transition-all">
            chevron_right
          </span>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="py-8 text-center bg-surface-container/40 rounded-2xl border border-dashed border-outline-variant/40 p-4">
      <span class="material-symbols-outlined text-3xl text-outline mb-1">calendar_today</span>
      <h4 class="font-body-lg text-xs font-bold text-on-surface">Nenhum mês ${activeSection === 'previous' ? 'anterior' : 'futuro'} em ${selectedYear}</h4>
      <p class="text-[11px] text-on-surface-variant mt-0.5">Use o seletor de ano superior para navegar por outros anos.</p>
    </div>
  `;

  return `
    <div class="pb-36">
      <!-- TopAppBar: Avatar com Foto/Silhueta, Saudação, Nome e Notificações -->
      <header class="flex justify-between items-center w-full px-5 pt-4 pb-2 bg-background sticky top-0 z-30">
        <div class="flex items-center gap-3.5 cursor-pointer" onclick="window.financeStore.setActiveTab('settings')">
          <!-- Avatar Circular com Foto ou Ícone Oficial Padrão -->
          <div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/30">
            ${userPhoto ? `
              <img src="${userPhoto}" alt="${userName}" class="w-full h-full object-cover">
            ` : `
              <img src="./icons/icon-192.png" alt="${userName}" class="w-full h-full object-cover">
            `}
          </div>
          <div class="flex flex-col">
            <span class="text-xs text-[#8c7462] dark:text-[#b89f8d] font-medium leading-tight">Bem vindo novamente</span>
            <h1 class="text-xl font-extrabold text-[#1c1917] dark:text-[#fcf6f2] tracking-tight leading-snug mt-0.5">
              ${userName}
            </h1>
          </div>
        </div>

        <!-- Botão de Notificações -->
        <button onclick="window.showToast('Você não tem novas notificações no momento.', 'info')" 
                class="w-11 h-11 rounded-2xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer" 
                title="Notificações">
          <span class="material-symbols-outlined text-[22px]">notifications</span>
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
                    class="px-2.5 py-1 bg-surface-container hover:bg-surface-variant rounded-xl border border-outline-variant/40 text-[11px] font-bold text-primary flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer">
              <span class="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>Ano: ${selectedYear}</span>
              <span class="material-symbols-outlined text-[14px]">expand_more</span>
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
