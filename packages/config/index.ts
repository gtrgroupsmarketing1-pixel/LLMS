export const APP_NAME = 'LMMS';
export const DEFAULT_LOCALE = 'ar';
export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const OPERATING_MODES = ['ERP_CONNECTED', 'STANDALONE', 'UPGRADING'] as const;
export type OperatingMode = (typeof OPERATING_MODES)[number];

export const GCC_COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', regulator: 'TDRA' },
  { code: 'SA', name: 'Saudi Arabia',         currency: 'SAR', regulator: 'CST' },
  { code: 'KW', name: 'Kuwait',               currency: 'KWD', regulator: 'CITRA' },
  { code: 'QA', name: 'Qatar',                currency: 'QAR', regulator: 'CRA' },
  { code: 'BH', name: 'Bahrain',              currency: 'BHD', regulator: 'TRA' },
  { code: 'OM', name: 'Oman',                 currency: 'OMR', regulator: 'TRA' },
] as const;
export type CountryCode = (typeof GCC_COUNTRIES)[number]['code'];

export const PACKAGES = ['LAUNCH', 'GROWTH', 'DOMINATE'] as const;
export type PackageTier = (typeof PACKAGES)[number];
