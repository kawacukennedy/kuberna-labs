// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
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
 * Escrow model: each initiated transfer escrows its exact principal on the
 * source chain (native assets via msg.value, ERC20 via transferFrom) and the
 * principal is tracked per sender. executeTransfer pays out only from that
 * escrow, and the fee/withdrawal functions can never drain escrowed principal.
 */
contract CrossChainRouter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    enum ChainId {
        ETHEREUM,
        POLYGON,
        ARBITRUM,
        OPTIMISM,
        AVALANCHE,
        BSC,
        NEAR,
        SOLANA,
        MANTLE
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
    mapping(bytes32 => bytes32) public messageDataHash;

    // --- Escrow accounting (per sender) ---
    mapping(bytes32 => uint256) public escrowByMessage;
    mapping(address => uint256) public senderNativeEscrow;
    mapping(address => mapping(address => uint256)) public senderTokenEscrow;
    // Aggregate escrow used to guard fee/withdrawal functions.
    uint256 public totalNativeEscrowed;
    mapping(address => uint256) public totalTokenEscrowed;

    event CrossChainTransferInitiated(
        bytes32 indexed messageId,
        uint256 indexed sourceChain,
        uint256 indexed destinationChain,
        address sender,
        address recipient,
        address token,
        uint256 amount
    );
    event CrossChainTransferExecuted(bytes32 indexed messageId, address indexed recipient, uint256 amount);
    event ChainSupportUpdated(uint256 chainId, bool supported);
    event FeeUpdated(uint256 newFee);
    event TokenMappingUpdated(uint256 chainId, address localToken, address remoteToken);
    event EmergencyHalted(address indexed by);
    event Resumed(address indexed by);

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
    ) external payable nonReentrant whenNotPaused {
        require(supportedChains[destinationChainId], "Unsupported chain");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(minReceived > 0 && minReceived <= amount, "Invalid minReceived");

        if (token != address(0)) {
            require(msg.value >= bridgeFee, "Insufficient bridge fee");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            senderTokenEscrow[msg.sender][token] += amount;
            totalTokenEscrowed[token] += amount;
        } else {
            // Native principal must be escrowed exactly: amount + bridge fee.
            require(msg.value == amount + bridgeFee, "Native principal must be escrowed");
            senderNativeEscrow[msg.sender] += amount;
            totalNativeEscrowed += amount;
        }

        uint256 nonce = nonces[msg.sender]++;
        bytes32 messageId = keccak256(abi.encodePacked(msg.sender, recipient, token, amount, nonce, block.timestamp));

        escrowByMessage[messageId] = amount;
        messageDataHash[messageId] = keccak256(abi.encodePacked(recipient, token, amount));

        messages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: block.chainid,
            destinationChainId: destinationChainId,
            sender: msg.sender,
            recipient: recipient,
            token: token,
            amount: amount,
            data: "",
            nonce: nonce,
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
    ) external onlyOwner nonReentrant whenNotPaused {
        CrossChainMessage storage message = messages[messageId];
        require(message.sender != address(0), "Message does not exist");
        require(!message.executed, "Already executed");
        require(messageDataHash[messageId] == keccak256(abi.encodePacked(recipient, token, amount)), "Params mismatch");
        require(amount >= minReceived, "Slippage exceeded");
        // The message's escrowed principal must cover the payout.
        require(escrowByMessage[messageId] == message.amount, "Escrow mismatch");

        message.executed = true;
        delete escrowByMessage[messageId];

        if (token != address(0)) {
            require(senderTokenEscrow[message.sender][token] >= amount, "Token escrow insufficient");
            senderTokenEscrow[message.sender][token] -= amount;
            totalTokenEscrowed[token] -= amount;
            IERC20(token).safeTransfer(recipient, amount);
        } else {
            require(senderNativeEscrow[message.sender] >= amount, "Native escrow insufficient");
            require(address(this).balance >= totalNativeEscrowed, "Native escrow insolvent");
            senderNativeEscrow[message.sender] -= amount;
            totalNativeEscrowed -= amount;
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "Native transfer failed");
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
     * @dev Sets token address mapping between chains.
     * @param chainId The destination chain ID
     * @param localToken The local token address
     * @param remoteToken The corresponding remote token address
     */
    function setTokenMapping(uint256 chainId, address localToken, address remoteToken) external onlyOwner {
        chainTokenMapping[chainId][localToken] = remoteToken;
        emit TokenMappingUpdated(chainId, localToken, remoteToken);
    }

    /**
     * @dev Emergency halt — pauses all cross-chain operations.
     */
    function emergencyHalt() external onlyOwner {
        _pause();
        emit EmergencyHalted(msg.sender);
    }

    /**
     * @dev Resume operations after emergency halt.
     */
    function resume() external onlyOwner {
        _unpause();
        emit Resumed(msg.sender);
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
        return (amount * (BPS_DENOMINATOR - slippageTolerance)) / BPS_DENOMINATOR;
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
     * @dev Withdraws accumulated fees — never below outstanding native escrow.
     * @param recipient The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawFees(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(address(this).balance - amount >= totalNativeEscrowed, "Cannot withdraw escrowed principal");
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Native transfer failed");
    }

    /**
     * @dev Withdraws ERC20 tokens — never below outstanding token escrow.
     * @param token The token address
     * @param recipient The recipient address
     * @param amount The amount to withdraw
     */
    function withdrawTokens(address token, address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(
            IERC20(token).balanceOf(address(this)) - amount >= totalTokenEscrowed[token],
            "Cannot withdraw escrowed tokens"
        );
        IERC20(token).safeTransfer(recipient, amount);
    }

    // No receive() — native value must flow through initiateTransfer so every
    // incoming unit is either escrowed principal or an accounted bridge fee.
}
