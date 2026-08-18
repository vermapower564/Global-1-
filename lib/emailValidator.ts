/**
 * Helper utility for strict @gmail.com email validation & normalization
 */

// Regex: Must contain valid local part + exact @gmail.com domain (case insensitive)
export const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  error?: string;
}

/**
 * Validates and normalizes a given email string to ensure it ends strictly with @gmail.com
 */
export function validateAndNormalizeGmail(emailInput: string | null | undefined): EmailValidationResult {
  if (!emailInput || typeof emailInput !== "string") {
    return {
      isValid: false,
      normalizedEmail: "",
      error: "Please enter your email address.",
    };
  }

  // 1. Trim whitespace
  const trimmed = emailInput.trim();

  if (!trimmed) {
    return {
      isValid: false,
      normalizedEmail: "",
      error: "Please enter your email address.",
    };
  }

  // 2. Reject spaces inside email
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedEmail: "",
      error: "Email address cannot contain spaces.",
    };
  }

  // 3. Normalize to lowercase
  const normalized = trimmed.toLowerCase();

  // 4. Test against strict Gmail Regex pattern
  if (!GMAIL_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedEmail: normalized,
      error: "Only Gmail addresses ending with @gmail.com are allowed.",
    };
  }

  return {
    isValid: true,
    normalizedEmail: normalized,
  };
}
