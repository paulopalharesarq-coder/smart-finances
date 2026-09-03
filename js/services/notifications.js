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
})();
