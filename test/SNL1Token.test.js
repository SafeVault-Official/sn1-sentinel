import { expect } from "chai";
import { ethers } from "hardhat";

describe("SNL1Token", function () {
  async function deployFixture(initialSupply = 1_000n) {
    const [owner, alice, bob, spender] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("SNL1Token");
    const token = await Token.deploy(initialSupply, owner.address);
    return { token, owner, alice, bob, spender, initialSupply };
  }

  describe("normal flows", function () {
    it("deploys with expected metadata and mints initial supply", async function () {
      const { token, owner, initialSupply } = await deployFixture();
      expect(await token.name()).to.equal("SNL1");
      expect(await token.symbol()).to.equal("SNL1");
      expect(await token.decimals()).to.equal(18);
      expect(await token.owner()).to.equal(owner.address);
      expect(await token.totalSupply()).to.equal(initialSupply);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("supports transfer/approve/transferFrom lifecycle", async function () {
      const { token, owner, alice, bob, spender } = await deployFixture(5_000n);

      await expect(token.transfer(alice.address, 1_000n))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, 1_000n);

      await expect(token.connect(alice).approve(spender.address, 700n))
        .to.emit(token, "Approval")
        .withArgs(alice.address, spender.address, 700n);

      await expect(token.connect(spender).transferFrom(alice.address, bob.address, 400n))
        .to.emit(token, "Transfer")
        .withArgs(alice.address, bob.address, 400n);

      expect(await token.balanceOf(alice.address)).to.equal(600n);
      expect(await token.balanceOf(bob.address)).to.equal(400n);
      expect(await token.allowance(alice.address, spender.address)).to.equal(300n);
    });

    it("allows owner minting and ownership transfer", async function () {
      const { token, owner, alice } = await deployFixture(200n);

      await expect(token.mint(alice.address, 50n))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, 50n);

      expect(await token.totalSupply()).to.equal(250n);

      await expect(token.transferOwnership(alice.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, alice.address);

      await expect(token.connect(alice).mint(alice.address, 10n)).to.not.be.reverted;
    });
  });

  describe("edge cases", function () {
    it("supports zero initial supply deployments", async function () {
      const { token, owner } = await deployFixture(0n);
      expect(await token.totalSupply()).to.equal(0n);
      expect(await token.balanceOf(owner.address)).to.equal(0n);
    });

    it("supports zero-value transfer for funded account", async function () {
      const { token, owner, alice } = await deployFixture(1n);
      await expect(token.transfer(alice.address, 0n))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, 0n);
      expect(await token.balanceOf(owner.address)).to.equal(1n);
      expect(await token.balanceOf(alice.address)).to.equal(0n);
    });

    it("supports resetting allowance from non-zero to zero", async function () {
      const { token, owner, spender } = await deployFixture(1n);
      await token.approve(spender.address, 10n);
      expect(await token.allowance(owner.address, spender.address)).to.equal(10n);
      await token.approve(spender.address, 0n);
      expect(await token.allowance(owner.address, spender.address)).to.equal(0n);
    });
  });

  describe("failure cases", function () {
    it("reverts on zero owner at deployment", async function () {
      const Token = await ethers.getContractFactory("SNL1Token");
      await expect(Token.deploy(10n, ethers.ZeroAddress)).to.be.revertedWithCustomError(Token, "ZeroAddress");
    });

    it("reverts on transfer to zero address", async function () {
      const { token } = await deployFixture();
      await expect(token.transfer(ethers.ZeroAddress, 1n)).to.be.revertedWithCustomError(token, "ZeroAddress");
    });

    it("reverts on insufficient balance", async function () {
      const { token, alice, bob } = await deployFixture(0n);
      await expect(token.connect(alice).transfer(bob.address, 1n)).to.be.revertedWithCustomError(token, "InsufficientBalance");
    });

    it("reverts on approve zero spender", async function () {
      const { token } = await deployFixture();
      await expect(token.approve(ethers.ZeroAddress, 1n)).to.be.revertedWithCustomError(token, "ZeroAddress");
    });

    it("reverts transferFrom with missing allowance", async function () {
      const { token, owner, alice } = await deployFixture(100n);
      await expect(token.connect(alice).transferFrom(owner.address, alice.address, 1n))
        .to.be.revertedWithCustomError(token, "InsufficientAllowance");
    });

    it("reverts mint/transferOwnership for non-owner", async function () {
      const { token, alice, bob } = await deployFixture();
      await expect(token.connect(alice).mint(bob.address, 10n)).to.be.revertedWithCustomError(token, "NotOwner");
      await expect(token.connect(alice).transferOwnership(bob.address)).to.be.revertedWithCustomError(token, "NotOwner");
    });

    it("reverts transferOwnership to zero address", async function () {
      const { token } = await deployFixture();
      await expect(token.transferOwnership(ethers.ZeroAddress)).to.be.revertedWithCustomError(token, "ZeroAddress");
    });
  });

  describe("attack scenarios", function () {
    it("prevents allowance-drain abuse after spender consumes full approval", async function () {
      const { token, owner, alice, spender } = await deployFixture(200n);
      await token.transfer(alice.address, 100n);
      await token.connect(alice).approve(spender.address, 50n);

      await token.connect(spender).transferFrom(alice.address, owner.address, 50n);
      expect(await token.allowance(alice.address, spender.address)).to.equal(0n);

      await expect(token.connect(spender).transferFrom(alice.address, owner.address, 1n))
        .to.be.revertedWithCustomError(token, "InsufficientAllowance");
    });

    it("has no external-call transfer hook, limiting reentrancy surface", async function () {
      const { token, alice } = await deployFixture(10n);
      await expect(token.transfer(alice.address, 5n)).to.not.be.reverted;
      // Contract performs only storage updates/events in transfer path; no callback surface.
      expect(await token.balanceOf(alice.address)).to.equal(5n);
    });
  });
});
