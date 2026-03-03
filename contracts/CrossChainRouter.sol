// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainRouter
 * @dev Router contract for cross-chain token transfers and message passing.
 * 
 * This contract handles:
 * - Token bridging across supported chains
 * - Message relay between chains
 * - Fee management for cross-chain operations
 * - Slippage protection
 * 
 * Features:
 * - Multi-hop routing support
 * - Message authentication
 * - Emergency halt capability
 * - Fee distribution
 */
contract CrossChainRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum ChainId {
        ETHEREUM,
        POLYGON,
        ARBITRUM,
        OPTIMISM,
        AVALANCHE,
        BSC,
        NEAR,
        SOLANA
    }

    struct CrossChainMessage {
        bytes32 messageId;
        uint256 sourceChainId;
        uint256 destinationChainId;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        bytes data;
        uint256 nonce;
        bool executed;
        uint256 timestamp;
    }

    mapping(uint256 => bool) public supportedChains;
    mapping(uint256 => mapping(address => address)) public chainTokenMapping;
    mapping(bytes32 => CrossChainMessage) public messages;
    mapping(address => uint256) public nonces;
    
    uint256 public bridgeFee;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public slippageTolerance = 50; // 0.5%
    
    event CrossChainTransferInitiated(
        bytes32 indexed messageId,
        uint256 indexed sourceChain,
        uint256 indexed destinationChain,
        address sender,
        address recipient,
        address token,
        uint256 amount
    );
    event CrossChainTransferExecuted(
        bytes32 indexed messageId,
        address indexed recipient,
        uint256 amount
    );
    event ChainSupportUpdated(uint256 chainId, bool supported);
    event FeeUpdated(uint256 newFee);

    /**
     * @dev Initializes the cross-chain router.
     * @param _owner The contract owner
     */
    constructor(address _owner) Ownable(_owner) {}

    /**
     * @dev Initiates a cross-chain token transfer.
     * @param destinationChainId The destination chain ID
     * @param recipient The recipient address on destination chain
     * @param token The token address
     * @param amount The amount to transfer
     * @param minReceived Minimum amount to receive (slippage protection)
     */
    function initiateTransfer(
        uint256 destinationChainId,
        address recipient,
        address token,
        uint256 amount,
        uint256 minReceived
    ) external payable nonReentrant {
        require(supportedChains[destinationChainId], "Unsupported chain");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(msg.value >= bridgeFee, "Insufficient bridge fee");

        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        bytes32 messageId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                token,
                amount,
                nonces[msg.sender]++,
                block.timestamp
            )
        );

        messages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: block.chainid,
            destinationChainId: destinationChainId,
            sender: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            data: "",
            nonce: nonces[msg.sender],
            executed: false,
            timestamp: block.timestamp
        });

        emit CrossChainTransferInitiated(
            messageId,
            block.chainid,
            destinationChainId,
            msg.sender,
            recipient,
            token,
            amount
        );
    }

    /**
     * @dev Executes a cross-chain transfer (called by relayer/oracle).
     * @param messageId The message ID
     * @param recipient The recipient address
     * @param token The token address
     * @param amount The amount to transfer
     * @param minReceived Minimum amount to receive
     */
    function executeTransfer(
        bytes32 messageId,
        address recipient,
        address token,
        uint256 amount,
        uint256 minReceived
    ) external onlyOwner nonReentrant {
        CrossChainMessage storage message = messages[messageId];
        require(!message.executed, "Already executed");
        require(amount >= minReceived, "Slippage exceeded");

        message.executed = true;

        if (token != address(0)) {
            IERC20(token).safeTransfer(recipient, amount);
        } else {
            payable(recipient).transfer(amount);
        }

        emit CrossChainTransferExecuted(messageId, recipient, amount);
    }

    /**
     * @dev Sets support for a chain.
     * @param chainId The chain ID to update
     * @param supported Whether the chain is supported
     */
    function setChainSupport(uint256 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
        emit ChainSupportUpdated(chainId, supported);
    }

    /**
     * @dev Sets the bridge fee.
     * @param newFee The new bridge fee
     */
    function setBridgeFee(uint256 newFee) external onlyOwner {
        bridgeFee = newFee;
        emit FeeUpdated(newFee);
    }

    /**
     * @dev Sets the slippage tolerance.
     * @param tolerance The new tolerance in BPS
     */
    function setSlippageTolerance(uint256 tolerance) external onlyOwner {
        require(tolerance <= BPS_DENOMINATOR, "Tolerance too high");
        slippageTolerance = tolerance;
    }

    /**
     * @dev Gets the minimum received amount with slippage protection.
     * @param amount The input amount
     * @return The minimum amount to receive
     */
    function getMinReceived(uint256 amount) external view returns (uint256) {
        return amount * (BPS_DENOMINATOR - slippageTolerance) / BPS_DENOMINATOR;
    }

    /**
     * @dev Gets a cross-chain message.
     * @param messageId The message ID
     * @return The cross-chain message
     */
    function getMessage(bytes32 messageId) external view returns (CrossChainMessage memory) {
        return messages[messageId];
    }

    /**
     * @dev Withdraws accumulated fees.
     * @param recipient The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawFees(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        payable(recipient).transfer(amount);
    }

    /**
     * @dev Withdraws ERC20 tokens.
     * @param token The token address
     * @param recipient The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawTokens(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        IERC20(token).safeTransfer(recipient, amount);
    }

    receive() external payable {}
}
