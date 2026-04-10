const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy MedoraSupplyChain (Legacy/Simple version)
  console.log("\n1. Deploying MedoraSupplyChain...");
  const MedoraSupplyChain = await ethers.getContractFactory("MedoraSupplyChain");
  const supplyChain = await MedoraSupplyChain.deploy();
  await supplyChain.waitForDeployment();
  const supplyChainAddress = await supplyChain.getAddress();
  console.log("MedoraSupplyChain deployed to:", supplyChainAddress);

  // 2. Deploy MedoraCentral (The Hub)
  console.log("\n2. Deploying MedoraCentral...");
  const MedoraCentral = await ethers.getContractFactory("MedoraCentral");
  const central = await MedoraCentral.deploy();
  await central.waitForDeployment();
  const centralAddress = await central.getAddress();
  console.log("MedoraCentral deployed to:", centralAddress);

  // 3. Deploy Role Contracts
  console.log("\n3. Deploying Role Contracts...");
  
  const ProducerContract = await ethers.getContractFactory("ProducerContract");
  const producer = await ProducerContract.deploy(centralAddress);
  await producer.waitForDeployment();
  const producerAddress = await producer.getAddress();
  console.log("ProducerContract deployed to:", producerAddress);

  const DistributorContract = await ethers.getContractFactory("DistributorContract");
  const distributor = await DistributorContract.deploy(centralAddress);
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("DistributorContract deployed to:", distributorAddress);

  const RetailerContract = await ethers.getContractFactory("RetailerContract");
  const retailer = await RetailerContract.deploy(centralAddress);
  await retailer.waitForDeployment();
  const retailerAddress = await retailer.getAddress();
  console.log("RetailerContract deployed to:", retailerAddress);

  const CustomerContract = await ethers.getContractFactory("CustomerContract");
  const customer = await CustomerContract.deploy(centralAddress);
  await customer.waitForDeployment();
  const customerAddress = await customer.getAddress();
  console.log("CustomerContract deployed to:", customerAddress);

  // 4. Setup Roles and Permissions
  console.log("\n4. Configuring Roles and Permissions...");

  const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
  const INTERNAL_VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INTERNAL_VERIFIER_ROLE"));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

  // Grant ProducerContract the PRODUCER_ROLE in MedoraCentral
  console.log("Granting PRODUCER_ROLE to ProducerContract...");
  await central.grantRole(PRODUCER_ROLE, producerAddress);

  // Grant other sub-contracts the INTERNAL_VERIFIER_ROLE in MedoraCentral
  console.log("Granting INTERNAL_VERIFIER_ROLE to Distributor/Retailer/Customer contracts...");
  await central.grantRole(INTERNAL_VERIFIER_ROLE, distributorAddress);
  await central.grantRole(INTERNAL_VERIFIER_ROLE, retailerAddress);
  await central.grantRole(INTERNAL_VERIFIER_ROLE, customerAddress);

  // 5. Summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("MedoraSupplyChain (Simple):", supplyChainAddress);
  console.log("MedoraCentral (Hub):      ", centralAddress);
  console.log("ProducerContract:          ", producerAddress);
  console.log("DistributorContract:       ", distributorAddress);
  console.log("RetailerContract:          ", retailerAddress);
  console.log("CustomerContract:           ", customerAddress);
  console.log("\nUpdate your .env with the MedoraCentral address for standard operations.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
