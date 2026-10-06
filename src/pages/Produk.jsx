import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from '../api/kopsis';
import usePageEntrance from '../hooks/usePageEntrance';
import { 
  faSearch, 
  faPlus, 
  faPenToSquare, 
  faTrash, 
  faBoxOpen, 
  faImage, 
  faTag, 
  faMoneyBillWave, 
  faLayerGroup,
  faBoxesStacked
} from '@fortawesome/free-solid-svg-icons';

const mapProduct = (product) => ({
  id: product.product_id,
  name: product.product_name,
  categoryId: product.category_id,
  category: product.category?.category_name || '',
  price: Number(product.price),
  stock: product.stock,
  image: product.image_url,
});

const Produk = ({ currentUser }) => {
  const pageRef = usePageEntrance();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State untuk Tambah / Edit
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stock: '',
    image: ''
  });

  const isAdmin = currentUser?.role === 'admin';
  const categoryNames = ['Semua', ...categories.map((category) => category.category_name)];

  useEffect(() => {
    let active = true;
    const loadCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          getProducts({ include_out: isAdmin }),
          getCategories(),
        ]);
        if (active) {
          setProducts(productsResponse.data.data.map(mapProduct));
          setCategories(categoriesResponse.data.data);
          setErrorMessage('');
        }
      } catch (error) {
        if (active) setErrorMessage(error.response?.data?.message || 'Katalog belum dapat dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCatalog();
    const interval = window.setInterval(loadCatalog, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAdmin]);

  // Filter Produk
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'Semua' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Buka Modal Tambah
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', categoryId: categories[0]?.category_id || '', price: '', stock: '', image: '' });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock,
      image: product.image
    });
    setIsModalOpen(true);
  };

  // Hapus Produk
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteProduct(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setSuccessMessage('Produk berhasil dihapus.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Produk gagal dihapus.');
    }
  };

  // Simpan Data (Submit Form)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      category_id: Number(formData.categoryId),
      product_name: formData.name,
      price: Number(formData.price),
      stock: Number(formData.stock),
      image_url: formData.image || 'https://i.pinimg.com/736x/d0/17/cf/d017cf0fefc93e2a39f820a915c96322.jpg',
    };

    try {
      const response = editingProduct
        ? await updateProduct(editingProduct.id, payload)
        : await createProduct(payload);
      const savedProduct = mapProduct(response.data.data);

      setProducts((current) => editingProduct
        ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
        : [...current, savedProduct]);
      setSuccessMessage(editingProduct ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
      setIsModalOpen(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Produk gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={pageRef} className="space-y-6 bg-slate-50 min-h-screen text-slate-800">
      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{successMessage}</p>}
      
      {/* BAR HEADER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Produk</h1>
          <p className="text-xs text-slate-400">Atur katalog barang, harga, dan jumlah stok kopsis</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          
          {/* BADGE JUMLAH BARANG (DI SAMPING KIRI CARI BARANG) */}
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-indigo-700 text-xs font-semibold shrink-0">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-indigo-600 text-xs" />
            <span>Total: <strong className="font-extrabold text-indigo-900">{filteredProducts.length}</strong> Barang</span>
          </div>

          {/* SEARCH BAR */}
          <div className="relative flex-1 sm:w-60">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              id="product-list-search"
              name="product_search"
              type="text"
              placeholder="Cari barang..."
              aria-label="Cari produk"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* TOMBOL TAMBAH KHUSUS ADMIN */}
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              disabled={loading || categories.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Tambah Produk</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER KATEGORI */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categoryNames.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* GRID KATALOG PRODUK */}
      <div className="app-scrollbar grid max-h-[calc(100vh-16rem)] grid-cols-1 content-start gap-4 overflow-y-auto overscroll-y-contain pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {loading && <p className="col-span-full py-8 text-center text-xs text-slate-500">Memuat produk...</p>}
        {!loading && filteredProducts.length === 0 && <p className="col-span-full py-8 text-center text-xs text-slate-500">Produk tidak ditemukan.</p>}
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= 10;

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* GAMBAR PRODUK */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2.5 py-1 rounded-md text-white backdrop-blur-md ${
                      isLowStock ? 'bg-rose-500' : 'bg-slate-900/70'
                    }`}
                  >
                    Stok: {product.stock}
                  </span>
                </div>

                {/* KATEGORI & NAMA */}
                <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                  {product.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{product.name}</h3>
              </div>

              {/* HARGA & AKSI */}
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                <span className="text-sm font-extrabold text-slate-900">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>

                {isAdmin ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit Produk"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Produk"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Read-Only</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL FORM TAMBAH / EDIT PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              {/* NAMA PRODUK */}
              <div>
                <label htmlFor="product-name" className="font-bold text-slate-500 mb-1 block">Nama Produk</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faTag} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="product-name"
                    name="product_name"
                    type="text"
                    required
                    placeholder="Contoh: Es Teh Manis"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* KATEGORI */}
              <div>
                <label htmlFor="product-category" className="font-bold text-slate-500 mb-1 block">Kategori</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLayerGroup} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    id="product-category"
                    name="category_id"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  >
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>{category.category_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* HARGA & STOK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="product-price" className="font-bold text-slate-500 mb-1 block">Harga (Rp)</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="product-price"
                      name="price"
                      type="number"
                      required
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="product-stock" className="font-bold text-slate-500 mb-1 block">Jumlah Stok</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faBoxOpen} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="product-stock"
                      name="stock"
                      type="number"
                      required
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* GAMBAR URL */}
              <div>
                <label htmlFor="product-image-url" className="font-bold text-slate-500 mb-1 block">URL Gambar Produk</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faImage} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="product-image-url"
                    name="image_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* TOMBOL SUBMIT */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition"
                >
                  {saving ? 'Menyimpan...' : editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produk;