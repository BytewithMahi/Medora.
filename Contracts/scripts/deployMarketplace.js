const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying marketplace contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  console.log("\n=== Deploying CentralMarketplace ===");
  const CentralMarketplace = await ethers.getContractFactory("CentralMarketplace");
  const centralMarketplace = await CentralMarketplace.deploy();
  await centralMarketplace.waitForDeployment();
  const centralAddress = await centralMarketplace.getAddress();
  console.log("CentralMarketplace deployed to:", centralAddress);

  console.log("\n=== Deploying ManufacturerRegistry ===");
  const ManufacturerRegistry = await ethers.getContractFactory("ManufacturerRegistry");
  const manufacturerRegistry = await ManufacturerRegistry.deploy(centralAddress);
  await manufacturerRegistry.waitForDeployment();
  const manufacturerAddress = await manufacturerRegistry.getAddress();
  console.log("ManufacturerRegistry deployed to:", manufacturerAddress);

  console.log("\n=== Deploying UserMarketplace ===");
  const UserMarketplace = await ethers.getContractFactory("UserMarketplace");
  const userMarketplace = await UserMarketplace.deploy(centralAddress);
  await userMarketplace.waitForDeployment();
  const userAddress = await userMarketplace.getAddress();
  console.log("UserMarketplace deployed to:", userAddress);

  console.log("\n=== Setting up Access Control Roles ===");
  console.log("Granting MANUFACTURER_REGISTRY_ROLE to ManufacturerRegistry...");
  await centralMarketplace.grantManufacturerRegistryRole(manufacturerAddress);
  console.log("✅ ManufacturerRegistry role granted");

  console.log("Granting USER_MARKETPLACE_ROLE to UserMarketplace...");
  await centralMarketplace.grantUserMarketplaceRole(userAddress);
  console.log("✅ UserMarketplace role granted");

  console.log("\n=== Deploying ManufacturerToken Implementation ===");
  const ManufacturerToken = await ethers.getContractFactory("ManufacturerToken");
  const manufacturerToken = await ManufacturerToken.deploy(
    "Test Token",
    "TEST",
    ethers.parseEther("1000000"),
    18
  );
  await manufacturerToken.waitForDeployment();
  const tokenImplAddress = await manufacturerToken.getAddress();
  console.log("ManufacturerToken implementation deployed to:", tokenImplAddress);
  console.log("(This is for reference - actual tokens will be created via ManufacturerRegistry)");

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("CentralMarketplace:", centralAddress);
  console.log("ManufacturerRegistry:", manufacturerAddress);
  console.log("UserMarketplace:", userAddress);
  console.log("ManufacturerToken (impl):", tokenImplAddress);

  console.log("\n📝 Next Steps:");
  console.log("1. Update your frontend .env file with these addresses");
  console.log("2. Test manufacturer registration");
  console.log("3. Create a test token");
  console.log("4. Seed liquidity and test trading");
  console.log("5. Update backend API endpoints");

  console.log("\n🔐 Access Control Setup:");
  console.log("- CentralMarketplace will only accept calls from ManufacturerRegistry");
  console.log("- CentralMarketplace will only accept calls from UserMarketplace");
  console.log("- ManufacturerRegistry admin can register manufacturers");

  if (network.name === "sepolia" || network.name === "localhost") {
    console.log("\n=== Seeding Mock Data for Polymarket Flow ===");
    
    // Using some known addresses for mock manufacturers (or just the deployer for simplicity)
    const mockManufacturers = [
      { name: "Medora Labs", symbol: "MLAB", price: "0.001" },
      { name: "BioGen Pharma", symbol: "BIOG", price: "0.0025" },
      { name: "VaxCore", symbol: "VAX", price: "0.0015" }
    ];

    for (const mock of mockManufacturers) {
      console.log(`\nProcessing ${mock.name}...`);
      
      const isReg = await manufacturerRegistry.isRegisteredManufacturer(deployer.address);
      if (!isReg) {
        console.log(`Registering ${mock.name}...`);
        await manufacturerRegistry.registerManufacturer(deployer.address);
      }
      
      const existingToken = await manufacturerRegistry.getManufacturerToken(deployer.address);
      if (existingToken === ethers.ZeroAddress) {
        console.log(`Creating token ${mock.symbol}...`);
        await manufacturerRegistry.createToken(
          mock.name,
          mock.symbol,
          ethers.parseEther("1000000"), // 1M Supply
          ethers.parseEther(mock.price)
        );
      }
      
      const tokenAddress = await manufacturerRegistry.getManufacturerToken(deployer.address);
      console.log(`${mock.symbol} active at: ${tokenAddress}`);
      
      // Seed if balance is low or for first time
      console.log(`Seeding liquidity for ${mock.symbol}...`);
      await manufacturerRegistry.seedLiquidity(
        tokenAddress,
        ethers.parseEther("500000"), // 500k tokens
        { value: ethers.parseEther("0.1") } // 0.1 ETH liquidity
      );
      console.log(`✅ ${mock.symbol} seeded`);
      
      // Break after first one if using same address for demo, or ideally use different addresses
      // For this demo, we'll just do one robustly to avoid owner/manufacturer conflicts
      break; 
    }

    console.log("\n📝 Verification commands:");
    console.log(`npx hardhat verify --network sepolia ${centralAddress}`);
    console.log(`npx hardhat verify --network sepolia ${manufacturerAddress} \"${centralAddress}\"`);
    console.log(`npx hardhat verify --network sepolia ${userAddress} \"${centralAddress}\"`);
  }

  return {
    centralMarketplace: centralAddress,
    manufacturerRegistry: manufacturerAddress,
    userMarketplace: userAddress,
    tokenImpl: tokenImplAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
