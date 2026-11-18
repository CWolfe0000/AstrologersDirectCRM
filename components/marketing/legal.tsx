
export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: { h: string; p: string }[] }) {
  return (
    <div className="container max-w-3xl py-16 md:py-24">
      <p className="eyebrow mb-3 text-accent">Legal</p>
      <h1 className="font-serif text-[40px] leading-tight text-ink md:text-[52px]">{title}</h1>
      <p className="mt-2 text-[13px] text-muted">Last updated {updated}</p>
      <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 text-[13.5px] text-muted">These terms cover the private beta. We’ll publish updated versions before general availability and tell you about any changes.</p>
      <div className="mt-10 space-y-8">
        {sections.map((s, i) => (
          <section key={s.h}>
            <h2 className="text-[17px] font-semibold text-ink">
              {i + 1}. {s.h}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-3">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
