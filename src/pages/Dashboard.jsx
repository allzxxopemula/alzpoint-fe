import { useEffect, useState } from 'react';
import countUpModule from 'react-countup';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getDashboardStats, getSalesReport, getCashiers } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import { 
  faDollarSign, 
  faShoppingBag, 
  faBoxOpen, 
  faArrowTrendUp,
  faDownload,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);
const CountUp = countUpModule.default || countUpModule;
const formatCurrency = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
const formatDashboardTimestamp = (value) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Jakarta',
}).format(new Date(value));

const Dashboard = () => {
  const dashboardRef = usePageEntrance({ duration: 1.05, stagger: 0.12, y: 20, ease: 'power3.out', fromOpacity: 1 });
  const [filterPeriod, setFilterPeriod] = useState('7 Hari');
  const [stats, setStats] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const periodKey = { 'Hari Ini': 'today', '7 Hari': 'week', '30 Hari': 'month' }[filterPeriod];

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let refreshTimer;

    const loadDashboard = async () => {
      if (!active || requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;

      try {
        const [statsResponse, reportResponse, cashiersResponse] = await Promise.all([
          getDashboardStats(),
          getSalesReport(periodKey),
          getCashiers(),
        ]);
        if (active) {
          setStats(statsResponse.data.data);
          setSalesReport(reportResponse.data.data);
          setCashiers(cashiersResponse.data.data);
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Statistik belum dapat dimuat.');
      } finally {
        requestInFlight = false;
        if (active) {
          setLoading(false);
          refreshTimer = window.setTimeout(loadDashboard, 10000);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(refreshTimer);
      loadDashboard();
    };

    loadDashboard();
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [periodKey]);

  const chartLabels = salesReport?.chart?.map((bucket) => bucket.label) || [];
  const transactionsChart = {
    labels: chartLabels,
    datasets: [{
      label: 'Transaksi',
      data: salesReport?.chart?.map((bucket) => bucket.transactions) || [],
      backgroundColor: '#0f766e',
      hoverBackgroundColor: '#115e59',
      borderRadius: 7,
      maxBarThickness: 38,
    }],
  };
  const revenueChart = {
    labels: chartLabels,
    datasets: [{
      label: 'Pendapatan',
      data: salesReport?.chart?.map((bucket) => bucket.revenue) || [],
      borderColor: '#d97706',
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      pointBackgroundColor: '#d97706',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3,
      fill: true,
      tension: 0.38,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
      delay: (context) => context.type === 'data' && context.mode === 'default'
        ? context.dataIndex * 45
        : 0,
    },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { autoSkip: true, maxTicksLimit: periodKey === 'today' ? 8 : periodKey === 'week' ? 7 : 10 },
      },
      y: { beginAtZero: true, grid: { color: '#eef2f7' }, border: { display: false }, ticks: { precision: 0 } },
    },
  };
  const revenueOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: { callback: (value) => `${Number(value) / 1000} rb` },
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
    },
  };

  return (
    <div ref={dashboardRef} className="space-y-6 bg-slate-50 min-h-screen p-2 text-slate-800 relative">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {loading && !stats && <p className="text-xs text-slate-500">Memuat statistik...</p>}

      {/* TITLE & FILTER PERIODE */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Dashboard</h2>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 text-xs font-medium">
          {['Hari Ini', '7 Hari', '30 Hari'].map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterPeriod === period 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {period}
            </button>
          ))}
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
            <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>
      </div>

      {/* 4 STATISTIK UTAMA (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL PENDAPATAN */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {salesReport
                  ? <CountUp end={Number(salesReport.total_revenue)} duration={2.4} formattingFn={formatCurrency} />
                  : <span aria-label="Memuat pendapatan" className="block h-7 w-32 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faDollarSign} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            <span className="text-slate-500 font-medium">{filterPeriod}</span>
          </p>
        </div>

        {/* CARD 2: TOTAL TRANSAKSI */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {salesReport
                  ? <CountUp end={Number(salesReport.transaction_count)} duration={2.2} separator="." />
                  : <span aria-label="Memuat transaksi" className="block h-7 w-14 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faShoppingBag} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            <span className="text-emerald-600 font-medium">Transaksi</span> {filterPeriod.toLowerCase()}
          </p>
        </div>

        {/* CARD 3: ITEM TERJUAL */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Terjual</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {salesReport
                  ? <CountUp end={Number(salesReport.items_sold)} duration={2.2} separator="." />
                  : <span aria-label="Memuat item terjual" className="block h-7 w-16 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            <span className="text-slate-500 font-medium">Item</span> terjual {filterPeriod.toLowerCase()}
          </p>
        </div>

        {/* CARD 4: RATA-RATA TRANSAKSI */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Transaksi</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">
                {salesReport
                  ? <CountUp end={Number(salesReport.average_transaction)} duration={2.2} formattingFn={formatCurrency} />
                  : <span aria-label="Memuat rata-rata transaksi" className="block h-7 w-32 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Nilai rata-rata pesanan terkonfirmasi {filterPeriod.toLowerCase()}
          </p>
        </div>
      </div>

      {/* SECTION GRAFIK (PENJUALAN HARIAN, PENDAPATAN, KASIR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* GRAFIK BAR: PENJUALAN HARIAN */}
        <div data-gsap-reveal className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Transaksi Terkonfirmasi</p>
              <h4 className="text-3xl font-extrabold text-slate-900 mt-1">
                {salesReport
                  ? <CountUp end={Number(salesReport.transaction_count)} duration={2.4} separator="." />
                  : <span aria-label="Memuat transaksi" className="block h-9 w-20 rounded bg-slate-100 animate-pulse" />}
              </h4>
              <p className="text-xs text-slate-500 mt-1">Jumlah order per {periodKey === 'today' ? 'jam' : 'hari'}</p>
            </div>
            <span className="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded-lg">{filterPeriod}</span>
          </div>

          <div className="h-56">
            {salesReport?.transaction_count > 0
              ? <Bar key={periodKey} data={transactionsChart} options={chartOptions} />
              : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada transaksi pada periode ini.</div>}
          </div>
        </div>

        {/* GRAFIK LINE: PENDAPATAN */}
        <div data-gsap-reveal className="md:col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Pendapatan</p>
              <h4 className="text-3xl font-extrabold text-slate-900 mt-1">
                {salesReport
                  ? <CountUp end={Number(salesReport.total_revenue)} duration={2.5} formattingFn={formatCurrency} />
                  : <span aria-label="Memuat pendapatan" className="block h-9 w-40 rounded bg-slate-100 animate-pulse" />}
              </h4>
              <p className="text-xs text-slate-500 mt-1">Dari order terkonfirmasi</p>
            </div>
            <span className="text-xs text-slate-500 border border-slate-200 px-2 py-1 rounded-lg">{filterPeriod}</span>
          </div>

          <div className="h-56">
            {salesReport?.transaction_count > 0
              ? <Line key={periodKey} data={revenueChart} options={revenueOptions} />
              : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada pendapatan pada periode ini.</div>}
          </div>
        </div>

        {/* LIST KASIR (CONTAINER KANAN) */}
        <div data-gsap-reveal className="md:col-span-2 lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tim Kasir</p>
              <h4 className="text-base font-bold text-slate-900 mt-1">Kasir Aktif</h4>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">
              <FontAwesomeIcon icon={faUsers} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto app-scrollbar pr-2 min-h-0">
            {loading && !stats ? (
              <div className="text-center text-xs text-slate-400 py-4">Memuat data kasir...</div>
            ) : cashiers?.length > 0 ? (
              <div className="flex flex-col">
                {cashiers.map((c) => (
                  <div key={c.user_id} className="flex items-center gap-3 py-2.5 border-b border-slate-100/80 last:border-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-sm">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-slate-900 truncate">{c.full_name}</span>
                      <span className="text-[10px] text-slate-500 truncate">@{c.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 py-4">Belum ada akun kasir.</div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL TRANSAKSI TERAKHIR */}
      <div data-gsap-reveal className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900 text-base">Transaksi Terakhir</h3>
          <button className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition">
            Lihat Semua
          </button>
        </div>

        <div className="app-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-semibold">NO. TRANSAKSI</th>
                <th className="px-5 py-3 font-semibold">KASIR</th>
                <th className="px-5 py-3 font-semibold">WAKTU</th>
                <th className="px-5 py-3 font-semibold">TOTAL</th>
                <th className="px-5 py-3 font-semibold">PEMBAYARAN</th>
                <th className="px-5 py-3 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
              {stats?.transaksi_terakhir?.length ? stats.transaksi_terakhir.map((order) => (
                <tr key={order.order_id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{order.order_number}</td>
                  <td className="px-5 py-3.5">{order.cashier?.full_name || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDashboardTimestamp(order.created_at)}</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-5 py-3.5 font-medium text-indigo-600">{order.payment_method?.toUpperCase()}</td>
                  <td className="px-5 py-3.5">{order.status}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="py-6 text-center text-slate-400">Belum ada transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
          Maksimal 100 transaksi terbaru ditampilkan.
        </p>
      </div>

    </div>
  );
};

export default Dashboard;