const { ethers } = require("hardhat");

async function main() {
  const centralAddress = "0x8F81B879f5bBCb5DDecfcf8E87a050F08a937570";
  const producerAddress = "0x5896aC4c1923a5898c2e9193a6F151D72DdB4042";
  const distributorAddress = "0xf26EAb0CF4525921A587635Ebc5584e8511d8FB0";
  const retailerAddress = "0xc476Bd99D0acf2Ad54A7775C803fDD15650f0916";
  const customerAddress = "0x7F0c2615f7dfF0A7740dCa974ce2163B6f19020b";

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
