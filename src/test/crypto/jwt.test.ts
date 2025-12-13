import { describe, it, expect } from 'vitest';
import { jwtEncrypt, jwtDecrypt } from '@/lib/crypto/jwt';

describe('jwtEncrypt and jwtDecrypt', () => {
  const SECRET_ADMIN_JWT_SECRET_KEY = process.env.SECRET_ADMIN_JWT_SECRET_KEY || 'test-secret-fallback';
  it('should encrypt a JWT using "123456" as secret with payload {userId: 123456}', async () => {
    const result = await jwtEncrypt({
      payload: { userId: 123456 },
      secretKey: '123456'
    });
    
    expect(result.error).toBe(null);
    expect(result.data).toBeTruthy();
    expect(typeof result.data).toBe('string');
    expect(result.data?.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('should decrypt the JWT and get the same payload back', async () => {
    const encrypted = await jwtEncrypt({
      payload: { userId: 123456 },
      secretKey: '123456'
    });
    
    expect(encrypted.error).toBe(null);
    expect(encrypted.data).toBeTruthy();
    
    const decrypted = await jwtDecrypt<{ userId: number }>({
      token: encrypted.data!,
      secretKey: '123456'
    });
    
    expect(decrypted.error).toBe(null);
    expect(decrypted.data).toBeTruthy();
    expect(decrypted.data?.userId).toBe(123456);
  });

  it('should fail to decrypt random data', async () => {
    const randomToken = 'random.invalid.token';
    
    const result = await jwtDecrypt({
      token: randomToken,
      secretKey: '123456'
    });
    
    expect(result.error).not.toBe(null);
    expect(result.data).toBe(null);
  });

  it('should encrypt using SECRET_ADMIN_JWT_SECRET_KEY as secret key with payload {userId: 123456}', async () => {
    const result = await jwtEncrypt({
      payload: { userId: 123456 },
      secretKey: SECRET_ADMIN_JWT_SECRET_KEY
    });
    
    expect(result.error).toBe(null);
    expect(result.data).toBeTruthy();
    expect(typeof result.data).toBe('string');
  });

  it('should decrypt the JWT with SECRET_ADMIN_JWT_SECRET_KEY', async () => {
    const encrypted = await jwtEncrypt({
      payload: { userId: 123456 },
      secretKey: SECRET_ADMIN_JWT_SECRET_KEY
    });
    
    expect(encrypted.error).toBe(null);
    
    const decrypted = await jwtDecrypt<{ userId: number }>({
      token: encrypted.data!,
      secretKey: SECRET_ADMIN_JWT_SECRET_KEY
    });
    
    expect(decrypted.error).toBe(null);
    expect(decrypted.data?.userId).toBe(123456);
  });

  it('should fail to decrypt with wrong secret key "123456"', async () => {
    const encrypted = await jwtEncrypt({
      payload: { userId: 123456 },
      secretKey: SECRET_ADMIN_JWT_SECRET_KEY
    });
    
    expect(encrypted.error).toBe(null);
    
    const decrypted = await jwtDecrypt({
      token: encrypted.data!,
      secretKey: '123456'
    });
    
    expect(decrypted.error).not.toBe(null);
    expect(decrypted.data).toBe(null);
  });

  it('should encrypt with payload {userId: "example"} with 3 seconds expiration', async () => {
    const result = await jwtEncrypt({
      payload: { userId: 'example' },
      secretKey: '123456',
      expiresInSeconds: 3
    });
    
    expect(result.error).toBe(null);
    expect(result.data).toBeTruthy();
  });

  it('should decrypt within 3 seconds without error', async () => {
    const encrypted = await jwtEncrypt({
      payload: { userId: 'example' },
      secretKey: '123456',
      expiresInSeconds: 3
    });
    
    expect(encrypted.error).toBe(null);
    
    // Decrypt immediately (within 3 seconds)
    const decrypted = await jwtDecrypt<{ userId: string }>({
      token: encrypted.data!,
      secretKey: '123456'
    });
    
    expect(decrypted.error).toBe(null);
    expect(decrypted.data?.userId).toBe('example');
  });

  it('should fail to decrypt after 3 seconds (token expired)', async () => {
    const encrypted = await jwtEncrypt({
      payload: { userId: 'example' },
      secretKey: '123456',
      expiresInSeconds: 3
    });
    
    expect(encrypted.error).toBe(null);
    
    // Wait for 3.5 seconds for token to expire
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    const decrypted = await jwtDecrypt({
      token: encrypted.data!,
      secretKey: '123456'
    });
    
    expect(decrypted.error).not.toBe(null);
    expect(decrypted.data).toBe(null);
    expect(decrypted.error).toContain('expired');
  });
});


