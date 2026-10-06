import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTags, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createCategory, deleteCategory, getCategories } from '../api/kopsis';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;
    getCategories()
      .then((response) => {
        if (active) setCategories(response.data.data);
      })
      .catch((error) => {
        if (active) setErrorMessage(error.response?.data?.message || 'Kategori tidak dapat dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await createCategory({
        category_name: categoryName.trim(),
        description: description.trim() || null,
      });
      setCategories((current) => [...current, response.data.data].sort((a, b) => a.category_name.localeCompare(b.category_name, 'id')));
      setCategoryName('');
      setDescription('');
      setSuccessMessage('Kategori baru berhasil ditambahkan.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Kategori gagal ditambahkan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (category.is_default || !window.confirm(`Hapus kategori ${category.category_name}?`)) return;

    setErrorMessage('');
    setSuccessMessage('');
    try {
      await deleteCategory(category.category_id);
      setCategories((current) => current.filter((item) => item.category_id !== category.category_id));
      setSuccessMessage('Kategori berhasil dihapus.');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Kategori gagal dihapus.');
    }
  };

  return (
    <section className="w-full space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
            <FontAwesomeIcon icon={faTags} />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Kategori Produk</h2>
            <p className="mt-0.5 text-xs text-slate-500">Kategori bawaan selalu tersedia. Admin dapat menambah kategori khusus usaha.</p>
          </div>
        </div>
      </header>

      {errorMessage && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{successMessage}</p>}

      <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label htmlFor="category-name" className="block text-xs font-semibold text-slate-600">
          Nama kategori
          <input
            id="category-name"
            name="category_name"
            required
            maxLength={50}
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Contoh: Perlengkapan Cafe"
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[var(--theme-accent)]"
          />
        </label>
        <label htmlFor="category-description" className="block text-xs font-semibold text-slate-600">
          Keterangan
          <input
            id="category-description"
            name="description"
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opsional"
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[var(--theme-accent)]"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[var(--theme-accent)] px-4 text-xs font-bold text-white transition hover:brightness-90 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah
        </button>
      </form>

      <div className="divide-y divide-slate-100 border-y border-slate-100">
        {loading && <p className="py-5 text-center text-xs text-slate-500">Memuat kategori...</p>}
        {!loading && categories.map((category) => (
          <div key={category.category_id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{category.category_name}</p>
                {category.is_default && <span className="rounded-full bg-[var(--theme-accent)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--theme-accent)]">Bawaan</span>}
              </div>
              {category.description && <p className="mt-0.5 truncate text-xs text-slate-500">{category.description}</p>}
            </div>
            {!category.is_default && (
              <button
                type="button"
                onClick={() => handleDelete(category)}
                aria-label={`Hapus kategori ${category.category_name}`}
                title="Hapus kategori"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
              </button>
            )}
          </div>
        ))}
        {!loading && categories.length === 0 && <p className="py-5 text-center text-xs text-slate-500">Belum ada kategori.</p>}
      </div>
    </section>
  );
}