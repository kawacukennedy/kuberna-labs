// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Treasury__Unauthorized();
error Treasury__InvalidAmount();
error Treasury__TransferFailed();

struct Proposal {
    address recipient;
    address token;
    uint256 amount;
    string description;
    uint256 votesFor;
    uint256 votesAgainst;
    bool executed;
    bool cancelled;
    uint256 createdAt;
    mapping(address => bool) hasVoted;
    mapping(address => bool) votedFor;
}

contract KubernaTreasury is Ownable, ReentrancyGuard {
    uint256 public proposalCount;
    uint256 public immutable QUORUM = 100 ether;
    uint256 public immutable VOTING_PERIOD = 3 days;
    uint256 public proposalId;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;

    event ProposalCreated(uint256, address, uint256, string);
    event VoteCast(uint256, address, bool);
    event ProposalExecuted(uint256);
    event ProposalCancelled(uint256);
    event Deposit(address, uint256);
    event Withdraw(address, uint256);

    constructor() Ownable(msg.sender) {}

    receive() external payable { emit Deposit(msg.sender, msg.value); }

    function deposit(address token, uint256 amount) external payable nonReentrant {
        if (token == address(0)) {
            require(msg.value > 0);
            emit Deposit(msg.sender, msg.value);
        } else {
            require(amount > 0);
            require(IERC20(token).transferFrom(msg.sender, address(this), amount));
            emit Deposit(msg.sender, amount);
        }
    }

    function createProposal(address recipient, address token, uint256 amount, string calldata description)
        external onlyOwner returns (uint256) {
        require(recipient != address(0));
        
        uint256 id = proposalCount++;
        Proposal storage p = proposals[id];
        p.recipient = recipient;
        p.token = token;
        p.amount = amount;
        p.description = description;
        p.createdAt = block.timestamp;
        
        emit ProposalCreated(id, token, amount, description);
        return id;
    }

    function castVote(uint256 id, bool support) external {
        Proposal storage p = proposals[id];
        require(p.createdAt > 0);
        require(block.timestamp < p.createdAt + VOTING_PERIOD);
        require(!p.executed && !p.cancelled);
        require(!p.hasVoted[msg.sender]);

        p.hasVoted[msg.sender] = true;
        p.votedFor[msg.sender] = support;

        if (support) { unchecked { p.votesFor += votingPower[msg.sender]; } }
        else { unchecked { p.votesAgainst += votingPower[msg.sender]; } }

        emit VoteCast(id, msg.sender, support);
    }

    function executeProposal(uint256 id) external nonReentrant {
        Proposal storage p = proposals[id];
        require(p.createdAt > 0);
        require(block.timestamp >= p.createdAt + VOTING_PERIOD);
        require(!p.executed && !p.cancelled);
        require(p.votesFor >= QUORUM);

        p.executed = true;
        
        if (p.token == address(0)) {
            (bool success,) = payable(p.recipient).call{value: p.amount}("");
            require(success);
        } else {
            require(IERC20(p.token).transfer(p.recipient, p.amount));
        }

        emit ProposalExecuted(id);
    }

    function cancelProposal(uint256 id) external onlyOwner {
        Proposal storage p = proposals[id];
        require(p.createdAt > 0);
        require(!p.executed);
        
        p.cancelled = true;
        emit ProposalCancelled(id);
    }

    function setVotingPower(address account, uint256 power) external onlyOwner {
        votingPower[account] = power;
    }

    function getProposal(uint256 id) external view returns (
        address, address, uint256, string memory, uint256, uint256, bool, bool, uint256
    ) {
        Proposal storage p = proposals[id];
        return (
            p.recipient, p.token, p.amount, p.description,
            p.votesFor, p.votesAgainst, p.executed, p.cancelled, p.createdAt
        );
    }

    function hasVotedOnProposal(uint256 id, address voter) external view returns (bool) {
        return proposals[id].hasVoted[voter];
    }

    function didVoteFor(uint256 id, address voter) external view returns (bool) {
        return proposals[id].votedFor[voter];
    }
}
