import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createOrder, getCategories, getDiscounts, getProducts } from '../api/kopsis';
import useCooperativeSettings from '../hooks/useCooperativeSettings';
import usePageEntrance from '../hooks/usePageEntrance';
import ReceiptHeader, { ReceiptFooter } from '../components/ReceiptBranding';
import gsap from 'gsap';
import { areGsapAnimationsEnabled, isCashierImageHidden } from '../utils/gsapPreference';
import { 
  faSearch, 
  faTrash, 
  faPlus, 
  faMinus, 
  faCreditCard, 
  faMoneyBillWave, 
  faQrcode, 
  faCheckCircle,
  faUtensils,
  faGlassWater,
  faCookieBite,
  faBoxes
} from '@fortawesome/free-solid-svg-icons';

const Kasir = ({ currentUser, selfCheckout = false }) => {
  const pageRef = usePageEntrance();
  const cartBadgeRef = useRef(null);
  const gridRef = useRef(null);
  const checkoutBtnRef = useRef(null);
  const totalPriceRef = useRef(null);
  const cooperativeSettings = useCooperativeSettings();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState(selfCheckout ? '' : 'Pelanggan Umum');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  
  // Membaca status hide gambar khusus kasir
  const hideImages = isCashierImageHidden();

  const paymentOptions = [
    { name: 'Tunai', value: 'tunai', icon: faMoneyBillWave },
    { name: 'QRIS', value: 'qris', icon: faQrcode },
    { name: 'Transfer', value: 'transfer', icon: faCreditCard },
  ];
  
  const categoryFilters = [
    { name: 'Semua', icon: faBoxes },
    ...categories.map((category) => ({
      name: category.category_name,
      icon: {
        Makanan: faUtensils,
        Minuman: faGlassWater,
        Snack: faCookieBite,
      }[category.category_name] || faBoxes,
    })),
  ];

  useEffect(() => {
    let active = true;
    getCategories().then((response) => { if (active) setCategories(response.data.data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getDiscounts().then((response) => { if (active) setDiscountRules(response.data.data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const response = await getProducts({ available: true });
        if (active) {
          setProducts(response.data.data.map((product) => ({
            id: product.product_id,
            name: product.product_name,
            price: Number(product.price),
            stock: product.stock,
            category: product.category?.category_name || '',
            image: product.image_url,
          })));
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Produk belum dapat dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProducts();
    const interval = window.setInterval(loadProducts, 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // GSAP: Murni Fade In Cepat tanpa Gerakan (Sangat Responsif untuk Kasir)
  useEffect(() => {
    if (areGsapAnimationsEnabled() && gridRef.current && filteredProducts.length > 0) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0 },
        { opacity: 1, duration: 0.2, overwrite: 'auto' }
      );
    }
  }, [selectedCategory, searchQuery, loading]);

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return;
      setCart(cart.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // GSAP: Flying Ghost Animation
  const handleAddToCartWithAnimation = (e, product) => {
    addToCart(product);
    if (!areGsapAnimationsEnabled()) return;

    const card = e.currentTarget;
    const targetRect = cartBadgeRef.current?.getBoundingClientRect();

    if (!targetRect) return;

    const ghost = document.createElement('div');
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    
    // Jika gambar tersedia dan tidak di-hide
    const img = card.querySelector('img'); 
    if (img && !hideImages) {
      const imgRect = img.getBoundingClientRect();
      ghost.style.top = `${imgRect.top}px`;
      ghost.style.left = `${imgRect.left}px`;
      ghost.style.width = `${imgRect.width}px`;
      ghost.style.height = `${imgRect.height}px`;
      ghost.style.backgroundImage = `url(${product.image})`;
      ghost.style.backgroundSize = 'cover';
      ghost.style.backgroundPosition = 'center';
      ghost.style.borderRadius = '12px';
      ghost.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    } else {
      // Jika mode hide gambar: Gunakan efek bayangan melayang berbentuk Card
      const cardRect = card.getBoundingClientRect();
      ghost.style.top = `${cardRect.top}px`;
      ghost.style.left = `${cardRect.left}px`;
      ghost.style.width = `${cardRect.width}px`;
      ghost.style.height = `${cardRect.height}px`;
      
      // Setting efek bayangan menggunakan var(--theme-accent) dengan color-mix untuk transparansi
      ghost.style.backgroundColor = 'transparent';
      ghost.style.border = '2px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)'; 
      ghost.style.borderRadius = '16px'; 
      ghost.style.boxShadow = '0 15px 35px color-mix(in srgb, var(--theme-accent) 40%, transparent), inset 0 0 20px color-mix(in srgb, var(--theme-accent) 20%, transparent)'; 
    }

    document.body.appendChild(ghost);

    const startX = parseFloat(ghost.style.left);
    const startY = parseFloat(ghost.style.top);

    gsap.to(ghost, {
      x: targetRect.left - startX,
      y: targetRect.top - startY,
      scale: 0.1,
      opacity: 0,
      duration: 0.45,
      ease: 'power3.inOut',
      onComplete: () => {
        ghost.remove(); 
        gsap.fromTo(cartBadgeRef.current, 
          { scale: 1.3, backgroundColor: '#10B981', color: '#ffffff' }, 
          // Hapus set warna eksplisit agar bisa dikontrol kembali oleh class/CSS theme default saat selesai
          { scale: 1, duration: 0.25, ease: 'power2.out', clearProps: 'backgroundColor,color' }
        );
      }
    });
  };

  const updateQty = (id, delta) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 && newQty <= item.stock ? { ...item, qty: newQty } : item;
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const eligibleDiscount = discountRules
    .filter((rule) => Number(rule.min_spend) <= subtotal)
    .reduce((best, rule) => !best || Number(rule.min_spend) > Number(best.min_spend) ? rule : best, null);
  const discountAmount = Math.min(Number(eligibleDiscount?.discount_amount || 0), subtotal);
  const total = Math.max(0, subtotal - discountAmount);
  const change = Math.max(0, (parseInt(cashAmount) || 0) - total);

  // GSAP: Pulse Animasi Ringan pada Total Pembayaran
  useEffect(() => {
    if (areGsapAnimationsEnabled() && totalPriceRef.current && total > 0) {
      gsap.fromTo(totalPriceRef.current,
        { scale: 1.1, color: '#10B981' }, 
        { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto', clearProps: 'color' }
      );
    }
  }, [total]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      if (areGsapAnimationsEnabled()) {
        gsap.fromTo(checkoutBtnRef.current,
          { x: -5 },
          { x: 5, duration: 0.05, yoyo: true, repeat: 5, ease: 'none', onComplete: () => gsap.set(checkoutBtnRef.current, { clearProps: 'all' }) }
        );
      }
      return;
    }
    if (!customerName.trim()) {
      setCheckoutError('Nama pelanggan wajib diisi.');
      return;
    }
    if (!selfCheckout && paymentMethod === 'tunai' && (parseInt(cashAmount) || 0) < total) {
      if (areGsapAnimationsEnabled()) {
        gsap.fromTo(checkoutBtnRef.current,
          { x: -5 },
          { x: 5, duration: 0.05, yoyo: true, repeat: 5, ease: 'none', onComplete: () => gsap.set(checkoutBtnRef.current, { clearProps: 'all' }) }
        );
      }
      setCheckoutError('Nominal tunai belum mencukupi total pembelian.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const response = await createOrder({
        customer_name: customerName.trim(),
        customer_id: currentUser?.role === 'pelanggan' ? currentUser.user_id : null,
        payment_method: paymentMethod,
        ...(!selfCheckout && { cash_received: paymentMethod === 'tunai' ? Number(cashAmount) : total }),
        items: cart.map((item) => ({ product_id: item.id, quantity: item.qty, price: item.price })),
      });
      setCheckoutOrder(response.data.data);
      setOrderNumber(response.data.data.order_number);
      setIsSuccessModalOpen(true);
    } catch (error) {
      setCheckoutError(error.response?.data?.message || 'Pesanan gagal dikirim. Coba lagi.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const resetTransaction = () => {
    setCart([]);
    setCashAmount('');
    setCustomerName(selfCheckout ? '' : 'Pelanggan Umum');
    setOrderNumber('');
    setCheckoutOrder(null);
    setIsSuccessModalOpen(false);
  };

  return (
    <div ref={pageRef} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-6 min-h-[calc(100vh-5rem)] bg-slate-50 text-slate-800 items-start">
      {errorMessage && <p role="alert" className="fixed top-20 right-6 z-30 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      
      {/* KIRI: KATALOG PRODUK */}
      <div className="flex flex-col gap-5">
        
        {/* BAR PENCARIAN & HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selfCheckout ? 'Belanja Koperasi' : 'Kasir POS'}</h1>
            <p className="text-xs text-slate-400">{selfCheckout ? 'Pilih produk lalu kirim pesanan untuk dikonfirmasi kasir' : 'Pilih barang untuk dimasukkan ke keranjang'}</p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              id="product-search"
              name="product_search"
              type="text"
              placeholder="Cari barang ..."
              aria-label="Cari produk"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 transition"
            />
          </div>
        </div>

        {/* FILTER KATEGORI */}
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain app-scrollbar pb-2">
          {categoryFilters.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap active:scale-95 transition-all duration-150 ${
                selectedCategory === cat.name
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              <FontAwesomeIcon icon={cat.icon} />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* GRID PRODUK */}
        <div ref={gridRef} className="app-scrollbar grid max-h-[calc(100vh-16rem)] grid-cols-2 content-start gap-4 overflow-y-auto overscroll-y-contain pr-1 sm:grid-cols-3 xl:grid-cols-4">
          {loading && <p className="col-span-full py-8 text-center text-xs text-slate-500">Memuat produk...</p>}
          {!loading && filteredProducts.length === 0 && <p className="col-span-full py-8 text-center text-xs text-slate-500">Tidak ada produk tersedia.</p>}
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={(e) => handleAddToCartWithAnimation(e, product)}
              className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative active:scale-[0.98]"
            >
              {/* Gambar Tampil / Sembunyi Berdasarkan Konfigurasi */}
              {!hideImages ? (
                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-3 bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <span className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                    Stok: {product.stock}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">{product.category}</span>
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium">
                    Stok: {product.stock}
                  </span>
                </div>
              )}

              <div>
                {!hideImages && (
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">{product.category}</span>
                )}
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5">{product.name}</h3>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                <span className="text-sm font-extrabold text-slate-900">Rp {product.price.toLocaleString('id-ID')}</span>
                <button className="w-7 h-7 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white active:scale-90 rounded-lg flex items-center justify-center transition-all">
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KANAN: KERANJANG BELANJA */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex h-[calc(100vh-5rem)] min-h-0 flex-col self-start overflow-hidden lg:sticky lg:top-20">
        <div className="flex min-h-0 flex-1 flex-col">
          {/* HEADER KERANJANG */}
          <div className="flex shrink-0 justify-between items-center pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-base">Keranjang Belanja</h2>
            <span 
              ref={cartBadgeRef} 
              className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full origin-center transition-colors"
            >
              {cart.reduce((sum, item) => sum + item.qty, 0)} Item
            </span>
          </div>

          {/* ITEM LIST */}
          <div className="app-scrollbar min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-y-contain my-3 pr-1 relative">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center justify-center h-full">
                <span>Keranjang masih kosong.</span>
                <span className="mt-1">Pilih barang di sebelah kiri.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rp {item.price.toLocaleString('id-ID')} x {item.qty}
                    </p>
                  </div>

                  {/* KONTROL QUANTITY */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-5 h-5 bg-white text-slate-600 rounded flex items-center justify-center text-xs shadow-xs active:scale-75 transition-transform"
                    >
                      <FontAwesomeIcon icon={faMinus} className="text-[9px]" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-5 h-5 bg-white text-slate-600 rounded flex items-center justify-center text-xs shadow-xs active:scale-75 transition-transform"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                    </button>
                  </div>

                  <span className="text-xs font-bold text-slate-900 min-w-[4.5rem] text-right">
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-rose-400 hover:text-rose-600 active:scale-75 text-xs p-1 transition-transform"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* METODE PEMBAYARAN & TOTAL */}
        <div className="shrink-0 border-t border-slate-100 pt-4 space-y-4">
          {selfCheckout && (
            <div>
              <label htmlFor="customer-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nama Pelanggan
              </label>
              <input
                id="customer-name"
                name="customer_name"
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Masukkan nama"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
          )}

          {/* PILIHAN METODE */}
          <div role="group" aria-labelledby="payment-method-label">
            <p id="payment-method-label" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Metode Pembayaran
            </p>
            <div className="grid grid-cols-3 gap-2">
              {paymentOptions.map((m) => (
                <button
                  key={m.name}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold border active:scale-95 transition-all duration-150 ${
                    paymentMethod === m.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <FontAwesomeIcon icon={m.icon} className="mb-1 text-sm" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* INPUT NAMA UANG (TUNAI) */}
          {!selfCheckout && paymentMethod === 'tunai' && (
            <div className="animate-in fade-in duration-200">
              <label htmlFor="cash-amount" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {selfCheckout ? 'Nominal Pembayaran (Rp)' : 'Uang Diterima (Rp)'}
              </label>
              <div className="flex gap-2">
                <input
                  id="cash-amount"
                  name="cash_received"
                  type="number"
                  placeholder="0"
                  min={total}
                  required={selfCheckout}
                  inputMode="numeric"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setCashAmount(String(total))}
                  className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 active:scale-95 transition-all hover:bg-indigo-100"
                >
                  Uang Pas
                </button>
              </div>
              {parseInt(cashAmount) > 0 && (
                <div className="flex justify-between text-xs mt-1.5 font-semibold text-slate-600 animate-in fade-in">
                  <span>Kembalian:</span>
                  <span className="text-emerald-600 text-sm">Rp {change.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          )}

          {/* TOTAL & BUTTON CHECKOUT */}
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 animate-in fade-in">
                <span>Diskon otomatis</span>
                <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-medium">Total Pembayaran</span>
              <span 
                ref={totalPriceRef} 
                className="text-xl font-extrabold text-indigo-600 origin-right inline-block"
              >
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              ref={checkoutBtnRef}
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-[0.98] ${
                cart.length === 0 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              }`}
            >
              {checkoutLoading ? 'Mengirim pesanan...' : 'Konfirmasi & Bayar Sekarang'}
            </button>
            {checkoutError && <p role="alert" className="mt-2 text-xs text-rose-600 animate-in fade-in">{checkoutError}</p>}
          </div>
        </div>
      </div>

      {/* MODAL SUKSES TRANSAKSI */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <ReceiptHeader settings={cooperativeSettings} />
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-in zoom-in duration-300">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-400 mt-1">Pesanan menunggu konfirmasi kasir. Stok diperbarui setelah dikonfirmasi.</p>
            </div>
            <p className="text-xs font-semibold text-slate-700">No. pesanan: {orderNumber}</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1 text-left">
              <div className="flex justify-between text-slate-500">
                <span>Nama Pelanggan:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">Rp {(Number(checkoutOrder?.total_amount ?? total) + Number(checkoutOrder?.discount_amount ?? discountAmount)).toLocaleString('id-ID')}</span>
              </div>
              {(Number(checkoutOrder?.discount_amount ?? discountAmount)) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon:</span>
                  <span className="font-bold">- Rp {Number(checkoutOrder?.discount_amount ?? discountAmount).toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Total Bayar:</span>
                <span className="font-bold text-slate-900">Rp {Number(checkoutOrder?.total_amount ?? total).toLocaleString('id-ID')}</span>
              </div>
              {!selfCheckout && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Uang Dibayarkan:</span>
                    <span className="font-bold text-slate-900">
                      Rp {Number(checkoutOrder?.cash_received ?? (paymentMethod === 'tunai' ? cashAmount || 0 : total)).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Kembalian:</span>
                    <span className="font-bold text-emerald-600">
                      Rp {Number(checkoutOrder?.change_amount ?? (paymentMethod === 'tunai' ? change : 0)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Metode:</span>
                <span className="font-bold text-indigo-600">{paymentMethod}</span>
              </div>
            </div>
            <ReceiptFooter settings={cooperativeSettings} />
            <button
              type="button"
              onClick={resetTransaction}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all duration-150"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Kasir;