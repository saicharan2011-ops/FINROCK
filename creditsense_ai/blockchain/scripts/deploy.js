/**
 * deploy.js — Deploys CreditAuditTrail to the configured network.
 *
 * Usage:
 *   Local:  npx hardhat run scripts/deploy.js
 *   Amoy:   npx hardhat run scripts/deploy.js --network amoy
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const networkName = hre.globalOptions.network ?? "hardhat";
  const connection = await hre.network.connect(networkName);
  const ethers = connection.ethers;

  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════════════");
  console.log("  CreditSense AI — Smart Contract Deployment");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Network          : ${networkName}`);
  console.log(`  Deployer Wallet  : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Wallet Balance   : ${ethers.formatEther(balance)} ETH`);
  console.log("═══════════════════════════════════════════════════\n");

  console.log("⏳ Deploying CreditAuditTrail...");
  const CreditAuditTrail = await ethers.getContractFactory("CreditAuditTrail");
  const contract = await CreditAuditTrail.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log(`✅ CreditAuditTrail deployed successfully!`);
  console.log(`   Contract Address: ${contractAddress}\n`);

  // ─── Auto-export ABI for web3_logger.py ───────────────────────
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts",
    "CreditAuditTrail.sol", "CreditAuditTrail.json"
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiOutputPath = path.join(__dirname, "..", "contract_abi.json");
    fs.writeFileSync(abiOutputPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`📋 ABI auto-exported to: contract_abi.json`);
  }

  // ─── Auto-update .env with the new contract address ───────────
  const envPath = path.join(__dirname, "..", "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");

    // Update CONTRACT_ADDRESS (handles both empty and filled values)
    envContent = envContent.replace(
      /CONTRACT_ADDRESS="[^"]*"/,
      `CONTRACT_ADDRESS="${contractAddress}"`
    );

    // If deploying to local, ensure local settings
    if (networkName === "hardhat" || networkName === "localhost") {
      envContent = envContent.replace(
        /NETWORK_MODE="[^"]*"/,
        `NETWORK_MODE="local"`
      );
      envContent = envContent.replace(
        /CHAIN_ID="[^"]*"/,
        `CHAIN_ID="31337"`
      );
      envContent = envContent.replace(
        /RPC_URL="[^"]*"/,
        `RPC_URL="http://127.0.0.1:8545"`
      );
    } else if (networkName === "amoy") {
      envContent = envContent.replace(
        /NETWORK_MODE="[^"]*"/,
        `NETWORK_MODE="amoy"`
      );
      envContent = envContent.replace(
        /CHAIN_ID="[^"]*"/,
        `CHAIN_ID="80002"`
      );
      envContent = envContent.replace(
        /RPC_URL="[^"]*"/,
        `RPC_URL="https://rpc-amoy.polygon.technology"`
      );
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`🔄 .env updated with CONTRACT_ADDRESS and network settings`);
  }

  await connection.close();

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅ Deployment Complete!");
  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("  💡 Make sure the Hardhat node is running:");
    console.log("     npm run node");
  }
  console.log("═══════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
