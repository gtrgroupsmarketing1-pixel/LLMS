export interface ModuleDef {
  key: string;
  name: string;
  description: string;
  isCore: boolean;
  dependencies: string[];
}

export const MODULE_CATALOG: ModuleDef[] = [
  {
    key: 'TENANT_MANAGEMENT',
    name: 'Tenant Management',
    description: 'Core tenant settings, billing, and users',
    isCore: true,
    dependencies: [],
  },
  {
    key: 'CLIENT_PORTAL',
    name: 'Client Portal',
    description: 'Client-facing PWA for approvals and reports',
    isCore: true,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'COMPLIANCE',
    name: 'Consent & Compliance',
    description: 'GDPR/PDPL engine, opt-outs, audit log',
    isCore: true,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'CAMPAIGNS',
    name: 'WhatsApp Campaigns',
    description: 'Send broadcasts and track attribution',
    isCore: true,
    dependencies: ['COMPLIANCE'],
  },
  {
    key: 'JOURNEY_BUILDER',
    name: 'Journey Builder',
    description: 'Visual automation builder',
    isCore: false,
    dependencies: ['CAMPAIGNS'],
  },
  {
    key: 'ADS_MANAGEMENT',
    name: 'Ads Management',
    description: 'Meta and Google Ads integration',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'WEBSITE_BUILDER',
    name: 'Website Builder',
    description: 'Public landing pages and lead capture',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT', 'CLIENT_PORTAL'],
  },
  {
    key: 'B2B_PIPELINE',
    name: 'B2B Commercial',
    description: 'Track wholesale prospects and contracts',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'REVIEWS',
    name: 'Reviews Management',
    description: 'Google Business Profile sync and replies',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'BRAND_HUB',
    name: 'Brand & Asset Hub',
    description: 'Manage logos, fonts, and usage rights',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT'],
  },
  {
    key: 'CONTENT_CALENDAR',
    name: 'Content Calendar',
    description: 'Bilingual content approval workflow',
    isCore: false,
    dependencies: ['TENANT_MANAGEMENT'],
  },
];

export function getModuleDef(key: string): ModuleDef | undefined {
  return MODULE_CATALOG.find((m) => m.key === key);
}
