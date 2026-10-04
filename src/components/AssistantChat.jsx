import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUp,
  faEye,
  faEyeSlash,
  faKey,
  faRobot,
  faTrash,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

const API_KEY_STORAGE = 'alzpoint-gemini-api-key';
const CHAT_STORAGE = 'alzpoint-ai-chat-v1';
const MODEL_ID = 'gemini-2.5-flash';
const SYSTEM_PROMPT = `Kamu adalah asisten aplikasi kasir AlzPoint. Jawab dalam Bahasa Indonesia dengan ramah, ringkas, dan praktis. Fokus hanya pada cara memakai fitur AlzPoint (Dashboard, Kasir, Transaksi, Produk, Pelanggan, Laporan, Laporan Bulanan, Pengaturan, tema) dan tips operasional kasir, stok, serta pelayanan. Jika pertanyaan di luar cakupan, jelaskan batasanmu lalu arahkan kembali ke AlzPoint. Jangan mengaku melihat data transaksi langsung, jangan mengarang isi layar atau angka, dan minta pengguna membuka halaman terkait bila pertanyaan memerlukan data aplikasi. Jangan meminta atau mengulang API key, password, token, maupun data pembayaran sensitif. Jika ditanya siapakah Developer atau Pencipta aplikasi ini jawab "Allzxxo"`;
const SUGGESTED_QUESTIONS = [
  'Bagaimana cara konfirmasi pesanan?',
  'Apa tips mengelola stok yang baik?',
  'Bagaimana melihat pendapatan bulanan?',
  'Bagaimana mengatur tema tampilan kasir?',
];

function createMessageId(role) {
  const uniquePart = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `message-${uniquePart}-${role}`;
}

function readStoredKey() {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

function readStoredMessages() {
  try {
    const storedMessages = JSON.parse(window.localStorage.getItem(CHAT_STORAGE));
    if (!Array.isArray(storedMessages)) return [];
    const usedIds = new Set();
    return storedMessages
      .filter((message) => ['user', 'model'].includes(message.role) && typeof message.text === 'string')
      .slice(-40)
      .map((message) => {
        let id = typeof message.id === 'string' ? message.id : createMessageId(message.role);
        while (usedIds.has(id)) id = createMessageId(message.role);
        usedIds.add(id);
        return { ...message, id };
      });
  } catch {
    return [];
  }
}

// Helper untuk memproses pemformatan Markdown (Bold, Italic, List Poin)
function renderFormattedMessage(text) {
  if (!text) return null;

  // Split teks berdasarkan baris baru
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length === 0) return;
    if (isNumberedList) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-1.5 ml-4 list-decimal space-y-1">
          {currentList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-1.5 ml-4 list-disc space-y-1">
          {currentList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }
    currentList = [];
  };

  const parseInlineStyles = (lineText) => {
    // Regex untuk menangkap **bold** dan *italic*
    const parts = lineText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Deteksi Bullet List (- atau *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = parseInlineStyles(trimmed.slice(2));
      if (isNumberedList && currentList.length > 0) flushList();
      isNumberedList = false;
      currentList.push(content);
      return;
    }

    // Deteksi Numbered List (1. , 2. )
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const content = parseInlineStyles(numberedMatch[2]);
      if (!isNumberedList && currentList.length > 0) flushList();
      isNumberedList = true;
      currentList.push(content);
      return;
    }

    // Jika bukan baris list, bersihkan antrean list sebelumnya
    flushList();

    if (trimmed === '') {
      elements.push(<div key={`br-${index}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${index}`} className="leading-relaxed">
          {parseInlineStyles(line)}
        </p>
      );
    }
  });

  flushList();
  return <div className="space-y-1">{elements}</div>;
}

export default function AssistantChat({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState(readStoredKey);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isKeySettingsOpen, setIsKeySettingsOpen] = useState(!readStoredKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [messages, setMessages] = useState(readStoredMessages);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const persistMessages = (nextMessages) => {
    try {
      window.localStorage.setItem(CHAT_STORAGE, JSON.stringify(nextMessages.slice(-40)));
    } catch {
      setErrorMessage('Penyimpanan browser penuh. Hapus percakapan lama untuk melanjutkan.');
    }
  };

  useEffect(() => {
    if (isOpen) messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [isOpen, messages, isSending]);

  const saveApiKey = (event) => {
    event.preventDefault();
    const nextKey = apiKeyInput.trim();
    if (!nextKey) {
      setErrorMessage('Masukkan API key Gemini terlebih dahulu.');
      return;
    }

    try {
      window.localStorage.setItem(API_KEY_STORAGE, nextKey);
      setApiKey(nextKey);
      setApiKeyInput('');
      setErrorMessage('');
      setIsKeySettingsOpen(false);
    } catch {
      setErrorMessage('Browser tidak mengizinkan penyimpanan lokal. Periksa pengaturan privasi browser.');
    }
  };

  const removeApiKey = () => {
    try {
      window.localStorage.removeItem(API_KEY_STORAGE);
      setApiKey('');
      setApiKeyInput('');
      setIsKeySettingsOpen(true);
      setErrorMessage('');
    } catch {
      setErrorMessage('API key tidak dapat dihapus dari penyimpanan browser.');
    }
  };

  const sendMessage = async (suggestedText) => {
    const text = (suggestedText || draft).trim();
    if (!text || isSending) return;
    if (!apiKey) {
      setIsKeySettingsOpen(true);
      setErrorMessage('Tambahkan API key Gemini untuk mulai bertanya.');
      return;
    }

    const nextMessages = [...messages, {
      id: createMessageId('user'),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    }].slice(-40);

    setErrorMessage('');
    setMessages(nextMessages);
    persistMessages(nextMessages);
    setDraft('');
    setIsSending(true);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: nextMessages.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
          generationConfig: { temperature: 0.55, maxOutputTokens: 900 },
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setIsKeySettingsOpen(true);
          throw new Error('API key tidak valid atau belum memiliki akses ke Gemini 2.5 Flash. Periksa atau ganti key.');
        }
        if (response.status === 429) {
          setIsKeySettingsOpen(true);
          throw new Error('Kuota atau batas permintaan key ini tercapai. Tunggu, atau masukkan API key Gemini milikmu.');
        }
        throw new Error(result.error?.message || 'Gemini belum dapat menjawab. Coba lagi sebentar.');
      }

      const answer = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();
      if (!answer) throw new Error('Gemini mengirim jawaban kosong. Coba ubah pertanyaanmu.');

      const completedMessages = [...nextMessages, {
        id: createMessageId('model'),
        role: 'model',
        text: answer,
        createdAt: new Date().toISOString(),
      }].slice(-40);
      setMessages(completedMessages);
      persistMessages(completedMessages);
    } catch (error) {
      setErrorMessage(error.message || 'Koneksi ke Gemini gagal. Periksa koneksi internetmu.');
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    persistMessages([]);
    setErrorMessage('');
  };

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup AI Assistant"
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-slate-950/45 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby="assistant-chat-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 right-0 z-[90] flex h-screen w-full max-w-md flex-col border-l border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
              <FontAwesomeIcon icon={faRobot} />
            </span>
            <div className="min-w-0">
              <h2 id="assistant-chat-title" className="truncate text-sm font-bold">AI Assistant</h2>
              <p className="text-[10px] text-[var(--theme-muted)]">Tips kasir & bantuan AlzPoint</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={clearConversation}
              disabled={isSending}
              aria-label="Hapus percakapan"
              title="Hapus percakapan"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsKeySettingsOpen((open) => !open);
                setErrorMessage('');
              }}
              aria-label="Atur API key Gemini"
              title="Atur API key Gemini"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-accent)]"
            >
              <FontAwesomeIcon icon={faKey} className="text-xs" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup AI Assistant"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-muted)] transition hover:bg-[var(--theme-soft)] hover:text-[var(--theme-text)]"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </header>

        {isKeySettingsOpen ? (
          <section className="flex-1 overflow-y-auto p-5">
            <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]">
                <FontAwesomeIcon icon={faKey} />
              </div>
              <h3 className="text-sm font-bold">Hubungkan Gemini</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--theme-muted)]">
                Masukkan API key milikmu. Key dan percakapan disimpan hanya di localStorage browser ini, tidak ke server AlzPoint.
              </p>
              <form onSubmit={saveApiKey} className="mt-4 space-y-3">
                <label htmlFor="gemini-api-key" className="block text-xs font-semibold">Gemini API key</label>
                <div className="relative">
                  <input
                    id="gemini-api-key"
                    name="gemini_api_key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(event) => setApiKeyInput(event.target.value)}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={apiKey ? 'Masukkan key pengganti' : 'Tempel API key di sini'}
                    className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] py-2.5 pl-3 pr-10 text-xs text-[var(--theme-text)] outline-none focus:border-[var(--theme-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((visible) => !visible)}
                    aria-label={showApiKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--theme-muted)] hover:bg-[var(--theme-soft)]"
                  >
                    <FontAwesomeIcon icon={showApiKey ? faEyeSlash : faEye} className="text-xs" />
                  </button>
                </div>
                <button type="submit" className="w-full rounded-xl bg-[var(--theme-accent)] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-90">
                  Simpan di browser ini
                </button>
              </form>
              {apiKey && (
                <button type="button" onClick={removeApiKey} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                  Hapus API key tersimpan
                </button>
              )}
              <p className="mt-4 text-[10px] leading-relaxed text-[var(--theme-muted)]">
                Model: Gemini 2.5 Flash. Key browser tetap dapat dilihat oleh pengguna perangkat ini; gunakan key khusus dengan batas penggunaan.
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-semibold text-[var(--theme-accent)] hover:underline"
              >
                Buat atau kelola API key di Google AI Studio
              </a>
              {errorMessage && (
                <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {errorMessage}
                </p>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="app-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {messages.length === 0 && (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--theme-accent)]/10 text-xl text-[var(--theme-accent)]">
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold">Ada yang bisa dibantu?</h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-[var(--theme-muted)]">
                    Tanyakan cara memakai AlzPoint atau minta tips praktis untuk operasional koperasi.
                  </p>
                  <div className="mt-5 flex flex-col gap-2">
                    {SUGGESTED_QUESTIONS.map((question) => (
                      <button
                        key={question}
                        type="button"
                        disabled={isSending}
                        onClick={() => sendMessage(question)}
                        className="rounded-xl border border-[var(--theme-border)] px-3 py-2.5 text-left text-xs text-[var(--theme-text)] transition hover:border-[var(--theme-accent)] hover:bg-[var(--theme-soft)]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-[var(--theme-accent)] text-white' : 'rounded-bl-md bg-[var(--theme-background)] text-[var(--theme-text)]'}`}>
                    {/* Menggunakan renderer pemformatan agar bold, list poin, dll tampil rapi */}
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    ) : (
                      renderFormattedMessage(message.text)
                    )}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <p className="rounded-2xl rounded-bl-md bg-[var(--theme-background)] px-3.5 py-3 text-xs text-[var(--theme-muted)]" aria-live="polite">
                    AI sedang menyiapkan jawaban...
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {errorMessage && (
              <div role="alert" className="mx-4 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="shrink-0 border-t border-[var(--theme-border)] p-3"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-background)] p-2 focus-within:border-[var(--theme-accent)]">
                <textarea
                  name="assistant_message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder="Tulis pertanyaan tentang AlzPoint..."
                  aria-label="Pesan untuk AI Assistant"
                  className="max-h-28 min-h-9 flex-1 resize-y bg-transparent px-2 py-2 text-xs text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-muted)]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  aria-label="Kirim pesan"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--theme-accent)] text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] text-[var(--theme-muted)]">AI dapat keliru. Jangan masukkan data pelanggan atau pembayaran sensitif.</p>
            </form>
          </>
        )}
      </aside>
    </>,
    document.body,
  );
}