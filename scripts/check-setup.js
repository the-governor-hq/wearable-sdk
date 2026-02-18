#!/usr/bin/env node

/**
 * Pre-flight check script
 * Verifies that everything is configured before running the playground
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PLAYGROUND_PATH = join(process.cwd(), 'apps', 'playground');
const ENV_PATH = join(PLAYGROUND_PATH, '.env');
const ENV_EXAMPLE_PATH = join(PLAYGROUND_PATH, '.env.example');

const checks = {
  passed: [],
  warnings: [],
  errors: [],
};

function success(msg) {
  checks.passed.push(`✅ ${msg}`);
}

function warning(msg) {
  checks.warnings.push(`⚠️  ${msg}`);
}

function error(msg) {
  checks.errors.push(`❌ ${msg}`);
}

console.log('🔍 Running pre-flight checks...\n');

// Check 1: Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  success(`Node.js ${nodeVersion} (>= 18 required)`);
} else {
  error(`Node.js ${nodeVersion} is too old. Please upgrade to Node 18 or later.`);
}

// Check 2: Playground directory exists
if (existsSync(PLAYGROUND_PATH)) {
  success('Playground directory exists');
} else {
  error('Playground directory not found at apps/playground');
}

// Check 3: .env file exists
if (existsSync(ENV_PATH)) {
  success('.env file exists');
  
  // Check 4: .env has required variables
  const envContent = readFileSync(ENV_PATH, 'utf-8');
  const requiredVars = [
    'GARMIN_CLIENT_ID',
    'GARMIN_CLIENT_SECRET',
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET',
    'NEXT_PUBLIC_BASE_URL',
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    return !regex.test(envContent);
  });
  
  if (missingVars.length === 0) {
    success('All required environment variables are set');
  } else {
    warning(`Missing or empty environment variables: ${missingVars.join(', ')}`);
    warning('The playground will start but OAuth flows won\'t work until these are configured');
  }
} else {
  warning('.env file not found');
  if (existsSync(ENV_EXAMPLE_PATH)) {
    warning('Run: cp apps/playground/.env.example apps/playground/.env');
  }
}

// Check 5: Database file
const dbPath = join(process.cwd(), 'dev.db');
if (existsSync(dbPath)) {
  success('Database file exists (dev.db)');
} else {
  warning('Database file not found. Run: npx prisma db push');
}

// Check 6: package.json in playground
const playgroundPackageJson = join(PLAYGROUND_PATH, 'package.json');
if (existsSync(playgroundPackageJson)) {
  success('Playground package.json exists');
} else {
  error('Playground package.json not found');
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('PRE-FLIGHT CHECK RESULTS');
console.log('='.repeat(60) + '\n');

if (checks.passed.length > 0) {
  checks.passed.forEach(msg => console.log(msg));
  console.log('');
}

if (checks.warnings.length > 0) {
  checks.warnings.forEach(msg => console.log(msg));
  console.log('');
}

if (checks.errors.length > 0) {
  checks.errors.forEach(msg => console.log(msg));
  console.log('');
}

// Final verdict
console.log('='.repeat(60));

if (checks.errors.length > 0) {
  console.log('\n❌ FAILED: Please fix the errors above before running the playground.\n');
  process.exit(1);
} else if (checks.warnings.length > 0) {
  console.log('\n⚠️  READY (with warnings): You can run the playground, but some features may not work.');
  console.log('Configure the missing environment variables for full functionality.\n');
  console.log('Run: npm run dev\n');
  process.exit(0);
} else {
  console.log('\n✅ ALL CHECKS PASSED: You\'re ready to go!\n');
  console.log('Run: npm run dev\n');
  process.exit(0);
}
