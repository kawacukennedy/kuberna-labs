import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { ReputationNFT } from '../typechain-types';

describe('ReputationNFT', function () {
  let reputation: ReputationNFT;
  let owner: any;
  let agent: any;
  let user: any;

  beforeEach(async function () {
    [owner, agent, user] = await ethers.getSigners();

    const Reputation = await ethers.getContractFactory('ReputationNFT');
    reputation = await Reputation.deploy();
    await reputation.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await reputation.owner()).to.equal(owner.address);
    });

    it('should have correct name and symbol', async function () {
      expect(await reputation.name()).to.equal('Kuberna Agent Reputation');
      expect(await reputation.symbol()).to.equal('KBR');
    });

    it('should have correct constants', async function () {
      expect(await reputation.MIN_TASKS_FOR_REP()).to.equal(5n);
    });
  });

  describe('registerAgent', function () {
    it('should register an agent successfully', async function () {
      await expect(reputation.connect(user).registerAgent(agent.address)).to.not.be.reverted;

      expect(await reputation.ownerOf(0)).to.equal(agent.address);
    });

    it('should initialize reputation data', async function () {
      await reputation.connect(user).registerAgent(agent.address);

      const rep = await reputation.agentReputations(0);
      expect(rep.totalTasks).to.equal(0);
      expect(rep.successfulTasks).to.equal(0);
      expect(rep.ratingSum).to.equal(0);
      expect(rep.ratingCount).to.equal(0);
    });
  });

  describe('updateReputation', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should update reputation on successful task', async function () {
      await expect(reputation.connect(owner).updateReputation(0, true, 100)).to.emit(
        reputation,
        'ReputationUpdated'
      );

      const rep = await reputation.agentReputations(0);
      expect(rep.totalTasks).to.equal(1);
      expect(rep.successfulTasks).to.equal(1);
      expect(rep.totalResponseTime).to.equal(100);
    });

    it('should update reputation on failed task', async function () {
      await reputation.connect(owner).updateReputation(0, false, 200);

      const rep = await reputation.agentReputations(0);
      expect(rep.totalTasks).to.equal(1);
      expect(rep.successfulTasks).to.equal(0);
    });

    it('should reject update for non-existent token', async function () {
      await expect(reputation.connect(owner).updateReputation(999, true, 100)).to.be.reverted;
    });

    it('should reject update by non-owner', async function () {
      await expect(reputation.connect(user).updateReputation(0, true, 100)).to.be.reverted;
    });

    it('should track response time correctly', async function () {
      await reputation.connect(owner).updateReputation(0, true, 60);
      await reputation.connect(owner).updateReputation(0, true, 120);

      const rep = await reputation.agentReputations(0);
      expect(rep.totalResponseTime).to.equal(180);
    });
  });

  describe('submitRating', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should submit valid rating', async function () {
      await expect(reputation.connect(user).submitRating(0, 5)).to.emit(
        reputation,
        'RatingSubmitted'
      );

      const rep = await reputation.agentReputations(0);
      expect(rep.ratingSum).to.equal(5);
      expect(rep.ratingCount).to.equal(1);
    });

    it('should track rating history', async function () {
      await reputation.connect(user).submitRating(0, 4);
      await reputation.connect(user).submitRating(0, 5);

      const rep = await reputation.agentReputations(0);
      expect(rep.ratingSum).to.equal(9);
      expect(rep.ratingCount).to.equal(2);
    });

    it('should reject rating below 1', async function () {
      await expect(reputation.connect(user).submitRating(0, 0)).to.be.reverted;
    });

    it('should reject rating above 5', async function () {
      await expect(reputation.connect(user).submitRating(0, 6)).to.be.reverted;
    });
  });

  describe('calculateScore', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should return 0 for agent with less than 5 tasks', async function () {
      for (let i = 0; i < 4; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const score = await reputation.calculateScore(0);
      expect(score).to.equal(0);
    });

    it('should calculate score after 5 tasks', async function () {
      for (let i = 0; i < 5; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const score = await reputation.calculateScore(0);
      expect(score).to.be.gt(0);
    });

    it('should factor in success rate', async function () {
      for (let i = 0; i < 5; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const successScore = await reputation.getSuccessRate(0);
      expect(successScore).to.equal(10000); // 100%
    });
  });

  describe('Badges', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should award Elite Solver badge after 100 successful tasks', async function () {
      for (let i = 0; i < 100; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const badges = await reputation.getBadges(0);
      const hasEliteSolver = badges.some((b: any) => b.name === 'Elite Solver');
      expect(hasEliteSolver).to.equal(true);
    });

    it('should award Trusted Agent badge', async function () {
      for (let i = 0; i < 50; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const badges = await reputation.getBadges(0);
      const hasTrustedAgent = badges.some((b: any) => b.name === 'Trusted Agent');
      expect(hasTrustedAgent).to.equal(true);
    });

    it('should award Highly Rated badge', async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(user).submitRating(0, 4 + (i % 2));
      }
      await reputation.connect(owner).updateReputation(0, true, 60);

      const badges = await reputation.getBadges(0);
      const hasHighlyRated = badges.some((b: any) => b.name === 'Highly Rated');
      expect(hasHighlyRated).to.equal(true);
    });
  });

  describe('applyDecay', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should apply decay after inactivity', async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const initialRep = await reputation.agentReputations(0);
      const initialSuccessful = initialRep.successfulTasks;

      await time.increase(31 * 24 * 60 * 60); // 31 days

      await reputation.applyDecay(0);

      const decayedRep = await reputation.agentReputations(0);
      expect(decayedRep.successfulTasks).to.be.lt(initialSuccessful);
    });

    it('should not apply decay if less than 30 days passed', async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(owner).updateReputation(0, true, 60);
      }

      const initialRep = await reputation.agentReputations(0);

      await time.increase(15 * 24 * 60 * 60); // 15 days

      await reputation.applyDecay(0);

      const rep = await reputation.agentReputations(0);
      expect(rep.successfulTasks).to.equal(initialRep.successfulTasks);
    });
  });

  describe('getStarRating', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should return 0 for new agent', async function () {
      const rating = await reputation.getStarRating(0);
      expect(rating).to.equal(0);
    });

    it('should return correct star rating', async function () {
      for (let i = 0; i < 10; i++) {
        await reputation.connect(owner).updateReputation(0, true, 30);
      }
      for (let i = 0; i < 10; i++) {
        await reputation.connect(user).submitRating(0, 5);
      }

      const rating = await reputation.getStarRating(0);
      expect(rating).to.be.gte(1);
    });
  });

  describe('ERC721 functionality', function () {
    beforeEach(async function () {
      await reputation.connect(user).registerAgent(agent.address);
    });

    it('should support ERC721 interface', async function () {
      const IERC721 = '0x80ac58cd';
      expect(await reputation.supportsInterface(IERC721)).to.equal(true);
    });

    it('should transfer NFT', async function () {
      await reputation.connect(agent).transferFrom(agent.address, user.address, 0);
      expect(await reputation.ownerOf(0)).to.equal(user.address);
    });
  });
});
