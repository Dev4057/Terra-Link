const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandRegistry Contract", function () {
  let LandRegistry, landRegistry, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    LandRegistry = await ethers.getContractFactory("LandRegistry");
    landRegistry = await LandRegistry.deploy();
    await landRegistry.deployed();
  });

  it("should register a property successfully", async () => {
    const tx = await landRegistry.connect(user1).registerProperty("Plot A", 1200);
    await tx.wait();

    const property = await landRegistry.getProperty(1);
    expect(property.location).to.equal("Plot A");
    expect(property.area).to.equal(1200);
    expect(property.propOwner).to.equal(user1.address);
  });

  it("should allow only owner to set ROW flag", async () => {
    await landRegistry.connect(user1).registerProperty("Plot B", 1000);
    await expect(
      landRegistry.connect(user1).setROWFlag(1, true)
    ).to.be.revertedWith("Ownable: caller is not owner");

    await landRegistry.connect(owner).setROWFlag(1, true);
    const [, , , , rowAffected] = await landRegistry.getProperty(1);
    expect(rowAffected).to.be.true;
  });

  it("should allow property owner to transfer ownership", async () => {
    await landRegistry.connect(user1).registerProperty("Plot C", 500);
    await landRegistry.connect(user1).transferPropertyOwnership(1, user2.address);


    const property = await landRegistry.getProperty(1);
    expect(property.propOwner).to.equal(user2.address);
  });
});
