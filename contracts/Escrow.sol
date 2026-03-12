// SPDX-License-Identifier: MIT
/** @title KubernaEscrow */
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

error Escrow__AlreadyFunded();
error Escrow__InsufficientFunds();
error Escrow__NotFunded();
error Escrow__TaskNotAssigned();
error Escrow__OnlyRequester();
error Escrow__OnlyExecutor();
error Escrow__InvalidAddress();
error Escrow__TaskExpired();
error Escrow__TaskNotCompleted();
error Escrow__DisputeActive();

enum EscrowStatus { None, Funded, Assigned, Completed, Disputed, Released, Refunded, Expired }

struct EscrowData {
    address requester;
    address executor;
    address token;
    uint256 deadline;
    uint256 amount;
    uint256 fee;
    uint256 completionTime;
    EscrowStatus status;
    string intentId;
}

contract KubernaEscrow is ReentrancyGuard, Ownable, Pausable {
    uint256 public constant FEE_BASIS_POINTS = 250;
    uint256 public constant MIN_DEADLINE = 300; // 5 minutes
    uint256 public constant AUTO_RELEASE_DELAY = 24 hours;
    mapping(bytes32 => EscrowData) public escrows;

    event EscrowCreated(bytes32 indexed, address, address, uint256, uint256);
    event EscrowFunded(bytes32 indexed, address, uint256);
    event EscrowAssigned(bytes32 indexed, address);
    event TaskCompleted(bytes32 indexed, bytes32);
    event FundsReleased(bytes32 indexed, address, uint256);
    event FundsRefunded(bytes32 indexed, address, uint256);
    event DisputeRaised(bytes32 indexed, address, string);
    event DisputeResolved(bytes32 indexed, bool);
    event ExecutorChanged(bytes32 indexed, address indexed oldExecutor, address indexed newExecutor);

    modifier onlyAssignedExecutor(bytes32 escrowId) {
        require(escrows[escrowId].executor == msg.sender, "Not assigned executor");
        _;
    }

    constructor() Ownable(msg.sender) Pausable() {}

    // Emergency pause functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createEscrow(string calldata intentId, address token, uint256 amount, uint256 durationSeconds)
        external whenNotPaused returns (bytes32) {
        require(amount > 0, "Amount must be greater than zero");
        require(durationSeconds >= MIN_DEADLINE, "Duration below minimum deadline");
        
        bytes32 escrowId = keccak256(abi.encodePacked(intentId, msg.sender, block.timestamp));
        require(escrows[escrowId].status == EscrowStatus.None, "Escrow already exists");
        
        uint256 deadline = block.timestamp + durationSeconds;
        uint256 fee = (amount * FEE_BASIS_POINTS) / 10000;
        
        escrows[escrowId] = EscrowData({
            requester: msg.sender,
            executor: address(0),
            token: token,
            deadline: deadline,
            amount: amount,
            fee: fee,
            completionTime: 0,
            status: EscrowStatus.None,
            intentId: intentId
        });
        
        emit EscrowCreated(escrowId, msg.sender, token, amount + fee, deadline);
        return escrowId;
    }

    function fundEscrow(bytes32 escrowId) external payable nonReentrant whenNotPaused {
        EscrowData storage e = escrows[escrowId];
        require(e.requester != address(0), "Escrow does not exist");
        require(e.status == EscrowStatus.None, "Escrow already funded");
        
        uint256 totalRequired = e.amount + e.fee;
        
        if (e.token == address(0)) {
            require(msg.value >= totalRequired, "Insufficient ETH sent");
        } else {
            require(msg.value == 0, "ETH not accepted for token escrow");
            IERC20(e.token).transferFrom(msg.sender, address(this), totalRequired);
        }
        
        e.status = EscrowStatus.Funded;
        emit EscrowFunded(escrowId, msg.sender, totalRequired);
    }

    function assignExecutor(bytes32 escrowId, address executor) external whenNotPaused {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender);
        require(e.status == EscrowStatus.Funded);
        
        require(executor != address(0), "Invalid executor address");
        e.executor = executor;
        e.status = EscrowStatus.Assigned;
        emit EscrowAssigned(escrowId, executor);
    }

    function submitCompletion(bytes32 escrowId, bytes32 proofHash) external onlyAssignedExecutor(escrowId) nonReentrant whenNotPaused {
        EscrowData storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Assigned, "Escrow not assigned");
        require(block.timestamp <= e.deadline, "Task deadline passed");
        
        e.status = EscrowStatus.Completed;
        e.completionTime = block.timestamp;
        emit TaskCompleted(escrowId, proofHash);
    }

    function releaseFunds(bytes32 escrowId) external nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender, "Only requester can release");
        require(e.status == EscrowStatus.Completed, "Task not completed");
        require(e.executor != address(0), "No executor assigned");
        
        uint256 releaseAmount = e.amount;
        e.status = EscrowStatus.Released;
        
        _transferFunds(e.token, e.executor, releaseAmount);
        _transferFunds(e.token, owner(), e.fee);
        
        emit FundsReleased(escrowId, e.executor, releaseAmount);
    }

    function autoRelease(bytes32 escrowId) external onlyAssignedExecutor(escrowId) nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Completed, "Task not completed");
        require(e.completionTime > 0, "Completion time not set");
        require(block.timestamp >= e.completionTime + AUTO_RELEASE_DELAY, "24 hours not passed since completion");
        
        uint256 releaseAmount = e.amount;
        e.status = EscrowStatus.Released;
        
        _transferFunds(e.token, e.executor, releaseAmount);
        _transferFunds(e.token, owner(), e.fee);
        
        emit FundsReleased(escrowId, e.executor, releaseAmount);
    }

    function raiseDispute(bytes32 escrowId, string calldata reason) external {
        EscrowData storage e = escrows[escrowId];
        require(msg.sender == e.requester || msg.sender == e.executor);
        require(e.status == EscrowStatus.Assigned || e.status == EscrowStatus.Completed);
        
        e.status = EscrowStatus.Disputed;
        emit DisputeRaised(escrowId, msg.sender, reason);
    }

    function resolveDispute(bytes32 escrowId, bool refundToRequester) external onlyOwner {
        EscrowData storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Disputed);
        
        if (refundToRequester) {
            e.status = EscrowStatus.Refunded;
            _transferFunds(e.token, e.requester, e.amount + e.fee);
            emit FundsRefunded(escrowId, e.requester, e.amount + e.fee);
        } else {
            e.status = EscrowStatus.Released;
            _transferFunds(e.token, e.executor, e.amount);
            _transferFunds(e.token, owner(), e.fee);
            emit FundsReleased(escrowId, e.executor, e.amount);
        }
        
        emit DisputeResolved(escrowId, refundToRequester);
    }

    function expireAndRefund(bytes32 escrowId) external nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender, "Only requester can expire");
        require(e.status == EscrowStatus.Funded || e.status == EscrowStatus.None, "Invalid status for expiration");
        require(block.timestamp > e.deadline, "Deadline not passed");
        
        // Store the original status before changing it
        bool wasFunded = (e.status == EscrowStatus.Funded);
        e.status = EscrowStatus.Expired;
        
        // Refund amount + fee if escrow was funded, only amount if not funded
        if (wasFunded) {
            _transferFunds(e.token, e.requester, e.amount + e.fee);
            emit FundsRefunded(escrowId, e.requester, e.amount + e.fee);
        } else {
            _transferFunds(e.token, e.requester, e.amount);
            emit FundsRefunded(escrowId, e.requester, e.amount);
        }
    }

    function getEscrow(bytes32 escrowId) external view returns (EscrowData memory) { return escrows[escrowId]; }
    function getEscrowStatus(bytes32 escrowId) external view returns (EscrowStatus) { return escrows[escrowId].status; }

    function _transferFunds(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success,) = payable(to).call{value: amount}("");
            if (!success) revert();
        } else {
            IERC20(token).transfer(to, amount);
        }
    }

    receive() external payable {}
}
