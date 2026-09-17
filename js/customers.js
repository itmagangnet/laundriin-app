/**
 * SmartLaundry Pro - Customers CRM Module
 * Manages customer database, loyalty tiers, order history, and direct WhatsApp contact.
 */

const CustomersManager = {
  searchQuery: '',

  init() {
    this.render();
  },

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.render();
  },

  getTier(spent, orders) {
    if (spent >= 500000 || orders >= 10) return { name: 'VIP Platinum', color: 'purple', badge: '👑 Platinum' };
    if (spent >= 200000 || orders >= 5) return { name: 'Gold Member', color: 'amber', badge: '⭐ Gold' };
    return { name: 'Silver Member', color: 'slate', badge: '🥉 Silver' };
  },

  render() {
    const container = document.getElementById('customersListContainer');
    const countBadge = document.getElementById('customersCountBadge');
    if (!container) return;

    let customers = db.getCustomers();

    if (this.searchQuery) {
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(this.searchQuery) ||
        (c.phone && c.phone.includes(this.searchQuery)) ||
        (c.address && c.address.toLowerCase().includes(this.searchQuery))
      );
    }

    if (countBadge) countBadge.innerText = `${customers.length} Orang`;

    if (customers.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400 dark:text-slate-500">
          <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <p class="font-bold text-sm text-slate-600 dark:text-slate-400">Tidak ada pelanggan ditemukan</p>
          <button type="button" onclick="CustomersManager.openAddCustomerModal()" class="mt-3 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-sm">
            + Tambah Pelanggan Baru
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${customers.map(c => {
          const tier = this.getTier(c.totalSpent || 0, c.totalOrders || 0);
          return `
            <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                      ${c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${c.name}</h4>
                      <p class="text-xs text-slate-400 font-mono">${c.phone || '-'}</p>
                    </div>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    ${tier.badge}
                  </span>
                </div>

                ${c.address ? `
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-2.5 flex items-start gap-1">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                    <span>${c.address}</span>
                  </p>
                ` : ''}

                <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                    <p class="text-[10px] text-slate-400">Order</p>
                    <p class="font-bold font-mono text-xs text-slate-800 dark:text-slate-200">${c.totalOrders || 0}x</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                    <p class="text-[10px] text-slate-400">Total Belanja</p>
                    <p class="font-bold font-mono text-xs text-sky-600 dark:text-sky-400">${ReceiptManager.formatCurrency(c.totalSpent || 0)}</p>
                  </div>
                  <div class="bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                    <p class="text-[10px] text-slate-400">Poin</p>
                    <p class="font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">${c.points || 0}</p>
                  </div>
                </div>
              </div>

              <!-- Customer Actions -->
              <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  ${c.phone ? `
                    <button type="button" onclick="CustomersManager.chatWhatsApp('${c.phone}', '${c.name}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shadow-sm shadow-emerald-500/20">
                      <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                      <span>Chat WA</span>
                    </button>
                  ` : ''}

                  <button type="button" onclick="CustomersManager.openCustomerHistoryModal('${c.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                    Riwayat
                  </button>
                </div>

                <div class="flex items-center gap-1">
                  <button type="button" onclick="CustomersManager.openEditCustomerModal('${c.id}')" class="p-1.5 text-slate-400 hover:text-sky-500 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button type="button" onclick="CustomersManager.deleteCustomer('${c.id}')" class="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  chatWhatsApp(phone, name) {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.substring(1);
    const store = db.getSettings().storeName || 'Laundry';
    const text = encodeURIComponent(`Halo Kak ${name},\nTerima kasih telah menjadi pelanggan setia di *${store}*. Ada yang bisa kami bantu? 😊`);
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  },

  // ===== ADD / EDIT MODAL =====
  editingCustomerId: null,

  openAddCustomerModal() {
    this.editingCustomerId = null;
    const modal = document.getElementById('customerFormModal');
    const title = document.getElementById('customerFormModalTitle');
    const form = document.getElementById('customerForm');
    
    if (title) title.innerText = 'Tambah Pelanggan Baru';
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  },

  openEditCustomerModal(id) {
    const customer = db.getCustomerById(id);
    if (!customer) return;

    this.editingCustomerId = id;
    const modal = document.getElementById('customerFormModal');
    const title = document.getElementById('customerFormModalTitle');

    if (title) title.innerText = 'Edit Data Pelanggan';
    
    document.getElementById('custFormName').value = customer.name || '';
    document.getElementById('custFormPhone').value = customer.phone || '';
    document.getElementById('custFormAddress').value = customer.address || '';
    document.getElementById('custFormNotes').value = customer.notes || '';

    if (modal) modal.classList.remove('hidden');
  },

  closeCustomerModal() {
    const modal = document.getElementById('customerFormModal');
    if (modal) modal.classList.add('hidden');
    this.editingCustomerId = null;
  },

  saveCustomerForm() {
    const name = document.getElementById('custFormName')?.value.trim();
    const phone = document.getElementById('custFormPhone')?.value.trim();
    const address = document.getElementById('custFormAddress')?.value.trim();
    const notes = document.getElementById('custFormNotes')?.value.trim();

    if (!name) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    db.saveCustomer({
      id: this.editingCustomerId,
      name,
      phone,
      address,
      notes
    });

    if (window.App) {
      App.playSound('chime');
      App.showToast(`Data pelanggan "${name}" berhasil disimpan!`, 'success');
    }

    this.closeCustomerModal();
    this.render();
    if (window.POSManager) POSManager.renderCustomerSelect();
  },

  deleteCustomer(id) {
    const customer = db.getCustomerById(id);
    if (!customer) return;

    const doDelete = () => {
      if (confirm(`Yakin ingin menghapus pelanggan "${customer.name}"?\nData riwayat cucian pelanggan akan tetap tersimpan.`)) {
        db.deleteCustomer(id);
        if (window.App) {
          App.playSound('pop');
          App.showToast('Pelanggan berhasil dihapus', 'info');
        }
        this.render();
        if (window.POSManager) POSManager.renderCustomerSelect();
      }
    };

    if (window.AuthManager) {
      AuthManager.requireAdmin(doDelete, `Hapus Data Pelanggan "${customer.name}"`);
    } else {
      doDelete();
    }
  },

  // ===== HISTORY MODAL =====
  openCustomerHistoryModal(id) {
    const customer = db.getCustomerById(id);
    if (!customer) return;

    const orders = db.getOrders().filter(o => o.customer?.id === id || (o.customer?.phone && o.customer?.phone === customer.phone));
    const modal = document.getElementById('customerHistoryModal');
    const title = document.getElementById('customerHistoryTitle');
    const container = document.getElementById('customerHistoryOrdersList');

    if (title) title.innerText = `Riwayat Cucian: ${customer.name}`;

    if (container) {
      if (orders.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-6">Belum ada riwayat pesanan.</p>`;
      } else {
        container.innerHTML = orders.map(o => `
          <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span class="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">${o.id}</span>
              <p class="text-xs text-slate-600 dark:text-slate-300">${o.items.map(i => i.name).join(', ')}</p>
              <p class="text-[10px] text-slate-400">${ReceiptManager.formatDateTime(o.createdAt)}</p>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-xs text-slate-900 dark:text-white">${ReceiptManager.formatCurrency(o.grandTotal)}</span>
              <p class="text-[10px] font-bold ${o.paymentStatus === 'Lunas' ? 'text-emerald-500' : 'text-rose-500'}">${o.paymentStatus}</p>
            </div>
          </div>
        `).join('');
      }
    }

    if (modal) modal.classList.remove('hidden');
  },

  closeCustomerHistoryModal() {
    const modal = document.getElementById('customerHistoryModal');
    if (modal) modal.classList.add('hidden');
  }
};

window.CustomersManager = CustomersManager;
