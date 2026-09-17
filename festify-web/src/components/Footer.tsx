export default function Footer() {
  return (
    <footer
      id="footer"
      style={{ backgroundColor: '#152b38' }}
      className="py-16 px-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Top rule */}
        <div className="border-t border-cream/20 mb-12" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Wordmark */}
          <div>
            <p className="font-mono text-xs tracking-[0.3em] uppercase text-cream/40 mb-1">
              ✉ POSTMARKED FROM
            </p>
            <h2 className="font-display text-4xl text-cream leading-none">
              FESTIFY
            </h2>
            <p className="font-mono text-xs text-cream/40 mt-2 tracking-wider">
              THAPAR INSTITUTE · PATIALA · 2026
            </p>
          </div>

          {/* Closing statement */}
          <div className="max-w-xs">
            <p className="font-heading text-cream/70 text-base leading-relaxed italic">
              "Where every moment becomes a postmark in time."
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            {['About', 'Contact', 'Privacy', 'Help Desk'].map((l) => (
              <a
                key={l}
                href="#"
                className="font-mono text-xs tracking-widest uppercase text-cream/40
                           hover:text-cream/80 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom rule + fine print */}
        <div className="border-t border-cream/10 mt-12 pt-8">
          <p className="font-mono text-xs text-cream/25 tracking-wider text-center leading-relaxed">
            © 2026 FESTIFY POSTAL SERVICES · REG. NO. UCS-503P-2026 ·
            ALL RIGHTS RESERVED UNDER THE COLLEGE FEST MANAGEMENT ACT ·
            REPRODUCTION IN WHOLE OR IN PART WITHOUT WRITTEN PERMISSION IS PROHIBITED ·
            DELIVERY NOT GUARANTEED AFTER REGISTERED DEADLINE
          </p>
        </div>
      </div>
    </footer>
  );
}
