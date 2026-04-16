const { ethers } = require("hardhat");

async function main() {
  const centralAddress = "0x9B50c9bba02bD09f6c9629bB04074a1a6A373826";
  const producerAddress = "0xF37C8A2dFfC70Aba579A7A52a46ad4FB8952183c";
  const distributorAddress = "0x8bbADa06c2e4aEE384145eB9C740313d1605Af50";
  const retailerAddress = "0x35A5CD3138e10CE59313eB0011ac972BEDCeAc3d";
  const customerAddress = "0xeD107c5aA2eCc422f30795072CD829F7a6e04e26";

  const MedoraCentral = await ethers.getContractAt("MedoraCentral", centralAddress);

  const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
  const INTERNAL_VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INTERNAL_VERIFIER_ROLE"));

  console.log("Setting up roles on MedoraCentral at:", centralAddress);

  // Buffer gas price for Sepolia to avoid "transaction underpriced"
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice * 2n; // Double gas price to be safe

  console.log("Granting PRODUCER_ROLE to ProducerContract...");
  const tx1 = await MedoraCentral.grantRole(PRODUCER_ROLE, producerAddress, { gasPrice });
  await tx1.wait();
  console.log("Granted!");

  console.log("Granting INTERNAL_VERIFIER_ROLE to Distributor...");
  const tx2 = await MedoraCentral.grantRole(INTERNAL_VERIFIER_ROLE, distributorAddress, { gasPrice });
  await tx2.wait();
  console.log("Granted!");

  console.log("Granting INTERNAL_VERIFIER_ROLE to Retailer...");
  const tx3 = await MedoraCentral.grantRole(INTERNAL_VERIFIER_ROLE, retailerAddress, { gasPrice });
  await tx3.wait();
  console.log("Granted!");

  console.log("Granting INTERNAL_VERIFIER_ROLE to Customer...");
  const tx4 = await MedoraCentral.grantRole(INTERNAL_VERIFIER_ROLE, customerAddress, { gasPrice });
  await tx4.wait();
  console.log("Granted!");

  console.log("\n=== ROLE SETUP COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
