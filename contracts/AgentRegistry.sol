// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

error AgentRegistry__Invalid();
error AgentRegistry__NameTaken(string name);
error AgentRegistry__NotOwner();
error AgentRegistry__OnlyOwnerOrAgentOwner();

enum AgentStatus {
    None,
    Registered,
    Active,
    Paused,
    Deprecated
}

struct Agent {
    address owner;
    string name;
    string description;
    string framework;
    string model;
    string config;
    string[] tools;
    AgentStatus status;
    uint256 registeredAt;
    uint256 lastActive;
}

/**
 * @title KubernaAgentRegistry
 * @dev Registry for AI agent NFTs with on-chain identity, metadata, and tool management.
 */
contract KubernaAgentRegistry is ERC721, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerAgents;
    mapping(string => bool) public agentNames;
    mapping(address => mapping(string => bool)) public ownerHasTool;

    event AgentRegistered(uint256, address, string, string);
    event AgentUpdated(uint256);
    event AgentStatusChanged(uint256, AgentStatus);
    event ToolAdded(uint256, string);

    constructor() ERC721("Kuberna Agent", "KBA") Ownable(msg.sender) {}

    /**
     * @dev Registers a new AI agent as an NFT.
     * @param owner The agent owner address.
     * @param name The unique agent name.
     * @param description The agent description.
     * @param framework The agent framework (e.g., LangChain, AutoGPT).
     * @param model The AI model used by the agent.
     * @param config The agent configuration URI or hash.
     * @param tools The list of tools the agent supports.
     * @return tokenId The minted NFT token ID.
     */
    function registerAgent(
        address owner,
        string calldata name,
        string calldata description,
        string calldata framework,
        string calldata model,
        string calldata config,
        string[] calldata tools
    ) external returns (uint256) {
        if (agentNames[name]) revert AgentRegistry__NameTaken(name);

        uint256 tokenId = _nextTokenId++;
        _mint(owner, tokenId);

        Agent storage a = agents[tokenId];
        a.owner = owner;
        a.name = name;
        a.description = description;
        a.framework = framework;
        a.model = model;
        a.config = config;
        a.tools = tools;
        a.status = AgentStatus.Registered;
        a.registeredAt = block.timestamp;
        a.lastActive = block.timestamp;

        agentNames[name] = true;
        ownerAgents[owner].push(tokenId);

        for (uint256 i = 0; i < tools.length; i++) {
            ownerHasTool[owner][tools[i]] = true;
        }

        emit AgentRegistered(tokenId, owner, name, framework);
        return tokenId;
    }

    /**
     * @dev Updates agent metadata.
     * @param tokenId The agent token ID.
     * @param description The updated description.
     * @param model The updated AI model.
     * @param config The updated configuration.
     */
    function updateAgent(
        uint256 tokenId,
        string calldata description,
        string calldata model,
        string calldata config
    ) external {
        Agent storage a = agents[tokenId];
        if (a.owner != msg.sender && msg.sender != owner()) revert AgentRegistry__OnlyOwnerOrAgentOwner();
        a.description = description;
        a.model = model;
        a.config = config;
        a.lastActive = block.timestamp;
        emit AgentUpdated(tokenId);
    }

    /**
     * @dev Updates the status of an agent.
     * @param tokenId The agent token ID.
     * @param status The new agent status.
     */
    function setStatus(uint256 tokenId, AgentStatus status) external {
        Agent storage a = agents[tokenId];
        if (a.owner != msg.sender && msg.sender != owner()) revert AgentRegistry__OnlyOwnerOrAgentOwner();
        a.status = status;
        emit AgentStatusChanged(tokenId, status);
    }

    /**
     * @dev Adds a tool to an agent's toolkit.
     * @param tokenId The agent token ID.
     * @param tool The tool name to add.
     */
    function addTool(uint256 tokenId, string calldata tool) external {
        Agent storage a = agents[tokenId];
        if (a.owner != msg.sender) revert AgentRegistry__NotOwner();
        a.tools.push(tool);
        ownerHasTool[a.owner][tool] = true;
        emit ToolAdded(tokenId, tool);
    }

    /**
     * @dev Gets agent details by token ID.
     * @param tokenId The agent token ID.
     * @return The agent struct with full metadata.
     */
    function getAgent(uint256 tokenId) external view returns (Agent memory) {
        return agents[tokenId];
    }

    /**
     * @dev Gets all agent token IDs owned by an address.
     * @param owner The owner address.
     * @return Array of token IDs belonging to the owner.
     */
    function getOwnerAgents(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }

    /**
     * @dev Checks if an owner has registered a specific tool.
     * @param owner The owner address.
     * @param tool The tool name.
     * @return True if the owner has the tool, false otherwise.
     */
    function hasTool(address owner, string calldata tool) external view returns (bool) {
        return ownerHasTool[owner][tool];
    }

    /**
     * @dev Returns the token URI for an agent NFT.
     * @param tokenId The agent token ID.
     * @return The token URI string.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Checks interface support.
     * @param interfaceId The interface identifier.
     * @return True if the interface is supported.
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
