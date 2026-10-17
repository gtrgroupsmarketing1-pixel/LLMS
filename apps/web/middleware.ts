import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RESELLER_DOMAIN_HEADER = 'x-lmms-reseller';
const PRIMARY_COLOR_HEADER = 'x-lmms-primary-color';
const LOGO_URL_HEADER = 'x-lmms-logo-url';
const SUPPORT_EMAIL_HEADER = 'x-lmms-support-email';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (isLocal) {
    return NextResponse.next();
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/resellers/resolve?domain=${encodeURIComponent(hostname)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.next();
    const branding = (await res.json()) as {
      resellerId: string | null;
      resellerName: string | null;
      primaryColor: string;
      logoUrl: string | null;
      supportEmail: string | null;
    };

    if (!branding.resellerId) return NextResponse.next();

    const response = NextResponse.next();
    response.headers.set(RESELLER_DOMAIN_HEADER, branding.resellerId);
    response.headers.set(PRIMARY_COLOR_HEADER, branding.primaryColor);
    if (branding.logoUrl) response.headers.set(LOGO_URL_HEADER, branding.logoUrl);
    if (branding.supportEmail) response.headers.set(SUPPORT_EMAIL_HEADER, branding.supportEmail);
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico|manifest.json|sw.js|icons).*)'],
};
