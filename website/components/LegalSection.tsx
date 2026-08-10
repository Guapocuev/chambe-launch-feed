export function LegalSection({
  title,
  placeholder,
}: {
  title: string;
  placeholder: string;
}) {
  return (
    <section className="border-b border-border py-6 last:border-b-0">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm italic text-foreground/50">[Placeholder — {placeholder}]</p>
    </section>
  );
}
