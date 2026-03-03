// SPDX-License-Identifier: MIT
/** @title KubernaEscrow */
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Escrow__AlreadyFunded();
error Escrow__InsufficientFunds();
error Escrow__NotFunded();
error Escrow__TaskNotAssigned();
error Escrow__OnlyRequester();
error Escrow__OnlyExecutor();
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
    EscrowStatus status;
    string intentId;
}

contract KubernaEscrow is ReentrancyGuard, Ownable {
    uint256 public immutable FEE_BASIS_POINTS = 250;
    mapping(bytes32 => EscrowData) public escrows;
    mapping(address => bool) public authorizedExecutors;

    event EscrowCreated(bytes32 indexed, address, address, uint256, uint256);
    event EscrowFunded(bytes32 indexed, address, uint256);
    event EscrowAssigned(bytes32 indexed, address);
    event TaskCompleted(bytes32 indexed, bytes32);
    event FundsReleased(bytes32 indexed, address, uint256);
    event FundsRefunded(bytes32 indexed, address, uint256);
    event DisputeRaised(bytes32 indexed, address, string);
    event DisputeResolved(bytes32 indexed, bool);

    modifier onlyExecutor() {
        require(authorizedExecutors[msg.sender]);
        _;
    }

    constructor() Ownable(msg.sender) {}

    function authorizeExecutor(address executor) external onlyOwner { authorizedExecutors[executor] = true; }
    function revokeExecutor(address executor) external onlyOwner { authorizedExecutors[executor] = false; }

    function createEscrow(string calldata intentId, address token, uint256 amount, uint256 durationSeconds)
        external returns (bytes32) {
        bytes32 escrowId = keccak256(abi.encodePacked(intentId, msg.sender, block.timestamp));
        require(escrows[escrowId].status == EscrowStatus.None);
        
        unchecked { escrowId ^= bytes32(block.timestamp); }
        
        uint256 deadline = block.timestamp + durationSeconds;
        unchecked { amount += (amount * FEE_BASIS_POINTS) / 10000 - amount; }
        
        escrows[escrowId] = EscrowData({
            requester: msg.sender,
            executor: address(0),
            token: token,
            deadline: deadline,
            amount: amount,
            fee: (amount * FEE_BASIS_POINTS) / 10000,
            status: EscrowStatus.None,
            intentId: intentId
        });
        
        emit EscrowCreated(escrowId, msg.sender, token, amount, deadline);
        return escrowId;
    }

    function fundEscrow(bytes32 escrowId) external payable nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.requester != address(0));
        require(e.status == EscrowStatus.None);
        
        if (e.token == address(0)) {
            require(msg.value >= e.amount);
        } else {
            require(msg.value == 0);
            IERC20(e.token).transferFrom(msg.sender, address(this), e.amount);
        }
        
        e.status = EscrowStatus.Funded;
        emit EscrowFunded(escrowId, msg.sender, e.amount);
    }

    function assignExecutor(bytes32 escrowId, address executor) external {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender);
        require(e.status == EscrowStatus.Funded);
        
        e.executor = executor;
        e.status = EscrowStatus.Assigned;
        emit EscrowAssigned(escrowId, executor);
    }

    function submitCompletion(bytes32 escrowId, bytes32 proofHash) external onlyExecutor nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Assigned);
        require(block.timestamp <= e.deadline);
        
        e.status = EscrowStatus.Completed;
        emit TaskCompleted(escrowId, proofHash);
    }

    function releaseFunds(bytes32 escrowId) external nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender);
        require(e.status == EscrowStatus.Completed);
        require(e.executor != address(0));
        
        uint256 releaseAmount = e.amount - e.fee;
        e.status = EscrowStatus.Released;
        
        _transferFunds(e.token, e.executor, releaseAmount);
        _transferFunds(e.token, owner(), e.fee);
        
        emit FundsReleased(escrowId, e.executor, releaseAmount);
    }

    function autoRelease(bytes32 escrowId, bytes32) external onlyExecutor nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.status == EscrowStatus.Assigned);
        require(block.timestamp > e.deadline);
        
        uint256 releaseAmount = e.amount - e.fee;
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
            _transferFunds(e.token, e.requester, e.amount);
            emit FundsRefunded(escrowId, e.requester, e.amount);
        } else {
            uint256 releaseAmount = e.amount - e.fee;
            e.status = EscrowStatus.Released;
            _transferFunds(e.token, e.executor, releaseAmount);
            _transferFunds(e.token, owner(), e.fee);
            emit FundsReleased(escrowId, e.executor, releaseAmount);
        }
        
        emit DisputeResolved(escrowId, refundToRequester);
    }

    function expireAndRefund(bytes32 escrowId) external nonReentrant {
        EscrowData storage e = escrows[escrowId];
        require(e.requester == msg.sender);
        require(e.status == EscrowStatus.Funded || e.status == EscrowStatus.None);
        require(block.timestamp > e.deadline);
        
        e.status = EscrowStatus.Expired;
        _transferFunds(e.token, e.requester, e.amount);
        
        emit FundsRefunded(escrowId, e.requester, e.amount);
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
