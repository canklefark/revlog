const US_ZIP = /\b(\d{5})(?:-\d{4})?\b/;
const CA_POSTAL = /\b([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)\b/;

/** Extract a US 5-digit zip or Canadian 6-char postal code from a free-form address string. */
export function extractPostalCode(address: string): string | null {
  const us = address.match(US_ZIP);
  if (us) return us[1]!;

  const ca = address.match(CA_POSTAL);
  if (ca) return `${ca[1]}${ca[2]}`.toUpperCase();

  return null;
}
