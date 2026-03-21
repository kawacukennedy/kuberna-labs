interface EnvVar {
  name: string;
  required: boolean;
  pattern?: RegExp;
}

const requiredEnvVars: EnvVar[] = [
  { name: 'DATABASE_URL', required: true },
  { name: 'JWT_SECRET', required: true },
  { name: 'NATS_URL', required: false },
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
    const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn(`WARNING: ${error.message}`);
    }
  }

  if (insecureVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Insecure environment configuration:\n${insecureVars.join('\n')}`);
  }

  if (insecureVars.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('WARNING: Insecure environment configuration detected:');
    for (const warning of insecureVars) {
      console.warn(`  - ${warning}`);
    }
  }
}
