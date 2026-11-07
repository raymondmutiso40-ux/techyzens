import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, Pause, Play, X } from 'lucide-react';
import { MEDIA } from '../../data/media';
import { useReveal } from '../../hooks/useReveal';

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const sources = ['UN Global Marketplace', 'World Bank', 'African Development Bank', 'UNDP', 'UNICEF'];

// Rows for the product preview. Mirrors what the Tenders page shows.
const previewRows = [
  { title: 'Digital Health Strategy & Interoperability Architecture', agency: 'WHO · Kenya', score: 86, deadline: '28 Nov' },
  { title: 'Public Financial Management Reform – Phase II', agency: 'World Bank · Uganda', score: 74, deadline: '04 Dec' },
  { title: 'Agricultural Market Information System Review', agency: 'FAO · Tanzania', score: 61, deadline: '12 Dec' },
  { title: 'Water Utility Asset Management Audit', agency: 'AfDB · Rwanda', score: 38, deadline: '19 Dec' },
];

const features = [
  {
    eyebrow: 'Tender discovery',
    title: 'A short list every morning, not another portal to check.',
    text: 'TenderPilot reads the procurement portals you choose and keeps only notices that match your sectors, regions and keywords. No more scrolling through hundreds of irrelevant listings.',
    image: MEDIA.slides[1],
  },
  {
    eyebrow: 'Fit scoring',
    title: 'Know why a tender is worth chasing before anyone spends a day on it.',
    text: "Each tender is checked against your capability statements and consultant CVs. You get a score and a plain reason: which experts match, which requirements you can't meet yet.",
    image: MEDIA.slides[0],
  },
  {
    eyebrow: 'Proposal drafting',
    title: 'A first draft built from work you have already done.',
    text: "The draft follows the tender's evaluation criteria and your house structure, and reuses your past proposals. Every paragraph links back to the document it came from, so your team can check it.",
    image: MEDIA.slides[2],
  },
];

const steps = [
  ['Upload your documents', 'CVs, past proposals and capability statements. Word or PDF.'],
  ['Tell us what you bid on', 'Sectors, regions, keywords and which portals to watch.'],
  ['Review the shortlist', 'Ranked tenders with a fit score and the reasoning behind it.'],
  ['Edit and export', 'Work on the draft with your team, then export to Word or PDF.'],
];

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fades content in once when it scrolls into view. */
const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <Link to="/" className={`flex items-center gap-2 ${light ? 'text-white' : 'text-stone-900'}`}>
    <span
      className={`h-7 w-7 rounded text-xs font-semibold flex items-center justify-center ${
        light ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'
      }`}
    >
      TP
    </span>
    <span className="font-semibold tracking-tight">TenderPilot</span>
  </Link>
);

const scoreStyle = (score: number) =>
  score >= 75
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : score >= 55
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-stone-100 text-stone-600 border-stone-200';

/** A static, realistic preview of the Tenders screen. */
const ProductPreview: React.FC = () => (
  <div className="rounded-lg border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(41,37,36,0.18)] overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Tenders</div>
        <div className="text-sm font-semibold text-stone-900">New this week · 4 of 212 matched</div>
      </div>
      <span className="text-xs text-stone-500">Sorted by fit</span>
    </div>
    <table className="w-full text-left text-sm">
      <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
        <tr>
          <th className="px-4 py-2 font-medium">Tender</th>
          <th className="px-4 py-2 font-medium hidden sm:table-cell">Deadline</th>
          <th className="px-4 py-2 font-medium text-right">Fit</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {previewRows.map((r) => (
          <tr key={r.title}>
            <td className="px-4 py-3">
              <div className="font-medium text-stone-900 leading-snug">{r.title}</div>
              <div className="text-xs text-stone-500 mt-0.5">{r.agency}</div>
            </td>
            <td className="px-4 py-3 text-stone-600 whitespace-nowrap hidden sm:table-cell">{r.deadline}</td>
            <td className="px-4 py-3 text-right">
              <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-semibold tabular-nums ${scoreStyle(r.score)}`}>
                {r.score}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 text-xs text-stone-600">
      <span className="font-medium text-stone-800">Why 86:</span> 3 consultants with WHO digital-health experience;
      2 similar past proposals. Missing: a FHIR-certified lead.
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const heroVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      heroVideo.current?.pause();
      setVideoPlaying(false);
    }
  }, []);

  const toggleVideo = () => {
    const v = heroVideo.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setVideoPlaying(true);
    } else {
      v.pause();
      setVideoPlaying(false);
    }
  };

  const solidNav = scrolled || menuOpen;
  const navLinks = [
    { href: '#product', label: 'Product' },
    { href: '#how', label: 'How it works' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <div className="bg-[#faf9f7] text-stone-900 min-h-screen">
      {/* ===== Navigation ===== */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
          solidNav ? 'bg-[#faf9f7]/95 backdrop-blur border-b border-stone-200' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo light={!solidNav} />
          <ul className={`hidden md:flex items-center gap-8 text-sm ${solidNav ? 'text-stone-600' : 'text-white/85'}`}>
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={solidNav ? 'hover:text-stone-900' : 'hover:text-white'}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className={`hidden sm:inline-flex h-9 items-center px-3.5 text-sm font-medium rounded-md ${
                solidNav ? 'text-stone-700 hover:bg-stone-100' : 'text-white hover:bg-white/10'
              }`}
            >
              Log in
            </Link>
            <Link
              to="/login"
              className={`inline-flex h-9 items-center px-3.5 text-sm font-medium rounded-md ${
                solidNav ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-white text-stone-900 hover:bg-stone-100'
              }`}
            >
              Request access
            </Link>
            <button
              type="button"
              className={`md:hidden p-2 ${solidNav ? 'text-stone-700' : 'text-white'}`}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <ul className="md:hidden px-5 pb-4 space-y-2 text-sm text-stone-700">
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setMenuOpen(false)} className="block py-1.5">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* ===== Hero: full-bleed video, text anchored bottom-left ===== */}
      <header className="relative h-[92vh] min-h-[560px] overflow-hidden">
        <video
          ref={heroVideo}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={MEDIA.heroPoster}
        >
          <source src={MEDIA.heroVideo} type="video/mp4" />
        </video>
        {/* Warm, bottom-weighted shade so the footage stays visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/35 to-stone-950/30" />

        <div className="relative h-full max-w-6xl mx-auto px-5 flex flex-col justify-end pb-16 md:pb-20">
          <p className="text-sm text-white/80 mb-4">For consultancy and advisory firms</p>
          <h1 className="font-serif text-white text-4xl sm:text-5xl md:text-6xl leading-[1.08] max-w-3xl">
            Win more tenders without writing every proposal from scratch.
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-xl mt-5">
            TenderPilot finds the tenders that fit your firm, explains why, and drafts the technical
            proposal from your own CVs and past work.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to="/login"
              className="inline-flex h-11 items-center gap-2 px-5 rounded-md bg-white text-stone-900 text-sm font-medium hover:bg-stone-100"
            >
              Request access <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#product"
              className="inline-flex h-11 items-center px-5 rounded-md border border-white/40 text-white text-sm font-medium hover:bg-white/10"
            >
              See the product
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleVideo}
          aria-label={videoPlaying ? 'Pause background video' : 'Play background video'}
          className="absolute right-5 bottom-5 h-9 w-9 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50"
        >
          {videoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </header>

      {/* ===== Sources strip ===== */}
      <section className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
          <span className="text-xs uppercase tracking-wider text-stone-500 shrink-0">Watches notices from</span>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-stone-700">
            {sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Product preview ===== */}
      <section id="product" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 grid lg:grid-cols-[1fr_1.25fr] gap-12 items-center">
          <Reveal>
            <h2 className="font-serif text-3xl md:text-4xl leading-tight">
              Your bid desk, sorted by what you can actually win.
            </h2>
            <p className="text-stone-600 mt-4 leading-relaxed">
              Instead of a feed of every notice published, you see a short, ranked list. Each score comes
              with a reason your partners can check before the go/no-go meeting.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-stone-900 underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
            >
              Try the demo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </Reveal>
          <Reveal>
            <ProductPreview />
          </Reveal>
        </div>
      </section>

      {/* ===== Features: alternating photo + text ===== */}
      <section className="pb-12 md:pb-20">
        <div className="max-w-6xl mx-auto px-5 space-y-20 md:space-y-28">
          {features.map((f, i) => (
            <Reveal key={f.eyebrow}>
              <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
                <img
                  src={f.image.src}
                  alt={f.image.alt}
                  loading="lazy"
                  className={`w-full aspect-[4/3] object-cover rounded-lg ${i % 2 === 1 ? 'md:order-2' : ''}`}
                />
                <div>
                  <span className="text-xs uppercase tracking-wider text-stone-500">{f.eyebrow}</span>
                  <h3 className="font-serif text-2xl md:text-3xl leading-snug mt-2">{f.title}</h3>
                  <p className="text-stone-600 mt-4 leading-relaxed">{f.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Photo band with quote ===== */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: `url('${MEDIA.parallax}')` }}
      >
        <div className="absolute inset-0 bg-stone-950/65" />
        <div className="relative max-w-4xl mx-auto px-5 py-24 md:py-32">
          <Reveal>
            <p className="font-serif text-white text-2xl md:text-4xl leading-snug">
              Deciding whether a tender is worth it shouldn't take days. With the fit and the reasons in
              front of you, it's a ten-minute conversation.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section id="how" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal className="max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight">How it works</h2>
            <p className="text-stone-600 mt-3">
              Four steps from your documents to a draft. People still make every bid decision and approve every page.
            </p>
          </Reveal>
          <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 border-t border-stone-300">
            {steps.map(([title, text], i) => (
              <li key={title} className="pt-6 pr-6 pb-2">
                <span className="text-sm text-stone-400 tabular-nums">0{i + 1}</span>
                <h3 className="font-semibold mt-2">{title}</h3>
                <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== CTA with video ===== */}
      <section id="contact" className="px-5 pb-20 md:pb-28">
        <div className="relative max-w-6xl mx-auto overflow-hidden rounded-lg">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={MEDIA.ctaPoster}
          >
            <source src={MEDIA.ctaVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-stone-950/70" />
          <div className="relative px-6 py-16 md:px-14 md:py-20 max-w-2xl">
            <h2 className="font-serif text-white text-3xl md:text-4xl leading-tight">
              See it with your own tenders.
            </h2>
            <p className="text-white/80 mt-4">
              Sign in with your phone number. We text you a one-time code, so there's no password to remember.
            </p>
            <Link
              to="/login"
              className="inline-flex h-11 items-center gap-2 px-5 mt-8 rounded-md bg-white text-stone-900 text-sm font-medium hover:bg-stone-100"
            >
              Log in to TenderPilot <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
          <Logo />
          <span>© {new Date().getFullYear()} TenderPilot</span>
        </div>
      </footer>
    </div>
  );
};
