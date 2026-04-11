// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./CentralMarketplace.sol";
import "./ManufacturerToken.sol";

/**
 * @title ManufacturerRegistry
 * @dev Handles manufacturer registration, token creation, and liquidity seeding
 * @notice Enables verified Medora manufacturers to create and list their tokens
 */
contract ManufacturerRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Custom errors
    error ManufacturerAlreadyRegistered(address wallet);
    error NotRegisteredManufacturer(address wallet);
    error TokenAlreadyCreated(address manufacturer);
    error TokenCreationFailed();
    error LiquiditySeedFailed();
    error InvalidAmount();
    error InvalidAddress();

    // Token metadata
    struct TokenMetadata {
        address tokenContract;
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 basePrice;
        bool isActive;
    }

    // Manufacturer data
    struct Manufacturer {
        bool isRegistered;
        address tokenAddress;
        uint256 registrationTime;
    }

    // State variables
    CentralMarketplace public centralMarketplace;
    mapping(address => Manufacturer) public manufacturers;
    mapping(address => TokenMetadata) public tokenMetadata;
    address[] public registeredManufacturers;

    // Events
    event ManufacturerRegistered(address indexed wallet, uint256 timestamp);
    event TokenCreated(
        address indexed manufacturer,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 totalSupply,
        uint256 basePrice,
        uint256 timestamp
    );
    event LiquiditySeeded(
        address indexed manufacturer,
        address indexed tokenAddress,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 timestamp
    );

    // Modifiers
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    modifier onlyRegisteredManufacturer() {
        if (!manufacturers[msg.sender].isRegistered) {
            revert NotRegisteredManufacturer(msg.sender);
        }
        _;
    }

    modifier noExistingToken() {
        if (manufacturers[msg.sender].tokenAddress != address(0)) {
            revert TokenAlreadyCreated(msg.sender);
        }
        _;
    }

    /**
     * @dev Constructor
     * @param _centralMarketplace Address of CentralMarketplace contract
     */
    constructor(address _centralMarketplace) validAddress(_centralMarketplace) {
        centralMarketplace = CentralMarketplace(_centralMarketplace);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a verified Medora manufacturer
     * @param wallet Manufacturer wallet address
     * @notice Only callable by admin (backend verification required)
     */
    function registerManufacturer(address wallet) external validAddress(wallet) {
        if (manufacturers[wallet].isRegistered) {
            revert ManufacturerAlreadyRegistered(wallet);
        }

        manufacturers[wallet] = Manufacturer({
            isRegistered: true,
            tokenAddress: address(0),
            registrationTime: block.timestamp
        });

        registeredManufacturers.push(wallet);

        emit ManufacturerRegistered(wallet, block.timestamp);
    }

    /**
     * @dev Create a new ERC20 token for the manufacturer
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total token supply
     * @param basePrice Initial base price in wei
     * @return tokenAddress Address of deployed token
     * @notice Only callable by registered manufacturers, one token per manufacturer
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint256 basePrice
    ) external onlyRegisteredManufacturer noExistingToken returns (address tokenAddress) {
        if (totalSupply == 0 || basePrice == 0) {
            revert InvalidAmount();
        }

        // Deploy new token contract with Create2 for deterministic addresses
        bytes32 salt = keccak256(abi.encodePacked(msg.sender, block.timestamp));

        ManufacturerToken token = new ManufacturerToken{
            salt: salt
        }(name, symbol, totalSupply, 18);

        tokenAddress = address(token);

        // Store metadata
        tokenMetadata[tokenAddress] = TokenMetadata({
            tokenContract: tokenAddress,
            name: name,
            symbol: symbol,
            totalSupply: totalSupply,
            basePrice: basePrice,
            isActive: true
        });

        // Update manufacturer data
        manufacturers[msg.sender].tokenAddress = tokenAddress;

        // Register token with CentralMarketplace
        centralMarketplace.registerToken(tokenAddress, name, symbol, totalSupply, basePrice);

        emit TokenCreated(
            msg.sender,
            tokenAddress,
            name,
            symbol,
            totalSupply,
            basePrice,
            block.timestamp
        );

        return tokenAddress;
    }

    /**
     * @dev Seed initial liquidity for a token pool
     * @param tokenAddress Address of the token
     * @param tokenAmount Amount of tokens to deposit
     * @notice Must send ETH with transaction, transfers tokens from manufacturer to this contract
     */
    function seedLiquidity(
        address tokenAddress,
        uint256 tokenAmount
    ) external payable onlyRegisteredManufacturer nonReentrant {
        if (msg.value == 0 || tokenAmount == 0) {
            revert InvalidAmount();
        }

        if (manufacturers[msg.sender].tokenAddress != tokenAddress) {
            revert NotRegisteredManufacturer(msg.sender);
        }

        // Transfer tokens from manufacturer to this contract
        IERC20 token = IERC20(tokenAddress);

        // Check allowance
        if (token.allowance(msg.sender, address(this)) < tokenAmount) {
            revert LiquiditySeedFailed();
        }

        // Transfer tokens
        bool success = token.transferFrom(msg.sender, address(this), tokenAmount);
        if (!success) {
            revert LiquiditySeedFailed();
        }

        // Approve CentralMarketplace to spend tokens
        token.approve(address(centralMarketplace), tokenAmount);

        // Initialize pool in CentralMarketplace
        centralMarketplace.initializePool{value: msg.value}(tokenAddress, tokenAmount);

        emit LiquiditySeeded(
            msg.sender,
            tokenAddress,
            msg.value,
            tokenAmount,
            block.timestamp
        );
    }

    /**
     * @dev Check if address is a registered manufacturer
     * @param wallet Address to check
     * @return true if registered
     */
    function isRegisteredManufacturer(address wallet) external view returns (bool) {
        return manufacturers[wallet].isRegistered;
    }

    /**
     * @dev Get manufacturer's token address (if created)
     * @param wallet Manufacturer address
     * @return tokenAddress or address(0)
     */
    function getManufacturerToken(address wallet) external view returns (address) {
        return manufacturers[wallet].tokenAddress;
    }

    /**
     * @dev Get token metadata
     * @param tokenAddress Token address
     * @return TokenMetadata struct
     */
    function getTokenMetadata(address tokenAddress) external view returns (TokenMetadata memory) {
        return tokenMetadata[tokenAddress];
    }

    /**
     * @dev Get all registered manufacturers
     * @return Array of manufacturer addresses
     */
    function getAllManufacturers() external view returns (address[] memory) {
        return registeredManufacturers;
    }

    /**
     * @dev Get count of registered manufacturers
     * @return Count
     */
    function getManufacturerCount() external view returns (uint256) {
        return registeredManufacturers.length;
    }
}