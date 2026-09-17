/**
 * SmartLaundry Pro - Orders & Pipeline Tracking Module
 * Handles order list, Kanban status pipeline, search, fast status forward, and WhatsApp alerts.
 */

const STATUS_PIPELINE = [
  { id: 'Diterima', label: 'Diterima', icon: '📥', color: 'slate', desc: 'Cucian baru masuk' },
  { id: 'Dicuci', label: 'Dicuci', icon: '🧼', color: 'sky', desc: 'Sedang dalam mesin cuci' },
  { id: 'Dikeringkan', label: 'Dikeringkan', icon: '☀️', color: 'amber', desc: 'Dalam dryer / jemuran' },
  { id: 'Disetrika', label: 'Disetrika', icon: '💨', color: 'purple', desc: 'Proses setrika & packing' },
  { id: 'Siap Diambil', label: 'Siap Diambil', icon: '📦', color: 'emerald', desc: 'Selesai di rak simpan' },
  { id: 'Sudah Diambil', label: 'Sudah Diambil', icon: '✅', color: 'green', desc: 'Pesanan tuntas' }
];

const OrdersManager = {
  currentFilter: 'all', // 'all', 'active', 'ready', 'unpaid', 'today'
  searchQuery: '',
  viewMode: 'list', // 'list' or 'kanban'

  init() {
    this.render();
  },

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter pill buttons
    const filterButtons = document.querySelectorAll('.order-filter-pill');
    filterButtons.forEach(btn => {
      if (btn.dataset.filter === filter) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-sm', 'shadow-sky-500/20');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-sky-500', 'text-white', 'shadow-sm', 'shadow-sky-500/20');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    this.render();
  },

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.render();
  },

  toggleViewMode(mode) {
    this.viewMode = mode;
    const listBtn = document.getElementById('btnViewList');
    const kanbanBtn = document.getElementById('btnViewKanban');
    
    if (listBtn) listBtn.classList.toggle('text-sky-500', mode === 'list');
    if (kanbanBtn) kanbanBtn.classList.toggle('text-sky-500', mode === 'kanban');

    this.render();
  },

  getFilteredOrders() {
    const orders = db.getOrders();
    const todayStr = db.formatDateId(new Date());

    return orders.filter(order => {
      // Search query filter
      if (this.searchQuery) {
        const matchId = order.id.toLowerCase().includes(this.searchQuery);
        const matchName = order.customer?.name?.toLowerCase().includes(this.searchQuery);
        const matchPhone = order.customer?.phone?.includes(this.searchQuery);
        const matchRack = order.rack?.toLowerCase().includes(this.searchQuery);
        if (!matchId && !matchName && !matchPhone && !matchRack) return false;
      }

      // Tab filter
      if (this.currentFilter === 'active') {
        return ['Diterima', 'Dicuci', 'Dikeringkan', 'Disetrika'].includes(order.status);
      } else if (this.currentFilter === 'ready') {
        return order.status === 'Siap Diambil';
      } else if (this.currentFilter === 'unpaid') {
        return order.paymentStatus !== 'Lunas';
      } else if (this.currentFilter === 'today') {
        return order.id.includes(todayStr);
      }

      return true; // 'all'
    });
  },

  render() {
    const orders = this.getFilteredOrders();
    const container = document.getElementById('ordersListContainer');
    const countBadge = document.getElementById('ordersCountBadge');
    
    if (countBadge) countBadge.innerText = `${orders.length} Pesanan`;

    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400 dark:text-slate-500">
          <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <p class="font-bold text-sm text-slate-600 dark:text-slate-400">Tidak ada pesanan ditemukan</p>
          <p class="text-xs mt-1">Coba ganti filter atau cari kata kunci lain</p>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'kanban') {
      this.renderKanban(orders, container);
    } else {
      this.renderListView(orders, container);
    }
  },

  renderListView(orders, container) {
    container.innerHTML = `
      <div class="space-y-3">
        ${orders.map(order => {
          const isPaid = order.paymentStatus === 'Lunas';
          const nextStatus = this.getNextStatus(order.status);
          const currentStage = STATUS_PIPELINE.find(s => s.id === order.status) || STATUS_PIPELINE[0];

          return `
            <div class="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all">
              <!-- Top Row: ID & Status Badge -->
              <div class="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                    ${order.id}
                  </span>
                  <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    📍 ${order.rack || '-'}
                  </span>
                </div>
                
                <div class="flex items-center gap-1.5">
                  <span class="status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}">
                    ${currentStage.icon} ${order.status}
                  </span>
                </div>
              </div>

              <!-- Customer & Items Summary -->
              <div class="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-sm text-slate-800 dark:text-slate-100">${order.customer?.name || 'Pelanggan Umum'}</h4>
                    <span class="text-xs text-slate-400 font-mono">${order.customer?.phone || ''}</span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    ${order.items.map(i => `${i.name} (${i.qty} ${i.type === 'kiloan' ? 'kg' : (i.unit || 'pcs')})`).join(', ')}
                  </p>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
                    <span>👤 Kasir: <b class="text-slate-600 dark:text-slate-300">${order.cashierName || 'Kasir'}</b></span>
                    <span>🌸 ${order.parfum || 'Standar'}</span>
                    <span>⏰ Est: ${ReceiptManager.formatDateTime(order.estimatedReady)}</span>
                    ${order.notes ? `<span class="text-amber-500 font-medium">📝 ${order.notes}</span>` : ''}
                  </div>
                </div>

                <div class="text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-700">
                  <p class="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                    ${ReceiptManager.formatCurrency(order.grandTotal)}
                  </p>
                  <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isPaid ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'}">
                    ${order.paymentStatus} (${order.paymentMethod || 'Tunai'})
                  </span>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5">
                  <button type="button" onclick="POSManager.openOrderReceiptModal('${order.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span>Nota</span>
                  </button>

                  <button type="button" onclick="ReceiptManager.openWhatsApp(db.getOrderById('${order.id}'), '${order.status === 'Siap Diambil' ? 'ready' : (order.paymentStatus !== 'Lunas' ? 'unpaid_reminder' : 'new_order')}')" class="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 shadow-sm shadow-emerald-500/20">
                    <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                    <span>WA</span>
                  </button>

                  ${!isPaid ? `
                    <button type="button" onclick="OrdersManager.openSettlePaymentModal('${order.id}')" class="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
                      <span>Pelunasan</span>
                    </button>
                  ` : ''}
                </div>

                <!-- Status Advancer Button -->
                <div class="flex items-center gap-1.5">
                  ${nextStatus ? `
                    <button type="button" onclick="OrdersManager.advanceStatus('${order.id}', '${nextStatus}')" class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-sky-500/20 active:scale-95 transition-all">
                      <span>Lanjut: ${nextStatus}</span>
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  ` : `
                    <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      Selesai
                    </span>
                  `}
                  
                  <button type="button" onclick="OrdersManager.openStatusHistoryModal('${order.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Riwayat Status">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </button>

                  <button type="button" onclick="OrdersManager.deleteOrder('${order.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400" title="Hapus Pesanan (Khusus Admin)">
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

  renderKanban(orders, container) {
    container.innerHTML = `
      <div class="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x">
        ${STATUS_PIPELINE.map(stage => {
          const stageOrders = orders.filter(o => o.status === stage.id);
          return `
            <div class="w-72 shrink-0 bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/60 snap-start flex flex-col max-h-[75vh]">
              <!-- Stage Header -->
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-1.5">
                  <span class="text-base">${stage.icon}</span>
                  <h4 class="font-bold text-xs text-slate-800 dark:text-slate-200">${stage.label}</h4>
                </div>
                <span class="bg-white dark:bg-slate-700 font-mono text-xs font-bold px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                  ${stageOrders.length}
                </span>
              </div>

              <!-- Cards Container -->
              <div class="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                ${stageOrders.length === 0 ? `
                  <div class="p-4 text-center text-xs text-slate-400">Kosong</div>
                ` : stageOrders.map(order => `
                  <div class="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-mono font-bold text-sky-600 dark:text-sky-400">${order.id}</span>
                      <span class="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">📍 ${order.rack}</span>
                    </div>
                    <div>
                      <p class="font-bold text-xs text-slate-800 dark:text-slate-200">${order.customer?.name || 'Umum'}</p>
                      <p class="text-[11px] text-slate-400 truncate">${order.items.map(i => i.name).join(', ')}</p>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${ReceiptManager.formatCurrency(order.grandTotal)}</span>
                      <button type="button" onclick="POSManager.openOrderReceiptModal('${order.id}')" class="text-sky-500 font-bold hover:underline">Nota</button>
                    </div>
                    ${this.getNextStatus(order.status) ? `
                      <button type="button" onclick="OrdersManager.advanceStatus('${order.id}', '${this.getNextStatus(order.status)}')" class="w-full py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[11px] font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1">
                        <span>Lanjut ➔ ${this.getNextStatus(order.status)}</span>
                      </button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  getNextStatus(currentStatus) {
    const idx = STATUS_PIPELINE.findIndex(s => s.id === currentStatus);
    if (idx >= 0 && idx < STATUS_PIPELINE.length - 1) {
      return STATUS_PIPELINE[idx + 1].id;
    }
    return null;
  },

  advanceStatus(orderId, newStatus) {
    const order = db.updateOrderStatus(orderId, newStatus);
    if (!order) return;

    if (window.App) {
      App.playSound('chime');
      App.showToast(`Status ${orderId} diubah menjadi "${newStatus}"`, 'info');
    }

    // If marked "Siap Diambil", offer to send WhatsApp
    if (newStatus === 'Siap Diambil' && order.customer?.phone) {
      setTimeout(() => {
        if (confirm(`Cucian ${order.customer.name} sudah SIAP DIAMBIL.\nKirim notifikasi WhatsApp sekarang?`)) {
          ReceiptManager.openWhatsApp(order, 'ready');
        }
      }, 300);
    }

    this.render();
  },

  openStatusHistoryModal(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('statusHistoryModal');
    const container = document.getElementById('statusHistoryList');
    const titleEl = document.getElementById('statusHistoryTitle');

    if (titleEl) titleEl.innerText = `Riwayat Status: ${order.id}`;

    if (container) {
      const history = order.statusHistory || [{ status: order.status, timestamp: order.createdAt }];
      container.innerHTML = history.map((h, idx) => `
        <div class="flex items-start gap-3 relative pb-4">
          ${idx < history.length - 1 ? '<div class="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>' : ''}
          <div class="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0 z-10">
            ${idx + 1}
          </div>
          <div class="flex-1">
            <p class="font-bold text-xs text-slate-800 dark:text-slate-200">${h.status}</p>
            <p class="text-[11px] text-slate-400">${ReceiptManager.formatDateTime(h.timestamp)}</p>
          </div>
        </div>
      `).join('');
    }

    if (modal) modal.classList.remove('hidden');
  },

  closeStatusHistoryModal() {
    const modal = document.getElementById('statusHistoryModal');
    if (modal) modal.classList.add('hidden');
  },

  // ===== SETTLE PAYMENT MODAL =====
  settleOrderId: null,

  openSettlePaymentModal(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) return;

    this.settleOrderId = orderId;
    const modal = document.getElementById('settlePaymentModal');
    const titleEl = document.getElementById('settleModalTitle');
    const sisaEl = document.getElementById('settleModalSisa');
    const cashInput = document.getElementById('settleCashInput');

    const sisa = Math.max(0, order.grandTotal - (order.paidAmount || 0));

    if (titleEl) titleEl.innerText = `Pelunasan: ${order.id} (${order.customer?.name || 'Pelanggan'})`;
    if (sisaEl) sisaEl.innerText = ReceiptManager.formatCurrency(sisa);
    if (cashInput) cashInput.value = sisa;

    if (modal) modal.classList.remove('hidden');
  },

  closeSettlePaymentModal() {
    const modal = document.getElementById('settlePaymentModal');
    if (modal) modal.classList.add('hidden');
    this.settleOrderId = null;
  },

  submitSettlePayment() {
    if (!this.settleOrderId) return;
    const order = db.getOrderById(this.settleOrderId);
    if (!order) return;

    const method = document.getElementById('settlePaymentMethodSelect')?.value || 'Tunai';
    const amount = parseFloat(document.getElementById('settleCashInput')?.value) || order.grandTotal;

    db.updateOrderPayment(this.settleOrderId, 'Lunas', method, order.grandTotal, 0);

    if (window.App) {
      App.playSound('cash');
      App.showToast(`Pembayaran ${this.settleOrderId} berhasil dilunasi!`, 'success');
    }

    this.closeSettlePaymentModal();
    this.render();
  },

  deleteOrder(orderId) {
    const doDelete = () => {
      if (confirm(`Apakah Anda yakin ingin menghapus pesanan ${orderId}?\nData yang dihapus tidak dapat dikembalikan.`)) {
        db.deleteOrder(orderId);
        if (window.App) {
          App.playSound('pop');
          App.showToast(`Pesanan ${orderId} berhasil dihapus`, 'info');
        }
        this.render();
      }
    };

    if (window.AuthManager) {
      AuthManager.requireAdmin(doDelete, `Hapus Pesanan ${orderId}`);
    } else {
      doDelete();
    }
  }
};

window.OrdersManager = OrdersManager;
