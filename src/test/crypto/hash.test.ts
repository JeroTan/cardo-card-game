import { describe, it, expect } from 'vitest';
import { hash, verifyHash } from '@/lib/crypto/hash';

describe('hash and verifyHash', () => {
  it('should hash the string "12345678"', async () => {
    const hashed = await hash('12345678');
    
    // Should be in salt$hash format
    expect(hashed).toContain('$');
    expect(hashed.split('$')).toHaveLength(2);
    
    // Salt should be 32 hex chars (16 bytes), hash should be 64 hex chars (32 bytes SHA-256)
    const [salt, hashPart] = hashed.split('$');
    expect(salt).toHaveLength(32);
    expect(hashPart).toHaveLength(64);
  });

  it('should produce different hashes for the same input "12345678"', async () => {
    const hash1 = await hash('12345678');
    const hash2 = await hash('12345678');
    
    // Both should be valid format
    expect(hash1).toContain('$');
    expect(hash2).toContain('$');
    
    // But they should be different due to different salts
    expect(hash1).not.toBe(hash2);
  });

  it('should verify the hash of "12345678" correctly', async () => {
    const password = '12345678';
    const hashed = await hash(password);
    
    // Verification should succeed
    const isValid = await verifyHash(password, hashed);
    expect(isValid).toBe(true);
    
    // Wrong password should fail
    const isInvalid = await verifyHash('wrongpassword', hashed);
    expect(isInvalid).toBe(false);
  });

  it('should hash the string "asdfQWER1234)!@#*()"', async () => {
    const complexPassword = 'asdfQWER1234)!@#*()';
    const hashed = await hash(complexPassword);
    
    // Should be in salt$hash format
    expect(hashed).toContain('$');
    const [salt, hashPart] = hashed.split('$');
    expect(salt).toHaveLength(32);
    expect(hashPart).toHaveLength(64);
  });

  it('should verify the hash of "asdfQWER1234)!@#*()" correctly', async () => {
    const complexPassword = 'asdfQWER1234)!@#*()';
    const hashed = await hash(complexPassword);
    
    // Verification should succeed
    const isValid = await verifyHash(complexPassword, hashed);
    expect(isValid).toBe(true);
    
    // Wrong password should fail
    const isInvalid = await verifyHash('asdfQWER1234)!@#*(', hashed); // Missing last char
    expect(isInvalid).toBe(false);
  });

  it('should verify legacy unsalted hashes (backward compatibility)', async () => {
    // Simulate an old unsalted hash (plain SHA-256 of "12345678")
    const legacyHash = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f';
    
    // Should still verify correctly
    const isValid = await verifyHash('12345678', legacyHash);
    expect(isValid).toBe(true);
    
    // Wrong password should fail
    const isInvalid = await verifyHash('wrongpassword', legacyHash);
    expect(isInvalid).toBe(false);
  });
});
