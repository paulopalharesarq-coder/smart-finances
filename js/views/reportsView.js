/**
 * Smart Finances - Reports & Analytics View
 * Interactive category distribution (Donut), monthly evolution (Bars),
 * Period modes (Month, Year, Custom), Status filters, and Category Ranking.
 */

(function () {
  // Global View State for Reports
  window.reportState = window.reportState || {
    type: 'expense',           // 'expense' | 'income'
    periodMode: 'month',       // 'month' | 'year' | 'custom'
    monthKey: null,            // defaults to current month key
    year: null,                // defaults to current year
    startDate: '',             // YYYY-MM-DD for custom range
    endDate: '',               // YYYY-MM-DD for custom range
    status: 'all',             // 'all' | 'paid' | 'pending'
    selectedCategoryId: null   // highlighted category ID in Donut & Ranking
  };

  const fmtCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Format Month Name (e.g., "Setembro de 2026")
  function formatMonthLong(monthKey) {
    if (!monthKey || !monthKey.includes('-')) return monthKey || '';
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    const name = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Adjust Month Key by delta (+1 or -1)
  function shiftMonthKey(monthKey, delta) {
    if (!monthKey || !monthKey.includes('-')) return window.financeStore.getCurrentMonthKey();
    const [y, m] = monthKey.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, '0');
    return `${ny}-${nm}`;
  }

  // Render SVG Donut Chart
  function renderSvgDonut(categories, totalAmount, selectedCatId, isExpense) {
    if (!categories || categories.length === 0 || totalAmount <= 0) {
      return '';
    }

    const cx = 120;
    const cy = 120;
    const R = 90;
    const r = 58;

    let cumulativePct = 0;
    const paths = [];

    // Single category full circle case
    if (categories.length === 1) {
      const cat = categories[0];
      const isSel = selectedCatId === cat.category.id;
      const color = cat.category.textColor || (isExpense ? '#ea7355' : '#309b57');
      const strokeW = isSel ? 36 : 32;

      paths.push(`
        <circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" 
                fill="none" 
                stroke="${color}" 
                stroke-width="${strokeW}" 
                class="cursor-pointer transition-all hover:opacity-90 active:scale-98"
                onclick="window.handleReportCategoryClick('${cat.category.id}')" />
      `);
    } else {
      categories.forEach((cat) => {
        const pct = cat.percentage / 100;
        if (pct <= 0) return;

        const isSel = selectedCatId === cat.category.id;
        const color = cat.category.textColor || (isExpense ? '#ea7355' : '#309b57');
        const outerR = isSel ? R + 5 : R;
        const innerR = isSel ? r - 3 : r;

        const startAngle = 2 * Math.PI * cumulativePct - Math.PI / 2;
        const endAngle = 2 * Math.PI * (cumulativePct + pct) - Math.PI / 2;
        cumulativePct += pct;

        const x1 = cx + outerR * Math.cos(startAngle);
        const y1 = cy + outerR * Math.sin(startAngle);
        const x2 = cx + outerR * Math.cos(endAngle);
        const y2 = cy + outerR * Math.sin(endAngle);
        const x3 = cx + innerR * Math.cos(endAngle);
        const y3 = cy + innerR * Math.sin(endAngle);
        const x4 = cx + innerR * Math.cos(startAngle);
        const y4 = cy + innerR * Math.sin(startAngle);

        const largeArc = pct > 0.5 ? 1 : 0;
        const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

        paths.push(`
          <path d="${d}" 
                fill="${color}" 
                stroke="var(--color-surface, #fff)" 
                stroke-width="1.5"
                class="cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-[0.98] ${isSel ? 'filter drop-shadow-md' : ''}"
                onclick="window.handleReportCategoryClick('${cat.category.id}')" />
        `);
      });
    }

    // Determine Center Details
    const selectedCat = categories.find(c => c.category.id === selectedCatId);
    let centerTitle = isExpense ? 'Total Gasto' : 'Total Recebido';
    let centerValue = fmtCurrency(totalAmount);
    let centerSub = `${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}`;
    let centerColor = 'text-on-surface';

    if (selectedCat) {
      centerTitle = selectedCat.category.name;
      centerValue = fmtCurrency(selectedCat.total);
      centerSub = `${selectedCat.percentage.toFixed(1)}% do total`;
      centerColor = isExpense ? 'text-[#ea7355] dark:text-[#f87171]' : 'text-[#309b57] dark:text-[#4ade80]';
    }

    return `
      <div class="relative w-64 h-64 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 240 240" class="w-full h-full transform -rotate-0 transition-transform">
          ${paths.join('')}
        </svg>
        <!-- Center Info Box -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span class="text-[11px] font-bold text-on-surface-variant truncate max-w-[130px] block leading-tight">
            ${centerTitle}
          </span>
          <span class="font-price-display text-sm sm:text-base font-extrabold ${centerColor} block leading-tight mt-0.5">
            ${centerValue}
          </span>
          <span class="text-[10px] font-semibold text-on-surface-variant/80 block mt-0.5">
            ${centerSub}
          </span>
        </div>
      </div>
    `;
  }

  // Render SVG Monthly Evolution Bar Chart
  function renderSvgBarChart(evolutionData, isExpense) {
    if (!evolutionData || !evolutionData.months) return '';

    const months = evolutionData.months;
    const maxVal = evolutionData.maxMonthlyTotal || 1;
    const barWidth = 14;
    const barGap = 5.5;
    const chartHeight = 110;
    const startX = 6;
    const primaryColor = isExpense ? '#ea7355' : '#309b57';

    const bars = months.map((m, idx) => {
      const x = startX + idx * (barWidth + barGap);
      const h = maxVal > 0 ? Math.max((m.total / maxVal) * (chartHeight - 35), 4) : 4;
      const y = chartHeight - 18 - h;
      const isCurrent = m.isCurrent;
      const barColor = m.total > 0 ? primaryColor : 'rgba(150, 150, 150, 0.2)';

      return `
        <g class="cursor-pointer group" onclick="window.selectReportEvolutionMonth('${m.monthKey}')">
          <title>${m.fullName}: ${fmtCurrency(m.total)}</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" 
                fill="${barColor}" 
                class="transition-all duration-300 group-hover:opacity-80 ${isCurrent ? 'stroke-2 stroke-primary' : ''}" />
          <text x="${x + barWidth / 2}" y="${chartHeight - 4}" 
                text-anchor="middle" 
                font-size="8" 
                font-weight="${isCurrent ? 'bold' : 'normal'}" 
                fill="currentColor" 
                class="text-on-surface-variant fill-current">
            ${m.shortName}
          </text>
        </g>
      `;
    }).join('');

    return `
      <div class="bg-surface-container/60 dark:bg-white/5 rounded-2xl p-4 border border-outline-variant/30 space-y-2">
        <div class="flex justify-between items-center">
          <h3 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
            Evolução Mensal (${evolutionData.year})
          </h3>
          <span class="text-xs font-extrabold ${isExpense ? 'text-[#ea7355] dark:text-[#f87171]' : 'text-[#309b57] dark:text-[#4ade80]'}">
            Total: ${fmtCurrency(evolutionData.annualTotal)}
          </span>
        </div>
        <div class="w-full overflow-x-auto py-1">
          <svg viewBox="0 0 240 120" class="w-full h-28">
            ${bars}
          </svg>
        </div>
      </div>
    `;
  }

  // Main View Render Function
  window.renderReportsView = function () {
    const store = window.financeStore;
    if (!store) return '<div>Carregando...</div>';

    const state = window.reportState;
    if (!state.monthKey) state.monthKey = store.getCurrentMonthKey();
    if (!state.year) state.year = Number(state.monthKey.split('-')[0]) || new Date().getFullYear();
    if (!state.startDate) state.startDate = `${state.year}-01-01`;
    if (!state.endDate) state.endDate = `${state.year}-12-31`;

    const isExpense = state.type === 'expense';

    // Fetch Aggregations from FinanceStore
    const breakdown = store.getReportsBreakdown({
      type: state.type,
      periodMode: state.periodMode,
      monthKey: state.monthKey,
      year: state.year,
      startDate: state.startDate,
      endDate: state.endDate,
      status: state.status
    });

    const evolution = state.periodMode === 'year'
      ? store.getMonthlyEvolution({ type: state.type, year: state.year, status: state.status })
      : null;

    const totalAmount = breakdown.totalAmount;
    const categories = breakdown.categories;
    const maxCat = breakdown.maxCategory;

    // Monthly average for annual mode
    const monthlyAverage = state.periodMode === 'year' ? (totalAmount / 12) : 0;

    return `
      <div id="reports-view-container" class="pb-36 min-h-screen">
        <!-- TopAppBar -->
        <header class="flex justify-between items-center w-full px-5 py-3.5 sticky top-0 bg-background/80 backdrop-blur-md z-30">
          <div class="flex items-center gap-2.5">
            <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-2xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] active:scale-95 transition-all cursor-pointer" title="Voltar para a Home">
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 class="font-headline-xl-mobile text-lg sm:text-xl font-extrabold text-on-surface tracking-tight">
              Relatórios Financeiros
            </h1>
          </div>
        </header>

        <!-- Main Content -->
        <main class="px-5 mt-2 space-y-4">
          
          <!-- 1. Type Selector: Despesas vs Receitas -->
          <div class="grid grid-cols-2 gap-2 p-1 bg-[#faeae0]/60 dark:bg-[#281e17] rounded-2xl border border-outline-variant/15 dark:border-white/5">
            <button type="button" 
                    onclick="window.setReportType('expense')" 
                    class="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isExpense ? 'bg-[#ea7355] dark:bg-[#852f1b] text-white shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
              <span class="material-symbols-outlined text-[16px]">trending_down</span>
              <span>Despesas</span>
            </button>
            <button type="button" 
                    onclick="window.setReportType('income')" 
                    class="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${!isExpense ? 'bg-[#309b57] dark:bg-[#124d27] text-white shadow-sm' : 'text-[#8c7365] dark:text-[#a89487] hover:text-on-surface'}">
              <span class="material-symbols-outlined text-[16px]">trending_up</span>
              <span>Receitas</span>
            </button>
          </div>

          <!-- 2. Period Mode Selector: [ Mês ] [ Ano ] [ Personalizado ] -->
          <div class="grid grid-cols-3 gap-2 p-1 bg-[#faeae0]/40 dark:bg-[#201813] rounded-2xl border border-outline-variant/20 dark:border-white/5">
            <button type="button" 
                    onclick="window.setReportPeriodMode('month')" 
                    class="py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${state.periodMode === 'month' ? 'bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-[#944a00]/30 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              Mês
            </button>
            <button type="button" 
                    onclick="window.setReportPeriodMode('year')" 
                    class="py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${state.periodMode === 'year' ? 'bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-[#944a00]/30 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              Ano
            </button>
            <button type="button" 
                    onclick="window.setReportPeriodMode('custom')" 
                    class="py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${state.periodMode === 'custom' ? 'bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] border border-[#944a00]/30 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">
              Personalizado
            </button>
          </div>

          <!-- 3. Period Sub-controls -->
          <div class="bg-surface-container/60 dark:bg-white/5 rounded-2xl p-3 border border-outline-variant/30 flex items-center justify-between gap-2">
            ${state.periodMode === 'month' ? `
              <button onclick="window.shiftReportMonth(-1)" class="w-8 h-8 rounded-xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div class="text-center font-extrabold text-xs text-on-surface flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                <span>${formatMonthLong(state.monthKey)}</span>
              </div>
              <button onclick="window.shiftReportMonth(1)" class="w-8 h-8 rounded-xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            ` : state.periodMode === 'year' ? `
              <button onclick="window.shiftReportYear(-1)" class="w-8 h-8 rounded-xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <div class="text-center font-extrabold text-xs text-on-surface flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                <span>Ano de ${state.year}</span>
              </div>
              <button onclick="window.shiftReportYear(1)" class="w-8 h-8 rounded-xl bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            ` : `
              <div class="w-full grid grid-cols-2 gap-2">
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-on-surface-variant block">De:</label>
                  <input type="date" value="${state.startDate}" onchange="window.setReportCustomDate('startDate', this.value)" 
                         class="w-full px-3 py-1.5 bg-[#faeae0] dark:bg-[#332218] rounded-xl border border-transparent dark:border-white/5 focus:border-[#944a00] dark:focus:border-[#ffb783] text-xs font-semibold text-on-surface">
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-bold text-on-surface-variant block">Até:</label>
                  <input type="date" value="${state.endDate}" onchange="window.setReportCustomDate('endDate', this.value)" 
                         class="w-full px-3 py-1.5 bg-[#faeae0] dark:bg-[#332218] rounded-xl border border-transparent dark:border-white/5 focus:border-[#944a00] dark:focus:border-[#ffb783] text-xs font-semibold text-on-surface">
                </div>
              </div>
            `}
          </div>

          <!-- 4. Status Filter Pills: [ Todas ] [ Pagas ] [ Pendentes ] -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <span class="text-[11px] font-bold text-on-surface-variant shrink-0">Status:</span>
            <button type="button" onclick="window.setReportStatus('all')" 
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${state.status === 'all' ? (isExpense ? 'bg-[#ea7355] dark:bg-[#852f1b] text-white' : 'bg-[#309b57] dark:bg-[#124d27] text-white') : 'bg-[#faeae0]/60 dark:bg-[#281e17] text-[#8c7365] dark:text-[#a89487]'}">
              Todas
            </button>
            <button type="button" onclick="window.setReportStatus('paid')" 
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${state.status === 'paid' ? 'bg-[#dcfce7] dark:bg-[#0f2e1b] text-[#15803d] dark:text-[#86efac] border border-[#86efac] dark:border-[#166534]' : 'bg-[#faeae0]/60 dark:bg-[#281e17] text-[#8c7365] dark:text-[#a89487]'}">
              ${isExpense ? 'Pagas' : 'Recebidas'}
            </button>
            <button type="button" onclick="window.setReportStatus('pending')" 
                    class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${state.status === 'pending' ? (isExpense ? 'bg-[#fee2e2] dark:bg-[#3b1212] text-[#dc2626] dark:text-[#fca5a5] border border-[#fca5a5] dark:border-[#7f1d1d]' : 'bg-[#e0f2fe] dark:bg-[#0c2438] text-[#0284c7] dark:text-[#7dd3fc] border border-[#7dd3fc] dark:border-[#075985]') : 'bg-[#faeae0]/60 dark:bg-[#281e17] text-[#8c7365] dark:text-[#a89487]'}">
              ${isExpense ? 'Pendentes' : 'Previstas'}
            </button>
          </div>

          <!-- 5. Metrics Summary Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <!-- Total Gasto / Recebido -->
            <div class="p-3.5 rounded-2xl bg-surface-container/70 dark:bg-white/5 border border-outline-variant/30 shadow-sm space-y-1">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                ${isExpense ? 'Total Gasto' : 'Total Recebido'}
              </span>
              <span class="font-price-display text-base sm:text-lg font-extrabold ${isExpense ? 'text-[#ea7355] dark:text-[#f87171]' : 'text-[#309b57] dark:text-[#4ade80]'} block leading-tight">
                ${fmtCurrency(totalAmount)}
              </span>
              <span class="text-[10px] text-on-surface-variant block">
                ${breakdown.totalCount} ${breakdown.totalCount === 1 ? 'lançamento' : 'lançamentos'}
              </span>
            </div>

            <!-- Maior Categoria -->
            <div class="p-3.5 rounded-2xl bg-surface-container/70 dark:bg-white/5 border border-outline-variant/30 shadow-sm space-y-1">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                Maior Categoria
              </span>
              <span class="text-xs sm:text-sm font-bold text-on-surface truncate block leading-tight">
                ${maxCat ? maxCat.category.name : 'Nenhuma'}
              </span>
              <span class="font-price-display text-xs font-bold text-on-surface-variant block">
                ${maxCat ? fmtCurrency(maxCat.total) : 'R$ 0,00'}
              </span>
            </div>

            <!-- Média Mensal / Contexto -->
            <div class="p-3.5 rounded-2xl bg-surface-container/70 dark:bg-white/5 border border-outline-variant/30 shadow-sm space-y-1 col-span-2 sm:col-span-1">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">
                ${state.periodMode === 'year' ? 'Média Mensal' : 'Categorias'}
              </span>
              <span class="font-price-display text-base sm:text-lg font-extrabold text-on-surface block leading-tight">
                ${state.periodMode === 'year' ? fmtCurrency(monthlyAverage) : `${categories.length} ativas`}
              </span>
              <span class="text-[10px] text-on-surface-variant block">
                ${state.periodMode === 'year' ? 'Base em 12 meses' : 'Neste período'}
              </span>
            </div>
          </div>

          <!-- 6. Donut Chart Section -->
          <section class="p-4 rounded-3xl bg-surface-container/50 dark:bg-white/5 border border-outline-variant/30 space-y-3">
            <div class="flex justify-between items-center">
              <h2 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                Distribuição por Categoria
              </h2>
              ${state.selectedCategoryId ? `
                <button onclick="window.handleReportCategoryClick(null)" class="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                  Ver Total
                </button>
              ` : ''}
            </div>

            ${totalAmount > 0 ? `
              ${renderSvgDonut(categories, totalAmount, state.selectedCategoryId, isExpense)}
              <p class="text-[11px] text-center text-on-surface-variant font-medium">
                Toque em uma fatia ou na lista abaixo para detalhar a categoria.
              </p>
            ` : `
              <!-- Empty State -->
              <div class="py-8 px-4 text-center flex flex-col items-center justify-center gap-2.5">
                <div class="w-14 h-14 rounded-2xl bg-surface-container dark:bg-white/5 text-outline flex items-center justify-center shadow-inner">
                  <span class="material-symbols-outlined text-3xl text-primary">pie_chart_outline</span>
                </div>
                <div>
                  <h3 class="font-bold text-sm text-on-surface">Nenhum lançamento neste período</h3>
                  <p class="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-[260px] mx-auto">
                    Adicione ${isExpense ? 'despesas' : 'receitas'} ou ajuste o filtro de período para visualizar seus relatórios.
                  </p>
                </div>
              </div>
            `}
          </section>

          <!-- 7. Monthly Evolution Chart (Only in Year Mode) -->
          ${state.periodMode === 'year' && evolution ? `
            ${renderSvgBarChart(evolution, isExpense)}
          ` : ''}

          <!-- 8. Ranked Categories List -->
          <section class="space-y-2.5 pt-1">
            <div class="flex justify-between items-center">
              <h2 class="font-headline-md text-xs font-bold text-on-surface uppercase tracking-wider">
                Ranking de ${isExpense ? 'Gastos' : 'Recebimentos'}
              </h2>
              <span class="text-xs font-bold text-on-surface-variant">
                ${categories.length} ${categories.length === 1 ? 'categoria' : 'categorias'}
              </span>
            </div>

            <div class="space-y-2">
              ${categories.length > 0 ? categories.map((item, idx) => {
                const isSelected = state.selectedCategoryId === item.category.id;
                const pct = item.percentage.toFixed(1);
                const color = item.category.textColor || (isExpense ? '#ea7355' : '#309b57');

                return `
                  <div onclick="window.handleReportCategoryClick('${item.category.id}')" 
                       class="p-3.5 rounded-2xl bg-surface-container/70 dark:bg-white/5 border border-outline-variant/30 transition-all cursor-pointer active:scale-[0.99] ${isSelected ? 'ring-2 ring-primary shadow-md bg-[#faeae0]/60 dark:bg-[#332218]/60' : 'hover:border-primary/40'}">
                    <div class="flex items-center justify-between gap-3">
                      <!-- Icon and Category Name -->
                      <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-xs font-bold" 
                             style="background-color: ${item.category.bgColor}; color: ${item.category.textColor}">
                          <span class="material-symbols-outlined text-[18px]">${item.category.icon || 'category'}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <h4 class="font-bold text-xs text-on-surface truncate">${item.category.name}</h4>
                          <span class="text-[10px] text-on-surface-variant font-medium">
                            ${item.count} ${item.count === 1 ? 'lançamento' : 'lançamentos'}
                          </span>
                        </div>
                      </div>

                      <!-- Amount & Percentage -->
                      <div class="text-right shrink-0">
                        <span class="font-price-display text-xs sm:text-sm font-extrabold text-on-surface block leading-tight">
                          ${fmtCurrency(item.total)}
                        </span>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#faeae0] dark:bg-[#332218] text-[#944a00] dark:text-[#ffb783] inline-block mt-0.5">
                          ${pct}%
                        </span>
                      </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="w-full bg-surface-variant/50 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mt-2.5">
                      <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${color}"></div>
                    </div>
                  </div>
                `;
              }).join('') : `
                <div class="text-center py-6 bg-surface-container/40 dark:bg-white/5 rounded-2xl border border-outline-variant/30">
                  <p class="text-xs text-on-surface-variant font-medium">Nenhuma categoria registrada para os filtros selecionados.</p>
                </div>
              `}
            </div>
          </section>

        </main>
      </div>
    `;
  };

  // State Change Handlers
  window.setReportType = function (type) {
    window.reportState.type = type;
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.setReportPeriodMode = function (mode) {
    window.reportState.periodMode = mode;
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.setReportStatus = function (status) {
    window.reportState.status = status;
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.shiftReportMonth = function (delta) {
    window.reportState.monthKey = shiftMonthKey(window.reportState.monthKey, delta);
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.shiftReportYear = function (delta) {
    window.reportState.year = (window.reportState.year || new Date().getFullYear()) + delta;
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.setReportCustomDate = function (field, value) {
    if (!value) return;
    if (field === 'startDate') {
      window.reportState.startDate = value;
      if (window.reportState.endDate && value > window.reportState.endDate) {
        window.reportState.endDate = value;
      }
    }
    if (field === 'endDate') {
      window.reportState.endDate = value;
      if (window.reportState.startDate && value < window.reportState.startDate) {
        window.reportState.startDate = value;
      }
    }
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.handleReportCategoryClick = function (catId) {
    if (window.reportState.selectedCategoryId === catId) {
      window.reportState.selectedCategoryId = null; // Toggle off
    } else {
      window.reportState.selectedCategoryId = catId;
    }
    window.refreshReportsView();
  };

  window.selectReportEvolutionMonth = function (monthKey) {
    window.reportState.periodMode = 'month';
    window.reportState.monthKey = monthKey;
    window.reportState.selectedCategoryId = null;
    window.refreshReportsView();
  };

  window.refreshReportsView = function () {
    const container = document.getElementById('reports-view-container');
    if (container) {
      container.outerHTML = window.renderReportsView();
    } else if (typeof window.renderApp === 'function') {
      window.renderApp();
    }
  };
})();
