const SectionTitle = ({ eyebrow, title, subtitle, centered = true }) => (
  <div className={`space-y-4 ${centered ? 'text-center' : ''}`}>
    <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">{eyebrow}</p>
    <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h2>
    {subtitle ? <p className="mx-auto max-w-3xl text-slate-300">{subtitle}</p> : null}
  </div>
);

export default SectionTitle;
