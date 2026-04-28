# SN1 Sentinel

## Deploy contracts (testnet)

Use the testnet deployment helper script. It expects environment variables for RPC and deployer credentials, then writes deployed addresses to `deployments/<network>.json`.

```bash
# required
export RPC_URL="https://sepolia.infura.io/v3/<your-key>"
export DEPLOYER_PRIVATE_KEY="0x..."

# optional
export HARDHAT_NETWORK="target"        # defaults to target
export SNL1_INITIAL_SUPPLY="100000000" # token amount (18 decimals)
export DEPLOY_OUTPUT="deployments/sepolia.json"

npm run deploy:testnet
```

After deployment, the script prints addresses in the terminal and saves a JSON file with:

- `contracts.SNL1Token`
- `contracts.TokenFactory`
- `network`, `chainId`, `deployer`, `deployedAt`
