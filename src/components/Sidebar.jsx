import { NavLink, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStore, 
  faChartPie, 
  faReceipt, 
  faBox, 
  faUsers, 
  faFileLines, 
  faCalendarDays,
  faClock,
  faGear, 
  faRightFromBracket,
  faBell,
  faAnglesLeft,
  faAnglesRight,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { getOrders, updateAdminProfile } from '../api/kopsis';
import { areGsapAnimationsEnabled, GSAP_PREFERENCE_EVENT } from '../utils/gsapPreference';

const Sidebar = ({ currentUser, onLogout, onUserUpdated, isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [newOrder, setNewOrder] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', username: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const previousPendingIds = useRef(null);
  const notificationTimeout = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!['admin', 'kasir'].includes(currentUser?.role)) return undefined;

    let active = true;
    let requestInFlight = false;
    let refreshTimeout;
    const requestController = new AbortController();
    const loadPendingOrders = async () => {
      if (!active || document.visibilityState === 'hidden' || requestInFlight) return;
      requestInFlight = true;

      try {
        const response = await getOrders({ status: 'pending' }, { signal: requestController.signal });
        if (!active) return;

        const orders = response.data.data;
        const currentIds = new Set(orders.map((order) => order.order_id));
        setPendingCount((count) => (count === orders.length ? count : orders.length));

        if (previousPendingIds.current) {
          const incomingOrder = orders.find((order) => !previousPendingIds.current.has(order.order_id));
          if (incomingOrder) {
            setNewOrder(incomingOrder);
            window.clearTimeout(notificationTimeout.current);
            notificationTimeout.current = window.setTimeout(() => setNewOrder(null), 7000);
          }
        }

        previousPendingIds.current = currentIds;
      } catch {
        // Keep the last known count when the server is temporarily unavailable.
      } finally {
        requestInFlight = false;
      }
    };

    const refreshWhenAvailable = () => {
      window.clearTimeout(refreshTimeout);
      if (document.visibilityState === 'visible') {
        refreshTimeout = window.setTimeout(loadPendingOrders, 150);
      }
    };

    loadPendingOrders();
    window.addEventListener('focus', refreshWhenAvailable);
    window.addEventListener('online', refreshWhenAvailable);
    document.addEventListener('visibilitychange', refreshWhenAvailable);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshWhenAvailable);
      window.removeEventListener('online', refreshWhenAvailable);
      document.removeEventListener('visibilitychange', refreshWhenAvailable);
      window.clearTimeout(refreshTimeout);
      window.clearTimeout(notificationTimeout.current);
      requestController.abort();
    };
  }, [currentUser?.role]);

  useEffect(() => {
    if (!isProfileModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsProfileModalOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileModalOpen]);

  useEffect(() => {
    if (!newOrder || !notificationRef.current) return undefined;

    let tween;
    const playNotification = () => {
      tween?.kill();
      if (!areGsapAnimationsEnabled()) return;
      tween = gsap.fromTo(notificationRef.current,
        { autoAlpha: 0, x: 28, y: -8 },
        { autoAlpha: 1, x: 0, y: 0, duration: 0.4, ease: 'power3.out' },
      );
    };
    const handlePreferenceChange = (event) => {
      if (event.detail?.enabled) playNotification();
      else {
        tween?.revert();
        tween = undefined;
      }
    };

    playNotification();
    window.addEventListener(GSAP_PREFERENCE_EVENT, handlePreferenceChange);
    return () => {
      window.removeEventListener(GSAP_PREFERENCE_EVENT, handlePreferenceChange);
      tween?.kill();
    };
  }, [newOrder]);

  const linkClass = ({ isActive }) =>
    `flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl transition ${
      isActive ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)]'
    }`;

  const openProfileModal = () => {
    setProfileForm({ full_name: currentUser?.full_name || '', username: currentUser?.username || '' });
    setProfileError('');
    setProfileSuccess('');
    setIsProfileModalOpen(true);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await updateAdminProfile({
        full_name: profileForm.full_name.trim(),
        username: profileForm.username.trim(),
      });
      onUserUpdated?.(response.data.data);
      setProfileSuccess('Profil berhasil diperbarui.');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Profil gagal diperbarui.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Saat collapse, sidebar hanya menampilkan ikon; saat terbuka, lebar dan label menu kembali.
  return (
    <aside style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text)' }} className={`h-screen ${isCollapsed ? 'w-16' : 'w-52'} flex flex-col justify-between p-2 fixed left-0 top-0 border-r z-20 transition-[width] duration-300`}>
      <div>
        {/* LOGO BRAND */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1 py-2 mb-4`}>
          {!isCollapsed && <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-[var(--theme-accent)] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            <FontAwesomeIcon icon={faStore} className="text-sm" />
          </div>
          <span className="text-lg font-bold text-[var(--sidebar-text)] tracking-wide">Alz Point</span>
          </div>}
          {/* Ikon panah berganti arah dan memanggil fungsi toggle dari MainLayout. */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Perlebar sidebar' : 'Kecilkan sidebar'}
            title={isCollapsed ? 'Perlebar sidebar' : 'Kecilkan sidebar'}
            className="w-9 h-9 rounded-lg text-[var(--sidebar-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] flex items-center justify-center transition"
          >
            <FontAwesomeIcon icon={isCollapsed ? faAnglesRight : faAnglesLeft} />
          </button>
        </div>

        {/* MENU NAVIGASI MAIN */}
        <nav className="flex flex-col gap-1 text-sm font-medium">
          {currentUser?.role === 'pelanggan' ? (
            <NavLink
              to="/pelanggan"
              className={linkClass}
              title={isCollapsed ? 'Belanja' : undefined}
            >
              {/* Ikon selalu tampil; teks disembunyikan ketika Sidebar collapse. */}
              <FontAwesomeIcon icon={faStore} className="w-4 h-4" />
              {!isCollapsed && <span>Belanja</span>}
            </NavLink>
          ) : (
            <>
          <NavLink
            to="/kasir" 
            className={linkClass}
            title={isCollapsed ? 'Kasir' : undefined}
          >
            <FontAwesomeIcon icon={faStore} className="w-4 h-4" />
            {!isCollapsed && <span>Kasir</span>}
          </NavLink>

          <NavLink
            to="/dashboard" 
            className={linkClass}
            title={isCollapsed ? 'Dashboard' : undefined}
          >
            <FontAwesomeIcon icon={faChartPie} className="w-4 h-4" />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/transaksi" 
            className={({ isActive }) => 
                `relative flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl transition ${
                isActive ? 'bg-[var(--theme-accent)] text-white' : 'text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)]'
              }`
            }
            title={isCollapsed ? `Transaksi${pendingCount ? ` (${pendingCount} baru)` : ''}` : undefined}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
              <FontAwesomeIcon icon={faReceipt} className="w-4 h-4" />
              {!isCollapsed && <span>Transaksi</span>}
            </div>
            {pendingCount > 0 && (
              <span className={`bg-rose-500 text-white text-[10px] font-bold rounded-full ${isCollapsed ? 'absolute -right-1 -top-1 min-w-4 h-4 px-1' : 'px-2 py-0.5'}`}>
                {pendingCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/produk" 
            className={linkClass}
            title={isCollapsed ? 'Produk' : undefined}
          >
            <FontAwesomeIcon icon={faBox} className="w-4 h-4" />
            {!isCollapsed && <span>Produk</span>}
          </NavLink>

          <NavLink
            to="/pelanggan" 
            className={linkClass}
            title={isCollapsed ? 'Pelanggan' : undefined}
          >
            <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
            {!isCollapsed && <span>Pelanggan</span>}
          </NavLink>

          <div className="my-2 border-t border-slate-800/60"></div>

          <NavLink
            to="/laporan" 
            className={linkClass}
            title={isCollapsed ? 'Laporan' : undefined}
          >
            <FontAwesomeIcon icon={faFileLines} className="w-4 h-4" />
            {!isCollapsed && <span>Laporan</span>}
          </NavLink>

          <NavLink
            to="/laporan-bulanan"
            className={linkClass}
            title={isCollapsed ? 'Laporan Bulanan' : undefined}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
            {!isCollapsed && <span>Laporan Bulanan</span>}
          </NavLink>

          {currentUser?.role === 'admin' && (
            <NavLink
              to="/riwayat-aktivitas"
              className={linkClass}
              title={isCollapsed ? 'Riwayat Aktivitas' : undefined}
            >
              <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
              {!isCollapsed && <span>Riwayat Aktivitas</span>}
            </NavLink>
          )}

          <NavLink
            to="/pengaturan" 
            className={linkClass}
            title={isCollapsed ? 'Pengaturan' : undefined}
          >
            <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
            {!isCollapsed && <span>Pengaturan</span>}
          </NavLink>

            </>
          )}
          <button onClick={() => setIsLogoutModalOpen(true)} title={isCollapsed ? 'Keluar' : undefined} className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2.5 rounded-xl text-rose-400 hover:bg-slate-800/60 transition text-left mt-1`}>
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </nav>
      </div>

      {/* FOOTER USER PROFILE */}
      <div style={{ borderColor: 'var(--sidebar-border)' }} className={`pt-4 border-t flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-1`}>
        {currentUser?.role === 'admin' ? (
          <button
            type="button"
            onClick={openProfileModal}
            aria-label="Ubah profil admin"
            title="Ubah profil admin"
            className={`flex min-w-0 items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-1 py-1 text-left transition hover:bg-[var(--sidebar-hover)]`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent)] text-sm font-bold text-white">
              {currentUser?.full_name?.charAt(0) || 'A'}
            </span>
            {!isCollapsed && <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-[var(--sidebar-text)]">{currentUser?.full_name || 'Admin'}</span>
              <span className="text-xs capitalize text-[var(--sidebar-muted)]">{currentUser.role}</span>
            </span>}
          </button>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent)] text-sm font-bold text-white">
              {(currentUser?.full_name || currentUser?.name)?.charAt(0) || 'A'}
            </div>
            {!isCollapsed && <div className="flex min-w-0 flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-[var(--sidebar-text)]">{currentUser?.full_name || currentUser?.name || 'Pengguna'}</span>
              <span className="text-xs capitalize text-[var(--sidebar-muted)]">{currentUser?.role || 'Owner'}</span>
            </div>}
          </>
        )}
      </div>

      {currentUser?.role === 'admin' && isProfileModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-slate-950/45"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsProfileModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-profile-title"
            className="fixed bottom-5 left-4 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 text-[var(--theme-text)] shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="admin-profile-title" className="text-base font-bold">Profil Admin</h2>
                <p className="mt-1 text-xs text-[var(--theme-muted)]">Ubah nama lengkap dan username akun ini.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                aria-label="Tutup profil"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)]"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            {profileError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{profileError}</p>}
            {profileSuccess && <p role="status" className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{profileSuccess}</p>}
            <form onSubmit={handleProfileSave} className="space-y-3">
              <label htmlFor="admin-profile-name" className="block text-xs font-semibold">
                Nama lengkap
                <input
                  id="admin-profile-name"
                  name="full_name"
                  required
                  maxLength={100}
                  value={profileForm.full_name}
                  onChange={(event) => setProfileForm((form) => ({ ...form, full_name: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 py-2 text-xs outline-none focus:border-[var(--theme-accent)]"
                />
              </label>
              <label htmlFor="admin-profile-username" className="block text-xs font-semibold">
                Username
                <input
                  id="admin-profile-username"
                  name="username"
                  required
                  maxLength={50}
                  pattern="[A-Za-z0-9._-]+"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((form) => ({ ...form, username: event.target.value }))}
                  className="mt-1.5 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-background)] px-3 py-2 text-xs outline-none focus:border-[var(--theme-accent)]"
                />
              </label>
              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded-lg bg-[var(--theme-accent)] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-90 disabled:opacity-50"
              >
                {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsLogoutModalOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="logout-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </div>
            <h2 id="logout-title" className="text-lg font-bold text-slate-900">Keluar dari Alz Point?</h2>
            <p className="mt-1 text-sm text-slate-500">Sesi akun akan diakhiri dan kamu kembali ke halaman login.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  onLogout();
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Keluar
              </button>
            </div>
          </section>
        </div>
      )}

      {newOrder && (
        <button
          ref={notificationRef}
          type="button"
          onClick={() => {
            setNewOrder(null);
            navigate('/transaksi');
          }}
          className="fixed top-20 right-6 z-50 flex w-[min(22rem,calc(100vw-3rem))] items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-xl shadow-slate-900/10"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <FontAwesomeIcon icon={faBell} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">Transaksi baru masuk</span>
            <span className="block truncate text-xs text-slate-500">{newOrder.order_number} · {newOrder.customer?.full_name || 'Pelanggan'}</span>
          </span>
        </button>
      )}
    </aside>
  );
};

export default Sidebar;