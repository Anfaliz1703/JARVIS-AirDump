const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PREFIX = 'jarvis-airdump-';

export function generateSessionCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join('');
}

export function normalizeSessionCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

export function peerIdFromCode(code: string): string {
  return `${PREFIX}${normalizeSessionCode(code).toLowerCase()}`;
}
