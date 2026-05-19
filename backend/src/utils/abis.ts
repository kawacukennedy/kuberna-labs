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

export const PAYMENT_ABI = [
  "function addToken(address token, uint256 minAmount, uint256 maxAmount) external",
  "function removeToken(address token) external",
  "function processPayment(address token, uint256 amount) external payable",
  "function batchProcessPayment(address[] calldata tokens, uint256[] calldata amounts) external payable",
  "function withdraw(address token, uint256 amount) external",
  "function withdrawFees(address token, uint256 amount) external",
  "function getBalance(address user, address token) external view returns (uint256)",
  "function getSupportedTokens() external view returns (address[])",
  "event TokenAdded(address token, uint256 minAmount, uint256 maxAmount)",
  "event TokenRemoved(address token)",
  "event PaymentReceived(address user, address token, uint256 amount)",
  "event Withdrawal(address user, address token, uint256 amount)",
];

export const ATTESTATION_ABI = [
  "function attest(bytes32 schema, address recipient, uint64 expirationTime, bytes memory data) external returns (bytes32)",
  "function attestBySignature(bytes32 schema, address recipient, uint64 expirationTime, bytes memory data, bytes calldata signature) external returns (bytes32)",
  "function revoke(bytes32 attestationId) external",
  "function verify(bytes32 attestationId) external view returns (bool)",
  "function getAttestation(bytes32 attestationId) external view returns (tuple(bytes32 schema, address recipient, address issuer, uint64 expirationTime, uint64 issuedAt, bytes data, bool revoked))",
  "function getIssuerAttestations(address issuer) external view returns (bytes32[])",
  "function getRecipientAttestations(address recipient) external view returns (bytes32[])",
  "event AttestationCreated(bytes32 indexed attestationId, bytes32 indexed schema, address indexed recipient, address issuer, uint64 expirationTime)",
  "event AttestationRevoked(bytes32 indexed attestationId, address indexed revoker)",
];

export const SUBSCRIPTION_ABI = [
  "function createPlan(string calldata name, address token, uint256 price, uint8 planType, uint256 durationSeconds) external returns (uint256)",
  "function subscribe(uint256 planId) external payable",
  "function renew(uint256 planId) external payable",
  "function cancelSubscription(uint256 planId) external",
  "function pauseSubscription(uint256 planId) external",
  "function resumeSubscription(uint256 planId) external",
  "function getSubscription(address user, uint256 planId) external view returns (tuple(address subscriber, uint256 planId, uint256 startTime, uint256 nextPaymentTime, uint256 amountPaid, uint8 status))",
  "function getPlan(uint256 planId) external view returns (tuple(string name, address token, uint256 price, uint8 planType, uint256 durationSeconds, bool active))",
  "function isActive(address user, uint256 planId) external view returns (bool)",
];

export const COURSE_NFT_ABI = [
  "function createCourse(string calldata name, string calldata description, string calldata metadataURI, uint256 price, address paymentToken, uint256 maxStudents, bool hasCertificate, uint256 duration) external returns (uint256)",
  "function updateCourse(uint256 courseId, string calldata name, string calldata description, string calldata metadataURI, uint256 price, uint256 maxStudents) external",
  "function publishCourse(uint256 courseId) external",
  "function enrollStudent(uint256 courseId, address student) external",
  "function grantAccess(uint256 courseId, address student) external",
  "function revokeAccess(uint256 courseId, address student) external",
  "function archiveCourse(uint256 courseId) external",
  "function isEnrolled(uint256 courseId, address student) external view returns (bool)",
  "function getCourse(uint256 courseId) external view returns (tuple(string name, string description, string metadataURI, uint256 price, address paymentToken, uint8 status, uint256 maxStudents, uint256 enrolledCount, bool hasCertificate, uint256 duration))",
  "function getCourseStudents(uint256 courseId) external view returns (address[])",
  "function getUserCourses(address user) external view returns (uint256[])",
];

export const WORKSHOP_ABI = [
  "function createWorkshop(string calldata title, string calldata description, string calldata instructor, uint256 startTime, uint256 duration, uint256 maxParticipants, string calldata streamingUrl) external returns (uint256)",
  "function startWorkshop(uint256 workshopId) external",
  "function endWorkshop(uint256 workshopId) external",
  "function register(uint256 workshopId) external",
  "function cancelWorkshop(uint256 workshopId) external",
  "function setRecordingUrl(uint256 workshopId, string calldata url) external",
  "function markAttendance(uint256 workshopId, address participant) external",
  "function workshops(uint256) external view returns (tuple(string title, string description, string instructor, uint256 startTime, uint256 duration, uint256 maxParticipants, uint256 currentParticipants, string streamingUrl, uint8 status))",
  "function registered(uint256, address) external view returns (bool)",
  "function attended(uint256, address) external view returns (bool)",
  "function participants(uint256, uint256) external view returns (address)",
];

export const DISPUTE_ABI = [
  "function openDispute(bytes32 escrowId, address requester, address executor, string calldata reason, string calldata requesterEvidence) external returns (bytes32)",
  "function submitEvidence(bytes32 disputeId, string calldata evidence) external",
  "function castVote(bytes32 disputeId, uint8 vote) external",
  "function resolveDispute(bytes32 disputeId) external",
  "function appealDispute(bytes32 disputeId) external",
  "function registerJuror() external payable",
  "function claimReward(bytes32 disputeId) external",
  "function disputes(bytes32) external view returns (tuple(bytes32 escrowId, address requester, address executor, string reason, string requesterEvidence, string executorEvidence, uint256 createdAt, uint256 votingEndTime, uint256 requesterVotes, uint256 executorVotes, uint8 status, uint8 result, bool appealed))",
  "function hasVoted(bytes32, address) external view returns (bool)",
];

export const TREASURY_ABI = [
  "function deposit(address token, uint256 amount) external payable",
  "function createProposal(address recipient, address token, uint256 amount, string calldata description) external returns (uint256)",
  "function castVote(uint256 id, bool support) external",
  "function executeProposal(uint256 id) external",
  "function cancelProposal(uint256 id) external",
  "function setVotingPower(address account, uint256 power) external",
  "function getProposal(uint256 id) external view returns (address, address, uint256, string memory, uint256, uint256, bool, bool, uint256)",
  "function hasVotedOnProposal(uint256 id, address voter) external view returns (bool)",
];

export const FEE_MANAGER_ABI = [
  "function setPlatformFee(uint256 fee) external",
  "function addRecipient(address account, uint256 share) external",
  "function removeRecipient(address account) external",
  "function distributeFees(address token, uint256 amount) external",
  "function addTier(uint256 threshold, uint256 percentage) external",
  "function removeTier(uint256 index) external",
  "function getTierFee(uint256 volume) external view returns (uint256)",
  "function getRecipients() external view returns (tuple(address account, uint256 share, bool active)[])",
  "function platformFee() external view returns (uint256)",
];

export const CROSSCHAIN_ROUTER_ABI = [
  "function initiateTransfer(uint256 destinationChainId, address recipient, address token, uint256 amount, uint256 minReceived) external payable",
  "function executeTransfer(bytes32 messageId, address recipient, address token, uint256 amount, uint256 minReceived) external",
  "function setChainSupport(uint256 chainId, bool supported) external",
  "function setBridgeFee(uint256 newFee) external",
  "function setSlippageTolerance(uint256 tolerance) external",
  "function getMinReceived(uint256 amount) external view returns (uint256)",
  "function getMessage(bytes32 messageId) external view returns (tuple(bytes32 messageId, uint256 sourceChainId, uint256 destinationChainId, address sender, address recipient, address token, uint256 amount, bytes data, uint256 nonce, bool executed, uint256 timestamp))",
  "function supportedChains(uint256) external view returns (bool)",
  "function bridgeFee() external view returns (uint256)",
];
