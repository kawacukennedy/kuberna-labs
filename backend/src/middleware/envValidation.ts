import logger from '../utils/logger.js';

interface EnvVar {
  name: string;
  required: boolean;
  pattern?: RegExp;
}

const requiredEnvVars: EnvVar[] = [
  { name: 'DATABASE_URL', required: false },
  { name: 'JWT_SECRET', required: true, pattern: /^(?!.*(kuberna-secret-key|change-in-production|your-secret)).{16,}$/ },
  // The refresh secret must be strong and distinct on its own; without this
  // check a JWT_SECRET-derived fallback could silently protect refresh tokens.
  { name: 'JWT_REFRESH_SECRET', required: false, pattern: /^(?!.*(kuberna-secret-key|change-in-production|your-secret)).{16,}$/ },
  { name: 'REDIS_URL', required: false },
  { name: 'NATS_URL', required: false },
  { name: 'PRIVATE_KEY', required: false },
  { name: 'STRIPE_SECRET_KEY', required: false },
  { name: 'STRIPE_WEBHOOK_SECRET', required: false },
  { name: 'MOONPAY_API_KEY', required: false },
  { name: 'TRANSAK_API_KEY', required: false },
  { name: 'PHALA_API_KEY', required: false },
  { name: 'MARLIN_API_KEY', required: false },
  { name: 'RECLAIM_APP_ID', required: false },
  { name: 'RECLAIM_APP_SECRET', required: false },
  { name: 'ZKPASS_API_KEY', required: false },
];

const insecureDefaultPatterns = [/kuberna-secret-key/, /change-in-production/, /your-secret/];

export function validateEnvironment(): void {
  const missingVars: string[] = [];
  const insecureVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    if (envVar.required && !value) {
      missingVars.push(envVar.name);
      continue;
    }

    if (value && envVar.pattern && !envVar.pattern.test(value)) {
      insecureVars.push(`${envVar.name} does not match required pattern`);
    }

    if (value) {
      for (const pattern of insecureDefaultPatterns) {
        if (pattern.test(value)) {
          insecureVars.push(`${envVar.name} appears to use an insecure default value`);
          break;
        }
      }
    }
  }

  if (missingVars.length > 0) {
    logger.warn(`WARNING: Missing environment variables: ${missingVars.join(', ')}`);

    if (process.env.NODE_ENV === 'production') {
      logger.error('Production environment check failed — exiting');
      process.exit(1);
    }
  }

  // JWT_REFRESH_SECRET must be set explicitly in production. auth.ts would
  // otherwise fall back to a value derived from JWT_SECRET, which means a
  // single leaked signing key also compromises every refresh token.
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_REFRESH_SECRET) {
    logger.error('JWT_REFRESH_SECRET is required in production — exiting');
    process.exit(1);
  }

  if (insecureVars.length > 0) {
    logger.warn('WARNING: Insecure environment configuration detected:');
    for (const warning of insecureVars) {
      logger.warn(`  - ${warning}`);
    }

    if (process.env.NODE_ENV === 'production') {
      logger.error('Production environment check failed — exiting');
      process.exit(1);
    }
  }
}
