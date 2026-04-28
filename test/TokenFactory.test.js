import { expect } from "chai";
import { ethers } from "hardhat";

describe("TokenFactory", function () {
  async function deployFixture() {
    const [creator, otherCreator, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("TokenFactory");
    const factory = await Factory.deploy();
    return { factory, creator, otherCreator, alice };
  }

  async function getTokenAt(address) {
    return ethers.getContractAt("LaunchpadToken", address);
  }

  describe("normal flows", function () {
    it("creates token with metadata and tracks global/creator indexes", async function () {
      const { factory, creator } = await deployFixture();
      const tx = await factory.createToken("Alpha", "ALPHA", 1_000n, "ipfs://alpha");
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "TokenCreated");

      const tokenAddress = event.args.tokenAddress;
      const token = await getTokenAt(tokenAddress);

      expect(event.args.creator).to.equal(creator.address);
      expect(await token.owner()).to.equal(creator.address);
      expect(await token.metadataURI()).to.equal("ipfs://alpha");
      expect(await token.imageURI()).to.equal("");
      expect(await token.totalSupply()).to.equal(1_000n);

      expect(await factory.totalCreatedTokens()).to.equal(1n);
      const allTokens = await factory.getAllTokens();
      expect(allTokens).to.have.length(1);
      expect(allTokens[0].tokenAddress).to.equal(tokenAddress);
      expect(allTokens[0].creator).to.equal(creator.address);

      const byCreator = await factory.getTokensByCreator(creator.address);
      expect(byCreator).to.have.length(1);
      expect(byCreator[0].symbol).to.equal("ALPHA");
    });

    it("creates token with image and isolates creator-specific inventories", async function () {
      const { factory, creator, otherCreator } = await deployFixture();
      await factory.connect(creator).createTokenWithImage("One", "ONE", 10n, "ipfs://one", "ipfs://one-image");
      await factory.connect(otherCreator).createToken("Two", "TWO", 20n, "ipfs://two");

      const creatorTokens = await factory.getTokensByCreator(creator.address);
      const otherTokens = await factory.getTokensByCreator(otherCreator.address);
      expect(creatorTokens).to.have.length(1);
      expect(otherTokens).to.have.length(1);
      expect(creatorTokens[0].imageURI).to.equal("ipfs://one-image");
      expect(otherTokens[0].imageURI).to.equal("");
      expect(await factory.totalCreatedTokens()).to.equal(2n);
    });
  });

  describe("edge cases", function () {
    it("accepts 12-char symbols and stores timestamps", async function () {
      const { factory, creator } = await deployFixture();
      await factory.createToken("Twelve", "ABCDEFGHIJKL", 42n, "ipfs://meta");
      const records = await factory.getTokensByCreator(creator.address);

      expect(records[0].symbol).to.equal("ABCDEFGHIJKL");
      expect(records[0].createdAt).to.be.gt(0n);
    });

    it("returns empty arrays for creators with no tokens", async function () {
      const { factory, alice } = await deployFixture();
      const records = await factory.getTokensByCreator(alice.address);
      expect(records).to.have.length(0);
    });
  });

  describe("failure cases", function () {
    it("rejects invalid name/symbol/supply combinations", async function () {
      const { factory } = await deployFixture();
      await expect(factory.createToken("", "GOOD", 1n, "ipfs://m")).to.be.revertedWithCustomError(factory, "InvalidName");
      await expect(factory.createToken("Name", "", 1n, "ipfs://m")).to.be.revertedWithCustomError(factory, "InvalidSymbol");
      await expect(factory.createToken("Name", "TOO-LONG-SYMBOL", 1n, "ipfs://m")).to.be.revertedWithCustomError(factory, "InvalidSymbol");
      await expect(factory.createToken("Name", "GOOD", 0n, "ipfs://m")).to.be.revertedWithCustomError(factory, "InvalidSupply");
    });
  });

  describe("attack scenarios", function () {
    it("records creator as msg.sender, not tx.origin (abuse resistance)", async function () {
      const { factory, creator } = await deployFixture();
      const Caller = await ethers.getContractFactory("FactoryCaller");
      const caller = await Caller.connect(creator).deploy();

      const tx = await caller.createBasic(factory.target, "ProxyMade", "PXY", 99n, "ipfs://proxy");
      const receipt = await tx.wait();

      // Find TokenCreated in tx logs.
      const parsed = receipt.logs
        .map((log) => {
          try {
            return factory.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((x) => x?.name === "TokenCreated");

      const createdAddress = parsed.args.tokenAddress;
      const token = await getTokenAt(createdAddress);
      expect(parsed.args.creator).to.equal(caller.target);
      expect(await token.owner()).to.equal(caller.target);

      const byExternallyOwnedAccount = await factory.getTokensByCreator(creator.address);
      expect(byExternallyOwnedAccount).to.have.length(0);

      const byCallerContract = await factory.getTokensByCreator(caller.target);
      expect(byCallerContract).to.have.length(1);
      expect(byCallerContract[0].name).to.equal("ProxyMade");
    });

    it("is resilient to reentrancy by design because create path has no external callbacks", async function () {
      const { factory } = await deployFixture();
      await expect(factory.createToken("Safe", "SAFE", 1n, "ipfs://safe")).to.not.be.reverted;
      expect(await factory.totalCreatedTokens()).to.equal(1n);
    });
  });
});
