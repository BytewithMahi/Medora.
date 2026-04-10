const { ethers } = require("hardhat");

async function main() {
  const centralAddress = "0xd826772d5d93157C0BE7A05E229b609b23FFa8e3";
  const producerAddress = "0x137583301DC66643300ac666A4a02c0DE0b8fd5e";
  const distributorAddress = "0x9a96b1545bF654c5FBb9B23C11338CBD67e8e9E1";
  const retailerAddress = "0x5A7A30337bC1b7691Bc5D305c5d1dA33aA269B11";
  const customerAddress = "0x21417677bd8ba5CC4fd489d2647D64b0b42A9CE6";

  const MedoraCentral = await ethers.getContractAt("MedoraCentral", centralAddress);

  const PRODUCER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRODUCER_ROLE"));
  const INTERNAL_VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("INTERNAL_VERIFIER_ROLE"));

  console.log("Configuring Roles and Permissions...");

  async function grant(role, addr, label) {
    console.log(`Granting ${label} to ${addr}...`);
    try {
      const tx = await MedoraCentral.grantRole(role, addr);
      await tx.wait();
      console.log("Confirmed.");
    } catch (e) {
      if (e.message.includes("is already granted")) {
        console.log("Already granted.");
      } else {
        throw e;
      }
    }
  }

  await grant(PRODUCER_ROLE, producerAddress, "PRODUCER_ROLE");
  await grant(INTERNAL_VERIFIER_ROLE, distributorAddress, "INTERNAL_VERIFIER_ROLE (Distributor)");
  await grant(INTERNAL_VERIFIER_ROLE, retailerAddress, "INTERNAL_VERIFIER_ROLE (Retailer)");
  await grant(INTERNAL_VERIFIER_ROLE, customerAddress, "INTERNAL_VERIFIER_ROLE (Customer)");

  console.log("\nSetup Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
