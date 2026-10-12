export interface GeoPreset {
  key: string;
  label: string;
  labelAr: string;
  country: string;
  zones: string[];
}

export const GEO_PRESETS: GeoPreset[] = [
  {
    key: 'AE_DUBAI_CORE',
    label: 'Dubai — Core',
    labelAr: 'دبي — المركز',
    country: 'AE',
    zones: ['Downtown Dubai', 'Business Bay', 'DIFC', 'Jumeirah', 'Dubai Marina'],
  },
  {
    key: 'AE_ABU_DHABI_CORE',
    label: 'Abu Dhabi — Core',
    labelAr: 'أبوظبي — المركز',
    country: 'AE',
    zones: ['Al Reem Island', 'Khalifa City', 'Al Bateen', 'Yas Island'],
  },
  {
    key: 'SA_RIYADH_CORE',
    label: 'Riyadh — Core',
    labelAr: 'الرياض — المركز',
    country: 'SA',
    zones: ['Olaya', 'Al Malqa', 'Al Nakheel', 'King Fahd Road'],
  },
  {
    key: 'SA_JEDDAH_CORE',
    label: 'Jeddah — Core',
    labelAr: 'جدة — المركز',
    country: 'SA',
    zones: ['Al Rawdah', 'Al Hamra', 'Al Andalus'],
  },
  {
    key: 'KW_KUWAIT_CITY',
    label: 'Kuwait City',
    labelAr: 'مدينة الكويت',
    country: 'KW',
    zones: ['Salmiya', 'Salwa', 'Jabriya', 'Kuwait City'],
  },
  {
    key: 'QA_DOHA_CORE',
    label: 'Doha — Core',
    labelAr: 'الدوحة — المركز',
    country: 'QA',
    zones: ['West Bay', 'The Pearl', 'Al Sadd', 'Lusail'],
  },
  {
    key: 'BH_MANAMA_CORE',
    label: 'Manama — Core',
    labelAr: 'المنامة — المركز',
    country: 'BH',
    zones: ['Seef', 'Juffair', 'Adliya', 'Riffa'],
  },
  {
    key: 'OM_MUSCAT_CORE',
    label: 'Muscat — Core',
    labelAr: 'مسقط — المركز',
    country: 'OM',
    zones: ['Qurum', 'Al Khuwair', 'Ruwi', 'Al Mouj'],
  },
];

export function presetsForCountry(country: string): GeoPreset[] {
  return GEO_PRESETS.filter((g) => g.country === country);
}

export function getPreset(key: string): GeoPreset | undefined {
  return GEO_PRESETS.find((g) => g.key === key);
}
