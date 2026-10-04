import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getCustomers } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import {
  faSearch,
  faUsers,
  faReceipt,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';

const Pelanggan = () => {
  const pageRef = usePageEntrance();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({ total_customers: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState(null);

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      try {
        const response = await getCustomers();
        if (active) {
          setCustomers(response.data.data.customers);
          setSummary(response.data.data);
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Data pelanggan belum dapat dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCustomers();
    return () => {
      active = false;
    };
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredCustomers = customers.filter((customer) =>
    customer.full_name.toLowerCase().includes(query)
    || (customer.username || '').toLowerCase().includes(query)
    || customer.orders.some((order) => order.order_number.toLowerCase().includes(query))
  ).slice(0, 100);
  const selectedCustomer = customers.find((customer) => customer.customer_key === selectedCustomerKey);

  return (
    <div ref={pageRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {loading && <p className="text-xs text-slate-500">Memuat data pelanggan...</p>}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Pelanggan</h1>
          <p className="text-xs text-slate-400">Riwayat dipisahkan berdasarkan akun dan nama pada transaksi.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            id="customer-search"
            name="customer_search"
            type="text"
            placeholder="Cari nama / no. transaksi..."
            aria-label="Cari nama pelanggan atau nomor transaksi"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Nama Pelanggan</p>
            <h3 className="text-lg font-extrabold text-slate-900">{summary.total_customers} Orang</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FontAwesomeIcon icon={faMoneyBillWave} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Akumulasi Belanja</p>
            <h3 className="text-lg font-extrabold text-slate-900">Rp {Number(summary.total_spent).toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="app-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[48rem] text-left border-collapse">
            <thead>
              <tr className="sticky top-0 z-10 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-5 py-3 text-left align-middle font-semibold">Nama Pelanggan</th>
                <th className="px-5 py-3 text-left align-middle font-semibold">Transaksi Terkonfirmasi</th>
                <th className="px-5 py-3 text-left align-middle font-semibold">Transaksi Terakhir</th>
                <th className="px-5 py-3 text-left align-middle font-semibold">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.customer_key} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {customer.full_name.charAt(0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerKey((current) => current === customer.customer_key ? null : customer.customer_key)}
                        className="text-left hover:text-indigo-600"
                      >
                        <span className="block">{customer.full_name}</span>
                        <span className="block text-[10px] font-medium text-slate-400">
                          {customer.user_id ? customer.username : 'Pelanggan walk-in'}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-800">
                    <span className="bg-slate-100 px-2 py-1 rounded-md">
                      <FontAwesomeIcon icon={faReceipt} className="mr-1 text-slate-400" />
                      {customer.total_transactions}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {customer.last_transaction_at ? new Date(customer.last_transaction_at).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-5 py-4 font-extrabold text-indigo-600">Rp {Number(customer.total_spent).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              {!loading && filteredCustomers.length === 0 && (
                <tr><td colSpan="4" className="py-6 text-center text-slate-400">Pelanggan tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
            Maksimal 100 pelanggan terbaru ditampilkan.
          </p>
        </div>
      </div>

      {selectedCustomer && (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center gap-4 mb-4">
            <div>
              <h2 className="font-bold text-slate-900">Riwayat {selectedCustomer.full_name}</h2>
              <p className="text-xs text-slate-400">
                {selectedCustomer.user_id ? (selectedCustomer.username || 'Akun pelanggan') : 'Pelanggan walk-in'}
              </p>
            </div>
            <button type="button" onClick={() => setSelectedCustomerKey(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              Tutup
            </button>
          </div>
          {selectedCustomer.orders.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">Belum ada riwayat transaksi.</p>
          ) : (
            <div className="app-scrollbar max-h-72 overflow-auto overscroll-contain">
              <table className="w-full min-w-[56rem] text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 z-10 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3">No. Pesanan / Waktu</th>
                    <th className="pb-3">Item</th>
                    <th className="pb-3">Pembayaran</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-100">
                  {selectedCustomer.orders.map((order) => (
                    <tr key={order.order_id}>
                      <td className="py-3">
                        <span className="block font-bold text-slate-900">{order.order_number}</span>
                        <span className="block text-slate-400">Nama: {order.customer_name || selectedCustomer.full_name}</span>
                        <span className="text-slate-400">{new Date(order.created_at).toLocaleString('id-ID')}</span>
                      </td>
                      <td className="py-3 text-slate-600">{order.items.map((item) => `${item.product_name} x${item.quantity}`).join(', ')}</td>
                      <td className="py-3 text-slate-600">{order.payment_method.toUpperCase()}</td>
                      <td className="py-3 capitalize text-slate-600">{order.status}</td>
                      <td className="py-3 text-right font-bold text-slate-900">Rp {Number(order.total_amount).toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
                Maksimal 100 transaksi terbaru ditampilkan.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default Pelanggan;
