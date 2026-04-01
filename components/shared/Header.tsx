'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthMenu from './AuthMenu';

export default function Header() {
  const pathname = usePathname();
  const isMobileIntakeRoute = pathname?.startsWith('/intake');

  return (
    <header
      className={`bg-white border-b border-gray-100 sticky top-0 z-10 ${
        isMobileIntakeRoute ? 'hidden lg:block' : ''
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-heading text-xl text-primary font-semibold tracking-tight"
          aria-label="NextStep home"
        >
          NextStep
        </Link>
        <AuthMenu />
      </div>
    </header>
  );
}
