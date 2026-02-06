import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

/**
 * Email validation with comprehensive checks
 */
export function validateEmail(email: string): { 
  valid: boolean; 
  error?: string 
} {
  const trimmed = email.trim();
  
  // Empty check
  if (!trimmed) {
    return { valid: false, error: 'Email is required' };
  }
  
  // Format check (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  // TLD check
  const tld = trimmed.split('.').pop();
  if (!tld || tld.length < 2) {
    return { valid: false, error: 'Please enter a valid email domain' };
  }
  
  // Optional: Block disposable email domains
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'throwaway.email'];
  const domain = trimmed.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { valid: false, error: 'Please use a permanent email address' };
  }
  
  return { valid: true };
}

/**
 * Phone validation using libphonenumber-js
 */
export function validatePhone(
  phone: string, 
  countryCode: string
): { 
  valid: boolean; 
  error?: string;
  formatted?: string;
} {
  const trimmed = phone.trim();
  
  // Empty check
  if (!trimmed) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Convert country code to ISO format (e.g., 'us' -> 'US')
  // Handle common variations
  let country: CountryCode | undefined;
  try {
    const normalizedCountryCode = countryCode.toUpperCase();
    // Try to use as CountryCode, fallback to 'US' if invalid
    country = normalizedCountryCode as CountryCode;
  } catch {
    country = 'US' as CountryCode;
  }
  
  try {
    // Parse and validate
    const phoneNumber = parsePhoneNumber(trimmed, country);
    
    if (!phoneNumber) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    if (!isValidPhoneNumber(trimmed, country)) {
      return { valid: false, error: `Please enter a valid ${country} phone number` };
    }
    
    // Return formatted number
    return { 
      valid: true, 
      formatted: phoneNumber.formatInternational() 
    };
  } catch (error) {
    // If parsing fails, try with default country
    try {
      const phoneNumber = parsePhoneNumber(trimmed, 'US');
      if (phoneNumber && isValidPhoneNumber(trimmed, 'US')) {
        return { 
          valid: true, 
          formatted: phoneNumber.formatInternational() 
        };
      }
    } catch {
      // Fall through to error
    }
    
    return { 
      valid: false, 
      error: 'Please enter a valid phone number' 
    };
  }
}
