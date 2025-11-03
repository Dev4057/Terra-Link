// test/ROWEscrow.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ROWEscrow Payments", function () {
  let LandRegistry, landRegistry;
  let ROWEscrow, rowEscrow;
  let owner, payer, payee;

  beforeEach(async function () {
    // signers
    [owner, payer, payee] = await ethers.getSigners();

    // deploy LandRegistry (your real contract)
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landregistry = await LandRegistry.deploy();         // note variable name lower-case later fixed
    await landregistry.deployed();

    // register a property by payee and mark it ROW (owner is contract deployer so owner can set ROW)
    // use the same API your LandRegistry exposes:
    await landregistry.connect(payee).registerProperty("Test City", 100);
    await landregistry.connect(owner).setROWFlag(1, true);

    // deploy ROWEscrow with registry address and admin = owner
    ROWEscrow = await ethers.getContractFactory("ROWEscrow");
    rowEscrow = await ROWEscrow.deploy(landregistry.address, owner.address);
    await rowEscrow.deployed();
  });

  it("should allow payer to deposit funds for a ROW property", async () => {
    const tx = await rowEscrow
      .connect(payer)
      .createEscrow(1, payee.address, { value: ethers.utils.parseEther("1") });

    await expect(tx).to.emit(rowEscrow, "EscrowCreated");
  });

  it("should allow admin to release funds to payee", async () => {
    await rowEscrow
      .connect(payer)
      .createEscrow(1, payee.address, { value: ethers.utils.parseEther("1") });

    await expect(rowEscrow.connect(owner).releaseFunds(1))
      .to.emit(rowEscrow, "FundsReleased");
  });

  it("should allow admin or payer to refund escrow", async () => {
    await rowEscrow
      .connect(payer)
      .createEscrow(1, payee.address, { value: ethers.utils.parseEther("1") });

    await expect(rowEscrow.connect(owner).refundEscrow(1))
      .to.emit(rowEscrow, "EscrowRefunded");
  });
});
