/**
 * SmartLaundry Pro - Authentication & Role Manager
 * Handles separated login portals (Kasir & Admin), session management, PIN verification, and dynamic UI navigation.
 */

const AuthManager = {
  currentUser: null,
  activeLoginRole: 'kasir',
  pendingAdminAction: null,

  init() {
    this.currentUser = (window.db && typeof db.getCurrentUser === 'function') ? db.getCurrentUser() : null;

    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        this.logout();
      };
    }

    if (!this.currentUser) {
      // User is logged out: show locked login modal immediately
      this.openSwitchUserModal('');
    } else {
      this.updateRoleUI();
    }
  },

  isLoggedIn() {
    const user = this.getCurrentUser();
    return !!(user && user.id && user.role);
  },

  getCurrentUser() {
    if (this.currentUser === undefined || this.currentUser === null) {
      this.currentUser = (window.db && typeof db.getCurrentUser === 'function') ? db.getCurrentUser() : null;
    }
    return this.currentUser;
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return !!(user && user.role === 'admin');
  },

  isKasir() {
    const user = this.getCurrentUser();
    return !!(user && user.role === 'kasir');
  },

  // ===== STANDARD LOGIN PORTAL =====
  openSwitchUserModal(defaultUser = null) {
    const modal = document.getElementById('switchUserModal');
    if (!modal) return;

    const usernameInput = document.getElementById('loginUsernameInput');
    const pinInput = document.getElementById('loginPinInput');

    if (usernameInput) {
      if (typeof defaultUser === 'string') {
        usernameInput.value = defaultUser;
      } else {
        const user = this.getCurrentUser();
        usernameInput.value = user?.username || '';
      }
    }

    if (pinInput) {
      pinInput.value = '';
    }

    // Show or hide cancel/close buttons based on session state
    const hasSession = !!db.getCurrentUser();
    const cancelBtn = document.getElementById('loginCancelBtn');
    const closeXBtn = document.getElementById('loginCloseXBtn');
    if (cancelBtn) cancelBtn.style.display = hasSession ? 'block' : 'none';
    if (closeXBtn) closeXBtn.style.display = hasSession ? 'block' : 'none';

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    setTimeout(() => {
      if (usernameInput && !usernameInput.value) {
        usernameInput.focus();
      } else if (pinInput) {
        pinInput.focus();
      }
    }, 150);
  },

  closeSwitchUserModal() {
    // If no user is logged in, don't allow closing modal without login
    if (!db.getCurrentUser() && !this.currentUser) return;

    const modal = document.getElementById('switchUserModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  },

  selectLoginRole(role) {
    const usernameInput = document.getElementById('loginUsernameInput');
    if (usernameInput) usernameInput.value = role;
  },

  togglePinVisibility() {
    const pinInput = document.getElementById('loginPinInput');
    if (pinInput) {
      pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
    }
  },

  submitStandardLogin() {
    const usernameInput = document.getElementById('loginUsernameInput');
    const pinInput = document.getElementById('loginPinInput');
    const username = usernameInput?.value.trim().toLowerCase();
    const pin = pinInput?.value.trim();

    if (!username) {
      if (window.App) App.showToast('Masukkan Username akun', 'error');
      usernameInput?.focus();
      return;
    }

    if (!pin) {
      if (window.App) App.showToast('Masukkan PIN / Password akses', 'error');
      pinInput?.focus();
      return;
    }

    const users = db.getUsers();
    // Match by username or fallback to role matching for convenience (e.g. 'admin' or 'kasir')
    const matchedUser = users.find(u => 
      u.username.toLowerCase() === username || 
      u.name.toLowerCase() === username || 
      (username === 'admin' && u.role === 'admin') ||
      (username === 'kasir' && u.role === 'kasir')
    );

    if (!matchedUser) {
      if (window.App) {
        App.playSound('pop');
        App.showToast('Username akun tidak ditemukan!', 'error');
      }
      if (usernameInput) {
        usernameInput.classList.add('animate-shake');
        setTimeout(() => usernameInput.classList.remove('animate-shake'), 400);
        usernameInput.focus();
      }
      return;
    }

    const expectedPin = matchedUser.pin || (matchedUser.role === 'admin' ? '1234' : '0000');
    if (pin !== expectedPin) {
      if (window.App) {
        App.playSound('pop');
        App.showToast('PIN / Password salah!', 'error');
      }
      if (pinInput) {
        pinInput.value = '';
        pinInput.classList.add('animate-shake');
        setTimeout(() => pinInput.classList.remove('animate-shake'), 400);
        pinInput.focus();
      }
      return;
    }

    // Success login
    this.currentUser = matchedUser;
    db.setCurrentUser(matchedUser);

    if (window.App) {
      App.playSound(matchedUser.role === 'admin' ? 'chime' : 'cash');
      App.showToast(`Login Berhasil: ${matchedUser.name}`, 'success');
    }

    this.closeSwitchUserModal();
    this.updateRoleUI();

    // Redirect to landing view
    if (window.App) {
      if (matchedUser.role === 'admin') {
        window.App.switchTab('reports');
      } else {
        window.App.switchTab('pos');
      }
    }
  },

  // Legacy stubs for safe fallback
  switchLoginTab(tab) { this.selectLoginRole(tab); },
  renderKasirList() {},
  selectKasirUser(id) {},
  submitKasirLogin() { this.selectLoginRole('kasir'); this.submitStandardLogin(); },
  renderAdminInfo() {},
  submitAdminLogin() { this.selectLoginRole('admin'); this.submitStandardLogin(); },
  appendPinDigit(d) {},
  backspacePinDigit() {},
  clearPinDigits() {},
  submitActiveTabLogin() { this.submitStandardLogin(); },

  // ===== LOGOUT / LOCK SESSION =====
  logout() {
    const user = this.getCurrentUser();
    
    // Clear active session in memory and localStorage
    this.currentUser = null;
    if (window.db) db.setCurrentUser(null);
    window.location.hash = '';

    // Hide all tab views so content is not visible behind modal
    const tabViews = document.querySelectorAll('.tab-view');
    tabViews.forEach(v => v.classList.add('hidden'));

    // Clear header profile
    const headerBtn = document.getElementById('headerUserProfileBtn');
    if (headerBtn) headerBtn.innerHTML = '';

    if (window.App) {
      App.playSound('pop');
      App.showToast(`Sesi ${user?.name || ''} telah keluar. Silakan login kembali.`, 'info');
    }

    // Open Standard Login Modal locked
    this.openSwitchUserModal('');
  },

  // ===== ADMIN OVERRIDE PIN MODAL =====
  requireAdmin(actionCallback, reason = 'Aksi ini memerlukan otorisasi Administrator (Owner)') {
    if (this.isAdmin()) {
      actionCallback();
      return;
    }

    this.pendingAdminAction = actionCallback;
    this.openAdminPinModal(reason);
  },

  openAdminPinModal(reason) {
    const modal = document.getElementById('adminPinModal');
    const reasonEl = document.getElementById('adminPinModalReason');
    const input = document.getElementById('adminPinModalInput');

    if (reasonEl) reasonEl.innerText = reason || 'Aksi ini memerlukan otorisasi Administrator (Owner)';
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  },

  closeAdminPinModal() {
    const modal = document.getElementById('adminPinModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
    this.pendingAdminAction = null;
  },

  submitAdminPinOverride() {
    const input = document.getElementById('adminPinModalInput');
    const pin = input?.value.trim();

    if (!pin) {
      if (window.App) App.showToast('Masukkan PIN Admin', 'error');
      return;
    }

    const users = db.getUsers();
    const adminUser = users.find(u => u.role === 'admin' && (u.pin === pin || (!u.pin && pin === '1234')));

    if (!adminUser) {
      if (window.App) {
        App.playSound('pop');
        App.showToast('PIN Admin salah!', 'error');
      }
      if (input) {
        input.value = '';
        input.classList.add('animate-shake');
        setTimeout(() => input.classList.remove('animate-shake'), 400);
      }
      return;
    }

    // Success override
    if (window.App) {
      App.playSound('chime');
      App.showToast(`Otorisasi Admin Diterima`, 'success');
    }

    const callback = this.pendingAdminAction;
    this.closeAdminPinModal();

    if (typeof callback === 'function') {
      callback();
    }
  },

  // ===== DYNAMIC NAVIGATION & ROLE UI =====
  updateRoleUI() {
    const user = this.getCurrentUser();
    if (!user) {
      const headerBtn = document.getElementById('headerUserProfileBtn');
      if (headerBtn) headerBtn.innerHTML = '';
      return;
    }
    const isAdmin = this.isAdmin();

    // 1. Header Profile Display
    const headerBtn = document.getElementById('headerUserProfileBtn');
    if (headerBtn) {
      headerBtn.removeAttribute('onclick');
      headerBtn.setAttribute('title', `Sesi Aktif: ${user.name}`);
      headerBtn.className = 'cursor-default shrink-0';
      headerBtn.innerHTML = `
        <div class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all ${
          isAdmin 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 shadow-sm shadow-emerald-500/10' 
            : 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 shadow-sm shadow-sky-500/10'
        }">
          <span class="text-sm sm:text-base leading-none">${user.avatar || (isAdmin ? '👑' : '💼')}</span>
          <div class="text-left hidden md:block">
            <p class="text-[11px] font-extrabold leading-none truncate max-w-[100px]">${user.name}</p>
            <span class="text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}">
              ${isAdmin ? '👑 Admin' : '💼 Kasir'}
            </span>
          </div>
        </div>
      `;
    }

    // 2. Sidebar Navigation Dynamic Rendering (Laporan Keuangan at Top for Admin)
    const sidebarNav = document.getElementById('sidebarNavMenuContainer');
    if (sidebarNav) {
      if (isAdmin) {
        sidebarNav.innerHTML = `
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">Menu Administrator</p>
          
          <button type="button" onclick="App.switchTab('reports')" data-tab="reports" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <span>Dashboard</span>
          </button>

          <button type="button" onclick="App.switchTab('pos')" data-tab="pos" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <span>Kasir Transaksi</span>
          </button>

          <button type="button" onclick="App.switchTab('orders')" data-tab="orders" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <span>Antrian & Status</span>
          </button>

          <button type="button" onclick="App.switchTab('scan')" data-tab="scan" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <span>Scan Barcode / QR</span>
          </button>

          <button type="button" onclick="App.switchTab('customers')" data-tab="customers" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <span>Pelanggan (CRM)</span>
          </button>

          <button type="button" onclick="App.switchTab('settings')" data-tab="settings" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <span>Pengaturan Outlet</span>
          </button>
        `;
      } else {
        // Kasir Role: Only 4 operational menus (POS Kasir at top)
        sidebarNav.innerHTML = `
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">Menu Kasir</p>
          
          <button type="button" onclick="App.switchTab('pos')" data-tab="pos" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <span>Kasir Transaksi</span>
          </button>

          <button type="button" onclick="App.switchTab('orders')" data-tab="orders" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <span>Antrian & Status</span>
          </button>

          <button type="button" onclick="App.switchTab('scan')" data-tab="scan" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <span>Scan Barcode / QR</span>
          </button>

          <button type="button" onclick="App.switchTab('customers')" data-tab="customers" class="nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-slate-400">
            <div class="nav-icon-wrap w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <span>Pelanggan (CRM)</span>
          </button>
        `;
      }

      // Re-apply active tab highlighting in sidebar
      if (window.App && window.App.currentTab) {
        const activeTab = window.App.currentTab;
        const navButtons = sidebarNav.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
          if (btn.dataset.tab === activeTab) {
            btn.classList.add('text-sky-600', 'dark:text-sky-400', 'font-bold');
            btn.classList.remove('text-slate-400');
            const iconWrap = btn.querySelector('.nav-icon-wrap');
            if (iconWrap) {
              iconWrap.classList.add('bg-sky-50', 'dark:bg-sky-950/80', 'text-sky-600', 'dark:text-sky-400');
            }
          }
        });
      }
    }

    // 3. Sidebar Bottom User Card (Clean card with single prominent Logout button for both roles)
    const sidebarUserCard = document.getElementById('sidebarUserCard');
    if (sidebarUserCard) {
      sidebarUserCard.innerHTML = `
        <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">${user.avatar || (isAdmin ? '👑' : '💼')}</span>
              <div>
                <p class="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-tight">${user.name}</p>
                <span class="text-[9px] font-bold uppercase tracking-wider ${isAdmin ? 'text-emerald-500' : 'text-sky-500'}">
                  ${isAdmin ? 'Owner (Full Akses)' : 'Staff Kasir'}
                </span>
              </div>
            </div>
          </div>
          <button type="button" onclick="AuthManager.logout()" class="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/60 active:scale-95 transition-all shadow-sm">
            <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span>Logout / Keluar Sesi</span>
          </button>
        </div>
      `;
    }

    // 4. Mobile Bottom Navigation Dynamic Isolation
    const mobileNavContainer = document.getElementById('mobileBottomNavContainer');
    if (mobileNavContainer) {
      if (isAdmin) {
        // Admin Mobile Nav: Laporan (Dashboard First), Kasir, Scan, Antrian, Outlet
        mobileNavContainer.innerHTML = `
          <button type="button" onclick="App.switchTab('reports')" data-tab="reports" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'reports' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span class="text-[10px]">Dashboard</span>
          </button>
          <button type="button" onclick="App.switchTab('pos')" data-tab="pos" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'pos' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            <span class="text-[10px]">Kasir</span>
          </button>
          <button type="button" onclick="App.switchTab('scan')" data-tab="scan" class="nav-btn flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-all">
            <div class="w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <span class="text-[10px] mt-0.5">Scan</span>
          </button>
          <button type="button" onclick="App.switchTab('orders')" data-tab="orders" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'orders' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span class="text-[10px]">Antrian</span>
          </button>
          <button type="button" onclick="App.switchTab('settings')" data-tab="settings" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'settings' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span class="text-[10px]">Outlet</span>
          </button>
        `;
      } else {
        // Kasir Mobile Nav: Kasir, Antrian, Scan, Pelanggan, Logout (No Laporan & No Outlet)
        mobileNavContainer.innerHTML = `
          <button type="button" onclick="App.switchTab('pos')" data-tab="pos" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'pos' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            <span class="text-[10px]">Kasir</span>
          </button>
          <button type="button" onclick="App.switchTab('orders')" data-tab="orders" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'orders' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            <span class="text-[10px]">Antrian</span>
          </button>
          <button type="button" onclick="App.switchTab('scan')" data-tab="scan" class="nav-btn flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 transition-all">
            <div class="w-10 h-10 -mt-5 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            </div>
            <span class="text-[10px] mt-0.5">Scan</span>
          </button>
          <button type="button" onclick="App.switchTab('customers')" data-tab="customers" class="nav-btn flex flex-col items-center justify-center ${window.App?.currentTab === 'customers' ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-400 dark:text-slate-500'} transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="text-[10px]">Pelanggan</span>
          </button>
          <button type="button" onclick="AuthManager.logout()" class="nav-btn flex flex-col items-center justify-center text-rose-500 hover:text-rose-600 transition-all">
            <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span class="text-[10px] font-bold">Keluar</span>
          </button>
        `;
      }
    }

    // 5. Render User Management in Settings if open
    if (window.SettingsManager && typeof SettingsManager.renderUsersList === 'function') {
      SettingsManager.renderUsersList();
    }
  }
};

// Global Exposure
window.AuthManager = AuthManager;


