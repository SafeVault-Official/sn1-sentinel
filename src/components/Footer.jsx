const Footer = () => (
  <footer className="border-t border-cyan-500/20 py-8">
    <div className="section-shell flex flex-col items-center justify-between gap-4 py-0 text-sm text-slate-400 sm:flex-row">
      <p>© 2026 SN1 Sentinel</p>
      <div className="flex items-center gap-4">
        {['Docs', 'GitHub', 'Contact', 'X'].map((item) => (
          <a key={item} href="#" className="transition hover:text-cyan-200">
            {item}
          </a>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
