import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaAgentRegistry } from '../typechain-types';

describe('KubernaAgentRegistry', function () {
  let registry: KubernaAgentRegistry;
  let owner: any;
  let agentOwner: any;
  let other: any;

  beforeEach(async function () {
    [owner, agentOwner, other] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory('KubernaAgentRegistry');
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it('should have correct name and symbol', async function () {
      expect(await registry.name()).to.equal('Kuberna Agent');
      expect(await registry.symbol()).to.equal('KBA');
    });
  });

  describe('registerAgent', function () {
    it('should register an agent successfully', async function () {
      const tools = ['tool1', 'tool2'];

      await expect(
        registry
          .connect(agentOwner)
          .registerAgent(
            agentOwner.address,
            'TradingBot',
            'A trading bot agent',
            'LangChain',
            'GPT-4',
            '{"temperature": 0.7}',
            tools
          )
      ).to.emit(registry, 'AgentRegistered');

      const tokenId = 0;
      const agent = await registry.getAgent(tokenId);
      expect(agent.owner).to.equal(agentOwner.address);
      expect(agent.name).to.equal('TradingBot');
      expect(agent.description).to.equal('A trading bot agent');
      expect(agent.framework).to.equal('LangChain');
      expect(agent.model).to.equal('GPT-4');
      expect(agent.status).to.equal(1); // Registered
    });

    it('should mint NFT to owner', async function () {
      const tools = ['tool1'];

      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      expect(await registry.ownerOf(0)).to.equal(agentOwner.address);
    });

    it('should track agent in ownerAgents mapping', async function () {
      const tools: string[] = [];

      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      const agentIds = await registry.getOwnerAgents(agentOwner.address);
      expect(agentIds.length).to.equal(1);
      expect(agentIds[0]).to.equal(0);
    });

    it('should set ownerHasTool for all tools', async function () {
      const tools = ['swap', 'transfer', 'bridge'];

      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      expect(await registry.hasTool(agentOwner.address, 'swap')).to.equal(true);
      expect(await registry.hasTool(agentOwner.address, 'transfer')).to.equal(true);
      expect(await registry.hasTool(agentOwner.address, 'bridge')).to.equal(true);
      expect(await registry.hasTool(agentOwner.address, 'unknown')).to.equal(false);
    });

    it('should reject duplicate agent names', async function () {
      const tools: string[] = [];

      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'TradingBot',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      await expect(
        registry
          .connect(other)
          .registerAgent(
            other.address,
            'TradingBot',
            'Another trading bot',
            'Framework',
            'Model',
            '{}',
            tools
          )
      ).to.be.reverted;
    });

    it('should increment token IDs', async function () {
      const tools: string[] = [];

      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      await registry
        .connect(other)
        .registerAgent(other.address, 'Agent2', 'Description', 'Framework', 'Model', '{}', tools);

      const agent1 = await registry.getAgent(0);
      const agent2 = await registry.getAgent(1);
      expect(agent1.name).to.equal('Agent1');
      expect(agent2.name).to.equal('Agent2');
    });
  });

  describe('updateAgent', function () {
    let tokenId: bigint;

    beforeEach(async function () {
      const tools: string[] = [];
      const tx = await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Original description',
          'LangChain',
          'GPT-3.5',
          '{"temp": 0.5}',
          tools
        );
      tokenId = 0;
    });

    it('should update agent by owner', async function () {
      await expect(
        registry
          .connect(agentOwner)
          .updateAgent(tokenId, 'Updated description', 'GPT-4', '{"temp": 0.7}')
      ).to.emit(registry, 'AgentUpdated');

      const agent = await registry.getAgent(tokenId);
      expect(agent.description).to.equal('Updated description');
      expect(agent.model).to.equal('GPT-4');
      expect(agent.config).to.equal('{"temp": 0.7}');
    });

    it('should update agent by contract owner', async function () {
      await expect(
        registry.connect(owner).updateAgent(tokenId, 'Updated by contract owner', 'Claude', '{}')
      ).to.emit(registry, 'AgentUpdated');

      const agent = await registry.getAgent(tokenId);
      expect(agent.description).to.equal('Updated by contract owner');
    });

    it('should update lastActive timestamp', async function () {
      const before = await time.latest();
      await registry.connect(agentOwner).updateAgent(tokenId, 'desc', 'model', '{}');

      const agent = await registry.getAgent(tokenId);
      expect(agent.lastActive).to.be.gte(BigInt(before));
    });

    it('should reject update by non-owner', async function () {
      await expect(registry.connect(other).updateAgent(tokenId, 'desc', 'model', '{}')).to.be
        .reverted;
    });
  });

  describe('setStatus', function () {
    let tokenId: bigint;

    beforeEach(async function () {
      const tools: string[] = [];
      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );
      tokenId = 0;
    });

    it('should set status to Active by owner', async function () {
      await expect(registry.connect(agentOwner).setStatus(tokenId, 2)).to.emit(
        registry,
        'AgentStatusChanged'
      );

      const agent = await registry.getAgent(tokenId);
      expect(agent.status).to.equal(2); // Active
    });

    it('should set status to Paused by contract owner', async function () {
      await expect(registry.connect(owner).setStatus(tokenId, 3)).to.emit(
        registry,
        'AgentStatusChanged'
      );

      const agent = await registry.getAgent(tokenId);
      expect(agent.status).to.equal(3); // Paused
    });

    it('should set status to Deprecated', async function () {
      await registry.connect(agentOwner).setStatus(tokenId, 4);

      const agent = await registry.getAgent(tokenId);
      expect(agent.status).to.equal(4); // Deprecated
    });

    it('should reject setStatus by non-owner', async function () {
      await expect(registry.connect(other).setStatus(tokenId, 2)).to.be.reverted;
    });
  });

  describe('addTool', function () {
    let tokenId: bigint;

    beforeEach(async function () {
      const tools = ['tool1', 'tool2'];
      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );
      tokenId = 0;
    });

    it('should add tool to agent', async function () {
      await expect(registry.connect(agentOwner).addTool(tokenId, 'tool3')).to.emit(
        registry,
        'ToolAdded'
      );

      const agent = await registry.getAgent(tokenId);
      expect(agent.tools.length).to.equal(3);
      expect(agent.tools[2]).to.equal('tool3');
    });

    it('should update ownerHasTool when adding tool', async function () {
      await registry.connect(agentOwner).addTool(tokenId, 'newTool');

      expect(await registry.hasTool(agentOwner.address, 'newTool')).to.equal(true);
    });

    it('should reject addTool by non-owner', async function () {
      await expect(registry.connect(other).addTool(tokenId, 'tool3')).to.be.reverted;
    });
  });

  describe('ERC721 functionality', function () {
    it('should support ERC721 interface', async function () {
      const IERC721 = '0x80ac58cd';
      expect(await registry.supportsInterface(IERC721)).to.equal(true);
    });

    it('should support ERC721Metadata interface', async function () {
      const IERC721Metadata = '0x5b5e139f';
      expect(await registry.supportsInterface(IERC721Metadata)).to.equal(true);
    });

    it('should transfer agent NFT', async function () {
      const tools: string[] = [];
      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      await registry.connect(agentOwner).transferFrom(agentOwner.address, other.address, 0);

      expect(await registry.ownerOf(0)).to.equal(other.address);
    });

    it('should not update ownerAgents after transfer (contract limitation)', async function () {
      const tools: string[] = [];
      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );

      await registry.connect(agentOwner).transferFrom(agentOwner.address, other.address, 0);

      const agentOwnerAgents = await registry.getOwnerAgents(agentOwner.address);
      expect(agentOwnerAgents.length).to.equal(1);
      expect(agentOwnerAgents[0]).to.equal(0);
    });
  });

  describe('getter functions', function () {
    beforeEach(async function () {
      const tools: string[] = [];
      await registry
        .connect(agentOwner)
        .registerAgent(
          agentOwner.address,
          'Agent1',
          'Description',
          'Framework',
          'Model',
          '{}',
          tools
        );
    });

    it('should return correct agent data', async function () {
      const agent = await registry.getAgent(0);
      expect(agent.owner).to.equal(agentOwner.address);
      expect(agent.name).to.equal('Agent1');
      expect(agent.status).to.equal(1); // Registered
    });

    it('should return empty array for address with no agents', async function () {
      const agents = await registry.getOwnerAgents(other.address);
      expect(agents.length).to.equal(0);
    });
  });
});
