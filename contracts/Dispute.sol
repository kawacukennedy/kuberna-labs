// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Dispute__Invalid();
error Dispute__ActiveDuties();
error Dispute__CannotVoteOwnDispute();

enum DisputeStatus {
    Open,
    Voting,
    Resolved,
    Appealed,
    Closed
}
enum Vote {
    None,
    RequesterWins,
    ExecutorWins,
    Split
}

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

/**
 * @title KubernaDispute
 * @dev Decentralized dispute resolution with juror staking and voting.
 * Handles evidence submission, jury voting, appeals, and reward distribution.
 */
contract KubernaDispute is Ownable, ReentrancyGuard {
    uint256 public disputeCount;
    uint256 public immutable VOTING_PERIOD = 7 days;
    uint256 public immutable APPEAL_PERIOD = 3 days;
    uint256 public immutable MIN_JUROR_STAKE = 100 ether;
    uint256 public immutable JUROR_REWARD = 10 ether;

    mapping(bytes32 => DisputeData) public disputes;
    mapping(bytes32 => VoteRecord[]) public disputeVotes;
    mapping(bytes32 => mapping(address => bool)) public hasVoted;
    mapping(bytes32 => mapping(address => uint256)) public pendingRewards;
    mapping(address => Juror) public jurors;
    address[] public jurorList;
    uint256 public jurorCount;
    mapping(address => uint256) public activeDisputeDuties;

    // CON-06: escrow -> current dispute round. openDispute requires this to be
    // empty so the same escrow can never host two concurrent dispute rounds.
    mapping(bytes32 => bytes32) public activeDisputeByEscrow;
    // CON-07: per-round reward funding. Rewards are paid exclusively out of the
    // seeded pool (bond / appeal fee), never minted from the staking pool.
    mapping(bytes32 => uint256) public disputeRewardPools;
    // Total rewards already accrued against a round's pool (for refund math).
    mapping(bytes32 => uint256) public rewardsPaid;
    // CON-03: appeal fee held against the *child* round, refundable once that
    // round reaches a final (non-appealed) resolution.
    mapping(bytes32 => uint256) public appealFees;
    mapping(bytes32 => address) public appealPayers;
    mapping(bytes32 => bytes32) public appealOf;

    event RewardClaimed(address indexed juror, uint256 amount);

    event DisputeOpened(bytes32, bytes32, address, address);
    event VoteCast(bytes32, address, Vote);
    event DisputeResolved(bytes32, Vote);
    event DisputeAppealed(bytes32, bytes32);
    event JurorRegistered(address);
    event JurorUnregistered(address juror, uint256 amount);
    event AppealRefundClaimed(address indexed appellant, bytes32 roundId, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registers a new juror by staking the minimum required amount.
     * @param juror The juror address to register.
     */
    function registerJuror(address juror) external payable {
        require(msg.value >= MIN_JUROR_STAKE);
        require(!jurors[juror].active);
        if (activeDisputeDuties[juror] > 0) revert Dispute__ActiveDuties();

        jurors[juror] = Juror(juror, msg.value, true);
        jurorList.push(juror);
        unchecked {
            jurorCount++;
        }

        emit JurorRegistered(juror);
    }

    /**
     * @dev Unstakes and withdraws the juror's deposited amount.
     */
    function unstakeJuror() external nonReentrant {
        Juror storage j = jurors[msg.sender];
        require(j.active, "Not an active juror");
        require(j.stakedAmount > 0, "No stake to withdraw");
        if (activeDisputeDuties[msg.sender] > 0) revert Dispute__ActiveDuties();

        uint256 amount = j.stakedAmount;
        j.active = false;
        j.stakedAmount = 0;

        // CON-07: low-level .call instead of .transfer (2300 gas limit).
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Stake withdrawal failed");
        emit JurorUnregistered(msg.sender, amount);
    }

    /**
     * @dev Opens a new dispute for an escrow.
     * @param escrowId The associated escrow identifier.
     * @param requester The escrow requester address.
     * @param executor The escrow executor address.
     * @param reason The dispute reason.
     * @return disputeId The unique dispute identifier.
     */
    function openDispute(
        bytes32 escrowId,
        address requester,
        address executor,
        string calldata reason
    ) external payable onlyOwner returns (bytes32) {
        // CON-06: keyed by escrowId (the actual workload), not by a disputeId
        // derived from a timestamp — the old guard could never fire.
        require(
            activeDisputeByEscrow[escrowId] == bytes32(0) ||
                disputes[activeDisputeByEscrow[escrowId]].status != DisputeStatus.Voting,
            "Escrow already in active dispute"
        );

        bytes32 disputeId = keccak256(abi.encodePacked(escrowId, block.timestamp, disputeCount));

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
        activeDisputeByEscrow[escrowId] = disputeId;

        // CON-07: rewards are funded from the bond sent with the dispute, so a
        // resolution can never mint rewards out of other jurors' stakes.
        disputeRewardPools[disputeId] = msg.value;

        unchecked {
            disputeCount++;
        }

        emit DisputeOpened(disputeId, escrowId, requester, executor);
        return disputeId;
    }

    /**
     * @dev Submits evidence for a dispute.
     * @param disputeId The dispute identifier.
     * @param evidence The evidence text (max 1000 characters).
     * @param isRequester True if submitted by requester, false if by executor.
     */
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

    /**
     * @dev Casts a vote on an active dispute.
     * @param disputeId The dispute identifier.
     * @param support The vote option (RequesterWins, ExecutorWins, or Split).
     */
    function vote(bytes32 disputeId, Vote support) external {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Voting);
        require(block.timestamp < d.votingEndTime);
        require(jurors[msg.sender].active);
        require(!hasVoted[disputeId][msg.sender]);
        if (msg.sender == d.requester || msg.sender == d.executor) revert Dispute__CannotVoteOwnDispute();

        hasVoted[disputeId][msg.sender] = true;
        disputeVotes[disputeId].push(VoteRecord(msg.sender, support, block.timestamp));
        activeDisputeDuties[msg.sender]++;

        if (support == Vote.RequesterWins) {
            unchecked {
                d.requesterVotes++;
            }
        } else if (support == Vote.ExecutorWins) {
            unchecked {
                d.executorVotes++;
            }
        }

        emit VoteCast(disputeId, msg.sender, support);
    }

    /**
     * @dev Resolves a dispute after the voting period ends.
     * @param disputeId The dispute identifier.
     */
    function resolveDispute(bytes32 disputeId) external onlyOwner nonReentrant {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Voting);
        require(block.timestamp >= d.votingEndTime);

        if (d.requesterVotes > d.executorVotes) d.result = Vote.RequesterWins;
        else if (d.executorVotes > d.requesterVotes) d.result = Vote.ExecutorWins;
        else d.result = Vote.Split;

        d.status = DisputeStatus.Resolved;
        _rewardJurors(disputeId);
        _clearDisputeDuties(disputeId);

        // A resolved round that was never appealed is the final round for the
        // escrow, so the escrow is no longer in an active dispute.
        if (!d.appealed) delete activeDisputeByEscrow[d.escrowId];

        emit DisputeResolved(disputeId, d.result);
    }

    /**
     * @dev Appeals a resolved dispute by opening a brand-new voting round for
     * the same escrow (CON-03). The appeal fee is held and refundable once the
     * new round reaches a final (non-appealed) resolution.
     * @param disputeId The parent dispute identifier.
     * @return roundId The new round's dispute identifier.
     */
    function appealDispute(bytes32 disputeId) external payable returns (bytes32 roundId) {
        DisputeData storage d = disputes[disputeId];
        require(d.createdAt != 0);
        require(d.status == DisputeStatus.Resolved);
        require(!d.appealed);
        require(msg.sender == d.requester || msg.sender == d.executor);
        require(msg.value >= 1 ether);

        d.appealed = true;

        bytes32 newId = keccak256(abi.encodePacked(d.escrowId, block.timestamp, disputeCount));

        disputes[newId] = DisputeData({
            escrowId: d.escrowId,
            requester: d.requester,
            executor: d.executor,
            reason: d.reason,
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
        activeDisputeByEscrow[d.escrowId] = newId;
        appealOf[newId] = disputeId;
        // Hold the appeal fee; returnable to the appellant on final resolution.
        appealFees[newId] = msg.value;
        appealPayers[newId] = msg.sender;

        unchecked {
            disputeCount++;
        }

        emit DisputeAppealed(disputeId, newId);
        return newId;
    }

    /**
     * @dev Refunds a held appeal fee once the appealed round has been finally
     * resolved (Resolved and not re-appealed).
     * @param roundId The appealed round's dispute identifier.
     */
    function claimAppealRefund(bytes32 roundId) external nonReentrant {
        DisputeData storage round = disputes[roundId];
        require(round.createdAt != 0);
        require(round.status == DisputeStatus.Resolved);
        require(!round.appealed, "Round still being appealed");
        require(appealPayers[roundId] == msg.sender, "Not the appellant");

        uint256 fee = appealFees[roundId];
        require(fee > 0, "No appeal fee held");
        appealFees[roundId] = 0;

        (bool success, ) = payable(msg.sender).call{value: fee}("");
        require(success, "Appeal refund failed");
        emit AppealRefundClaimed(msg.sender, roundId, fee);
    }

    function _rewardJurors(bytes32 disputeId) internal {
        VoteRecord[] storage votes = disputeVotes[disputeId];
        Vote result = disputes[disputeId].result;

        uint256 pool = disputeRewardPools[disputeId];
        if (pool == 0) return; // no bond -> no rewards minted (CON-07)

        // Winners are weighted 2x, everyone else 1x, so the sum of paid
        // rewards can never exceed the per-dispute reward pool.
        uint256 winnerCount = 0;
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i].vote == result) winnerCount++;
        }
        if (votes.length == 0) return;

        uint256 totalWeight = votes.length + winnerCount;
        uint256 unitReward = pool / totalWeight;
        if (unitReward == 0) return;

        for (uint256 i = 0; i < votes.length; i++) {
            uint256 reward = votes[i].vote == result ? unitReward * 2 : unitReward;
            pendingRewards[disputeId][votes[i].voter] += reward;
            rewardsPaid[disputeId] += reward;
        }
    }

    function _clearDisputeDuties(bytes32 disputeId) internal {
        VoteRecord[] storage votes = disputeVotes[disputeId];
        for (uint256 i = 0; i < votes.length; i++) {
            if (activeDisputeDuties[votes[i].voter] > 0) {
                activeDisputeDuties[votes[i].voter]--;
            }
        }
    }

    /**
     * @dev Claims juror reward for a resolved dispute.
     * @param disputeId The dispute identifier.
     */
    function claimReward(bytes32 disputeId) external nonReentrant {
        uint256 reward = pendingRewards[disputeId][msg.sender];
        require(reward > 0, "No pending reward");
        pendingRewards[disputeId][msg.sender] = 0;
        // CON-07: low-level .call instead of .transfer.
        (bool success, ) = payable(msg.sender).call{value: reward}("");
        require(success, "Reward claim failed");
        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev Gets dispute details.
     * @param disputeId The dispute identifier.
     * @return The dispute data struct.
     */
    function getDispute(bytes32 disputeId) external view returns (DisputeData memory) {
        return disputes[disputeId];
    }

    /**
     * @dev Gets the total vote count for a dispute.
     * @param disputeId The dispute identifier.
     * @return The number of votes cast.
     */
    function getVoteCount(bytes32 disputeId) external view returns (uint256) {
        return disputeVotes[disputeId].length;
    }

    /**
     * @dev Gets the list of all registered jurors.
     * @return Array of juror addresses.
     */
    function getJurors() external view returns (address[] memory) {
        return jurorList;
    }

    receive() external payable {}
}
