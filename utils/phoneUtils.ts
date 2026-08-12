/**
 * Indian Mobile Phone Number Validator & Formatter Utility
 * Valid Indian mobile numbers are exactly 10 digits starting with 6, 7, 8, or 9.
 */

export function cleanIndianPhoneDigits(input: string): string {
  if (!input) return "";
  // Strip all non-digit characters
  const digits = input.replace(/\D/g, "");
  // If user included +91 or 91 country code prefix, strip it down to 10 digits
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  // Enforce maximum of 10 digits
  return digits.slice(0, 10);
}

export function formatIndianPhone(phone: string | null | undefined): string {
  if (!phone) return "+91 98765 43210";
  const digits = cleanIndianPhoneDigits(phone);
  
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length > 0) {
    return `+91 ${digits}`;
  }
  return "+91 98765 43210";
}

export function isValidIndianPhone(phone: string): boolean {
  const digits = cleanIndianPhoneDigits(phone);
  // Valid Indian mobile numbers are 10 digits long and start with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(digits);
}
