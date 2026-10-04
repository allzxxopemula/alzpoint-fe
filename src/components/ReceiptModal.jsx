import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faXmark } from '@fortawesome/free-solid-svg-icons';
import QRCode from 'react-qr-code';
import { buildReceiptQrText, formatReceiptCurrency, formatReceiptTimestamp } from '../utils/receiptUtils';

export default function ReceiptModal({ transactionData, onClose }) {
  const [paperWidth, setPaperWidth] = useState(
    transactionData.paperWidth === '58mm' ? '58mm' : '80mm',
  );
  const printedAtRef = useRef(null);

  useEffect(() => {
    const updatePrintedAt = () => {
      if (printedAtRef.current) {
        printedAtRef.current.textContent = formatReceiptTimestamp(new Date());
      }
    };

    window.addEventListener('beforeprint', updatePrintedAt);
    return () => window.removeEventListener('beforeprint', updatePrintedAt);
  }, []);

  const store = transactionData.store || {};
  const items = Array.isArray(transactionData.items) ? transactionData.items : [];
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
    return {
      name: item.name || item.product_name || item.product?.product_name || 'Produk',
      quantity,
      unitPrice,
      subtotal: Number(item.subtotal ?? unitPrice * quantity),
    };
  });
  const orderNumber = transactionData.orderNumber || transactionData.order_number || '-';
  const paymentMethod = String(transactionData.paymentMethod || transactionData.payment_method || 'tunai').toLowerCase();
  const subtotal = Number(
    transactionData.subtotal
      ?? normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
  );
  const discount = Number(transactionData.discount ?? transactionData.discount_amount ?? 0);
  const total = Number(transactionData.grandTotal ?? transactionData.total ?? transactionData.total_amount ?? subtotal - discount);
  const cashReceived = Number(transactionData.cashReceived ?? transactionData.cash_received ?? total);
  const change = Number(transactionData.change ?? transactionData.change_amount ?? Math.max(0, cashReceived - total));
  const totalQuantity = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const cashier = transactionData.cashier?.full_name
    || transactionData.cashier?.name
    || transactionData.cashierName
    || (transactionData.status === 'pending' ? 'Menunggu konfirmasi kasir' : 'Kasir');
  const customer = transactionData.customerName || transactionData.customer_name || '-';
  const qrText = buildReceiptQrText({
    ...transactionData,
    orderNumber,
    cashierName: cashier,
    customerName: customer,
    paymentMethod,
    items: normalizedItems,
    subtotal,
    discount,
    grandTotal: total,
    cashReceived,
    change,
  });
  const paymentLabels = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex h-screen w-screen items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <style>{`
        @page { size: ${paperWidth} auto; margin: 0; }
        #receipt-print-area { background-color: #fff !important; color: #000 !important; }
        #receipt-print-area * { color: #000 !important; }
        @media print {
          html, body { width: ${paperWidth} !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
          #receipt-print-area {
            position: fixed !important;
            inset: 0 auto auto 0 !important;
            width: calc(${paperWidth} - 4mm) !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 2mm !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            font: 9pt/1.35 'Courier New', Courier, monospace !important;
          }
          #receipt-print-area * { color: #000 !important; box-shadow: none !important; text-shadow: none !important; }
          .receipt-scroll-area { max-height: none !important; overflow: visible !important; }
          .receipt-hide-print { display: none !important; }
          .receipt-rule { border-color: #000 !important; }
        }
      `}</style>

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-modal-title"
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <header className="receipt-hide-print flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id="receipt-modal-title" className="text-sm font-bold text-slate-900">Pratinjau struk</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau struk"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <div className="receipt-hide-print flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1" aria-label="Ukuran kertas struk">
            {['58mm', '80mm'].map((width) => (
              <button
                key={width}
                type="button"
                aria-pressed={paperWidth === width}
                onClick={() => setPaperWidth(width)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${paperWidth === width ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
              >
                {width}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <FontAwesomeIcon icon={faPrint} /> Cetak Struk
          </button>
        </div>

        <div className="receipt-scroll-area overflow-y-auto bg-slate-100 p-4">
          <article
            id="receipt-print-area"
            className="mx-auto w-full max-w-[72mm] bg-white p-4 font-mono text-[11px] leading-snug text-black"
          >
            <header className="pb-3 text-center">
              <h3 className="text-sm font-extrabold uppercase">
                {store.cooperative_name || store.name || transactionData.storeName || 'Koperasi Sekolah'}
              </h3>
              {(store.address || transactionData.storeAddress) && (
                <p className="mt-1 break-words">{store.address || transactionData.storeAddress}</p>
              )}
              {(store.phone || transactionData.storePhone) && (
                <p>Tel/WA: {store.phone || transactionData.storePhone}</p>
              )}
              <p className="mt-1 font-bold">Kasir: {cashier}</p>
            </header>

            <div className="receipt-rule border-t border-dashed border-black py-2">
              <div className="flex justify-between gap-2"><span>No. Struk</span><strong className="break-all text-right">{orderNumber}</strong></div>
              <div className="mt-1 flex justify-between gap-2"><span>Waktu transaksi</span><span className="text-right">{formatReceiptTimestamp(transactionData.createdAt || transactionData.created_at)}</span></div>
              <div className="flex justify-between gap-2"><span>Waktu cetak</span><span ref={printedAtRef} className="text-right">{formatReceiptTimestamp(new Date())}</span></div>
              <div className="flex justify-between gap-2"><span>Pelanggan</span><span className="text-right">{customer}</span></div>
            </div>

            <div className="receipt-rule border-t border-dashed border-black py-2">
              {normalizedItems.map((item, index) => (
                <div key={`${item.name}-${index}`} className="mb-2 last:mb-0">
                  <p className="break-words font-bold">{item.name}</p>
                  <div className="flex justify-between gap-2">
                    <span>{item.quantity} x {formatReceiptCurrency(item.unitPrice)}</span>
                    <span className="shrink-0 text-right">{formatReceiptCurrency(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-rule border-t border-dashed border-black py-2">
              <div className="flex justify-between"><span>Total item</span><span>{totalQuantity}</span></div>
              <div className="flex justify-between"><span>Subtotal</span><span>{formatReceiptCurrency(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between"><span>Diskon</span><span>-{formatReceiptCurrency(discount)}</span></div>}
              <div className="mt-2 flex justify-center">
                <QRCode value={qrText} size={paperWidth === '58mm' ? 88 : 104} level="M" />
              </div>
              <p className="mt-1 text-center text-[8px]">Pindai QR untuk melihat bukti belanja</p>
            </div>

            <div className="receipt-rule border-t border-dashed border-black py-2">
              <div className="flex justify-between"><span>Pembayaran</span><span>{paymentLabels[paymentMethod] || paymentMethod}</span></div>
              {paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between"><span>Uang diterima</span><span>{formatReceiptCurrency(cashReceived)}</span></div>
                  <div className="flex justify-between font-bold"><span>Kembalian</span><span>{formatReceiptCurrency(change)}</span></div>
                </>
              )}
            </div>

            <footer className="receipt-rule border-t border-dashed border-black pt-3 text-center">
              <p className="font-bold">{store.receipt_footer || 'Terima kasih telah berbelanja!'}</p>
              <p className="mt-1 text-[9px]">Barang yang sudah dibeli tidak dapat ditukar kembali</p>
            </footer>
          </article>
        </div>

        <footer className="receipt-hide-print flex shrink-0 justify-end border-t border-slate-200 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Tutup
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}