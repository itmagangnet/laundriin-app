/**
 * SmartLaundry Pro - Master App Controller
 * Manages routing, themes, audio synthesizer, toasts, PWA lifecycle, and global events.
 */

const App = {
  currentTab: 'pos',
  audioCtx: null,
  deferredPrompt: null,

  init() {
    this.initTheme();
    this.initPWA();
    this.initAudio();
    this.updateAppHeader();

    // Init Auth & Role Manager
    if (window.AuthManager) AuthManager.init();

    // Init Child Modules
    if (window.POSManager) POSManager.init();
    if (window.OrdersManager) OrdersManager.init();
    if (window.CustomersManager) CustomersManager.init();
    if (window.ReportsManager) ReportsManager.init();
    if (window.SettingsManager) SettingsManager.init();
    if (window.ScannerManager) ScannerManager.init();

    // Check if user is logged in before routing to private views
    if (window.AuthManager && AuthManager.isLoggedIn()) {
      const hash = window.location.hash.replace('#', '');
      if (['pos', 'orders', 'scan', 'customers', 'reports', 'settings'].includes(hash)) {
        this.switchTab(hash);
      } else {
        if (AuthManager.isAdmin()) {
          this.switchTab('reports');
        } else {
          this.switchTab('pos');
        }
      }
    } else {
      // Not logged in: hide all tab views and stay locked on login portal
      const tabViews = document.querySelectorAll('.tab-view');
      tabViews.forEach(v => v.classList.add('hidden'));
    }

    // Set Live Clock
    this.startClock();
  },

  // ===== NAVIGATION & ROUTING =====
  switchTab(tabName) {
    // Require user login first
    if (window.AuthManager && !AuthManager.isLoggedIn()) {
      AuthManager.openSwitchUserModal();
      return;
    }

    // Role Protection Guard for Admin-only tabs (reports & settings)
    if (['reports', 'settings'].includes(tabName) && !AuthManager.isAdmin()) {
      const tabTitle = tabName === 'reports' ? 'Dashboard' : 'Pengaturan Outlet';
      AuthManager.requireAdmin(() => {
        this.switchTab(tabName);
      }, `Menu ${tabTitle} hanya dapat diakses oleh Administrator (Owner)`);
      return;
    }

    this.currentTab = tabName;
    window.location.hash = tabName;

    // Hide all tab view containers
    const tabViews = document.querySelectorAll('.tab-view');
    tabViews.forEach(v => v.classList.add('hidden'));

    // Show active tab view
    const activeView = document.getElementById(`view-${tabName}`);
    if (activeView) activeView.classList.remove('hidden');

    // Update Bottom Nav and Sidebar Nav buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      const target = btn.dataset.tab;
      if (target === tabName) {
        btn.classList.add('text-sky-600', 'dark:text-sky-400', 'font-bold');
        btn.classList.remove('text-slate-400', 'dark:text-slate-500');
        const iconWrap = btn.querySelector('.nav-icon-wrap');
        if (iconWrap) {
          iconWrap.classList.add('bg-sky-50', 'dark:bg-sky-950/80', 'text-sky-600', 'dark:text-sky-400');
        }
      } else {
        btn.classList.remove('text-sky-600', 'dark:text-sky-400', 'font-bold');
        btn.classList.add('text-slate-400', 'dark:text-slate-500');
        const iconWrap = btn.querySelector('.nav-icon-wrap');
        if (iconWrap) {
          iconWrap.classList.remove('bg-sky-50', 'dark:bg-sky-950/80', 'text-sky-600', 'dark:text-sky-400');
        }
      }
    });

    // Sub-module specific triggers
    if (tabName === 'orders' && window.OrdersManager) OrdersManager.render();
    if (tabName === 'customers' && window.CustomersManager) CustomersManager.render();
    if (tabName === 'reports' && window.ReportsManager) ReportsManager.render();
    if (tabName === 'settings' && window.SettingsManager) SettingsManager.render();
    
    // Stop scanner if navigating away from scan tab
    if (tabName !== 'scan' && window.ScannerManager) {
      ScannerManager.stopScanner();
    }
  },

  // ===== HEADER & CLOCK =====
  updateAppHeader() {
    const settings = db.getSettings();
    const storeTitle = settings.storeName || 'SmartLaundry Pro';
    
    const nameEl = document.getElementById('headerStoreName');
    if (nameEl) nameEl.innerText = storeTitle;

    const loginTitleEl = document.getElementById('loginModalTitle');
    if (loginTitleEl) loginTitleEl.innerText = `Portal Login ${storeTitle}`;

    if (window.AuthManager) AuthManager.updateRoleUI();
  },

  startClock() {
    const clockEl = document.getElementById('headerLiveClock');
    const update = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    update();
    setInterval(update, 1000);
  },

  // ===== THEME TOGGLE (DARK / LIGHT) =====
  initTheme() {
    const saved = localStorage.getItem('smartlaundry_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('smartlaundry_theme', isDark ? 'dark' : 'light');
    this.playSound('pop');
  },

  // ===== AUDIO SYNTHESIZER (WEB AUDIO API) =====
  initAudio() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
    } catch (e) {}
  },

  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playSound(type) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } 
      else if (type === 'cash') {
        // Satisfying cash register double chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } 
      else if (type === 'chime') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
      else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {
      // Audio fallback
    }
  },

  // ===== CONFETTI EFFECT =====
  triggerConfetti() {
    if (window.confetti) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  },

  // ===== TOAST NOTIFICATIONS =====
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-500',
      error: 'bg-rose-600 text-white border-rose-500',
      info: 'bg-slate-900 text-white dark:bg-sky-600 border-slate-700'
    };

    toast.className = `px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-slide-up ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // ===== PWA INSTALLATION HELPER =====
  initPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('ServiceWorker registered with scope:', reg.scope);
        }).catch(err => {
          console.log('ServiceWorker registration skipped:', err);
        });
      });
    }

    // Capture install prompt for Android / Chrome
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('pwaInstallBanner');
      if (installBtn) installBtn.classList.remove('hidden');
    });
  },

  triggerPwaInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choice) => {
        if (choice.outcome === 'accepted') {
          App.showToast('Aplikasi berhasil dipasang di layar utama!', 'success');
        }
        this.deferredPrompt = null;
        document.getElementById('pwaInstallBanner')?.classList.add('hidden');
      });
    } else {
      this.openIosInstallModal();
    }
  },

  openIosInstallModal() {
    const modal = document.getElementById('iosInstallGuideModal');
    if (modal) modal.classList.remove('hidden');
  },

  closeIosInstallModal() {
    const modal = document.getElementById('iosInstallGuideModal');
    if (modal) modal.classList.add('hidden');
  }
};

window.App = App;

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
