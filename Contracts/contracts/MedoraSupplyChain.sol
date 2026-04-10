// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MedoraSupplyChain
 * @dev Immutable ledger layer for Medora medicine authenticity verification platform
 * @notice This contract records and verifies supply chain transactions without storing sensitive data
 * @dev Business logic (KYC, AI checks, admin approval) is handled by the Node.js backend
 */
contract MedoraSupplyChain is AccessControl {
    // Role definitions using AccessControl's built-in role structure
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Custom errors for gas efficiency
    error BatchAlreadyExists(bytes32 batchId);
    error InvalidHandoffSequence();
    error BatchNotFound(bytes32 batchId);
    error InsufficientRole(bytes32 requiredRole);
    error InvalidAddress();
    error UnauthorizedAction(address actor, string message);

    // Struct to store supply chain handoff entries
    struct ChainEntry {
        address actor;        // Address of the actor performing the handoff
        bytes32 role;         // Role of the actor (hash of role string)
        uint256 timestamp;    // When the handoff occurred
    }

    // Batch information stored on-chain
    struct Batch {
        bytes32 medicineHash;        // keccak256 hash of off-chain batch metadata
        address manufacturerAddress; // Address of the manufacturer
        uint256 registrationTimestamp; // When batch was registered
        ChainEntry[] handoffChain;   // Array of all handoff entries
        bool exists;                 // Existence flag for efficient lookup
    }

    // Mapping from batch ID to batch data
    mapping(bytes32 => Batch) public batches;

    // Events for all state changes
    event RoleGranted(address indexed account, bytes32 indexed role, uint256 timestamp);
    event BatchRegistered(bytes32 indexed batchId, address indexed manufacturer, uint256 timestamp);
    event BatchTransferred(bytes32 indexed batchId, address indexed from, address indexed to, bytes32 role, uint256 timestamp);

    /**
     * @dev Constructor sets up initial roles
     * @notice Contract deployer gets admin role by default
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if batch exists
     */
    modifier batchExists(bytes32 batchId) {
        if (!batches[batchId].exists) {
            revert BatchNotFound(batchId);
        }
        _;
    }

    /**
     * @dev Modifier to validate address is not zero
     */
    modifier validAddress(address account) {
        if (account == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    /**
     * @notice Grant a role to an address (admin only)
     * @dev Only admins can grant roles to maintain control over supply chain participants
     * @param account Address to grant role to
     * @param role Role to grant (MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, or RETAILER_ROLE)
     */
    function grantRole(address account, bytes32 role) 
        public 
        onlyRole(ADMIN_ROLE) 
        validAddress(account)
    {
        _grantRole(role, account);
        emit RoleGranted(account, role, block.timestamp);
    }

    /**
     * @notice Register a new medicine batch
     * @dev Only verified manufacturers can register batches
     * @param batchId Unique identifier for the batch (from off-chain system)
     * @param medicineHash keccak256 hash of batch metadata (name, expiry, composition)
     * @param manufacturerAddress Address of the manufacturer registering the batch
     */
    function registerBatch(
        bytes32 batchId, 
        bytes32 medicineHash, 
        address manufacturerAddress
    ) 
        external 
        onlyRole(MANUFACTURER_ROLE) 
        validAddress(manufacturerAddress)
    {
        if (batches[batchId].exists) {
            revert BatchAlreadyExists(batchId);
        }

        // Create new batch with initial chain entry
        Batch storage newBatch = batches[batchId];
        newBatch.medicineHash = medicineHash;
        newBatch.manufacturerAddress = manufacturerAddress;
        newBatch.registrationTimestamp = block.timestamp;
        newBatch.exists = true;

        // Add manufacturer as first entry in handoff chain
        newBatch.handoffChain.push(ChainEntry({
            actor: manufacturerAddress,
            role: MANUFACTURER_ROLE,
            timestamp: block.timestamp
        }));

        emit BatchRegistered(batchId, manufacturerAddress, block.timestamp);
    }

    /**
     * @notice Transfer batch to next supply chain participant
     * @dev Validates sequential handoff: manufacturer -> distributor -> retailer
     * @param batchId ID of batch being transferred
     * @param toAddress Address of the recipient
     * @param role Role of the recipient (DISTRIBUTOR_ROLE or RETAILER_ROLE)
     */
    function transferBatch(
        bytes32 batchId, 
        address toAddress, 
        bytes32 role
    ) 
        external 
        batchExists(batchId)
        validAddress(toAddress)
    {
        Batch storage batch = batches[batchId];
        ChainEntry[] storage chain = batch.handoffChain;

        // Security check: Only the current holder (last actor in chain) can transfer
        if (msg.sender != chain[chain.length - 1].actor) {
            revert UnauthorizedAction(msg.sender, "Caller is not the current batch holder");
        }

        // Verify recipient has the required role
        if (!hasRole(role, toAddress)) {
            revert InsufficientRole(role);
        }
        
        // Get the current holder's role (last entry in chain)
        bytes32 currentRole = chain[chain.length - 1].role;

        // Validate handoff sequence
        if (!_isValidHandoffSequence(currentRole, role)) {
            revert InvalidHandoffSequence();
        }

        // Add new handoff entry to chain
        chain.push(ChainEntry({
            actor: toAddress,
            role: role,
            timestamp: block.timestamp
        }));

        address fromAddress = chain[chain.length - 2].actor; // Previous holder

        emit BatchTransferred(batchId, fromAddress, toAddress, role, block.timestamp);
    }

    /**
     * @notice Verify batch authenticity and get full supply chain history
     * @dev Public function that returns batch validity and complete handoff chain
     * @param batchId ID of batch to verify
     * @return isValid True if batch exists and has valid handoff chain
     * @return history Array of all ChainEntry records showing supply chain provenance
     */
    function verifyBatch(bytes32 batchId) 
        external 
        view 
        returns (bool isValid, ChainEntry[] memory history) 
    {
        if (!batches[batchId].exists) {
            return (false, new ChainEntry[](0));
        }

        Batch storage batch = batches[batchId];
        return (true, batch.handoffChain);
    }

    /**
     * @notice Get batch manufacturer address
     * @dev Helper function to retrieve batch manufacturer
     * @param batchId ID of batch
     * @return manufacturerAddress Address of the batch manufacturer
     */
    function getBatchManufacturer(bytes32 batchId) 
        external 
        view 
        batchExists(batchId)
        returns (address manufacturerAddress) 
    {
        return batches[batchId].manufacturerAddress;
    }

    /**
     * @notice Get batch medicine hash
     * @dev Helper function to retrieve batch medicine metadata hash
     * @param batchId ID of batch
     * @return medicineHash keccak256 hash of batch metadata
     */
    function getBatchMedicineHash(bytes32 batchId) 
        external 
        view 
        batchExists(batchId)
        returns (bytes32 medicineHash) 
    {
        return batches[batchId].medicineHash;
    }

    /**
     * @notice Get batch registration timestamp
     * @dev Helper function to retrieve when batch was registered
     * @param batchId ID of batch
     * @return timestamp Registration timestamp
     */
    function getBatchRegistrationTimestamp(bytes32 batchId) 
        external 
        view 
        batchExists(batchId)
        returns (uint256 timestamp) 
    {
        return batches[batchId].registrationTimestamp;
    }

    /**
     * @notice Get length of handoff chain for a batch
     * @dev Helper function to check how many handoffs have occurred
     * @param batchId ID of batch
     * @return length Number of entries in handoff chain
     */
    function getHandoffChainLength(bytes32 batchId) 
        external 
        view 
        batchExists(batchId)
        returns (uint256 length) 
    {
        return batches[batchId].handoffChain.length;
    }

    /**
     * @dev Internal function to validate handoff sequence
     * @param currentRole Current holder's role
     * @param nextRole Next holder's role
     * @return valid True if sequence is valid
     */
    function _isValidHandoffSequence(bytes32 currentRole, bytes32 nextRole) 
        internal 
        pure 
        returns (bool valid) 
    {
        // Valid sequences:
        // Manufacturer -> Distributor
        // Distributor -> Retailer
        // Retailer -> (any, for final verification)
        
        if (currentRole == MANUFACTURER_ROLE && nextRole == DISTRIBUTOR_ROLE) {
            return true;
        }
        
        if (currentRole == DISTRIBUTOR_ROLE && nextRole == RETAILER_ROLE) {
            return true;
        }
        
        // Allow retailer to transfer (for returns, recalls, etc.)
        if (currentRole == RETAILER_ROLE) {
            return true;
        }
        
        return false;
    }
}
