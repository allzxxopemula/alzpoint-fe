src/
├── assets/
├── components/
│   ├── Sidebar.jsx        # Navigation Aside Kiri
│   └── Header.jsx         # Navbar Atas
├── layouts/
│   └── MainLayout.jsx     # Menyatukan Sidebar + Header + <Outlet />
├── pages/
│   ├── Login.jsx          # Halaman Login
│   ├── Dashboard.jsx      # Dashboard (Kontrol beda role Admin vs Kasir)
│   ├── Kasir.jsx          # Interface Kasir / POS
│   ├── Transaksi.jsx      # Confirm / Cancel Order
│   ├── Pelanggan.jsx      # Data Pelanggan
│   ├── Laporan.jsx        # Laporan Penjualan
│   └── Pengaturan.jsx     # CRUD Barang & Stok (Admin)
├── App.jsx                # Atur Route / Path
└── main.jsx