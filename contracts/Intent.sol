// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Intent__Invalid();
error Intent__Unauthorized();

enum IntentStatus { Open, Bidding, Assigned, Executing, Completed, Expired, Disputed }
enum BidStatus { Pending, Accepted, Rejected }

struct IntentData {
    address requester;
    string description;
    bytes structuredData;
    address sourceToken;
    uint256 sourceAmount;
    address destToken;
    uint256 minDestAmount;
    uint256 budget;
    uint256 deadline;
    IntentStatus status;
    address selectedSolver;
    bytes32 escrowId;
}

struct BidData {
    address solver;
    uint256 price;
    uint256 estimatedTime;
    bytes routeDetails;
    BidStatus status;
    uint256 createdAt;
}

contract KubernaIntent is Ownable, ReentrancyGuard {
    uint256 public intentCount;
    uint256 public immutable MIN_DEADLINE = 300;
    uint256 public immutable MAX_DEADLINE = 2592000;

    mapping(bytes32 => IntentData) public intents;
    mapping(bytes32 => BidData[]) public bids;
    mapping(bytes32 => mapping(address => bool)) public hasBid;
    mapping(address => bytes32[]) public solverIntents;

    event IntentCreated(bytes32, address, uint256);
    event BidSubmitted(bytes32, address, uint256);
    event BidAccepted(bytes32, address);
    event BidRejected(bytes32, address);
    event IntentAssigned(bytes32, address);
    event IntentCompleted(bytes32);
    event IntentExpired(bytes32);

    constructor() Ownable(msg.sender) {}

    function createIntent(
        bytes32 intentId,
        string calldata,
        bytes calldata structuredData,
        address sourceToken,
        uint256 sourceAmount,
        address destToken,
        uint256 minDestAmount,
        uint256 budget,
        uint256 durationSeconds
    ) external returns (bytes32) {
        require(durationSeconds >= MIN_DEADLINE && durationSeconds <= MAX_DEADLINE);
        require(intents[intentId].requester == address(0));

        uint256 deadline = block.timestamp + durationSeconds;

        intents[intentId] = IntentData({
            requester: msg.sender,
            description: "",
            structuredData: structuredData,
            sourceToken: sourceToken,
            sourceAmount: sourceAmount,
            destToken: destToken,
            minDestAmount: minDestAmount,
            budget: budget,
            deadline: deadline,
            status: IntentStatus.Open,
            selectedSolver: address(0),
            escrowId: bytes32(0)
        });

        unchecked { intentCount++; }
        emit IntentCreated(intentId, msg.sender, deadline);
        return intentId;
    }

    function submitBid(bytes32 intentId, uint256 price, uint256 estimatedTime, bytes calldata routeDetails) external {
        IntentData storage i = intents[intentId];
        require(i.requester != address(0));
        require(block.timestamp < i.deadline);
        require(i.status == IntentStatus.Open || i.status == IntentStatus.Bidding);
        require(!hasBid[intentId][msg.sender]);

        bids[intentId].push(BidData(msg.sender, price, estimatedTime, routeDetails, BidStatus.Pending, block.timestamp));
        hasBid[intentId][msg.sender] = true;
        solverIntents[msg.sender].push(intentId);

        if (i.status == IntentStatus.Open) i.status = IntentStatus.Bidding;

        emit BidSubmitted(intentId, msg.sender, price);
    }

    function acceptBid(bytes32 intentId, uint256 solverIndex) external {
        IntentData storage i = intents[intentId];
        require(i.requester == msg.sender);
        require(i.status == IntentStatus.Bidding);
        require(solverIndex < bids[intentId].length);

        BidData storage bid = bids[intentId][solverIndex];
        require(bid.status == BidStatus.Pending);

        bid.status = BidStatus.Accepted;
        i.selectedSolver = bid.solver;
        i.status = IntentStatus.Assigned;

        BidData[] storage b = bids[intentId];
        for (uint256 j = 0; j < b.length; j++) {
            if (j != solverIndex && b[j].status == BidStatus.Pending) {
                b[j].status = BidStatus.Rejected;
                emit BidRejected(intentId, b[j].solver);
            }
        }

        emit BidAccepted(intentId, bid.solver);
        emit IntentAssigned(intentId, bid.solver);
    }

    function rejectBid(bytes32 intentId, uint256 solverIndex) external {
        IntentData storage i = intents[intentId];
        require(i.requester == msg.sender);
        require(solverIndex < bids[intentId].length);

        BidData storage bid = bids[intentId][solverIndex];
        require(bid.status == BidStatus.Pending);
        bid.status = BidStatus.Rejected;

        emit BidRejected(intentId, bid.solver);
    }

    function setEscrow(bytes32 intentId, bytes32 escrowId) external {
        IntentData storage i = intents[intentId];
        require(i.requester == msg.sender || i.selectedSolver == msg.sender);
        require(i.status == IntentStatus.Assigned);

        i.escrowId = escrowId;
        i.status = IntentStatus.Executing;
    }

    function completeIntent(bytes32 intentId) external {
        IntentData storage i = intents[intentId];
        require(i.selectedSolver == msg.sender || i.requester == msg.sender);
        require(i.status == IntentStatus.Executing);

        i.status = IntentStatus.Completed;
        emit IntentCompleted(intentId);
    }

    function expireIntent(bytes32 intentId) external {
        IntentData storage i = intents[intentId];
        require(block.timestamp >= i.deadline);
        require(i.status == IntentStatus.Open || i.status == IntentStatus.Bidding);

        i.status = IntentStatus.Expired;
        emit IntentExpired(intentId);
    }

    function getIntent(bytes32 intentId) external view returns (IntentData memory) { return intents[intentId]; }
    function getBidCount(bytes32 intentId) external view returns (uint256) { return bids[intentId].length; }
    function getBid(bytes32 intentId, uint256 index) external view returns (BidData memory) { return bids[intentId][index]; }
    function getSolverIntents(address solver) external view returns (bytes32[] memory) { return solverIntents[solver]; }
}
