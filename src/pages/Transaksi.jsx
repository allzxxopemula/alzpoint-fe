import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getOrders, updateOrderStatus } from '../api/kopsis';
import useCooperativeSettings from '../hooks/useCooperativeSettings';
import usePageEntrance from '../hooks/usePageEntrance';
import ReceiptHeader, { ReceiptFooter } from '../components/ReceiptBranding';
import ReceiptModal from '../components/ReceiptModal';
import { 
  faSearch, 
  faCheckCircle, 
  faXmarkCircle, 
  faClock, 
  faEye, 
  faReceipt,
  faPrint
} from '@fortawesome/free-solid-svg-icons';

const formatOrder = (order) => ({
  orderId: order.order_id,
  id: order.order_number,
  customer: order.customer_name || order.customer?.full_name || (order.customer_id ? 'Pelanggan' : 'Umum'),
  cashier: order.cashier?.full_name || 'Menunggu konfirmasi',
  createdAt: order.created_at,
  rawStatus: order.status,
  paymentMethodValue: order.payment_method,
  date: new Date(order.created_at).toLocaleString('id-ID'),
  total: Number(order.total_amount),
  discount: Number(order.discount_amount ?? 0),
  subtotal: (order.items || []).reduce((sum, item) => sum + Number(item.subtotal ?? Number(item.price) * Number(item.quantity)), 0),
  cashReceived: Number(order.cash_received ?? order.total_amount),
  change: Number(order.change_amount ?? 0),
  paymentMethod: { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' }[order.payment_method],
  status: { pending: 'Pending', confirmed: 'Completed', completed: 'Completed', canceled: 'Canceled' }[order.status],
  items: (order.items || []).map((item) => ({
    name: item.product_name || item.product?.product_name || 'Produk dihapus',
    qty: item.quantity,
    price: Number(item.price),
    subtotal: Number(item.subtotal ?? Number(item.price) * Number(item.quantity)),
  })),
});

const Transaksi = () => {
  const pageRef = usePageEntrance();
  const cooperativeSettings = useCooperativeSettings();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrx, setSelectedTrx] = useState(null);
  const [receiptTransaction, setReceiptTransaction] = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [confirmNonCashOrder, setConfirmNonCashOrder] = useState(null);
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let refreshTimeout;
    let requestController;
    const loadOrders = async () => {
      if (!active || document.visibilityState === 'hidden' || requestInFlight) return;
      requestInFlight = true;
      requestController = new AbortController();
      try {
        const status = filterStatus === 'Semua' ? undefined : filterStatus.toLowerCase();
        const response = await getOrders(status ? { status } : undefined, { signal: requestController.signal });
        if (active) {
          setTransactions(response.data.data.map(formatOrder));
          setErrorMessage('');
        }
      } catch (error) {
        if (active && !requestController.signal.aborted) {
          setErrorMessage(error.response?.data?.message || 'Antrean transaksi belum dapat dimuat.');
        }
      } finally {
        requestInFlight = false;
        if (active) setLoading(false);
        if (active && document.visibilityState === 'visible') {
          refreshTimeout = window.setTimeout(loadOrders, 30000);
        }
      }
    };

    const refreshWhenAvailable = () => {
      window.clearTimeout(refreshTimeout);
      if (document.visibilityState === 'visible') {
        refreshTimeout = window.setTimeout(loadOrders, 150);
      } else {
        requestController?.abort();
      }
    };

    loadOrders();
    window.addEventListener('focus', refreshWhenAvailable);
    document.addEventListener('visibilitychange', refreshWhenAvailable);
    return () => {
      active = false;
      window.clearTimeout(refreshTimeout);
      window.removeEventListener('focus', refreshWhenAvailable);
      document.removeEventListener('visibilitychange', refreshWhenAvailable);
      requestController?.abort();
    };
  }, [filterStatus]);

  const handleUpdateStatus = async (orderId, newStatus, payload = {}) => {
    setErrorMessage('');
    try {
      const response = await updateOrderStatus(orderId, newStatus, payload);
      const updatedOrder = formatOrder(response.data.data);
      const shouldDisplay = filterStatus === 'Semua' || updatedOrder.status === filterStatus;
      setTransactions((current) => {
        const remaining = current.filter((transaction) => transaction.orderId !== orderId);
        return (shouldDisplay ? [updatedOrder, ...remaining] : remaining)
          .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
          .slice(0, 100);
      });
      setSelectedTrx((current) => current?.orderId === orderId ? updatedOrder : current);
      return updatedOrder;
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Status transaksi gagal diperbarui.');
      return null;
    }
  };

  const startOrderConfirmation = async (transaction) => {
    setConfirmError('');
    if (transaction.paymentMethodValue === 'tunai') {
      setConfirmOrder(transaction);
      setCashReceivedInput('');
      return;
    }

    setConfirmNonCashOrder(transaction);
  };

  const handleNonCashConfirmation = async () => {
    if (!confirmNonCashOrder) return;

    setConfirmSaving(true);
    const completedOrder = await handleUpdateStatus(confirmNonCashOrder.orderId, 'completed', {
      cash_received: confirmNonCashOrder.total,
    });
    setConfirmSaving(false);
    if (completedOrder) {
      setConfirmNonCashOrder(null);
      setSelectedTrx(null);
      setReceiptTransaction(completedOrder);
    }
  };

  const handleCashConfirmation = async (event) => {
    event.preventDefault();
    if (!confirmOrder) return;

    const amount = Number(cashReceivedInput);
    if (amount < confirmOrder.total) {
      setConfirmError('Uang diterima belum mencukupi total pembayaran.');
      return;
    }

    setConfirmSaving(true);
    setConfirmError('');
    const completedOrder = await handleUpdateStatus(confirmOrder.orderId, 'completed', {
      cash_received: amount,
    });
    setConfirmSaving(false);
    if (completedOrder) {
      setConfirmOrder(null);
      setSelectedTrx(null);
      setReceiptTransaction(completedOrder);
    }
  };

  // Filter Transaksi
  const filteredTransactions = transactions.filter((trx) => {
    const matchesStatus = filterStatus === 'Semua' || trx.status === filterStatus;
    const matchesSearch = 
      trx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trx.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return (
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max">
            <FontAwesomeIcon icon={faCheckCircle} /> Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max">
            <FontAwesomeIcon icon={faClock} /> Pending
          </span>
        );
      case 'Canceled':
        return (
          <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 w-max">
            <FontAwesomeIcon icon={faXmarkCircle} /> Canceled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={pageRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {loading && <p className="text-xs text-slate-500">Memuat antrean transaksi...</p>}
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Daftar Transaksi</h1>
          <p className="mt-1 text-xs text-slate-400">Kelola dan konfirmasi pesanan masuk secara real-time</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* BAR PENCARIAN */}
          <div className="relative flex-1 sm:w-60">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              id="transaction-search"
              name="transaction_search"
              type="text"
              placeholder="Cari No. TRX / Pelanggan..."
              aria-label="Cari nomor transaksi atau pelanggan"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* FILTER STATUS */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['Semua', 'Pending', 'Completed', 'Canceled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-3 py-2 text-xs transition ${
                  filterStatus === status 
                    ? 'bg-white text-indigo-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABEL TRANSAKSI */}
      <div className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="app-scrollbar min-h-0 flex-1 overflow-auto overscroll-contain">
          <table className="w-full min-w-[56rem] border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-semibold">NO. TRANSAKSI</th>
                <th className="px-5 py-3 font-semibold">PELANGGAN</th>
                <th className="px-5 py-3 font-semibold">KASIR</th>
                <th className="px-5 py-3 font-semibold">WAKTU</th>
                <th className="px-5 py-3 font-semibold">TOTAL</th>
                <th className="px-5 py-3 font-semibold">METODE</th>
                <th className="px-5 py-3 font-semibold">STATUS</th>
                <th className="px-5 py-3 text-center font-semibold">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-5 py-4 font-bold text-slate-900">{trx.id}</td>
                  <td className="px-5 py-4 font-medium">{trx.customer}</td>
                  <td className="px-5 py-4 text-slate-500">{trx.cashier}</td>
                  <td className="px-5 py-4 text-slate-500">{trx.date}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-900">Rp {trx.total.toLocaleString('id-ID')}</td>
                  <td className="px-5 py-4 font-semibold text-indigo-600">{trx.paymentMethod}</td>
                  <td className="px-5 py-4">{getStatusBadge(trx.status)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* AKSI HANYA JIKA PENDING */}
                      {trx.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => startOrderConfirmation(trx)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(trx.orderId, 'canceled')}
                            className="bg-rose-500 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {(trx.status === 'Confirmed' || trx.status === 'Completed') && (
                        <button
                          type="button"
                          onClick={() => setReceiptTransaction(trx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-indigo-50 transition"
                          title="Cetak struk transaksi selesai"
                          aria-label={`Cetak struk ${trx.id}`}
                        >
                          <FontAwesomeIcon icon={faPrint} />
                        </button>
                      )}

                      {/* BUTTON LIHAT DETAIL */}
                      <button
                        onClick={() => setSelectedTrx(trx)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg hover:bg-indigo-50 transition"
                        title="Lihat Detail"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-3 text-center text-[10px] text-slate-400">
            Maksimal 100 transaksi terbaru ditampilkan.
          </p>
        </div>
      </div>

      {/* MODAL DETAIL TRANSAKSI / STRUK */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="text-indigo-600 text-lg" />
                <h3 className="text-base font-bold text-slate-900">Detail Transaksi</h3>
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <ReceiptHeader settings={cooperativeSettings} />

            {/* INFO TRANSAKSI */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">No. Transaksi</span>
                <span className="font-bold text-slate-900">{selectedTrx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pelanggan</span>
                <span className="font-semibold text-slate-800">{selectedTrx.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Penanggung Jawab</span>
                <span className="font-semibold text-slate-800">{selectedTrx.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                {getStatusBadge(selectedTrx.status)}
              </div>
            </div>

            {/* RINCIAN ITEM */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Item Dibeli</h4>
              <div className="app-scrollbar divide-y divide-slate-100 max-h-40 overflow-y-auto overscroll-y-contain pr-1">
                {selectedTrx.items.map((item, index) => (
                  <div key={index} className="py-2 flex justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.qty} x Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <span className="font-bold text-slate-900">Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TOTAL */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">Total Pembayaran</span>
              <span className="text-lg font-extrabold text-indigo-600">Rp {selectedTrx.total.toLocaleString('id-ID')}</span>
            </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Uang Dibayarkan</span>
                  <span className="font-semibold text-slate-800">Rp {selectedTrx.cashReceived.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Kembalian</span>
                  <span className="font-bold text-emerald-700">Rp {selectedTrx.change.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <ReceiptFooter settings={cooperativeSettings} />

            {/* TOMBOL AKSI MODAL */}
            <div className="flex gap-2 pt-2">
              {selectedTrx.status === 'Pending' && (
                <button
                  onClick={() => startOrderConfirmation(selectedTrx)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Confirm Orders
                </button>
              )}
              {(selectedTrx.status === 'Confirmed' || selectedTrx.status === 'Completed') && (
                <button
                  type="button"
                  onClick={() => setReceiptTransaction(selectedTrx)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  <FontAwesomeIcon icon={faPrint} /> Cetak Struk
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleCashConfirmation} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Pembayaran Tunai</h3>
              <p className="mt-1 text-xs text-slate-500">Pesanan {confirmOrder.id} · Total Rp {confirmOrder.total.toLocaleString('id-ID')}</p>
            </div>
            <div>
              <label htmlFor="cash-received-confirm" className="mb-1 block text-xs font-bold text-slate-600">Uang Diterima (Rp)</label>
              <input
                id="cash-received-confirm"
                name="cash_received_confirmation"
                type="number"
                min={confirmOrder.total}
                step="0.01"
                required
                autoFocus
                value={cashReceivedInput}
                onChange={(event) => setCashReceivedInput(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setCashReceivedInput(String(confirmOrder.total));
                  setConfirmError('');
                }}
                className="mt-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                Uang Pas
              </button>
              {Number(cashReceivedInput) > 0 && (
                <p className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Kembalian</span>
                  <strong className="text-emerald-700">Rp {Math.max(0, Number(cashReceivedInput) - confirmOrder.total).toLocaleString('id-ID')}</strong>
                </p>
              )}
            </div>
            {confirmError && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{confirmError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmOrder(null)}
                disabled={confirmSaving}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={confirmSaving || Number(cashReceivedInput) < confirmOrder.total}
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmSaving ? 'Menyimpan...' : 'Konfirmasi & Selesaikan'}
              </button>
            </div>
          </form>
        </div>
      )}
      {confirmNonCashOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="noncash-confirm-title" className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div>
              <h3 id="noncash-confirm-title" className="text-base font-bold text-slate-900">Konfirmasi Pembayaran</h3>
              <p className="mt-1 text-xs text-slate-500">Pastikan pembayaran {confirmNonCashOrder.paymentMethod} untuk pesanan {confirmNonCashOrder.id} sudah diterima.</p>
            </div>
            <div className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <span className="text-slate-500">Total pembayaran</span>
              <strong className="text-slate-900">Rp {confirmNonCashOrder.total.toLocaleString('id-ID')}</strong>
            </div>
            {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmNonCashOrder(null)}
                disabled={confirmSaving}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleNonCashConfirmation}
                disabled={confirmSaving}
                className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmSaving ? 'Menyimpan...' : 'Konfirmasi & Selesaikan'}
              </button>
            </div>
          </div>
        </div>
      )}
      {(receiptTransaction?.status === 'Confirmed' || receiptTransaction?.status === 'Completed') && (
        <ReceiptModal
          transactionData={{
            orderNumber: receiptTransaction.id,
            createdAt: receiptTransaction.createdAt,
            cashierName: receiptTransaction.cashier,
            customerName: receiptTransaction.customer,
            status: receiptTransaction.rawStatus,
            items: receiptTransaction.items.map((item) => ({
              name: item.name,
              quantity: item.qty,
              price: item.price,
              subtotal: item.subtotal,
            })),
            subtotal: receiptTransaction.subtotal,
            discount: receiptTransaction.discount,
            grandTotal: receiptTransaction.total,
            paymentMethod: receiptTransaction.paymentMethodValue,
            cashReceived: receiptTransaction.cashReceived,
            change: receiptTransaction.change,
            store: cooperativeSettings,
          }}
          onClose={() => setReceiptTransaction(null)}
        />
      )}
    </div>
  );
};

export default Transaksi;