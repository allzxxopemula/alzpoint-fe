import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { getActivityLogs } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';

const formatTimestamp = (value) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

const getActionClass = (action) => {
  if (action.startsWith('Hapus')) return 'bg-rose-50 text-rose-700';
  if (action.startsWith('Edit')) return 'bg-amber-50 text-amber-700';
  return 'bg-emerald-50 text-emerald-700';
};

export default function RiwayatAktivitas() {
  const pageRef = usePageEntrance();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getActivityLogs({ signal: controller.signal })
      .then((response) => {
        if (active) setLogs(response.data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Riwayat aktivitas gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const actionOptions = [...new Set(logs.map((log) => log.action))].sort();
  const query = searchQuery.trim().toLowerCase();
  
  // Filter data sesuai kriteria pencarian dan aksi
  const filteredLogs = logs.filter((log) => {
    const userName = log.user?.full_name || log.user?.username || 'Pengguna dihapus';
    const matchesAction = actionFilter === 'Semua' || log.action === actionFilter;
    const matchesSearch = !query || `${userName} ${log.action} ${log.description}`.toLowerCase().includes(query);
    return matchesAction && matchesSearch;
  });

  // Batasi hanya 100 data terbaru
  const displayedLogs = filteredLogs.slice(0, 100);

  return (
    <div ref={pageRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}

      {/* HEADER & FILTER */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Riwayat Aktivitas Master Data</h1>
          <p className="mt-1 text-xs text-slate-400">Aktivitas perubahan produk dan kategori usaha.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Cari aktivitas</span>
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              id="activity-search"
              name="activity_search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari user atau deskripsi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none sm:w-64"
            />
          </label>
          <label>
            <span className="sr-only">Filter aksi</span>
            <select
              id="activity-action-filter"
              name="action_filter"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none sm:w-44"
            >
              <option value="Semua">Semua aksi</option>
              {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* CONTAINER TABEL DENGAN OVERFLOW-Y AUTO */}
      <div className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-xs text-slate-500 font-medium">
          {loading ? 'Memuat riwayat...' : `Menampilkan ${displayedLogs.length} dari ${filteredLogs.length} aktivitas`}
        </div>

        {/* BATCH AREA SCROLL DALAM CONTAINER */}
        <div className="app-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[48rem] text-left text-xs relative">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="px-5 py-3">Waktu</th>
                <th className="px-5 py-3">Nama User</th>
                <th className="px-5 py-3">Aksi</th>
                <th className="px-5 py-3">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {!loading && displayedLogs.map((log) => (
                <tr key={log.id} className="align-top hover:bg-slate-50/70 transition-colors">
                  <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatTimestamp(log.created_at)}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{log.user?.full_name || log.user?.username || 'Pengguna dihapus'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold ${getActionClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="max-w-xl whitespace-normal px-5 py-4 leading-relaxed">{log.description}</td>
                </tr>
              ))}
              {!loading && displayedLogs.length === 0 && (
                <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-400">Tidak ada aktivitas yang cocok.</td></tr>
              )}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
            Maksimal 100 riwayat aktivitas terbaru ditampilkan.
          </p>
        </div>
      </div>
    </div>
  );
}