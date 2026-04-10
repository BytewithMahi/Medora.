// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./MedoraCentral.sol";

/**
 * @title CustomerContract
 * @dev Contract for end customers to verify and track medicine purchases
 * @notice Final verification step in the supply chain with QR code scanning
 */
contract CustomerContract is AccessControl {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant VERIFIED_CUSTOMER_ROLE = keccak256("VERIFIED_CUSTOMER_ROLE");
    MedoraCentral public centralContract;

    // Custom errors
    error OnlyVerifiedCustomerAllowed(address caller);
    error RetailerNotVerified(bytes32 batchId);
    error InvalidCustomerSignature();
    error BatchAlreadyFinalized(bytes32 batchId);
    error InvalidQRCode();
    error VerificationFailed();

    // Struct to store customer verification/scan data
    struct CustomerVerification {
        address customerAddress;
        bytes32 finalHash;
        uint256 scanTimestamp;
        string qrCodeData; // Scanned QR code content
        string location; // Customer location (off-chain)
        bytes32 previousHash; // Hash before customer verification
        bool authenticityConfirmed;
        uint256 purchasePrice;
        uint256 purchaseTimestamp;
        bool exists;
    }

    // Struct to store customer purchase history
    struct PurchaseRecord {
        bytes32 batchId;
        string medicineName;
        uint256 quantity;
        uint256 purchasePrice;
        uint256 purchaseTimestamp;
        bytes32 finalHash;
        bool verified;
        string retailerName;
    }

    // Mapping from batch ID to customer verification
    mapping(bytes32 => CustomerVerification) public customerVerifications;

    // Mapping from customer address to their purchase history
    mapping(address => PurchaseRecord[]) public customerPurchases;

    // Mapping from customer address to QR code data for verification
    mapping(address => mapping(bytes32 => string)) public customerQRCodes;

    // Events
    event CustomerVerificationCompleted(
        bytes32 indexed batchId,
        address indexed customer,
        bytes32 finalHash,
        bool authenticityConfirmed
    );

    event MedicinePurchased(
        bytes32 indexed batchId,
        address indexed customer,
        address indexed retailer,
        string medicineName,
        uint256 quantity,
        uint256 price
    );

    event QRCodeScanned(
        bytes32 indexed batchId,
        address indexed customer,
        string qrCodeData,
        uint256 timestamp
    );

    event AuthenticityConfirmed(
        bytes32 indexed batchId,
        address indexed customer,
        uint256 authenticityScore,
        string status
    );

    /**
     * @dev Constructor
     * @param _centralContract Address of the MedoraCentral contract
     */
    constructor(address _centralContract) {
        centralContract = MedoraCentral(_centralContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIED_CUSTOMER_ROLE, msg.sender);
    }

    /**
     * @dev Modifier to check if caller is a verified customer
     */
    modifier onlyVerifiedCustomer() {
        if (!hasRole(VERIFIED_CUSTOMER_ROLE, msg.sender)) {
            revert OnlyVerifiedCustomerAllowed(msg.sender);
        }
        _;
    }

    /**
     * @notice Scan QR code and verify medicine batch
     * @dev Validates QR code data and completes final verification chain
     * @param batchId ID of the batch
     * @param qrCodeData Scanned QR code data
     * @param medicineName Name of the medicine
     * @param retailer Address of the retailer
     * @param retailerName Name of the retailer/pharmacy
     * @param purchasePrice Price paid by customer
     * @param location Customer location (off-chain data)
     * @param quantity Quantity purchased
     * @return finalHash Final hash completing the verification chain
     */
    function scanAndVerifyMedicine(
        bytes32 batchId,
        string memory qrCodeData,
        string memory medicineName,
        address retailer,
        string memory retailerName,
        uint256 purchasePrice,
        string memory location,
        uint256 quantity
    ) external onlyVerifiedCustomer returns (bytes32 finalHash) {
        // Store QR code data
        customerQRCodes[msg.sender][batchId] = qrCodeData;

        emit QRCodeScanned(batchId, msg.sender, qrCodeData, block.timestamp);

        // Verify the batch through central contract
        finalHash = verifyCustomerBatch(batchId, qrCodeData, location, purchasePrice);

        // Record purchase
        recordPurchase(batchId, medicineName, retailer, retailerName, quantity, purchasePrice, finalHash);

        emit MedicinePurchased(
            batchId,
            msg.sender,
            retailer,
            medicineName,
            quantity,
            purchasePrice
        );

        return finalHash;
    }

    /**
     * @notice Complete final verification step
     * @dev Called internally by scanAndVerifyMedicine
     * @param batchId ID of the batch
     * @param qrCodeData Scanned QR code content
     * @param location Customer location
     * @param purchasePrice Purchase price
     * @return finalHash Final hash in the chain
     */
    function verifyCustomerBatch(
        bytes32 batchId,
        string memory qrCodeData,
        string memory location,
        uint256 purchasePrice
    ) internal returns (bytes32 finalHash) {
        // Check if retailer verified
        (,,, bool isFinalized) = centralContract.verifyBatchAuthenticity(batchId);
        if (isFinalized) {
            revert BatchAlreadyFinalized(batchId);
        }

        // Get current hash
        (bool isLegitimate, bytes32 currentHash,,) = centralContract.verifyBatchAuthenticity(batchId);
        if (!isLegitimate) {
            revert RetailerNotVerified(batchId);
        }

        // Calculate final hash: hash(currentHash + customerAddress)
        finalHash = keccak256(abi.encodePacked(
            currentHash,
            msg.sender
        ));

        // Create signature
        bytes32 message = keccak256(abi.encodePacked(batchId, finalHash));

        // In production, signature should be passed from off-chain
        bytes memory signature = abi.encodePacked(msg.sender);

        // Complete verification on central contract
        try centralContract.verifyCustomer(batchId, finalHash, msg.sender, signature) {
            // Store verification
            CustomerVerification memory verification = CustomerVerification({
                customerAddress: msg.sender,
                finalHash: finalHash,
                scanTimestamp: block.timestamp,
                qrCodeData: qrCodeData,
                location: location,
                previousHash: currentHash,
                authenticityConfirmed: true,
                purchasePrice: purchasePrice,
                purchaseTimestamp: block.timestamp,
                exists: true
            });
            customerVerifications[batchId] = verification;

            emit CustomerVerificationCompleted(batchId, msg.sender, finalHash, true);

            return finalHash;
        } catch {
            revert InvalidCustomerSignature();
        }
    }

    /**
     * @notice Record purchase details
     * @dev Stores purchase in customer's history
     * @param batchId ID of the batch
     * @param medicineName Name of medicine
     * @param retailer Retailer address
     * @param retailerName Retailer name
     * @param quantity Quantity purchased
     * @param purchasePrice Price paid
     * @param finalHash Final verification hash
     */
    function recordPurchase(
        bytes32 batchId,
        string memory medicineName,
        address retailer,
        string memory retailerName,
        uint256 quantity,
        uint256 purchasePrice,
        bytes32 finalHash
    ) internal {
        PurchaseRecord memory record = PurchaseRecord({
            batchId: batchId,
            medicineName: medicineName,
            quantity: quantity,
            purchasePrice: purchasePrice,
            purchaseTimestamp: block.timestamp,
            finalHash: finalHash,
            verified: true,
            retailerName: retailerName
        });

        customerPurchases[msg.sender].push(record);
    }

    /**
     * @notice Get complete verification data for a batch
     * @param batchId ID of the batch
     * @return verification Complete verification details
     */
    function getCustomerVerification(bytes32 batchId)
        external
        view
        returns (CustomerVerification memory verification)
    {
        return customerVerifications[batchId];
    }

    /**
     * @notice Check if customer verification exists
     * @param batchId ID of the batch
     * @return verified Whether customer has verified the batch
     */
    function isCustomerVerified(bytes32 batchId) external view returns (bool verified) {
        return customerVerifications[batchId].exists;
    }

    /**
     * @notice Get customer's complete purchase history
     * @return purchases Array of all purchase records
     */
    function getPurchaseHistory() external view returns (PurchaseRecord[] memory purchases) {
        return customerPurchases[msg.sender];
    }

    /**
     * @notice Get specific purchase record
     * @param index Index in the purchase history array
     * @return record Purchase record at the index
     */
    function getPurchaseRecord(uint256 index)
        external
        view
        returns (PurchaseRecord memory record)
    {
        require(index < customerPurchases[msg.sender].length, "Index out of bounds");
        return customerPurchases[msg.sender][index];
    }

    /**
     * @notice Get total purchases count
     * @return count Number of purchases made
     */
    function getPurchaseCount() external view returns (uint256 count) {
        return customerPurchases[msg.sender].length;
    }

    /**
     * @notice Get QR code data for a specific batch
     * @param batchId ID of the batch
     * @return qrCodeData QR code content
     */
    function getQRCodeData(bytes32 batchId) external view returns (string memory qrCodeData) {
        return customerQRCodes[msg.sender][batchId];
    }

    /**
     * @notice Grant verified customer role
     * @param account Address to grant role
     */
    function grantCustomerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(VERIFIED_CUSTOMER_ROLE, account);
    }

    /**
     * @notice Check if medicine is authentic (comprehensive check)
     * @param batchId ID of the batch
     * @return isAuthentic Whether medicine is authentic
     * @return verificationStage Current verification stage
     * @return finalHash Final hash if available
     */
    function checkAuthenticity(bytes32 batchId)
        external
        view
        returns (
            bool isAuthentic,
            string memory verificationStage,
            bytes32 finalHash
        )
    {
        (bool isLegitimate, bytes32 currentHash, bytes32 batchFinalHash, bool isFinalized) =
            centralContract.verifyBatchAuthenticity(batchId);

        if (!isLegitimate) {
            return (false, "Producer", bytes32(0));
        }

        if (!isFinalized) {
            if (customerVerifications[batchId].exists) {
                return (true, "Customer Verified", currentHash);
            } else if (retailerVerifications[batchId].exists) {
                return (true, "Retailer Verified", currentHash);
            } else if (distributorVerifications[batchId].exists) {
                return (true, "Distributor Verified", currentHash);
            } else {
                return (true, "Producer", currentHash);
            }
        }

        return (true, "Fully Verified", batchFinalHash);
    }

    // Placeholder structs to match other contracts
    struct DistributorVerification {
        bool exists;
    }

    struct RetailerVerification {
        bool exists;
    }

    mapping(bytes32 => DistributorVerification) public distributorVerifications;
    mapping(bytes32 => RetailerVerification) public retailerVerifications;
}
