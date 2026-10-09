const JWT_SECRET_PLACEHOLDERS = new Set([
  'change_me_in_production',
  'invalid_replace_with_generated_secret',
  'changeme',
  'change-me',
  'your-secret-key',
  'secret',
]);

export function getJwtSecret(secret: string | undefined): string {
  if (!secret) {
    throw new Error(
      'JWT_SECRET is required. Generate a secure value with `openssl rand -base64 48`.',
    );
  }

  if (
    secret.length < 32 ||
    JWT_SECRET_PLACEHOLDERS.has(secret.trim().toLowerCase())
  ) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters and must not be a placeholder. Generate a secure value with `openssl rand -base64 48`.',
    );
  }

  return secret;
}
