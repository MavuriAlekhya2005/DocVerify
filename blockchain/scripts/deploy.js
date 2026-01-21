const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying DocVerify Smart Contract...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy DocVerify contract
  console.log("📄 Deploying DocVerify contract...");
  const DocVerify = await hre.ethers.getContractFactory("DocVerify");
  const docVerify = await DocVerify.deploy();
  
  await docVerify.waitForDeployment();
  const contractAddress = await docVerify.getAddress();
  
  console.log("✅ DocVerify deployed to:", contractAddress);
  console.log("👤 Contract owner:", deployer.address);

  // Get deployment transaction details
  const deploymentTx = docVerify.deploymentTransaction();
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    console.log("🔗 Transaction hash:", receipt.hash);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment info saved to:", deploymentFile);

  // Copy ABI to backend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/DocVerify.sol/DocVerify.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  
  const backendAbiDir = path.join(__dirname, "../../backend/contracts");
  if (!fs.existsSync(backendAbiDir)) {
    fs.mkdirSync(backendAbiDir, { recursive: true });
  }
  
  const abiFile = {
    address: contractAddress,
    abi: artifact.abi,
    network: hre.network.name,
    chainId: deploymentInfo.chainId,
  };
  
  fs.writeFileSync(
    path.join(backendAbiDir, "DocVerify.json"),
    JSON.stringify(abiFile, null, 2)
  );
  console.log("📋 ABI copied to backend/contracts/DocVerify.json");

  console.log("\n✨ Deployment complete!\n");
  
  // Print summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("                   DEPLOYMENT SUMMARY                   ");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Network:          ${hre.network.name}`);
  console.log(`  Contract Address: ${contractAddress}`);
  console.log(`  Owner:            ${deployer.address}`);
  console.log("═══════════════════════════════════════════════════════");
  
  return { docVerify, contractAddress, deployer };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
