/**
 * SmartLaundry Pro - Settings & Administration Module
 * Store profile, service prices, fragrances, backup/restore, and PWA installation guide.
 */

const SettingsManager = {
  init() {
    this.render();
  },

  render() {
    this.renderStoreSettingsForm();
    this.renderServicesList();
    this.renderFragrancesList();
    this.renderRacksList();
    this.renderUsersList();
  },

  renderStoreSettingsForm() {
    const settings = db.getSettings();
    
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('settingsStoreName', settings.storeName);
    setVal('settingsTagline', settings.tagline);
    setVal('settingsPhone', settings.phone);
    setVal('settingsAddress', settings.address);
    setVal('settingsFooterNote', settings.footerNote);
    setVal('settingsPrinterSize', settings.printerSize || '58mm');
  },

  saveStoreSettings() {
    const settings = db.getSettings();

    const getVal = (id) => document.getElementById(id)?.value.trim() || '';

    settings.storeName = getVal('settingsStoreName') || 'SmartLaundry';
    settings.tagline = getVal('settingsTagline');
    settings.phone = getVal('settingsPhone');
    settings.address = getVal('settingsAddress');
    settings.footerNote = getVal('settingsFooterNote');
    settings.printerSize = document.getElementById('settingsPrinterSize')?.value || '58mm';

    db.saveSettings(settings);

    if (window.App) {
      App.playSound('chime');
      App.showToast('Pengaturan outlet berhasil disimpan!', 'success');
      App.updateAppHeader();
    }
  },

  // ===== SERVICES MANAGER =====
  renderServicesList() {
    const services = db.getServices();
    const container = document.getElementById('settingsServicesList');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-2">
        ${services.map(s => `
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800 dark:text-slate-200">${s.name}</span>
                <span class="bg-slate-100 dark:bg-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">${s.type}</span>
              </div>
              <p class="text-slate-400 text-[11px] mt-0.5">
                ${ReceiptManager.formatCurrency(s.price)} / ${s.unit} • Durasi: ${s.durationHours} Jam
              </p>
            </div>
            <div class="flex items-center gap-1">
              <button type="button" onclick="SettingsManager.openEditServiceModal('${s.id}')" class="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button type="button" onclick="SettingsManager.deleteService('${s.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  editingServiceId: null,

  openAddServiceModal() {
    this.editingServiceId = null;
    const modal = document.getElementById('serviceFormModal');
    const form = document.getElementById('serviceForm');
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  },

  openEditServiceModal(id) {
    const srv = db.getServices().find(s => s.id === id);
    if (!srv) return;

    this.editingServiceId = id;
    const modal = document.getElementById('serviceFormModal');

    document.getElementById('srvFormName').value = srv.name || '';
    document.getElementById('srvFormType').value = srv.type || 'kiloan';
    document.getElementById('srvFormPrice').value = srv.price || 0;
    document.getElementById('srvFormUnit').value = srv.unit || 'kg';
    document.getElementById('srvFormDuration').value = srv.durationHours || 24;
    document.getElementById('srvFormDesc').value = srv.description || '';

    if (modal) modal.classList.remove('hidden');
  },

  closeServiceModal() {
    const modal = document.getElementById('serviceFormModal');
    if (modal) modal.classList.add('hidden');
    this.editingServiceId = null;
  },

  saveServiceForm() {
    const name = document.getElementById('srvFormName')?.value.trim();
    const type = document.getElementById('srvFormType')?.value || 'kiloan';
    const price = parseFloat(document.getElementById('srvFormPrice')?.value) || 0;
    const unit = document.getElementById('srvFormUnit')?.value.trim() || 'kg';
    const durationHours = parseInt(document.getElementById('srvFormDuration')?.value) || 24;
    const description = document.getElementById('srvFormDesc')?.value.trim();

    if (!name || price <= 0) {
      alert('Nama layanan dan tarif harga wajib diisi.');
      return;
    }

    db.saveService({
      id: this.editingServiceId,
      name,
      type,
      price,
      unit,
      durationHours,
      description
    });

    if (window.App) App.showToast('Layanan berhasil disimpan', 'success');

    this.closeServiceModal();
    this.renderServicesList();
    if (window.POSManager) POSManager.renderServicesCatalog();
  },

  deleteService(id) {
    if (confirm('Hapus jenis layanan ini?')) {
      db.deleteService(id);
      if (window.App) App.showToast('Layanan dihapus', 'info');
      this.renderServicesList();
      if (window.POSManager) POSManager.renderServicesCatalog();
    }
  },

  // ===== FRAGRANCES =====
  renderFragrancesList() {
    const fragrances = db.getFragrances();
    const container = document.getElementById('settingsFragrancesList');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-wrap gap-2">
        ${fragrances.map((f, idx) => `
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <span>🌸 ${f}</span>
            <button type="button" onclick="SettingsManager.deleteFragrance(${idx})" class="text-slate-400 hover:text-rose-500 ml-1">×</button>
          </span>
        `).join('')}
      </div>
    `;
  },

  addFragrance() {
    const input = document.getElementById('newFragranceInput');
    const val = input?.value.trim();
    if (!val) return;

    const list = db.getFragrances();
    list.push(val);
    db.saveFragrances(list);

    input.value = '';
    this.renderFragrancesList();
    if (window.POSManager) POSManager.renderParfumOptions();
    if (window.App) App.showToast(`Parfum "${val}" ditambahkan`, 'success');
  },

  deleteFragrance(index) {
    const list = db.getFragrances();
    list.splice(index, 1);
    db.saveFragrances(list);
    this.renderFragrancesList();
    if (window.POSManager) POSManager.renderParfumOptions();
  },

  // ===== RACKS =====
  renderRacksList() {
    const settings = db.getSettings();
    const racks = settings.rackList || [];
    const container = document.getElementById('settingsRacksList');
    if (!container) return;

    container.innerHTML = `
      <div class="flex flex-wrap gap-2">
        ${racks.map((r, idx) => `
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <span>📍 ${r}</span>
            <button type="button" onclick="SettingsManager.deleteRack(${idx})" class="text-slate-400 hover:text-rose-500 ml-1">×</button>
          </span>
        `).join('')}
      </div>
    `;
  },

  addRack() {
    const input = document.getElementById('newRackInput');
    const val = input?.value.trim();
    if (!val) return;

    const settings = db.getSettings();
    if (!settings.rackList) settings.rackList = [];
    settings.rackList.push(val);
    db.saveSettings(settings);

    input.value = '';
    this.renderRacksList();
    if (window.POSManager) POSManager.renderRackOptions();
    if (window.App) App.showToast(`Rak "${val}" ditambahkan`, 'success');
  },

  deleteRack(index) {
    const settings = db.getSettings();
    settings.rackList.splice(index, 1);
    db.saveSettings(settings);
    this.renderRacksList();
    if (window.POSManager) POSManager.renderRackOptions();
  },

  // ===== USERS & ROLES MANAGER =====
  renderUsersList() {
    const users = db.getUsers();
    const container = document.getElementById('settingsUsersList');
    if (!container) return;

    const currentUser = window.AuthManager ? AuthManager.getCurrentUser() : null;

    container.innerHTML = `
      <div class="space-y-2.5">
        ${users.map(u => {
          const isAdmin = u.role === 'admin';
          const isCurrent = currentUser?.id === u.id;
          return `
            <div class="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border ${isCurrent ? 'border-sky-400 dark:border-sky-500 ring-1 ring-sky-400/30' : 'border-slate-200 dark:border-slate-700/70'} flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isAdmin ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-sky-100 dark:bg-sky-950 text-sky-600'} shrink-0">
                  ${u.avatar || (isAdmin ? '👑' : '💼')}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100">${u.name}</span>
                    <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${isAdmin ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400'}">
                      ${isAdmin ? 'Admin (Owner)' : 'Kasir (Staff)'}
                    </span>
                    ${isCurrent ? '<span class="text-[9px] font-bold bg-sky-500 text-white px-1.5 py-0.2 rounded-full">Akun Aktif</span>' : ''}
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">
                    Username: <span class="font-mono text-slate-600 dark:text-slate-300">@${u.username}</span> • PIN: <span class="font-mono font-bold text-slate-700 dark:text-slate-200">${u.pin || '••••'}</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <button type="button" onclick="SettingsManager.openEditUserModal('${u.id}')" class="p-2 text-slate-400 hover:text-sky-500 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Edit Akun & PIN">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                ${u.id !== 'usr_admin' ? `
                  <button type="button" onclick="SettingsManager.deleteUser('${u.id}')" class="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Hapus Akun">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  editingUserId: null,

  openAddUserModal() {
    this.editingUserId = null;
    const modal = document.getElementById('userFormModal');
    const form = document.getElementById('userForm');
    const titleEl = document.getElementById('userFormModalTitle');
    if (titleEl) titleEl.innerText = 'Tambah Pengguna Baru';
    if (form) form.reset();
    
    document.getElementById('userFormRole').value = 'kasir';
    document.getElementById('userFormAvatar').value = '💼';

    if (modal) modal.classList.remove('hidden');
  },

  openEditUserModal(id) {
    const user = db.getUserById(id);
    if (!user) return;

    this.editingUserId = id;
    const modal = document.getElementById('userFormModal');
    const titleEl = document.getElementById('userFormModalTitle');
    if (titleEl) titleEl.innerText = `Edit Pengguna: ${user.name}`;

    document.getElementById('userFormName').value = user.name || '';
    document.getElementById('userFormUsername').value = user.username || '';
    document.getElementById('userFormRole').value = user.role || 'kasir';
    document.getElementById('userFormPin').value = user.pin || '';
    document.getElementById('userFormAvatar').value = user.avatar || (user.role === 'admin' ? '👑' : '💼');

    if (modal) modal.classList.remove('hidden');
  },

  closeUserModal() {
    const modal = document.getElementById('userFormModal');
    if (modal) modal.classList.add('hidden');
    this.editingUserId = null;
  },

  saveUserForm() {
    const name = document.getElementById('userFormName')?.value.trim();
    const username = document.getElementById('userFormUsername')?.value.trim().toLowerCase();
    const role = document.getElementById('userFormRole')?.value || 'kasir';
    const pin = document.getElementById('userFormPin')?.value.trim();
    const avatar = document.getElementById('userFormAvatar')?.value.trim() || (role === 'admin' ? '👑' : '💼');

    if (!name || !username || !pin) {
      alert('Nama, Username, dan PIN wajib diisi!');
      return;
    }

    if (pin.length < 4) {
      alert('PIN minimal 4 digit angka.');
      return;
    }

    // Check username uniqueness
    const existing = db.getUserByUsername(username);
    if (existing && existing.id !== this.editingUserId) {
      alert('Username sudah digunakan oleh akun lain. Gunakan username lain.');
      return;
    }

    db.saveUser({
      id: this.editingUserId,
      name,
      username,
      role,
      pin,
      avatar,
      color: role === 'admin' ? 'emerald' : 'sky'
    });

    if (window.App) {
      App.playSound('chime');
      App.showToast('Akun pengguna berhasil disimpan!', 'success');
    }

    this.closeUserModal();
    this.renderUsersList();
    if (window.AuthManager) AuthManager.updateRoleUI();
  },

  deleteUser(id) {
    if (id === 'usr_admin') {
      alert('Akun Administrator utama tidak dapat dihapus.');
      return;
    }

    if (confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      db.deleteUser(id);
      if (window.App) {
        App.playSound('pop');
        App.showToast('Pengguna telah dihapus', 'info');
      }
      this.renderUsersList();
      if (window.AuthManager) AuthManager.updateRoleUI();
    }
  },

  // ===== BACKUP & RESTORE =====
  downloadBackup() {
    const jsonStr = db.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = db.formatDateId(new Date());

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-smartlaundry-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);

    if (window.App) App.showToast('File backup database berhasil diunduh!', 'success');
  },

  triggerRestoreFileInput() {
    document.getElementById('restoreFileInput')?.click();
  },

  handleRestoreFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = db.importData(e.target.result);
      if (result.success) {
        alert('Data berhasil dipulihkan (Restore Sukses)! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } else {
        alert('Gagal memulihkan data: Format file tidak valid.');
      }
    };
    reader.readAsText(file);
  },

  resetDemoData() {
    if (confirm('PERINGATAN: Seluruh data transaksi, pelanggan, dan pengaturan akan dikembalikan ke data demo awal pabrik.\n\nApakah Anda yakin?')) {
      db.resetToDefaults();
      alert('Data demo berhasil direset!');
      window.location.reload();
    }
  }
};

window.SettingsManager = SettingsManager;
