// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./MedoraCentral.sol";

/**
 * @title RetailerContract
 * @dev Contract for retailers/pharmacies to verify medicine batches
 * @notice Handles final supply chain verification before reaching customer
 */
contract RetailerContract is AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    MedoraCentral public centralContract;

    // Custom errors
    error OnlyRetailerAllowed(address caller);
    error RetailerNotSet(bytes32 batchId);
    error InvalidRetailerSignature();
    error DistributorNotVerified(bytes32 batchId);
    error BatchNotReadyForRetailer(bytes32 batchId);

    // Struct to store retailer verification details
    struct RetailerVerification {
        address retailerAddress;
        bytes32 retailerHash;
        uint256 verificationTimestamp;
        string verificationData; // Off-chain verification details
        bool batchMatch;
        bool expiryMatch;
        bool temperatureControlled;
        bool packagingIntact;
        uint256 quantityReceived;
        uint256 sellingPrice;
        bool exists;
    }

    // Struct to store retail inventory
    struct RetailInventory {
        bytes32 batchId;
        string medicineName;
        uint256 quantityAvailable;
        uint256 quantitySold;
        bool isAvailable;
        uint256 listedTimestamp;
    }

    // Mapping from batch ID to retailer verification data
    mapping(bytes32 => RetailerVerification) public retailerVerifications;

    // Mapping from retailer address to their inventory
    mapping(address => mapping(bytes32 => RetailInventory)) public retailInventory;

    // Events
    event RetailerVerificationCompleted(
        bytes32 indexed batchId,
        address indexed retailer,
        bytes32 retailerHash,
        bool batchMatch,
        bool expiryMatch,
        bool temperatureControlled,
        uint256 quantityReceived
    );

    event InventoryListed(
        bytes32 indexed batchId,
        address indexed retailer,
        string medicineName,
        uint256 quantityAvailable,
        uint256 sellingPrice
    );

    event MedicineSold(
        bytes32 indexed batchId,
        address indexed retailer,
        address indexed customer,
        uint256 quantity
    );

    /**
     * @dev Constructor
     * @param _centralContract Address of the MedoraCentral contract
     */
    constructor(address _centralContract) {
        centralContract = MedoraCentral(_centralContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RETAILER_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if caller is a registered retailer
     */
    modifier onlyRetailer() {
        if (!hasRole(RETAILER_ROLE, msg.sender)) {
            revert OnlyRetailerAllowed(msg.sender);
        }
        _;
    }

    /**
     * @notice Verify batch at retailer stage
     * @dev Final supply chain verification before customer receives medicine
     * @param batchId ID of the batch to verify
     * @param medicineName Name of the medicine
     * @param batchMatch Does batch number match
     * @param expiryMatch Does expiry date match
     * @param temperatureControlled Was temperature maintained during transport
     * @param packagingIntact Is packaging intact upon arrival
     * @param quantityReceived Quantity received by retailer
     * @param sellingPrice Selling price set by retailer
     * @param verificationData Additional verification details
     * @return retailerHash New hash after retailer verification
     */
    function verifyRetailerBatch(
        bytes32 batchId,
        string memory medicineName,
        bool batchMatch,
        bool expiryMatch,
        bool temperatureControlled,
        bool packagingIntact,
        uint256 quantityReceived,
        uint256 sellingPrice,
        string memory verificationData
    ) external onlyRetailer returns (bytes32 retailerHash) {
        // Check if distributor verified first
        if (retailerVerifications[batchId].exists) {
            revert RetailerNotSet(batchId);
        }

        // Verify batch exists and distributor verification is complete
        (bool isLegitimate, bytes32 currentHash,,) = centralContract.verifyBatchAuthenticity(batchId);
        if (!isLegitimate) {
            revert BatchNotReadyForRetailer(batchId);
        }

        // Calculate new hash: hash(currentHash + retailerAddress)
        retailerHash = keccak256(abi.encodePacked(
            currentHash,
            msg.sender
        ));

        // Create signature
        bytes32 message = keccak256(abi.encodePacked(batchId, retailerHash));

        // In production, signature should be passed as parameter
        bytes memory signature = abi.encodePacked(msg.sender);

        // Verify on central contract
        try centralContract.verifyRetailer(batchId, retailerHash, msg.sender, signature) {
            // Store verification details
            RetailerVerification memory verification = RetailerVerification({
                retailerAddress: msg.sender,
                retailerHash: retailerHash,
                verificationTimestamp: block.timestamp,
                verificationData: verificationData,
                batchMatch: batchMatch,
                expiryMatch: expiryMatch,
                temperatureControlled: temperatureControlled,
                packagingIntact: packagingIntact,
                quantityReceived: quantityReceived,
                sellingPrice: sellingPrice,
                exists: true
            });
            retailerVerifications[batchId] = verification;

            // Add to inventory
            RetailInventory memory inventory = RetailInventory({
                batchId: batchId,
                medicineName: medicineName,
                quantityAvailable: quantityReceived,
                quantitySold: 0,
                isAvailable: true,
                listedTimestamp: block.timestamp
            });
            retailInventory[msg.sender][batchId] = inventory;

            emit RetailerVerificationCompleted(
                batchId,
                msg.sender,
                retailerHash,
                batchMatch,
                expiryMatch,
                temperatureControlled,
                quantityReceived
            );

            emit InventoryListed(
                batchId,
                msg.sender,
                medicineName,
                quantityReceived,
                sellingPrice
            );

            return retailerHash;
        } catch {
            revert InvalidRetailerSignature();
        }
    }

    /**
     * @notice Record medicine sale to customer
     * @dev Updates inventory and records sale event
     * @param batchId ID of the batch sold
     * @param customer Address of the customer
     * @param quantity Quantity sold
     */
    function recordSale(
        bytes32 batchId,
        address customer,
        uint256 quantity
    ) external onlyRetailer {
        RetailInventory storage inventory = retailInventory[msg.sender][batchId];

        if (!inventory.isAvailable || inventory.quantityAvailable < quantity) {
            revert("Insufficient inventory");
        }

        // Update inventory
        inventory.quantityAvailable -= quantity;
        inventory.quantitySold += quantity;

        // If all sold, mark as unavailable
        if (inventory.quantityAvailable == 0) {
            inventory.isAvailable = false;
        }

        emit MedicineSold(batchId, msg.sender, customer, quantity);
    }

    /**
     * @notice Get retailer verification details
     * @param batchId ID of the batch
     * @return verification Complete verification data
     */
    function getRetailerVerification(bytes32 batchId)
        external
        view
        returns (RetailerVerification memory verification)
    {
        return retailerVerifications[batchId];
    }

    /**
     * @notice Check if retailer verification exists
     * @param batchId ID of the batch
     * @return verified Whether retailer has verified the batch
     */
    function isRetailerVerified(bytes32 batchId) external view returns (bool verified) {
        return retailerVerifications[batchId].exists;
    }

    /**
     * @notice Get inventory details for a batch
     * @param batchId ID of the batch
     * @return inventory Inventory details
     */
    function getInventory(address retailer, bytes32 batchId)
        external
        view
        returns (RetailInventory memory inventory)
    {
        return retailInventory[retailer][batchId];
    }

    /**
     * @notice Get verification status of quality checks
     * @param batchId ID of the batch
     * @return batchMatch Batch number matches
     * @return expiryMatch Expiry date matches
     * @return temperatureControlled Temperature maintained
     * @return packagingIntact Packaging intact
     */
    function getQualityChecks(bytes32 batchId)
        external
        view
        returns (
            bool batchMatch,
            bool expiryMatch,
            bool temperatureControlled,
            bool packagingIntact
        )
    {
        RetailerVerification memory verification = retailerVerifications[batchId];
        return (
            verification.batchMatch,
            verification.expiryMatch,
            verification.temperatureControlled,
            verification.packagingIntact
        );
    }

    /**
     * @notice Grant retailer role to an address (admin only)
     * @param account Address to grant retailer role
     */
    function grantRetailerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RETAILER_ROLE, account);
    }

    /**
     * @notice Revoke retailer role from an address (admin only)
     * @param account Address to revoke retailer role
     */
    function revokeRetailerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(RETAILER_ROLE, account);
    }

    /**
     * @notice Update inventory price (retailer only)
     * @param batchId ID of the batch
     * @param newPrice New selling price
     */
    function updatePrice(bytes32 batchId, uint256 newPrice) external onlyRetailer {
        retailerVerifications[batchId].sellingPrice = newPrice;
    }

    /**
     * @notice Get total inventory value (placeholder)
     * @return totalValue Placeholder value
     */
    function getTotalInventoryValue() external pure returns (uint256 totalValue) {
        return 0; // Placeholder
    }
}
