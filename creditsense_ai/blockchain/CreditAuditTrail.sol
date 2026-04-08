// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CreditAuditTrail
 * @dev Highly gas-optimized smart contract for logging CreditSense AI's actions on Polygon Layer 2.
 */
contract CreditAuditTrail {

    // Enums use uint8 under the hood, making them significantly cheaper for storage than strings.
    enum EntryType { DOCUMENT, ACTION, DECISION }

    struct AuditEntry {
        string loanId;
        EntryType entryType;
        bytes32 dataHash;
        uint256 timestamp;
        uint8 actionCode;
    }

    // Maps a loan ID to its append-only sequence of immutable events
    mapping(string => AuditEntry[]) private auditTrails;

    // Emitted for real-time tracking. Use primitive string for block explorer readability.
    event AuditLogged(string loanId, string entryType, uint256 timestamp);

    /**
     * @dev Stores the hash of the raw PDF arriving at the system.
     * @notice `_docType` is passed as calldata. This permanently logs the document type 
     * in the transaction input data for zero storage cost—a key gas optimization trick!
     */
    function logDocument(string calldata _loanId, string calldata _docType, bytes32 _docHash) external {
        auditTrails[_loanId].push(AuditEntry({
            loanId: _loanId,
            entryType: EntryType.DOCUMENT,
            dataHash: _docHash,
            timestamp: block.timestamp,
            actionCode: 0 // 0 representing a document logging action
        }));
        
        emit AuditLogged(_loanId, "DOCUMENT", block.timestamp);
    }

    /**
     * @dev Logs every RL agent step, including the TurboQuant-compressed state hash.
     */
    function logAction(string calldata _loanId, uint8 _actionCode, bytes32 _stateHash) external {
        auditTrails[_loanId].push(AuditEntry({
            loanId: _loanId,
            entryType: EntryType.ACTION,
            dataHash: _stateHash,
            timestamp: block.timestamp,
            actionCode: _actionCode
        }));
        
        emit AuditLogged(_loanId, "ACTION", block.timestamp);
    }

    /**
     * @dev Stores the final CAM hash and recommendation.
     * @notice Like `_docType`, `_decision` is kept in calldata to preserve the human-readable 
     * decision on-chain without paying state bloat fees.
     */
    function logDecision(string calldata _loanId, string calldata _decision, bytes32 _camHash) external {
        auditTrails[_loanId].push(AuditEntry({
            loanId: _loanId,
            entryType: EntryType.DECISION,
            dataHash: _camHash,
            timestamp: block.timestamp,
            actionCode: 255 // 255 representing a terminal decision action
        }));
        
        emit AuditLogged(_loanId, "DECISION", block.timestamp);
    }

    /**
     * @dev Retrieves the complete immutable history for a specific loan.
     */
    function getAuditTrail(string calldata _loanId) external view returns (AuditEntry[] memory) {
        return auditTrails[_loanId];
    }
}
