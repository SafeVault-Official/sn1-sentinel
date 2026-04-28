#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RPC_URL:-}" ]]; then
  echo "Missing RPC_URL environment variable" >&2
  exit 1
fi

if [[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "Missing DEPLOYER_PRIVATE_KEY environment variable" >&2
  exit 1
fi

NETWORK="${HARDHAT_NETWORK:-target}"

npx hardhat run scripts/deploy-contracts.js --network "$NETWORK"
