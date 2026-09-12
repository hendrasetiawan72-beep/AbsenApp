/**
 * Management of approved / whitelisted Google accounts for SIM Presensi
 */

export const DEFAULT_ADMIN_WHATSAPP = '6285780660424';
export const DEFAULT_ADMIN_WHATSAPP_LINK = 'https://wa.me/6285780660424';

export const INITIAL_REGISTERED_EMAILS: string[] = [
  'hendra.alkindi@gmail.com',
  'admin@smkmuhbawang.sch.id',
  'guru@smkmuhbawang.sch.id',
  'smkmuhbawang@gmail.com',
];

const STORAGE_KEY = 'sim_whitelisted_google_emails';

/**
 * Retrieve registered emails from local storage or defaults
 */
export function getRegisteredEmails(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure defaults are always included
        const merged = Array.from(
          new Set([...INITIAL_REGISTERED_EMAILS, ...parsed.map((e) => String(e).trim().toLowerCase())])
        );
        return merged;
      }
    }
  } catch (err) {
    console.warn('Error reading registered emails:', err);
  }
  return [...INITIAL_REGISTERED_EMAILS];
}

/**
 * Check if a Google email is registered
 */
export function isEmailRegistered(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const list = getRegisteredEmails();
  
  // Exact match in whitelist
  if (list.includes(normalized)) return true;

  // Domain match for school domain
  if (normalized.endsWith('@smkmuhbawang.sch.id')) return true;

  return false;
}

/**
 * Add a new Google email to registered list
 */
export function addRegisteredEmail(email: string): string[] {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return getRegisteredEmails();

  const current = getRegisteredEmails();
  if (!current.includes(normalized)) {
    const updated = [...current, normalized];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save email to whitelist storage:', e);
    }
    return updated;
  }
  return current;
}

/**
 * Remove a Google email from registered list
 */
export function removeRegisteredEmail(email: string): string[] {
  const normalized = email.trim().toLowerCase();
  // Don't remove primary admin
  if (normalized === 'hendra.alkindi@gmail.com') return getRegisteredEmails();

  const current = getRegisteredEmails();
  const updated = current.filter((e) => e !== normalized);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save email to whitelist storage:', e);
  }
  return updated;
}
