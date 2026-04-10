// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CentralMarketplace
 * @dev Singleton hub maintaining canonical liquidity state and price oracle for Medora marketplace
 * @notice Coordinates between ManufacturerRegistry and UserMarketplace contracts
 * @dev Maintains AMM pools using constant product formula: x * y = k
 */
contract CentralMarketplace is AccessControl, ReentrancyGuard {
    bytes32 public constant MANUFACTURER_REGISTRY_ROLE = keccak256("MANUFACTURER_REGISTRY_ROLE");
    bytes32 public constant USER_MARKETPLACE_ROLE = keccak256("USER_MARKETPLACE_ROLE");

    // Custom errors
    error PoolAlreadyExists(address token);
    error PoolNotFound(address token);
    error InsufficientReserves();
    error InvalidAmount();
    error InvalidAddress();
    error UnauthorizedAccess();

    // Pool state using constant product AMM formula
    struct PoolState {
        uint256 ethReserve;        // ETH in pool
        uint256 tokenReserve;      // Tokens in pool
        uint256 k;                // Constant product: k = ethReserve * tokenReserve
        uint256 totalVolume;      // Total trading volume
        uint256 lastPrice;        // Last transacted price
        bool exists;              // Pool existence flag
    }

    // Token metadata for registered tokens
    struct TokenData {
        address tokenAddress;
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 basePrice;
        bool isActive;
    }

    // Mappings
    mapping(address => PoolState) public pools;           // tokenAddress => PoolState
    mapping(address => TokenData) public tokenRegistry;   // tokenAddress => TokenData
    address[] public registeredTokens;                    // Array of all registered tokens

    // Events
    event PoolInitialized(
        address indexed tokenAddress,
        uint256 ethReserve,
        uint256 tokenReserve,
        uint256 k,
        uint256 timestamp
    );

    event ReservesUpdated(
        address indexed tokenAddress,
        uint256 newEthReserve,
        uint256 newTokenReserve,
        uint256 newK,
        uint256 tradeVolume,
        uint256 timestamp
    );

    event PriceSnapshot(
        address indexed tokenAddress,
        uint256 price,
        uint256 timestamp
    );

    // Modifiers
    modifier poolExists(address tokenAddress) {
        if (!pools[tokenAddress].exists) {
            revert PoolNotFound(tokenAddress);
        }
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    modifier onlyManufacturerRegistry() {
        if (!hasRole(MANUFACTURER_REGISTRY_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }
        _;
    }

    modifier onlyUserMarketplace() {
        if (!hasRole(USER_MARKETPLACE_ROLE, msg.sender)) {
            revert UnauthorizedAccess();
        }
        _;
    }

    /**
     * @dev Constructor sets up admin role
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Initialize a new liquidity pool
     * @param tokenAddress Address of the token
     * @param tokenAmount Amount of tokens to pair with ETH (msg.value)
     * @notice Called by ManufacturerRegistry when manufacturer seeds liquidity
     */
    function initializePool(
        address tokenAddress,
        uint256 tokenAmount
    ) external payable onlyManufacturerRegistry validAddress(tokenAddress) nonReentrant {
        if (msg.value == 0 || tokenAmount == 0) {
            revert InvalidAmount();
        }

        if (pools[tokenAddress].exists) {
            revert PoolAlreadyExists(tokenAddress);
        }

        // Create pool state
        PoolState memory newPool;
        newPool.ethReserve = msg.value;
        newPool.tokenReserve = tokenAmount;
        newPool.k = msg.value * tokenAmount;
        newPool.exists = true;

        pools[tokenAddress] = newPool;

        emit PoolInitialized(
            tokenAddress,
            msg.value,
            tokenAmount,
            newPool.k,
            block.timestamp
        );
    }

    /**
     * @dev Update reserves after a trade
     * @param tokenAddress Address of the token
     * @param newEthReserve New ETH reserve amount
     * @param newTokenReserve New token reserve amount
     * @notice Called by UserMarketplace after every trade
     */
    function updateReserves(
        address tokenAddress,
        uint256 newEthReserve,
        uint256 newTokenReserve,
        uint256 tradeVolume
    ) external onlyUserMarketplace poolExists(tokenAddress) nonReentrant {
        PoolState storage pool = pools[tokenAddress];

        pool.ethReserve = newEthReserve;
        pool.tokenReserve = newTokenReserve;
        pool.k = newEthReserve * newTokenReserve;
        pool.totalVolume += tradeVolume;
        pool.lastPrice = getSpotPrice(tokenAddress);

        emit ReservesUpdated(
            tokenAddress,
            newEthReserve,
            newTokenReserve,
            pool.k,
            tradeVolume,
            block.timestamp
        );
    }

    /**
     * @dev Register a token in the marketplace
     * @param tokenAddress Address of the token contract
     * @param name Token name
     * @param symbol Token symbol
     * @param totalSupply Total token supply
     * @param basePrice Initial base price
     * @notice Called by ManufacturerRegistry after token creation
     */
    function registerToken(
        address tokenAddress,
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint256 basePrice
    ) external onlyManufacturerRegistry validAddress(tokenAddress) {
        TokenData memory tokenData = TokenData({
            tokenAddress: tokenAddress,
            name: name,
            symbol: symbol,
            totalSupply: totalSupply,
            basePrice: basePrice,
            isActive: true
        });

        tokenRegistry[tokenAddress] = tokenData;
        registeredTokens.push(tokenAddress);

        emit PriceSnapshot(tokenAddress, basePrice, block.timestamp);
    }

    /**
     * @dev Get current spot price of a token
     * @param tokenAddress Address of the token
     * @return Price in wei (ethReserve / tokenReserve)
     */
    function getSpotPrice(address tokenAddress) public view poolExists(tokenAddress) returns (uint256) {
        PoolState storage pool = pools[tokenAddress];
        if (pool.tokenReserve == 0) {
            return 0;
        }
        return (pool.ethReserve * 1e18) / pool.tokenReserve;
    }

    /**
     * @dev Calculate token amount out for given input using constant product formula
     * @param tokenAddress Address of the token
     * @param amountIn Amount being sent (ETH or tokens)
     * @param isBuyOrder True if buying tokens, false if selling
     * @return amountOut Amount received
     * @dev Fee: 0.3% (standard Uniswap v2)
     */
    function getAmountOut(
        address tokenAddress,
        uint256 amountIn,
        bool isBuyOrder
    ) external view poolExists(tokenAddress) returns (uint256 amountOut) {
        PoolState storage pool = pools[tokenAddress];

        if (isBuyOrder) {
            // Buying tokens with ETH
            // amountOut = (tokenReserve * amountIn * 997) / (ethReserve * 1000 + amountIn * 997)
            uint256 amountInWithFee = amountIn * 997;
            uint256 numerator = pool.tokenReserve * amountInWithFee;
            uint256 denominator = (pool.ethReserve * 1000) + amountInWithFee;
            amountOut = numerator / denominator;
        } else {
            // Selling tokens for ETH
            // amountOut = (ethReserve * amountIn * 997) / (tokenReserve * 1000 + amountIn * 997)
            uint256 amountInWithFee = amountIn * 997;
            uint256 numerator = pool.ethReserve * amountInWithFee;
            uint256 denominator = (pool.tokenReserve * 1000) + amountInWithFee;
            amountOut = numerator / denominator;
        }

        if (amountOut == 0) {
            revert InsufficientReserves();
        }

        return amountOut;
    }

    /**
     * @dev Get all registered tokens
     * @return tokens Array of token addresses
     * @return metadata Array of token metadata
     */
    function getAllTokens() external view returns (address[] memory tokens, TokenData[] memory metadata) {
        uint256 tokenCount = registeredTokens.length;
        tokens = new address[](tokenCount);
        metadata = new TokenData[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            address tokenAddress = registeredTokens[i];
            tokens[i] = tokenAddress;
            metadata[i] = tokenRegistry[tokenAddress];
        }

        return (tokens, metadata);
    }

    /**
     * @dev Get pool state for a token
     * @param tokenAddress Address of the token
     * @return Pool state data
     */
    function getPoolState(address tokenAddress) external view poolExists(tokenAddress) returns (PoolState memory) {
        return pools[tokenAddress];
    }

    /**
     * @dev Get token data
     * @param tokenAddress Address of the token
     * @return Token metadata
     */
    function getTokenData(address tokenAddress) external view returns (TokenData memory) {
        return tokenRegistry[tokenAddress];
    }

    /**
     * @dev Grant manufacturer registry role
     * @param registry Address of ManufacturerRegistry contract
     */
    function grantManufacturerRegistryRole(address registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_REGISTRY_ROLE, registry);
    }

    /**
     * @dev Grant user marketplace role
     * @param marketplace Address of UserMarketplace contract
     */
    function grantUserMarketplaceRole(address marketplace) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(USER_MARKETPLACE_ROLE, marketplace);
    }
}