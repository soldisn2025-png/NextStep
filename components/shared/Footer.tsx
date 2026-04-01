'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isMobileIntakeRoute = pathname?.startsWith('/intake');

  return (
    <footer className={`mt-auto py-6 px-4 text-center ${isMobileIntakeRoute ? 'hidden lg:block' : ''}`}>
      <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
        NextStep provides general guidance only and is not a substitute for professional
        medical or therapeutic advice.
      </p>
    </footer>
  );
}
