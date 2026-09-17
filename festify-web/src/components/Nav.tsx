import { useState, useEffect } from 'react';
import { NAV_LINKS } from '../mockData';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? '#efe3c8' : 'transparent',
        boxShadow: scrolled ? '0 2px 0 #152b38' : 'none',
        borderBottom: scrolled ? '2px solid #152b38' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => scrollTo('#hero')}
          className="flex items-center gap-2 font-display text-xl text-navy hover:text-crimson transition-colors"
        >
          <span className="font-mono text-xs tracking-widest text-crimson">✉</span>
          <span>FESTIFY</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-mono text-xs tracking-[0.15em] uppercase text-navy/70 hover:text-navy
                         transition-colors border-b-2 border-transparent hover:border-navy pb-0.5"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('#hero')}
            className="btn-ticket-primary text-xs"
          >
            Register →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 font-mono text-navy"
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t-2 border-navy px-6 py-4 flex flex-col gap-3"
          style={{ backgroundColor: '#efe3c8' }}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="font-mono text-xs tracking-widest uppercase text-navy text-left py-2
                         border-b border-navy/20"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('#hero')}
            className="btn-ticket-primary text-xs self-start mt-2"
          >
            Register →
          </button>
        </div>
      )}
    </nav>
  );
}
