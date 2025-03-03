#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Try to get the commit hash from git
let commitHash;
try {
  // Get the current commit hash
  commitHash = execSync('git rev-parse HEAD').toString().trim();
  console.log(`Current commit hash: ${commitHash}`);
} catch (error) {
  console.error('Error getting commit hash from git:', error.message);
  // Fallback to environment variable if available
  commitHash = process.env.VERCEL_GIT_COMMIT_SHA || 'development';
  console.log(`Using fallback commit hash: ${commitHash}`);
}

// Path to .env.local file
const envFilePath = path.join(rootDir, '.env.local');

// Create or update the .env.local file with the commit hash
try {
  // Check if file exists
  let envContent = '';
  if (fs.existsSync(envFilePath)) {
    // Read existing content
    envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Remove any existing NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA line
    envContent = envContent
      .split('\n')
      .filter(line => !line.startsWith('NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA='))
      .join('\n');
  }
  
  // Add the new commit hash
  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n';
  }
  envContent += `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=${commitHash}\n`;
  
  // Write back to file
  fs.writeFileSync(envFilePath, envContent);
  console.log('Successfully added commit hash to .env.local');
} catch (error) {
  console.error('Error writing to .env.local:', error.message);
} 