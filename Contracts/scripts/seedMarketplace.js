const { ethers } = require("hardhat");

async function main() {
  const centralAddress = "0x7030a605675E989791966AA372EC48A849b34E94";
  const manufacturerAddress = "0xAA66e4cD60671397D00077492dd631DaeCb20b65";
  const userMarketplaceAddress = "0x38298c6C70D95a8486E2E8f791aDAB577AB969F6";

  const [deployer] = await ethers.getSigners();
  console.log("Finalizing with account:", deployer.address);

  const centralMarketplace = await ethers.getContractAt("CentralMarketplace", centralAddress);
  const manufacturerRegistry = await ethers.getContractAt("ManufacturerRegistry", manufacturerAddress);

  console.log("\n=== Finalizing Access Control ===");
  try {
    console.log("Granting USER_MARKETPLACE_ROLE...");
    const tx1 = await centralMarketplace.grantUserMarketplaceRole(userMarketplaceAddress);
    await tx1.wait();
    console.log("✅ USER_MARKETPLACE_ROLE granted");

    console.log("Granting MANUFACTURER_REGISTRY_ROLE...");
    const tx2 = await centralMarketplace.grantManufacturerRegistryRole(manufacturerAddress);
    await tx2.wait();
    console.log("✅ MANUFACTURER_REGISTRY_ROLE granted");
  } catch (e) {
    console.log("Note:", e.message);
  }

  console.log("\n=== Seeding Mock Data ===");
  const mockManufacturers = [
    { name: "Medora Labs", symbol: "MLAB", price: "0.0001" },
    { name: "BioGen Pharma", symbol: "BIOG", price: "0.0002" }
  ];

  for (const mock of mockManufacturers) {
    try {
      const isReg = await manufacturerRegistry.isRegisteredManufacturer(deployer.address);
      if (!isReg) {
        console.log(`Registering ${mock.name}...`);
        const tx1 = await manufacturerRegistry.registerManufacturer(deployer.address);
        await tx1.wait();
      }

      const existingToken = await manufacturerRegistry.getManufacturerToken(deployer.address);
      if (existingToken === ethers.ZeroAddress) {
        console.log(`Creating token ${mock.symbol}...`);
        const tx2 = await manufacturerRegistry.createToken(
          mock.name,
          mock.symbol,
          ethers.parseEther("1000000"),
          ethers.parseEther(mock.price)
        );
        await tx2.wait();
      }

      const tokenAddress = await manufacturerRegistry.getManufacturerToken(deployer.address);
      console.log(`${mock.symbol} at: ${tokenAddress}`);

      console.log(`Seeding liquidity for ${mock.symbol}...`);
      const tx3 = await manufacturerRegistry.seedLiquidity(
        tokenAddress,
        ethers.parseEther("100000"),
        { value: ethers.parseEther("0.005") }
      );
      await tx3.wait();
      console.log(`✅ ${mock.symbol} seeded`);
      
      // Stop after one to be safe with gas
      break;
    } catch (e) {
      console.log(`Error seeding ${mock.symbol}:`, e.message);
    }
  }

  console.log("\nMarketplace Finalization Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
