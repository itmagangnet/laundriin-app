/**
 * SmartLaundry Pro - Financial Reports & Accounting Module
 * Summarizes revenue, logs operational expenses, calculates net profit, renders Chart.js charts, and exports to Excel.
 */

const ReportsManager = {
  currentPeriod: 'today', // 'today', 'week', 'month', 'year'
  revenueChartInstance: null,
  serviceChartInstance: null,

  init() {
    this.render();
  },

  setPeriod(period) {
    this.currentPeriod = period;

    const buttons = document.querySelectorAll('.report-period-btn');
    buttons.forEach(btn => {
      if (btn.dataset.period === period) {
        btn.classList.add('bg-sky-500', 'text-white', 'shadow-sm');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-sky-500', 'text-white', 'shadow-sm');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
      }
    });

    this.render();
  },

  getPeriodRange() {
    const now = new Date();
    let startDate = new Date();

    if (this.currentPeriod === 'all') {
      startDate = new Date(2000, 0, 1, 0, 0, 0, 0);
    } else if (this.currentPeriod === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (this.currentPeriod === 'week') {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (this.currentPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (this.currentPeriod === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate, endDate };
  },

  getPeriodLabel() {
    const now = new Date();
    if (this.currentPeriod === 'all') {
      return 'Semua Riwayat (Seluruh Catatan)';
    } else if (this.currentPeriod === 'today') {
      return `Hari Ini (${now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })})`;
    } else if (this.currentPeriod === 'week') {
      return '7 Hari Terakhir';
    } else if (this.currentPeriod === 'month') {
      return `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
    } else if (this.currentPeriod === 'year') {
      return `Tahun ${now.getFullYear()}`;
    }
    return 'Semua Periode';
  },

  render() {
    const { startDate, endDate } = this.getPeriodRange();
    const allOrders = db.getOrders() || [];
    const allExpenses = db.getExpenses() || [];

    // Filter by date range (exclude cancelled orders from financial calculations)
    const orders = allOrders.filter(o => {
      if (o.status === 'Dibatalkan') return false;
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate;
    });

    const expenses = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    // Calculations
    // Total Omset Penjualan (Nilai seluruh pesanan masuk)
    const totalOmset = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    
    // Total Kas Diterima (Uang nyata yang sudah terbayar / masuk kas)
    const totalPaidRevenue = orders.reduce((sum, o) => {
      if (o.paymentStatus === 'Lunas') return sum + (o.grandTotal || 0);
      return sum + (o.paidAmount || 0);
    }, 0);

    // Total Piutang Belum Terbayar
    const totalUnpaid = orders
      .filter(o => o.paymentStatus !== 'Lunas')
      .reduce((sum, o) => sum + Math.max(0, (o.grandTotal || 0) - (o.paidAmount || 0)), 0);

    // Total Beban Pengeluaran
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Laba Bersih (Net Profit = Total Omset - Pengeluaran)
    const netProfit = totalOmset - totalExpenseAmount;

    // Total Berat & Item
    const totalKg = orders.reduce((sum, o) => sum + (o.totalWeight || 0), 0);
    const totalPcs = orders.reduce((sum, o) => {
      const satuanItems = (o.items || []).filter(i => i.type === 'satuan');
      return sum + satuanItems.reduce((sub, i) => sub + (i.qty || 1), 0);
    }, 0);
    const totalOrdersCount = orders.length;

    // Render Stat KPI Cards
    const revEl = document.getElementById('reportTotalRevenue');
    const expEl = document.getElementById('reportTotalExpense');
    const profitEl = document.getElementById('reportNetProfit');
    const unpaidEl = document.getElementById('reportTotalUnpaid');
    const kgEl = document.getElementById('reportTotalKg');
    const orderCountEl = document.getElementById('reportTotalOrdersCount');

    if (revEl) revEl.innerText = ReceiptManager.formatCurrency(totalOmset);
    if (expEl) expEl.innerText = ReceiptManager.formatCurrency(totalExpenseAmount);
    if (profitEl) {
      profitEl.innerText = (netProfit < 0 ? '-' : '') + ReceiptManager.formatCurrency(Math.abs(netProfit));
      profitEl.className = `font-mono font-extrabold text-xl ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`;
    }
    if (unpaidEl) unpaidEl.innerText = ReceiptManager.formatCurrency(totalUnpaid);
    if (kgEl) {
      kgEl.innerText = `${totalKg.toFixed(1)} kg ${totalPcs > 0 ? `+ ${totalPcs} pcs` : ''}`;
    }
    if (orderCountEl) {
      orderCountEl.innerHTML = `${totalOrdersCount} Nota <span class="text-emerald-600 dark:text-emerald-400 font-semibold">• Kas: ${ReceiptManager.formatCurrency(totalPaidRevenue)}</span>`;
    }

    // Subheader updates
    const ordersSub = document.getElementById('reportOrdersSubHeader');
    if (ordersSub) ordersSub.innerText = `Rincian nota transaksi pada periode ${this.getPeriodLabel()}`;

    const ordersBadge = document.getElementById('reportOrdersSummaryBadge');
    if (ordersBadge) {
      ordersBadge.innerText = `${totalOrdersCount} Nota (${ReceiptManager.formatCurrency(totalOmset)})`;
    }

    const expSub = document.getElementById('reportExpensesSubHeader');
    if (expSub) expSub.innerText = `Beban operasional pada periode ${this.getPeriodLabel()}`;

    // Render Lists
    this.renderOrdersList(orders);
    this.renderExpensesList(expenses);

    // Render Charts (pass allOrders and allExpenses for accurate 7-day trend, and current orders for doughnut)
    this.renderCharts(allOrders, allExpenses, orders, expenses);
  },

  renderOrdersList(orders) {
    const container = document.getElementById('reportOrdersList');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="py-10 text-center text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <p class="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum ada catatan transaksi masuk pada periode ini.</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Semua transaksi pesanan kasir akan otomatis tampil di sini secara real-time.</p>
        </div>
      `;
      return;
    }

    // Sort newest first
    const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = `
      <div class="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table class="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/30">
              <th class="py-2.5 px-3">No. Nota & Waktu</th>
              <th class="py-2.5 px-3">Pelanggan</th>
              <th class="py-2.5 px-3">Rincian Layanan</th>
              <th class="py-2.5 px-3">Petugas Kasir</th>
              <th class="py-2.5 px-3">Status Cuci</th>
              <th class="py-2.5 px-3">Pembayaran</th>
              <th class="py-2.5 px-3 text-right">Total Nilai</th>
              <th class="py-2.5 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
            ${sortedOrders.map(order => {
              const isPaid = order.paymentStatus === 'Lunas';
              const itemsDesc = (order.items || []).map(i => `${i.name} (${i.qty} ${i.type === 'kiloan' ? 'kg' : (i.unit || 'pcs')})`).join(', ');

              return `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td class="py-3 px-3">
                    <button type="button" onclick="POSManager.openOrderReceiptModal('${order.id}')" class="font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 group text-left">
                      <span>${order.id}</span>
                      <svg class="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </button>
                    <span class="text-[10px] text-slate-400 block mt-0.5">${ReceiptManager.formatDateTime(order.createdAt)}</span>
                  </td>
                  <td class="py-3 px-3">
                    <p class="font-bold text-slate-800 dark:text-slate-200">${order.customer?.name || 'Pelanggan Umum'}</p>
                    <p class="text-[10px] text-slate-400 font-mono">${order.customer?.phone || '-'}</p>
                  </td>
                  <td class="py-3 px-3">
                    <p class="text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-[220px]">
                      ${itemsDesc}
                    </p>
                    <div class="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>🌸 ${order.parfum || 'Standar'}</span>
                      <span>📍 ${order.rack || '-'}</span>
                    </div>
                  </td>
                  <td class="py-3 px-3 text-slate-600 dark:text-slate-300">
                    <span class="font-semibold text-[11px]">${order.cashierName || 'Kasir'}</span>
                  </td>
                  <td class="py-3 px-3">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      ${order.status}
                    </span>
                  </td>
                  <td class="py-3 px-3">
                    <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${isPaid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'}">
                      ${order.paymentStatus}
                    </span>
                    <span class="text-[10px] text-slate-400 block mt-0.5 font-medium">${order.paymentMethod || 'Tunai'}</span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <span class="font-mono font-extrabold text-slate-900 dark:text-white text-xs block">
                      ${ReceiptManager.formatCurrency(order.grandTotal)}
                    </span>
                    ${!isPaid && (order.paidAmount || 0) > 0 ? `<span class="text-[9px] text-emerald-500 font-semibold block">DP: ${ReceiptManager.formatCurrency(order.paidAmount)}</span>` : ''}
                    ${!isPaid ? `<span class="text-[9px] text-rose-500 font-semibold block">Sisa: ${ReceiptManager.formatCurrency((order.grandTotal || 0) - (order.paidAmount || 0))}</span>` : ''}
                  </td>
                  <td class="py-3 px-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button type="button" onclick="POSManager.openOrderReceiptModal('${order.id}')" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors" title="Lihat & Cetak Nota">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </button>
                      <button type="button" onclick="ReceiptManager.openWhatsApp(db.getOrderById('${order.id}'), '${order.status === 'Siap Diambil' ? 'ready' : (order.paymentStatus !== 'Lunas' ? 'unpaid_reminder' : 'new_order')}')" class="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors" title="Kirim Nota WhatsApp">
                        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderExpensesList(expenses) {
    const container = document.getElementById('reportExpensesList');
    if (!container) return;

    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400">
          <svg class="w-10 h-10 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-semibold">Belum ada catatan pengeluaran kas pada periode ini.</p>
        </div>
      `;
      return;
    }

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = `
      <div class="divide-y divide-slate-100 dark:divide-slate-800">
        ${sortedExpenses.map(e => `
          <div class="py-3 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
            <div class="flex-1 pr-3">
              <p class="font-bold text-slate-800 dark:text-slate-200 text-xs">${e.title}</p>
              <div class="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                <span class="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-200 dark:border-rose-900/60">${e.category || 'Operasional'}</span>
                <span>📅 ${ReceiptManager.formatDateTime(e.date)}</span>
                ${e.notes ? `<span class="text-slate-500">• ${e.notes}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-mono font-extrabold text-sm text-rose-500 dark:text-rose-400">-${ReceiptManager.formatCurrency(e.amount)}</span>
              <button type="button" onclick="ReportsManager.deleteExpense('${e.id}')" class="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors" title="Hapus Pengeluaran">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderCharts(allOrders, allExpenses, currentOrders, currentExpenses) {
    if (!window.Chart) return;

    // 1. Revenue & Expense Trend Chart (Last 7 Days)
    const revCtx = document.getElementById('revenueTrendChart')?.getContext('2d');
    if (revCtx) {
      if (this.revenueChartInstance) this.revenueChartInstance.destroy();

      const days = [];
      const revData = [];
      const expData = [];

      for (let i = 6; i >= 0; i--) {
        const targetDay = new Date();
        targetDay.setDate(targetDay.getDate() - i);

        const dayStart = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0, 0);
        const dayEnd = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59, 999);

        const dayLabel = targetDay.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
        days.push(dayLabel);

        const dayRev = (allOrders || [])
          .filter(o => {
            if (o.status === 'Dibatalkan') return false;
            const d = new Date(o.createdAt);
            return d >= dayStart && d <= dayEnd;
          })
          .reduce((s, o) => s + (o.grandTotal || 0), 0);

        const dayExp = (allExpenses || [])
          .filter(e => {
            const d = new Date(e.date);
            return d >= dayStart && d <= dayEnd;
          })
          .reduce((s, e) => s + (e.amount || 0), 0);

        revData.push(dayRev);
        expData.push(dayExp);
      }

      this.revenueChartInstance = new Chart(revCtx, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [
            {
              label: 'Pemasukan (Omset)',
              data: revData,
              backgroundColor: 'rgba(14, 165, 233, 0.85)',
              borderRadius: 6
            },
            {
              label: 'Pengeluaran Kas',
              data: expData,
              backgroundColor: 'rgba(244, 63, 94, 0.85)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.dataset.label}: ${ReceiptManager.formatCurrency(ctx.raw)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => 'Rp ' + (val >= 1000 ? (val / 1000) + 'k' : val)
              }
            }
          }
        }
      });
    }

    // 2. Services Breakdown Chart
    const srvCtx = document.getElementById('serviceBreakdownChart')?.getContext('2d');
    if (srvCtx) {
      if (this.serviceChartInstance) this.serviceChartInstance.destroy();

      const serviceMap = {};
      (currentOrders || []).forEach(o => {
        (o.items || []).forEach(i => {
          serviceMap[i.name] = (serviceMap[i.name] || 0) + (i.qty || 1);
        });
      });

      const labels = Object.keys(serviceMap).slice(0, 5);
      const data = labels.map(k => serviceMap[k]);

      this.serviceChartInstance = new Chart(srvCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Belum Ada Data'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: [
              '#0ea5e9',
              '#10b981',
              '#8b5cf6',
              '#f59e0b',
              '#ec4899',
              '#94a3b8'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }
      });
    }
  },

  // ===== EXPENSE MODAL =====
  openAddExpenseModal() {
    const modal = document.getElementById('expenseFormModal');
    const form = document.getElementById('expenseForm');
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
  },

  closeExpenseModal() {
    const modal = document.getElementById('expenseFormModal');
    if (modal) modal.classList.add('hidden');
  },

  saveExpenseForm() {
    const title = document.getElementById('expTitleInput')?.value.trim();
    const amount = parseFloat(document.getElementById('expAmountInput')?.value) || 0;
    const category = document.getElementById('expCategoryInput')?.value || 'Operasional';
    const notes = document.getElementById('expNotesInput')?.value.trim() || '';

    if (!title || amount <= 0) {
      alert('Mohon masukkan nama pengeluaran dan nominal yang valid!');
      return;
    }

    db.saveExpense({
      id: 'exp_' + Date.now(),
      title,
      amount,
      category,
      notes,
      date: new Date().toISOString()
    });

    if (window.App) {
      App.playSound('chime');
      App.showToast('Pengeluaran kas berhasil dicatat!', 'success');
    }

    this.closeExpenseModal();
    this.render();
  },

  deleteExpense(id) {
    const doDelete = () => {
      if (confirm('Hapus catatan pengeluaran kas ini?')) {
        db.deleteExpense(id);
        if (window.App) App.showToast('Catatan pengeluaran berhasil dihapus', 'info');
        this.render();
      }
    };

    if (window.AuthManager) {
      AuthManager.requireAdmin(doDelete, 'Hapus Catatan Pengeluaran');
    } else {
      doDelete();
    }
  },

  // ===== EXPORT TO EXCEL =====
  exportToExcel() {
    const { startDate, endDate } = this.getPeriodRange();
    const allOrders = db.getOrders() || [];
    const allExpenses = db.getExpenses() || [];

    const orders = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate;
    });

    const expenses = allExpenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    const targetOrders = orders.length ? orders : allOrders;
    const targetExpenses = expenses.length ? expenses : allExpenses;

    if (window.XLSX) {
      // 1. Sheet Orders
      const orderRows = targetOrders.map((o, idx) => ({
        'No': idx + 1,
        'No. Nota': o.id,
        'Tanggal': ReceiptManager.formatDateTime(o.createdAt),
        'Pelanggan': o.customer?.name || 'Umum',
        'No. Telp': o.customer?.phone || '-',
        'Layanan': (o.items || []).map(i => `${i.name} (${i.qty} ${i.type === 'kiloan' ? 'kg' : (i.unit || 'pcs')})`).join('; '),
        'Total Berat (Kg)': o.totalWeight || 0,
        'Parfum': o.parfum || '-',
        'Rak': o.rack || '-',
        'Kasir': o.cashierName || 'Kasir',
        'Total Tagihan (Rp)': o.grandTotal || 0,
        'Terbayar (Rp)': o.paidAmount || (o.paymentStatus === 'Lunas' ? o.grandTotal : 0),
        'Status Bayar': o.paymentStatus || 'Belum Lunas',
        'Metode Bayar': o.paymentMethod || 'Tunai',
        'Status Cucian': o.status || 'Diterima'
      }));

      // 2. Sheet Expenses
      const expenseRows = targetExpenses.map((e, idx) => ({
        'No': idx + 1,
        'Tanggal': ReceiptManager.formatDateTime(e.date),
        'Kategori': e.category || 'Operasional',
        'Nama Pengeluaran': e.title,
        'Nominal (Rp)': e.amount,
        'Catatan': e.notes || '-'
      }));

      const wb = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(orderRows);
      const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);

      XLSX.utils.book_append_sheet(wb, wsOrders, 'Data Pesanan (Pemasukan)');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Pengeluaran Kas');

      const dateStr = db.formatDateId(new Date());
      XLSX.writeFile(wb, `Laporan-Laundry-${this.currentPeriod}-${dateStr}.xlsx`);

      if (window.App) App.showToast('Laporan Excel berhasil diunduh!', 'success');
    } else {
      alert('Library SheetJS sedang memuat, silakan coba beberapa saat lagi.');
    }
  }
};

window.ReportsManager = ReportsManager;
