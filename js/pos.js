/**
 * SmartLaundry Pro - POS (Kasir) Module
 * Handles customer selection, cart items, weight stepper, payments & order completion.
 */

const POSManager = {
  cart: [],
  selectedCustomer: null,
  selectedParfum: '',
  selectedRack: '',
  notes: '',
  discountAmount: 0,
  taxAmount: 0,
  estimatedHours: 48,

  init() {
    this.resetCart();
    this.renderCustomerSelect();
    this.renderServicesCatalog();
    this.renderParfumOptions();
    this.renderRackOptions();
  },

  resetCart() {
    this.cart = [];
    this.selectedCustomer = null;
    this.discountAmount = 0;
    this.taxAmount = 0;
    this.notes = '';
    
    const settings = db.getSettings();
    this.selectedParfum = settings.defaultParfum || 'Akasia Soft (Best Seller)';
    this.selectedRack = settings.rackList?.[0] || 'Rak A-01';

    // Reset customer input fields
    const custSearch = document.getElementById('posCustomerSearch');
    if (custSearch) custSearch.value = '';
    const custName = document.getElementById('posCustName');
    if (custName) custName.value = '';
    const custPhone = document.getElementById('posCustPhone');
    if (custPhone) custPhone.value = '';
    const custAddr = document.getElementById('posCustAddress');
    if (custAddr) custAddr.value = '';
    const noteInput = document.getElementById('posOrderNotes');
    if (noteInput) noteInput.value = '';

    this.renderCart();
  },

  renderCustomerSelect() {
    const customers = db.getCustomers();
    const dropdown = document.getElementById('posCustomerDropdown');
    if (!dropdown) return;

    dropdown.innerHTML = `
      <div class="p-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-500">
        <span>PILIH PELANGGAN TERDAFTAR</span>
        <span class="text-sky-500">${customers.length} Orang</span>
      </div>
      <div class="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        ${customers.map(c => `
          <button type="button" onclick="POSManager.selectCustomer('${c.id}')" class="w-full text-left p-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors">
            <div>
              <p class="font-bold text-xs text-slate-800 dark:text-slate-200">${c.name}</p>
              <p class="text-[11px] text-slate-400 font-mono">${c.phone || '-'}</p>
            </div>
            <div class="text-right text-[10px] text-slate-400">
              <span class="bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded font-bold">${c.points || 0} Poin</span>
              <p class="mt-0.5">${c.totalOrders || 0}x Order</p>
            </div>
          </button>
        `).join('')}
      </div>
    `;
  },

  selectCustomer(customerId) {
    const customer = db.getCustomerById(customerId);
    if (!customer) return;

    this.selectedCustomer = customer;
    
    const custSearch = document.getElementById('posCustomerSearch');
    if (custSearch) custSearch.value = `${customer.name} (${customer.phone || '-'})`;
    
    const custName = document.getElementById('posCustName');
    if (custName) custName.value = customer.name;
    
    const custPhone = document.getElementById('posCustPhone');
    if (custPhone) custPhone.value = customer.phone || '';
    
    const custAddr = document.getElementById('posCustAddress');
    if (custAddr) custAddr.value = customer.address || '';

    // Hide dropdown
    const dd = document.getElementById('posCustomerDropdown');
    if (dd) dd.classList.add('hidden');

    if (window.App) App.playSound('beep');
  },

  filterCustomerDropdown(query) {
    const dd = document.getElementById('posCustomerDropdown');
    if (!dd) return;

    if (!query) {
      dd.classList.remove('hidden');
      this.renderCustomerSelect();
      return;
    }

    const customers = db.getCustomers();
    const q = query.toLowerCase();
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      (c.phone && c.phone.includes(q))
    );

    dd.classList.remove('hidden');
    dd.innerHTML = `
      <div class="p-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
        HASIL PENCARIAN (${filtered.length})
      </div>
      <div class="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        ${filtered.length === 0 ? `
          <div class="p-3 text-center text-xs text-slate-400">
            Pelanggan baru? Ketik nama & no HP di form bawah.
          </div>
        ` : filtered.map(c => `
          <button type="button" onclick="POSManager.selectCustomer('${c.id}')" class="w-full text-left p-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors">
            <div>
              <p class="font-bold text-xs text-slate-800 dark:text-slate-200">${c.name}</p>
              <p class="text-[11px] text-slate-400 font-mono">${c.phone || '-'}</p>
            </div>
            <span class="bg-sky-100 dark:bg-sky-950 text-sky-600 text-[10px] px-1.5 py-0.5 rounded font-bold">${c.points || 0} Poin</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  renderServicesCatalog() {
    const services = db.getServices();
    const kiloanList = services.filter(s => s.type === 'kiloan');
    const satuanList = services.filter(s => s.type === 'satuan');

    const kiloanContainer = document.getElementById('posKiloanServices');
    if (kiloanContainer) {
      kiloanContainer.innerHTML = kiloanList.map(srv => `
        <div class="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:border-sky-400 dark:hover:border-sky-500 transition-all">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">${srv.name}</h4>
              <span class="bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 font-mono">${srv.durationHours} Jam</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2">${srv.description || ''}</p>
          </div>
          <div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <span class="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">${ReceiptManager.formatCurrency(srv.price)}<span class="text-[10px] text-slate-400 font-normal">/${srv.unit}</span></span>
            <button type="button" onclick="POSManager.openKiloanModal('${srv.id}')" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1">
              <span>+ Timbang</span>
            </button>
          </div>
        </div>
      `).join('');
    }

    const satuanContainer = document.getElementById('posSatuanServices');
    if (satuanContainer) {
      satuanContainer.innerHTML = satuanList.map(srv => `
        <div class="bg-white dark:bg-slate-800/90 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 shadow-sm flex items-center justify-between hover:border-sky-400 transition-all">
          <div class="pr-2">
            <h4 class="font-bold text-xs text-slate-800 dark:text-slate-100 leading-tight">${srv.name}</h4>
            <p class="text-[11px] text-sky-600 dark:text-sky-400 font-bold font-mono mt-0.5">${ReceiptManager.formatCurrency(srv.price)} <span class="text-[10px] text-slate-400 font-normal">/${srv.unit}</span></p>
          </div>
          <button type="button" onclick="POSManager.addItemToCart('${srv.id}', 1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-sky-500 hover:text-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm shadow-sm active:scale-90 transition-all">
            +
          </button>
        </div>
      `).join('');
    }
  },

  renderParfumOptions() {
    const fragrances = db.getFragrances();
    const select = document.getElementById('posParfumSelect');
    if (!select) return;

    select.innerHTML = fragrances.map(f => `
      <option value="${f}" ${f === this.selectedParfum ? 'selected' : ''}>🌸 ${f}</option>
    `).join('');
  },

  renderRackOptions() {
    const settings = db.getSettings();
    const select = document.getElementById('posRackSelect');
    if (!select) return;

    const racks = settings.rackList || ['Rak A-01', 'Rak A-02', 'Rak B-01', 'Rak B-02'];
    select.innerHTML = racks.map(r => `
      <option value="${r}" ${r === this.selectedRack ? 'selected' : ''}>📍 ${r}</option>
    `).join('');
  },

  // ===== KILOAN WEIGH MODAL =====
  activeKiloanService: null,
  kiloanWeight: 1.0,

  openKiloanModal(serviceId) {
    const service = db.getServices().find(s => s.id === serviceId);
    if (!service) return;

    this.activeKiloanService = service;
    this.kiloanWeight = 1.0;

    const titleEl = document.getElementById('kiloanModalTitle');
    const priceEl = document.getElementById('kiloanModalPrice');
    const inputEl = document.getElementById('kiloanWeightInput');
    const subtotalEl = document.getElementById('kiloanModalSubtotal');

    if (titleEl) titleEl.innerText = service.name;
    if (priceEl) priceEl.innerText = `${ReceiptManager.formatCurrency(service.price)} / ${service.unit}`;
    if (inputEl) inputEl.value = this.kiloanWeight.toFixed(2);
    
    this.updateKiloanModalSubtotal();

    const modal = document.getElementById('kiloanWeightModal');
    if (modal) modal.classList.remove('hidden');
    
    if (window.App) App.playSound('pop');
  },

  closeKiloanModal() {
    const modal = document.getElementById('kiloanWeightModal');
    if (modal) modal.classList.add('hidden');
    this.activeKiloanService = null;
  },

  setKiloanWeight(val) {
    this.kiloanWeight = Math.max(0.1, parseFloat(val) || 0.1);
    const inputEl = document.getElementById('kiloanWeightInput');
    if (inputEl) inputEl.value = this.kiloanWeight.toFixed(2);
    this.updateKiloanModalSubtotal();
  },

  addKiloanWeight(step) {
    this.kiloanWeight = Math.max(0.1, Math.round((this.kiloanWeight + step) * 100) / 100);
    const inputEl = document.getElementById('kiloanWeightInput');
    if (inputEl) inputEl.value = this.kiloanWeight.toFixed(2);
    this.updateKiloanModalSubtotal();
  },

  updateKiloanModalSubtotal() {
    if (!this.activeKiloanService) return;
    const subtotal = Math.round(this.kiloanWeight * this.activeKiloanService.price);
    const subtotalEl = document.getElementById('kiloanModalSubtotal');
    if (subtotalEl) subtotalEl.innerText = ReceiptManager.formatCurrency(subtotal);
  },

  confirmKiloanWeight() {
    if (!this.activeKiloanService) return;
    this.addItemToCart(this.activeKiloanService.id, this.kiloanWeight);
    this.closeKiloanModal();
  },

  // ===== CART MANAGEMENT =====
  addItemToCart(serviceId, qty) {
    const service = db.getServices().find(s => s.id === serviceId);
    if (!service) return;

    const existingIndex = this.cart.findIndex(i => i.serviceId === serviceId);

    if (existingIndex >= 0) {
      if (service.type === 'satuan') {
        this.cart[existingIndex].qty += qty;
      } else {
        // For kiloan, update or accumulate
        this.cart[existingIndex].qty = Math.round((this.cart[existingIndex].qty + qty) * 100) / 100;
      }
      this.cart[existingIndex].subtotal = Math.round(this.cart[existingIndex].qty * service.price);
    } else {
      this.cart.push({
        serviceId: service.id,
        name: service.name,
        type: service.type,
        unit: service.unit,
        price: service.price,
        durationHours: service.durationHours || 48,
        qty: qty,
        subtotal: Math.round(qty * service.price)
      });
    }

    if (window.App) App.playSound('beep');
    this.renderCart();
  },

  updateCartItemQty(index, newQty) {
    if (index < 0 || index >= this.cart.length) return;
    
    if (newQty <= 0) {
      this.cart.splice(index, 1);
    } else {
      this.cart[index].qty = Math.round(newQty * 100) / 100;
      this.cart[index].subtotal = Math.round(this.cart[index].qty * this.cart[index].price);
    }
    this.renderCart();
  },

  removeCartItem(index) {
    if (index >= 0 && index < this.cart.length) {
      this.cart.splice(index, 1);
      this.renderCart();
    }
  },

  calculateTotals() {
    const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    const grandTotal = Math.max(0, subtotal - this.discountAmount + this.taxAmount);
    
    // Estimate longest duration
    let maxHours = 24;
    this.cart.forEach(item => {
      if (item.durationHours && item.durationHours > maxHours) {
        maxHours = item.durationHours;
      }
    });
    this.estimatedHours = maxHours;

    return { subtotal, grandTotal, maxHours };
  },

  renderCart() {
    const container = document.getElementById('posCartItemsList');
    const emptyState = document.getElementById('posCartEmptyState');
    const badgeCount = document.getElementById('posCartCountBadge');
    const subtotalDisplay = document.getElementById('posSubtotalDisplay');
    const grandTotalDisplay = document.getElementById('posGrandTotalDisplay');
    const payButtonTotal = document.getElementById('posPayButtonTotal');

    const { subtotal, grandTotal } = this.calculateTotals();

    if (badgeCount) badgeCount.innerText = `${this.cart.length} Item`;
    if (subtotalDisplay) subtotalDisplay.innerText = ReceiptManager.formatCurrency(subtotal);
    if (grandTotalDisplay) grandTotalDisplay.innerText = ReceiptManager.formatCurrency(grandTotal);
    if (payButtonTotal) payButtonTotal.innerText = ReceiptManager.formatCurrency(grandTotal);

    if (this.cart.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    if (container) {
      container.innerHTML = this.cart.map((item, idx) => `
        <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
          <div class="flex-1 min-w-0">
            <h5 class="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">${item.name}</h5>
            <p class="text-[11px] text-slate-400 font-mono mt-0.5">
              ${item.qty} ${item.unit} × ${ReceiptManager.formatCurrency(item.price)}
            </p>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Qty Stepper -->
            <div class="flex items-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-0.5">
              <button type="button" onclick="POSManager.updateCartItemQty(${idx}, ${item.type === 'kiloan' ? (item.qty - 0.5).toFixed(1) : item.qty - 1})" class="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-xs font-bold active:scale-90">-</button>
              <span class="w-10 text-center text-xs font-bold font-mono text-slate-800 dark:text-slate-100">${item.qty}</span>
              <button type="button" onclick="POSManager.updateCartItemQty(${idx}, ${item.type === 'kiloan' ? (item.qty + 0.5).toFixed(1) : item.qty + 1})" class="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-xs font-bold active:scale-90">+</button>
            </div>

            <span class="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 w-16 text-right">
              ${ReceiptManager.formatCurrency(item.subtotal)}
            </span>

            <button type="button" onclick="POSManager.removeCartItem(${idx})" class="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `).join('');
    }
  },

  // ===== PAYMENT MODAL =====
  paymentMethod: 'Tunai',
  paymentStatus: 'Lunas',
  paidAmountInput: 0,

  openPaymentModal() {
    if (this.cart.length === 0) {
      alert('Pilih minimal satu layanan laundry terlebih dahulu.');
      return;
    }

    const { grandTotal } = this.calculateTotals();
    this.paidAmountInput = grandTotal;
    this.paymentMethod = 'Tunai';
    this.paymentStatus = 'Lunas';

    const grandTotalEl = document.getElementById('payModalGrandTotal');
    const cashInput = document.getElementById('payCashInput');
    
    if (grandTotalEl) grandTotalEl.innerText = ReceiptManager.formatCurrency(grandTotal);
    if (cashInput) cashInput.value = grandTotal;

    this.selectPaymentMethod('Tunai');
    this.updatePaymentCalculations();

    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('hidden');
    
    if (window.App) App.playSound('pop');
  },

  closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.add('hidden');
  },

  selectPaymentMethod(method) {
    this.paymentMethod = method;
    
    // Toggle active styles on payment buttons
    const buttons = document.querySelectorAll('.btn-pay-method');
    buttons.forEach(btn => {
      if (btn.dataset.method === method) {
        btn.classList.add('border-sky-500', 'bg-sky-50', 'text-sky-600', 'dark:bg-sky-950/60', 'dark:border-sky-500');
        btn.classList.remove('border-slate-200', 'dark:border-slate-700');
      } else {
        btn.classList.remove('border-sky-500', 'bg-sky-50', 'text-sky-600', 'dark:bg-sky-950/60', 'dark:border-sky-500');
        btn.classList.add('border-slate-200', 'dark:border-slate-700');
      }
    });

    const cashSection = document.getElementById('payCashSection');
    const qrisSection = document.getElementById('payQrisSection');
    const transferSection = document.getElementById('payTransferSection');

    if (cashSection) cashSection.classList.toggle('hidden', method !== 'Tunai');
    if (qrisSection) qrisSection.classList.toggle('hidden', method !== 'QRIS');
    if (transferSection) transferSection.classList.toggle('hidden', method !== 'Transfer');

    const { grandTotal } = this.calculateTotals();

    if (method === 'Belum Lunas' || method === 'Bayar Nanti') {
      this.paymentStatus = 'Belum Lunas';
      this.paidAmountInput = 0;
    } else {
      this.paymentStatus = 'Lunas';
      if (method !== 'Tunai') {
        this.paidAmountInput = grandTotal;
      }
    }

    if (method === 'QRIS') {
      this.generateQrisQr();
    }

    this.updatePaymentCalculations();
  },

  setQuickCash(amount) {
    const { grandTotal } = this.calculateTotals();
    if (amount === 'PAS') {
      this.paidAmountInput = grandTotal;
    } else {
      this.paidAmountInput = parseFloat(amount) || grandTotal;
    }

    const cashInput = document.getElementById('payCashInput');
    if (cashInput) cashInput.value = this.paidAmountInput;
    this.updatePaymentCalculations();
  },

  updatePaymentCalculations() {
    const { grandTotal } = this.calculateTotals();
    const cashInput = document.getElementById('payCashInput');
    if (cashInput && this.paymentMethod === 'Tunai') {
      this.paidAmountInput = parseFloat(cashInput.value) || 0;
    }

    const change = Math.max(0, this.paidAmountInput - grandTotal);
    const changeEl = document.getElementById('payChangeAmount');
    if (changeEl) changeEl.innerText = ReceiptManager.formatCurrency(change);

    const sisa = Math.max(0, grandTotal - this.paidAmountInput);
    const sisaContainer = document.getElementById('paySisaContainer');
    const sisaEl = document.getElementById('paySisaAmount');
    if (sisaContainer && sisaEl) {
      if (this.paidAmountInput < grandTotal && this.paidAmountInput > 0) {
        sisaContainer.classList.remove('hidden');
        sisaEl.innerText = ReceiptManager.formatCurrency(sisa);
        this.paymentStatus = 'DP (Uang Muka)';
      } else if (this.paidAmountInput === 0) {
        sisaContainer.classList.remove('hidden');
        sisaEl.innerText = ReceiptManager.formatCurrency(grandTotal);
        this.paymentStatus = 'Belum Lunas';
      } else {
        sisaContainer.classList.add('hidden');
        this.paymentStatus = 'Lunas';
      }
    }
  },

  generateQrisQr() {
    const { grandTotal } = this.calculateTotals();
    const qrisContainer = document.getElementById('payQrisQrCanvas');
    if (!qrisContainer) return;
    qrisContainer.innerHTML = '';

    if (window.QRCode) {
      new QRCode(qrisContainer, {
        text: `00020101021226580016ID.CO.QRIS.WWW0118936005030000080214${Date.now()}520458125303360540${grandTotal}5802ID5914SMARTLAUNDRY6007JAKARTA6304ABCD`,
        width: 160,
        height: 160,
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  },

  // ===== COMPLETE TRANSACTION =====
  submitOrder() {
    const { subtotal, grandTotal, maxHours } = this.calculateTotals();
    
    // Check or create customer
    let custName = document.getElementById('posCustName')?.value.trim();
    let custPhone = document.getElementById('posCustPhone')?.value.trim();
    let custAddress = document.getElementById('posCustAddress')?.value.trim();
    let parfum = document.getElementById('posParfumSelect')?.value;
    let rack = document.getElementById('posRackSelect')?.value;
    let notes = document.getElementById('posOrderNotes')?.value.trim();

    if (!custName) {
      custName = 'Pelanggan Umum';
    }

    let customerObj = this.selectedCustomer;
    if (!customerObj || customerObj.name !== custName || customerObj.phone !== custPhone) {
      // Save / Update Customer
      customerObj = db.saveCustomer({
        id: this.selectedCustomer?.id,
        name: custName,
        phone: custPhone,
        address: custAddress,
        notes: ''
      });
    }

    const now = new Date();
    const readyDate = new Date(now.getTime() + (maxHours || 48) * 3600000);
    const orderId = db.generateOrderId();

    const change = Math.max(0, this.paidAmountInput - grandTotal);

    const currentUser = window.AuthManager ? AuthManager.getCurrentUser() : null;

    const newOrder = {
      id: orderId,
      createdAt: now.toISOString(),
      estimatedReady: readyDate.toISOString(),
      cashierId: currentUser?.id || 'usr_kasir',
      cashierName: currentUser?.name || 'Kasir',
      cashierRole: currentUser?.role || 'kasir',
      customer: {
        id: customerObj.id,
        name: customerObj.name,
        phone: customerObj.phone,
        address: customerObj.address
      },
      items: [...this.cart],
      parfum: parfum || 'Standar',
      rack: rack || 'Rak A-01',
      notes: notes || '',
      totalWeight: this.cart.filter(i => i.type === 'kiloan').reduce((s, i) => s + i.qty, 0),
      totalItemsCount: this.cart.reduce((s, i) => s + (i.type === 'satuan' ? i.qty : 1), 0),
      subtotal: subtotal,
      discount: this.discountAmount,
      tax: this.taxAmount,
      grandTotal: grandTotal,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      paidAmount: Math.min(this.paidAmountInput, grandTotal),
      changeAmount: change,
      status: 'Diterima',
      statusHistory: [
        { status: 'Diterima', timestamp: now.toISOString() }
      ]
    };

    // Save to Database
    db.saveOrder(newOrder);

    // Audio & Confetti Effects!
    if (window.App) {
      App.playSound('cash');
      App.triggerConfetti();
      App.showToast(`Pesanan ${orderId} berhasil dicatat!`, 'success');
    }

    // Close payment modal & reset cart
    this.closePaymentModal();
    this.resetCart();

    // Refresh orders and reports if open
    if (window.OrdersManager) OrdersManager.render();
    if (window.ReportsManager) ReportsManager.render();
    if (window.CustomersManager) CustomersManager.render();

    // Open Digital Receipt immediately
    this.openOrderReceiptModal(newOrder.id);
  },

  openOrderReceiptModal(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById('receiptModal');
    const container = document.getElementById('receiptModalContent');
    if (!modal || !container) return;

    container.innerHTML = ReceiptManager.renderDigitalReceiptHTML(order);

    // Render QR Code in modal
    const qrContainer = container.querySelector('#receiptQrCodeCanvas');
    if (qrContainer && window.QRCode) {
      new QRCode(qrContainer, {
        text: order.id,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    // Bind modal action buttons
    const waBtn = document.getElementById('receiptSendWaBtn');
    if (waBtn) {
      waBtn.onclick = () => ReceiptManager.openWhatsApp(order, 'new_order');
    }

    const printBtn = document.getElementById('receiptPrintBtn');
    if (printBtn) {
      printBtn.onclick = () => ReceiptManager.printReceipt(order);
    }

    const downloadBtn = document.getElementById('receiptDownloadImageBtn');
    if (downloadBtn) {
      downloadBtn.onclick = () => ReceiptManager.exportReceiptAsImage('receiptCardToPrint', `nota-${order.id}.png`);
    }

    modal.classList.remove('hidden');
  },

  closeReceiptModal() {
    const modal = document.getElementById('receiptModal');
    if (modal) modal.classList.add('hidden');
  }
};

window.POSManager = POSManager;
