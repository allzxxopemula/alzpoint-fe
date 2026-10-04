const RECEIPT_TIME_ZONE = 'Asia/Jakarta';

export function formatReceiptCurrency(value) {
  const amount = Number(value);
  return `Rp ${(Number.isFinite(amount) ? amount : 0).toLocaleString('id-ID')}`;
}

export function formatReceiptTimestamp(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '-';

  const dateText = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: RECEIPT_TIME_ZONE,
  }).format(date);
  const timeText = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZone: RECEIPT_TIME_ZONE,
  }).format(date);

  return `${dateText} - ${timeText} WIB`;
}

export function buildReceiptQrText(transaction) {
  const items = Array.isArray(transaction.items) ? transaction.items : [];
  const itemLines = items.map((item) => {
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const price = Number(item.unitPrice ?? item.price ?? 0);
    const subtotal = Number(item.subtotal ?? quantity * price);
    return `${item.name || item.product_name || 'Produk'}: ${quantity} x ${formatReceiptCurrency(price)} = ${formatReceiptCurrency(subtotal)}`;
  });

  const paymentMethod = String(transaction.paymentMethod || transaction.payment_method || 'tunai').toLowerCase();
  const paymentLabels = { tunai: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
  const total = Number(transaction.grandTotal ?? transaction.total ?? transaction.total_amount ?? 0);
  const cashReceived = Number(transaction.cashReceived ?? transaction.cash_received ?? total);
  const change = Number(transaction.change ?? transaction.change_amount ?? Math.max(0, cashReceived - total));
  const lines = [
    'BUKTI BELANJA KOPSIS',
    `No: ${transaction.orderNumber || transaction.order_number || '-'}`,
    `Waktu: ${formatReceiptTimestamp(transaction.createdAt || transaction.created_at)}`,
    `Pelanggan: ${transaction.customerName || transaction.customer_name || '-'}`,
    `Kasir: ${transaction.cashierName || transaction.cashier?.full_name || 'Kasir'}`,
    'Rincian:',
    ...itemLines,
    `Total item: ${items.reduce((sum, item) => sum + Number(item.quantity ?? item.qty ?? 0), 0)}`,
    `Subtotal: ${formatReceiptCurrency(transaction.subtotal ?? total)}`,
    `Diskon: ${formatReceiptCurrency(transaction.discount || 0)}`,
    `TOTAL: ${formatReceiptCurrency(total)}`,
    `Pembayaran: ${paymentLabels[paymentMethod] || paymentMethod}`,
  ];

  if (paymentMethod === 'tunai') {
    lines.push(`Uang diterima: ${formatReceiptCurrency(cashReceived)}`);
    lines.push(`Kembalian: ${formatReceiptCurrency(change)}`);
  }

  lines.push('Terima kasih telah berbelanja!');
  return lines.join('\n');
}