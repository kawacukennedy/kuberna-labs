export const ESCROW_ABI = [
  "function createEscrow(string calldata intentId, address token, uint256 amount, uint256 durationSeconds) external returns (bytes32)",
  "function fundEscrow(bytes32 escrowId) external payable",
  "function assignExecutor(bytes32 escrowId, address executor) external",
  "function submitCompletion(bytes32 escrowId, bytes32 proofHash) external",
  "function releaseFunds(bytes32 escrowId) external",
  "function raiseDispute(bytes32 escrowId, string calldata reason) external",
  "function getEscrow(bytes32 escrowId) external view returns (tuple(address requester, address executor, address token, uint256 deadline, uint256 amount, uint256 fee, uint8 status, string intentId))",
  "function escrows(bytes32) external view returns (address, address, address, uint256, uint256, uint256, uint8, string)",
];

export const INTENT_ABI = [
  "function createIntent(bytes32 intentId, string calldata description, bytes calldata structuredData, address sourceToken, uint256 sourceAmount, address destToken, uint256 minDestAmount, uint256 budget, uint256 durationSeconds) external returns (bytes32)",
  "function submitBid(bytes32 intentId, uint256 price, uint256 estimatedTime, bytes calldata routeDetails) external",
  "function acceptBid(bytes32 intentId, uint256 solverIndex) external",
  "function completeIntent(bytes32 intentId) external",
  "function intents(bytes32) external view returns (address, string, bytes, address, uint256, address, uint256, uint256, uint8, address, bytes32)",
  "function bids(bytes32, uint256) external view returns (address, uint256, uint256, bytes, uint8, uint256)",
];

export const AGENT_REGISTRY_ABI = [
  "function registerAgent(address owner, string calldata name, string calldata description, string calldata framework, string calldata model, string calldata config, string[] calldata tools) external returns (uint256)",
  "function updateAgent(uint256 tokenId, string calldata description, string calldata model, string calldata config) external",
  "function setStatus(uint256 tokenId, uint8 status) external",
  "function getAgent(uint256 tokenId) external view returns (tuple(address owner, string name, string description, string framework, string model, string config, string[] tools, uint8 status, uint256 registeredAt, uint256 lastActive))",
  "function getOwnerAgents(address owner) external view returns (uint256[])",
];

export const CERTIFICATE_ABI = [
  "function mintCertificate(address recipient, string calldata recipientName, string calldata courseTitle, string calldata courseId, string calldata instructorName, string calldata verificationHash) external returns (uint256)",
  "function verifyCertificate(uint256 tokenId) external view returns (bool)",
  "function certificateData(uint256) external view returns (string, string, string, uint256, string, string, bool)",
];

export const REPUTATION_ABI = [
  "function registerAgent(address agentAddress) external returns (uint256)",
  "function updateReputation(uint256 tokenId, bool success, uint256 responseTimeSeconds) external",
  "function calculateScore(uint256 tokenId) external view returns (uint256)",
  "function getSuccessRate(uint256 tokenId) external view returns (uint256)",
  "function agentReputations(uint256) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
];
