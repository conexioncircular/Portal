type Item = { label: string; href: string };
export default function CtaMatrix({ items }: { items: Item[] }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              className="rounded-lg border px-4 py-4 text-center text-sm font-semibold text-slate-800 hover:shadow-sm focus:outline-none focus-visible:ring-2"
            >
              {it.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
