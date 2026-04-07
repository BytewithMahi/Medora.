const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MedoraSupplyChain contract...");

  // Get the contract factory
  const MedoraSupplyChain = await ethers.getContractFactory("MedoraSupplyChain");

  // Deploy the contract
  const medoraSupplyChain = await MedoraSupplyChain.deploy();

  // Wait for deployment to complete
  await medoraSupplyChain.waitForDeployment();

  const contractAddress = await medoraSupplyChain.getAddress();
  console.log("MedoraSupplyChain deployed to:", contractAddress);

  // Log deployment info for backend integration
  console.log("\n=== DEPLOYMENT INFO ===");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", (await ethers.provider.getSigner()).address);
  console.log("Network:", await ethers.provider.getNetwork());
  
  // Role constants for backend reference
  console.log("\n=== ROLE CONSTANTS ===");
  console.log("MANUFACTURER_ROLE:", ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE")));
  console.log("DISTRIBUTOR_ROLE:", ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE")));
  console.log("RETAILER_ROLE:", ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE")));
  console.log("ADMIN_ROLE:", ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")));

  console.log("\n=== NEXT STEPS ===");
  console.log("1. Update backend .env with:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log("2. Grant roles to verified supply chain participants");
  console.log("3. Test batch registration and transfer functions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
