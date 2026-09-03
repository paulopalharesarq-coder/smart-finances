/**
 * Smart Finances - Local In-App Due Date Notifications Service
 * 100% client-side, zero backend/Push API, no browser permission prompts.
 * Alerts pending expenses due today or tomorrow with session tracking and grouping.
 */

(function () {
  const NotificationService = {
    // Helper to get local date string YYYY-MM-DD avoiding UTC timezone shift
    getLocalDateString(offsetDays = 0) {
      const d = new Date();
      if (offsetDays !== 0) {
        d.setDate(d.getDate() + offsetDays);
      }
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // Format currency helper
    fmtCurrency(val) {
      return Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    // Format date string to DD/MM
    fmtDateShort(dateStr) {
      if (!dateStr || !dateStr.includes('-')) return '';
      const parts = dateStr.split('-');
      return `${parts[2]}/${parts[1]}`;
    },

    // Check pending expenses for due dates
    checkDueDates() {
      if (typeof window === 'undefined' || !window.financeStore) return;

      const store = window.financeStore;
      const allExpenses = store.state.expenses || [];
      const todayStr = this.getLocalDateString(0);
      const tomorrowStr = this.getLocalDateString(1);

      // Filter strictly pending or overdue expenses
      const dueItems = [];

      for (const exp of allExpenses) {
        // Skip paid, cancelled, or expenses without dueDate
        if (exp.status === 'paid' || exp.status === 'cancelled' || !exp.dueDate) {
          continue;
        }

        let reminderType = null;
        if (exp.dueDate === todayStr) {
          reminderType = 'due_today';
        } else if (exp.dueDate === tomorrowStr) {
          reminderType = 'day_before';
        }

        if (!reminderType) continue;

        // Check if already seen in this session
        const sessionKey = `sf_notif_seen_${exp.id}_${exp.dueDate}_${reminderType}`;
        try {
          if (sessionStorage.getItem(sessionKey)) {
            continue; // Already displayed in this session
          }
        } catch (e) {}

        dueItems.push({
          expense: exp,
          reminderType,
          sessionKey
        });
      }

      if (dueItems.length === 0) return;

      // Mark all collected items as seen in sessionStorage
      for (const item of dueItems) {
        try {
          sessionStorage.setItem(item.sessionKey, '1');
        } catch (e) {}
      }

      // Display the notification banner (single or grouped)
      this.renderNotificationBanner(dueItems);
    },

    // Render In-App Floating Notification Banner
    renderNotificationBanner(items) {
      const container = document.getElementById('in-app-notification-container');
      if (!container) return;

      const isSingle = items.length === 1;
      let title = '';
      let subtitle = '';
      let icon = 'schedule';
      let iconColor = 'text-primary';
      let targetMonthKey = null;

      if (isSingle) {
        const { expense, reminderType } = items[0];
        targetMonthKey = expense.monthKey;
        const formattedAmount = this.fmtCurrency(expense.amount);
        const formattedDate = this.fmtDateShort(expense.dueDate);

        if (reminderType === 'due_today') {
          title = `${expense.name} vence hoje`;
          subtitle = `${formattedAmount} • Não esqueça de pagar`;
          icon = 'notifications_active';
          iconColor = 'text-[#dc2626] dark:text-[#ff8a80]';
        } else {
          title = `${expense.name} vence amanhã`;
          subtitle = `${formattedAmount} • Vencimento ${formattedDate}`;
          icon = 'schedule';
          iconColor = 'text-primary dark:text-[#ffb783]';
        }
      } else {
        // Grouped notification
        const dueTodayCount = items.filter(i => i.reminderType === 'due_today').length;
        const dayBeforeCount = items.filter(i => i.reminderType === 'day_before').length;
        const totalAmount = items.reduce((sum, i) => sum + (Number(i.expense.amount) || 0), 0);
        targetMonthKey = items[0].expense.monthKey || window.financeStore.getSelectedMonthKey();

        if (dueTodayCount > 0 && dayBeforeCount > 0) {
          title = `${items.length} despesas vencem hoje ou amanhã`;
        } else if (dueTodayCount > 0) {
          title = `${dueTodayCount} ${dueTodayCount === 1 ? 'despesa vence' : 'despesas vencem'} hoje`;
        } else {
          title = `${dayBeforeCount} ${dayBeforeCount === 1 ? 'despesa vence' : 'despesas vencem'} amanhã`;
        }

        subtitle = `Total: ${this.fmtCurrency(totalAmount)} • Toque para visualizar`;
        icon = 'notification_important';
        iconColor = 'text-[#dc2626] dark:text-[#ff8a80]';
      }

      const bannerId = 'sf-banner-' + Date.now();
      container.innerHTML = `
        <div id="${bannerId}" class="w-full max-w-[420px] mx-auto p-3.5 bg-surface/90 dark:bg-[#201813]/90 backdrop-blur-xl rounded-2xl border border-outline-variant/40 dark:border-white/10 shadow-2xl flex items-center justify-between gap-3 slide-down transition-all pointer-events-auto cursor-pointer">
          <div class="flex items-center gap-3 min-w-0 flex-1" onclick="window.NotificationService.handleBannerClick('${targetMonthKey}')">
            <div class="w-10 h-10 rounded-xl bg-surface-container dark:bg-black/30 flex items-center justify-center shrink-0 shadow-inner">
              <span class="material-symbols-outlined text-[22px] ${iconColor}">${icon}</span>
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-bold text-xs text-on-surface truncate leading-tight">${title}</h4>
              <p class="text-[11px] text-on-surface-variant dark:text-[#d7c3b5] truncate mt-0.5">${subtitle}</p>
            </div>
          </div>
          <button type="button" 
                  onclick="event.stopPropagation(); window.NotificationService.dismissBanner('${bannerId}')" 
                  class="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface shrink-0 cursor-pointer" title="Fechar">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      `;

      // Auto dismiss after 8 seconds
      setTimeout(() => {
        this.dismissBanner(bannerId);
      }, 8000);
    },

    // Check if weekly backup reminder is due (7 days interval)
    isBackupReminderDue() {
      try {
        const lastBackup = localStorage.getItem('sf_last_backup_date');
        const lastReminder = localStorage.getItem('sf_last_backup_reminder_date');
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

        if (lastBackup && (now - new Date(lastBackup).getTime()) < SEVEN_DAYS_MS) {
          return false;
        }
        if (lastReminder && (now - new Date(lastReminder).getTime()) < SEVEN_DAYS_MS) {
          return false;
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    // Record that backup was completed
    recordBackupCompleted() {
      try {
        const nowIso = new Date().toISOString();
        localStorage.setItem('sf_last_backup_date', nowIso);
        localStorage.setItem('sf_last_backup_reminder_date', nowIso);
      } catch (e) {}
    },

    // Dismiss weekly backup reminder for 7 days
    dismissBackupReminder() {
      try {
        const nowIso = new Date().toISOString();
        localStorage.setItem('sf_last_backup_reminder_date', nowIso);
      } catch (e) {}
    },

    // Trigger direct backup download and update backup tracking
    triggerDirectBackup() {
      if (typeof window.downloadBackupJSON === 'function') {
        window.downloadBackupJSON();
      } else if (window.financeStore) {
        const jsonStr = window.financeStore.exportDataAsJSON();
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smart_finances_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (typeof window.showToast === 'function') {
          window.showToast('Backup exportado com sucesso!', 'success');
        }
      }
      this.recordBackupCompleted();
      const container = document.getElementById('in-app-notification-container');
      if (container) container.innerHTML = '';
      if (typeof window.closeModal === 'function') {
        window.closeModal();
      }
    },

    // Check weekly backup reminder
    checkBackupReminder() {
      if (!this.isBackupReminderDue()) return;

      const sessionKey = 'sf_backup_banner_shown_session';
      try {
        if (sessionStorage.getItem(sessionKey)) return;
      } catch (e) {}

      try {
        sessionStorage.setItem(sessionKey, '1');
      } catch (e) {}

      this.renderBackupBanner();
    },

    // Render In-App Backup Reminder Banner
    renderBackupBanner() {
      const container = document.getElementById('in-app-notification-container');
      if (!container) return;

      const bannerId = 'sf-backup-banner-' + Date.now();
      container.innerHTML = `
        <div id="${bannerId}" class="w-full max-w-[420px] mx-auto p-3.5 bg-surface/90 dark:bg-[#201813]/90 backdrop-blur-xl rounded-2xl border border-outline-variant/40 dark:border-white/10 shadow-2xl flex flex-col gap-2.5 slide-down transition-all pointer-events-auto">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 shadow-inner">
                <span class="material-symbols-outlined text-[22px]">cloud_sync</span>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="font-bold text-xs text-on-surface truncate leading-tight">Faça um backup dos seus dados</h4>
                <p class="text-[11px] text-on-surface-variant dark:text-[#d7c3b5] truncate mt-0.5">Proteja seu histórico financeiro criando uma cópia de segurança.</p>
              </div>
            </div>
            <button type="button" 
                    onclick="window.NotificationService.dismissBackupBannerAndRecord('${bannerId}')" 
                    class="w-7 h-7 rounded-full flex items-center justify-center text-outline hover:text-on-surface shrink-0 cursor-pointer" title="Fechar">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/15">
            <button type="button" 
                    onclick="window.NotificationService.dismissBackupBannerAndRecord('${bannerId}')" 
                    class="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
              Agora não
            </button>
            <button type="button" 
                    onclick="window.NotificationService.triggerDirectBackup()" 
                    class="px-3.5 py-1.5 bg-secondary text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-[15px]">download</span>
              <span>Fazer backup</span>
            </button>
          </div>
        </div>
      `;

      // Auto dismiss after 12 seconds if untouched
      setTimeout(() => {
        this.dismissBanner(bannerId);
      }, 12000);
    },

    dismissBackupBannerAndRecord(bannerId) {
      this.dismissBackupReminder();
      this.dismissBanner(bannerId);
    },

    // Check all notifications: due dates have higher priority
    checkAll() {
      const store = window.financeStore;
      if (!store) return;

      const allExpenses = store.state.expenses || [];
      const todayStr = this.getLocalDateString(0);
      const tomorrowStr = this.getLocalDateString(1);
      const hasDueDates = allExpenses.some(e => e.status !== 'paid' && e.status !== 'cancelled' && e.dueDate && (e.dueDate === todayStr || e.dueDate === tomorrowStr));

      if (hasDueDates) {
        this.checkDueDates();
      } else {
        this.checkBackupReminder();
      }
    },

    // Dismiss banner
    dismissBanner(bannerId) {
      const banner = document.getElementById(bannerId);
      if (banner) {
        banner.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => {
          if (banner.parentElement) {
            banner.remove();
          }
        }, 300);
      }
    },

    // Handle banner click -> navigate to month
    handleBannerClick(monthKey) {
      if (monthKey && window.financeStore) {
        window.financeStore.openMonthDetail(monthKey);
      }
      const container = document.getElementById('in-app-notification-container');
      if (container) container.innerHTML = '';
    }
  };

  window.NotificationService = NotificationService;

  // Auto trigger checkAll on initialization and focus
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => NotificationService.checkAll(), 1200);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        NotificationService.checkAll();
      }
    });

    window.addEventListener('focus', () => {
      NotificationService.checkAll();
    });
  }
})();
