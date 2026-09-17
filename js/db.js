/**
 * SmartLaundry Pro - Database & Local Storage Layer
 * Manages all data persistence, schema validation, and seed data.
 */

const DB_KEYS = {
  ORDERS: 'smartlaundry_orders',
  CUSTOMERS: 'smartlaundry_customers',
  SERVICES: 'smartlaundry_services',
  FRAGRANCES: 'smartlaundry_fragrances',
  EXPENSES: 'smartlaundry_expenses',
  SETTINGS: 'smartlaundry_settings',
  USERS: 'smartlaundry_users',
  CURRENT_USER: 'smartlaundry_current_user',
  INITIALIZED: 'smartlaundry_initialized_v2'
};

const DEFAULT_USERS = [
  {
    id: 'usr_admin',
    username: 'admin',
    name: 'Administrator (Owner)',
    role: 'admin', // 'admin' or 'kasir'
    pin: '1234',
    avatar: '👑',
    color: 'emerald'
  },
  {
    id: 'usr_kasir',
    username: 'kasir',
    name: 'Kasir Shift 1',
    role: 'kasir',
    pin: '0000',
    avatar: '💼',
    color: 'sky'
  }
];

const DEFAULT_SETTINGS = {
  storeName: 'FreshClean Laundry & Care',
  tagline: 'Bersih, Wangi, Rapi & Higienis',
  phone: '081234567890',
  address: 'Jl. Melati Indah No. 45, Jakarta Selatan',
  footerNote: 'Periksa kembali pakaian saat serah terima. Komplain max 1x24 jam dengan membawa nota asli.',
  printerSize: '58mm', // 58mm or 80mm
  taxPercent: 0,
  currency: 'IDR',
  autoWhatsapp: true,
  defaultParfum: 'Akasia Soft',
  rackList: ['Rak A-01', 'Rak A-02', 'Rak A-03', 'Rak B-01', 'Rak B-02', 'Rak B-03', 'Rak C-01', 'Rak C-02', 'Gantungan Jas']
};

const DEFAULT_SERVICES = [
  // Kiloan Services
  { id: 'srv_k1', type: 'kiloan', name: 'Cuci Kering Setrika (Reguler)', price: 7000, unit: 'kg', durationHours: 48, description: 'Cuci bersih, pewangi premium & setrika rapi (2 hari)' },
  { id: 'srv_k2', type: 'kiloan', name: 'Cuci Kering Lipat', price: 5000, unit: 'kg', durationHours: 24, description: 'Cuci bersih, pewangi & lipat rapi tanpa setrika' },
  { id: 'srv_k3', type: 'kiloan', name: 'Setrika Saja (Reguler)', price: 4000, unit: 'kg', durationHours: 24, description: 'Setrika halus menggunakan uap & pelicin' },
  { id: 'srv_k4', type: 'kiloan', name: 'Express 1 Hari (24 Jam)', price: 10000, unit: 'kg', durationHours: 24, description: 'Cuci kering setrika selesai dalam 24 jam' },
  { id: 'srv_k5', type: 'kiloan', name: 'Kilat Super Express (3-6 Jam)', price: 15000, unit: 'kg', durationHours: 6, description: 'Prioritas utama selesai dalam 3-6 jam' },
  
  // Satuan Services
  { id: 'srv_s1', type: 'satuan', name: 'Bed Cover King / Super King', price: 30000, unit: 'pcs', durationHours: 48, description: 'Cuci besar anti tungau + plastik segel' },
  { id: 'srv_s2', type: 'satuan', name: 'Bed Cover Single / Queen', price: 25000, unit: 'pcs', durationHours: 48, description: 'Cuci bedcover single/queen' },
  { id: 'srv_s3', type: 'satuan', name: 'Selimut Tebal / Fleece', price: 18000, unit: 'pcs', durationHours: 48, description: 'Cuci lembut & wangi semerbak' },
  { id: 'srv_s4', type: 'satuan', name: 'Jas / Blazer / Safari', price: 25000, unit: 'pcs', durationHours: 72, description: 'Dry clean / wet clean spesial jas + hanger' },
  { id: 'srv_s5', type: 'satuan', name: 'Gaun / Kebaya Payet', price: 35000, unit: 'pcs', durationHours: 72, description: 'Perawatan khusus bahan sutra/payet' },
  { id: 'srv_s6', type: 'satuan', name: 'Sepatu Sneakers / Canvas', price: 30000, unit: 'pasang', durationHours: 48, description: 'Deep clean luar-dalam + unyellowing sol' },
  { id: 'srv_s7', type: 'satuan', name: 'Helm Full / Half Face', price: 25000, unit: 'pcs', durationHours: 24, description: 'Cuci busa dalam, visor polish & anti bakteri' },
  { id: 'srv_s8', type: 'satuan', name: 'Boneka Besar / Jumbo', price: 25000, unit: 'pcs', durationHours: 48, description: 'Cuci boneka higienis bebas kuman' },
  { id: 'srv_s9', type: 'satuan', name: 'Karpet Tebal / Bulu', price: 15000, unit: 'meter', durationHours: 72, description: 'Cuci karpet vacum ekstra kering' }
];

const DEFAULT_FRAGRANCES = [
  'Akasia Soft (Best Seller)',
  'Lavender Relax',
  'Ocean Fresh Sport',
  'Snappy Clean',
  'Sakura Blossom',
  'Sweet Vanilla',
  'Baby Cuddle (Tanpa Alergen)'
];

const DEFAULT_CUSTOMERS = [
  { id: 'cst_1', name: 'Budi Santoso', phone: '081298765432', address: 'Jl. Anggrek No. 12', totalOrders: 5, totalSpent: 245000, points: 24, notes: 'Langganan setia, minta parfum Akasia' },
  { id: 'cst_2', name: 'Siti Rahmawati', phone: '085712349988', address: 'Apartemen Green View Lt. 7', totalOrders: 3, totalSpent: 165000, points: 16, notes: 'Kirim nota WA, minta antar jemput' },
  { id: 'cst_3', name: 'Dr. Hendra Wijaya', phone: '081377889900', address: 'Komp. Dokter No. 8', totalOrders: 8, totalSpent: 420000, points: 42, notes: 'Jas & kemeja minta kanji rapi' },
  { id: 'cst_4', name: 'Dewi Lestari', phone: '087811223344', address: 'Jl. Flamboyan No. 20', totalOrders: 2, totalSpent: 90000, points: 9, notes: '' },
  { id: 'cst_5', name: 'Ahmad Faisal', phone: '089655443322', address: 'Kost Bahagia Kamar 3B', totalOrders: 4, totalSpent: 140000, points: 14, notes: 'Anak kost kiloan rutin tiap minggu' }
];

const DEFAULT_EXPENSES = [
  { id: 'exp_1', date: new Date(Date.now() - 86400000 * 2).toISOString(), category: 'Bahan Baku', title: 'Beli Deterjen Cair 20 Liter', amount: 165000, notes: 'Supplier Kimia Laundry' },
  { id: 'exp_2', date: new Date(Date.now() - 86400000 * 2).toISOString(), category: 'Bahan Baku', title: 'Bibit Parfum Akasia & Softener 5L', amount: 120000, notes: 'Stok parfum mingguan' },
  { id: 'exp_3', date: new Date(Date.now() - 86400000 * 1).toISOString(), category: 'Operasional', title: 'Plastik Packing Jinjing 3 Ukuran', amount: 65000, notes: 'Plastik 35, 40, 50' },
  { id: 'exp_4', date: new Date().toISOString(), category: 'Utilitas', title: 'Token Listrik Outlet', amount: 200000, notes: 'Token PLN 200rb' }
];

const db = {
  init() {
    if (!localStorage.getItem(DB_KEYS.INITIALIZED)) {
      this.resetToDefaults();
    } else {
      // Ensure users exist even if upgraded from previous version
      if (!localStorage.getItem(DB_KEYS.USERS)) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
    }
  },

  resetToDefaults() {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem(DB_KEYS.FRAGRANCES, JSON.stringify(DEFAULT_FRAGRANCES));
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(DEFAULT_EXPENSES));
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
    
    // Seed Realistic Orders
    const now = new Date();
    const seedOrders = [
      {
        id: 'LND-' + this.formatDateId(new Date(now.getTime() - 86400000 * 2)) + '-001',
        createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
        estimatedReady: new Date(now.getTime() - 86400000 * 1).toISOString(),
        customer: { id: 'cst_1', name: 'Budi Santoso', phone: '081298765432', address: 'Jl. Anggrek No. 12' },
        items: [
          { serviceId: 'srv_k1', name: 'Cuci Kering Setrika (Reguler)', type: 'kiloan', qty: 4.5, price: 7000, subtotal: 31500 }
        ],
        parfum: 'Akasia Soft (Best Seller)',
        rack: 'Rak A-01',
        notes: 'Pakaian kerja, kemeja putih jangan luntur',
        totalWeight: 4.5,
        totalItemsCount: 1,
        subtotal: 31500,
        discount: 0,
        tax: 0,
        grandTotal: 31500,
        paymentStatus: 'Lunas',
        paymentMethod: 'QRIS',
        paidAmount: 31500,
        changeAmount: 0,
        status: 'Sudah Diambil', // Diterima, Dicuci, Dikeringkan, Disetrika, Siap Diambil, Sudah Diambil, Dibatalkan
        statusHistory: [
          { status: 'Diterima', timestamp: new Date(now.getTime() - 86400000 * 2).toISOString() },
          { status: 'Dicuci', timestamp: new Date(now.getTime() - 86400000 * 2 + 3600000).toISOString() },
          { status: 'Disetrika', timestamp: new Date(now.getTime() - 86400000 * 1).toISOString() },
          { status: 'Siap Diambil', timestamp: new Date(now.getTime() - 86400000 * 1 + 7200000).toISOString() },
          { status: 'Sudah Diambil', timestamp: new Date(now.getTime() - 3600000 * 12).toISOString() }
        ]
      },
      {
        id: 'LND-' + this.formatDateId(new Date(now.getTime() - 86400000 * 1)) + '-002',
        createdAt: new Date(now.getTime() - 86400000 * 1).toISOString(),
        estimatedReady: new Date(now.getTime() + 86400000 * 1).toISOString(),
        customer: { id: 'cst_2', name: 'Siti Rahmawati', phone: '085712349988', address: 'Apartemen Green View Lt. 7' },
        items: [
          { serviceId: 'srv_s1', name: 'Bed Cover King / Super King', type: 'satuan', qty: 1, price: 30000, subtotal: 30000 },
          { serviceId: 'srv_k1', name: 'Cuci Kering Setrika (Reguler)', type: 'kiloan', qty: 3.2, price: 7000, subtotal: 22400 }
        ],
        parfum: 'Lavender Relax',
        rack: 'Rak B-02',
        notes: 'Bedcover warna tosca, minta plastik tebal',
        totalWeight: 3.2,
        totalItemsCount: 2,
        subtotal: 52400,
        discount: 2400,
        tax: 0,
        grandTotal: 50000,
        paymentStatus: 'Lunas',
        paymentMethod: 'Tunai',
        paidAmount: 50000,
        changeAmount: 0,
        status: 'Disetrika',
        statusHistory: [
          { status: 'Diterima', timestamp: new Date(now.getTime() - 86400000 * 1).toISOString() },
          { status: 'Dicuci', timestamp: new Date(now.getTime() - 86400000 * 1 + 7200000).toISOString() },
          { status: 'Dikeringkan', timestamp: new Date(now.getTime() - 3600000 * 8).toISOString() },
          { status: 'Disetrika', timestamp: new Date(now.getTime() - 3600000 * 2).toISOString() }
        ]
      },
      {
        id: 'LND-' + this.formatDateId(now) + '-003',
        createdAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
        estimatedReady: new Date(now.getTime() + 3600000 * 20).toISOString(),
        customer: { id: 'cst_3', name: 'Dr. Hendra Wijaya', phone: '081377889900', address: 'Komp. Dokter No. 8' },
        items: [
          { serviceId: 'srv_s4', name: 'Jas / Blazer / Safari', type: 'satuan', qty: 2, price: 25000, subtotal: 50000 },
          { serviceId: 'srv_s6', name: 'Sepatu Sneakers / Canvas', type: 'satuan', qty: 1, price: 30000, subtotal: 30000 }
        ],
        parfum: 'Ocean Fresh Sport',
        rack: 'Gantungan Jas',
        notes: 'Jas hitam 2 pcs harap pakai cover gantung',
        totalWeight: 0,
        totalItemsCount: 3,
        subtotal: 80000,
        discount: 0,
        tax: 0,
        grandTotal: 80000,
        paymentStatus: 'Belum Lunas',
        paymentMethod: 'Bayar Nanti',
        paidAmount: 0,
        changeAmount: 0,
        status: 'Dicuci',
        statusHistory: [
          { status: 'Diterima', timestamp: new Date(now.getTime() - 3600000 * 4).toISOString() },
          { status: 'Dicuci', timestamp: new Date(now.getTime() - 3600000 * 2).toISOString() }
        ]
      },
      {
        id: 'LND-' + this.formatDateId(now) + '-004',
        createdAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
        estimatedReady: new Date(now.getTime() + 3600000 * 5).toISOString(),
        customer: { id: 'cst_5', name: 'Ahmad Faisal', phone: '089655443322', address: 'Kost Bahagia Kamar 3B' },
        items: [
          { serviceId: 'srv_k5', name: 'Kilat Super Express (3-6 Jam)', type: 'kiloan', qty: 2.8, price: 15000, subtotal: 42000 }
        ],
        parfum: 'Snappy Clean',
        rack: 'Rak A-02',
        notes: 'Mau dipakai besok pagi dinas',
        totalWeight: 2.8,
        totalItemsCount: 1,
        subtotal: 42000,
        discount: 0,
        tax: 0,
        grandTotal: 42000,
        paymentStatus: 'Lunas',
        paymentMethod: 'Transfer Bank',
        paidAmount: 42000,
        changeAmount: 0,
        status: 'Diterima',
        statusHistory: [
          { status: 'Diterima', timestamp: new Date(now.getTime() - 3600000 * 1).toISOString() }
        ]
      }
    ];

    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(seedOrders));
    localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
  },

  formatDateId(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  },

  // ===== ORDERS =====
  getOrders() {
    try {
      const data = localStorage.getItem(DB_KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching orders:', e);
      return [];
    }
  },

  getOrderById(id) {
    const orders = this.getOrders();
    return orders.find(o => o.id.toLowerCase() === id.toLowerCase());
  },

  generateOrderId() {
    const now = new Date();
    const datePrefix = this.formatDateId(now);
    const orders = this.getOrders();
    const todayOrders = orders.filter(o => o.id.includes(datePrefix));
    const nextSeq = String(todayOrders.length + 1).padStart(3, '0');
    return `LND-${datePrefix}-${nextSeq}`;
  },

  saveOrder(order) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    
    if (index >= 0) {
      orders[index] = order;
    } else {
      orders.unshift(order);
    }
    
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

    // Update customer stats
    if (order.customer && order.customer.id) {
      this.updateCustomerSpend(order.customer.id, order.grandTotal);
    }

    return order;
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    order.status = newStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    return order;
  },

  updateOrderPayment(orderId, paymentStatus, paymentMethod, paidAmount, changeAmount) {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    order.paymentStatus = paymentStatus;
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (paidAmount !== undefined) order.paidAmount = paidAmount;
    if (changeAmount !== undefined) order.changeAmount = changeAmount;

    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    return order;
  },

  deleteOrder(orderId) {
    let orders = this.getOrders();
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
    return true;
  },

  // ===== CUSTOMERS =====
  getCustomers() {
    try {
      const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getCustomerById(id) {
    return this.getCustomers().find(c => c.id === id);
  },

  saveCustomer(customer) {
    const customers = this.getCustomers();
    if (!customer.id) {
      customer.id = 'cst_' + Date.now();
      customer.totalOrders = 0;
      customer.totalSpent = 0;
      customer.points = 0;
      customers.push(customer);
    } else {
      const index = customers.findIndex(c => c.id === customer.id);
      if (index >= 0) {
        customers[index] = { ...customers[index], ...customer };
      } else {
        customers.push(customer);
      }
    }
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
    return customer;
  },

  updateCustomerSpend(customerId, amount) {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + amount;
      customer.points = (customer.points || 0) + Math.floor(amount / 10000);
      localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  },

  deleteCustomer(customerId) {
    let customers = this.getCustomers();
    customers = customers.filter(c => c.id !== customerId);
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
    return true;
  },

  // ===== SERVICES =====
  getServices() {
    try {
      const data = localStorage.getItem(DB_KEYS.SERVICES);
      return data ? JSON.parse(data) : DEFAULT_SERVICES;
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  },

  saveService(service) {
    const services = this.getServices();
    if (!service.id) {
      service.id = 'srv_' + Date.now();
      services.push(service);
    } else {
      const index = services.findIndex(s => s.id === service.id);
      if (index >= 0) {
        services[index] = service;
      } else {
        services.push(service);
      }
    }
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(services));
    return service;
  },

  deleteService(serviceId) {
    let services = this.getServices();
    services = services.filter(s => s.id !== serviceId);
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(services));
    return true;
  },

  // ===== FRAGRANCES =====
  getFragrances() {
    try {
      const data = localStorage.getItem(DB_KEYS.FRAGRANCES);
      return data ? JSON.parse(data) : DEFAULT_FRAGRANCES;
    } catch (e) {
      return DEFAULT_FRAGRANCES;
    }
  },

  saveFragrances(list) {
    localStorage.setItem(DB_KEYS.FRAGRANCES, JSON.stringify(list));
    return list;
  },

  // ===== EXPENSES =====
  getExpenses() {
    try {
      const data = localStorage.getItem(DB_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveExpense(expense) {
    const expenses = this.getExpenses();
    if (!expense.id) {
      expense.id = 'exp_' + Date.now();
      if (!expense.date) expense.date = new Date().toISOString();
      expenses.unshift(expense);
    } else {
      const index = expenses.findIndex(e => e.id === expense.id);
      if (index >= 0) {
        expenses[index] = expense;
      } else {
        expenses.unshift(expense);
      }
    }
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
    return expense;
  },

  deleteExpense(expenseId) {
    let expenses = this.getExpenses();
    expenses = expenses.filter(e => e.id !== expenseId);
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  },

  // ===== SETTINGS =====
  getSettings() {
    try {
      const data = localStorage.getItem(DB_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // ===== USERS & ROLES =====
  getUsers() {
    try {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  },

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  },

  getUserByUsername(username) {
    return this.getUsers().find(u => u.username.toLowerCase() === (username || '').toLowerCase());
  },

  saveUser(user) {
    const users = this.getUsers();
    if (!user.id) {
      user.id = 'usr_' + Date.now();
      users.push(user);
    } else {
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        users[index] = { ...users[index], ...user };
      } else {
        users.push(user);
      }
    }
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    // If active user is the one updated, sync current user
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser({ ...current, ...user });
    }

    return user;
  },

  deleteUser(userId) {
    let users = this.getUsers();
    // Cannot delete the primary admin
    if (userId === 'usr_admin') {
      return false;
    }
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    // If active user was deleted, fallback to primary admin
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(users[0] || DEFAULT_USERS[0]);
    }

    return true;
  },

  getCurrentUser() {
    try {
      const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
      if (!data || data === 'null' || data === 'undefined') return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user && user.id) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }
    return user;
  },

  // ===== BACKUP & RESTORE =====
  exportData() {
    const backup = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      services: this.getServices(),
      fragrances: this.getFragrances(),
      customers: this.getCustomers(),
      expenses: this.getExpenses(),
      orders: this.getOrders(),
      users: this.getUsers()
    };
    return JSON.stringify(backup, null, 2);
  },

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.services) localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(data.services));
      if (data.fragrances) localStorage.setItem(DB_KEYS.FRAGRANCES, JSON.stringify(data.fragrances));
      if (data.customers) localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.expenses) localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(data.expenses));
      if (data.orders) localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(data.orders));
      if (data.users) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(data.users));
      return { success: true };
    } catch (e) {
      console.error('Import error:', e);
      return { success: false, error: e.message };
    }
  }
};

// Initialize DB immediately
db.init();
window.db = db;
