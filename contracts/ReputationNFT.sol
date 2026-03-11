// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error ReputationNFT__InvalidToken();
error ReputationNFT__OnlyMinter();
error ReputationNFT__NotAuthorized();

contract ReputationNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => AgentReputation) public agentReputations;
    mapping(uint256 => Badge[]) public agentBadges;
    mapping(uint256 => uint256[]) public agentRatingHistory;
    mapping(uint256 => mapping(bytes32 => bool)) public hasBadge;

    uint256 public immutable MIN_TASKS_FOR_REP = 5;
    uint256 public constant DECAY_PERIOD = 30 days;
    uint256 public constant DECAY_RATE_BPS = 1000; // 10% decay per period

    struct AgentReputation {
        uint256 totalTasks;
        uint256 successfulTasks;
        uint256 totalResponseTime;
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 lastUpdated;
    }

    struct Badge {
        string name;
        string description;
        uint256 timestamp;
    }

    event ReputationUpdated(uint256, uint256, uint256, uint256);
    event BadgeEarned(uint256, string, string);
    event RatingSubmitted(uint256, uint256, string);
    event ReputationDecayed(uint256 indexed tokenId, uint256 periodsDecayed, uint256 newScore);

    constructor() ERC721("Kuberna Agent Reputation", "KBR") Ownable(msg.sender) {}

    function registerAgent(address agentAddress) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(agentAddress, tokenId);
        agentReputations[tokenId] = AgentReputation(0, 0, 0, 0, 0, block.timestamp);
        return tokenId;
    }

    function updateReputation(uint256 tokenId, bool success, uint256 responseTimeSeconds) external onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert ReputationNFT__InvalidToken();
        
        AgentReputation storage rep = agentReputations[tokenId];
        
        unchecked { rep.totalTasks++; }
        if (success) { unchecked { rep.successfulTasks++; } }
        unchecked { rep.totalResponseTime += responseTimeSeconds; }
        rep.lastUpdated = block.timestamp;

        _checkAndAwardBadges(tokenId);

        emit ReputationUpdated(tokenId, calculateScore(tokenId), rep.totalTasks, getSuccessRate(tokenId));
    }

    function submitRating(uint256 tokenId, uint256 rating) external {
        require(rating >= 1 && rating <= 5);
        require(ownerOf(tokenId) != address(0));
        
        AgentReputation storage rep = agentReputations[tokenId];
        unchecked { 
            rep.ratingSum += rating;
            rep.ratingCount++;
        }
        rep.lastUpdated = block.timestamp;
        agentRatingHistory[tokenId].push(rating);

        emit RatingSubmitted(tokenId, rating, "");
    }

    function calculateScore(uint256 tokenId) public view returns (uint256) {
        AgentReputation memory rep = agentReputations[tokenId];
        if (rep.totalTasks < MIN_TASKS_FOR_REP) return 0;

        uint256 successScore = getSuccessRate(tokenId);
        uint256 avgResponseTime = rep.totalTasks > 0 ? rep.totalResponseTime / rep.totalTasks : 0;
        uint256 responseScore = _calculateResponseScore(avgResponseTime);
        uint256 ratingScore = rep.ratingCount > 0 ? (rep.ratingSum * 100) / (rep.ratingCount * 5) : 0;

        return (successScore * 500 + responseScore * 200 + ratingScore * 300) / 1000;
    }

    function getSuccessRate(uint256 tokenId) public view returns (uint256) {
        AgentReputation memory rep = agentReputations[tokenId];
        if (rep.totalTasks == 0) return 0;
        return (rep.successfulTasks * 10000) / rep.totalTasks;
    }

    function _calculateResponseScore(uint256 avgResponseTime) internal pure returns (uint256) {
        if (avgResponseTime <= 60) return 1000;
        if (avgResponseTime <= 300) return 800;
        if (avgResponseTime <= 600) return 600;
        if (avgResponseTime <= 1800) return 400;
        return 100;
    }

    function _checkAndAwardBadges(uint256 tokenId) internal {
        AgentReputation memory rep = agentReputations[tokenId];
        
        if (rep.totalTasks >= 100 && rep.successfulTasks >= 95) {
            bytes32 h = keccak256("Elite Solver");
            if (!hasBadge[tokenId][h]) { hasBadge[tokenId][h] = true; _awardBadge(tokenId, "Elite Solver"); }
        }
        
        if (rep.totalTasks >= 50 && getSuccessRate(tokenId) >= 9800) {
            bytes32 h = keccak256("Trusted Agent");
            if (!hasBadge[tokenId][h]) { hasBadge[tokenId][h] = true; _awardBadge(tokenId, "Trusted Agent"); }
        }

        if (rep.ratingCount >= 10) {
            if (rep.ratingSum / rep.ratingCount >= 4) {
                bytes32 h = keccak256("Highly Rated");
                if (!hasBadge[tokenId][h]) { hasBadge[tokenId][h] = true; _awardBadge(tokenId, "Highly Rated"); }
            }
        }
    }

    function _awardBadge(uint256 tokenId, string memory name) internal {
        agentBadges[tokenId].push(Badge(name, "", block.timestamp));
        emit BadgeEarned(tokenId, name, "");
    }

    function getBadges(uint256 tokenId) external view returns (Badge[] memory) { return agentBadges[tokenId]; }

    /**
     * @dev Apply reputation decay for inactive agents.
     * Reduces successfulTasks by DECAY_RATE_BPS for each DECAY_PERIOD of inactivity.
     */
    function applyDecay(uint256 tokenId) external {
        require(ownerOf(tokenId) != address(0));
        AgentReputation storage rep = agentReputations[tokenId];
        require(rep.totalTasks > 0, "No tasks to decay");

        uint256 elapsed = block.timestamp - rep.lastUpdated;
        if (elapsed < DECAY_PERIOD) return;

        uint256 periods = elapsed / DECAY_PERIOD;
        uint256 decayAmount = 0;

        for (uint256 i = 0; i < periods; i++) {
            uint256 reduction = (rep.successfulTasks * DECAY_RATE_BPS) / 10000;
            if (reduction == 0) break;
            decayAmount += reduction;
            rep.successfulTasks -= reduction;
        }

        rep.lastUpdated = block.timestamp;
        emit ReputationDecayed(tokenId, periods, calculateScore(tokenId));
    }

    /**
     * @dev Returns the star rating (1-5) based on the reputation score.
     * Spec: "Star rating (1-5) and percentile rank."
     */
    function getStarRating(uint256 tokenId) external view returns (uint256) {
        uint256 score = calculateScore(tokenId);
        if (score == 0) return 0; // Not enough tasks
        if (score >= 900) return 5;
        if (score >= 700) return 4;
        if (score >= 500) return 3;
        if (score >= 300) return 2;
        return 1;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
