/** Longueur minimale des chiffres (ex. numéro local ou indicatif + numéro) */
const WHATSAPP_MIN_DIGITS = 7;

export function phoneDigitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppHref(
  phone: string,
  prefilledText?: string
): string | null {
  const digits = phoneDigitsOnly(phone);
  if (digits.length < WHATSAPP_MIN_DIGITS) return null;
  const base = `https://wa.me/${digits}`;
  const text = prefilledText?.trim();
  if (text) return `${base}?text=${encodeURIComponent(text)}`;
  return base;
}

export const WHATSAPP_DEFAULT_MESSAGE =
  "Bonjour , est ce que l'article est toujours disponible ?";
