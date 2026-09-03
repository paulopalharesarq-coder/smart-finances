/**
 * Smart Finances - Main Application Controller
 * Handles SPA rendering, onboarding check, tab navigation, theme sync, and PWA lifecycle.
 */

let deferredInstallPrompt = null;

// PWA Install Prompt Listener
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  
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
  window.showToast('Smart Finances instalado com sucesso na tela inicial!', 'success');
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
    window.openMobileConnectModal();
  }
};

window.dismissPWABanner = function () {
  sessionStorage.setItem('pwa_banner_dismissed', 'true');
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.classList.add('hidden');
};

function renderBottomNav(activeTab) {
  // Bottom navigation appears EXCLUSIVELY on the Home screen! (Item #7)
  if (activeTab !== 'home') {
    return '';
  }

  const tabs = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'reports', label: 'Relatórios', icon: 'stacked_bar_chart' },
    { id: 'settings', label: 'Mais', icon: 'menu' }
  ];

  return `
    <div class="fixed bottom-4 left-0 right-0 max-w-[340px] sm:max-w-[370px] mx-auto z-40 px-3 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <nav class="pointer-events-auto w-full floating-bottom-dock rounded-[32px] py-2 px-2 flex justify-around items-center">
        ${tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return `
            <button onclick="window.financeStore.setActiveTab('${tab.id}')" 
                    class="flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 group ${isActive ? 'text-primary font-bold' : 'text-outline hover:text-on-surface'}">
              <div class="relative">
                <span class="material-symbols-outlined text-[23px] transition-transform group-hover:scale-110" 
                      style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">
                  ${tab.icon}
                </span>
              </div>
              <span class="text-[10px] mt-0.5 tracking-tight font-bold">${tab.label}</span>
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

  const store = window.financeStore;
  const activeTab = store.state.activeTab || 'home';

  let viewHtml = '';
  switch (activeTab) {
    case 'home':
      viewHtml = window.renderHomeView ? window.renderHomeView() : '';
      break;
    case 'month':
      viewHtml = window.renderMonthDetailView ? window.renderMonthDetailView() : '';
      break;
    case 'reports':
      viewHtml = window.renderReportsView ? window.renderReportsView() : '';
      break;
    case 'categories':
      viewHtml = window.renderCategoriesView ? window.renderCategoriesView() : '';
      break;
    case 'settings':
      viewHtml = window.renderSettingsView ? window.renderSettingsView() : '';
      break;
    default:
      viewHtml = window.renderHomeView ? window.renderHomeView() : '';
  }

  appElement.innerHTML = `
    <div class="app-container">
      ${viewHtml}
      ${renderBottomNav(activeTab)}
    </div>
  `;
}

// Dynamic Status Bar & Theme-Color Synchronizer for iOS & Android PWAs
// Dynamic Status Bar & Theme-Color Synchronizer for iOS & Android PWAs
function updateStatusBarTheme(isDark) {
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;

  const lightColor = '#faf8f6';
  const darkColor = '#18120d';
  const effectiveColor = isDark ? darkColor : lightColor;

  // 1. Dynamic meta[name="theme-color"]
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

  // 2. Dynamic apple-mobile-web-app-status-bar-style for iOS
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

  // 3. Dynamic color-scheme meta tag
  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta && typeof colorSchemeMeta.setAttribute === 'function') {
    colorSchemeMeta.setAttribute('content', isDark ? 'dark' : 'light');
  }
}

// Universal Theme Engine
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
    isDark = systemDark;
  }

  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }

  updateStatusBarTheme(isDark);
};

function initThemeManager() {
  if (typeof window === 'undefined') return;
  window.applyThemePreference();

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

  // Re-synchronize theme & check due date alerts immediately when app returns to foreground
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        window.applyThemePreference();
        if (window.NotificationService && typeof window.NotificationService.checkDueDates === 'function') {
          window.NotificationService.checkDueDates();
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      window.applyThemePreference();
      if (window.NotificationService && typeof window.NotificationService.checkDueDates === 'function') {
        window.NotificationService.checkDueDates();
      }
    });
  }
}

initThemeManager();

// Initialize on DOM ready or immediately if already loaded
function initApp() {
  renderApp();
  window.financeStore.subscribe(() => {
    renderApp();
  });

  // ESC key to close modals
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.closeModal();
        window.closeKeypad();
      }
    });
  }

  // Check for First Launch Onboarding
  if (!window.financeStore.isProfileConfigured()) {
    setTimeout(() => {
      if (typeof window.openOnboardingModal === 'function') {
        window.openOnboardingModal();
      }
    }, 300);
  }

  // Trigger local in-app due date check on launch
  if (typeof window !== 'undefined' && window.NotificationService && typeof window.NotificationService.checkDueDates === 'function') {
    setTimeout(() => {
      window.NotificationService.checkDueDates();
    }, 400);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
