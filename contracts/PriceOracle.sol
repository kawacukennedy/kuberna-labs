// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PriceOracle
 * @dev Oracle contract for fetching and storing token prices for Kuberna Labs.
 * 
 * This contract provides price data for various tokens used in the platform,
 * enabling accurate valuation for escrow, subscriptions, and marketplace transactions.
 * 
 * Features:
 * - Admin-updated prices withtimelock for security
 * - Multi-token price support
 * - Emergency pause functionality
 * - Price history for verification
 */
contract PriceOracle is Ownable, Pausable {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isSet;
    }

    mapping(address => PriceData) public tokenPrices;
    mapping(address => uint256[]) public priceHistory;
    
    uint256 public constant PRICE_UPDATE_DELAY = 1 hours;
    mapping(address => uint256) public pendingPrices;
    mapping(address => uint256) public pendingPriceTimestamps;
    
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event PricePending(address indexed token, uint256 pendingPrice, uint256 timestamp);

    /**
     * @dev Initializes the oracle with the owner address.
     * @param _owner The contract owner address
     */
    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Sets a pending price update that can be confirmed after delay.
     * @param token The token address
     * @param price The new price in USD with 8 decimals
     */
    function setPendingPrice(address token, uint256 price) external onlyOwner whenNotPaused {
        require(token != address(0), "Invalid token address");
        require(price > 0, "Price must be greater than 0");
        
        pendingPrices[token] = price;
        pendingPriceTimestamps[token] = block.timestamp;
        emit PricePending(token, price, block.timestamp);
    }

    /**
     * @dev Confirms a pending price update after the delay period.
     * @param token The token address
     */
    function confirmPrice(address token) external onlyOwner {
        require(pendingPrices[token] > 0, "No pending price");
        require(
            block.timestamp >= pendingPriceTimestamps[token] + PRICE_UPDATE_DELAY,
            "Delay not elapsed"
        );

        uint256 newPrice = pendingPrices[token];
        tokenPrices[token] = PriceData({
            price: newPrice,
            timestamp: block.timestamp,
            isSet: true
        });
        
        priceHistory[token].push(newPrice);
        
        delete pendingPrices[token];
        delete pendingPriceTimestamps[token];
        
        emit PriceUpdated(token, newPrice, block.timestamp);
    }

    /**
     * @dev Gets the current price for a token.
     * @param token The token address
     * @return The token price in USD with 8 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        require(tokenPrices[token].isSet, "Price not set");
        return tokenPrices[token].price;
    }

    /**
     * @dev Gets the price with a fallback to a default value.
     * @param token The token address
     * @param fallbackPrice The fallback price
     * @return The token price or fallback
     */
    function getPriceOrFallback(address token, uint256 fallbackPrice) external view returns (uint256) {
        if (tokenPrices[token].isSet) {
            return tokenPrices[token].price;
        }
        return fallbackPrice;
    }

    /**
     * @dev Gets price data with timestamp.
     * @param token The token address
     * @return price The token price
     * @return timestamp The last update timestamp
     */
    function getPriceData(address token) external view returns (uint256 price, uint256 timestamp) {
        PriceData memory data = tokenPrices[token];
        return (data.price, data.timestamp);
    }

    /**
     * @dev Gets the price history for a token.
     * @param token The token address
     * @return Array of historical prices
     */
    function getPriceHistory(address token) external view returns (uint256[] memory) {
        return priceHistory[token];
    }

    /**
     * @dev Pauses the contract in emergency situations.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
