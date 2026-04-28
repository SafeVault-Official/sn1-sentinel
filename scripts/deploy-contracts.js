import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ethers, network } from 'hardhat';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toUnits(value) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid SNL1_INITIAL_SUPPLY: ${value}`);
  }
  return ethers.parseUnits(value, 18);
}

async function main() {
  requireEnv('DEPLOYER_PRIVATE_KEY');
  requireEnv('RPC_URL');

  const [deployer] = await ethers.getSigners();
  const initialSupply = toUnits(process.env.SNL1_INITIAL_SUPPLY ?? '100000000');
  const outputPath = resolve(process.cwd(), process.env.DEPLOY_OUTPUT ?? `deployments/${network.name}.json`);

  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Initial supply: ${ethers.formatUnits(initialSupply, 18)} SNL1`);

  const SNL1Token = await ethers.getContractFactory('SNL1Token');
  const snl1Token = await SNL1Token.deploy(initialSupply, deployer.address);
  await snl1Token.waitForDeployment();

  const TokenFactory = await ethers.getContractFactory('TokenFactory');
  const tokenFactory = await TokenFactory.deploy();
  await tokenFactory.waitForDeployment();

  const deployed = {
    network: network.name,
    chainId: Number(network.config.chainId ?? 0),
    deployer: deployer.address,
    contracts: {
      SNL1Token: await snl1Token.getAddress(),
      TokenFactory: await tokenFactory.getAddress(),
    },
    deployedAt: new Date().toISOString(),
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(deployed, null, 2)}\n`);

  console.log('\nDeployed addresses:');
  console.table(deployed.contracts);
  console.log(`Saved deployment details to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
