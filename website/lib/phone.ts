/** Strip to digits and format as (XXX) XXX-XXXX for Canadian/US numbers. */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function phoneDigitCount(value: string): number {
  return value.replace(/\D/g, '').length;
}

export function isValidPhone(value: string): boolean {
  return phoneDigitCount(value) >= 10;
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidName(value: string): boolean {
  return value.trim().length >= 2;
}
