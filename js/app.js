/**
 * Lumina Lifestyle - Main Application Controller
 * Handles SPA rendering, tab navigation, event subscriptions and PWA installation.
 */

let deferredInstallPrompt = null;

// PWA Install Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredInstallPrompt = e;
  
  // Show the custom install banner if not dismissed before
  const bannerDismissed = sessionStorage.getItem('pwa_banner_dismissed');
  if (!bannerDismissed) {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('hidden');
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.add('hidden');
  window.showToast('App instalado com sucesso na tela inicial!', 'success');
});

window.triggerPWAInstall = async function () {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      window.showToast('Instalação iniciada!', 'success');
    }
    deferredInstallPrompt = null;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.add('hidden');
  } else {
    // If not Chrome Android / Edge or already installed, open instructions modal
    window.openMobileConnectModal();
  }
};

window.dismissPWABanner = function () {
  sessionStorage.setItem('pwa_banner_dismissed', 'true');
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.add('hidden');
};

function renderBottomNav(activeTab) {
  const tabs = [
    { id: 'home', label: 'Listas', icon: 'shopping_basket' },
    { id: 'cart', label: 'Carrinho', icon: 'shopping_cart' },
    { id: 'categories', label: 'Categorias', icon: 'category' },
    { id: 'history', label: 'Histórico', icon: 'history' },
    { id: 'settings', label: 'Perfil', icon: 'person' }
  ];

  return `
    <div class="fixed bottom-0 left-0 right-0 max-w-[540px] mx-auto z-50 px-4 bottom-nav-container pointer-events-none flex flex-col items-end gap-3 bg-transparent">
      ${activeTab === 'home' ? `
        <!-- Floating Action Button (Fixo alinhado com o mesmo afastamento do card total previsto) -->
        <button aria-label="Nova Lista" onclick="window.openNewListModal()" 
                class="pointer-events-auto w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-[0px_8px_20px_rgba(0,0,0,0.25)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer mr-1" 
                title="Criar Nova Lista">
          <span class="material-symbols-outlined text-[30px] font-bold">add</span>
        </button>
      ` : ''}
      <nav class="pointer-events-auto w-full glass-total-bar rounded-2xl py-2 px-1.5 flex justify-around items-center shadow-[0px_8px_30px_rgba(0,0,0,0.07)]">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="window.shoppingStore.setActiveTab('${tab.id}')" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 group ${isActive ? 'text-primary font-bold' : 'text-outline hover:text-on-surface'}">
              <div class="relative">
                <span class="material-symbols-outlined text-[24px] transition-transform group-hover:scale-110" 
                      style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">
                  ${tab.icon}
                </span>
                ${tab.id === 'cart' && window.shoppingStore.getActiveList()?.items?.length ? `
                  <span class="absolute -top-1 -right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    ${window.shoppingStore.getActiveList().items.length}
                  </span>
                ` : ''}
              </div>
              <span class="font-label-caps text-[11px] mt-1 tracking-tight">${tab.label}</span>
            </button>
          `;
        }).join('')}
      </nav>
    </div>
  `;
}

function renderApp() {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  const state = window.shoppingStore.state;
  const activeTab = state.activeTab || 'home';

  let viewHtml = '';
  switch (activeTab) {
    case 'home':
      viewHtml = window.renderHomeView();
      break;
    case 'cart':
      viewHtml = window.renderCartView();
      break;
    case 'categories':
      viewHtml = window.renderCategoriesView();
      break;
    case 'history':
      viewHtml = window.renderHistoryView();
      break;
    case 'settings':
      viewHtml = window.renderSettingsView();
      break;
    default:
      viewHtml = window.renderHomeView();
  }

  appElement.innerHTML = `
    <div class="app-container">
      ${viewHtml}
      ${activeTab === 'home' ? renderBottomNav(activeTab) : ''}
    </div>
  `;
}

// Dynamic Status Bar & Theme-Color Synchronizer for iOS & Android PWAs
function updateStatusBarTheme(isDark) {
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;

  const lightColor = '#fff8f5';
  const darkColor = '#18120d';
  const effectiveColor = isDark ? darkColor : lightColor;

  // 1. Dynamic theme-color meta
  let themeColorMeta = document.getElementById('app-theme-color') || document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    themeColorMeta.id = 'app-theme-color';
    document.head.appendChild(themeColorMeta);
  }
  if (typeof themeColorMeta.removeAttribute === 'function') {
    themeColorMeta.removeAttribute('media');
  }
  if (typeof themeColorMeta.setAttribute === 'function') {
    themeColorMeta.setAttribute('content', effectiveColor);
  }

  // 2. Dynamic apple-mobile-web-app-status-bar-style for iOS PWA
  let appleStatusBarMeta = document.getElementById('app-status-bar-style') || document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.createElement('meta');
    appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    appleStatusBarMeta.id = 'app-status-bar-style';
    document.head.appendChild(appleStatusBarMeta);
  }
  if (typeof appleStatusBarMeta.setAttribute === 'function') {
    appleStatusBarMeta.setAttribute('content', isDark ? 'black' : 'default');
  }

  // 3. Dynamic color-scheme meta
  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta && typeof colorSchemeMeta.setAttribute === 'function') {
    colorSchemeMeta.setAttribute('content', isDark ? 'dark' : 'light');
  }
}

// Universal Theme Engine: Supports 'system' (auto), 'light', and 'dark'
window.applyThemePreference = function (preference) {
  if (typeof document === 'undefined') return;

  const pref = preference || localStorage.getItem('stitch_theme_preference') || 'system';
  const systemDark = (typeof window !== 'undefined' && window.matchMedia) 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches 
    : false;

  let isDark = false;
  if (pref === 'dark') {
    isDark = true;
  } else if (pref === 'light') {
    isDark = false;
  } else {
    // 'system'
    isDark = systemDark;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  // Real-time synchronization of iOS/Android status bar and browser chrome
  updateStatusBarTheme(isDark);
};

function initThemeManager() {
  if (typeof window === 'undefined') return;

  // Initial application
  window.applyThemePreference();

  // Media Query listener for system theme changes in real-time
  if (window.matchMedia) {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const pref = localStorage.getItem('stitch_theme_preference') || 'system';
      if (pref === 'system') {
        window.applyThemePreference('system');
      }
    };

    if (darkModeMediaQuery.addEventListener) {
      darkModeMediaQuery.addEventListener('change', onChange);
    } else if (darkModeMediaQuery.addListener) {
      darkModeMediaQuery.addListener(onChange);
    }
  }
}

initThemeManager();

// Initialize on DOM ready or immediately if already loaded
function initApp() {
  renderApp();
  window.shoppingStore.subscribe(() => {
    renderApp();
  });

  // ESC key to close modals
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.closeModal();
      }
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}


