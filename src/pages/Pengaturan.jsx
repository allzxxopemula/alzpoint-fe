import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createCashier, createDiscount, deleteCashier, deleteDiscount, getCashiers, getCooperativeSettings, getDiscounts, updateCashier, updateCooperativeSettings } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import CategoryManager from '../components/CategoryManager';
import { 
  areGsapAnimationsEnabled, 
  setGsapAnimationsEnabled,
  isCashierImageHidden,
  setCashierImageHidden
} from '../utils/gsapPreference';
import { areSoundEffectsEnabled, setSoundEffectsEnabled } from '../utils/sound';
import { 
  faStore, 
  faUsersGear, 
  faTags,
  faSliders, 
  faSave, 
  faPlus, 
  faPenToSquare,
  faTrash, 
  faKey,
  faBuilding,
  faPhone,
  faEnvelope,
  faMapMarkerAlt,
  faAt
} from '@fortawesome/free-solid-svg-icons';

const Pengaturan = ({ currentUser }) => {
  const pageRef = usePageEntrance();
  const [activeTab, setActiveTab] = useState('profil');
  const [users, setUsers] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);
  const [userSaving, setUserSaving] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersSuccess, setUsersSuccess] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [discountRules, setDiscountRules] = useState(null);
  const [discountDraft, setDiscountDraft] = useState({ min_spend: '', discount_amount: '' });
  const [discountSaving, setDiscountSaving] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  
  // State Preferensi
  const [animationsEnabled, setAnimationsEnabled] = useState(() => areGsapAnimationsEnabled());
  const [hideImages, setHideImages] = useState(() => isCashierImageHidden());
  const [soundEffectsEnabled, setSoundEffectsEnabledState] = useState(() => areSoundEffectsEnabled());

  // Form State Profil Toko
  const [storeInfo, setStoreInfo] = useState({
    name: 'Koperasi Siswa (Kopsis)',
    address: 'Jl. Pendidikan No. 123, Nganjuk',
    phone: '081234567890',
    email: 'kopsis@sekolah.sch.id',
    receiptFooter: 'Terima kasih telah berbelanja di Kopsis!'
  });

  // Form State Tambah / Edit User Kasir
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    password_confirmation: '',
  });

  const isAdmin = currentUser?.role === 'admin';

  const handleAnimationToggle = (event) => {
    const enabled = event.target.checked;
    setAnimationsEnabled(enabled);
    setGsapAnimationsEnabled(enabled);
  };

  const handleHideImagesToggle = (event) => {
    const hidden = event.target.checked;
    setHideImages(hidden);
    setCashierImageHidden(hidden);
  };

  const handleSoundEffectsToggle = (event) => {
    const enabled = event.target.checked;
    setSoundEffectsEnabledState(enabled);
    setSoundEffectsEnabled(enabled);
  };

  useEffect(() => {
    let active = true;
    getCooperativeSettings()
      .then(({ data }) => {
        if (!active) return;
        const settings = data.data;
        setStoreInfo({
          name: settings.cooperative_name || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          receiptFooter: settings.receipt_footer || '',
        });
      })
      .catch((error) => {
        if (active) setSettingsError(error.response?.data?.message || 'Identitas Kopsis gagal dimuat.');
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'users') return undefined;

    let active = true;
    getCashiers()
      .then((response) => {
        if (active) setUsers(response.data.data);
      })
      .catch((error) => {
        if (active) {
          setUsersError(error.response?.data?.message || 'Daftar kasir gagal dimuat.');
          setUsers([]);
        }
      });

    return () => {
      active = false;
    };
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!isAdmin || activeTab !== 'discounts') return undefined;

    let active = true;
    getDiscounts()
      .then((response) => {
        if (active) setDiscountRules(response.data.data);
      })
      .catch((error) => {
        if (active) {
          setDiscountError(error.response?.data?.message || 'Rule diskon gagal dimuat.');
          setDiscountRules([]);
        }
      });

    return () => {
      active = false;
    };
  }, [activeTab, isAdmin]);

  const handleSaveStoreInfo = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const response = await updateCooperativeSettings({
        cooperative_name: storeInfo.name.trim(),
        address: storeInfo.address.trim() || null,
        phone: storeInfo.phone.trim() || null,
        email: storeInfo.email.trim() || null,
        receipt_footer: storeInfo.receiptFooter.trim() || null,
      });
      const settings = response.data.data;
      setStoreInfo({
        name: settings.cooperative_name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        receiptFooter: settings.receipt_footer || '',
      });
      setSettingsSuccess('Identitas tersimpan dan akan tampil pada struk berikutnya.');
    } catch (error) {
      setSettingsError(error.response?.data?.message || 'Identitas Kopsis gagal disimpan.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveCashier = async (e) => {
    e.preventDefault();
    setUserSaving(true);
    setUsersError('');
    setUsersSuccess('');

    const payload = { 
      full_name: newUser.name.trim(),
      username: newUser.username.trim()
    };

    if (newUser.password) {
      payload.password = newUser.password;
      payload.password_confirmation = newUser.password_confirmation;
    }

    try {
      const response = editingCashier
        ? await updateCashier(editingCashier.user_id, payload)
        : await createCashier({ ...payload, password: newUser.password });
      const cashier = response.data.data;
      setUsers((currentUsers) => {
        const nextUsers = editingCashier
          ? (currentUsers || []).map((user) => user.user_id === cashier.user_id ? cashier : user)
          : [...(currentUsers || []), cashier];
        return nextUsers.sort((first, second) => first.full_name.localeCompare(second.full_name, 'id'));
      });
      setUsersSuccess(editingCashier
        ? `Data kasir diperbarui. Username login: ${cashier.username}`
        : `Kasir dibuat. Username login: ${cashier.username}`);
      setNewUser({ name: '', username: '', password: '', password_confirmation: '' });
      setEditingCashier(null);
      setIsUserModalOpen(false);
    } catch (error) {
      setUsersError(error.response?.data?.message || 'Akun kasir gagal disimpan.');
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Hapus akun kasir ini? Riwayat transaksinya tetap tersimpan.')) return;

    setUsersError('');
    setUsersSuccess('');
    try {
      await deleteCashier(userId);
      setUsers((currentUsers) => (currentUsers || []).filter((user) => user.user_id !== userId));
      setUsersSuccess('Akun kasir berhasil dihapus.');
    } catch (error) {
      setUsersError(error.response?.data?.message || 'Akun kasir gagal dihapus.');
    }
  };

  const handleSaveDiscount = async (event) => {
    event.preventDefault();
    setDiscountSaving(true);
    setDiscountError('');
    setDiscountSuccess('');
    try {
      const response = await createDiscount({
        min_spend: Number(discountDraft.min_spend),
        discount_amount: Number(discountDraft.discount_amount),
      });
      setDiscountRules((current) => [...(current || []), response.data.data]
        .sort((first, second) => Number(first.min_spend) - Number(second.min_spend)));
      setDiscountDraft({ min_spend: '', discount_amount: '' });
      setDiscountSuccess('Rule diskon berhasil ditambahkan.');
    } catch (error) {
      setDiscountError(error.response?.data?.message || 'Rule diskon gagal disimpan.');
    } finally {
      setDiscountSaving(false);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    setDiscountError('');
    setDiscountSuccess('');
    try {
      await deleteDiscount(discountId);
      setDiscountRules((current) => (current || []).filter((rule) => rule.id !== discountId));
      setDiscountSuccess('Rule diskon berhasil dihapus.');
    } catch (error) {
      setDiscountError(error.response?.data?.message || 'Rule diskon gagal dihapus.');
    }
  };

  return (
    <div ref={pageRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {/* HEADER & TAB NAVIGASI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengaturan Sistem</h1>
          <p className="text-xs text-slate-400">Kelola profil usaha, akun kasir, kategori produk, dan preferensi aplikasi</p>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex border-b border-slate-100 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profil')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'profil'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FontAwesomeIcon icon={faStore} />
            <span>Profil Usaha</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FontAwesomeIcon icon={faUsersGear} />
              <span>Manajemen User</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'categories'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FontAwesomeIcon icon={faTags} />
              <span>Kategori</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('sistem')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'sistem'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <FontAwesomeIcon icon={faSliders} />
            <span>Animasi & Tampilan</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('discounts')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                activeTab === 'discounts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FontAwesomeIcon icon={faTags} />
              <span>Atur Diskon</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: PROFIL KOPSIS */}
      {activeTab === 'profil' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full">
          <h3 className="font-bold text-slate-900 text-base mb-4">Informasi Usaha / Toko</h3>
          <form onSubmit={handleSaveStoreInfo} className="space-y-4 text-xs">
            {settingsLoading && <p className="text-slate-500">Memuat identitas...</p>}
            {settingsError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">{settingsError}</p>}
            {settingsSuccess && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">{settingsSuccess}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store-name" className="font-bold text-slate-500 mb-1 block">Nama Usaha / Toko</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faBuilding} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-name"
                    name="cooperative_name"
                    type="text"
                    autoComplete="organization"
                    required
                    value={storeInfo.name}
                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="store-address" className="font-bold text-slate-500 mb-1 block">Alamat</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-address"
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    value={storeInfo.address}
                    onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store-phone" className="font-bold text-slate-500 mb-1 block">No. HP / Telepon</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-phone"
                    name="phone"
                    type="text"
                    autoComplete="tel"
                    value={storeInfo.phone}
                    onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="store-email" className="font-bold text-slate-500 mb-1 block">Email</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={storeInfo.email}
                    onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="receipt-footer" className="font-bold text-slate-500 mb-1 block">Pesan Kaki Struk (Receipt Footer)</label>
              <textarea
                id="receipt-footer"
                name="receipt_footer"
                autoComplete="off"
                rows="2"
                value={storeInfo.receiptFooter}
                onChange={(e) => setStoreInfo({ ...storeInfo, receiptFooter: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isAdmin || settingsLoading || settingsSaving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
              >
                <FontAwesomeIcon icon={faSave} />
                <span>{settingsSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN KASIR */}
      {activeTab === 'users' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Daftar Kasir Usaha Ini</h3>
              <p className="text-xs text-slate-400">Kasir otomatis terhubung ke tenant usaha ini.</p>
            </div>
            <button
              onClick={() => {
                setEditingCashier(null);
                setNewUser({ name: '', username: '', password: '', password_confirmation: '' });
                setUsersError('');
                setUsersSuccess('');
                setIsUserModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Tambah Kasir</span>
            </button>
          </div>

          {usersError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{usersError}</p>}
          {usersSuccess && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{usersSuccess}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 font-semibold">NAMA LENGKAP</th>
                  <th className="pb-3 font-semibold">USERNAME</th>
                  <th className="pb-3 font-semibold text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                {users?.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3.5 font-mono text-slate-500">@{u.username}</td>
                    <td className="py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCashier(u);
                          setNewUser({ name: u.full_name, username: u.username, password: '', password_confirmation: '' });
                          setUsersError('');
                          setUsersSuccess('');
                          setIsUserModalOpen(true);
                        }}
                        className="mr-1 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="Edit kasir"
                        aria-label={`Edit kasir ${u.full_name}`}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.user_id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Kasir"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users === null && <tr><td colSpan="3" className="py-6 text-center text-slate-400">Memuat daftar kasir...</td></tr>}
                {users?.length === 0 && <tr><td colSpan="3" className="py-6 text-center text-slate-400">Belum ada kasir di usaha ini.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && isAdmin && <CategoryManager />}

      {/* PENGATURAN ANIMASI & TAMPILAN */}
      {activeTab === 'sistem' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Preferensi Animasi & Tampilan Kasir</h3>
            <p className="mt-1 text-slate-400">Sesuaikan preferensi animasi GSAP dan tampilan produk pada halaman kasir.</p>
          </div>
          
          <div className="space-y-3">
            {/* TOGGLE GSAP ANIMATION */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <label htmlFor="gsap-animation-toggle" className="font-bold text-slate-800">Aktifkan animasi GSAP</label>
                <p className="mt-1 text-[11px] text-slate-400">{animationsEnabled ? 'Efek entrance dan interaksi berjalan.' : 'Semua efek GSAP dinonaktifkan.'}</p>
              </div>
              <input
                id="gsap-animation-toggle"
                name="gsap_animations_enabled"
                type="checkbox"
                role="switch"
                checked={animationsEnabled}
                onChange={handleAnimationToggle}
                className="h-5 w-9 cursor-pointer accent-indigo-600"
              />
            </div>

            {/* TOGGLE HIDE CASHIER IMAGES */}
            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <label htmlFor="hide-cashier-images-toggle" className="font-bold text-slate-800">Sembunyikan gambar produk di halaman Kasir</label>
                <p className="mt-1 text-[11px] text-slate-400">{hideImages ? 'Gambar produk disembunyikan agar tampilan kasir lebih ringkas.' : 'Gambar produk ditampilkan di katalog kasir.'}</p>
              </div>
              <input
                id="hide-cashier-images-toggle"
                name="hide_cashier_images"
                type="checkbox"
                role="switch"
                checked={hideImages}
                onChange={handleHideImagesToggle}
                className="h-5 w-9 cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <label htmlFor="sound-effects-toggle" className="font-bold text-slate-800">Aktifkan efek suara</label>
                <p className="mt-1 text-[11px] text-slate-400">{soundEffectsEnabled ? 'Efek suara klik, konfirmasi, pembatalan, dan reset aktif.' : 'Semua efek suara dinonaktifkan.'}</p>
              </div>
              <input
                id="sound-effects-toggle"
                name="sound_effects_enabled"
                type="checkbox"
                role="switch"
                checked={soundEffectsEnabled}
                onChange={handleSoundEffectsToggle}
                className="h-5 w-9 cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'discounts' && isAdmin && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Kelola Diskon Otomatis</h3>
            <p className="text-xs text-slate-400">Rule dengan minimal belanja tertinggi yang terpenuhi akan digunakan.</p>
          </div>
          {discountError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{discountError}</p>}
          {discountSuccess && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{discountSuccess}</p>}

          <form onSubmit={handleSaveDiscount} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label htmlFor="discount-min-spend" className="text-xs font-bold text-slate-500">
              Minimal Belanja (Rp)
              <input
                id="discount-min-spend"
                name="min_spend"
                type="number"
                autoComplete="off"
                min="0.01"
                step="0.01"
                required
                value={discountDraft.min_spend}
                onChange={(event) => setDiscountDraft({ ...discountDraft, min_spend: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </label>
            <label htmlFor="discount-amount" className="text-xs font-bold text-slate-500">
              Potongan (Rp)
              <input
                id="discount-amount"
                name="discount_amount"
                type="number"
                autoComplete="off"
                min="0.01"
                step="0.01"
                required
                value={discountDraft.discount_amount}
                onChange={(event) => setDiscountDraft({ ...discountDraft, discount_amount: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={discountSaving || discountRules === null}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>{discountSaving ? 'Menyimpan...' : 'Tambah Rule Diskon'}</span>
            </button>
          </form>

          <div className="divide-y divide-slate-100 border-y border-slate-100">
            {discountRules === null && <p className="py-5 text-center text-xs text-slate-400">Memuat rule diskon...</p>}
            {discountRules?.length === 0 && <p className="py-5 text-center text-xs text-slate-400">Belum ada rule diskon.</p>}
            {discountRules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-4 py-3 text-xs">
                <p className="font-semibold text-slate-700">
                  Minimal belanja Rp {Number(rule.min_spend).toLocaleString('id-ID')} <span className="text-slate-400">→</span> Diskon Rp {Number(rule.discount_amount).toLocaleString('id-ID')}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteDiscount(rule.id)}
                  title="Hapus rule diskon"
                  aria-label="Hapus rule diskon"
                  className="shrink-0 rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KASIR */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingCashier ? 'Edit Akun Kasir' : 'Tambah Akun Kasir'}</h3>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingCashier(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCashier} className="space-y-3 text-xs">
              <div>
                <label htmlFor="cashier-full-name" className="font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                <input
                  id="cashier-full-name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Masukan"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="cashier-username" className="font-bold text-slate-500 mb-1 block">Username</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faAt} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="cashier-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="Masukan"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cashier-password" className="font-bold text-slate-500 mb-1 block">{editingCashier ? 'Password Baru (opsional)' : 'Password'}</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faKey} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="cashier-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required={!editingCashier}
                    minLength={8}
                    placeholder={editingCashier ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 8 karakter'}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {newUser.password && (
                <div>
                  <label htmlFor="cashier-password-confirmation" className="font-bold text-slate-500 mb-1 block">Konfirmasi Password Baru</label>
                  <input
                    id="cashier-password-confirmation"
                    name="password_confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newUser.password_confirmation}
                    onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={userSaving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition"
                >
                  {userSaving ? 'Menyimpan...' : 'Simpan Kasir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pengaturan;