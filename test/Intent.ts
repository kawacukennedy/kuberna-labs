import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaIntent } from '../typechain-types';

function getIntentId(description: string, requester: string): string {
  return ethers.keccak256(ethers.solidityPacked(['string', 'address'], [description, requester]));
}

describe('KubernaIntent', function () {
  let intent: KubernaIntent;
  let owner: any;
  let requester: any;
  let solver1: any;
  let solver2: any;
  let other: any;

  beforeEach(async function () {
    [owner, requester, solver1, solver2, other] = await ethers.getSigners();

    const Intent = await ethers.getContractFactory('KubernaIntent');
    intent = await Intent.deploy();
    await intent.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await intent.owner()).to.equal(owner.address);
    });

    it('should have correct intent count', async function () {
      expect(await intent.intentCount()).to.equal(0);
    });

    it('should have correct MIN_DEADLINE', async function () {
      expect(await intent.MIN_DEADLINE()).to.equal(300);
    });

    it('should have correct MAX_DEADLINE', async function () {
      expect(await intent.MAX_DEADLINE()).to.equal(2592000);
    });

    it('should not be paused', async function () {
      expect(await intent.paused()).to.equal(false);
    });
  });

  describe('createIntent', function () {
    it('should create an intent successfully', async function () {
      const intentId = getIntentId('Swap 1 ETH for USDC', requester.address);
      const budget = ethers.parseEther('1');
      const duration = 3600;

      await expect(
        intent
          .connect(requester)
          .createIntent(
            intentId,
            'Swap 1 ETH for USDC',
            '0x',
            ethers.ZeroAddress,
            ethers.parseEther('1'),
            ethers.ZeroAddress,
            0,
            budget,
            duration
          )
      ).to.emit(intent, 'IntentCreated');

      const intentData = await intent.getIntent(intentId);
      expect(intentData.requester).to.equal(requester.address);
      expect(intentData.budget).to.equal(budget);
      expect(intentData.status).to.equal(0); // Open
    });

    it('should increment intent count', async function () {
      const intentId = getIntentId('First intent', requester.address);

      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'First intent',
          '0x',
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress,
          0,
          ethers.parseEther('1'),
          3600
        );

      expect(await intent.intentCount()).to.equal(1);
    });

    it('should reject zero budget', async function () {
      const intentId = getIntentId('Zero budget', requester.address);

      await expect(
        intent
          .connect(requester)
          .createIntent(
            intentId,
            'Zero budget',
            '0x',
            ethers.ZeroAddress,
            0,
            ethers.ZeroAddress,
            0,
            0,
            3600
          )
      ).to.be.reverted;
    });

    it('should reject duration below minimum', async function () {
      const intentId = getIntentId('Short duration', requester.address);

      await expect(
        intent
          .connect(requester)
          .createIntent(
            intentId,
            'Short duration',
            '0x',
            ethers.ZeroAddress,
            0,
            ethers.ZeroAddress,
            0,
            ethers.parseEther('1'),
            100
          )
      ).to.be.reverted;
    });

    it('should reject duplicate intent ID', async function () {
      const intentId = getIntentId('Duplicate', requester.address);

      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'First intent',
          '0x',
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress,
          0,
          ethers.parseEther('1'),
          3600
        );

      await expect(
        intent
          .connect(requester)
          .createIntent(
            intentId,
            'Duplicate intent',
            '0x',
            ethers.ZeroAddress,
            0,
            ethers.ZeroAddress,
            0,
            ethers.parseEther('1'),
            3600
          )
      ).to.be.reverted;
    });
  });

  describe('submitBid', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
    });

    it('should submit a bid successfully', async function () {
      await expect(
        intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x')
      ).to.emit(intent, 'BidSubmitted');

      const bidCount = await intent.getBidCount(intentId);
      expect(bidCount).to.equal(1);
    });

    it('should change status to Bidding after first bid', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(1); // Bidding
    });

    it('should allow multiple solvers to bid', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
      await intent.connect(solver2).submitBid(intentId, ethers.parseEther('0.04'), 3600, '0x');

      const bidCount = await intent.getBidCount(intentId);
      expect(bidCount).to.equal(2);
    });

    it('should reject duplicate bid from same solver', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');

      await expect(
        intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.06'), 1800, '0x')
      ).to.be.reverted;
    });

    it('should reject bid after deadline', async function () {
      await time.increase(duration + 1);

      await expect(
        intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x')
      ).to.be.reverted;
    });

    it('should reject bid on non-existent intent', async function () {
      const fakeId = ethers.keccak256(ethers.toUtf8Bytes('fake'));

      await expect(intent.connect(solver1).submitBid(fakeId, ethers.parseEther('0.05'), 1800, '0x'))
        .to.be.reverted;
    });
  });

  describe('acceptBid', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
    });

    it('should accept a bid and assign solver', async function () {
      await expect(intent.connect(requester).acceptBid(intentId, 0)).to.emit(intent, 'BidAccepted');

      const intentData = await intent.getIntent(intentId);
      expect(intentData.selectedSolver).to.equal(solver1.address);
      expect(intentData.status).to.equal(2); // Assigned
    });

    it('should reject other pending bids after acceptance', async function () {
      await intent.connect(solver2).submitBid(intentId, ethers.parseEther('0.04'), 3600, '0x');
      await intent.connect(requester).acceptBid(intentId, 0);

      const bid1 = await intent.getBid(intentId, 0);
      const bid2 = await intent.getBid(intentId, 1);
      expect(bid1.status).to.equal(1); // Accepted
      expect(bid2.status).to.equal(2); // Rejected
    });

    it('should reject if not requester', async function () {
      await expect(intent.connect(other).acceptBid(intentId, 0)).to.be.reverted;
    });

    it('should reject if intent not in Bidding status', async function () {
      const newIntentId = getIntentId('New intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          newIntentId,
          'New intent',
          '0x',
          ethers.ZeroAddress,
          0,
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );

      await expect(intent.connect(requester).acceptBid(newIntentId, 0)).to.be.reverted;
    });
  });

  describe('rejectBid', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
    });

    it('should reject a bid', async function () {
      await expect(intent.connect(requester).rejectBid(intentId, 0)).to.emit(intent, 'BidRejected');

      const bid = await intent.getBid(intentId, 0);
      expect(bid.status).to.equal(2); // Rejected
    });

    it('should reject if not requester', async function () {
      await expect(intent.connect(other).rejectBid(intentId, 0)).to.be.reverted;
    });
  });

  describe('retractBid', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
    });

    it('should allow solver to retract bid', async function () {
      await expect(intent.connect(solver1).retractBid(intentId)).to.emit(intent, 'BidRetracted');

      const bid = await intent.getBid(intentId, 0);
      expect(bid.status).to.equal(2); // Rejected
    });

    it('should reject if no bid found', async function () {
      await expect(intent.connect(solver2).retractBid(intentId)).to.be.reverted;
    });

    it('should reject if bid already accepted', async function () {
      await intent.connect(requester).acceptBid(intentId, 0);

      await expect(intent.connect(solver1).retractBid(intentId)).to.be.reverted;
    });
  });

  describe('cancelIntent', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
    });

    it('should cancel open intent', async function () {
      await expect(intent.connect(requester).cancelIntent(intentId)).to.emit(
        intent,
        'IntentCancelled'
      );

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(5); // Expired
    });

    it('should cancel intent in bidding phase', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');

      await expect(intent.connect(requester).cancelIntent(intentId)).to.emit(
        intent,
        'IntentCancelled'
      );

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(5); // Expired
    });

    it('should reject if not requester', async function () {
      await expect(intent.connect(other).cancelIntent(intentId)).to.be.reverted;
    });

    it('should reject if intent already assigned', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
      await intent.connect(requester).acceptBid(intentId, 0);

      await expect(intent.connect(requester).cancelIntent(intentId)).to.be.reverted;
    });
  });

  describe('setEscrow', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
      await intent.connect(requester).acceptBid(intentId, 0);
    });

    it('should set escrow and change status to Executing', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow'));
      await intent.connect(solver1).setEscrow(intentId, escrowId);

      const intentData = await intent.getIntent(intentId);
      expect(intentData.escrowId).to.equal(escrowId);
      expect(intentData.status).to.equal(3); // Executing
    });

    it('should allow requester to set escrow', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow'));
      await intent.connect(requester).setEscrow(intentId, escrowId);

      const intentData = await intent.getIntent(intentId);
      expect(intentData.escrowId).to.equal(escrowId);
    });
  });

  describe('completeIntent', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
      await intent.connect(requester).acceptBid(intentId, 0);
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow'));
      await intent.connect(solver1).setEscrow(intentId, escrowId);
    });

    it('should complete intent by solver', async function () {
      await expect(intent.connect(solver1).completeIntent(intentId)).to.emit(
        intent,
        'IntentCompleted'
      );

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(4); // Completed
    });

    it('should complete intent by requester', async function () {
      await expect(intent.connect(requester).completeIntent(intentId)).to.emit(
        intent,
        'IntentCompleted'
      );

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(4); // Completed
    });

    it('should reject if not party', async function () {
      await expect(intent.connect(other).completeIntent(intentId)).to.be.reverted;
    });

    it('should reject if not in Executing status', async function () {
      await intent.connect(solver1).completeIntent(intentId);

      await expect(intent.connect(solver1).completeIntent(intentId)).to.be.reverted;
    });
  });

  describe('expireIntent', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
    });

    it('should expire intent after deadline', async function () {
      await time.increase(duration + 1);

      await expect(intent.connect(other).expireIntent(intentId)).to.emit(intent, 'IntentExpired');

      const intentData = await intent.getIntent(intentId);
      expect(intentData.status).to.equal(5); // Expired
    });

    it('should reject before deadline', async function () {
      await expect(intent.connect(other).expireIntent(intentId)).to.be.reverted;
    });

    it('should expire intent with bids', async function () {
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
      await time.increase(duration + 1);

      await expect(intent.connect(other).expireIntent(intentId)).to.emit(intent, 'IntentExpired');
    });
  });

  describe('pause/unpause', function () {
    it('should pause by owner', async function () {
      await intent.connect(owner).pause();
      expect(await intent.paused()).to.equal(true);
    });

    it('should unpause by owner', async function () {
      await intent.connect(owner).pause();
      await intent.connect(owner).unpause();
      expect(await intent.paused()).to.equal(false);
    });

    it('should reject pause by non-owner', async function () {
      await expect(intent.connect(requester).pause()).to.be.reverted;
    });
  });

  describe('getter functions', function () {
    let intentId: string;
    const budget = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      intentId = getIntentId('Test intent', requester.address);
      await intent
        .connect(requester)
        .createIntent(
          intentId,
          'Test intent',
          '0x',
          ethers.ZeroAddress,
          ethers.parseEther('1'),
          ethers.ZeroAddress,
          0,
          budget,
          duration
        );
      await intent.connect(solver1).submitBid(intentId, ethers.parseEther('0.05'), 1800, '0x');
    });

    it('should return correct bid count', async function () {
      expect(await intent.getBidCount(intentId)).to.equal(1);
    });

    it('should return correct bid data', async function () {
      const bid = await intent.getBid(intentId, 0);
      expect(bid.solver).to.equal(solver1.address);
      expect(bid.price).to.equal(ethers.parseEther('0.05'));
      expect(bid.status).to.equal(0); // Pending
    });

    it('should return solver intents', async function () {
      const intents = await intent.getSolverIntents(solver1.address);
      expect(intents.length).to.equal(1);
      expect(intents[0]).to.equal(intentId);
    });
  });
});
