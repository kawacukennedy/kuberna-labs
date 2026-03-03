// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => AgentReputation) public agentReputations;
    mapping(uint256 => Badge[]) public agentBadges;
    mapping(uint256 => uint256[]) public agentRatingHistory;
    mapping(uint256 => mapping(bytes32 => bool)) public hasBadge;

    uint256 public immutable MIN_TASKS_FOR_REP = 5;

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

    constructor() ERC721("Kuberna Agent Reputation", "KBR") Ownable(msg.sender) {}

    function registerAgent(address agentAddress) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(agentAddress, tokenId);
        agentReputations[tokenId] = AgentReputation(0, 0, 0, 0, 0, block.timestamp);
        return tokenId;
    }

    function updateReputation(uint256 tokenId, bool success, uint256 responseTimeSeconds) external onlyOwner {
        require(ownerOf(tokenId) != address(0));
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

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
