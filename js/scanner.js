/**
 * SmartLaundry Pro - QR & Barcode Scanner Module
 * Uses device camera to scan order QR codes on receipts / laundry tags.
 */

const ScannerManager = {
  html5QrCode: null,
  isScanning: false,

  init() {
    //
  },

  async startScanner() {
    const readerElement = document.getElementById('qrReaderContainer');
    if (!readerElement) return;

    if (this.isScanning) return;

    if (!window.Html5Qrcode) {
      alert('Modul kamera scanner sedang dimuat, silakan tunggu sebentar.');
      return;
    }

    try {
      this.html5QrCode = new Html5Qrcode('qrReaderContainer');
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          this.onScanSuccess(decodedText);
        },
        (errorMessage) => {
          // scanning frame errors (ignored)
        }
      );

      this.isScanning = true;
      document.getElementById('scannerStartBtn')?.classList.add('hidden');
      document.getElementById('scannerStopBtn')?.classList.remove('hidden');
      document.getElementById('scannerCameraPlaceholder')?.classList.add('hidden');
    } catch (err) {
      console.warn('Camera permission or device error:', err);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau masukkan Nomor Nota secara manual.');
    }
  },

  async stopScanner() {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
      } catch (e) {}
      this.isScanning = false;
      document.getElementById('scannerStartBtn')?.classList.remove('hidden');
      document.getElementById('scannerStopBtn')?.classList.add('hidden');
      document.getElementById('scannerCameraPlaceholder')?.classList.remove('hidden');
    }
  },

  onScanSuccess(decodedText) {
    if (!decodedText) return;
    
    // Play beep
    if (window.App) App.playSound('beep');

    const cleanCode = decodedText.trim();
    this.lookupAndShowOrder(cleanCode);
  },

  handleManualSearch() {
    const input = document.getElementById('scannerManualInput')?.value.trim();
    if (!input) {
      alert('Ketik No. Nota terlebih dahulu.');
      return;
    }

    this.lookupAndShowOrder(input);
  },

  lookupAndShowOrder(orderId) {
    const order = db.getOrderById(orderId);
    const resultContainer = document.getElementById('scannerResultContainer');
    
    if (!order) {
      if (window.App) App.showToast(`Pesanan "${orderId}" tidak ditemukan!`, 'error');
      if (resultContainer) {
        resultContainer.innerHTML = `
          <div class="p-4 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-200 dark:border-rose-900 text-center">
            <p class="font-bold text-xs text-rose-600 dark:text-rose-400">Nota "${orderId}" Tidak Ditemukan</p>
            <p class="text-[11px] text-slate-500 mt-1">Periksa kembali nomor nota yang Anda masukkan.</p>
          </div>
        `;
      }
      return;
    }

    // Found order!
    if (window.App) {
      App.playSound('chime');
      App.showToast(`Pesanan ${order.id} ditemukan!`, 'success');
    }

    const nextStatus = OrdersManager.getNextStatus(order.status);

    if (resultContainer) {
      resultContainer.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-sky-200 dark:border-sky-900 shadow-md space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">${order.id}</span>
            <span class="status-badge status-${order.status.toLowerCase().replace(/\s+/g, '')}">${order.status}</span>
          </div>

          <div class="text-xs space-y-1">
            <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">${order.customer?.name || 'Umum'} (${order.customer?.phone || '-'})</p>
            <p class="text-slate-500">${order.items.map(i => `${i.name} (${i.qty})`).join(', ')}</p>
            <p class="text-slate-400">📍 Lokasi: <span class="font-bold text-slate-700 dark:text-slate-300">${order.rack || '-'}</span> | 🌸 Parfum: ${order.parfum || '-'}</p>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
            <span class="font-bold font-mono text-slate-900 dark:text-white text-sm">${ReceiptManager.formatCurrency(order.grandTotal)}</span>
            <span class="font-bold px-2 py-0.5 rounded-full ${order.paymentStatus === 'Lunas' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}">${order.paymentStatus}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onclick="POSManager.openOrderReceiptModal('${order.id}')" class="py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              Lihat Nota
            </button>
            ${nextStatus ? `
              <button type="button" onclick="ScannerManager.advanceStatusFromScan('${order.id}', '${nextStatus}')" class="py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-sky-500/20">
                Ubah Status ➔ ${nextStatus}
              </button>
            ` : `
              <button type="button" onclick="ReceiptManager.openWhatsApp(db.getOrderById('${order.id}'), 'pickup_thanks')" class="py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm">
                Kirim Terima Kasih
              </button>
            `}
          </div>
        </div>
      `;
    }
  },

  advanceStatusFromScan(orderId, newStatus) {
    OrdersManager.advanceStatus(orderId, newStatus);
    this.lookupAndShowOrder(orderId);
  }
};

window.ScannerManager = ScannerManager;
