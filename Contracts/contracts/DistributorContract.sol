// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./MedoraCentral.sol";

/**
 * @title DistributorContract
 * @dev Contract for distributors to verify medicine batches
 * @notice Handles verification and hash chaining at distributor stage
 */
contract DistributorContract is AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    MedoraCentral public centralContract;

    // Custom errors
    error OnlyDistributorAllowed(address caller);
    error DistributorNotSet(bytes32 batchId);
    error InvalidDistributorSignature();
    error BatchNotReadyForDistributor(bytes32 batchId);

    // Struct to store distributor verification details
    struct DistributorVerification {
        address distributorAddress;
        bytes32 distributorHash;
        uint256 verificationTimestamp;
        string verificationData; // Off-chain verification details (JSON string)
        bool batchMatch;
        bool expiryMatch;
        bool compositionMatch;
        bool packagingMatch;
        uint256 quantityReceived;
        bool exists;
    }

    // Mapping from batch ID to distributor verification data
    mapping(bytes32 => DistributorVerification) public distributorVerifications;

    // Events
    event DistributorVerificationCompleted(
        bytes32 indexed batchId,
        address indexed distributor,
        bytes32 distributorHash,
        bool batchMatch,
        bool expiryMatch,
        bool packagingMatch
    );

    event VerificationDataStored(
        bytes32 indexed batchId,
        string verificationData,
        uint256 quantityReceived
    );

    /**
     * @dev Constructor
     * @param _centralContract Address of the MedoraCentral contract
     */
    constructor(address _centralContract) {
        centralContract = MedoraCentral(_centralContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if caller is a registered distributor
     */
    modifier onlyDistributor() {
        if (!hasRole(DISTRIBUTOR_ROLE, msg.sender)) {
            revert OnlyDistributorAllowed(msg.sender);
        }
        _;
    }

    /**
     * @notice Verify batch at distributor stage with detailed checks
     * @dev Updates hash chain and stores verification data
     * @param batchId ID of the batch to verify
     * @param batchMatch Does batch number match
     * @param expiryMatch Does expiry date match
     * @param compositionMatch Does composition match
     * @param packagingMatch Is packaging intact
     * @param quantityReceived Quantity received by distributor
     * @param verificationData Additional verification details as JSON string
     * @return distributorHash New hash after distributor verification
     */
    function verifyDistributorBatch(
        bytes32 batchId,
        bool batchMatch,
        bool expiryMatch,
        bool compositionMatch,
        bool packagingMatch,
        uint256 quantityReceived,
        string memory verificationData
    ) external onlyDistributor returns (bytes32 distributorHash) {
        // Get current hash from central contract
        (bool isLegitimate, bytes32 currentHash,,) = centralContract.verifyBatchAuthenticity(batchId);
        if (!isLegitimate) {
            revert BatchNotReadyForDistributor(batchId);
        }

        // Calculate new hash: hash(currentHash + distributorAddress)
        distributorHash = keccak256(abi.encodePacked(
            currentHash,
            msg.sender
        ));

        // Create signature for verification
        bytes32 message = keccak256(abi.encodePacked(batchId, distributorHash));
        bytes32 ethMessage = message.toEthSignedMessageHash();

        // In production, signature should be passed as parameter
        // For demo, we use msg.sender as signature
        bytes memory signature = abi.encodePacked(msg.sender);

        // Verify on central contract
        try centralContract.verifyDistributor(batchId, distributorHash, msg.sender, signature) {
            // Store verification details
            DistributorVerification memory verification = DistributorVerification({
                distributorAddress: msg.sender,
                distributorHash: distributorHash,
                verificationTimestamp: block.timestamp,
                verificationData: verificationData,
                batchMatch: batchMatch,
                expiryMatch: expiryMatch,
                compositionMatch: compositionMatch,
                packagingMatch: packagingMatch,
                quantityReceived: quantityReceived,
                exists: true
            });
            distributorVerifications[batchId] = verification;

            emit DistributorVerificationCompleted(
                batchId,
                msg.sender,
                distributorHash,
                batchMatch,
                expiryMatch,
                packagingMatch
            );
            emit VerificationDataStored(batchId, verificationData, quantityReceived);

            return distributorHash;
        } catch {
            revert InvalidDistributorSignature();
        }
    }

    /**
     * @notice Get distributor verification details for a batch
     * @param batchId ID of the batch
     * @return verification Complete verification data
     */
    function getDistributorVerification(bytes32 batchId)
        external
        view
        returns (DistributorVerification memory verification)
    {
        return distributorVerifications[batchId];
    }

    /**
     * @notice Check if distributor verification exists for a batch
     * @param batchId ID of the batch
     * @return verified Whether distributor has verified the batch
     */
    function isDistributorVerified(bytes32 batchId) external view returns (bool verified) {
        return distributorVerifications[batchId].exists;
    }

    /**
     * @notice Get verification status of all checks
     * @param batchId ID of the batch
     * @return batchMatch Batch number matches
     * @return expiryMatch Expiry date matches
     * @return compositionMatch Composition matches
     * @return packagingMatch Packaging intact
     */
    function getVerificationStatus(bytes32 batchId)
        external
        view
        returns (
            bool batchMatch,
            bool expiryMatch,
            bool compositionMatch,
            bool packagingMatch
        )
    {
        DistributorVerification memory verification = distributorVerifications[batchId];
        return (
            verification.batchMatch,
            verification.expiryMatch,
            verification.compositionMatch,
            verification.packagingMatch
        );
    }

    /**
     * @notice Grant distributor role to an address (admin only)
     * @param account Address to grant distributor role
     */
    function grantDistributorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DISTRIBUTOR_ROLE, account);
    }

    /**
     * @notice Revoke distributor role from an address (admin only)
     * @param account Address to revoke distributor role
     */
    function revokeDistributorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DISTRIBUTOR_ROLE, account);
    }

    /**
     * @notice Get distributor statistics (placeholder)
     * @return totalVerifications Placeholder for verification count
     */
    function getDistributorStats() external pure returns (uint256 totalVerifications) {
        return 0; // Placeholder - in real implementation would track statistics
    }
}
