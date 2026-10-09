import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  it('rejects a missing secret', () => {
    expect(() => getJwtSecret(undefined)).toThrow('JWT_SECRET is required');
  });

  it('rejects a secret shorter than 32 characters', () => {
    expect(() => getJwtSecret('short-secret')).toThrow(
      'at least 32 characters',
    );
  });

  it('rejects the documented example placeholder', () => {
    expect(() => getJwtSecret('INVALID_REPLACE_WITH_GENERATED_SECRET')).toThrow(
      'must not be a placeholder',
    );
  });

  it('returns a valid secret', () => {
    const secret = 'a-valid-secret-that-is-at-least-32-characters';
    expect(getJwtSecret(secret)).toBe(secret);
  });
});
