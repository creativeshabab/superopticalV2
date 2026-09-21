import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  loginSchema,
  slugSchema,
  passwordSchema,
  createTenantSchema,
  createStoreSchema,
  updateUserStatusSchema,
} from '@super-optical/validation';

describe('Unit Tests: Validation Schemas & Hashing Logic', () => {
  describe('Zod Validation Schemas', () => {
    it('loginSchema validates properly and normalizes email', () => {
      const valid = loginSchema.parse({
        email: ' ADMIN@SuperOptical.com ',
        password: 'SecurePassword123!',
      });
      expect(valid.email).toBe('admin@superoptical.com');
      expect(valid.password).toBe('SecurePassword123!');

      expect(() =>
        loginSchema.parse({ email: 'not-an-email', password: '123' })
      ).toThrow();
    });

    it('slugSchema enforces lowercase alphanumeric with hyphens', () => {
      expect(slugSchema.parse('super-optical-bihar')).toBe('super-optical-bihar');
      expect(slugSchema.parse('store1')).toBe('store1');

      expect(() => slugSchema.parse('Super_Optical')).toThrow();
      expect(() => slugSchema.parse('has spaces')).toThrow();
      expect(() => slugSchema.parse('a')).toThrow(); // min 2 chars
    });

    it('passwordSchema enforces complexity requirements', () => {
      expect(passwordSchema.parse('StrongP@ss1')).toBe('StrongP@ss1');

      expect(() => passwordSchema.parse('short1!')).toThrow(); // < 8 chars
      expect(() => passwordSchema.parse('alllowercase1!')).toThrow(); // missing uppercase
      expect(() => passwordSchema.parse('ALLUPPERCASE1!')).toThrow(); // missing lowercase
      expect(() => passwordSchema.parse('NoSpecialChar1')).toThrow(); // missing special char
      expect(() => passwordSchema.parse('NoNumbers!@#$')).toThrow(); // missing number
    });

    it('createTenantSchema validates tenant creation payload', () => {
      const payload = {
        name: 'Super Optical Kolkata',
        slug: 'super-optical-kolkata',
        code: 'SOK',
        planTier: 'Enterprise',
      };
      const result = createTenantSchema.parse(payload);
      expect(result.name).toBe('Super Optical Kolkata');
      expect(result.code).toBe('SOK');

      expect(() =>
        createTenantSchema.parse({ name: 'A', slug: 'invalid slug', code: 'sok' })
      ).toThrow();
    });

    it('createStoreSchema forces uppercase store code', () => {
      const result = createStoreSchema.parse({
        name: 'Patna Central Branch',
        code: 'pat-01',
      });
      expect(result.code).toBe('PAT-01');
    });

    it('updateUserStatusSchema accepts valid enum statuses only', () => {
      expect(updateUserStatusSchema.parse({ status: 'ACTIVE' })).toEqual({ status: 'ACTIVE' });
      expect(updateUserStatusSchema.parse({ status: 'DISABLED' })).toEqual({ status: 'DISABLED' });
      expect(updateUserStatusSchema.parse({ status: 'SUSPENDED' })).toEqual({ status: 'SUSPENDED' });

      expect(() => updateUserStatusSchema.parse({ status: 'DELETED' })).toThrow();
    });
  });

  describe('Cryptographic Token Hashing', () => {
    it('generates reproducible SHA-256 digests for refresh tokens', () => {
      const rawToken = '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
      const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
      const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(rawToken);
    });

    it('distinct raw tokens produce distinct hashes', () => {
      const tokenA = crypto.randomBytes(32).toString('hex');
      const tokenB = crypto.randomBytes(32).toString('hex');

      const hashA = crypto.createHash('sha256').update(tokenA).digest('hex');
      const hashB = crypto.createHash('sha256').update(tokenB).digest('hex');

      expect(hashA).not.toBe(hashB);
    });
  });
});
