import { defineConfig } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import dotenv from "dotenv";

// Load wallet key from the shared .env at project root
dotenv.config({ path: "../../.env" });

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],

  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // Local Hardhat EDR simulated node (ephemeral, in-memory)
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },

    // Local Hardhat persistent node (started with `npm run node`)
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: [
        // Hardhat Account #0 — pre-funded with 10,000 ETH (free)
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      ],
    },

    // Polygon Amoy Testnet (needs POL tokens for gas)
    amoy: {
      type: "http",
      url: "https://rpc-amoy.polygon.technology",
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gasPrice: 35000000000,
    },
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
