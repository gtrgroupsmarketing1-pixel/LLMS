export interface DirectoryRequirement {
  country: 'AE' | 'SA' | 'KW' | 'QA' | 'BH' | 'OM';
  platformName: string;
  platformUrl?: string;
  required: boolean;
  notes?: string;
}

export const GCC_DIRECTORY_REQUIREMENTS: DirectoryRequirement[] = [
  { country: 'AE', platformName: 'Google Business Profile', required: true },
  { country: 'AE', platformName: 'Yellow Pages UAE', platformUrl: 'https://www.yellowpages.ae', required: true },
  { country: 'AE', platformName: 'Dubai Chamber Directory', required: false },
  { country: 'SA', platformName: 'Google Business Profile', required: true },
  { country: 'SA', platformName: 'Yellow Pages Saudi', required: true },
  { country: 'SA', platformName: 'Maroof (Ministry of Commerce)', platformUrl: 'https://maroof.sa', required: true, notes: 'Regulatory — Saudi only' },
  { country: 'KW', platformName: 'Google Business Profile', required: true },
  { country: 'KW', platformName: 'Kuwait Yellow Pages', required: true },
  { country: 'QA', platformName: 'Google Business Profile', required: true },
  { country: 'QA', platformName: 'Qatar Yellow Pages', required: true },
  { country: 'BH', platformName: 'Google Business Profile', required: true },
  { country: 'BH', platformName: 'Bahrain Yellow Pages', required: true },
  { country: 'OM', platformName: 'Google Business Profile', required: true },
  { country: 'OM', platformName: 'Oman Yellow Pages', required: true },
];

export function requirementsForCountry(country: string): DirectoryRequirement[] {
  return GCC_DIRECTORY_REQUIREMENTS.filter((d) => d.country === country);
}
