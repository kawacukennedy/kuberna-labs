// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error AgentRegistry__Invalid();

enum AgentStatus { None, Registered, Active, Paused, Deprecated }

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

    function registerAgent(
        address owner,
        string calldata name,
        string calldata description,
        string calldata framework,
        string calldata model,
        string calldata config,
        string[] calldata tools
    ) external returns (uint256) {
        require(!agentNames[name]);
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(owner, tokenId);

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

    function updateAgent(uint256 tokenId, string calldata description, string calldata model, string calldata config) external {
        Agent storage a = agents[tokenId];
        require(a.owner == msg.sender || msg.sender == owner());
        a.description = description;
        a.model = model;
        a.config = config;
        a.lastActive = block.timestamp;
        emit AgentUpdated(tokenId);
    }

    function setStatus(uint256 tokenId, AgentStatus status) external {
        Agent storage a = agents[tokenId];
        require(a.owner == msg.sender || msg.sender == owner());
        a.status = status;
        emit AgentStatusChanged(tokenId, status);
    }

    function addTool(uint256 tokenId, string calldata tool) external {
        Agent storage a = agents[tokenId];
        require(a.owner == msg.sender);
        a.tools.push(tool);
        ownerHasTool[a.owner][tool] = true;
        emit ToolAdded(tokenId, tool);
    }

    function getAgent(uint256 tokenId) external view returns (Agent memory) { return agents[tokenId]; }
    function getOwnerAgents(address owner) external view returns (uint256[] memory) { return ownerAgents[owner]; }
    function hasTool(address owner, string calldata tool) external view returns (bool) { return ownerHasTool[owner][tool]; }

    function tokenURI(uint256 tokenId) public view override returns (string memory) { return super.tokenURI(tokenId); }
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) { return super.supportsInterface(interfaceId); }
}
