import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with ${deployer.address}`);

  const snl1InitialSupply = ethers.parseUnits('100000000', 18);

  const SNL1Token = await ethers.getContractFactory('SNL1Token');
  const snl1Token = await SNL1Token.deploy(snl1InitialSupply, deployer.address);
  await snl1Token.waitForDeployment();

  const TokenFactory = await ethers.getContractFactory('TokenFactory');
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();

  console.log('SNL1Token:', await snl1Token.getAddress());
  console.log('TokenFactory:', await tokenFactory.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
