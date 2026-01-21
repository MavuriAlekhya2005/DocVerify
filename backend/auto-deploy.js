/**
 * Auto-deploy script - Deploys contract when Hardhat node is ready
 * Used by npm run dev to ensure contract is deployed before backend starts
 */

const { exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const RPC_URL = 'http://127.0.0.1:8545';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000;

async function checkNode() {
  return new Promise((resolve) => {
    const req = http.request(RPC_URL, { method: 'POST' }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.write(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }));
    req.end();
  });
}

async function waitForNode() {
  console.log('⏳ Waiting for Hardhat node...');
  for (let i = 0; i < MAX_RETRIES; i++) {
    if (await checkNode()) {
      console.log('✅ Hardhat node is ready!');
      return true;
    }
    await new Promise(r => setTimeout(r, RETRY_DELAY));
  }
  return false;
}

async function deploy() {
  return new Promise((resolve, reject) => {
    const deployProcess = exec(
      'npx hardhat run scripts/deploy.js --network localhost',
      { cwd: path.join(__dirname, '../blockchain') },
      (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Deployment failed:', stderr);
          reject(error);
        } else {
          console.log(stdout);
          resolve();
        }
      }
    );
    deployProcess.stdout.pipe(process.stdout);
    deployProcess.stderr.pipe(process.stderr);
  });
}

async function main() {
  // Check if contract already deployed
  const contractPath = path.join(__dirname, 'contracts/DocVerify.json');
  if (fs.existsSync(contractPath)) {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    if (contract.address) {
      console.log('ℹ️  Contract already deployed at:', contract.address);
      // Still wait for node to be ready
      if (await waitForNode()) {
        console.log('✅ Using existing deployment');
        process.exit(0);
      }
    }
  }

  // Wait for node and deploy
  if (await waitForNode()) {
    try {
      await deploy();
      console.log('✅ Deployment complete!');
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  } else {
    console.error('❌ Hardhat node did not start in time');
    process.exit(1);
  }
}

main();
