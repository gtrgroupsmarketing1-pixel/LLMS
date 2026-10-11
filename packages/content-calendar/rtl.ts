const RTL_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function isRtl(text: string | null | undefined): boolean {
  if (!text) return false;
  return RTL_RE.test(text);
}

export interface BilingualCopy {
  ar: { text: string | null; dir: 'rtl' | 'ltr'; isRtl: boolean };
  en: { text: string | null; dir: 'rtl' | 'ltr'; isRtl: boolean };
}

export function bilingualCopy(
  copyAr: string | null,
  copyEn: string | null,
): BilingualCopy {
  const arIsRtl = isRtl(copyAr);
  const enIsRtl = isRtl(copyEn);
  return {
    ar: { text: copyAr, dir: arIsRtl ? 'rtl' : 'ltr', isRtl: arIsRtl },
    en: { text: copyEn, dir: enIsRtl ? 'rtl' : 'ltr', isRtl: enIsRtl },
  };
}
