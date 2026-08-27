import { CONTACT_EMAIL, CONTACT_PHONE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: SITE_NAME,
    url: SITE_URL,
    email: CONTACT_EMAIL,
    description: SITE_DESCRIPTION,
    areaServed: [
      { '@type': 'City', name: 'Toronto' },
      { '@type': 'AdministrativeArea', name: 'Greater Toronto Area' },
    ],
    ...(CONTACT_PHONE ? { telephone: CONTACT_PHONE } : {}),
    priceRange: '$$',
    knowsAbout: ['Electrical repair', 'Plumbing', 'Carpentry', 'Home repair'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
