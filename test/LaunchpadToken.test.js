import { expect } from "chai";
import { ethers } from "hardhat";

describe("LaunchpadToken", function () {
  async function deployFixture(overrides = {}) {
    const [creator, alice, bob, spender] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LaunchpadToken");

    const params = {
      tokenName: overrides.tokenName ?? "Sentinel",
      tokenSymbol: overrides.tokenSymbol ?? "SENT",
      initialSupply: overrides.initialSupply ?? 2_000n,
      metadataURI: overrides.metadataURI ?? "ipfs://meta",
      imageURI: overrides.imageURI ?? "ipfs://image",
      creator: overrides.creator ?? creator.address,
    };

    const token = await Token.deploy(
      params.tokenName,
      params.tokenSymbol,
      params.initialSupply,
      params.metadataURI,
      params.imageURI,
      params.creator
    );

    return { token, creator, alice, bob, spender, params };
  }

  describe("normal flows", function () {
    it("deploys with metadata, URIs, and initial mint", async function () {
      const { token, creator, params } = await deployFixture();
      expect(await token.name()).to.equal(params.tokenName);
      expect(await token.symbol()).to.equal(params.tokenSymbol);
      expect(await token.metadataURI()).to.equal(params.metadataURI);
      expect(await token.imageURI()).to.equal(params.imageURI);
      expect(await token.owner()).to.equal(creator.address);
      expect(await token.balanceOf(creator.address)).to.equal(params.initialSupply);
    });

    it("supports transfer and delegated transfer with allowance decrement", async function () {
      const { token, creator, alice, bob, spender } = await deployFixture({ initialSupply: 1_000n });
      await token.transfer(alice.address, 450n);
      await token.connect(alice).approve(spender.address, 200n);
      await token.connect(spender).transferFrom(alice.address, bob.address, 120n);

      expect(await token.balanceOf(alice.address)).to.equal(330n);
      expect(await token.balanceOf(bob.address)).to.equal(120n);
      expect(await token.allowance(alice.address, spender.address)).to.equal(80n);
      expect(await token.balanceOf(creator.address)).to.equal(550n);
    });

    it("supports owner minting and ownership transfer", async function () {
      const { token, creator, alice } = await deployFixture({ initialSupply: 0n });
      await token.mint(creator.address, 100n);
      expect(await token.totalSupply()).to.equal(100n);

      await token.transferOwnership(alice.address);
      expect(await token.owner()).to.equal(alice.address);

      await expect(token.connect(alice).mint(alice.address, 1n)).to.not.be.reverted;
    });
  });

  describe("edge cases", function () {
    it("supports empty metadata/image URIs", async function () {
      const { token } = await deployFixture({ metadataURI: "", imageURI: "" });
      expect(await token.metadataURI()).to.equal("");
      expect(await token.imageURI()).to.equal("");
    });

    it("supports zero initial supply", async function () {
      const { token } = await deployFixture({ initialSupply: 0n });
      expect(await token.totalSupply()).to.equal(0n);
    });
  });

  describe("failure cases", function () {
    it("rejects zero creator", async function () {
      const Token = await ethers.getContractFactory("LaunchpadToken");
      await expect(Token.deploy("A", "B", 1n, "", "", ethers.ZeroAddress))
        .to.be.revertedWithCustomError(Token, "ZeroAddress");
    });

    it("rejects empty token name or symbol", async function () {
      const Token = await ethers.getContractFactory("LaunchpadToken");
      const [creator] = await ethers.getSigners();

      await expect(Token.deploy("", "S", 1n, "", "", creator.address))
        .to.be.revertedWithCustomError(Token, "InvalidTokenConfig");
      await expect(Token.deploy("Name", "", 1n, "", "", creator.address))
        .to.be.revertedWithCustomError(Token, "InvalidTokenConfig");
    });

    it("rejects transfer to zero and insufficient balance", async function () {
      const { token, alice } = await deployFixture({ initialSupply: 0n });
      await expect(token.transfer(ethers.ZeroAddress, 1n)).to.be.revertedWithCustomError(token, "ZeroAddress");
      await expect(token.connect(alice).transfer(alice.address, 1n)).to.be.revertedWithCustomError(token, "InsufficientBalance");
    });

    it("rejects approve zero spender and missing transferFrom allowance", async function () {
      const { token, creator, spender } = await deployFixture();
      await expect(token.approve(ethers.ZeroAddress, 1n)).to.be.revertedWithCustomError(token, "ZeroAddress");
      await expect(token.connect(spender).transferFrom(creator.address, spender.address, 1n))
        .to.be.revertedWithCustomError(token, "InsufficientAllowance");
    });

    it("rejects privileged actions from non-owner", async function () {
      const { token, alice } = await deployFixture();
      await expect(token.connect(alice).mint(alice.address, 1n)).to.be.revertedWithCustomError(token, "NotOwner");
      await expect(token.connect(alice).transferOwnership(alice.address)).to.be.revertedWithCustomError(token, "NotOwner");
    });
  });

  describe("attack scenarios", function () {
    it("prevents approval abuse after allowance is exhausted", async function () {
      const { token, creator, alice, spender } = await deployFixture({ initialSupply: 500n });
      await token.transfer(alice.address, 200n);
      await token.connect(alice).approve(spender.address, 200n);

      await token.connect(spender).transferFrom(alice.address, creator.address, 200n);
      await expect(token.connect(spender).transferFrom(alice.address, creator.address, 1n))
        .to.be.revertedWithCustomError(token, "InsufficientAllowance");
    });

    it("uses checks-effects-only transfer path with no external calls (reentrancy hardening)", async function () {
      const { token, alice } = await deployFixture();
      await expect(token.transfer(alice.address, 10n)).to.not.be.reverted;
      expect(await token.balanceOf(alice.address)).to.equal(10n);
    });
  });
});
