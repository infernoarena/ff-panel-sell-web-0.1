import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  FileImage,
  Filter,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  LogOut,
  Menu,
  Minus,
  PackageOpen,
  PanelTop,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Video,
  WalletCards,
  X,
} from 'lucide-react';

type Plan = { id: string; label: string; price: number };
type Product = {
  id: string;
  name: string;
  image: string;
  videoUrl: string;
  description: string;
  badges: string[];
  category: string;
  plans: Plan[];
};
type StoreSettings = {
  storeName: string;
  heroTitle: string;
  heroCopy: string;
  upiId: string;
  whatsapp: string;
  password: string;
  gallery: string[];
};
type StoreData = { settings: StoreSettings; products: Product[] };
type PaymentSelection = { product: Product; plan: Plan };

const STORAGE_KEY = 'samar-x-modes-store-v1';
const ACCESS_KEY = 'samar-x-modes-admin-access';
const LOGO = `${import.meta.env.BASE_URL}assets/samar-logo.jpg`;
const LEGACY_PASSWORD = 'SAMAR X MODES007';
const DEFAULT_PASSWORD = 'kunal2610';

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const whatsappDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('00')) return digits.slice(2);
  return digits;
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Image could not be read'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Image could not be loaded'));
      image.onload = () => {
        const maxSize = 1100;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Image compression is not supported'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const defaultProducts: Product[] = [
  {
    id: 'shadow-aim',
    name: 'Shadow Aim Panel',
    image: LOGO,
    videoUrl: '',
    description: 'Clean aim assistance with a low-noise setup for ranked sessions and fast matches.',
    badges: ['Best seller', 'Safe mode'],
    category: 'Aim',
    plans: [
      { id: '1d', label: '1 Day', price: 39 },
      { id: '7d', label: '7 Days', price: 99 },
      { id: '30d', label: '30 Days', price: 249 },
    ],
  },
  {
    id: 'phantom-head',
    name: 'Phantom Headshot',
    image: LOGO,
    videoUrl: '',
    description: 'A focused headshot configuration built for players who want more control per round.',
    badges: ['Popular'],
    category: 'Headshot',
    plans: [
      { id: '1d', label: '1 Day', price: 49 },
      { id: '7d', label: '7 Days', price: 129 },
      { id: '30d', label: '30 Days', price: 299 },
    ],
  },
  {
    id: 'titan-combo',
    name: 'Titan Combo Panel',
    image: LOGO,
    videoUrl: '',
    description: 'The full competitive bundle for players who want a sharp, all-round panel loadout.',
    badges: ['Full kit', 'New'],
    category: 'Combo',
    plans: [
      { id: '2d', label: '2 Days', price: 79 },
      { id: '7d', label: '7 Days', price: 179 },
      { id: '30d', label: '30 Days', price: 399 },
    ],
  },
  {
    id: 'velocity-utility',
    name: 'Velocity Utility',
    image: LOGO,
    videoUrl: '',
    description: 'A practical utility panel for quick setup changes between casual and competitive play.',
    badges: ['Fast setup'],
    category: 'Utility',
    plans: [
      { id: '1d', label: '1 Day', price: 29 },
      { id: '7d', label: '7 Days', price: 79 },
      { id: '30d', label: '30 Days', price: 199 },
    ],
  },
];

const defaultData: StoreData = {
  settings: {
    storeName: 'SAMAR X MODES',
    heroTitle: 'PLAY SHARP.',
    heroCopy: 'Premium gaming panels for players who want a faster, cleaner setup. Pick a panel, pay by UPI, and get your key on WhatsApp.',
    upiId: 'samarxmodes@upi',
    whatsapp: '8360226615',
    password: DEFAULT_PASSWORD,
    gallery: [LOGO],
  },
  products: defaultProducts,
};

function readStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as StoreData;
    const settings = { ...defaultData.settings, ...parsed.settings };
    return {
      settings: {
        ...settings,
        password: !settings.password?.trim() || settings.password.trim() === LEGACY_PASSWORD
          ? DEFAULT_PASSWORD
          : settings.password.trim(),
        gallery: parsed.settings?.gallery?.length ? parsed.settings.gallery : [LOGO],
      },
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : defaultProducts,
    };
  } catch {
    return defaultData;
  }
}

function App() {
  const [store, setStore] = useState<StoreData>(readStore);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentSelection | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All panels');
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessGranted, setAccessGranted] = useState(() => localStorage.getItem(ACCESS_KEY) === 'true');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      const compactStore: StoreData = {
        settings: {
          ...store.settings,
          gallery: store.settings.gallery.map((image) => image.startsWith('data:') ? LOGO : image),
        },
        products: store.products.map((product) => ({
          ...product,
          image: product.image.startsWith('data:') ? LOGO : product.image,
        })),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compactStore));
        setToast('Panel saved. Large uploaded images use the default logo in browser storage.');
      } catch {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            settings: { ...defaultData.settings, ...store.settings, gallery: [LOGO] },
            products: store.products.map((product) => ({ ...product, image: LOGO })),
          }));
          setToast('Panel saved with compact image storage.');
        } catch {
          setToast('Panel is active for this session, but browser storage is unavailable.');
        }
      }
    }
  }, [store]);

  useEffect(() => {
    document.title = `${store.settings.storeName} — Gaming panels`;
  }, [store.settings.storeName]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(
    () => ['All panels', ...Array.from(new Set(store.products.map((product) => product.category).filter(Boolean)))],
    [store.products],
  );
  const filteredProducts = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return store.products.filter((product) => {
      const matchesQuery = !normalized || `${product.name} ${product.description} ${product.category} ${product.badges.join(' ')}`.toLowerCase().includes(normalized);
      const matchesCategory = category === 'All panels' || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, query, store.products]);

  const notify = (message: string) => setToast(message);
  const updateStore = (next: StoreData) => setStore(next);
  const startAdmin = () => {
    if (accessGranted) setAdminOpen(true);
    else setLoginOpen(true);
  };
  const handleLogin = (password: string) => {
    const enteredPassword = password.trim();
    const configuredPassword = store.settings.password?.trim() || DEFAULT_PASSWORD;
    if (enteredPassword === configuredPassword) {
      localStorage.setItem(ACCESS_KEY, 'true');
      setAccessGranted(true);
      setLoginOpen(false);
      setAdminOpen(true);
      notify('Admin access unlocked');
      return true;
    }
    return false;
  };
  const beginPayment = (product: Product, plan: Plan) => {
    setPayment({ product, plan });
    setConfirmed(false);
  };
  const closePayment = () => {
    setPayment(null);
    setConfirmed(false);
  };

  return (
    <div className="noise min-h-[100dvh] overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[hsl(225_44%_6%/.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <button className="group flex items-center gap-3 text-left" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} data-testid="button-home">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-cyan-300/30 bg-slate-950">
              <img src={LOGO} alt="Samar X Modes logo" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-cyan-400/10 transition group-hover:bg-transparent" />
            </span>
            <span>
              <span className="display-font block text-sm font-bold tracking-[.17em] text-slate-100">{store.settings.storeName}</span>
              <span className="mono-font block text-[9px] tracking-[.3em] text-cyan-300/70">PANEL DIVISION / 01</span>
            </span>
          </button>
          <div className="hidden items-center gap-7 text-xs font-semibold tracking-wide text-slate-400 sm:flex">
            <a href="#catalog" className="transition hover:text-cyan-300" data-testid="link-catalog">Catalog</a>
            <a href="#how-it-works" className="transition hover:text-cyan-300" data-testid="link-how-it-works">How it works</a>
            <button onClick={startAdmin} className="flex items-center gap-2 transition hover:text-cyan-300" data-testid="button-admin-top">
              <Settings2 size={14} /> Control room
            </button>
          </div>
          <div className="relative flex items-center gap-2">
            <a href={`https://wa.me/${whatsappDigits(store.settings.whatsapp)}`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[.06] px-4 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 sm:flex" data-testid="link-whatsapp-header">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#62d9ff]" /> Live support
            </a>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[.03] text-slate-300 transition hover:border-cyan-300/50 hover:text-cyan-200"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              data-testid="button-menu"
            >
              <Menu size={19} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-48 rounded-xl border border-white/10 bg-[hsl(224_32%_11%/.98)] p-2 shadow-2xl backdrop-blur-xl">
                <a href="#catalog" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-200">Catalog</a>
                <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-200">How it works</a>
                <button onClick={() => { setMenuOpen(false); startAdmin(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-bold text-cyan-200 hover:bg-cyan-300/10" data-testid="button-admin-menu">
                  <Settings2 size={14} /> Admin panel
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="grid-fade pointer-events-none absolute inset-0 -z-10 opacity-90" />
          <div className="pointer-events-none absolute -right-48 top-8 -z-10 h-[500px] w-[500px] rounded-full bg-cyan-400/[.06] blur-[90px]" />
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24">
            <div className="fade-up">
              <div className="mb-6 flex items-center gap-3">
                <span className="pulse-line h-px w-10 bg-cyan-300" />
                <span className="mono-font text-[10px] font-medium uppercase tracking-[.3em] text-cyan-300">Private panel store / online now</span>
              </div>
              <h1 className="display-font max-w-[720px] text-[clamp(3.7rem,9vw,7.8rem)] font-bold leading-[.84] tracking-[-.075em] text-slate-100 text-glow">
                {store.settings.heroTitle.split(' ').map((word, index) => (
                  <span key={`${word}-${index}`} className={index === store.settings.heroTitle.split(' ').length - 1 ? 'block text-cyan-300' : 'block'}>{word}</span>
                ))}
              </h1>
              <p className="mt-8 max-w-[510px] text-base leading-7 text-slate-400 sm:text-lg">{store.settings.heroCopy}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a href="#catalog" className="group flex items-center gap-3 rounded-lg bg-cyan-300 px-5 py-3.5 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-200" data-testid="link-browse-panels">
                  Browse panels <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                </a>
                <div className="flex items-center gap-2 px-2 text-xs text-slate-500">
                  <ShieldCheck size={16} className="text-cyan-300" /> Manual payment handoff
                </div>
              </div>
              <div className="mt-12 grid max-w-[500px] grid-cols-3 gap-4 border-t border-white/[.09] pt-5">
                <Stat value={`${store.products.length}`} label="Live panels" />
                <Stat value="UPI" label="Fast payment" />
                <Stat value="24/7" label="Key delivery" />
              </div>
            </div>
            <div className="fade-up-delay relative mx-auto w-full max-w-[530px]">
              <div className="relative aspect-[1.15] overflow-hidden rounded-2xl border border-cyan-200/20 bg-slate-950 shadow-[0_30px_100px_hsl(197_100%_40%/.14)]">
                <img src={store.settings.gallery[heroSlide] || LOGO} alt="Samar gaming panel artwork" className="h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/20 to-cyan-200/10" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">SAMAR / VISUAL SYSTEM</span>
                    <p className="display-font mt-1 text-2xl font-bold text-white">Built for the next round.</p>
                  </div>
                  <div className="flex gap-1.5">
                    {store.settings.gallery.map((_, index) => (
                      <button key={`dot-${index}`} onClick={() => setHeroSlide(index)} className={`h-1.5 rounded-full transition-all ${heroSlide === index ? 'w-7 bg-cyan-300' : 'w-1.5 bg-white/40'}`} aria-label={`Show gallery image ${index + 1}`} data-testid={`button-gallery-${index}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[hsl(224_32%_11%/.94)] px-4 py-3 shadow-2xl backdrop-blur-md sm:-left-8">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><KeyRound size={16} /></span>
                <span><span className="block text-[10px] uppercase tracking-widest text-slate-500">Delivery</span><span className="block text-xs font-bold text-slate-200">Direct to WhatsApp</span></span>
              </div>
              {store.settings.gallery.length > 1 && (
                <div className="absolute right-3 top-3 flex gap-1">
                  <button onClick={() => setHeroSlide((heroSlide - 1 + store.settings.gallery.length) % store.settings.gallery.length)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/60 text-white backdrop-blur transition hover:border-cyan-300/50" aria-label="Previous image" data-testid="button-gallery-prev"><ChevronLeft size={16} /></button>
                  <button onClick={() => setHeroSlide((heroSlide + 1) % store.settings.gallery.length)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-slate-950/60 text-white backdrop-blur transition hover:border-cyan-300/50" aria-label="Next image" data-testid="button-gallery-next"><ChevronRight size={16} /></button>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-[1240px] scroll-mt-20 px-5 pb-24 sm:px-8">
          <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[.08] pb-7 md:flex-row md:items-end">
            <div>
              <span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">01 / SELECT YOUR LOADOUT</span>
              <h2 className="display-font mt-2 text-3xl font-bold tracking-[-.04em] text-slate-100 sm:text-4xl">The panel shelf<span className="text-cyan-300">.</span></h2>
            </div>
            <div className="flex w-full max-w-[380px] items-center gap-2 rounded-lg border border-white/10 bg-white/[.035] px-3 py-2.5 focus-within:border-cyan-300/60">
              <Search size={16} className="text-slate-500" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search panels, styles, features" className="w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600" data-testid="input-search-panels" />
              {query && <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white" aria-label="Clear search" data-testid="button-clear-search"><X size={14} /></button>}
            </div>
          </div>
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <Filter size={14} className="mr-1 text-slate-600" />
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${category === item ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-200' : 'border-white/[.09] text-slate-500 hover:border-white/25 hover:text-slate-300'}`} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>
            ))}
          </div>
          {filteredProducts.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} onBuy={beginPayment} />)}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-8 text-center">
              <div><PackageOpen size={30} className="mx-auto mb-3 text-slate-600" /><p className="font-semibold text-slate-300">No panels match that search.</p><button onClick={() => { setQuery(''); setCategory('All panels'); }} className="mt-3 text-xs font-bold text-cyan-300 hover:text-cyan-200" data-testid="button-reset-filters">Reset filters</button></div>
            </div>
          )}
        </section>

        <section id="how-it-works" className="border-y border-white/[.07] bg-white/[.018] scroll-mt-20">
          <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
            <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div><span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">02 / ZERO FRICTION</span><h2 className="display-font mt-2 text-3xl font-bold tracking-[-.04em] text-slate-100 sm:text-4xl">From shelf to session.</h2></div>
              <p className="max-w-[350px] text-sm leading-6 text-slate-500">No account. No checkout maze. A direct payment handoff keeps it quick and personal.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.08] md:grid-cols-3">
              <ProcessStep number="01" icon={<PanelTop size={20} />} title="Choose a panel" copy="Compare the setup, read the details, and pick a duration that fits your grind." />
              <ProcessStep number="02" icon={<WalletCards size={20} />} title="Pay by UPI" copy="Copy our UPI ID or use the deep link. Confirm payment only after your transfer is complete." />
              <ProcessStep number="03" icon={<KeyRound size={20} />} title="Get your key" copy="Tap the WhatsApp handoff and send the prepared message. Manual delivery keeps support close." />
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-[1240px] px-5 pb-8 pt-14 sm:px-8">
          <div className="flex flex-col justify-between gap-8 border-b border-white/[.08] pb-10 sm:flex-row">
            <div><div className="display-font text-xl font-bold tracking-tight text-slate-100">{store.settings.storeName}<span className="text-cyan-300">.</span></div><p className="mt-2 max-w-[280px] text-xs leading-5 text-slate-600">Precision tools for players who take the next round personally.</p></div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-xs text-slate-500"><a href="#catalog" className="hover:text-cyan-300">Catalog</a><a href="#how-it-works" className="hover:text-cyan-300">Process</a><a href={`https://wa.me/${whatsappDigits(store.settings.whatsapp)}`} target="_blank" rel="noreferrer" className="hover:text-cyan-300">WhatsApp support</a><button className="flex items-center gap-2 text-left font-bold text-cyan-300 hover:text-cyan-200" onClick={startAdmin} data-testid="button-admin-footer"><Menu size={14} /> Admin panel</button></div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-[10px] uppercase tracking-[.16em] text-slate-700 sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} {store.settings.storeName}</span><span>Manual delivery / UPI accepted / India</span></div>
        </footer>
      </main>

      {loginOpen && <AdminLogin onClose={() => setLoginOpen(false)} onLogin={handleLogin} />}
      {adminOpen && <AdminPanel store={store} onChange={updateStore} onClose={() => setAdminOpen(false)} onNotify={notify} onLogout={() => { localStorage.removeItem(ACCESS_KEY); setAccessGranted(false); setAdminOpen(false); notify('Admin access reset'); }} />}
      {payment && <PaymentSheet selection={payment} settings={store.settings} confirmed={confirmed} onConfirm={() => setConfirmed(true)} onClose={closePayment} />}
      {toast && <div className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-300/30 bg-[hsl(224_32%_12%/.96)] px-4 py-3 text-xs font-bold text-cyan-100 shadow-2xl backdrop-blur" role="status" data-testid="status-toast"><Check size={15} className="text-cyan-300" /> {toast}</div>}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><div className="display-font text-xl font-bold text-slate-100">{value}</div><div className="mono-font mt-1 text-[9px] uppercase tracking-widest text-slate-600">{label}</div></div>;
}

function ProductCard({ product, index, onBuy }: { product: Product; index: number; onBuy: (product: Product, plan: Plan) => void }) {
  const [selectedPlan, setSelectedPlan] = useState(product.plans[0]);
  const lowest = Math.min(...product.plans.map((plan) => plan.price));
  return (
    <article className="card-sheen fade-up flex min-w-0 flex-col rounded-2xl border border-white/[.09] bg-[hsl(224_32%_10%)] p-1.5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[hsl(224_32%_12%)] sm:p-2.5" style={{ animationDelay: `${index * 70}ms` }} data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[1.12] overflow-hidden rounded-xl bg-slate-950">
        <img src={product.image || LOGO} alt={`${product.name} artwork`} className="h-full w-full object-cover opacity-75 transition duration-500 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{product.badges.slice(0, 2).map((badge) => <span key={badge} className="rounded-full border border-cyan-200/20 bg-slate-950/70 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-cyan-200 backdrop-blur">{badge}</span>)}</div>
        <span className="absolute bottom-3 right-3 mono-font text-[10px] text-slate-400">{product.category || 'Panel'}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-3">
        <h3 className="display-font break-words text-[15px] font-bold leading-tight tracking-tight text-slate-100 sm:text-lg">{product.name}</h3>
        <p className="mt-2 min-h-[56px] text-[10px] leading-4 text-slate-500 sm:min-h-[48px] sm:text-xs sm:leading-5">{product.description}</p>
        <div className="mt-3 flex flex-wrap gap-1 sm:mt-4 sm:gap-1.5">
          {product.plans.map((plan) => <button key={plan.id} onClick={() => setSelectedPlan(plan)} className={`rounded-md border px-1.5 py-1 text-[9px] font-bold transition sm:px-2 sm:py-1.5 sm:text-[10px] ${selectedPlan.id === plan.id ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-200' : 'border-white/[.08] text-slate-500 hover:border-white/25'}`} data-testid={`button-plan-${product.id}-${plan.id}`}>{plan.label}</button>)}
        </div>
        <div className="mt-4 flex items-end justify-between gap-2 border-t border-white/[.07] pt-3 sm:mt-5 sm:pt-4">
          <div><span className="mono-font block text-[9px] uppercase tracking-widest text-slate-600">Starting at</span><span className="display-font text-xl font-bold text-slate-100">₹{lowest}</span><span className="ml-1 text-[10px] text-slate-500">/ {selectedPlan.label}</span></div>
          <button onClick={() => onBuy(product, selectedPlan)} className="group flex shrink-0 items-center gap-1 rounded-lg bg-cyan-300 px-2.5 py-2 text-[10px] font-extrabold text-slate-950 transition hover:bg-cyan-200 sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-xs" data-testid={`button-buy-${product.id}`}>Buy <ArrowRight size={13} className="transition group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" /></button>
        </div>
      </div>
    </article>
  );
}

function ProcessStep({ number, icon, title, copy }: { number: string; icon: ReactNode; title: string; copy: string }) {
  return <div className="bg-[hsl(224_32%_10%)] p-7 sm:p-9"><div className="flex items-center justify-between"><span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">{number}</span><span className="text-cyan-300">{icon}</span></div><h3 className="display-font mt-12 text-xl font-bold text-slate-100">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{copy}</p></div>;
}

function Modal({ children, onClose, width = 'max-w-lg' }: { children: ReactNode; onClose: () => void; width?: string }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`relative max-h-[94dvh] w-full ${width} overflow-y-auto rounded-t-2xl border border-white/[.12] bg-[hsl(224_34%_10%)] shadow-[0_30px_100px_hsl(225_50%_2%/.75)] sm:rounded-2xl`}>{children}</div></div>;
}

function AdminLogin({ onClose, onLogin }: { onClose: () => void; onLogin: (password: string) => boolean }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  return <Modal onClose={onClose}><div className="p-7 sm:p-9"><ModalClose onClose={onClose} /><div className="mb-8"><div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300"><LockKeyhole size={20} /></div><span className="mono-font text-[10px] tracking-[.24em] text-cyan-300">RESTRICTED AREA</span><h2 className="display-font mt-2 text-2xl font-bold text-slate-100">Control room access</h2><p className="mt-2 text-sm leading-6 text-slate-500">Manage your storefront, panels, images, and delivery settings.</p></div><label className="mb-2 block text-xs font-bold text-slate-300">Admin passphrase</label><div className="relative"><input autoFocus type={passwordVisible ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(false); }} onKeyDown={(event) => { if (event.key === 'Enter' && !onLogin(password)) setError(true); }} placeholder="Enter passphrase" className={`w-full rounded-lg border bg-slate-950/60 px-4 py-3 pr-12 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 ${error ? 'border-red-400/70' : 'border-white/10 focus:border-cyan-300/60'}`} data-testid="input-admin-password" /><button type="button" onClick={() => setPasswordVisible((visible) => !visible)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-white/10 hover:text-cyan-200" aria-label={passwordVisible ? 'Hide admin passphrase' : 'Show admin passphrase'} data-testid="button-toggle-admin-password">{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{error && <p className="mt-2 text-xs text-red-300">That passphrase did not match.</p>}<button onClick={() => { if (!onLogin(password)) setError(true); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 py-3 text-sm font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="button-admin-login"><LockKeyhole size={16} /> Unlock control room</button></div></Modal>;
}

function ModalClose({ onClose }: { onClose: () => void }) {
  return <button onClick={onClose} className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="Close" data-testid="button-close-modal"><X size={17} /></button>;
}

function PaymentSheet({ selection, settings, confirmed, onConfirm, onClose }: { selection: PaymentSelection; settings: StoreSettings; confirmed: boolean; onConfirm: () => void; onClose: () => void }) {
  const { product, plan } = selection;
  const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.storeName)}&am=${encodeURIComponent(plan.price)}&cu=INR`;
  const message = `Payment successful, give me key. Panel: ${product.name}. Plan: ${plan.label}.`;
  const whatsappLink = `https://wa.me/${whatsappDigits(settings.whatsapp)}?text=${encodeURIComponent(message)}`;
  const [copied, setCopied] = useState(false);
  const [upiOpened, setUpiOpened] = useState(false);
  const [returnedFromUpi, setReturnedFromUpi] = useState(false);
  const leftPageForUpi = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!upiOpened) return;
      if (document.visibilityState === 'hidden') {
        leftPageForUpi.current = true;
      } else if (leftPageForUpi.current) {
        setReturnedFromUpi(true);
      }
    };
    const markPageVisible = () => {
      if (upiOpened && leftPageForUpi.current) setReturnedFromUpi(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', markPageVisible);
    window.addEventListener('pageshow', markPageVisible);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', markPageVisible);
      window.removeEventListener('pageshow', markPageVisible);
    };
  }, [upiOpened]);

  const copyUpi = async () => {
    await navigator.clipboard?.writeText(settings.upiId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return <Modal onClose={onClose} width="max-w-md"><div className="p-6 sm:p-8"><ModalClose onClose={onClose} />{!confirmed ? <><div className="mb-7"><span className="mono-font text-[10px] tracking-[.24em] text-cyan-300">SECURE PAYMENT HANDOFF</span><h2 className="display-font mt-2 text-2xl font-bold text-slate-100">Ready to unlock?</h2><p className="mt-2 text-sm text-slate-500">{returnedFromUpi ? 'Welcome back. Confirm your payment to request the panel key.' : 'Open your UPI app and complete the transfer. The confirmation button appears when you return here.'}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/50 p-4"><div className="flex items-center justify-between gap-4"><div><span className="mono-font text-[9px] uppercase tracking-widest text-slate-600">Selected panel</span><p className="mt-1 font-bold text-slate-200">{product.name}</p></div><div className="text-right"><span className="mono-font text-[9px] uppercase tracking-widest text-slate-600">Amount</span><p className="display-font mt-1 text-xl font-bold text-cyan-300">₹{plan.price}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-3 text-xs"><span className="text-slate-500">{plan.label} access</span><span className="font-mono text-slate-300">{settings.storeName}</span></div></div><div className="mt-5"><label className="mb-2 block text-xs font-bold text-slate-300">UPI ID</label><div className="flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[.05] p-2 pl-3"><span className="flex-1 truncate font-mono text-sm text-cyan-100">{settings.upiId}</span><button onClick={copyUpi} className="flex items-center gap-1.5 rounded-md bg-cyan-300 px-3 py-2 text-[11px] font-extrabold text-slate-950" data-testid="button-copy-upi">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}</button></div></div>{!returnedFromUpi ? <a href={upiLink} onClick={() => setUpiOpened(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.05] py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/50 hover:text-cyan-200" data-testid="link-upi-payment"><Smartphone size={16} /> Open UPI app <ExternalLink size={13} /></a> : <button onClick={onConfirm} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 py-3 text-sm font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="button-payment-confirm"><Check size={16} /> I have paid — Get key</button>}<p className="mt-4 text-center text-[10px] leading-4 text-slate-600">{returnedFromUpi ? 'Confirm only after your UPI transfer is complete.' : 'After payment, return to this page to request your key.'}</p></> : <div className="py-7 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-300"><BadgeCheck size={31} /></div><span className="mono-font mt-7 block text-[10px] tracking-[.24em] text-cyan-300">PAYMENT MARKED COMPLETE</span><h2 className="display-font mt-2 text-2xl font-bold text-slate-100">Your key is one tap away.</h2><p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-slate-500">Open WhatsApp and send the prepared delivery request to Samar support.</p><a href={whatsappLink} target="_blank" rel="noreferrer" onClick={onClose} className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="link-panel-key"><KeyRound size={17} /> Click here for panel key <ExternalLink size={14} /></a><p className="mt-4 text-[10px] text-slate-600">Message includes: “Payment successful, give me key.”</p></div>}</div></Modal>;
}

function AdminPanel({ store, onChange, onClose, onNotify, onLogout }: { store: StoreData; onChange: (store: StoreData) => void; onClose: () => void; onNotify: (message: string) => void; onLogout: () => void }) {
  const [tab, setTab] = useState<'overview' | 'products' | 'settings'>('overview');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [settings, setSettings] = useState(store.settings);
  const initializedSettings = useRef(false);
  useEffect(() => setSettings(store.settings), [store.settings]);
  useEffect(() => {
    if (!initializedSettings.current) {
      initializedSettings.current = true;
      return;
    }
    onChange({ ...store, settings });
  }, [settings]);
  const saveSettings = () => { onChange({ ...store, settings }); onNotify('Store settings saved'); };
  const saveProduct = (product: Product) => {
    const exists = store.products.some((item) => item.id === product.id);
    onChange({ ...store, products: exists ? store.products.map((item) => item.id === product.id ? product : item) : [...store.products, product] });
    setEditing(null); setShowNew(false); onNotify(exists ? 'Panel updated' : 'Panel created');
  };
  const deleteProduct = (product: Product) => {
    if (window.confirm(`Delete ${product.name}?`)) { onChange({ ...store, products: store.products.filter((item) => item.id !== product.id) }); onNotify('Panel deleted'); }
  };
  const addGallery = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void compressImage(file)
      .then((image) => setSettings((current) => ({ ...current, gallery: [...current.gallery, image] })))
      .catch(() => onNotify('Image could not be added. Please choose another image.'));
    event.target.value = '';
  };
  const removeGallery = (index: number) => {
    if (!window.confirm(`Delete gallery image ${index + 1}?`)) return;
    setSettings((current) => ({ ...current, gallery: current.gallery.filter((_, imageIndex) => imageIndex !== index) }));
  };
  const moveGallery = (index: number, direction: -1 | 1) => setSettings((current) => {
    const next = [...current.gallery]; const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, gallery: next };
  });
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-[hsl(225_44%_6%)]"><div className="mx-auto min-h-[100dvh] max-w-[1400px]"><header className="sticky top-0 z-10 border-b border-white/[.08] bg-[hsl(225_44%_6%/.92)] backdrop-blur-xl"><div className="flex h-[72px] items-center justify-between px-5 sm:px-8"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300 text-slate-950"><LayoutDashboard size={18} /></div><div><span className="display-font block text-sm font-bold text-slate-100">Control room</span><span className="mono-font block text-[9px] tracking-[.25em] text-slate-600">LOCAL STORE ADMIN</span></div></div><div className="flex items-center gap-2"><button onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:border-white/25 hover:text-white" data-testid="button-view-store">View store</button><button onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-lg border border-red-300/15 text-red-300/70 hover:border-red-300/40 hover:text-red-300" aria-label="Logout admin" data-testid="button-admin-logout"><LogOut size={15} /></button></div></div></header><div className="grid md:grid-cols-[220px_1fr]"><aside className="border-b border-white/[.08] p-4 md:min-h-[calc(100dvh-72px)] md:border-b-0 md:border-r md:p-5"><div className="mb-5 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-600">Workspace</div>{([['overview', LayoutDashboard, 'Overview'], ['products', PackageOpen, 'Panel catalog'], ['settings', Settings2, 'Store settings']] as const).map(([value, Icon, label]) => <button key={value} onClick={() => setTab(value)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${tab === value ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500 hover:bg-white/[.04] hover:text-slate-200'}`} data-testid={`button-admin-tab-${value}`}><Icon size={16} /> {label}</button>)}</aside><section className="min-w-0 p-5 sm:p-8 lg:p-10">{tab === 'overview' && <AdminOverview store={store} onTab={setTab} />} {tab === 'products' && <AdminProducts products={store.products} onNew={() => setShowNew(true)} onEdit={setEditing} onDelete={deleteProduct} />} {tab === 'settings' && <AdminSettings settings={settings} setSettings={setSettings} onSave={saveSettings} onAddGallery={addGallery} onRemoveGallery={removeGallery} onMoveGallery={moveGallery} onNotify={onNotify} />} </section></div></div>{(showNew || editing) && <ProductEditor product={editing} gallery={store.settings.gallery} onClose={() => { setShowNew(false); setEditing(null); }} onSave={saveProduct} />}</div>;
}

function AdminOverview({ store, onTab }: { store: StoreData; onTab: (tab: 'overview' | 'products' | 'settings') => void }) {
  const plans = store.products.reduce((sum, product) => sum + product.plans.length, 0);
  return <div className="fade-up"><div className="mb-10"><span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">CONTROL ROOM / OVERVIEW</span><h1 className="display-font mt-2 text-4xl font-bold tracking-[-.05em] text-slate-100">Good to see you, operator<span className="text-cyan-300">.</span></h1><p className="mt-3 max-w-[560px] text-sm leading-6 text-slate-500">Everything here is saved locally in this browser and reflected on the storefront instantly.</p></div><div className="grid gap-4 sm:grid-cols-3"><AdminMetric label="Live panels" value={String(store.products.length)} icon={<PanelTop size={17} />} /><AdminMetric label="Active plans" value={String(plans)} icon={<CreditCard size={17} />} /><AdminMetric label="Gallery frames" value={String(store.settings.gallery.length)} icon={<ImagePlus size={17} />} /></div><div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border border-white/[.09] bg-white/[.025] p-6"><div className="flex items-start justify-between gap-4"><div><span className="mono-font text-[10px] tracking-[.2em] text-slate-600">STORE PREVIEW</span><h2 className="display-font mt-2 text-xl font-bold text-slate-100">{store.settings.storeName}</h2></div><span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200">Live</span></div><div className="mt-6 rounded-xl border border-white/[.07] bg-slate-950/50 p-5"><span className="mono-font text-[9px] tracking-widest text-cyan-300">HERO COPY</span><p className="mt-3 text-sm leading-6 text-slate-300">{store.settings.heroTitle} — {store.settings.heroCopy}</p></div><button onClick={() => onTab('settings')} className="mt-5 flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200" data-testid="button-edit-store-overview"><Pencil size={14} /> Edit storefront identity <ArrowRight size={14} /></button></div><div className="rounded-2xl border border-white/[.09] bg-white/[.025] p-6"><span className="mono-font text-[10px] tracking-[.2em] text-slate-600">QUICK ACTIONS</span><div className="mt-5 space-y-3"><button onClick={() => onTab('products')} className="flex w-full items-center justify-between rounded-lg border border-white/[.08] bg-white/[.025] p-4 text-left text-sm font-bold text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200" data-testid="button-quick-products">Manage panels <ArrowRight size={15} /></button><button onClick={() => onTab('settings')} className="flex w-full items-center justify-between rounded-lg border border-white/[.08] bg-white/[.025] p-4 text-left text-sm font-bold text-slate-300 hover:border-cyan-300/40 hover:text-cyan-200" data-testid="button-quick-settings">Update UPI & gallery <ArrowRight size={15} /></button></div></div></div></div>;
}

function AdminMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="rounded-2xl border border-white/[.09] bg-white/[.025] p-5"><div className="flex items-center justify-between text-cyan-300"><span className="mono-font text-[9px] uppercase tracking-widest text-slate-600">{label}</span>{icon}</div><div className="display-font mt-5 text-3xl font-bold text-slate-100">{value}</div></div>;
}

function AdminProducts({ products, onNew, onEdit, onDelete }: { products: Product[]; onNew: () => void; onEdit: (product: Product) => void; onDelete: (product: Product) => void }) {
  return <div className="fade-up"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">CATALOG / PRODUCTS</span><h1 className="display-font mt-2 text-3xl font-bold tracking-[-.04em] text-slate-100">Panel catalog</h1><p className="mt-2 text-sm text-slate-500">Shape the shelf buyers see on the storefront.</p></div><button onClick={onNew} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="button-new-product"><Plus size={16} /> Add panel</button></div>{products.length ? <div className="overflow-hidden rounded-2xl border border-white/[.09]"><div className="hidden grid-cols-[minmax(180px,1.5fr)_120px_1fr_92px] gap-4 border-b border-white/[.08] bg-white/[.025] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 md:grid"><span>Panel</span><span>Category</span><span>Plans</span><span>Actions</span></div>{products.map((product) => <div key={product.id} className="grid gap-3 border-b border-white/[.07] p-4 last:border-0 md:grid-cols-[minmax(180px,1.5fr)_120px_1fr_92px] md:items-center md:gap-4 md:px-5"><div className="flex items-center gap-3"><img src={product.image || LOGO} alt="" className="h-11 w-11 rounded-lg object-cover opacity-80" /><div><p className="font-bold text-slate-200">{product.name}</p><p className="mt-1 text-[10px] text-slate-600">{product.badges.join(' / ') || 'No badges'}</p></div></div><span className="text-xs text-slate-500">{product.category || 'Unsorted'}</span><div className="flex flex-wrap gap-1.5">{product.plans.map((plan) => <span key={plan.id} className="rounded bg-white/[.05] px-2 py-1 text-[10px] text-slate-400">{plan.label} · ₹{plan.price}</span>)}</div><div className="flex gap-2"><button onClick={() => onEdit(product)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-slate-400 hover:border-cyan-300/40 hover:text-cyan-200" aria-label={`Edit ${product.name}`} data-testid={`button-edit-product-${product.id}`}><Edit3 size={14} /></button><button onClick={() => onDelete(product)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-slate-500 hover:border-red-300/40 hover:text-red-300" aria-label={`Delete ${product.name}`} data-testid={`button-delete-product-${product.id}`}><Trash2 size={14} /></button></div></div>)}</div> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center"><PackageOpen size={30} className="mx-auto text-slate-600" /><p className="mt-3 text-sm text-slate-400">Your catalog is empty.</p><button onClick={onNew} className="mt-4 text-xs font-bold text-cyan-300" data-testid="button-empty-add-product">Add your first panel</button></div>}</div>;
}

function AdminSettings({ settings, setSettings, onSave, onAddGallery, onRemoveGallery, onMoveGallery, onNotify }: { settings: StoreSettings; setSettings: Dispatch<SetStateAction<StoreSettings>>; onSave: () => void; onAddGallery: (event: ChangeEvent<HTMLInputElement>) => void; onRemoveGallery: (index: number) => void; onMoveGallery: (index: number, direction: -1 | 1) => void; onNotify: (message: string) => void }) {
  const field = (key: keyof StoreSettings, label: string, help?: string, type = 'text') => <label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">{label}</span><input type={type} value={settings[key] as string} onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60" data-testid={`input-setting-${String(key)}`} />{help && <span className="mt-1.5 block text-[10px] text-slate-600">{help}</span>}</label>;
  return <div className="fade-up max-w-[900px]"><div className="mb-8 flex items-end justify-between gap-4"><div><span className="mono-font text-[10px] tracking-[.25em] text-cyan-300">STORE / CONFIGURATION</span><h1 className="display-font mt-2 text-3xl font-bold tracking-[-.04em] text-slate-100">Store settings</h1><p className="mt-2 text-sm text-slate-500">Changes autosave to this browser when you save.</p></div><button onClick={onSave} className="flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-xs font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="button-save-settings"><Save size={15} /> Save changes</button></div><div className="space-y-5"><section className="rounded-2xl border border-white/[.09] bg-white/[.025] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><Sparkles size={17} /></div><div><h2 className="font-bold text-slate-200">Storefront identity</h2><p className="text-xs text-slate-600">The words buyers see first.</p></div></div><div className="grid gap-5 sm:grid-cols-2">{field('storeName', 'Store name')}{field('heroTitle', 'Hero headline', 'Use short words for the strongest lockup.')}<label className="block sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-300">Hero copy</span><textarea value={settings.heroCopy} onChange={(event) => setSettings((current) => ({ ...current, heroCopy: event.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/50 px-3.5 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-300/60" data-testid="input-setting-heroCopy" /></label></div></section><section className="rounded-2xl border border-white/[.09] bg-white/[.025] p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><WalletCards size={17} /></div><div><h2 className="font-bold text-slate-200">Delivery & payment</h2><p className="text-xs text-slate-600">Shown during the manual checkout handoff.</p></div></div><div className="grid gap-5 sm:grid-cols-2">{field('upiId', 'UPI ID', 'Example: name@upi')}{field('whatsapp', 'WhatsApp number', 'Include country code only if needed.')}{field('password', 'Admin passphrase', 'Changing this does not log out your current session.', 'text')}</div></section><section className="rounded-2xl border border-white/[.09] bg-white/[.025] p-5 sm:p-7"><div className="mb-6 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/10 text-cyan-300"><ImagePlus size={17} /></div><div><h2 className="font-bold text-slate-200">Gallery & slider</h2><p className="text-xs text-slate-600">Upload images from your device. The first image leads the hero.</p></div></div><label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-[11px] font-bold text-cyan-200 hover:bg-cyan-300/15"><Upload size={14} /> Add image<input type="file" accept="image/*" onChange={onAddGallery} className="hidden" data-testid="input-gallery-upload" /></label></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{settings.gallery.map((image, index) => <div key={`${image.slice(0, 20)}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-slate-950"><img src={image} alt={`Gallery frame ${index + 1}`} className="h-full w-full object-cover opacity-80" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/75 p-1.5 transition"><button disabled={index === 0} onClick={() => onMoveGallery(index, -1)} className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white disabled:opacity-30" aria-label="Move image left" data-testid={`button-gallery-move-left-${index}`}><ChevronLeft size={13} /></button><button onClick={() => onRemoveGallery(index)} className="grid h-7 w-7 place-items-center rounded bg-red-300/10 text-red-200 hover:bg-red-300/20" aria-label={`Delete gallery image ${index + 1}`} title="Delete image" data-testid={`button-gallery-remove-${index}`}><Trash2 size={13} /></button><button disabled={index === settings.gallery.length - 1} onClick={() => onMoveGallery(index, 1)} className="grid h-7 w-7 place-items-center rounded bg-white/10 text-white disabled:opacity-30" aria-label="Move image right" data-testid={`button-gallery-move-right-${index}`}><ChevronRight size={13} /></button></div><span className="absolute left-2 top-2 rounded bg-slate-950/70 px-1.5 py-1 text-[9px] font-bold text-white">{index === 0 ? 'Lead' : `${index + 1}`}</span></div>)}</div></section></div></div>;
}

function ProductEditor({ product, gallery, onClose, onSave }: { product: Product | null; gallery: string[]; onClose: () => void; onSave: (product: Product) => void }) {
  const [draft, setDraft] = useState<Product>(() => product ? { ...product, badges: [...product.badges], plans: product.plans.map((plan) => ({ ...plan })) } : { id: makeId('panel'), name: '', image: LOGO, videoUrl: '', description: '', badges: [], category: 'Aim', plans: [{ id: makeId('plan'), label: '1 Day', price: 49 }] });
  const [badgeText, setBadgeText] = useState(draft.badges.join(', '));
  const update = (key: keyof Product, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const updatePlan = (id: string, key: keyof Plan, value: string) => setDraft((current) => ({ ...current, plans: current.plans.map((plan) => plan.id === id ? { ...plan, [key]: key === 'price' ? Number(value) || 0 : value } : plan) }));
  const pickImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void compressImage(file)
      .then((image) => setDraft((current) => ({ ...current, image })))
      .catch(() => window.alert('Image could not be added. Please choose another image.'));
    event.target.value = '';
  };
  const submit = () => {
    if (!draft.name.trim() || !draft.plans.length) return;
    onSave({ ...draft, name: draft.name.trim(), badges: badgeText.split(',').map((badge) => badge.trim()).filter(Boolean), plans: draft.plans.map((plan) => ({ ...plan, label: plan.label.trim() || 'Access', price: Number(plan.price) || 0 })) });
  };
  return <Modal onClose={onClose} width="max-w-2xl"><div className="p-6 sm:p-8"><ModalClose onClose={onClose} /><div className="mb-7"><span className="mono-font text-[10px] tracking-[.24em] text-cyan-300">CATALOG / {product ? 'EDIT PANEL' : 'NEW PANEL'}</span><h2 className="display-font mt-2 text-2xl font-bold text-slate-100">{product ? 'Edit panel' : 'Add a panel'}</h2></div><div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Panel name</span><input value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Shadow Aim Panel" className="field-input" data-testid="input-product-name" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Category</span><input value={draft.category} onChange={(event) => update('category', event.target.value)} placeholder="Aim, Combo, Utility" className="field-input" data-testid="input-product-category" /></label><label className="block sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-300">Description</span><textarea value={draft.description} onChange={(event) => update('description', event.target.value)} rows={3} className="field-input resize-none leading-6" placeholder="What makes this panel useful?" data-testid="input-product-description" /></label><label className="block sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-300">Badges <span className="font-normal text-slate-600">(comma separated)</span></span><input value={badgeText} onChange={(event) => setBadgeText(event.target.value)} className="field-input" placeholder="Popular, Safe mode" data-testid="input-product-badges" /></label><div className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-slate-300">Panel artwork</span><div className="flex items-center gap-4"><img src={draft.image || LOGO} alt="Panel preview" className="h-16 w-24 rounded-lg border border-white/10 object-cover" /><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200"><FileImage size={15} /> Choose file<input type="file" accept="image/*" onChange={pickImage} className="hidden" data-testid="input-product-image" /></label></div><div className="mt-3 flex flex-wrap gap-2">{gallery.map((image, index) => <button key={`choose-gallery-${index}`} onClick={() => setDraft((current) => ({ ...current, image }))} className={`h-10 w-14 overflow-hidden rounded-md border transition ${draft.image === image ? 'border-cyan-300' : 'border-white/10 hover:border-white/30'}`} title={`Use gallery image ${index + 1}`} data-testid={`button-product-gallery-${index}`}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}</div></div><label className="block sm:col-span-2"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-300">Optional video URL <Video size={13} className="text-slate-600" /></span><input value={draft.videoUrl} onChange={(event) => update('videoUrl', event.target.value)} className="field-input" placeholder="https://..." data-testid="input-product-video" /></label><div className="sm:col-span-2"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-slate-300">Duration plans</span><button onClick={() => setDraft((current) => ({ ...current, plans: [...current.plans, { id: makeId('plan'), label: '30 Days', price: 199 }] }))} className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200" data-testid="button-add-plan"><Plus size={13} /> Add duration</button></div><div className="space-y-2">{draft.plans.map((plan, index) => <div key={plan.id} className="flex items-center gap-2"><input value={plan.label} onChange={(event) => updatePlan(plan.id, 'label', event.target.value)} className="field-input flex-1" aria-label={`Plan ${index + 1} duration`} data-testid={`input-plan-label-${index}`} /><div className="relative w-28"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">₹</span><input type="number" min="0" value={plan.price} onChange={(event) => updatePlan(plan.id, 'price', event.target.value)} className="field-input w-full pl-7" aria-label={`Plan ${index + 1} price`} data-testid={`input-plan-price-${index}`} /></div><button disabled={draft.plans.length === 1} onClick={() => setDraft((current) => ({ ...current, plans: current.plans.filter((item) => item.id !== plan.id) }))} className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-500 hover:border-red-300/40 hover:text-red-300 disabled:opacity-30" aria-label="Remove duration" data-testid={`button-remove-plan-${index}`}><Minus size={15} /></button></div>)}</div></div></div><div className="mt-8 flex justify-end gap-3 border-t border-white/[.08] pt-5"><button onClick={onClose} className="rounded-lg border border-white/10 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white" data-testid="button-cancel-product">Cancel</button><button onClick={submit} disabled={!draft.name.trim()} className="flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-xs font-extrabold text-slate-950 hover:bg-cyan-200" data-testid="button-save-product"><Save size={15} /> {product ? 'Save panel' : 'Create panel'}</button></div></div></Modal>;
}

export default App;