const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying contracts with:", deployer.address);
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", balance.toString(), "\n");

  // 1️⃣ Deploy LandRegistry
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.deployed();
  console.log("🏡 LandRegistry deployed at:", landRegistry.address);

  // 2️⃣ Deploy ROWEscrow with constructor arguments
  const ROWEscrow = await hre.ethers.getContractFactory("ROWEscrow");
  const escrow = await ROWEscrow.deploy(landRegistry.address, deployer.address);
  await escrow.deployed();
  console.log("🤝 ROWEscrow deployed at:", escrow.address);

  // 3️⃣ (Optional) Set escrow contract address in LandRegistry
  const tx = await landRegistry.setEscrowContract(escrow.address);
  await tx.wait();
  console.log("🔗 Escrow linked to LandRegistry!");

  console.log("\n✅ Deployment completed successfully!");
}

main().catch((error) => {
  console.error("❌ Error during deployment:", error);
  process.exitCode = 1;
});
