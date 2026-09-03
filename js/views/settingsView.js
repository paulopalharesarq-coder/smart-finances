/**
 * Smart Finances - Settings & Profile View
 * Theme customization, mobile connection, backup/restore, and reset options.
 */

window.renderSettingsView = function () {
  const store = window.financeStore;
  const themePref = store.state.themePreference || 'system';

  return `
    <div class="pb-36">
      <!-- TopAppBar -->
      <header class="bg-background flex justify-between items-center w-full px-5 py-3.5 sticky top-0 z-30">
        <div class="flex items-center gap-2.5">
          <button onclick="window.financeStore.setActiveTab('home')" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface active:scale-95 transition-all" title="Voltar">
            <span class="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <h1 class="font-headline-xl-mobile text-xl font-bold text-on-surface">Mais & Ajustes</h1>
        </div>
      </header>

      <main class="px-5 py-2 space-y-6">
        <!-- User Profile Card -->
        <div class="bg-surface-container rounded-2xl p-4 flex items-center justify-between gap-4 border border-outline-variant/40 shadow-sm">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="w-14 h-14 rounded-full overflow-hidden shadow-md flex items-center justify-center bg-surface-container-high shrink-0 border border-outline-variant/40">
              ${store.state.userPhoto ? `
                <img src="${store.state.userPhoto}" alt="${store.state.userName}" class="w-full h-full object-cover" />
              ` : `
                <img src="./icons/icon-192.png" alt="${store.state.userName || 'Smart Finances'}" class="w-full h-full object-cover" />
              `}
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="font-headline-md text-base font-bold text-on-surface truncate">${store.state.userName || 'Perfil'}</h2>
              <p class="text-xs text-on-surface-variant mt-0.5 truncate">Smart Finances • PWA</p>
            </div>
          </div>

          <button onclick="window.openProfileEditModal()" class="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm">
            Editar
          </button>
        </div>

        <!-- Atalho para Gestão de Categorias -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40">
          <div onclick="window.financeStore.setActiveTab('categories')" class="flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-[20px]">category</span>
              </div>
              <div>
                <h3 class="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">Gerenciar Categorias</h3>
                <span class="text-[11px] text-on-surface-variant">Despesas e Receitas</span>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
          </div>
        </section>

        <!-- Aparência do Aplicativo -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 space-y-3">
          <div class="flex items-center gap-2.5 text-primary font-bold">
            <span class="material-symbols-outlined text-[20px]">palette</span>
            <h3 class="font-headline-md text-sm text-on-surface">Aparência do Aplicativo</h3>
          </div>
          <p class="text-xs text-on-surface-variant">
            Escolha se o aplicativo acompanha o tema do celular ou use um tema fixo.
          </p>
          <div class="grid grid-cols-3 gap-2 pt-1">
            <button onclick="window.financeStore.setThemePreference('system')" 
                    class="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${themePref === 'system' ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-sm' : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-outline-variant/30 font-semibold'}">
              <span class="material-symbols-outlined text-[20px]">phone_iphone</span>
              <span class="text-[11px] leading-tight">Automático</span>
            </button>

            <button onclick="window.financeStore.setThemePreference('light')" 
                    class="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${themePref === 'light' ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-sm' : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-outline-variant/30 font-semibold'}">
              <span class="material-symbols-outlined text-[20px]">light_mode</span>
              <span class="text-[11px] leading-tight">Claro</span>
            </button>

            <button onclick="window.financeStore.setThemePreference('dark')" 
                    class="p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer ${themePref === 'dark' ? 'bg-primary-container text-on-primary-container border-primary-container font-bold shadow-sm' : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-outline-variant/30 font-semibold'}">
              <span class="material-symbols-outlined text-[20px]">dark_mode</span>
              <span class="text-[11px] leading-tight">Escuro</span>
            </button>
          </div>
        </section>

        <!-- Acessar no Celular (PWA) -->
        <section class="bg-primary-fixed/60 rounded-2xl p-4 border border-primary-fixed-dim/70 space-y-3 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-primary font-bold">
              <span class="material-symbols-outlined text-[22px]">phone_iphone</span>
              <h3 class="font-headline-md text-sm text-on-surface">Acessar & Instalar no Celular</h3>
            </div>
            <span class="px-2 py-0.5 bg-secondary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">PWA</span>
          </div>
          <p class="text-xs text-on-surface-variant">
            Abra a câmera do smartphone para escanear o QR Code e instalar este app direto na tela inicial.
          </p>
          <div>
            <button onclick="window.openMobileConnectModal()" class="w-full py-2.5 px-4 bg-primary text-white hover:opacity-95 active:scale-95 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all">
              <span class="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              Ver QR Code & Instruções
            </button>
          </div>
        </section>

        <!-- Backup & Dados Locais -->
        <section class="bg-surface-container rounded-2xl p-4 border border-outline-variant/40 space-y-3">
          <div class="flex items-center gap-2.5 text-secondary font-bold">
            <span class="material-symbols-outlined text-[20px]">cloud_sync</span>
            <h3 class="font-headline-md text-sm text-on-surface">Backup & Dados Locais</h3>
          </div>
          <p class="text-xs text-on-surface-variant">
            Seus dados são salvos com segurança no navegador. Exporte o arquivo JSON para backup ou transferência.
          </p>
          <div class="flex flex-col gap-2 pt-1">
            <button onclick="window.downloadBackupJSON()" class="w-full py-2.5 px-4 bg-surface-container-high hover:bg-surface-variant rounded-xl text-xs font-bold text-on-surface flex items-center justify-center gap-2 border border-outline-variant/30 transition-colors">
              <span class="material-symbols-outlined text-[16px]">download</span>
              Exportar Backup Financeiro (JSON)
            </button>

            <label class="w-full py-2.5 px-4 bg-surface-container-high hover:bg-surface-variant rounded-xl text-xs font-bold text-on-surface flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer transition-colors">
              <span class="material-symbols-outlined text-[16px]">upload</span>
              Restaurar Backup (JSON)
              <input type="file" accept=".json" onchange="window.handleRestoreJSON(event)" class="hidden">
            </label>
          </div>
        </section>

        <!-- Redefinir Dados -->
        <section class="p-4 bg-error-container/40 rounded-2xl border border-error/20 space-y-2">
          <h4 class="font-label-caps text-xs font-bold text-error uppercase flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">restart_alt</span>
            Redefinir Dados Financeiros
          </h4>
          <p class="text-xs text-on-surface-variant">
            Limpa todos os meses, despesas e receitas, restaurando as categorias padrão.
          </p>
          <button onclick="window.confirmResetData()" class="px-4 py-2 bg-error-container text-on-error-container hover:bg-error/20 rounded-xl font-bold text-xs transition-colors">
            Redefinir Tudo
          </button>
        </section>
      </main>
    </div>
  `;
};

window.downloadBackupJSON = function () {
  const jsonStr = window.financeStore.exportDataAsJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smart_finances_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  if (window.NotificationService && typeof window.NotificationService.recordBackupCompleted === 'function') {
    window.NotificationService.recordBackupCompleted();
  } else {
    try {
      const nowIso = new Date().toISOString();
      localStorage.setItem('sf_last_backup_date', nowIso);
      localStorage.setItem('sf_last_backup_reminder_date', nowIso);
    } catch (e) {}
  }

  window.showToast('Backup exportado com sucesso!', 'success');
};

window.handleRestoreJSON = function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const success = window.financeStore.importDataFromJSON(event.target.result);
    if (success) {
      window.showToast('Dados restaurados com sucesso!', 'success');
    } else {
      window.showToast('Erro ao importar JSON. Verifique o formato.', 'error');
    }
  };
  reader.readAsText(file);
};

window.confirmResetData = function () {
  if (confirm('Tem certeza que deseja redefinir para os dados originais?')) {
    window.financeStore.resetToDefault();
    window.showToast('Dados redefinidos com sucesso!', 'info');
  }
};
