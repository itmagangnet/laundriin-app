/**
 * SmartLaundry Pro - Receipt, WhatsApp & Printing Module
 * Formats receipts, generates QR codes, produces WhatsApp messages, and prints thermal receipts.
 */

const ReceiptManager = {
  formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateOnly(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Generates formatted WhatsApp message text
   */
  generateWhatsAppMessage(order, type = 'new_order') {
    const settings = db.getSettings();
    const storeName = settings.storeName || 'SmartLaundry';
    const customerName = order.customer?.name || 'Pelanggan';
    const grandTotal = this.formatCurrency(order.grandTotal);
    const estReady = this.formatDateTime(order.estimatedReady);
    const paymentStatus = order.paymentStatus === 'Lunas' ? '✅ *LUNAS*' : `⚠️ *BELUM LUNAS* (${this.formatCurrency(order.grandTotal - (order.paidAmount || 0))})`;
    
    let itemsText = '';
    order.items.forEach((item, idx) => {
      const unit = item.type === 'kiloan' ? 'kg' : (item.unit || 'pcs');
      itemsText += `${idx + 1}. ${item.name} (${item.qty} ${unit}) = ${this.formatCurrency(item.subtotal)}\n`;
    });

    if (type === 'new_order') {
      return `🧺 *NOTA LAUNDRY - ${storeName.toUpperCase()}*\n` +
             `-------------------------------------\n` +
             `Halo Kak *${customerName}*,\n` +
             `Terima kasih telah mencuci di *${storeName}*.\n\n` +
             `📋 *No. Nota*: \`${order.id}\`\n` +
             `👤 *Kasir*: ${order.cashierName || 'Kasir'}\n` +
             `📅 *Tgl Masuk*: ${this.formatDateTime(order.createdAt)}\n` +
             `⏰ *Estimasi Selesai*: ${estReady}\n` +
             `🌸 *Parfum*: ${order.parfum || '-'}\n` +
             `📍 *Rak Penyimpanan*: ${order.rack || '-'}\n\n` +
             `*Rincian Cucian:*\n${itemsText}\n` +
             `💰 *Total Tagihan*: *${grandTotal}*\n` +
             `💳 *Status Bayar*: ${paymentStatus}\n` +
             (order.notes ? `📝 *Catatan*: ${order.notes}\n` : '') +
             `\n-------------------------------------\n` +
             `_Simpan pesan ini sebagai bukti pengambilan cucian._\n` +
             `📍 *${storeName}*\n📞 WA: ${settings.phone || '-'}`;
    } 
    else if (type === 'ready') {
      return `✨ *CUCIAN SUDAH SELESAI & SIAP DIAMBIL!* ✨\n` +
             `-------------------------------------\n` +
             `Halo Kak *${customerName}*,\n` +
             `Cucian Anda dengan No. Nota \`${order.id}\` di *${storeName}* sudah *SELESAI, BERSIH, & WANGI*.\n\n` +
             `🧺 *Rincian*: ${order.items.map(i => i.name).join(', ')}\n` +
             `📍 *Lokasi Rak*: *${order.rack || 'Kasir'}*\n` +
             `💳 *Status Bayar*: ${paymentStatus}\n\n` +
             `Silakan tunjukkan pesan/nota ini saat pengambilan di outlet kami ya Kak. 😊\n\n` +
             `Terima kasih! 🙏\n` +
             `*${storeName}* | 📞 ${settings.phone || '-'}`;
    }
    else if (type === 'unpaid_reminder') {
      return `🔔 *PENGINGAT TAGIHAN LAUNDRY*\n` +
             `-------------------------------------\n` +
             `Halo Kak *${customerName}*,\n` +
             `Kami menginformasikan tagihan laundry Anda di *${storeName}*:\n\n` +
             `📋 *No. Nota*: \`${order.id}\`\n` +
             `💰 *Total Sisa Tagihan*: *${this.formatCurrency(order.grandTotal - (order.paidAmount || 0))}*\n\n` +
             `Pembayaran dapat dilakukan melalui Tunai, Transfer Bank, atau QRIS saat pengambilan.\n\n` +
             `Terima kasih! 🙏`;
    }
    else if (type === 'pickup_thanks') {
      return `🎉 *TERIMA KASIH TELAH MENCUCI DI ${storeName.toUpperCase()}* 🎉\n` +
             `-------------------------------------\n` +
             `Halo Kak *${customerName}*,\n` +
             `Cucian dengan No. Nota \`${order.id}\` telah diambil/diterima.\n\n` +
             `Semoga puas dengan pelayanan kami. Jika ada kritik & saran atau ingin memesan antar-jemput kembali, silakan hubungi kami.\n\n` +
             `Sampai jumpa kembali! 🌸🧺\n*${storeName}*`;
    }
  },

  /**
   * Opens WhatsApp directly with customer phone number and formatted text
   */
  openWhatsApp(order, type = 'new_order') {
    let phone = order.customer?.phone || '';
    phone = phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    
    const message = this.generateWhatsAppMessage(order, type);
    const encoded = encodeURIComponent(message);
    
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  },

  /**
   * Render HTML for the Digital Receipt Modal
   */
  renderDigitalReceiptHTML(order) {
    const settings = db.getSettings();
    const storeName = settings.storeName || 'SmartLaundry';
    const tag = settings.tagline || '';
    const phone = settings.phone || '';
    const address = settings.address || '';
    const footerNote = settings.footerNote || '';

    let itemsRows = '';
    order.items.forEach(item => {
      const unit = item.type === 'kiloan' ? 'kg' : (item.unit || 'pcs');
      itemsRows += `
        <div class="flex justify-between items-start py-1.5 border-b border-dashed border-slate-200 dark:border-slate-700 text-xs">
          <div class="flex-1 pr-2">
            <p class="font-semibold text-slate-800 dark:text-slate-200">${item.name}</p>
            <p class="text-slate-500">${item.qty} ${unit} × ${this.formatCurrency(item.price)}</p>
          </div>
          <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${this.formatCurrency(item.subtotal)}</span>
        </div>
      `;
    });

    const isPaid = order.paymentStatus === 'Lunas';
    const sisaTagihan = Math.max(0, order.grandTotal - (order.paidAmount || 0));

    return `
      <div id="receiptCardToPrint" class="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 max-w-sm mx-auto font-sans">
        <!-- Receipt Header -->
        <div class="text-center pb-4 border-b-2 border-dashed border-slate-300 dark:border-slate-700">
          <div class="w-12 h-12 mx-auto mb-2 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          </div>
          <h3 class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">${storeName}</h3>
          ${tag ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">${tag}</p>` : ''}
          <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">${address} • ${phone}</p>
        </div>

        <!-- Meta Info -->
        <div class="py-3 text-xs space-y-1 border-b border-dashed border-slate-200 dark:border-slate-700">
          <div class="flex justify-between">
            <span class="text-slate-500">No. Nota:</span>
            <span class="font-mono font-bold text-sky-600 dark:text-sky-400">${order.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Kasir:</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">${order.cashierName || 'Kasir'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Pelanggan:</span>
            <span class="font-semibold text-slate-800 dark:text-slate-200">${order.customer?.name || 'Umum'} (${order.customer?.phone || '-'})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Tgl Masuk:</span>
            <span class="text-slate-700 dark:text-slate-300">${this.formatDateTime(order.createdAt)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Estimasi Selesai:</span>
            <span class="font-medium text-amber-600 dark:text-amber-400">${this.formatDateTime(order.estimatedReady)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Parfum / Wangi:</span>
            <span class="font-medium text-emerald-600 dark:text-emerald-400">${order.parfum || 'Standar'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Nomor Rak:</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">${order.rack || '-'}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-3">
          <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Rincian Cucian</p>
          <div class="space-y-1">
            ${itemsRows}
          </div>
        </div>

        <!-- Totals & Payment -->
        <div class="pt-2 pb-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-xs">
          <div class="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal:</span>
            <span class="font-mono">${this.formatCurrency(order.subtotal)}</span>
          </div>
          ${order.discount ? `
            <div class="flex justify-between text-emerald-600">
              <span>Diskon:</span>
              <span class="font-mono">-${this.formatCurrency(order.discount)}</span>
            </div>
          ` : ''}
          ${order.tax ? `
            <div class="flex justify-between text-slate-500">
              <span>Pajak:</span>
              <span class="font-mono">${this.formatCurrency(order.tax)}</span>
            </div>
          ` : ''}
          <div class="flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
            <span>Total Akhir:</span>
            <span class="font-mono text-base text-sky-600 dark:text-sky-400">${this.formatCurrency(order.grandTotal)}</span>
          </div>
          <div class="flex justify-between items-center text-xs pt-1">
            <span class="text-slate-500">Metode Bayar:</span>
            <span class="font-semibold text-slate-700 dark:text-slate-300">${order.paymentMethod || 'Tunai'}</span>
          </div>
          <div class="flex justify-between items-center text-xs font-bold ${isPaid ? 'text-emerald-600' : 'text-rose-600'}">
            <span>Status Pembayaran:</span>
            <span class="px-2 py-0.5 rounded-full ${isPaid ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-rose-100 dark:bg-rose-950/60'}">${order.paymentStatus}</span>
          </div>
          ${!isPaid && sisaTagihan > 0 ? `
            <div class="flex justify-between items-center text-xs font-bold text-rose-600 pt-1">
              <span>Sisa Tagihan:</span>
              <span class="font-mono">${this.formatCurrency(sisaTagihan)}</span>
            </div>
          ` : ''}
          ${isPaid && order.paymentMethod === 'Tunai' && order.changeAmount ? `
            <div class="flex justify-between text-slate-500 text-[11px]">
              <span>Bayar: ${this.formatCurrency(order.paidAmount)}</span>
              <span>Kembalian: ${this.formatCurrency(order.changeAmount)}</span>
            </div>
          ` : ''}
        </div>

        <!-- QR Code Container for Easy Scanning -->
        <div class="my-3 py-3 border-t border-dashed border-slate-200 dark:border-slate-800 text-center">
          <div id="receiptQrCodeCanvas" class="flex justify-center my-1"></div>
          <p class="font-mono text-[10px] text-slate-400 mt-1">Scan QR untuk pelacakan status cucian</p>
        </div>

        <!-- Footer Notes -->
        <div class="text-center pt-2 text-[10px] text-slate-400 leading-tight">
          <p>${footerNote}</p>
          <p class="font-semibold mt-1 text-slate-500">~ Terima Kasih Atas Kepercayaan Anda ~</p>
        </div>
      </div>
    `;
  },

  /**
   * Generates Thermal Printer HTML (for 58mm/80mm POS printers)
   */
  renderThermalReceiptHTML(order) {
    const settings = db.getSettings();
    const sizeClass = settings.printerSize === '80mm' ? 'size-80mm' : '';
    const isPaid = order.paymentStatus === 'Lunas';
    const sisa = Math.max(0, order.grandTotal - (order.paidAmount || 0));

    let itemsRows = '';
    order.items.forEach(item => {
      const unit = item.type === 'kiloan' ? 'kg' : (item.unit || 'pcs');
      itemsRows += `
        <div class="receipt-row">
          <span>${item.name}</span>
        </div>
        <div class="receipt-row" style="padding-left: 8px;">
          <span>${item.qty} ${unit} x ${item.price.toLocaleString('id-ID')}</span>
          <span class="receipt-bold">${item.subtotal.toLocaleString('id-ID')}</span>
        </div>
      `;
    });

    return `
      <div class="thermal-receipt ${sizeClass}">
        <div class="receipt-header">
          <div class="receipt-title">${settings.storeName || 'SMARTLAUNDRY'}</div>
          <div class="receipt-subtitle">${settings.address || ''}</div>
          <div class="receipt-subtitle">Telp/WA: ${settings.phone || '-'}</div>
        </div>

        <div class="receipt-row">
          <span>No. Nota:</span>
          <span class="receipt-bold">${order.id}</span>
        </div>
        <div class="receipt-row">
          <span>Kasir:</span>
          <span>${order.cashierName || 'Kasir'}</span>
        </div>
        <div class="receipt-row">
          <span>Tgl Masuk:</span>
          <span>${this.formatDateTime(order.createdAt)}</span>
        </div>
        <div class="receipt-row">
          <span>Est. Selesai:</span>
          <span class="receipt-bold">${this.formatDateTime(order.estimatedReady)}</span>
        </div>
        <div class="receipt-row">
          <span>Pelanggan:</span>
          <span>${order.customer?.name || 'Umum'}</span>
        </div>
        <div class="receipt-row">
          <span>No. Telp:</span>
          <span>${order.customer?.phone || '-'}</span>
        </div>
        <div class="receipt-row">
          <span>Parfum:</span>
          <span>${order.parfum || 'Standar'}</span>
        </div>
        <div class="receipt-row">
          <span>Rak:</span>
          <span class="receipt-bold">${order.rack || '-'}</span>
        </div>

        <div class="receipt-divider"></div>

        <div style="margin: 4px 0;">
          ${itemsRows}
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-row">
          <span>Subtotal:</span>
          <span>${order.subtotal.toLocaleString('id-ID')}</span>
        </div>
        ${order.discount ? `
          <div class="receipt-row">
            <span>Diskon:</span>
            <span>-${order.discount.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
        <div class="receipt-row receipt-bold" style="font-size: 14px;">
          <span>TOTAL:</span>
          <span>Rp ${order.grandTotal.toLocaleString('id-ID')}</span>
        </div>
        <div class="receipt-row">
          <span>Metode:</span>
          <span>${order.paymentMethod || 'Tunai'}</span>
        </div>
        <div class="receipt-row receipt-bold">
          <span>Status:</span>
          <span>${isPaid ? 'LUNAS' : 'BELUM LUNAS'}</span>
        </div>
        ${!isPaid ? `
          <div class="receipt-row receipt-bold">
            <span>Sisa Tagihan:</span>
            <span>Rp ${sisa.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
        ${isPaid && order.paymentMethod === 'Tunai' ? `
          <div class="receipt-row">
            <span>Bayar:</span>
            <span>${(order.paidAmount || order.grandTotal).toLocaleString('id-ID')}</span>
          </div>
          <div class="receipt-row">
            <span>Kembali:</span>
            <span>${(order.changeAmount || 0).toLocaleString('id-ID')}</span>
          </div>
        ` : ''}

        <div class="receipt-divider"></div>

        <div class="receipt-qr" id="thermalQrCode"></div>
        <div class="receipt-center" style="font-size: 9px; font-family: monospace;">${order.id}</div>

        <div class="receipt-footer">
          <div>${settings.footerNote || 'Terima kasih atas kunjungan Anda'}</div>
          <div style="margin-top: 4px;">*** TERIMA KASIH ***</div>
        </div>
      </div>
    `;
  },

  /**
   * Triggers browser thermal print
   */
  printReceipt(order) {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    printArea.innerHTML = this.renderThermalReceiptHTML(order);
    
    // Generate QR in thermal print area
    const qrContainer = printArea.querySelector('#thermalQrCode');
    if (qrContainer && window.QRCode) {
      new QRCode(qrContainer, {
        text: order.id,
        width: 80,
        height: 80,
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    setTimeout(() => {
      window.print();
    }, 300);
  },

  /**
   * Exports receipt card as image for WhatsApp sharing
   */
  async exportReceiptAsImage(elementId, filename = 'nota-laundry.png') {
    const element = document.getElementById(elementId);
    if (!element || !window.html2canvas) {
      alert('Modul pembuat gambar sedang dimuat, silakan coba sesaat lagi.');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Gagal membuat gambar nota. Silakan coba lagi.');
    }
  }
};

window.ReceiptManager = ReceiptManager;
