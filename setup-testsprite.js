#!/usr/bin/env node

/**
 * TestSprite Testing Setup for DocVerify
 *
 * This script helps you get started with TestSprite testing for your DocVerify project.
 *
 * Prerequisites:
 * 1. TestSprite account and API key
 * 2. MCP server configured in VS Code
 * 3. Node.js >= 22
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 DocVerify TestSprite Setup');
console.log('==============================\n');

// Check prerequisites
console.log('📋 Checking prerequisites...');

try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);

  if (!nodeVersion.startsWith('v22') && !nodeVersion.startsWith('v24')) {
    console.log('❌ Node.js version must be >= 22');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Node.js not found');
  process.exit(1);
}

// Check if frontend is built
const distPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Frontend build exists');
} else {
  console.log('❌ Frontend not built. Run: cd frontend && npm run build');
}

// Check if backend dependencies are installed
const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
if (fs.existsSync(backendPackagePath)) {
  console.log('✅ Backend package.json exists');
} else {
  console.log('❌ Backend package.json not found');
}

console.log('\n🎯 Next Steps:');
console.log('1. Sign up at https://testsprite.com');
console.log('2. Get your API key from the dashboard');
console.log('3. Configure MCP server in VS Code settings');
console.log('4. Use prompts like: "Help me test this React project with TestSprite"');
console.log('5. TestSprite will automatically discover and test your application');

console.log('\n📚 Useful TestSprite Commands:');
console.log('- "Test the login functionality"');
console.log('- "Test document upload and verification"');
console.log('- "Test admin dashboard features"');
console.log('- "Run security tests on the application"');

console.log('\n🔗 Resources:');
console.log('- Documentation: https://docs.testsprite.com');
console.log('- Discord Community: https://discord.gg/QQB9tJ973e');

console.log('\n✨ Happy Testing with TestSprite!');