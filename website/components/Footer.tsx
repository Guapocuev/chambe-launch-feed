import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <div className="text-lg font-bold text-brand">Chambé</div>
            <p className="mt-2 text-sm text-foreground/70">
              Trusted contractors for the Toronto &amp; GTA, matched by AI, vetted by us.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/about" className="hover:text-brand">About</Link></li>
              <li><Link href="/how-it-works" className="hover:text-brand">How It Works</Link></li>
              <li><Link href="/gallery" className="hover:text-brand">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-brand">Contact</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Get Started</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/get-a-quote" className="hover:text-brand">Request a Job</Link></li>
              <li><Link href="/apply" className="hover:text-brand">Become a Contractor</Link></li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li><Link href="/privacy" className="hover:text-brand">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-foreground/50">
          © {new Date().getFullYear()} Chambé. Serving Toronto &amp; the GTA.
        </div>
      </div>
    </footer>
  );
}
