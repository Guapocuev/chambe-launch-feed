export interface LegalSectionData {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

/** Renders a legal page's section list — same shape for /privacy and /terms. */
export function LegalContent({ sections }: { sections: LegalSectionData[] }) {
  return (
    <div className="mt-10 space-y-8">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs?.map((paragraph, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-foreground/75">
              {paragraph}
            </p>
          ))}
          {section.list && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/75">
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
