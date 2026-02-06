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
  
  // Format check (RFC 5322 simplified) - must have local part, @, domain, and TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  // Split to check parts
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  const [localPart, domain] = parts;
  
  // Local part must not be empty
  if (!localPart || localPart.length === 0) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  // Domain must exist and have TLD
  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  // TLD check - must be at least 2 characters
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) {
    return { valid: false, error: 'Please enter a valid email domain' };
  }
  
  // Domain must have at least one dot (for TLD separation)
  if (!domain.includes('.')) {
    return { valid: false, error: 'Please enter a valid email domain' };
  }
  
  // Optional: Block disposable email domains
  const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com', 'throwaway.email'];
  const domainLower = domain.toLowerCase();
  if (disposableDomains.includes(domainLower)) {
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
  
  // Basic format check before libphonenumber-js parsing
  // Must contain at least some digits
  const digitCount = trimmed.replace(/\D/g, '').length;
  if (digitCount < 7) {
    return { valid: false, error: 'Phone number is too short' };
  }
  if (digitCount > 15) {
    return { valid: false, error: 'Phone number is too long' };
  }
  
  try {
    // Parse and validate using libphonenumber-js
    const phoneNumber = parsePhoneNumber(trimmed, country);
    
    if (!phoneNumber) {
      return { valid: false, error: 'Please enter a valid phone number' };
    }
    
    // Strict validation - must be a valid phone number for the country
    if (!isValidPhoneNumber(trimmed, country)) {
      return { valid: false, error: `Please enter a valid ${country} phone number` };
    }
    
    // Additional check: ensure the number is possible (not just valid format)
    // This catches fake numbers like 111-111-1111
    if (!phoneNumber.isPossible()) {
      return { valid: false, error: 'This phone number is not valid' };
    }
    
    // Return formatted number
    return { 
      valid: true, 
      formatted: phoneNumber.formatInternational() 
    };
  } catch (error) {
    // Don't fallback to US - if parsing fails, it's invalid
    return { 
      valid: false, 
      error: 'Please enter a valid phone number' 
    };
  }
}
