// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CentralMarketplace.sol";

/**
 * @title UserMarketplace
 * @dev Handles all user trading activities on Medora marketplace
 * @notice Enables buying/selling tokens with slippage protection and portfolio tracking
 */
contract UserMarketplace is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Custom errors
    error SlippageExceeded(uint256 expected, uint256 received);
    error InsufficientBalance(address token, uint256 required, uint256 available);
    error InsufficientOutput();
    error InvalidAmount();
    error InvalidAddress();
    error TransferFailed();

    // Transaction history
    struct Transaction {
        address tokenAddress;
        bool isBuy; // true = buy, false = sell
        uint256 amountIn; // ETH if buy, tokens if sell
        uint256 amountOut; // Tokens if buy, ETH if sell
        uint256 price; // Price at time of transaction
        uint256 timestamp;
    }

    // User portfolio
    struct UserPortfolio {
        address[] tokensHeld; // Array of token addresses user holds
        mapping(address => uint256) tokenBalances; // token => balance
        mapping(address => uint256) totalEthSpent; // token => total ETH spent (for P&L)
        mapping(address => uint256) totalTokensBought; // token => total tokens bought
        Transaction[] transactionHistory;
    }

    // State variables
    CentralMarketplace public centralMarketplace;
    mapping(address => UserPortfolio) internal portfolios;

    // Events
    event TokensPurchased(
        address indexed user,
        address indexed tokenAddress,
        uint256 ethIn,
        uint256 tokensOut,
        uint256 price,
        uint256 timestamp
    );

    event TokensSold(
        address indexed user,
        address indexed tokenAddress,
        uint256 tokensIn,
        uint256 ethOut,
        uint256 price,
        uint256 timestamp
    );

    // Modifiers
    modifier validAddress(address addr) {
        if (addr == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) {
            revert InvalidAmount();
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
     * @dev Buy tokens with ETH
     * @param tokenAddress Token to buy
     * @param minAmountOut Minimum tokens to receive (slippage protection)
     * @notice ETH sent with transaction is used for purchase
     */
    function buyTokens(
        address tokenAddress,
        uint256 minAmountOut
    ) external payable validAddress(tokenAddress) validAmount(minAmountOut) nonReentrant {
        // Validate ETH amount
        if (msg.value == 0) {
            revert InvalidAmount();
        }

        // Calculate expected output
        uint256 tokensOut = centralMarketplace.getAmountOut(tokenAddress, msg.value, true);

        // Check slippage
        if (tokensOut < minAmountOut) {
            revert SlippageExceeded(minAmountOut, tokensOut);
        }

        if (tokensOut == 0) {
            revert InsufficientOutput();
        }

        // Transfer tokens to user from this contract
        IERC20 token = IERC20(tokenAddress);
        token.safeTransfer(msg.sender, tokensOut);

        // Get pool state before trade
        (uint256 ethReserve, uint256 tokenReserve,,,) = getPoolState(tokenAddress);

        // Calculate new reserves
        uint256 newEthReserve = ethReserve + msg.value;
        uint256 newTokenReserve = tokenReserve - tokensOut;

        // Update pool in CentralMarketplace
        centralMarketplace.updateReserves(tokenAddress, newEthReserve, newTokenReserve, msg.value);

        // Update user portfolio
        _updatePortfolioBuy(msg.sender, tokenAddress, tokensOut, msg.value);

        // Record transaction
        uint256 price = centralMarketplace.getSpotPrice(tokenAddress);
        portfolios[msg.sender].transactionHistory.push(Transaction({
            tokenAddress: tokenAddress,
            isBuy: true,
            amountIn: msg.value,
            amountOut: tokensOut,
            price: price,
            timestamp: block.timestamp
        }));

        emit TokensPurchased(
            msg.sender,
            tokenAddress,
            msg.value,
            tokensOut,
            price,
            block.timestamp
        );
    }

    /**
     * @dev Sell tokens for ETH
     * @param tokenAddress Token to sell
     * @param tokenAmount Amount of tokens to sell
     * @param minEthOut Minimum ETH to receive (slippage protection)
     * @notice Tokens must be approved for transfer
     */
    function sellTokens(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minEthOut
    ) external validAddress(tokenAddress) validAmount(tokenAmount) validAmount(minEthOut) nonReentrant {
        // Check user balance
        uint256 userBalance = IERC20(tokenAddress).balanceOf(msg.sender);
        if (userBalance < tokenAmount) {
            revert InsufficientBalance(tokenAddress, tokenAmount, userBalance);
        }

        // Calculate expected output
        uint256 ethOut = centralMarketplace.getAmountOut(tokenAddress, tokenAmount, false);

        // Check slippage
        if (ethOut < minEthOut) {
            revert SlippageExceeded(minEthOut, ethOut);
        }

        if (ethOut == 0) {
            revert InsufficientOutput();
        }

        // Transfer tokens from user to this contract
        IERC20 token = IERC20(tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Get pool state before trade
        (uint256 ethReserve, uint256 tokenReserve,,,) = getPoolState(tokenAddress);

        // Transfer ETH to user
        (bool success, ) = msg.sender.call{value: ethOut}("");
        if (!success) {
            revert TransferFailed();
        }

        // Transfer tokens from this contract to CentralMarketplace (pool)
        // This would require CentralMarketplace to have a function to receive tokens
        // For now, we'll hold tokens in this contract
        // In production, you'd want a proper mechanism to return tokens to pool

        // Calculate new reserves
        uint256 newEthReserve = ethReserve - ethOut;
        uint256 newTokenReserve = tokenReserve + tokenAmount;

        // Update pool in CentralMarketplace
        centralMarketplace.updateReserves(tokenAddress, newEthReserve, newTokenReserve, ethOut);

        // Update user portfolio
        _updatePortfolioSell(msg.sender, tokenAddress, tokenAmount, ethOut);

        // Record transaction
        uint256 price = centralMarketplace.getSpotPrice(tokenAddress);
        portfolios[msg.sender].transactionHistory.push(Transaction({
            tokenAddress: tokenAddress,
            isBuy: false,
            amountIn: tokenAmount,
            amountOut: ethOut,
            price: price,
            timestamp: block.timestamp
        }));

        emit TokensSold(
            msg.sender,
            tokenAddress,
            tokenAmount,
            ethOut,
            price,
            block.timestamp
        );
    }

    /**
     * @dev Get user portfolio
     * @param user User address
     * @return tokens Array of token addresses
     * @return balances Array of token balances
     * @return totalEthSpent Array of total ETH spent per token
     * @return currentValue Array of current portfolio value per token
     */
    function getUserPortfolio(
        address user
    ) external view returns (
        address[] memory tokens,
        uint256[] memory balances,
        uint256[] memory totalEthSpent,
        uint256[] memory currentValue
    ) {
        UserPortfolio storage portfolio = portfolios[user];
        uint256 tokenCount = portfolio.tokensHeld.length;

        tokens = new address[](tokenCount);
        balances = new uint256[](tokenCount);
        totalEthSpent = new uint256[](tokenCount);
        currentValue = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            address tokenAddress = portfolio.tokensHeld[i];
            tokens[i] = tokenAddress;
            balances[i] = portfolio.tokenBalances[tokenAddress];
            totalEthSpent[i] = portfolio.totalEthSpent[tokenAddress];

            // Calculate current value
            if (balances[i] > 0) {
                uint256 price = centralMarketplace.getSpotPrice(tokenAddress);
                currentValue[i] = (balances[i] * price) / 1e18;
            } else {
                currentValue[i] = 0;
            }
        }

        return (tokens, balances, totalEthSpent, currentValue);
    }

    /**
     * @dev Get user transaction history
     * @param user User address
     * @return Array of transactions
     */
    function getUserTransactionHistory(
        address user
    ) external view returns (Transaction[] memory) {
        return portfolios[user].transactionHistory;
    }

    /**
     * @dev Get token balance for user
     * @param user User address
     * @param tokenAddress Token address
     * @return Balance
     */
    function getTokenBalance(
        address user,
        address tokenAddress
    ) external view returns (uint256) {
        return portfolios[user].tokenBalances[tokenAddress];
    }

    /**
     * @dev Get pool state from CentralMarketplace
     * @param tokenAddress Token address
     */
    function getPoolState(
        address tokenAddress
    ) public view returns (uint256 ethReserve, uint256 tokenReserve, uint256 k, uint256 totalVolume, uint256 lastPrice) {
        // Query pool state from CentralMarketplace
        CentralMarketplace.PoolState memory poolState = centralMarketplace.getPoolState(tokenAddress);
        return (
            poolState.ethReserve,
            poolState.tokenReserve,
            poolState.k,
            poolState.totalVolume,
            poolState.lastPrice
        );
    }

    /**
     * @dev Internal function to update portfolio on buy
     */
    function _updatePortfolioBuy(
        address user,
        address tokenAddress,
        uint256 tokensOut,
        uint256 ethIn
    ) internal {
        UserPortfolio storage portfolio = portfolios[user];

        // Add token to tokensHeld if not already present
        bool tokenExists = false;
        for (uint256 i = 0; i < portfolio.tokensHeld.length; i++) {
            if (portfolio.tokensHeld[i] == tokenAddress) {
                tokenExists = true;
                break;
            }
        }
        if (!tokenExists) {
            portfolio.tokensHeld.push(tokenAddress);
        }

        // Update balances
        portfolio.tokenBalances[tokenAddress] += tokensOut;
        portfolio.totalEthSpent[tokenAddress] += ethIn;
        portfolio.totalTokensBought[tokenAddress] += tokensOut;
    }

    /**
     * @dev Internal function to update portfolio on sell
     */
    function _updatePortfolioSell(
        address user,
        address tokenAddress,
        uint256 tokensIn,
        uint256 ethOut
    ) internal {
        UserPortfolio storage portfolio = portfolios[user];

        // Update balances
        portfolio.tokenBalances[tokenAddress] -= tokensIn;

        // Adjust average cost basis (FIFO)
        uint256 tokensSold = tokensIn;
        uint256 avgCostBasis = portfolio.totalEthSpent[tokenAddress] * 1e18 / portfolio.totalTokensBought[tokenAddress];
        uint256 ethCostBasisRedeemed = (tokensSold * avgCostBasis) / 1e18;

        portfolio.totalEthSpent[tokenAddress] -= ethCostBasisRedeemed;
        portfolio.totalTokensBought[tokenAddress] -= tokensSold;

        // Remove token from tokensHeld if balance is zero
        if (portfolio.tokenBalances[tokenAddress] == 0) {
            _removeTokenFromHeld(portfolio, tokenAddress);
        }
    }

    /**
     * @dev Internal function to remove token from held array
     */
    function _removeTokenFromHeld(
        UserPortfolio storage portfolio,
        address tokenAddress
    ) internal {
        uint256 tokenCount = portfolio.tokensHeld.length;
        for (uint256 i = 0; i < tokenCount; i++) {
            if (portfolio.tokensHeld[i] == tokenAddress) {
                portfolio.tokensHeld[i] = portfolio.tokensHeld[tokenCount - 1];
                portfolio.tokensHeld.pop();
                break;
            }
        }
    }

    /**
     * @dev Calculate P&L for a specific token
     * @param user User address
     * @param tokenAddress Token address
     * @return pnl Profit or loss (- values indicate loss)
 */
    function calculatePnL(
        address user,
        address tokenAddress
    ) external view returns (int256 pnl) {
        UserPortfolio storage portfolio = portfolios[user];
        uint256 tokenBalance = portfolio.tokenBalances[tokenAddress];
        uint256 totalEthSpent = portfolio.totalEthSpent[tokenAddress];

        if (tokenBalance == 0 || totalEthSpent == 0) {
            return 0;
        }

        uint256 currentValue = (tokenBalance * centralMarketplace.getSpotPrice(tokenAddress)) / 1e18;

        if (currentValue > totalEthSpent) {
            pnl = int256(currentValue - totalEthSpent);
        } else {
            pnl = -int256(totalEthSpent - currentValue);
        }
    }
}
