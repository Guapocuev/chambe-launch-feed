import { getTranslations } from 'next-intl/server';

export async function ContractorSupport() {
  const t = await getTranslations('Apply');

  const tiers = [
    {
      name: t('supportBasicName'),
      badge: t('supportBasicBadge'),
      body: t('supportBasicBody'),
    },
    {
      name: t('supportAssistName'),
      badge: t('supportAssistBadge'),
      body: t('supportAssistBody'),
    },
    {
      name: t('supportConciergeName'),
      badge: t('supportConciergeBadge'),
      body: t('supportConciergeBody'),
      note: t('supportConciergeNote'),
      cta: t('supportConciergeCta'),
    },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t('supportTitle')}</h2>
      <p className="mt-3 text-base leading-relaxed text-foreground/70">{t('supportIntro')}</p>
      <div className="mt-6 grid gap-4">
        {tiers.map((tier) => (
          <article key={tier.name} className="rounded-2xl border border-border bg-surface px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{tier.badge}</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">{tier.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/75">{tier.body}</p>
            {tier.note ? <p className="mt-2 text-xs text-foreground/55">{tier.note}</p> : null}
            {tier.cta ? (
              <a
                href="#apply"
                className="mt-4 inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-brand hover:text-brand"
              >
                {tier.cta}
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
