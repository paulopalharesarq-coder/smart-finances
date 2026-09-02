/**
 * Lumina Lifestyle - Store & State Management
 * Persistent localStorage state with reactive subscriber pattern.
 */

const STORAGE_KEY = 'stitch_smart_shopping_manager_v1';

// Pre-defined Lumina Lifestyle Categories
const DEFAULT_CATEGORIES = [
  {
    id: 'acougue',
    name: 'Açougue',
    icon: 'set_meal',
    bgColor: '#fee2e2', // Crisp red
    textColor: '#b91c1c',
    borderColor: '#fecaca'
  },
  {
    id: 'hortifruti',
    name: 'Hortifruti',
    icon: 'eco',
    bgColor: '#dcfce7', // Crisp leaf green
    textColor: '#15803d',
    borderColor: '#bbf7d0'
  },
  {
    id: 'mercearia',
    name: 'Mercearia',
    icon: 'shopping_cart',
    bgColor: '#feeadf', // Soft beige
    textColor: '#944a00',
    borderColor: '#f2dfd4'
  },
  {
    id: 'laticinios',
    name: 'Laticínios',
    icon: 'water_drop',
    bgColor: '#e0f2fe', // Sky blue
    textColor: '#0369a1',
    borderColor: '#bae6fd'
  },
  {
    id: 'padaria',
    name: 'Padaria & Confeitaria',
    icon: 'bakery_dining',
    bgColor: '#fef08a', // Sunny yellow (distinct from beige)
    textColor: '#854d0e',
    borderColor: '#fde047'
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: 'local_bar',
    bgColor: '#f3e8ff', // Royal lavender
    textColor: '#7e22ce',
    borderColor: '#e9d5ff'
  },
  {
    id: 'limpeza',
    name: 'Limpeza',
    icon: 'cleaning_services',
    bgColor: '#ccfbf1', // Crisp teal (distinct from leaf green)
    textColor: '#0f766e',
    borderColor: '#99f6e4'
  },
  {
    id: 'higiene',
    name: 'Higiene & Cuidados',
    icon: 'spa',
    bgColor: '#fce7f3', // Crisp pink (distinct from red)
    textColor: '#be185d',
    borderColor: '#fbcfe8'
  }
];

// Initial pantry items (empty by default)
const DEFAULT_PANTRY = [];

// Initial lists (empty by default)
const DEFAULT_LISTS = [];

class ShoppingStore {
  constructor() {
    this.subscribers = [];
    this.state = this.loadState();
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
        return parsed;
      }
    } catch (e) {
      console.error('Error loading state from localStorage', e);
    }

    // Default clean state
    return {
      activeTab: 'home', // 'home' | 'cart' | 'categories' | 'history' | 'settings'
      activeListId: null,
      showPreviousPrices: false,
      searchQuery: '',
      selectedCategoryFilter: 'all',
      monthlyBudget: 0.00,
      userName: 'Usuário',
      themePreference: themePref,
      categories: DEFAULT_CATEGORIES,
      pantry: [],
      lists: []
    };
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (e) {
      console.error('Error saving state to localStorage', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.state));
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

  // Navigation
  setActiveTab(tab) {
    this.state.activeTab = tab;
    this.saveState();
  }

  setActiveList(listId) {
    this.state.activeListId = listId;
    this.saveState();
  }

  togglePreviousPrices(show) {
    this.state.showPreviousPrices = typeof show === 'boolean' ? show : !this.state.showPreviousPrices;
    this.saveState();
  }

  setSearchQuery(q) {
    this.state.searchQuery = q || '';
    this.saveState();
  }

  setCategoryFilter(catId) {
    this.state.selectedCategoryFilter = catId || 'all';
    this.saveState();
  }

  // Getters
  getActiveList() {
    if (!this.state.lists || this.state.lists.length === 0) return null;
    if (this.state.activeListId) {
      const list = this.state.lists.find(l => l.id === this.state.activeListId);
      if (list) return list;
    }
    // Return the first in-progress/uncompleted list; NEVER fallback to completed lists
    return this.state.lists.find(l => l.status !== 'completed') || null;
  }

  getListById(id) {
    return this.state.lists.find(l => l.id === id);
  }

  getCategoryById(id) {
    if (!id || id === 'sem-categoria') {
      return {
        id: null,
        name: 'Sem categoria',
        icon: 'folder_open',
        bgColor: '#f2dfd4',
        textColor: '#564337',
        borderColor: '#dcc1b1'
      };
    }
    return this.state.categories.find(c => c.id === id) || {
      id: id,
      name: 'Outros',
      icon: 'category',
      bgColor: '#feeadf',
      textColor: '#944a00',
      borderColor: '#f2dfd4'
    };
  }

  // Calculations
  calculateListTotals(list) {
    if (!list) return { currentTotal: 0, previousTotal: 0, boughtTotal: 0, totalItems: 0, boughtItems: 0 };

    if (list.items && list.items.length > 0) {
      let currentTotal = 0;
      let previousTotal = 0;
      let boughtTotal = 0;
      let boughtItems = 0;

      list.items.forEach(item => {
        const qty = Number(item.quantity) || 0;
        const curPrice = (item.currentPrice !== null && item.currentPrice !== undefined && item.currentPrice !== '') ? (Number(item.currentPrice) || 0) : 0;
        const prevPrice = (item.previousPrice !== null && item.previousPrice !== undefined && item.previousPrice !== '') ? (Number(item.previousPrice) || 0) : curPrice;

        currentTotal += qty * curPrice;
        previousTotal += qty * prevPrice;

        if (item.bought) {
          boughtTotal += qty * curPrice;
          boughtItems += 1;
        }
      });

      return {
        currentTotal,
        previousTotal,
        boughtTotal,
        totalItems: list.items.length,
        boughtItems
      };
    }

    return {
      currentTotal: list.totalSpent || 0,
      previousTotal: list.totalSpent || 0,
      boughtTotal: list.totalSpent || 0,
      totalItems: list.itemsCount || 0,
      boughtItems: list.itemsCount || 0
    };
  }

  // Item Actions
  addItemToList(listId, itemData) {
    const list = this.getListById(listId);
    if (!list) return;

    if (!list.items) list.items = [];

    const rawCategory = itemData.categoryId;
    const cleanCategory = (rawCategory && typeof rawCategory === 'string' && rawCategory.trim() !== '' && rawCategory !== 'sem-categoria') ? rawCategory.trim() : null;

    const hasCurrentPrice = itemData.currentPrice !== null && itemData.currentPrice !== undefined && itemData.currentPrice !== '';
    const parsedCurrentPrice = hasCurrentPrice ? Number(itemData.currentPrice) : null;
    const hasPreviousPrice = itemData.previousPrice !== null && itemData.previousPrice !== undefined && itemData.previousPrice !== '';
    const parsedPreviousPrice = hasPreviousPrice ? Number(itemData.previousPrice) : (parsedCurrentPrice !== null ? parsedCurrentPrice : null);

    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: itemData.name.trim(),
      categoryId: cleanCategory,
      quantity: Number(itemData.quantity) || 1,
      unit: itemData.unit || 'unid',
      currentPrice: parsedCurrentPrice,
      previousPrice: parsedPreviousPrice,
      bought: true // Requirement 7: Every new product enters cart automatically
    };

    list.items.push(newItem);
    this.saveState();
  }

  updateItemQuantity(listId, itemId, delta) {
    const list = this.getListById(listId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    const step = item.unit === 'kg' ? 0.5 : 1;
    let newQty = (Number(item.quantity) || 1) + (delta * step);
    if (newQty <= 0) {
      this.removeItemFromList(listId, itemId);
      return;
    }
    item.quantity = Math.round(newQty * 100) / 100;
    this.saveState();
  }

  updateItemPrice(listId, itemId, newPrice) {
    const list = this.getListById(listId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    if (newPrice === null || newPrice === undefined || newPrice === '') {
      item.currentPrice = null;
    } else {
      item.currentPrice = Math.max(0, Number(newPrice) || 0);
    }
    this.saveState();
  }

  toggleItemBought(listId, itemId) {
    const list = this.getListById(listId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    item.bought = !item.bought;
    this.saveState();
  }

  removeItemFromList(listId, itemId) {
    const list = this.getListById(listId);
    if (!list || !list.items) return;

    list.items = list.items.filter(i => i.id !== itemId);
    this.saveState();
  }

  updateItemDetails(listId, itemId, updated) {
    const list = this.getListById(listId);
    if (!list || !list.items) return;

    const item = list.items.find(i => i.id === itemId);
    if (!item) return;

    if (updated.categoryId !== undefined) {
      const rawCat = updated.categoryId;
      updated.categoryId = (rawCat && typeof rawCat === 'string' && rawCat.trim() !== '' && rawCat !== 'sem-categoria') ? rawCat.trim() : null;
    }

    Object.assign(item, updated);
    this.saveState();
  }

  // List Management
  createNewList(title, baseOnPrevious = false, sourceListId = null) {
    const id = 'list-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    let items = [];

    if (baseOnPrevious) {
      const sourceList = sourceListId
        ? this.getListById(sourceListId)
        : (this.state.lists && this.state.lists.length > 0 ? this.state.lists[0] : null);

      if (sourceList && sourceList.items) {
        // Clone items: current price paid in previous list becomes the historical previousPrice
        // The new list's currentPrice starts empty/null
        items = sourceList.items.map(item => {
          const hasCurrent = item.currentPrice !== null && item.currentPrice !== undefined && item.currentPrice !== '' && Number(item.currentPrice) > 0;
          const hasPrev = item.previousPrice !== null && item.previousPrice !== undefined && item.previousPrice !== '' && Number(item.previousPrice) > 0;
          const lastPaidPrice = hasCurrent ? Number(item.currentPrice) : (hasPrev ? Number(item.previousPrice) : null);

          return {
            id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            name: item.name,
            categoryId: item.categoryId || null,
            quantity: item.quantity !== undefined ? item.quantity : 1,
            unit: item.unit || 'unid',
            currentPrice: null, // Starts empty / not informed
            previousPrice: lastPaidPrice, // Last paid price becomes previous reference
            bought: true // Cloned items start in cart with missing price highlight
          };
        });
      }
    }

    const currentMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

    const newList = {
      id,
      title: title || `Compras • ${capitalizedMonth}`,
      subtitle: capitalizedMonth,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      completedAt: null,
      notes: baseOnPrevious ? 'Baseada no mês anterior' : 'Nova lista',
      items
    };

    this.state.lists.unshift(newList);
    this.state.activeListId = id;
    this.state.activeTab = 'cart';
    this.saveState();
  }

  completeActiveList(listId) {
    const list = this.getListById(listId);
    if (!list) return;

    const totals = this.calculateListTotals(list);
    list.status = 'completed';
    list.completedAt = new Date().toISOString();
    list.totalSpent = totals.currentTotal;
    list.itemsCount = totals.totalItems;

    // When the currently viewed list is finalized, clear activeListId and go to home view
    if (this.state.activeListId === listId) {
      this.state.activeListId = null;
      this.state.activeTab = 'home';
    }

    this.saveState();
  }

  deleteList(listId) {
    this.state.lists = this.state.lists.filter(l => l.id !== listId);
    if (this.state.activeListId === listId) {
      const remainingUncompleted = this.state.lists.find(l => l.status !== 'completed');
      this.state.activeListId = remainingUncompleted ? remainingUncompleted.id : null;
    }
    this.saveState();
  }

  renameList(listId, newTitle, newNotes) {
    const list = this.getListById(listId);
    if (!list) return;
    if (newTitle !== undefined && newTitle.trim()) {
      list.title = newTitle.trim();
    }
    if (newNotes !== undefined) {
      list.notes = newNotes.trim();
    }
    this.saveState();
  }

  updateList(listId, updates) {
    const list = this.getListById(listId);
    if (!list) return;
    Object.assign(list, updates);
    this.saveState();
  }

  // Category Management
  addCategory(category) {
    const id = 'cat-' + Date.now();
    this.state.categories.push({
      id,
      name: category.name.trim(),
      icon: category.icon || 'category',
      bgColor: category.bgColor || '#feeadf',
      textColor: category.textColor || '#944a00',
      borderColor: category.borderColor || '#f2dfd4'
    });
    this.saveState();
  }

  updateCategory(id, updated) {
    const cat = this.state.categories.find(c => c.id === id);
    if (cat) {
      Object.assign(cat, updated);
      this.saveState();
    }
  }

  deleteCategory(id) {
    this.state.categories = this.state.categories.filter(c => c.id !== id);
    this.saveState();
  }

  reorderCategories(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.state.categories.length) return;
    if (toIndex < 0 || toIndex >= this.state.categories.length) return;
    if (fromIndex === toIndex) return;

    const [movedCat] = this.state.categories.splice(fromIndex, 1);
    this.state.categories.splice(toIndex, 0, movedCat);
    this.saveState();
  }

  moveCategory(id, direction) {
    const currentIndex = this.state.categories.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex >= 0 && targetIndex < this.state.categories.length) {
      this.reorderCategories(currentIndex, targetIndex);
    }
  }

  setCategories(newCategories) {
    if (Array.isArray(newCategories)) {
      this.state.categories = newCategories;
      this.saveState();
    }
  }

  // Pantry Management
  addPantryItem(item) {
    const rawCat = item.categoryId;
    const cleanCategory = (rawCat && typeof rawCat === 'string' && rawCat.trim() !== '' && rawCat !== 'sem-categoria') ? rawCat.trim() : null;

    this.state.pantry.push({
      id: 'p-' + Date.now(),
      name: item.name.trim(),
      categoryId: cleanCategory,
      unit: item.unit || 'unid',
      defaultPrice: Number(item.defaultPrice) || 0
    });
    this.saveState();
  }

  deletePantryItem(id) {
    this.state.pantry = this.state.pantry.filter(p => p.id !== id);
    this.saveState();
  }

  // Settings
  setMonthlyBudget(budget) {
    this.state.monthlyBudget = Number(budget) || 0;
    this.saveState();
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.notify();
  }

  exportDataAsJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.lists && parsed.categories) {
        this.state = parsed;
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON', e);
    }
    return false;
  }
}

// Global Store Instance
window.shoppingStore = new ShoppingStore();
