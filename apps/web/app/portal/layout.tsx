'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@lmms/ui';
import { getAccessToken } from '../../lib/portal/session';

const NAV = [
  { href: '/portal', labelAr: 'الرئيسية', labelEn: 'Home', icon: '🏠' },
  { href: '/portal/approvals', labelAr: 'الموافقات', labelEn: 'Approvals', icon: '✅' },
  { href: '/portal/campaigns', labelAr: 'الحملات', labelEn: 'Campaigns', icon: '📣' },
  { href: '/portal/calendar', labelAr: 'التقويم', labelEn: 'Calendar', icon: '📅' },
  { href: '/portal/brand', labelAr: 'الهوية', labelEn: 'Brand', icon: '🎨' },
  { href: '/portal/reviews', labelAr: 'التقييمات', labelEn: 'Reviews', icon: '⭐' },
  { href: '/portal/messages', labelAr: 'الرسائل', labelEn: 'Messages', icon: '💬' },
  { href: '/portal/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: '📊' },
  { href: '/portal/invoices', labelAr: 'الفواتير', labelEn: 'Invoices', icon: '🧾' },
  { href: '/portal/data-sources', labelAr: 'البيانات', labelEn: 'Data', icon: '🗄️' },
  { href: '/portal/support', labelAr: 'الدعم', labelEn: 'Support', icon: '🆘' },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    if (pathname === '/portal/login') return;
    if (!getAccessToken()) {
      window.location.href = '/portal/login';
      return;
    }
    const stored = (localStorage.getItem('lmms.lang') as 'ar' | 'en') ?? 'ar';
    setLang(stored);
    document.documentElement.lang = stored;
    document.documentElement.dir = stored === 'ar' ? 'rtl' : 'ltr';
  }, [pathname]);

  if (pathname === '/portal/login') return <>{children}</>;

  function toggleLang() {
    const next = lang === 'ar' ? 'en' : 'ar';
    setLang(next);
    localStorage.setItem('lmms.lang', next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
        <strong>LMMS</strong>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLang}
          className="border-slate-600 bg-transparent text-white hover:bg-slate-800"
        >
          {lang === 'ar' ? 'EN' : 'ع'}
        </Button>
      </header>

      <div className="flex-1 pb-20">{children}</div>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex overflow-x-auto border-t border-slate-200 bg-white">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 basis-1/5 flex-col items-center px-2 py-2 text-[10px] no-underline ${
                active ? 'font-bold text-slate-900' : 'text-slate-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{lang === 'ar' ? item.labelAr : item.labelEn}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
