// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Dispute__Invalid();

enum DisputeStatus { Open, Voting, Resolved, Appealed, Closed }
enum Vote { None, RequesterWins, ExecutorWins, Split }

struct DisputeData {
    bytes32 escrowId;
    address requester;
    address executor;
    string reason;
    string requesterEvidence;
    string executorEvidence;
    uint256 createdAt;
    uint256 votingEndTime;
    uint256 requesterVotes;
    uint256 executorVotes;
    DisputeStatus status;
    Vote result;
    bool appealed;
}

struct Juror {
    address juror;
    uint256 stakedAmount;
    bool active;
}

struct VoteRecord {
    address voter;
    Vote vote;
    uint256 timestamp;
}

contract KubernaDispute is Ownable, ReentrancyGuard {
    uint256 public disputeCount;
    uint256 public immutable VOTING_PERIOD = 7 days;
    uint256 public immutable APPEAL_PERIOD = 3 days;
    uint256 public immutable MIN_JUROR_STAKE = 100 ether;
    uint256 public immutable JUROR_REWARD = 10 ether;

    mapping(bytes32 => DisputeData) public disputes;
    mapping(bytes32 => VoteRecord[]) public disputeVotes;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    mapping(address => Juror) public jurors;
    address[] public jurorList;

    event DisputeOpened(bytes32, bytes32, address, address);
    event VoteCast(bytes32, address, Vote);
    event DisputeResolved(bytes32, Vote);
    event DisputeAppealed(bytes32);
    event JurorRegistered(address);

    constructor() Ownable(msg.sender) {}

    function registerJuror(address juror) external payable {
        require(msg.value >= MIN_JUROR_STAKE);
        require(!jurors[juror].active);

        jurors[juror] = Juror(juror, msg.value, true);
        jurorList.push(juror);
        unchecked { disputeCount++; }

        emit JurorRegistered(juror);
    }

    function openDispute(bytes32 escrowId, address requester, address executor, string calldata reason)
        external onlyOwner returns (bytes32) {
        require(disputes[escrowId].createdAt == 0);

        bytes32 disputeId = keccak256(abi.encodePacked(escrowId, block.timestamp));

        disputes[disputeId] = DisputeData({
            escrowId: escrowId,
            requester: requester,
            executor: executor,
            reason: reason,
            requesterEvidence: "",
            executorEvidence: "",
            createdAt: block.timestamp,
            votingEndTime: block.timestamp + VOTING_PERIOD,
            requesterVotes: 0,
            executorVotes: 0,
            status: DisputeStatus.Voting,
            result: Vote.None,
            appealed: false
        });

        emit DisputeOpened(disputeId, escrowId, requester, executor);
        return disputeId;
    }

    function submitEvidence(bytes32 disputeId, string calldata evidence, bool isRequester) external {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Voting);
        require(bytes(evidence).length <= 1000);

        if (isRequester) {
            require(msg.sender == d.requester);
            d.requesterEvidence = evidence;
        } else {
            require(msg.sender == d.executor);
            d.executorEvidence = evidence;
        }
    }

    function vote(bytes32 disputeId, Vote support) external {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Voting);
        require(block.timestamp < d.votingEndTime);
        require(jurors[msg.sender].active);
        require(!hasVoted[disputeId][msg.sender]);

        hasVoted[disputeId][msg.sender] = true;
        disputeVotes[disputeId].push(VoteRecord(msg.sender, support, block.timestamp));

        if (support == Vote.RequesterWins) { unchecked { d.requesterVotes++; } }
        else if (support == Vote.ExecutorWins) { unchecked { d.executorVotes++; } }

        emit VoteCast(disputeId, msg.sender, support);
    }

    function resolveDispute(bytes32 disputeId) external {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Voting);
        require(block.timestamp >= d.votingEndTime);

        if (d.requesterVotes > d.executorVotes) d.result = Vote.RequesterWins;
        else if (d.executorVotes > d.requesterVotes) d.result = Vote.ExecutorWins;
        else d.result = Vote.Split;

        d.status = DisputeStatus.Resolved;
        _rewardJurors(disputeId);

        emit DisputeResolved(disputeId, d.result);
    }

    function appealDispute(bytes32 disputeId) external payable {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Resolved);
        require(!d.appealed);
        require(msg.sender == d.requester || msg.sender == d.executor);
        require(msg.value >= 1 ether);

        d.appealed = true;
        d.status = DisputeStatus.Appealed;
        d.votingEndTime = block.timestamp + APPEAL_PERIOD;

        emit DisputeAppealed(disputeId);
    }

    function _rewardJurors(bytes32 disputeId) internal {
        VoteRecord[] storage votes = disputeVotes[disputeId];
        Vote result = disputes[disputeId].result;
        
        for (uint256 i = 0; i < votes.length; i++) {
            uint256 reward = votes[i].vote == result ? JUROR_REWARD * 2 : JUROR_REWARD;
            payable(votes[i].voter).transfer(reward);
        }
    }

    function getDispute(bytes32 disputeId) external view returns (DisputeData memory) { return disputes[disputeId]; }
    function getVoteCount(bytes32 disputeId) external view returns (uint256) { return disputeVotes[disputeId].length; }
    function getJurors() external view returns (address[] memory) { return jurorList; }

    receive() external payable {}
}