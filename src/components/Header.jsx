import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faMagnifyingGlass, faRobot } from '@fortawesome/free-solid-svg-icons';

export default function Header({ onOpenTheme, onOpenAI, onSearch, showAI = true }) {
	const [searchTerm, setSearchTerm] = useState('');
	const [searchFeedback, setSearchFeedback] = useState('');

	const handleSearch = (event) => {
		event.preventDefault();
		const result = onSearch(searchTerm);
		setSearchFeedback(result.supported
			? `${result.count} kecocokan ditemukan di halaman ini.`
			: 'Highlight pencarian tidak didukung browser ini.');
	};

	return (
		<header className="sticky top-0 z-10 flex h-16 w-full max-w-full items-center justify-between border-b border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 shadow-sm sm:px-6">
			{/* JUDUL HEADER */}
			<h1 className="shrink-0 text-sm font-bold tracking-wide text-[var(--theme-text)] sm:text-base">
				KasirPOS
			</h1>

			{/* KANAN: FORM SEARCH & ACTION BUTTONS */}
			<div className="ml-auto flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
				{/* FORM PENCARIAN (ADAPTIF MOBILE) */}
				<form onSubmit={handleSearch} className="flex w-28 xs:w-36 sm:w-48 md:w-60 min-w-0 items-center">
					<label className="relative flex w-full items-center">
						<input
							id="page-search"
							name="page_search"
							type="search"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Cari..."
							aria-label="Cari dan sorot teks pada halaman"
							className="h-9 sm:h-10 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-background)] pl-2.5 pr-8 sm:px-3 sm:pr-9 text-xs text-[var(--theme-text)] outline-none transition placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent)]/15"
						/>
						<button
							type="submit"
							aria-label="Cari teks di halaman"
							className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-accent)] transition hover:bg-[var(--theme-soft)]"
						>
							<FontAwesomeIcon icon={faMagnifyingGlass} className="text-[11px]" />
						</button>
					</label>
					<span className="sr-only" aria-live="polite">{searchFeedback}</span>
				</form>

				{/* TOMBOL AI ASSISTANT */}
				{showAI && (
					<button
						type="button"
						onClick={onOpenAI}
						aria-label="Buka AI Assistant"
						title="AI Assistant"
						className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-[var(--theme-accent)] transition hover:bg-[var(--theme-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
					>
						<FontAwesomeIcon icon={faRobot} className="text-sm sm:text-base" />
					</button>
				)}

				{/* TOMBOL PENGATURAN TEMA */}
				<button
					type="button"
					onClick={onOpenTheme}
					aria-label="Pengaturan tema"
					title="Pengaturan tema"
					className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-accent)]"
				>
					<FontAwesomeIcon icon={faGear} className="text-sm sm:text-base" />
				</button>
			</div>
		</header>
	);
}