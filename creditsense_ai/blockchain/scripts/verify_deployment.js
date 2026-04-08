/**
 * verify_deployment.js — Quick smoke-test after deployment.
 * Calls logDocument, logAction, logDecision, then reads the audit trail.
 *
 * Usage:
 *   Local:  npx hardhat run scripts/verify_deployment.js
 *   Amoy:   npx hardhat run scripts/verify_deployment.js --network amoy
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Connect to the specified network
  const networkName = hre.globalOptions.network ?? "hardhat";
  const connection = await hre.network.connect(networkName);
  const ethers = connection.ethers;

  // Load contract address from .env
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in .env. Deploy first!");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();

  // Load ABI
  const abiPath = path.join(__dirname, "..", "contract_abi.json");
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const testLoanId = "TEST_LOAN_HARDHAT_001";
  const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("test-document-bytes"));

  console.log("═══════════════════════════════════════════════════");
  console.log("  CreditSense AI — Post-Deployment Verification");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Network  : ${networkName}`);
  console.log(`  Contract : ${contractAddress}`);
  console.log(`  Wallet   : ${signer.address}\n`);

  // 1. Log a Document
  console.log("1️⃣  Logging a test document...");
  let tx = await contract.logDocument(testLoanId, "GST_RETURN", fakeHash);
  let receipt = await tx.wait();
  console.log(`   ✅ TX: ${receipt.hash}  |  Block: ${receipt.blockNumber}\n`);

  // 2. Log an Action
  console.log("2️⃣  Logging an RL agent action...");
  const stateHash = ethers.keccak256(ethers.toUtf8Bytes('{"step":1,"action":"REQUEST_GST"}'));
  tx = await contract.logAction(testLoanId, 5, stateHash);
  receipt = await tx.wait();
  console.log(`   ✅ TX: ${receipt.hash}  |  Block: ${receipt.blockNumber}\n`);

  // 3. Log a Decision
  console.log("3️⃣  Logging a final decision...");
  const camHash = ethers.keccak256(ethers.toUtf8Bytes("cam-report-bytes"));
  tx = await contract.logDecision(testLoanId, "APPROVE", camHash);
  receipt = await tx.wait();
  console.log(`   ✅ TX: ${receipt.hash}  |  Block: ${receipt.blockNumber}\n`);

  // 4. Read back the full trail
  console.log("4️⃣  Reading audit trail...");
  const trail = await contract.getAuditTrail(testLoanId);
  console.log(`   📜 Total entries: ${trail.length}`);
  trail.forEach((entry, i) => {
    const types = ["DOCUMENT", "ACTION", "DECISION"];
    console.log(`   [${i}] Type: ${types[Number(entry.entryType)]}  |  ActionCode: ${entry.actionCode}  |  Time: ${new Date(Number(entry.timestamp) * 1000).toISOString()}`);
  });

  // Close connection
  await connection.close();

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  ✅ All verification steps passed!");
  console.log("═══════════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
