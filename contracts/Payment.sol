// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Payment__Invalid();

struct TokenConfig {
    bool enabled;
    uint256 minAmount;
    uint256 maxAmount;
    address oracle;
}

/**
 * @title KubernaPayment
 * @dev Handles user payments, balance tracking, and withdrawals for multiple tokens.
 */
contract KubernaPayment is Ownable, ReentrancyGuard {
    uint256 public immutable MIN_WITHDRAWAL = 10 ether;

    mapping(address => TokenConfig) public tokenConfigs;
    // Per-token balance tracking: user => token => balance
    mapping(address => mapping(address => uint256)) public userBalances;
    // Per-token platform fee balance
    mapping(address => uint256) public platformBalances;
    address[] public supportedTokens;

    event TokenAdded(address token, uint256 minAmount, uint256 maxAmount);
    event TokenRemoved(address token);
    event PaymentReceived(address user, address token, uint256 amount);
    event Withdrawal(address user, address token, uint256 amount);
    event PlatformFeeCollected(address token, uint256 amount);

    constructor() Ownable(msg.sender) {
        supportedTokens.push(address(0));
        tokenConfigs[address(0)] = TokenConfig({
            enabled: true,
            minAmount: 0,
            maxAmount: type(uint256).max,
            oracle: address(0)
        });
    }

    /**
     * @dev Adds a new supported payment token.
     * @param token The token address (address(0) for ETH).
     * @param minAmount The minimum payment amount.
     * @param maxAmount The maximum payment amount.
     */
    function addToken(address token, uint256 minAmount, uint256 maxAmount) external onlyOwner {
        require(!tokenConfigs[token].enabled, "Token already enabled");

        tokenConfigs[token] = TokenConfig({
            enabled: true,
            minAmount: minAmount,
            maxAmount: maxAmount,
            oracle: address(0)
        });
        supportedTokens.push(token);

        emit TokenAdded(token, minAmount, maxAmount);
    }

    /**
     * @dev Removes a token from supported payments.
     * @param token The token address to remove.
     */
    function removeToken(address token) external onlyOwner {
        require(tokenConfigs[token].enabled, "Token not enabled");
        tokenConfigs[token].enabled = false;
        emit TokenRemoved(token);
    }

    /**
     * @dev Processes a single payment and credits user balance.
     * @param token The payment token address (address(0) for ETH).
     * @param amount The payment amount.
     */
    function processPayment(address token, uint256 amount) external payable nonReentrant {
        TokenConfig memory c = tokenConfigs[token];
        require(c.enabled, "Token not supported");
        require(amount >= c.minAmount && amount <= c.maxAmount, "Amount out of range");

        if (token == address(0)) {
            require(msg.value == amount, "Incorrect ETH amount");
        } else {
            require(msg.value == 0, "ETH not accepted for token payment");
            require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }

        userBalances[msg.sender][token] += amount;
        platformBalances[token] += amount;

        emit PaymentReceived(msg.sender, token, amount);
    }

    /**
     * @dev Processes multiple payments in a single transaction.
     * @param tokens Array of token addresses.
     * @param amounts Array of payment amounts.
     */
    function batchProcessPayment(address[] calldata tokens, uint256[] calldata amounts) external payable nonReentrant {
        require(tokens.length == amounts.length, "Array length mismatch");

        uint256 totalNativeAmount = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            TokenConfig memory c = tokenConfigs[tokens[i]];
            require(c.enabled, "Token not supported");
            require(amounts[i] >= c.minAmount && amounts[i] <= c.maxAmount, "Amount out of range");

            if (tokens[i] == address(0)) {
                totalNativeAmount += amounts[i];
            } else {
                require(IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]), "Transfer failed");
            }

            userBalances[msg.sender][tokens[i]] += amounts[i];
            platformBalances[tokens[i]] += amounts[i];

            emit PaymentReceived(msg.sender, tokens[i], amounts[i]);
        }

        // Validate total native token amount matches msg.value
        require(msg.value == totalNativeAmount, "Incorrect total ETH amount");
    }

    /**
     * @dev Withdraws user balance to their wallet.
     * @param token The token address to withdraw (address(0) for ETH).
     * @param amount The withdrawal amount.
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount >= MIN_WITHDRAWAL, "Below minimum withdrawal");
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");

        userBalances[msg.sender][token] -= amount;

        _transfer(token, msg.sender, amount);

        emit Withdrawal(msg.sender, token, amount);
    }

    /**
     * @dev Withdraws accumulated platform fees.
     * @param token The token address to withdraw.
     * @param amount The withdrawal amount.
     */
    function withdrawFees(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= platformBalances[token], "Insufficient platform balance");

        platformBalances[token] -= amount;

        _transfer(token, owner(), amount);

        emit PlatformFeeCollected(token, amount);
    }

    function _transfer(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(to, amount), "Token transfer failed");
        }
    }

    /**
     * @dev Gets a user's balance for a specific token.
     * @param user The user address.
     * @param token The token address.
     * @return The user's balance.
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }

    /**
     * @dev Gets the list of all supported tokens.
     * @return Array of supported token addresses.
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    receive() external payable {}
}
