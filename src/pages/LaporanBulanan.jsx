import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faChartColumn, faReceipt, faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import { getMonthlyRevenueReport } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const formatCurrency = (amount) => `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
const jakartaYear = Number(new Intl.DateTimeFormat('en', {
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
}).format(new Date()));

export default function LaporanBulanan() {
  const pageRef = usePageEntrance();
  const [year, setYear] = useState(jakartaYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let refreshTimer;

    const loadReport = async () => {
      if (!active || requestInFlight || document.visibilityState === 'hidden') return;
      requestInFlight = true;

      try {
        const response = await getMonthlyRevenueReport(year);
        if (active) {
          setReport(response.data.data);
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Laporan bulanan belum dapat dimuat.');
      } finally {
        requestInFlight = false;
        if (active) {
          setLoading(false);
          refreshTimer = window.setTimeout(loadReport, 30000);
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
  }, [year]);

  const months = report?.months || [];
  const bestMonth = report?.best_month;
  const chartData = {
    labels: months.map((month) => month.label),
    datasets: [{
      label: 'Pendapatan',
      data: months.map((month) => month.revenue),
      backgroundColor: '#0f766e',
      hoverBackgroundColor: '#115e59',
      borderRadius: 6,
      maxBarThickness: 42,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => formatCurrency(context.parsed.y) } },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: '#eef2f7' },
        border: { display: false },
        ticks: { callback: (value) => `${Number(value) / 1000000} jt` },
      },
    },
  };

  return (
    <div ref={pageRef} className="min-h-screen space-y-6 bg-slate-50 text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}

      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Analisis tahunan</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Pendapatan Bulanan</h1>
          <p className="mt-1 text-xs text-slate-500">Rekap transaksi terkonfirmasi per bulan.</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <FontAwesomeIcon icon={faCalendarDays} className="text-teal-700" />
          Tahun
          <select
            id="monthly-report-year"
            name="year"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-600"
          >
            {(report?.available_years || [jakartaYear]).map((availableYear) => (
              <option key={availableYear} value={availableYear}>{availableYear}</option>
            ))}
          </select>
        </label>
      </header>

      {loading && !report && <p className="text-xs text-slate-500">Memuat laporan bulanan...</p>}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan tahunan">
        <article className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total pendapatan</p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{report ? formatCurrency(report.total_revenue) : '—'}</p>
            <p className="mt-2 text-xs text-slate-500">Tahun {report?.year || year}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </span>
        </article>

        <article className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Transaksi terkonfirmasi</p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{report?.transaction_count?.toLocaleString('id-ID') ?? '—'}</p>
            <p className="mt-2 text-xs text-slate-500">Akumulasi per bulan</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FontAwesomeIcon icon={faReceipt} />
          </span>
        </article>

        <article className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rata-rata transaksi</p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{report ? formatCurrency(report.average_transaction) : '—'}</p>
            <p className="mt-2 text-xs text-slate-500">Nilai per transaksi</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <FontAwesomeIcon icon={faChartColumn} />
          </span>
        </article>

        <article className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bulan tertinggi</p>
            <p className="mt-2 text-xl font-extrabold text-slate-900">{bestMonth?.label || 'Belum ada data'}</p>
            <p className="mt-2 text-xs text-slate-500">{formatCurrency(bestMonth?.revenue || 0)}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </span>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="font-bold text-slate-900">Tren pendapatan</h2>
          <p className="mt-1 text-xs text-slate-500">Total pendapatan tiap bulan pada tahun {report?.year || year}.</p>
        </div>
        <div className="h-72">
          {months.length > 0 && <Bar data={chartData} options={chartOptions} />}
        </div>
      </section>

      <section className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-900">Rincian per bulan</h2>
          <p className="mt-1 text-xs text-slate-500">Pendapatan dihitung dari transaksi yang sudah dikonfirmasi.</p>
        </div>
        <div className="app-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Bulan</th>
                <th className="px-5 py-3 text-right font-semibold">Transaksi</th>
                <th className="px-5 py-3 text-right font-semibold">Rata-rata</th>
                <th className="px-5 py-3 text-right font-semibold">Pendapatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {months.map((month) => (
                <tr key={month.month} className="text-slate-700 transition hover:bg-slate-50">
                  <th scope="row" className="px-5 py-3.5 font-semibold text-slate-900">{month.label}</th>
                  <td className="px-5 py-3.5 text-right tabular-nums">{month.transactions.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {formatCurrency(month.transactions ? month.revenue / month.transactions : 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold tabular-nums text-slate-900">{formatCurrency(month.revenue)}</td>
                </tr>
              ))}
              {!loading && months.length === 0 && (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-xs text-slate-500">Belum ada data pendapatan untuk tahun ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}