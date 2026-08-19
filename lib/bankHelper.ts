/**
 * Bank Details & IFSC Validation and Masking Helper
 */

export function maskAccountNumber(accountNumber?: string | null): string {
  if (!accountNumber) return "••••••••••••";
  const clean = accountNumber.toString().trim().replace(/\s+/g, "");
  if (clean.length <= 4) return `••••${clean}`;
  const last4 = clean.slice(-4);
  return `••••••••${last4}`;
}

export function validateIfsc(ifsc?: string | null): { isValid: boolean; error?: string } {
  if (!ifsc || !ifsc.trim()) {
    return { isValid: false, error: "IFSC Code is required." };
  }
  const clean = ifsc.trim().toUpperCase();
  // Standard Indian Banking IFSC format: 4 letters, 0, 6 alphanumeric chars (e.g. HDFC0001234, SBIN0001001)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(clean)) {
    return {
      isValid: false,
      error: "Invalid IFSC Code format (e.g. SBIN0001001 or HDFC0001234). Must be 11 characters starting with 4 alphabets followed by 0.",
    };
  }
  return { isValid: true };
}

export function validateBankDetails(data: {
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
}): { isValid: boolean; error?: string } {
  if (!data.accountHolderName || !data.accountHolderName.trim()) {
    return { isValid: false, error: "Account Holder Name is required." };
  }
  if (!data.bankName || !data.bankName.trim()) {
    return { isValid: false, error: "Bank Name is required." };
  }
  if (!data.accountNumber || !data.accountNumber.trim()) {
    return { isValid: false, error: "Account Number is required." };
  }
  const cleanAcc = data.accountNumber.trim().replace(/\s+/g, "");
  if (cleanAcc.length < 8 || cleanAcc.length > 20 || !/^\d+$/.test(cleanAcc)) {
    return {
      isValid: false,
      error: "Account Number must be between 8 and 20 numeric digits.",
    };
  }
  return validateIfsc(data.ifscCode);
}
