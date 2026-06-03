export const KNOWN_DEPLOYMENTS: Record<number, { reputationNFT: string; chainName: string }> = {
  // Base Sepolia
  84532: {
    reputationNFT: '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35',
    chainName: 'base-sepolia',
  },
  // Ethereum Sepolia
  11155111: {
    reputationNFT: '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35',
    chainName: 'sepolia',
  },
  // Polygon Amoy
  80002: {
    reputationNFT: '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35',
    chainName: 'polygon-amoy',
  },
  // Arbitrum Sepolia
  421614: {
    reputationNFT: '0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35',
    chainName: 'arbitrum-sepolia',
  },
  // 0G Galileo Testnet
  16602: {
    reputationNFT: '0xb663f2A79Fcc64eD1CB6c6adD7625b443aB1D19C',
    chainName: '0g-galileo',
  },
} as const;

export const DEFAULT_CHAIN_ID = 84532;
export const REPUTATION_NFT_ABI: string[] = [
  'function registerAgent(address agentAddress, string calldata name, string calldata framework, string calldata metadataURI) external returns (uint256)',
  'function updateReputation(uint256 tokenId, bool success, uint256 responseTimeSeconds) external',
  'function calculateScore(uint256 tokenId) external view returns (uint256)',
  'function getSuccessRate(uint256 tokenId) external view returns (uint256)',
  'function getBadges(uint256 tokenId) external view returns (tuple(string name, string description, uint256 timestamp)[])',
  'function getStarRating(uint256 tokenId) external view returns (uint256)',
  'function setAgentMetadataURI(uint256 tokenId, string calldata metadataURI) external',
  'function updateAgentActivity(uint256 tokenId, uint256 earnings) external',
  'function tokenURI(uint256 tokenId) external view returns (string)',
  'function agentIdentities(uint256) external view returns (address agentAddress, string name, string framework, uint256 registeredAt, uint256 lastActiveAt, uint256 totalEarnings, string metadataURI)',
  'function agentReputations(uint256) external view returns (uint256 totalTasks, uint256 successfulTasks, uint256 totalResponseTime, uint256 ratingSum, uint256 ratingCount, uint256 lastUpdated)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];
