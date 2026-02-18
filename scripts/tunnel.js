#!/usr/bin/env node

/**
 * Tunnel Script - Start ngrok and print OAuth callback URLs
 * 
 * Usage:
 *   npm run dev:tunnel
 *   pnpm dev:tunnel
 * 
 * This will:
 *   1. Start ngrok tunnel on port 3001
 *   2. Print the public URL
 *   3. Print formatted callback URLs for Garmin & Fitbit
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const PLAYGROUND_PORT = 3001;
const NGROK_CHECK_INTERVAL = 1000;
const MAX_RETRIES = 30;

async function checkNgrokInstalled() {
  return new Promise((resolve) => {
    const check = spawn('ngrok', ['version'], { shell: true });
    check.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function getNgrokUrl() {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    const data = await response.json();
    const tunnel = data.tunnels?.find(t => t.proto === 'https');
    return tunnel?.public_url;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('🚇 Starting ngrok tunnel...\n');

  // Check if ngrok is installed
  const isInstalled = await checkNgrokInstalled();
  if (!isInstalled) {
    console.error('❌ ngrok is not installed!');
    console.error('\nInstall it with:');
    console.error('  npm install -g ngrok');
    console.error('  or download from: https://ngrok.com/download\n');
    process.exit(1);
  }

  // Start ngrok
  const ngrok = spawn('ngrok', ['http', PLAYGROUND_PORT], { 
    shell: true,
    stdio: 'inherit'
  });

  ngrok.on('error', (err) => {
    console.error('❌ Failed to start ngrok:', err);
    process.exit(1);
  });

  // Wait for ngrok to be ready and get the URL
  console.log('⏳ Waiting for ngrok to start...\n');
  
  let url = null;
  let retries = 0;
  
  while (!url && retries < MAX_RETRIES) {
    await setTimeout(NGROK_CHECK_INTERVAL);
    url = await getNgrokUrl();
    retries++;
  }

  if (!url) {
    console.error('❌ Failed to get ngrok URL after 30 seconds');
    console.error('Check the ngrok dashboard at: http://localhost:4040\n');
    process.exit(1);
  }

  // Print success message with URLs
  console.log('\n' + '='.repeat(70));
  console.log('✅ Ngrok tunnel is running!');
  console.log('='.repeat(70));
  console.log('\n📍 Public URL:');
  console.log(`   ${url}`);
  console.log('\n🎮 Playground:');
  console.log(`   ${url}`);
  console.log('\n🔗 OAuth Callback URLs (configure in provider consoles):');
  console.log('\n   Garmin:');
  console.log(`   ${url}/api/auth/garmin/callback`);
  console.log('\n   Fitbit:');
  console.log(`   ${url}/api/auth/fitbit/callback`);
  console.log('\n🪝 Webhook URL:');
  console.log(`   ${url}/api/webhook`);
  console.log('\n📊 Ngrok Dashboard:');
  console.log('   http://localhost:4040');
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Don\'t forget to update NEXT_PUBLIC_BASE_URL in .env:');
  console.log(`   NEXT_PUBLIC_BASE_URL=${url}`);
  console.log('\n' + '='.repeat(70) + '\n');

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down ngrok tunnel...');
    ngrok.kill();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
