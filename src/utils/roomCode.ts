/**
 * Generate a 6-character alphanumeric room code
 * Format: A-Z and 0-9 (e.g., "A7K2M9")
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Use crypto for better randomness
  const randomValues = new Uint8Array(6);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 6; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  
  return code;
}

/**
 * Validate room code format
 * Must be exactly 6 alphanumeric characters
 */
export function validateRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Must be exactly 6 characters, alphanumeric only
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code.toUpperCase());
}

/**
 * Normalize room code (uppercase, trim)
 */
export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}
