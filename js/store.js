/**
 * Smart Finances - Core Financial State & Business Logic Engine
 * 
 * Single Amount Data Model (amount):
 * - Status determines realized vs planned.
 * - Month entity aggregation with dynamic year navigation.
 * - Explicit Carryover Rule: Previous month remaining balance is NOT automatic.
 * - Installment distribution (bidirectional with intermediate installment support).
 * - Controlled recurring expenses horizon.
 * - Full Category CRUD and "Outras despesas" default fallback.
 * - Chronological date sorting for expenses and incomes.
 */

const STORAGE_KEY = 'stitch_smart_finances_v1';

const DEFAULT_EXPENSE_CATEGORIES = [
  {
    id: 'moradia',
    name: 'Moradia',
    type: 'expense',
    icon: 'home',
    bgColor: '#dbeafe',
    textColor: '#1d4ed8',
    borderColor: '#bfdbfe',
    cardBgLight: '#edf5ff', // Blue Pastel
    cardBgDark: '#102447',  // Deep Navy
    cardBorderLight: '#bfdbfe',
    cardBorderDark: '#1e3a8a',
    order: 1
  },
  {
    id: 'alimentacao',
    name: 'Alimentação',
    type: 'expense',
    icon: 'restaurant',
    bgColor: '#dcfce7',
    textColor: '#15803d',
    borderColor: '#bbf7d0',
    cardBgLight: '#effcf2', // Green Pastel
    cardBgDark: '#0c2d16',  // Deep Forest Green
    cardBorderLight: '#bbf7d0',
    cardBorderDark: '#155e2e',
    order: 2
  },
  {
    id: 'transporte',
    name: 'Transporte',
    type: 'expense',
    icon: 'directions_car',
    bgColor: '#e0f2fe',
    textColor: '#0284c7',
    borderColor: '#bae6fd',
    cardBgLight: '#f0f9ff', // Sky Blue Pastel
    cardBgDark: '#082f49',  // Deep Sky Dark
    cardBorderLight: '#bae6fd',
    cardBorderDark: '#075985',
    order: 3
  },
  {
    id: 'saude',
    name: 'Saúde',
    type: 'expense',
    icon: 'medical_services',
    bgColor: '#ffe4e6',
    textColor: '#e11d48',
    borderColor: '#fecdd3',
    cardBgLight: '#fff1f3', // Rose / Pink Pastel
    cardBgDark: '#3b0d18',  // Deep Rose
    cardBorderLight: '#fecdd6',
    cardBorderDark: '#6b152b',
    order: 4
  },
  {
    id: 'vestuario',
    name: 'Vestuário',
    type: 'expense',
    icon: 'checkroom',
    bgColor: '#fce7f3',
    textColor: '#c026d3',
    borderColor: '#fbcfe8',
    cardBgLight: '#fdf4ff', // Fuchsia / Magenta Pastel
    cardBgDark: '#380a42',  // Deep Magenta
    cardBorderLight: '#f5d0fe',
    cardBorderDark: '#701a75',
    order: 5
  },
  {
    id: 'contas',
    name: 'Contas e serviços',
    type: 'expense',
    icon: 'receipt_long',
    bgColor: '#fef08a',
    textColor: '#ca8a04',
    borderColor: '#fde047',
    cardBgLight: '#fefce8', // Amber / Yellow Pastel
    cardBgDark: '#382305',  // Deep Amber
    cardBorderLight: '#fde047',
    cardBorderDark: '#6b4609',
    order: 6
  },
  {
    id: 'viagem',
    name: 'Viagem',
    type: 'expense',
    icon: 'flight',
    bgColor: '#e0e7ff',
    textColor: '#4338ca',
    borderColor: '#c7d2fe',
    cardBgLight: '#eef2ff', // Indigo Pastel
    cardBgDark: '#1e1b4b',  // Deep Indigo
    cardBorderLight: '#c7d2fe',
    cardBorderDark: '#3730a3',
    order: 7
  },
  {
    id: 'lazer',
    name: 'Lazer',
    type: 'expense',
    icon: 'sports_esports',
    bgColor: '#f3e8ff',
    textColor: '#9333ea',
    borderColor: '#e9d5ff',
    cardBgLight: '#faf5ff', // Violet Pastel
    cardBgDark: '#2b0b47',  // Deep Violet
    cardBorderLight: '#e9d5ff',
    cardBorderDark: '#581c87',
    order: 8
  },
  {
    id: 'educacao',
    name: 'Educação',
    type: 'expense',
    icon: 'school',
    bgColor: '#ccfbf1',
    textColor: '#0d9488',
    borderColor: '#99f6e4',
    cardBgLight: '#f0fdfa', // Teal Pastel
    cardBgDark: '#062b27',  // Deep Teal
    cardBorderLight: '#99f6e4',
    cardBorderDark: '#115e59',
    order: 9
  },
  {
    id: 'outras_despesas',
    name: 'Outras despesas',
    type: 'expense',
    icon: 'more_horiz',
    bgColor: '#f2dfd4',
    textColor: '#564337',
    borderColor: '#dcc1b1',
    cardBgLight: '#faf8f6', // Neutral Warm Pastel
    cardBgDark: '#271d17',  // Deep Warm Neutral
    cardBorderLight: '#ede3dc',
    cardBorderDark: '#443329',
    order: 10
  }
];

const DEFAULT_INCOME_CATEGORIES = [
  {
    id: 'salario',
    name: 'Salário & Proventos',
    type: 'income',
    icon: 'work',
    bgColor: '#dcfce7',
    textColor: '#15803d',
    borderColor: '#bbf7d0',
    cardBgLight: '#effcf2',
    cardBgDark: '#052e16',
    cardBorderLight: '#bbf7d0',
    cardBorderDark: '#166534',
    order: 1
  },
  {
    id: 'investimentos',
    name: 'Rendimentos & Investimentos',
    type: 'income',
    icon: 'trending_up',
    bgColor: '#e0f2fe',
    textColor: '#0369a1',
    borderColor: '#bae6fd',
    cardBgLight: '#f0f9ff',
    cardBgDark: '#082f49',
    cardBorderLight: '#bae6fd',
    cardBorderDark: '#075985',
    order: 2
  },
  {
    id: 'freelance',
    name: 'Freelance & Serviços',
    type: 'income',
    icon: 'laptop_mac',
    bgColor: '#fef08a',
    textColor: '#b45309',
    borderColor: '#fde047',
    cardBgLight: '#fffbeb',
    cardBgDark: '#3b1c06',
    cardBorderLight: '#fde68a',
    cardBorderDark: '#6b370d',
    order: 3
  },
  {
    id: 'reembolsos',
    name: 'Reembolsos',
    type: 'income',
    icon: 'assignment_return',
    bgColor: '#ccfbf1',
    textColor: '#0f766e',
    borderColor: '#99f6e4',
    cardBgLight: '#f0fdfa',
    cardBgDark: '#042f2e',
    cardBorderLight: '#99f6e4',
    cardBorderDark: '#115e59',
    order: 4
  },
  {
    id: 'saldo_anterior',
    name: 'Saldo Trazido Anterior',
    type: 'income',
    icon: 'move_to_inbox',
    bgColor: '#ffedd5',
    textColor: '#c2410c',
    borderColor: '#fed7aa',
    cardBgLight: '#fff7ed',
    cardBgDark: '#3a1508',
    cardBorderLight: '#fed7aa',
    cardBorderDark: '#6e2a0f',
    order: 5
  },
  {
    id: 'outras_receitas',
    name: 'Outras Receitas',
    type: 'income',
    icon: 'attach_money',
    bgColor: '#f3e8ff',
    textColor: '#7e22ce',
    borderColor: '#e9d5ff',
    cardBgLight: '#faf5ff',
    cardBgDark: '#2d0b47',
    cardBorderLight: '#e9d5ff',
    cardBorderDark: '#5b1c87',
    order: 6
  }
];

// Helper to format Date string to YYYY-MM
function getCurrentMonthKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to format Month Name (e.g., "Setembro 2026")
function formatMonthName(monthKey) {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const name = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Helper to format Short Month / Year (e.g., "Set/2026")
function formatShortMonthYear(monthKey) {
  if (!monthKey || !monthKey.includes('-')) return monthKey || '';
  const [year, month] = monthKey.split('-').map(Number);
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mName = monthNames[month - 1] || String(month);
  return `${mName}/${year}`;
}

// Helper to calculate next / prev month key
function getAdjacentMonthKey(monthKey, delta) {
  if (!monthKey || !monthKey.includes('-')) return getCurrentMonthKey();
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

class FinanceStore {
  constructor() {
    this.subscribers = [];
    this.state = this.loadState();
    this.ensureCurrentMonthInitialized();
  }

  loadState() {
    let themePref = 'system';
    try {
      themePref = localStorage.getItem('stitch_theme_preference') || 'system';
    } catch (e) {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.themePreference = themePref || parsed.themePreference || 'system';
        
        // Merge & update category color tokens into loaded categories
        const defaultCatsMap = {};
        [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].forEach(dc => {
          defaultCatsMap[dc.id] = dc;
        });

        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
        } else {
          // Normalize existing categories and ensure all default 10 expense categories are present
          const existingIds = new Set(parsed.categories.map(c => c.id));
          
          parsed.categories = parsed.categories.map(c => {
            const def = defaultCatsMap[c.id];
            if (def) {
              return { 
                ...def, 
                ...c, 
                name: def.name || c.name,
                cardBgLight: def.cardBgLight, 
                cardBgDark: def.cardBgDark, 
                cardBorderLight: def.cardBorderLight, 
                cardBorderDark: def.cardBorderDark, 
                textColor: def.textColor, 
                bgColor: def.bgColor, 
                borderColor: def.borderColor 
              };
            }
            return c;
          });

          // Add any missing default categories
          [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].forEach(dc => {
            if (!existingIds.has(dc.id)) {
              parsed.categories.push(dc);
            }
          });
        }

        if (!parsed.months) parsed.months = {};
        if (!parsed.expenses) parsed.expenses = [];
        if (!parsed.incomes) parsed.incomes = [];
        if (!parsed.installmentPlans) parsed.installmentPlans = [];
        if (!parsed.recurringRules) parsed.recurringRules = [];
        if (!parsed.payeesPayers) parsed.payeesPayers = [];
        if (parsed.profileConfigured === undefined) {
          parsed.profileConfigured = Boolean(parsed.userName && parsed.userName.trim().length > 0);
        }
        
        // Normalize single-amount migration if existing data had plannedAmount
        parsed.expenses.forEach(e => {
          if (e.amount === undefined && e.plannedAmount !== undefined) {
            e.amount = Number(e.plannedAmount) || 0;
          }
          if (!e.categoryId) {
            e.categoryId = 'outras_despesas';
          }
        });
        parsed.incomes.forEach(i => {
          if (i.amount === undefined && i.plannedAmount !== undefined) {
            i.amount = Number(i.plannedAmount) || 0;
          }
          if (!i.categoryId) {
            i.categoryId = 'outras_receitas';
          }
        });
        return parsed;
      }
    } catch (e) {
      console.error('[FinanceStore] Error loading state from localStorage:', e);
    }

    const currentKey = getCurrentMonthKey();
    const initialMonths = {};
    
    // Create only the current month initially
    initialMonths[currentKey] = {
      key: currentKey,
      name: formatMonthName(currentKey),
      status: 'open',
      carriedBalance: 0,
      carriedBalanceAccepted: false,
      notes: '',
      closedAt: null,
      createdAt: new Date().toISOString()
    };

    return {
      activeTab: 'home',
      selectedMonthKey: currentKey,
      monthDetailTab: 'expenses',
      monthFilterCategory: 'all',
      monthFilterStatus: 'all',
      monthFilterPayeePayer: 'all',
      monthFilterPaymentMethod: 'all',
      monthSearchQuery: '',
      monthListSection: 'previous',
      selectedYearFilter: null,
      userName: '',
      userPhoto: '',
      profileConfigured: false,
      hideBalances: false,
      themePreference: themePref,
      categories: [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES],
      months: initialMonths,
      expenses: [],
      incomes: [],
      installmentPlans: [],
      recurringRules: [],
      payeesPayers: []
    };
  }

  // Profile Management
  saveProfile({ userName, userPhoto }) {
    if (userName !== undefined) this.state.userName = (userName || '').trim();
    if (userPhoto !== undefined) this.state.userPhoto = userPhoto || '';
    this.state.profileConfigured = true;
    this.saveState();
  }

  isProfileConfigured() {
    return Boolean(this.state.profileConfigured && this.state.userName && this.state.userName.trim().length > 0);
  }

  toggleHideBalances() {
    this.state.hideBalances = !this.state.hideBalances;
    this.saveState();
  }

  saveState() {
    try {
      // Create a clean copy to persist without saving temporary search/filter states permanently
      const stateToPersist = {
        ...this.state,
        monthFilterCategory: 'all',
        monthFilterStatus: 'all',
        monthFilterPayeePayer: 'all',
        monthFilterPaymentMethod: 'all',
        monthSearchQuery: ''
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      this.notify();
    } catch (e) {
      console.error('[FinanceStore] Error saving state to localStorage:', e);
    }
  }

  saveStateSilently() {
    try {
      const stateToPersist = {
        ...this.state,
        monthFilterCategory: 'all',
        monthFilterStatus: 'all',
        monthFilterPayeePayer: 'all',
        monthFilterPaymentMethod: 'all',
        monthSearchQuery: ''
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.error('[FinanceStore] Error saving state quietly:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('[FinanceStore] Error in subscriber notification:', err);
      }
    });
  }

  // Ensure current month initialized
  ensureCurrentMonthInitialized() {
    const currentKey = getCurrentMonthKey();
    this.ensureMonthExists(currentKey);
  }

  ensureMonthExists(monthKey) {
    if (!this.state.months) this.state.months = {};
    if (!this.state.months[monthKey]) {
      this.state.months[monthKey] = {
        key: monthKey,
        name: formatMonthName(monthKey),
        status: 'open',
        carriedBalance: 0,
        carriedBalanceAccepted: false,
        notes: '',
        closedAt: null,
        createdAt: new Date().toISOString()
      };
      this.saveState();
    }
    return this.state.months[monthKey];
  }

  // Theme Management
  setThemePreference(pref) {
    if (!['system', 'light', 'dark'].includes(pref)) return;
    this.state.themePreference = pref;
    try {
      localStorage.setItem('stitch_theme_preference', pref);
    } catch (e) {}
    if (typeof window !== 'undefined' && typeof window.applyThemePreference === 'function') {
      window.applyThemePreference(pref);
    }
    this.saveState();
  }

  // Navigation & View State
  setActiveTab(tab) {
    // Requirement 1: Always reset month filters whenever navigating away from month screen
    if (this.state.activeTab === 'month' && tab !== 'month') {
      this.clearMonthFilters(false);
    }
    this.state.activeTab = tab;
    this.saveState();
  }

  setSelectedMonth(monthKey) {
    this.ensureMonthExists(monthKey);
    this.state.selectedMonthKey = monthKey;
    this.saveState();
  }

  openMonthDetail(monthKey, defaultSubTab = 'expenses') {
    this.ensureMonthExists(monthKey);
    // Requirement 1: Always reset month filters when opening month detail screen
    this.clearMonthFilters(false);
    this.state.selectedMonthKey = monthKey;
    this.state.monthDetailTab = defaultSubTab;
    this.state.activeTab = 'month';
    this.saveState();
  }

  setMonthDetailTab(tab) {
    if (tab === 'expenses' || tab === 'incomes') {
      this.state.monthDetailTab = tab;
      this.saveState();
    }
  }

  setMonthListSection(section) {
    if (section === 'previous' || section === 'future') {
      this.state.monthListSection = section;
      this.saveState();
    }
  }

  setSelectedYearFilter(year) {
    this.state.selectedYearFilter = year || null;
    this.saveState();
  }

  setMonthSearchQuery(query) {
    this.state.monthSearchQuery = query || '';
    this.saveStateSilently();
  }

  setMonthFilterCategory(catId) {
    this.state.monthFilterCategory = catId || 'all';
    this.saveState();
  }

  setMonthFilterStatus(status) {
    this.state.monthFilterStatus = status || 'all';
    this.saveState();
  }

  setMonthFilterPayeePayer(val) {
    this.state.monthFilterPayeePayer = val || 'all';
    this.saveState();
  }

  clearMonthFilters(shouldSave = true) {
    this.state.monthFilterCategory = 'all';
    this.state.monthFilterStatus = 'all';
    this.state.monthFilterPayeePayer = 'all';
    this.state.monthFilterPaymentMethod = 'all';
    this.state.monthSearchQuery = '';
    if (shouldSave) {
      this.saveState();
    }
  }

  hasActiveFilters() {
    return Boolean(
      (this.state.monthFilterCategory && this.state.monthFilterCategory !== 'all') ||
      (this.state.monthFilterStatus && this.state.monthFilterStatus !== 'all') ||
      (this.state.monthFilterPayeePayer && this.state.monthFilterPayeePayer !== 'all') ||
      (this.state.monthSearchQuery && this.state.monthSearchQuery.trim().length > 0)
    );
  }

  formatShortMonthYear(monthKey) {
    return formatShortMonthYear(monthKey);
  }

  // Month Entity Getters
  getCurrentMonthKey() {
    return getCurrentMonthKey();
  }

  getSelectedMonthKey() {
    return this.state.selectedMonthKey || getCurrentMonthKey();
  }

  getMonth(monthKey) {
    if (!monthKey) return null;
    return this.state.months[monthKey] || this.ensureMonthExists(monthKey);
  }

  setSelectedYear(year) {
    this.state.selectedYear = parseInt(year, 10) || new Date().getFullYear();
    this.saveState();
  }

  getSelectedYear() {
    return this.state.selectedYear || new Date().getFullYear();
  }

  getPreviousMonthsList() {
    const currentKey = getCurrentMonthKey();
    const [currentY, currentM] = currentKey.split('-').map(Number);
    const selectedY = this.getSelectedYear();
    const months = [];

    if (selectedY === currentY) {
      for (let m = currentM - 1; m >= 1; m--) {
        const mKey = `${selectedY}-${String(m).padStart(2, '0')}`;
        months.push({
          key: mKey,
          name: formatMonthName(mKey),
          status: this.state.months[mKey]?.status || 'closed'
        });
      }
    } else if (selectedY < currentY) {
      for (let m = 12; m >= 1; m--) {
        const mKey = `${selectedY}-${String(m).padStart(2, '0')}`;
        months.push({
          key: mKey,
          name: formatMonthName(mKey),
          status: this.state.months[mKey]?.status || 'closed'
        });
      }
    }

    return months;
  }

  getFutureMonthsList() {
    const currentKey = getCurrentMonthKey();
    const [currentY, currentM] = currentKey.split('-').map(Number);
    const selectedY = this.getSelectedYear();
    const months = [];

    if (selectedY === currentY) {
      for (let m = currentM + 1; m <= 12; m++) {
        const mKey = `${selectedY}-${String(m).padStart(2, '0')}`;
        months.push({
          key: mKey,
          name: formatMonthName(mKey),
          status: this.state.months[mKey]?.status || 'open'
        });
      }
    } else if (selectedY > currentY) {
      for (let m = 1; m <= 12; m++) {
        const mKey = `${selectedY}-${String(m).padStart(2, '0')}`;
        months.push({
          key: mKey,
          name: formatMonthName(mKey),
          status: this.state.months[mKey]?.status || 'open'
        });
      }
    }

    return months;
  }

  getAllMonthsList() {
    const currentKey = getCurrentMonthKey();
    const monthsMap = { ...this.state.months };
    if (!monthsMap[currentKey]) {
      monthsMap[currentKey] = this.ensureMonthExists(currentKey);
    }
    return Object.values(monthsMap);
  }

  // Categories CRUD & Color Management
  getCategories(type = null) {
    if (!this.state.categories) return [];
    if (!type || type === 'all') return this.state.categories;
    return this.state.categories.filter(c => c.type === type || c.type === 'both');
  }

  getCategoryById(id) {
    if (!id) {
      return {
        id: 'outras_despesas',
        name: 'Outras despesas',
        icon: 'more_horiz',
        bgColor: '#f2dfd4',
        textColor: '#564337',
        borderColor: '#dcc1b1',
        cardBgLight: '#faf8f6',
        cardBgDark: '#271d17',
        cardBorderLight: '#ede3dc',
        cardBorderDark: '#443329'
      };
    }
    return this.state.categories.find(c => c.id === id) || {
      id: id,
      name: 'Outras despesas',
      icon: 'more_horiz',
      bgColor: '#f2dfd4',
      textColor: '#564337',
      borderColor: '#dcc1b1',
      cardBgLight: '#faf8f6',
      cardBgDark: '#271d17',
      cardBorderLight: '#ede3dc',
      cardBorderDark: '#443329'
    };
  }

  addCategory(category) {
    if (!category || !category.name) return null;
    const catId = category.id || ('cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
    
    const newCat = {
      id: catId,
      name: (category.name || '').trim(),
      type: category.type || 'expense',
      icon: category.icon || 'category',
      bgColor: category.bgColor || '#f2dfd4',
      textColor: category.textColor || '#564337',
      borderColor: category.borderColor || '#dcc1b1',
      cardBgLight: category.cardBgLight || '#faf8f6',
      cardBgDark: category.cardBgDark || '#271d17',
      cardBorderLight: category.cardBorderLight || '#ede3dc',
      cardBorderDark: category.cardBorderDark || '#443329',
      order: (this.state.categories?.length || 0) + 1
    };

    if (!this.state.categories) this.state.categories = [];
    this.state.categories.push(newCat);
    this.saveState();
    return newCat;
  }

  updateCategory(id, updates) {
    if (!id || !this.state.categories) return null;
    const index = this.state.categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.state.categories[index] = {
      ...this.state.categories[index],
      ...updates
    };
    this.saveState();
    return this.state.categories[index];
  }

  deleteCategory(id) {
    if (!id || !this.state.categories) return false;
    
    // Fallback safe reassignment: reassign all expenses/incomes to 'outras_despesas' / 'outras_receitas'
    const targetCat = this.getCategoryById(id);
    const fallbackId = targetCat.type === 'income' ? 'outras_receitas' : 'outras_despesas';

    if (this.state.expenses) {
      this.state.expenses.forEach(e => {
        if (e.categoryId === id) e.categoryId = fallbackId;
      });
    }
    if (this.state.incomes) {
      this.state.incomes.forEach(i => {
        if (i.categoryId === id) i.categoryId = fallbackId;
      });
    }

    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.saveState();
    return true;
  }

  getCategoryCardStyles(catInput) {
    const cat = typeof catInput === 'string' ? this.getCategoryById(catInput) : (catInput || this.getCategoryById(null));
    
    if (cat.cardBgLight && cat.cardBgDark) {
      return {
        cardBgLight: cat.cardBgLight,
        cardBgDark: cat.cardBgDark,
        cardBorderLight: cat.cardBorderLight || cat.borderColor || '#bfdbfe',
        cardBorderDark: cat.cardBorderDark || '#1e3a8a',
        textColor: cat.textColor || '#1c1917',
        bgColor: cat.bgColor || '#dbeafe',
        borderColor: cat.borderColor || '#bfdbfe'
      };
    }

    return {
      cardBgLight: '#faf8f6',
      cardBgDark: '#241c17',
      cardBorderLight: '#ede3dc',
      cardBorderDark: '#3d2e25',
      textColor: cat.textColor || '#1c1917',
      bgColor: cat.bgColor || '#f2dfd4',
      borderColor: cat.borderColor || '#dcc1b1'
    };
  }

  // Expenses CRUD with Single Amount Model & Chronological Date Sorting
  getExpensesByMonth(monthKey) {
    if (!monthKey) return [];
    const items = (this.state.expenses || []).filter(e => e.monthKey === monthKey);
    
    // Sort by due date (closest date first). Items without date go to the end.
    return items.sort((a, b) => {
      const dateA = a.dueDate && a.dueDate.trim() ? a.dueDate : '9999-99-99';
      const dateB = b.dueDate && b.dueDate.trim() ? b.dueDate : '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  getExpenseById(id) {
    return (this.state.expenses || []).find(e => e.id === id) || null;
  }

  addExpense(expense) {
    const monthKey = expense.monthKey || getCurrentMonthKey();
    this.ensureMonthExists(monthKey);

    const amount = Number(expense.amount !== undefined ? expense.amount : expense.plannedAmount) || 0;

    const newExpense = {
      id: expense.id || 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      monthKey,
      name: (expense.name || '').trim() || 'Despesa sem nome',
      amount,
      dueDate: expense.dueDate !== undefined ? (expense.dueDate || null) : `${monthKey}-10`,
      categoryId: expense.categoryId || 'outras_despesas', // Fallback default
      payee: (expense.payee || '').trim(),
      status: expense.status || 'pending', // 'pending' | 'paid' | 'overdue' | 'cancelled'
      paymentMethod: expense.paymentMethod || 'credit',
      notes: (expense.notes || '').trim(),
      isRecurring: Boolean(expense.isRecurring),
      recurringRuleId: expense.recurringRuleId || null,
      isInstallment: Boolean(expense.isInstallment),
      installmentPlanId: expense.installmentPlanId || null,
      installmentNumber: expense.installmentNumber || null,
      totalInstallments: expense.totalInstallments || null,
      carriedFromMonthKey: expense.carriedFromMonthKey || null,
      movedFromMonthKey: expense.movedFromMonthKey || null,
      movedFromExpenseId: expense.movedFromExpenseId || null,
      isMoved: Boolean(expense.isMoved),
      movedToMonthKey: expense.movedToMonthKey || null,
      movedToExpenseId: expense.movedToExpenseId || null,
      originalExpenseId: expense.originalExpenseId || null,
      isBalanceReconciliation: Boolean(expense.isBalanceReconciliation),
      reconciliationType: expense.reconciliationType || null,
      paidAt: expense.status === 'paid' ? (expense.paidAt || new Date().toISOString()) : null,
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.state.expenses) this.state.expenses = [];
    this.state.expenses.unshift(newExpense);
    this.saveState();
    return newExpense;
  }

  // Individual Debt/Expense Transfer Engine (Preserves History & Excludes from Original Calculations)
  moveExpenseToMonth(expenseId, targetMonthKey) {
    if (!expenseId || !targetMonthKey) {
      return { success: false, error: 'Parâmetros inválidos.' };
    }

    const expense = this.getExpenseById(expenseId);
    if (!expense) {
      return { success: false, error: 'Despesa não encontrada.' };
    }

    if (expense.status === 'paid') {
      return { success: false, error: 'Apenas despesas pendentes podem ser transferidas para outro mês.' };
    }

    if (expense.isMoved || expense.movedToMonthKey) {
      return { success: false, error: 'Esta despesa já foi transferida anteriormente.' };
    }

    if (expense.monthKey === targetMonthKey) {
      return { success: false, error: 'O mês de destino deve ser diferente do mês de origem.' };
    }

    this.ensureMonthExists(targetMonthKey);

    // Extract day from current dueDate or default to '10'
    const dueDay = (expense.dueDate && expense.dueDate.includes('-')) 
      ? expense.dueDate.split('-')[2] 
      : '10';
    const targetDueDate = `${targetMonthKey}-${dueDay}`;

    // Create the active occurrence in destination month
    const newExpense = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      monthKey: targetMonthKey,
      name: expense.name,
      amount: Number(expense.amount) || 0,
      dueDate: targetDueDate,
      categoryId: expense.categoryId || 'outras_despesas',
      payee: expense.payee || '',
      status: 'pending', // Debt carried to next/other month is always pending
      paymentMethod: expense.paymentMethod || 'credit',
      notes: expense.notes || '',
      isRecurring: Boolean(expense.isRecurring),
      recurringRuleId: expense.recurringRuleId || null,
      isInstallment: Boolean(expense.isInstallment),
      installmentPlanId: expense.installmentPlanId || null,
      installmentNumber: expense.installmentNumber || null,
      totalInstallments: expense.totalInstallments || null,
      movedFromMonthKey: expense.monthKey,
      movedFromExpenseId: expense.id,
      originalExpenseId: expense.originalExpenseId || expense.id,
      isMoved: false,
      movedToMonthKey: null,
      movedToExpenseId: null,
      paidAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.state.expenses) this.state.expenses = [];
    this.state.expenses.unshift(newExpense);

    // Mark original expense as moved (historical record in original month)
    const originalIndex = this.state.expenses.findIndex(e => e.id === expenseId);
    if (originalIndex !== -1) {
      this.state.expenses[originalIndex] = {
        ...this.state.expenses[originalIndex],
        isMoved: true,
        movedToMonthKey: targetMonthKey,
        movedToExpenseId: newExpense.id,
        updatedAt: new Date().toISOString()
      };
    }

    this.saveState();
    return { 
      success: true, 
      originalExpense: this.state.expenses[originalIndex], 
      movedExpense: newExpense 
    };
  }

  updateExpense(id, updates) {
    const index = (this.state.expenses || []).findIndex(e => e.id === id);
    if (index === -1) return null;

    const current = this.state.expenses[index];
    const amount = updates.amount !== undefined ? Number(updates.amount) : (updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : current.amount);

    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    // Handle amount adjustment for classified reconciliation expense
    if (current.isReconciliationClassification && updates.amount !== undefined) {
      const oldAmountCents = toCents(current.amount);
      const newAmountCents = toCents(amount);
      const diffCents = newAmountCents - oldAmountCents;

      if (diffCents !== 0) {
        const autoExpIndex = (this.state.expenses || []).findIndex(
          e => e.monthKey === current.monthKey && e.isBalanceReconciliation && e.reconciliationType === 'unregistered_expense'
        );
        const autoExp = autoExpIndex !== -1 ? this.state.expenses[autoExpIndex] : null;
        const currentAutoCents = autoExp ? toCents(autoExp.amount) : 0;

        if (diffCents > currentAutoCents) {
          // Cannot increase classified amount beyond available auto pool
          return null;
        }

        const newAutoCents = currentAutoCents - diffCents;
        if (newAutoCents > 0) {
          if (autoExp) {
            this.state.expenses[autoExpIndex] = {
              ...autoExp,
              amount: fromCents(newAutoCents),
              updatedAt: new Date().toISOString()
            };
          } else {
            // Re-create auto reconciliation expense
            const newAutoExp = {
              id: 'rec-exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
              monthKey: current.monthKey,
              name: 'Despesas não registradas',
              amount: fromCents(newAutoCents),
              dueDate: `${current.monthKey}-01`,
              categoryId: 'outras_despesas',
              payee: 'Ajuste de Saldo',
              status: 'paid',
              paymentMethod: 'other',
              notes: 'Ajuste automático de conciliação de saldo',
              isBalanceReconciliation: true,
              reconciliationType: 'unregistered_expense',
              isRecurring: false,
              isInstallment: false,
              isMoved: false,
              paidAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            this.state.expenses.unshift(newAutoExp);
          }
        } else {
          // newAutoCents === 0 -> remove auto reconciliation expense
          if (autoExpIndex !== -1) {
            this.state.expenses.splice(autoExpIndex, 1);
          }
        }
      }
    }

    const updated = {
      ...current,
      ...updates,
      amount,
      updatedAt: new Date().toISOString()
    };

    if (updates.status === 'paid' && current.status !== 'paid') {
      updated.paidAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'paid') {
      updated.paidAt = null;
    }

    const newIndex = (this.state.expenses || []).findIndex(e => e.id === id);
    if (newIndex !== -1) {
      this.state.expenses[newIndex] = updated;
    }
    this.saveState();
    return updated;
  }

  deleteExpense(id) {
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const expenseToDelete = (this.state.expenses || []).find(e => e.id === id);
    if (!expenseToDelete) return false;

    // If it is a classified reconciliation expense, return its amount to the automatic pool!
    if (expenseToDelete.isReconciliationClassification) {
      const returnCents = toCents(expenseToDelete.amount);
      const autoExpIndex = (this.state.expenses || []).findIndex(
        e => e.monthKey === expenseToDelete.monthKey && e.isBalanceReconciliation && e.reconciliationType === 'unregistered_expense'
      );

      if (autoExpIndex !== -1) {
        const autoExp = this.state.expenses[autoExpIndex];
        const newAutoCents = toCents(autoExp.amount) + returnCents;
        this.state.expenses[autoExpIndex] = {
          ...autoExp,
          amount: fromCents(newAutoCents),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Re-create the automatic reconciliation expense
        const newAutoExp = {
          id: 'rec-exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          monthKey: expenseToDelete.monthKey,
          name: 'Despesas não registradas',
          amount: fromCents(returnCents),
          dueDate: `${expenseToDelete.monthKey}-01`,
          categoryId: 'outras_despesas',
          payee: 'Ajuste de Saldo',
          status: 'paid',
          paymentMethod: 'other',
          notes: 'Ajuste automático de conciliação de saldo',
          isBalanceReconciliation: true,
          reconciliationType: 'unregistered_expense',
          isRecurring: false,
          isInstallment: false,
          isMoved: false,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.state.expenses.unshift(newAutoExp);
      }
    }

    const prevLen = (this.state.expenses || []).length;
    this.state.expenses = (this.state.expenses || []).filter(e => e.id !== id);
    if (this.state.expenses.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  toggleExpensePaid(id) {
    const expense = this.getExpenseById(id);
    if (!expense) return null;
    const newStatus = expense.status === 'paid' ? 'pending' : 'paid';
    return this.updateExpense(id, { status: newStatus });
  }

  // Incomes CRUD with Single Amount Model & Chronological Date Sorting
  getIncomesByMonth(monthKey) {
    if (!monthKey) return [];
    const items = (this.state.incomes || []).filter(i => i.monthKey === monthKey);
    
    // Sort by expected/received date (closest date first). Items without date go to the end.
    return items.sort((a, b) => {
      const dateA = (a.expectedDate || a.receivedDate || '').trim() || '9999-99-99';
      const dateB = (b.expectedDate || b.receivedDate || '').trim() || '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }

  getIncomeById(id) {
    return (this.state.incomes || []).find(i => i.id === id) || null;
  }

  addIncome(income) {
    const monthKey = income.monthKey || getCurrentMonthKey();
    this.ensureMonthExists(monthKey);

    const amount = Number(income.amount !== undefined ? income.amount : income.plannedAmount) || 0;

    const newIncome = {
      id: income.id || 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      monthKey,
      name: (income.name || '').trim() || 'Receita sem nome',
      amount,
      expectedDate: income.expectedDate !== undefined ? (income.expectedDate || null) : `${monthKey}-05`,
      receivedDate: income.receivedDate || (income.status === 'received' ? `${monthKey}-05` : null),
      categoryId: income.categoryId || 'salario',
      payer: (income.payer || '').trim(),
      status: income.status || 'received', // 'pending' | 'received' | 'cancelled'
      isRecurring: Boolean(income.isRecurring),
      recurringRuleId: income.recurringRuleId || null,
      isBalanceCarriedOver: Boolean(income.isBalanceCarriedOver),
      isBalanceReconciliation: Boolean(income.isBalanceReconciliation),
      reconciliationType: income.reconciliationType || null,
      notes: (income.notes || '').trim(),
      receivedAt: income.status === 'received' ? (income.receivedAt || new Date().toISOString()) : null,
      createdAt: income.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.state.incomes) this.state.incomes = [];
    this.state.incomes.unshift(newIncome);
    this.saveState();
    return newIncome;
  }

  updateIncome(id, updates) {
    const index = (this.state.incomes || []).findIndex(i => i.id === id);
    if (index === -1) return null;

    const current = this.state.incomes[index];
    const amount = updates.amount !== undefined ? Number(updates.amount) : (updates.plannedAmount !== undefined ? Number(updates.plannedAmount) : current.amount);

    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    // Handle amount adjustment for classified reconciliation income
    if (current.isReconciliationClassification && updates.amount !== undefined) {
      const oldAmountCents = toCents(current.amount);
      const newAmountCents = toCents(amount);
      const diffCents = newAmountCents - oldAmountCents;

      if (diffCents !== 0) {
        const autoIncIndex = (this.state.incomes || []).findIndex(
          i => i.monthKey === current.monthKey && i.isBalanceReconciliation && i.reconciliationType === 'unregistered_income'
        );
        const autoInc = autoIncIndex !== -1 ? this.state.incomes[autoIncIndex] : null;
        const currentAutoCents = autoInc ? toCents(autoInc.amount) : 0;

        if (diffCents > currentAutoCents) {
          // Cannot increase classified amount beyond available auto pool
          return null;
        }

        const newAutoCents = currentAutoCents - diffCents;
        if (newAutoCents > 0) {
          if (autoInc) {
            this.state.incomes[autoIncIndex] = {
              ...autoInc,
              amount: fromCents(newAutoCents),
              updatedAt: new Date().toISOString()
            };
          } else {
            // Re-create auto reconciliation income
            const newAutoInc = {
              id: 'rec-inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
              monthKey: current.monthKey,
              name: 'Receitas não registradas',
              amount: fromCents(newAutoCents),
              expectedDate: `${current.monthKey}-01`,
              receivedDate: `${current.monthKey}-01`,
              categoryId: 'outras_receitas',
              payer: 'Ajuste de Saldo',
              status: 'received',
              notes: 'Ajuste automático de conciliação de saldo',
              isBalanceReconciliation: true,
              reconciliationType: 'unregistered_income',
              isRecurring: false,
              isBalanceCarriedOver: false,
              receivedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            this.state.incomes.unshift(newAutoInc);
          }
        } else {
          // newAutoCents === 0 -> remove auto reconciliation income
          if (autoIncIndex !== -1) {
            this.state.incomes.splice(autoIncIndex, 1);
          }
        }
      }
    }

    const updated = {
      ...current,
      ...updates,
      amount,
      updatedAt: new Date().toISOString()
    };

    if (updates.status === 'received' && current.status !== 'received') {
      updated.receivedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'received') {
      updated.receivedAt = null;
    }

    const newIndex = (this.state.incomes || []).findIndex(i => i.id === id);
    if (newIndex !== -1) {
      this.state.incomes[newIndex] = updated;
    }
    this.saveState();
    return updated;
  }

  deleteIncome(id) {
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const incomeToDelete = (this.state.incomes || []).find(i => i.id === id);
    if (!incomeToDelete) return false;

    // If it is a classified reconciliation income, return its amount to the automatic pool!
    if (incomeToDelete.isReconciliationClassification) {
      const returnCents = toCents(incomeToDelete.amount);
      const autoIncIndex = (this.state.incomes || []).findIndex(
        i => i.monthKey === incomeToDelete.monthKey && i.isBalanceReconciliation && i.reconciliationType === 'unregistered_income'
      );

      if (autoIncIndex !== -1) {
        const autoInc = this.state.incomes[autoIncIndex];
        const newAutoCents = toCents(autoInc.amount) + returnCents;
        this.state.incomes[autoIncIndex] = {
          ...autoInc,
          amount: fromCents(newAutoCents),
          updatedAt: new Date().toISOString()
        };
      } else {
        // Re-create the automatic reconciliation income
        const newAutoInc = {
          id: 'rec-inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          monthKey: incomeToDelete.monthKey,
          name: 'Receitas não registradas',
          amount: fromCents(returnCents),
          expectedDate: `${incomeToDelete.monthKey}-01`,
          receivedDate: `${incomeToDelete.monthKey}-01`,
          categoryId: 'outras_receitas',
          payer: 'Ajuste de Saldo',
          status: 'received',
          notes: 'Ajuste automático de conciliação de saldo',
          isBalanceReconciliation: true,
          reconciliationType: 'unregistered_income',
          isRecurring: false,
          isBalanceCarriedOver: false,
          receivedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.state.incomes.unshift(newAutoInc);
      }
    }

    const prevLen = (this.state.incomes || []).length;
    this.state.incomes = (this.state.incomes || []).filter(i => i.id !== id);
    if (this.state.incomes.length !== prevLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  toggleIncomeReceived(id) {
    const income = this.getIncomeById(id);
    if (!income) return null;
    const newStatus = income.status === 'received' ? 'pending' : 'received';
    return this.updateIncome(id, { status: newStatus });
  }

  // Installment Plans Engine with Intermediate Installment Calculation Support
  createInstallmentPlan({ 
    description, 
    totalAmount, 
    totalInstallments, 
    currentInstallment = 1, 
    startMonthKey, 
    categoryId, 
    payee, 
    paymentMethod,
    dueDateDay = '10'
  }) {
    const planId = 'inst-' + Date.now();
    const count = Math.max(2, parseInt(totalInstallments, 10) || 2);
    const currentK = Math.min(count, Math.max(1, parseInt(currentInstallment, 10) || 1));
    const amount = Number(totalAmount) || 0;
    const installmentAmount = Math.round((amount / count) * 100) / 100;
    const anchorMonthKey = startMonthKey || getCurrentMonthKey();
    const dayStr = String(dueDateDay || '10').padStart(2, '0');

    const plan = {
      id: planId,
      description: (description || '').trim() || 'Compra Parcelada',
      totalAmount: amount,
      installmentAmount,
      totalInstallments: count,
      currentInstallment: currentK,
      startMonthKey: anchorMonthKey,
      categoryId: categoryId || 'outras_despesas',
      payee: (payee || '').trim(),
      paymentMethod: paymentMethod || 'credit',
      createdAt: new Date().toISOString()
    };

    if (!this.state.installmentPlans) this.state.installmentPlans = [];
    this.state.installmentPlans.push(plan);

    // Distribute all N installments:
    // For each installment i (1..N), calculate delta = i - currentK
    // Past installments (i < currentK) go to earlier months
    // Current installment (i = currentK) goes to anchorMonthKey
    // Future installments (i > currentK) go to later months
    for (let i = 1; i <= count; i++) {
      const delta = i - currentK;
      const targetMonth = getAdjacentMonthKey(anchorMonthKey, delta);
      this.ensureMonthExists(targetMonth);

      this.addExpense({
        monthKey: targetMonth,
        name: `${plan.description} (${i}/${count})`,
        amount: installmentAmount,
        dueDate: `${targetMonth}-${dayStr}`,
        categoryId: plan.categoryId,
        payee: plan.payee,
        status: i < currentK ? 'paid' : 'pending',
        paymentMethod: plan.paymentMethod,
        isInstallment: true,
        installmentPlanId: planId,
        installmentNumber: i,
        totalInstallments: count
      });
    }

    this.saveState();
    return plan;
  }

  getInstallmentExpenses(planId) {
    return (this.state.expenses || [])
      .filter(e => e.installmentPlanId === planId)
      .sort((a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0));
  }

  // Recurring Expenses Engine (Controlled 12-Month Horizon)
  createRecurringExpense({ 
    name, 
    amount, 
    startMonthKey, 
    categoryId, 
    payee, 
    paymentMethod, 
    dueDateDay = '10',
    frequency = 'monthly',
    horizonMonths = 12 
  }) {
    const ruleId = 'rec-' + Date.now();
    const anchorMonthKey = startMonthKey || getCurrentMonthKey();
    const dayStr = String(dueDateDay || '10').padStart(2, '0');

    const rule = {
      id: ruleId,
      name: (name || '').trim() || 'Despesa Recorrente',
      amount: Number(amount) || 0,
      startMonthKey: anchorMonthKey,
      categoryId: categoryId || 'outras_despesas',
      payee: (payee || '').trim(),
      paymentMethod: paymentMethod || 'credit',
      frequency: frequency || 'monthly',
      createdAt: new Date().toISOString()
    };

    if (!this.state.recurringRules) this.state.recurringRules = [];
    this.state.recurringRules.push(rule);

    // Generate instances for up to horizonMonths without duplicate
    for (let m = 0; m < horizonMonths; m++) {
      const targetMonth = getAdjacentMonthKey(anchorMonthKey, m);
      this.ensureMonthExists(targetMonth);

      // Check for duplicate in targetMonth with same ruleId
      const exists = (this.state.expenses || []).some(
        e => e.monthKey === targetMonth && e.recurringRuleId === ruleId
      );

      if (!exists) {
        this.addExpense({
          monthKey: targetMonth,
          name: rule.name,
          amount: rule.amount,
          dueDate: `${targetMonth}-${dayStr}`,
          categoryId: rule.categoryId,
          payee: rule.payee,
          status: 'pending',
          paymentMethod: rule.paymentMethod,
          isRecurring: true,
          recurringRuleId: ruleId
        });
      }
    }

    this.saveState();
    return rule;
  }

  // Explicit Month Close & Carryover Rule Engine
  closeMonth(monthKey, { carryPositiveBalance = false, carryUnpaidExpenses = false }) {
    const month = this.ensureMonthExists(monthKey);
    const summary = this.calculateMonthSummary(monthKey);
    const nextMonthKey = getAdjacentMonthKey(monthKey, 1);
    const nextMonth = this.ensureMonthExists(nextMonthKey);

    month.status = 'closed';
    month.closedAt = new Date().toISOString();

    // 1. Explicit positive balance carryover rule
    if (carryPositiveBalance && summary.actualBalance > 0) {
      nextMonth.carriedBalance = summary.actualBalance;
      nextMonth.carriedBalanceAccepted = true;

      const existingCarriedIncome = this.getIncomesByMonth(nextMonthKey).find(i => i.isBalanceCarriedOver);
      if (existingCarriedIncome) {
        this.updateIncome(existingCarriedIncome.id, {
          amount: summary.actualBalance,
          status: 'received'
        });
      } else {
        this.addIncome({
          monthKey: nextMonthKey,
          name: `Saldo trazido de ${summary.monthName}`,
          amount: summary.actualBalance,
          expectedDate: `${nextMonthKey}-01`,
          categoryId: 'saldo_anterior',
          status: 'received',
          isBalanceCarriedOver: true
        });
      }
    }

    // 2. Explicit unpaid expenses carryover rule
    if (carryUnpaidExpenses) {
      const unpaidExpenses = this.getExpensesByMonth(monthKey).filter(e => e.status === 'pending' || e.status === 'overdue');
      unpaidExpenses.forEach(exp => {
        this.addExpense({
          monthKey: nextMonthKey,
          name: exp.name,
          amount: exp.amount,
          dueDate: `${nextMonthKey}-10`,
          categoryId: exp.categoryId,
          payee: exp.payee,
          status: 'pending',
          paymentMethod: exp.paymentMethod,
          carriedFromMonthKey: monthKey,
          originalExpenseId: exp.id,
          notes: `Pendente de ${summary.monthName}`
        });
      });
    }

    this.saveState();
    return { success: true, summary, nextMonthKey };
  }

  reopenMonth(monthKey) {
    const month = this.getMonth(monthKey);
    if (!month) return false;
    month.status = 'open';
    month.closedAt = null;
    this.saveState();
    return true;
  }

  // Single-Amount Calculation Engine (Exact Remaining Expenses Rule & Zero Double-Counting)
  calculateMonthSummary(monthKey) {
    const month = this.getMonth(monthKey);
    const carriedBalance = (month && month.carriedBalanceAccepted) ? (Number(month.carriedBalance) || 0) : 0;

    // Active expenses for financial totals: must not be cancelled AND must not be moved out
    const activeExpenses = (this.state.expenses || []).filter(
      e => e.monthKey === monthKey && e.status !== 'cancelled' && !e.isMoved && !e.movedToMonthKey
    );
    const allExpensesInMonth = (this.state.expenses || []).filter(
      e => e.monthKey === monthKey && e.status !== 'cancelled'
    );
    const incomes = (this.state.incomes || []).filter(
      i => i.monthKey === monthKey && i.status !== 'cancelled'
    );

    // Receitas
    const plannedIncomes = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const receivedIncomes = incomes
      .filter(i => i.status === 'received')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    // Despesas: Contabiliza apenas despesas ativas (exclui registros históricos movidos para outro mês)
    const plannedExpenses = activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const paidExpenses = activeExpenses
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // Despesas Restantes: Soma exclusiva de despesas ativas com status Pendente ou Atrasado
    const remainingExpenses = activeExpenses
      .filter(e => e.status === 'pending' || e.status === 'overdue')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Balanço Mensal: Receitas totais + Saldo Inicial Trazido - Despesas Totais Ativas
    const forecastBalance = (plannedIncomes + carriedBalance) - plannedExpenses;

    // Saldo Atual Realizado: Receitas Recebidas + Saldo Inicial Trazido - Despesas Pagas Ativas
    const actualBalance = (receivedIncomes + carriedBalance) - paidExpenses;

    let cardTone = 'neutral';
    if (forecastBalance > 0) cardTone = 'positive';
    else if (forecastBalance < 0) cardTone = 'negative';

    return {
      monthKey,
      monthName: month ? month.name : formatMonthName(monthKey),
      monthStatus: month ? month.status : 'open',
      carriedBalance,
      plannedIncomes,
      receivedIncomes,
      plannedExpenses,
      paidExpenses,
      remainingExpenses,
      forecastBalance,
      actualBalance,
      cardTone,
      totalExpensesCount: allExpensesInMonth.length,
      activeExpensesCount: activeExpenses.length,
      totalIncomesCount: incomes.length
    };
  }

  // Base Manual Balance Calculator (in Integer Cents to guarantee idempotence and exact precision)
  calculateManualBaseBalance(monthKey = null) {
    const targetMonthKey = monthKey || this.getCurrentMonthKey();
    const month = this.getMonth(targetMonthKey);
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const carriedBalanceCents = (month && month.carriedBalanceAccepted) ? toCents(month.carriedBalance) : 0;

    // Filter only manual received incomes (ignore pending, cancelled, and auto reconciliation)
    const manualIncomes = (this.state.incomes || []).filter(
      i => i.monthKey === targetMonthKey && i.status === 'received' && !i.isBalanceReconciliation
    );
    const manualReceivedIncomesCents = manualIncomes.reduce((sum, i) => sum + toCents(i.amount), 0);

    // Filter only manual active paid expenses (ignore pending, cancelled, moved-out, and auto reconciliation)
    const manualExpenses = (this.state.expenses || []).filter(
      e => e.monthKey === targetMonthKey && e.status === 'paid' && !e.isMoved && !e.movedToMonthKey && !e.isBalanceReconciliation
    );
    const manualPaidExpensesCents = manualExpenses.reduce((sum, e) => sum + toCents(e.amount), 0);

    const saldoBaseCents = (carriedBalanceCents + manualReceivedIncomesCents) - manualPaidExpensesCents;

    return {
      monthKey: targetMonthKey,
      carriedBalanceCents,
      carriedBalance: fromCents(carriedBalanceCents),
      manualReceivedIncomesCents,
      manualReceivedIncomes: fromCents(manualReceivedIncomesCents),
      manualPaidExpensesCents,
      manualPaidExpenses: fromCents(manualPaidExpensesCents),
      saldoBaseCents,
      saldoBase: fromCents(saldoBaseCents)
    };
  }

  // Calculate Reconciliation Preview with Integer Cents
  calculateReconciliationPreview(monthKey = null, inputRealBalance = 0) {
    const targetMonthKey = monthKey || this.getCurrentMonthKey();
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const base = this.calculateManualBaseBalance(targetMonthKey);
    const saldoRealCents = toCents(inputRealBalance);
    const diferencaCents = saldoRealCents - base.saldoBaseCents;

    let requiredExpenseCents = 0;
    let requiredIncomeCents = 0;
    let actionType = 'none'; // 'expense' | 'income' | 'none'

    if (diferencaCents < 0) {
      requiredExpenseCents = Math.abs(diferencaCents);
      actionType = 'expense';
    } else if (diferencaCents > 0) {
      requiredIncomeCents = diferencaCents;
      actionType = 'income';
    }

    const summary = this.calculateMonthSummary(targetMonthKey);

    return {
      monthKey: targetMonthKey,
      monthName: summary.monthName,
      saldoBase: base.saldoBase,
      saldoBaseCents: base.saldoBaseCents,
      saldoAtualCalculado: summary.actualBalance,
      saldoAtualCalculadoCents: toCents(summary.actualBalance),
      saldoReal: fromCents(saldoRealCents),
      saldoRealCents,
      diferenca: fromCents(diferencaCents),
      diferencaCents,
      requiredExpense: fromCents(requiredExpenseCents),
      requiredExpenseCents,
      requiredIncome: fromCents(requiredIncomeCents),
      requiredIncomeCents,
      actionType
    };
  }

  // Idempotent Intelligent Balance Reconciliation Engine
  reconcileMonthBalance(monthKey = null, inputRealBalance = 0) {
    const targetMonthKey = monthKey || this.getCurrentMonthKey();
    this.ensureMonthExists(targetMonthKey);

    const preview = this.calculateReconciliationPreview(targetMonthKey, inputRealBalance);

    // 1. Manage automatic reconciliation expense
    const existingExpIndex = (this.state.expenses || []).findIndex(
      e => e.monthKey === targetMonthKey && e.isBalanceReconciliation && e.reconciliationType === 'unregistered_expense'
    );

    if (preview.requiredExpenseCents > 0) {
      if (existingExpIndex !== -1) {
        this.state.expenses[existingExpIndex] = {
          ...this.state.expenses[existingExpIndex],
          name: 'Despesas não registradas',
          amount: preview.requiredExpense,
          status: 'paid',
          categoryId: 'outras_despesas',
          payee: 'Ajuste de Saldo',
          updatedAt: new Date().toISOString()
        };
      } else {
        const newExpense = {
          id: 'rec-exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          monthKey: targetMonthKey,
          name: 'Despesas não registradas',
          amount: preview.requiredExpense,
          dueDate: `${targetMonthKey}-01`,
          categoryId: 'outras_despesas',
          payee: 'Ajuste de Saldo',
          status: 'paid',
          paymentMethod: 'other',
          notes: 'Ajuste automático de conciliação de saldo',
          isBalanceReconciliation: true,
          reconciliationType: 'unregistered_expense',
          isRecurring: false,
          isInstallment: false,
          isMoved: false,
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.state.expenses.unshift(newExpense);
      }
    } else {
      if (existingExpIndex !== -1) {
        this.state.expenses.splice(existingExpIndex, 1);
      }
    }

    // 2. Manage automatic reconciliation income
    const existingIncIndex = (this.state.incomes || []).findIndex(
      i => i.monthKey === targetMonthKey && i.isBalanceReconciliation && i.reconciliationType === 'unregistered_income'
    );

    if (preview.requiredIncomeCents > 0) {
      if (existingIncIndex !== -1) {
        this.state.incomes[existingIncIndex] = {
          ...this.state.incomes[existingIncIndex],
          name: 'Receitas não registradas',
          amount: preview.requiredIncome,
          status: 'received',
          categoryId: 'outras_receitas',
          payer: 'Ajuste de Saldo',
          updatedAt: new Date().toISOString()
        };
      } else {
        const newIncome = {
          id: 'rec-inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          monthKey: targetMonthKey,
          name: 'Receitas não registradas',
          amount: preview.requiredIncome,
          expectedDate: `${targetMonthKey}-01`,
          receivedDate: `${targetMonthKey}-01`,
          categoryId: 'outras_receitas',
          payer: 'Ajuste de Saldo',
          status: 'received',
          notes: 'Ajuste automático de conciliação de saldo',
          isBalanceReconciliation: true,
          reconciliationType: 'unregistered_income',
          isRecurring: false,
          isBalanceCarriedOver: false,
          receivedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.state.incomes.unshift(newIncome);
      }
    } else {
      if (existingIncIndex !== -1) {
        this.state.incomes.splice(existingIncIndex, 1);
      }
    }

    // 3. Save reconciliation metadata on month entity
    const month = this.getMonth(targetMonthKey);
    if (month) {
      month.lastReconciledBalance = preview.saldoReal;
      month.lastReconciliationAt = new Date().toISOString();
    }

    this.saveState();
    return { success: true, preview };
  }

  // Dedicated Classification Engine: Unregistered Values -> Real Categorized Items
  classifyReconciliationExpense({ reconciliationExpenseId = null, monthKey = null, name, amount, categoryId, dueDate, payee, notes }) {
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const targetMonthKey = monthKey || this.getCurrentMonthKey();
    let autoExpIndex = -1;
    if (reconciliationExpenseId) {
      autoExpIndex = (this.state.expenses || []).findIndex(e => e.id === reconciliationExpenseId);
    }
    if (autoExpIndex === -1) {
      autoExpIndex = (this.state.expenses || []).findIndex(
        e => e.monthKey === targetMonthKey && e.isBalanceReconciliation && e.reconciliationType === 'unregistered_expense'
      );
    }

    if (autoExpIndex === -1) {
      return { success: false, error: 'Lançamento automático de conciliação não encontrado.' };
    }

    const autoExp = this.state.expenses[autoExpIndex];
    const autoCents = toCents(autoExp.amount);
    const classifyCents = toCents(amount);

    if (classifyCents <= 0) {
      return { success: false, error: 'O valor da classificação deve ser maior que zero.' };
    }

    if (classifyCents > autoCents) {
      return { 
        success: false, 
        error: `O valor informado (${fromCents(classifyCents).toFixed(2)}) excede o saldo restante disponível (${fromCents(autoCents).toFixed(2)}).` 
      };
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return { success: false, error: 'Por favor, informe a descrição do lançamento classificado.' };
    }

    const targetDueDate = dueDate || autoExp.dueDate || `${autoExp.monthKey}-01`;
    const itemMonth = targetDueDate.slice(0, 7);
    const effectiveDueDate = itemMonth === autoExp.monthKey ? targetDueDate : `${autoExp.monthKey}-01`;

    const newClassifiedExpense = {
      id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      monthKey: autoExp.monthKey,
      name: trimmedName,
      amount: fromCents(classifyCents),
      dueDate: effectiveDueDate,
      categoryId: categoryId || 'outras_despesas',
      payee: (payee || '').trim(),
      status: 'paid', // Classified expense is settled
      paymentMethod: 'other',
      notes: (notes || '').trim(),
      isReconciliationClassification: true,
      reconciliationSourceId: autoExp.id,
      reconciliationType: 'unregistered_expense',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newAutoCents = autoCents - classifyCents;

    // Atomic update
    if (newAutoCents > 0) {
      this.state.expenses[autoExpIndex] = {
        ...autoExp,
        amount: fromCents(newAutoCents),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Automatic pool reaches 0 -> remove card
      this.state.expenses.splice(autoExpIndex, 1);
    }

    this.state.expenses.unshift(newClassifiedExpense);
    this.saveState();

    return { 
      success: true, 
      classifiedExpense: newClassifiedExpense, 
      remainingAutoAmount: fromCents(newAutoCents) 
    };
  }

  classifyReconciliationIncome({ reconciliationIncomeId = null, monthKey = null, name, amount, categoryId, expectedDate, payer, notes }) {
    const toCents = (val) => Math.round((Number(val) || 0) * 100);
    const fromCents = (cents) => cents / 100;

    const targetMonthKey = monthKey || this.getCurrentMonthKey();
    let autoIncIndex = -1;
    if (reconciliationIncomeId) {
      autoIncIndex = (this.state.incomes || []).findIndex(i => i.id === reconciliationIncomeId);
    }
    if (autoIncIndex === -1) {
      autoIncIndex = (this.state.incomes || []).findIndex(
        i => i.monthKey === targetMonthKey && i.isBalanceReconciliation && i.reconciliationType === 'unregistered_income'
      );
    }

    if (autoIncIndex === -1) {
      return { success: false, error: 'Lançamento automático de conciliação não encontrado.' };
    }

    const autoInc = this.state.incomes[autoIncIndex];
    const autoCents = toCents(autoInc.amount);
    const classifyCents = toCents(amount);

    if (classifyCents <= 0) {
      return { success: false, error: 'O valor da classificação deve ser maior que zero.' };
    }

    if (classifyCents > autoCents) {
      return { 
        success: false, 
        error: `O valor informado (${fromCents(classifyCents).toFixed(2)}) excede o saldo restante disponível (${fromCents(autoCents).toFixed(2)}).` 
      };
    }

    const trimmedName = (name || '').trim();
    if (!trimmedName) {
      return { success: false, error: 'Por favor, informe a descrição da receita classificada.' };
    }

    const targetDate = expectedDate || autoInc.expectedDate || `${autoInc.monthKey}-01`;
    const itemMonth = targetDate.slice(0, 7);
    const effectiveDate = itemMonth === autoInc.monthKey ? targetDate : `${autoInc.monthKey}-01`;

    const newClassifiedIncome = {
      id: 'inc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      monthKey: autoInc.monthKey,
      name: trimmedName,
      amount: fromCents(classifyCents),
      expectedDate: effectiveDate,
      receivedDate: effectiveDate,
      categoryId: categoryId || 'salario',
      payer: (payer || '').trim(),
      status: 'received', // Classified income is settled
      notes: (notes || '').trim(),
      isReconciliationClassification: true,
      reconciliationSourceId: autoInc.id,
      reconciliationType: 'unregistered_income',
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newAutoCents = autoCents - classifyCents;

    // Atomic update
    if (newAutoCents > 0) {
      this.state.incomes[autoIncIndex] = {
        ...autoInc,
        amount: fromCents(newAutoCents),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Automatic pool reaches 0 -> remove card
      this.state.incomes.splice(autoIncIndex, 1);
    }

    this.state.incomes.unshift(newClassifiedIncome);
    this.saveState();

    return { 
      success: true, 
      classifiedIncome: newClassifiedIncome, 
      remainingAutoAmount: fromCents(newAutoCents) 
    };
  }

  updateReconciliationClassification({ id, type = 'expense', updates }) {
    if (type === 'income') {
      return this.updateIncome(id, updates);
    }
    return this.updateExpense(id, updates);
  }

  deleteReconciliationClassification(id, type = 'expense') {
    if (type === 'income') {
      return this.deleteIncome(id);
    }
    return this.deleteExpense(id);
  }

  getReconciliationClassifiedItems(monthKey, type = 'unregistered_expense') {
    if (!monthKey) return [];
    if (type === 'unregistered_income' || type === 'income') {
      return (this.state.incomes || []).filter(
        i => i.monthKey === monthKey && i.isReconciliationClassification && i.reconciliationType === 'unregistered_income'
      );
    }
    return (this.state.expenses || []).filter(
      e => e.monthKey === monthKey && e.isReconciliationClassification && e.reconciliationType === 'unregistered_expense'
    );
  }

  // Reports & Analytics Aggregations (Zero Double-Counting)
  getReportsBreakdown({ type = 'expense', periodMode = 'month', monthKey = null, year = null, startDate = null, endDate = null, status = 'all' } = {}) {
    const isExpense = type === 'expense';
    const rawItems = isExpense ? (this.state.expenses || []) : (this.state.incomes || []);

    const filteredItems = rawItems.filter(item => {
      // Ignore cancelled items
      if (item.status === 'cancelled') return false;

      // EXCLUDE historical moved-out expenses to avoid double counting across all report periods!
      if (isExpense && (item.isMoved || item.movedToMonthKey)) return false;

      // 1. Filter by Status
      if (status !== 'all') {
        if (status === 'paid' || status === 'received') {
          if (item.status !== 'paid' && item.status !== 'received') return false;
        } else if (status === 'pending') {
          if (item.status !== 'pending' && item.status !== 'overdue') return false;
        }
      }

      // 2. Filter by Period Mode
      const itemDate = isExpense 
        ? (item.dueDate || (item.monthKey ? `${item.monthKey}-01` : ''))
        : (item.expectedDate || item.receivedDate || (item.monthKey ? `${item.monthKey}-01` : ''));
      const itemMonthKey = item.monthKey || (itemDate ? itemDate.slice(0, 7) : '');

      if (periodMode === 'month') {
        const targetMonth = monthKey || this.getCurrentMonthKey();
        return itemMonthKey === targetMonth;
      } else if (periodMode === 'year') {
        const targetYear = String(year || new Date().getFullYear());
        return itemMonthKey.startsWith(targetYear) || (itemDate && itemDate.startsWith(targetYear));
      } else if (periodMode === 'custom') {
        if (!startDate && !endDate) return true;
        if (startDate && itemDate && itemDate < startDate) return false;
        if (endDate && itemDate && itemDate > endDate) return false;
        return true;
      }
      return true;
    });

    // 3. Aggregate by Category
    const categoryMap = {};
    let totalCents = 0;
    const toCents = (val) => Math.round((Number(val) || 0) * 100);

    filteredItems.forEach(item => {
      const catId = item.categoryId || (isExpense ? 'outras_despesas' : 'outras_receitas');
      const valCents = toCents(item.amount || item.plannedAmount || 0);
      totalCents += valCents;

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          category: this.getCategoryById(catId),
          totalCents: 0,
          count: 0
        };
      }
      categoryMap[catId].totalCents += valCents;
      categoryMap[catId].count += 1;
    });

    const totalAmount = totalCents / 100;

    const categories = Object.values(categoryMap).map(c => {
      const catTotal = c.totalCents / 100;
      const pct = totalCents > 0 ? (c.totalCents / totalCents) * 100 : 0;
      return {
        category: c.category,
        total: catTotal,
        count: c.count,
        percentage: pct
      };
    }).sort((a, b) => b.total - a.total);

    return {
      items: filteredItems,
      totalAmount,
      categories,
      maxCategory: categories[0] || null,
      totalCount: filteredItems.length
    };
  }

  getMonthlyEvolution({ type = 'expense', year = null, status = 'all' } = {}) {
    const targetYear = Number(year || new Date().getFullYear());
    const isExpense = type === 'expense';
    const rawItems = isExpense ? (this.state.expenses || []) : (this.state.incomes || []);
    const monthsData = [];
    const toCents = (val) => Math.round((Number(val) || 0) * 100);

    const monthNamesShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentKey = this.getCurrentMonthKey();

    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      const monthKey = `${targetYear}-${monthStr}`;

      const itemsInMonth = rawItems.filter(item => {
        if (item.status === 'cancelled') return false;
        if (isExpense && (item.isMoved || item.movedToMonthKey)) return false;

        if (status !== 'all') {
          if (status === 'paid' || status === 'received') {
            if (item.status !== 'paid' && item.status !== 'received') return false;
          } else if (status === 'pending') {
            if (item.status !== 'pending' && item.status !== 'overdue') return false;
          }
        }
        const itemDate = isExpense 
          ? (item.dueDate || (item.monthKey ? `${item.monthKey}-01` : ''))
          : (item.expectedDate || item.receivedDate || (item.monthKey ? `${item.monthKey}-01` : ''));
        const itemMonthKey = item.monthKey || (itemDate ? itemDate.slice(0, 7) : '');
        return itemMonthKey === monthKey;
      });

      const totalCents = itemsInMonth.reduce((acc, item) => acc + toCents(item.amount || item.plannedAmount || 0), 0);
      const total = totalCents / 100;

      monthsData.push({
        monthIndex: m,
        monthKey,
        shortName: monthNamesShort[m - 1],
        fullName: formatMonthName(monthKey),
        total,
        count: itemsInMonth.length,
        isCurrent: monthKey === currentKey
      });
    }

    const maxMonthlyTotal = Math.max(...monthsData.map(m => m.total), 0);
    const annualTotalCents = monthsData.reduce((acc, m) => acc + toCents(m.total), 0);

    return {
      year: targetYear,
      months: monthsData,
      maxMonthlyTotal,
      annualTotal: annualTotalCents / 100
    };
  }

  // Backup & Reset
  exportDataAsJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = parsed;
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('[FinanceStore] Import error:', e);
    }
    return false;
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.ensureCurrentMonthInitialized();
    this.saveState();
  }
}

// Global Singleton Instance
window.financeStore = new FinanceStore();
window.shoppingStore = window.financeStore;
