import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Script to verify the development environment setup
 * Checks all required dependencies, configurations, and tools
 */

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, fn: () => boolean, successMsg: string, failMsg: string): void {
  try {
    const result = fn();
    results.push({
      name,
      status: result ? 'pass' : 'fail',
      message: result ? successMsg : failMsg,
    });
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      message: `${failMsg}: ${error.message}`,
    });
  }
}

function checkCommand(command: string): boolean {
  try {
    execSync(command, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkFile(filePath: string): boolean {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function checkDirectory(dirPath: string): boolean {
  const fullPath = path.join(__dirname, '..', dirPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

console.log('='.repeat(60));
console.log('Kuberna Labs - Development Environment Verification');
console.log('='.repeat(60));
console.log();

// Check Node.js version
check(
  'Node.js Version',
  () => {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0]);
    return major >= 18;
  },
  `Node.js ${process.version} (✓ >= 18.0.0)`,
  `Node.js ${process.version} (✗ Requires >= 18.0.0)`
);

// Check npm
check(
  'npm',
  () => checkCommand('npm --version'),
  'npm is installed',
  'npm is not installed'
);

// Check Git
check(
  'Git',
  () => checkCommand('git --version'),
  'Git is installed',
  'Git is not installed'
);

// Check project structure
check(
  'Contracts Directory',
  () => checkDirectory('contracts'),
  'contracts/ directory exists',
  'contracts/ directory not found'
);

check(
  'Test Directory',
  () => checkDirectory('test'),
  'test/ directory exists',
  'test/ directory not found'
);

check(
  'Scripts Directory',
  () => checkDirectory('scripts'),
  'scripts/ directory exists',
  'scripts/ directory not found'
);

check(
  'Backend Directory',
  () => checkDirectory('backend'),
  'backend/ directory exists',
  'backend/ directory not found'
);

check(
  'SDK Directory',
  () => checkDirectory('sdk'),
  'sdk/ directory exists',
  'sdk/ directory not found'
);

// Check configuration files
check(
  'Hardhat Config',
  () => checkFile('hardhat.config.ts'),
  'hardhat.config.ts exists',
  'hardhat.config.ts not found'
);

check(
  'TypeScript Config',
  () => checkFile('tsconfig.json'),
  'tsconfig.json exists',
  'tsconfig.json not found'
);

check(
  'ESLint Config',
  () => checkFile('.eslintrc.json'),
  '.eslintrc.json exists',
  '.eslintrc.json not found'
);

check(
  'Prettier Config',
  () => checkFile('.prettierrc.json'),
  '.prettierrc.json exists',
  '.prettierrc.json not found'
);

check(
  'Solhint Config',
  () => checkFile('.solhint.json'),
  '.solhint.json exists',
  '.solhint.json not found'
);

check(
  'Environment Template',
  () => checkFile('.env.example'),
  '.env.example exists',
  '.env.example not found'
);

// Check if .env exists (warning if not)
if (!checkFile('.env')) {
  results.push({
    name: 'Environment File',
    status: 'warn',
    message: '.env file not found (copy from .env.example)',
  });
} else {
  results.push({
    name: 'Environment File',
    status: 'pass',
    message: '.env file exists',
  });
}

// Check node_modules
check(
  'Root Dependencies',
  () => checkDirectory('node_modules'),
  'Root dependencies installed',
  'Root dependencies not installed (run: npm install)'
);

check(
  'Backend Dependencies',
  () => checkDirectory('backend/node_modules'),
  'Backend dependencies installed',
  'Backend dependencies not installed (run: cd backend && npm install)'
);

check(
  'SDK Dependencies',
  () => checkDirectory('sdk/node_modules'),
  'SDK dependencies installed',
  'SDK dependencies not installed (run: cd sdk && npm install)'
);

// Check deployment scripts
check(
  'Deployment Script',
  () => checkFile('scripts/deploy.ts'),
  'scripts/deploy.ts exists',
  'scripts/deploy.ts not found'
);

check(
  'Verification Script',
  () => checkFile('scripts/verify.ts'),
  'scripts/verify.ts exists',
  'scripts/verify.ts not found'
);

check(
  'Local Setup Script',
  () => checkFile('scripts/setup-local.ts'),
  'scripts/setup-local.ts exists',
  'scripts/setup-local.ts not found'
);

// Check test helpers
check(
  'Property Test Helpers',
  () => checkFile('test/helpers/propertyTestHelpers.ts'),
  'Property test helpers exist',
  'Property test helpers not found'
);

// Check documentation
check(
  'Setup Documentation',
  () => checkFile('SETUP.md'),
  'SETUP.md exists',
  'SETUP.md not found'
);

check(
  'Quick Start Guide',
  () => checkFile('QUICK_START.md'),
  'QUICK_START.md exists',
  'QUICK_START.md not found'
);

check(
  'Project Status',
  () => checkFile('PROJECT_STATUS.md'),
  'PROJECT_STATUS.md exists',
  'PROJECT_STATUS.md not found'
);

// Print results
console.log();
console.log('Verification Results:');
console.log('-'.repeat(60));

let passCount = 0;
let failCount = 0;
let warnCount = 0;

results.forEach((result) => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${result.name}: ${result.message}`);

  if (result.status === 'pass') passCount++;
  else if (result.status === 'fail') failCount++;
  else warnCount++;
});

console.log('-'.repeat(60));
console.log(`Total: ${results.length} checks`);
console.log(`Passed: ${passCount} | Failed: ${failCount} | Warnings: ${warnCount}`);
console.log('='.repeat(60));

if (failCount > 0) {
  console.log();
  console.log('❌ Setup verification failed!');
  console.log('Please fix the issues above and run this script again.');
  console.log();
  console.log('Common fixes:');
  console.log('  - Run: npm install');
  console.log('  - Run: cd backend && npm install');
  console.log('  - Run: cd sdk && npm install');
  console.log('  - Copy .env.example to .env and configure it');
  process.exit(1);
} else if (warnCount > 0) {
  console.log();
  console.log('⚠️  Setup verification passed with warnings.');
  console.log('Please review the warnings above.');
  console.log();
} else {
  console.log();
  console.log('✅ Setup verification passed!');
  console.log('Your development environment is ready.');
  console.log();
  console.log('Next steps:');
  console.log('  1. Configure .env file (if not done)');
  console.log('  2. Run: npm run compile');
  console.log('  3. Run: npm test');
  console.log('  4. Start development!');
  console.log();
}
