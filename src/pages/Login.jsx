import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faArrowRight,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faCode,
  faXmark,
  faLaptopCode,
  faServer,
  faExternalLink
} from '@fortawesome/free-solid-svg-icons';

// =========================================================
// KONSTANTA LINK REPOSITORI SOURCE CODE
// =========================================================
const FRONTEND_REPO_URL = "https://github.com/allzxxopemula/alzpoint-fe"; 
const BACKEND_REPO_URL = "https://github.com/allzxxopemula/alzpoint-be";   

const Login = ({ setCurrentUser }) => {
  const pageRef = usePageEntrance();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State untuk modal overlay Source Code
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await login({ username, password });
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      navigate(user.role === 'pelanggan' ? '/pelanggan' : '/dashboard');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={pageRef} className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white relative">
      
      {/* =========================================================
          TOMBOL POJOK KANAN ATAS: LIHAT SOURCE CODE
          ========================================================= */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
        <button
          type="button"
          onClick={() => setIsSourceModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-sm hover:shadow transition-all duration-200 text-xs sm:text-sm font-semibold active:scale-95"
        >
          <FontAwesomeIcon icon={faCode} className="text-blue-600 text-sm" />
          <span>Source Code</span>
        </button>
      </div>

      {/* =========================================================
          MODAL OVERLAY: SOURCE CODE (FRONT END & BACK END)
          ========================================================= */}
      {isSourceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSourceModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat area dalam diklik
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FontAwesomeIcon icon={faCode} className="text-base" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Source Code</h3>
                  <p className="text-xs text-slate-500 font-medium">Pilih repositori proyek yang ingin diliat</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Tutup modal"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            {/* Pilihan Repositori */}
            <div className="space-y-3">
              {/* Option 1: Front End */}
              <a
                href={FRONTEND_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 group transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faLaptopCode} className="text-base" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Front-End Repository
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      React.js & Tailwind CSS
                    </p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faExternalLink} className="text-slate-400 group-hover:text-blue-600 text-xs transition-colors" />
              </a>

              {/* Option 2: Back End */}
              <a
                href={BACKEND_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 group transition-all duration-200"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FontAwesomeIcon icon={faServer} className="text-base" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      Back-End Repository
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      Laravel API
                    </p>
                  </div>
                </div>
                <FontAwesomeIcon icon={faExternalLink} className="text-slate-400 group-hover:text-blue-600 text-xs transition-colors" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          PANEL KIRI: BRANDING & INFORMASI (BACKGROUND BIRU MUDA / SOFT)
          ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 text-slate-900 flex-col justify-between p-12 xl:p-16 relative overflow-hidden border-r border-blue-100">
        
        {/* Aksen Dekoratif Halus di Background Kiri */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-200 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-3/4 h-3/4 rounded-full bg-blue-100 blur-3xl"></div>
        </div>

        {/* HEADER KIRI: LOGO PNG & NAMA APLIKASI */}
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="https://i.ibb.co.com/PsC1KSyz/Chat-GPT-Image-4-Okt-2026-14-45-38-removebg-preview-1.png" 
            alt="Alz Point Logo" 
            className="w-10 h-10 object-contain drop-shadow-sm"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <span className="text-2xl font-extrabold tracking-tight text-blue-900">Alz Point</span>
        </div>

        {/* KONTEN TENGAH: HERO TEXT & FITUR UNTUK BISNIS UMUM */}
        <div className="relative z-10 w-full max-w-lg mt-8">
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 text-blue-950">
            Solusi Kasir Modern untuk Bisnis Anda.
          </h1>
          <p className="text-blue-800 text-sm xl:text-base leading-relaxed mb-8 font-medium">
            Kelola transaksi ritel, atur stok barang, dan pantau laporan penjualan harian dengan mudah, cepat, serta aman menggunakan sistem POS yang terintegrasi.
          </p>
          
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-blue-900">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-lg" />
              <span className="font-semibold">Transaksi kasir responsif & efisien</span>
            </li>
            <li className="flex items-center gap-3 text-blue-900">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-lg" />
              <span className="font-semibold">Manajemen inventaris & monitoring stok</span>
            </li>
            <li className="flex items-center gap-3 text-blue-900">
              <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 text-lg" />
              <span className="font-semibold">Laporan keuangan & analitik bisnis lengkap</span>
            </li>
          </ul>
        </div>

        {/* FOOTER KIRI */}
        <div className="relative z-10 text-xs font-semibold text-blue-400">
          © {new Date().getFullYear()} Alz Point. All rights reserved.
        </div>
      </div>

      {/* =========================================================
          PANEL KANAN: FORM LOGIN (BACKGROUND PUTIH)
          ========================================================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center p-6 sm:p-10 md:p-16 bg-white relative z-10">
        
        {/* LOGO MOBILE (Hanya tampil di layar kecil) */}
        <div className="lg:hidden flex items-center gap-2 mb-8 sm:mb-10">
          <img 
            src="https://i.ibb.co.com/PsC1KSyz/Chat-GPT-Image-4-Okt-2026-14-45-38-removebg-preview-1.png" 
            alt="Logo" 
            className="w-8 h-8 object-contain" 
            onError={(e) => e.target.style.display = 'none'} 
          />
          <span className="text-xl font-extrabold text-blue-700 tracking-tight">Alz Point</span>
        </div>

        <div className="w-full max-w-sm sm:max-w-md mx-auto lg:mx-0 lg:max-w-sm xl:max-w-md">
          {/* HEADER FORM */}
          <div className="mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Masuk ke Akun
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Silakan masukkan kredensial akses Anda untuk mengelola bisnis.
            </p>
          </div>

          {/* FORM AREA */}
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            {errorMessage && (
              <div role="alert" className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-700">
                <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* INPUT USERNAME */}
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="login-username" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 text-sm" />
                </div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* INPUT PASSWORD */}
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="login-password" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-slate-400 text-sm" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            {/* TOMBOL SUBMIT */}
            <div className="pt-2 sm:pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all duration-200"
              >
                <span>{loading ? 'Memeriksa kredensial...' : 'Masuk ke Dashboard'}</span>
                {!loading && <FontAwesomeIcon icon={faArrowRight} />}
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default Login;