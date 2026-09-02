export const HONEYPOT_FIELD = 'chambe_hp';

export function honeypotFilled(formData: FormData): boolean {
  return String(formData.get(HONEYPOT_FIELD) ?? '').trim().length > 0;
}
