// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./MedoraCentral.sol";

/**
 * @title ProducerContract
 * @dev Contract for medicine producers/manufacturers to register batches
 * @notice Handles batch initialization with cryptographic hashing
 */
contract ProducerContract is AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    MedoraCentral public centralContract;

    // Custom errors
    error OnlyProducerAllowed(address caller);
    error EmptyBatchData();
    error RegistrationFailed();

    // Struct to store batch metadata off-chain reference
    struct BatchMetadata {
        string name;
        string composition;
        string expiryDate;
        string batchNumber;
        string manufacturer;
        uint256 productionDate;
        bool exists;
    }

    // Mapping from batch ID to metadata (stored for producer reference)
    mapping(bytes32 => BatchMetadata) public batchMetadata;

    // Events
    event BatchInitialized(
        bytes32 indexed batchId,
        bytes32 indexed medicineHash,
        address indexed producer,
        string name,
        string batchNumber
    );

    event MetadataStored(
        bytes32 indexed batchId,
        string name,
        string batchNumber
    );

    /**
     * @dev Constructor
     * @param _centralContract Address of the MedoraCentral contract
     */
    constructor(address _centralContract) {
        centralContract = MedoraCentral(_centralContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRODUCER_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if caller is a registered producer
     */
    modifier onlyProducer() {
        if (!hasRole(PRODUCER_ROLE, msg.sender)) {
            revert OnlyProducerAllowed(msg.sender);
        }
        _;
    }

    /**
     * @notice Initialize a new medicine batch
     * @dev Creates initial hash from medicine data and registers on central contract
     * @param name Medicine name
     * @param composition Medicine composition
     * @param expiryDate Expiry date
     * @param batchNumber Batch number
     * @param manufacturer Manufacturer name
     * @param productionDate Production timestamp
     * @return batchId Unique batch identifier
     * @return medicineHash Initial hash of the batch data
     */
    function initializeBatch(
        string memory name,
        string memory composition,
        string memory expiryDate,
        string memory batchNumber,
        string memory manufacturer,
        uint256 productionDate
    ) external onlyProducer returns (bytes32 batchId, bytes32 medicineHash) {
        // Validate input
        if (bytes(name).length == 0 || bytes(batchNumber).length == 0) {
            revert EmptyBatchData();
        }

        // Generate batch ID (keccak256 of unique identifiers)
        batchId = keccak256(abi.encodePacked(
            batchNumber,
            manufacturer,
            productionDate,
            msg.sender,
            block.timestamp
        ));

        // Generate initial medicine hash (keccak256 of all medicine data)
        medicineHash = keccak256(abi.encodePacked(
            name,
            composition,
            expiryDate,
            batchNumber,
            manufacturer,
            productionDate
        ));

        // Create signature for the hash (producer signs the batchId + medicineHash)
        bytes32 message = keccak256(abi.encodePacked(batchId, medicineHash));
        bytes32 ethMessage = message.toEthSignedMessageHash();

        // In production, this would be signed off-chain and passed as parameter
        // For demo purposes, we'll use msg.sender's signature capability
        // In real implementation, signature should be passed as parameter
        bytes memory signature = abi.encodePacked(msg.sender);

        // Register on central contract
        try centralContract.registerBatch(batchId, medicineHash, msg.sender, signature) {
            // Store metadata locally for producer's reference
            BatchMetadata memory metadata = BatchMetadata({
                name: name,
                composition: composition,
                expiryDate: expiryDate,
                batchNumber: batchNumber,
                manufacturer: manufacturer,
                productionDate: productionDate,
                exists: true
            });
            batchMetadata[batchId] = metadata;

            emit BatchInitialized(batchId, medicineHash, msg.sender, name, batchNumber);
            emit MetadataStored(batchId, name, batchNumber);

            return (batchId, medicineHash);
        } catch {
            revert RegistrationFailed();
        }
    }

    /**
     * @notice Get batch metadata for a producer
     * @dev Returns off-chain metadata stored by the producer
     * @param batchId ID of the batch
     * @return metadata Complete batch metadata
     */
    function getBatchMetadata(bytes32 batchId)
        external
        view
        returns (BatchMetadata memory metadata)
    {
        return batchMetadata[batchId];
    }

    /**
     * @notice Check if batch exists in producer's registry
     * @param batchId ID of the batch
     * @return exists Whether batch metadata exists
     */
    function batchExists(bytes32 batchId) external view returns (bool exists) {
        return batchMetadata[batchId].exists;
    }

    /**
     * @notice Get count of batches registered by this producer
     * @dev This is a simple counter demonstration
     * @return count Number of batches (placeholder)
     */
    function getBatchCount() external pure returns (uint256 count) {
        // In a real implementation, this would track actual batch count
        return 0; // Placeholder
    }

    /**
     * @notice Grant producer role to an address (admin only)
     * @param account Address to grant producer role
     */
    function grantProducerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(PRODUCER_ROLE, account);
    }

    /**
     * @notice Revoke producer role from an address (admin only)
     * @param account Address to revoke producer role
     */
    function revokeProducerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(PRODUCER_ROLE, account);
    }
}
