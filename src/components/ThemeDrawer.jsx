import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { THEME_ACCENTS, THEME_RADII, useTheme } from '../context/ThemeContext';

const themeOptions = [
  { id: 'default', label: 'Default' },
  { id: 'light', label: 'Terang' },
  { id: 'dark', label: 'Gelap' },
];

export default function ThemeDrawer({ isOpen, onClose }) {
  const { theme, setTheme, accent, setAccent, radius, setRadius } = useTheme();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Tutup pengatur tema"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby="theme-drawer-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-start justify-between border-b border-[var(--theme-border)] px-6 py-5">
          <div>
            <h2 id="theme-drawer-title" className="text-lg font-bold">Pengatur Tema</h2>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">Pilih tampilan aplikasi</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-text)]"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="border-b border-[var(--theme-border)] p-5 pb-4">
          <div role="group" aria-label="Kategori tema" className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--theme-soft)] p-1">
            {themeOptions.map((option) => {
              const isActive = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setTheme(option.id)}
                  className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isActive ? 'bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-sm' : 'text-[var(--theme-muted)] hover:text-[var(--theme-text)]'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--theme-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--theme-accent)]">
            <FontAwesomeIcon icon={faCheck} /> {themeOptions.find((option) => option.id === theme)?.label} aktif
          </span>
        </div>

        <section aria-label="Pilihan warna aksen" className="p-5">
          <h3 className="text-sm font-bold">Warna aksen</h3>
          <p className="mt-1 text-xs text-[var(--theme-muted)]">Pilih satu dari lima warna untuk tema ini.</p>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {THEME_ACCENTS[theme].map((option) => {
              const isActive = accent.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`Gunakan warna ${option.label}`}
                  aria-pressed={isActive}
                  title={option.label}
                  onClick={() => setAccent(option.id)}
                  className="flex min-w-0 flex-col items-center gap-2 rounded-lg py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isActive ? 'ring-2 ring-[var(--theme-text)] ring-offset-2 ring-offset-[var(--theme-surface)]' : 'hover:scale-110'}`}
                    style={{ backgroundColor: option.color, color: option.id === 'amber' ? '#1f2937' : '#ffffff' }}
                  >
                    {isActive && <FontAwesomeIcon icon={faCheck} className="text-sm" />}
                  </span>
                  <span className={`max-w-full truncate text-[10px] ${isActive ? 'font-bold text-[var(--theme-text)]' : 'text-[var(--theme-muted)]'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-label="Pengaturan radius kartu" className="border-t border-[var(--theme-border)] p-5">
          <h3 className="text-sm font-bold">Bentuk sudut kartu</h3>
          <p className="mt-1 text-xs text-[var(--theme-muted)]">Pilih radius untuk kartu dan kontainer.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {THEME_RADII.map((option) => {
              const isActive = radius === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setRadius(option.id)}
                  className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)] ${isActive ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5' : 'border-[var(--theme-border)] hover:border-[var(--theme-accent)]/50'}`}
                >
                  <span
                    className="block h-8 border-2 border-[var(--theme-accent)] bg-[var(--theme-surface)]"
                    style={{ borderRadius: option.value }}
                  />
                  <span className="mt-2 block text-xs font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--theme-muted)]">{option.value}</span>
                </button>
              );
            })}
          </div>
        </section>
      </aside>
    </>
  );
}