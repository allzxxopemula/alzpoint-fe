import { useEffect, useState } from 'react';
import countUpModule from 'react-countup';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getSalesReport } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import { 
  faDownload, 
  faMoneyBillWave, 
  faArrowTrendUp, 
  faShoppingBag, 
  faBoxOpen,
  faChartLine,
  faCrown
} from '@fortawesome/free-solid-svg-icons';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);
const CountUp = countUpModule.default || countUpModule;
const formatCurrency = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;

const Laporan = () => {
  const reportRef = usePageEntrance();
  const [period, setPeriod] = useState('30 Hari');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const periodKey = { 'Hari Ini': 'today', '7 Hari': 'week', '30 Hari': 'month' }[period];

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let refreshTimer;
    const loadReport = async () => {
      if (!active || requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;

      try {
        const response = await getSalesReport(periodKey);
        if (active) {
          setReport(response.data.data);
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Laporan belum dapat dimuat.');
      } finally {
        requestInFlight = false;
        if (active) {
          setLoading(false);
          refreshTimer = window.setTimeout(loadReport, 10000);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return;
      window.clearTimeout(refreshTimer);
      loadReport();
    };

    loadReport();
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [periodKey]);

  const revenueChart = {
    labels: report?.chart?.map((bar) => bar.label) || [],
    datasets: [{
      label: 'Pendapatan',
      data: report?.chart?.map((bar) => bar.revenue) || [],
      backgroundColor: '#0f766e',
      hoverBackgroundColor: '#115e59',
      borderRadius: 8,
      maxBarThickness: 54,
    }],
  };
  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { autoSkip: true, maxTicksLimit: periodKey === 'today' ? 8 : periodKey === 'week' ? 7 : 10 },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#eef2f7' },
        border: { display: false },
        ticks: { callback: (value) => `${Number(value) / 1000} rb` },
      },
    },
  };

  return (
    <div ref={reportRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {loading && !report && <p className="text-xs text-slate-500">Memuat laporan...</p>}
      {/* HEADER & FILTER PERIODE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Laporan Penjualan</h1>
          <p className="text-xs text-slate-400">Analisis performa keuangan, omset, dan statistik produk terlaris</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* TAB PERIODE */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['Hari Ini', '7 Hari', '30 Hari'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === p 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* TOMBOL EKSPOR / DOWNLOAD */}
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* RINGKASAN METRIK KEUANGAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OMOSET / TOTAL PENDAPATAN */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Omset</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {report
                  ? <CountUp end={Number(report.total_revenue)} duration={2.4} formattingFn={formatCurrency} />
                  : <span aria-label="Memuat omset" className="inline-block h-6 w-28 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </div>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-3 flex items-center gap-1">
            <FontAwesomeIcon icon={faArrowTrendUp} /> {report ? <CountUp end={Number(report.transaction_count)} duration={2.1} separator="." /> : '...'} <span className="text-slate-400 font-normal">transaksi terkonfirmasi</span>
          </p>
        </div>

        {/* LABA BERSIH (ESTIMASI) */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rata-rata Transaksi</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {report
                  ? <CountUp end={Number(report.average_transaction)} duration={2.4} formattingFn={formatCurrency} />
                  : <span aria-label="Memuat rata-rata" className="inline-block h-6 w-28 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Nilai rata-rata per pesanan terkonfirmasi</p>
        </div>

        {/* TOTAL TRANSAKSI */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transaksi</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {report ? <><CountUp end={Number(report.transaction_count)} duration={2.1} separator="." /> Transaksi</> : <span aria-label="Memuat transaksi" className="inline-block h-6 w-28 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faShoppingBag} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Rata-rata: <span className="font-bold text-slate-700">{report ? <CountUp end={Number(report.average_per_day)} duration={2.1} decimals={1} /> : '...'} /hari</span></p>
        </div>

        {/* ITEM TERJUAL */}
        <div data-gsap-reveal className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Item Terjual</p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                {report ? <><CountUp end={Number(report.items_sold)} duration={2.1} separator="." /> Pcs</> : <span aria-label="Memuat item" className="inline-block h-6 w-24 rounded bg-slate-100 animate-pulse" />}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm">
              <FontAwesomeIcon icon={faBoxOpen} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Kategori terlaris: <span className="font-bold text-slate-700">{report?.top_category || '-'}</span></p>
        </div>
      </div>

      {/* SECTION BARS / GRAFIK & PRODUK TERLARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAFIK PENDAPATAN */}
        <div data-gsap-reveal className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-base">Grafik Pendapatan</h3>
            <span className="text-xs text-slate-400 font-medium">Periode: {period}</span>
          </div>

          <div className="h-64">
            {report?.transaction_count > 0
              ? <Bar data={revenueChart} options={revenueChartOptions} />
              : <div className="h-full flex items-center justify-center text-xs text-slate-400">Belum ada transaksi terkonfirmasi.</div>}
          </div>
        </div>

        {/* PRODUK TERLARIS (TOP SELLING) */}
        <div data-gsap-reveal className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FontAwesomeIcon icon={faCrown} className="text-amber-500 text-sm" />
                <span>Produk Terlaris</span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {report?.top_products?.map((prod) => (
                <div key={prod.product_id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">{prod.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{prod.category} · {prod.sold} pcs terjual</p>
                  </div>
                  <span className="font-extrabold text-indigo-600">
                    {formatCurrency(prod.total)}
                  </span>
                </div>
              ))}
              {!loading && report?.top_products?.length === 0 && <p className="py-4 text-xs text-slate-400">Belum ada produk terjual.</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button className="w-full text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
              Lihat Detail Laporan Produk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laporan;