import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Login from './pages/Login'; // Import Login
import Dashboard from './pages/Dashboard';
import Kasir from './pages/Kasir';
import Transaksi from './pages/Transaksi';
import Produk from './pages/Produk';
import Pelanggan from './pages/Pelanggan';
import Laporan from './pages/Laporan';
import LaporanBulanan from './pages/LaporanBulanan';
import Pengaturan from './pages/Pengaturan';
import RiwayatAktivitas from './pages/RiwayatAktivitas';

function App() {
  const [hasWideScreen, setHasWideScreen] = useState(() => (
    typeof window === 'undefined' || window.matchMedia('(min-width: 768px)').matches
  ));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateScreenWidth = (event) => setHasWideScreen(event.matches);

    setHasWideScreen(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateScreenWidth);
    return () => mediaQuery.removeEventListener('change', updateScreenWidth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const handleUserUpdated = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch {
      // The in-memory profile still updates when browser storage is unavailable.
    }
  };

  if (!hasWideScreen) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-6 text-center text-white">
        <section className="w-full max-w-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl font-black text-cyan-400">
            AP
          </div>
          <h1 className="text-xl font-bold">Aplikasi membutuhkan layar yang lebih lebar</h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Untuk membuka AlzPoint di HP, pilih menu Chrome <strong className="text-white">⋮</strong> lalu aktifkan <strong className="text-white">Situs desktop</strong>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ROUTE LOGIN (Tanpa MainLayout / Sidebar) */}
        <Route path="/login" element={<Login setCurrentUser={setCurrentUser} />} />

        {/* ROUTE DENGAN MAINLAYOUT */}
        <Route
          element={currentUser
            ? <MainLayout currentUser={currentUser} onLogout={handleLogout} onUserUpdated={handleUserUpdated} />
            : <Navigate to="/login" replace />}
        >
          <Route path="/" element={<Navigate to={currentUser?.role === 'pelanggan' ? '/pelanggan' : '/dashboard'} replace />} />
          <Route path="/dashboard" element={currentUser?.role === 'pelanggan' ? <Navigate to="/pelanggan" replace /> : <Dashboard currentUser={currentUser} />} />
          <Route path="/kasir" element={<Kasir currentUser={currentUser} selfCheckout={currentUser?.role === 'pelanggan'} />} />
          <Route path="/transaksi" element={currentUser?.role === 'pelanggan' ? <Navigate to="/pelanggan" replace /> : <Transaksi currentUser={currentUser} />} />
          <Route path="/produk" element={currentUser?.role === 'pelanggan' ? <Navigate to="/pelanggan" replace /> : <Produk currentUser={currentUser} />} />
          <Route path="/pelanggan" element={currentUser?.role === 'pelanggan' ? <Kasir currentUser={currentUser} selfCheckout /> : <Pelanggan currentUser={currentUser} />} />
          <Route path="/laporan" element={currentUser?.role === 'pelanggan' ? <Navigate to="/pelanggan" replace /> : <Laporan currentUser={currentUser} />} />
          <Route path="/laporan-bulanan" element={['admin', 'kasir'].includes(currentUser?.role) ? <LaporanBulanan /> : <Navigate to="/pelanggan" replace />} />
          <Route path="/riwayat-aktivitas" element={currentUser?.role === 'admin' ? <RiwayatAktivitas /> : <Navigate to="/dashboard" replace />} />
          <Route path="/pengaturan" element={currentUser?.role === 'pelanggan' ? <Navigate to="/pelanggan" replace /> : <Pengaturan currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;