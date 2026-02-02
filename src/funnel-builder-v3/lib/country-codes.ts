import { CountryCode } from '@/funnel-builder-v3/types/funnel';

// Comprehensive list of country codes with flags
export const allCountryCodes: CountryCode[] = [
  // North America
  { id: 'us', code: '+1', name: 'United States', flag: '🇺🇸' },
  { id: 'ca', code: '+1', name: 'Canada', flag: '🇨🇦' },
  { id: 'mx', code: '+52', name: 'Mexico', flag: '🇲🇽' },
  
  // Europe
  { id: 'uk', code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'de', code: '+49', name: 'Germany', flag: '🇩🇪' },
  { id: 'fr', code: '+33', name: 'France', flag: '🇫🇷' },
  { id: 'it', code: '+39', name: 'Italy', flag: '🇮🇹' },
  { id: 'es', code: '+34', name: 'Spain', flag: '🇪🇸' },
  { id: 'nl', code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { id: 'se', code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { id: 'no', code: '+47', name: 'Norway', flag: '🇳🇴' },
  { id: 'dk', code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { id: 'fi', code: '+358', name: 'Finland', flag: '🇫🇮' },
  { id: 'pl', code: '+48', name: 'Poland', flag: '🇵🇱' },
  { id: 'ie', code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { id: 'ch', code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { id: 'at', code: '+43', name: 'Austria', flag: '🇦🇹' },
  { id: 'be', code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { id: 'pt', code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { id: 'gr', code: '+30', name: 'Greece', flag: '🇬🇷' },
  { id: 'cz', code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { id: 'ro', code: '+40', name: 'Romania', flag: '🇷🇴' },
  
  // Asia
  { id: 'in', code: '+91', name: 'India', flag: '🇮🇳' },
  { id: 'cn', code: '+86', name: 'China', flag: '🇨🇳' },
  { id: 'jp', code: '+81', name: 'Japan', flag: '🇯🇵' },
  { id: 'kr', code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { id: 'sg', code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { id: 'my', code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { id: 'th', code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { id: 'ph', code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { id: 'id', code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { id: 'vn', code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { id: 'pk', code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { id: 'bd', code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { id: 'ae', code: '+971', name: 'United Arab Emirates', flag: '🇦🇪' },
  { id: 'sa', code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'il', code: '+972', name: 'Israel', flag: '🇮🇱' },
  { id: 'tr', code: '+90', name: 'Turkey', flag: '🇹🇷' },
  
  // Oceania
  { id: 'au', code: '+61', name: 'Australia', flag: '🇦🇺' },
  { id: 'nz', code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  
  // South America
  { id: 'br', code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { id: 'ar', code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { id: 'co', code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { id: 'cl', code: '+56', name: 'Chile', flag: '🇨🇱' },
  { id: 'pe', code: '+51', name: 'Peru', flag: '🇵🇪' },
  
  // Africa
  { id: 'za', code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { id: 'eg', code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { id: 'ng', code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { id: 'ke', code: '+254', name: 'Kenya', flag: '🇰🇪' },
];

// Popular countries (most commonly used)
export const popularCountryCodes: CountryCode[] = [
  { id: 'us', code: '+1', name: 'United States', flag: '🇺🇸' },
  { id: 'ca', code: '+1', name: 'Canada', flag: '🇨🇦' },
  { id: 'uk', code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'in', code: '+91', name: 'India', flag: '🇮🇳' },
  { id: 'au', code: '+61', name: 'Australia', flag: '🇦🇺' },
  { id: 'de', code: '+49', name: 'Germany', flag: '🇩🇪' },
  { id: 'fr', code: '+33', name: 'France', flag: '🇫🇷' },
  { id: 'jp', code: '+81', name: 'Japan', flag: '🇯🇵' },
  { id: 'cn', code: '+86', name: 'China', flag: '🇨🇳' },
  { id: 'br', code: '+55', name: 'Brazil', flag: '🇧🇷' },
];
