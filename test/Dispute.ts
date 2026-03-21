import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaDispute } from '../typechain-types';

describe('KubernaDispute', function () {
  let dispute: KubernaDispute;
  let owner: any;
  let requester: any;
  let executor: any;
  let juror1: any;
  let juror2: any;
  let other: any;

  beforeEach(async function () {
    [owner, requester, executor, juror1, juror2, other] = await ethers.getSigners();

    const Dispute = await ethers.getContractFactory('KubernaDispute');
    dispute = await Dispute.deploy();
    await dispute.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await dispute.owner()).to.equal(owner.address);
    });

    it('should have correct constants', async function () {
      expect(await dispute.VOTING_PERIOD()).to.equal(7 * 24 * 60 * 60);
      expect(await dispute.APPEAL_PERIOD()).to.equal(3 * 24 * 60 * 60);
      expect(await dispute.MIN_JUROR_STAKE()).to.equal(ethers.parseEther('100'));
      expect(await dispute.JUROR_REWARD()).to.equal(ethers.parseEther('10'));
    });

    it('should have zero dispute count', async function () {
      expect(await dispute.disputeCount()).to.equal(0);
    });
  });

  describe('registerJuror', function () {
    it('should register a juror successfully', async function () {
      const stakeAmount = ethers.parseEther('100');
      await expect(
        dispute.connect(juror1).registerJuror(juror1.address, { value: stakeAmount })
      ).to.emit(dispute, 'JurorRegistered');

      const juror = await dispute.jurors(juror1.address);
      expect(juror.active).to.equal(true);
      expect(juror.stakedAmount).to.equal(stakeAmount);
    });

    it('should track juror in list', async function () {
      await dispute
        .connect(juror1)
        .registerJuror(juror1.address, { value: ethers.parseEther('100') });

      const jurors = await dispute.getJurors();
      expect(jurors.length).to.equal(1);
      expect(jurors[0]).to.equal(juror1.address);
    });

    it('should reject if stake too low', async function () {
      await expect(
        dispute.connect(juror1).registerJuror(juror1.address, { value: ethers.parseEther('50') })
      ).to.be.reverted;
    });

    it('should reject if already registered', async function () {
      await dispute
        .connect(juror1)
        .registerJuror(juror1.address, { value: ethers.parseEther('100') });

      await expect(
        dispute.connect(juror1).registerJuror(juror1.address, { value: ethers.parseEther('100') })
      ).to.be.reverted;
    });
  });

  describe('openDispute', function () {
    it('should open a dispute successfully', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));

      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'Task not completed');
      const receipt = await tx.wait();

      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      const disputeId = event?.args[0];

      expect(disputeId).to.not.be.undefined;

      const disputeData = await dispute.getDispute(disputeId);
      expect(disputeData.requester).to.equal(requester.address);
      expect(disputeData.executor).to.equal(executor.address);
      expect(disputeData.status).to.equal(1);
    });

    it('should reject if not owner', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));
      await expect(
        dispute.connect(other).openDispute(escrowId, requester.address, executor.address, 'reason')
      ).to.be.reverted;
    });
  });

  describe('submitEvidence', function () {
    let disputeId: string;

    beforeEach(async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      disputeId = event?.args[0];
    });

    it('should submit evidence by requester', async function () {
      await expect(dispute.connect(requester).submitEvidence(disputeId, 'Requester evidence', true))
        .to.not.be.reverted;

      const data = await dispute.getDispute(disputeId);
      expect(data.requesterEvidence).to.equal('Requester evidence');
    });

    it('should submit evidence by executor', async function () {
      await expect(dispute.connect(executor).submitEvidence(disputeId, 'Executor evidence', false))
        .to.not.be.reverted;

      const data = await dispute.getDispute(disputeId);
      expect(data.executorEvidence).to.equal('Executor evidence');
    });

    it('should reject evidence from non-party', async function () {
      await expect(dispute.connect(other).submitEvidence(disputeId, 'Invalid evidence', true)).to.be
        .reverted;
    });

    it('should reject evidence over 1000 characters', async function () {
      const longEvidence = 'a'.repeat(1001);
      await expect(dispute.connect(requester).submitEvidence(disputeId, longEvidence, true)).to.be
        .reverted;
    });
  });

  describe('vote', function () {
    let disputeId: string;

    beforeEach(async function () {
      await dispute
        .connect(juror1)
        .registerJuror(juror1.address, { value: ethers.parseEther('100') });
      await dispute
        .connect(juror2)
        .registerJuror(juror2.address, { value: ethers.parseEther('100') });

      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      disputeId = event?.args[0];
    });

    it('should allow juror to vote for requester', async function () {
      await expect(dispute.connect(juror1).vote(disputeId, 1)).to.emit(dispute, 'VoteCast');

      const data = await dispute.getDispute(disputeId);
      expect(data.requesterVotes).to.equal(1);
    });

    it('should allow juror to vote for executor', async function () {
      await dispute.connect(juror1).vote(disputeId, 1);
      await dispute.connect(juror2).vote(disputeId, 2);

      const data = await dispute.getDispute(disputeId);
      expect(data.executorVotes).to.equal(1);
    });

    it('should reject vote from non-juror', async function () {
      await expect(dispute.connect(other).vote(disputeId, 1)).to.be.reverted;
    });

    it('should reject double voting', async function () {
      await dispute.connect(juror1).vote(disputeId, 1);

      await expect(dispute.connect(juror1).vote(disputeId, 2)).to.be.reverted;
    });

    it('should track vote count', async function () {
      await dispute.connect(juror1).vote(disputeId, 1);
      await dispute.connect(juror2).vote(disputeId, 2);

      const voteCount = await dispute.getVoteCount(disputeId);
      expect(voteCount).to.equal(2);
    });
  });

  describe('resolveDispute', function () {
    let disputeId: string;

    beforeEach(async function () {
      await dispute
        .connect(juror1)
        .registerJuror(juror1.address, { value: ethers.parseEther('100') });

      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      disputeId = event?.args[0];
    });

    it('should resolve with requester winning', async function () {
      await dispute.connect(juror1).vote(disputeId, 1);
      await time.increase(7 * 24 * 60 * 60 + 1);

      await expect(dispute.connect(other).resolveDispute(disputeId)).to.emit(
        dispute,
        'DisputeResolved'
      );

      const data = await dispute.getDispute(disputeId);
      expect(data.status).to.equal(2);
      expect(data.result).to.equal(1);
    });

    it('should resolve with executor winning', async function () {
      await dispute.connect(juror1).vote(disputeId, 2);
      await time.increase(7 * 24 * 60 * 60 + 1);

      await dispute.connect(other).resolveDispute(disputeId);

      const data = await dispute.getDispute(disputeId);
      expect(data.result).to.equal(2);
    });

    it('should reject before voting period ends', async function () {
      await dispute.connect(juror1).vote(disputeId, 1);

      await expect(dispute.connect(other).resolveDispute(disputeId)).to.be.reverted;
    });
  });

  describe('appealDispute', function () {
    let disputeId: string;

    beforeEach(async function () {
      await dispute
        .connect(juror1)
        .registerJuror(juror1.address, { value: ethers.parseEther('100') });

      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-123'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      disputeId = event?.args[0];

      await dispute.connect(juror1).vote(disputeId, 1);
      await time.increase(7 * 24 * 60 * 60 + 1);
      await dispute.connect(other).resolveDispute(disputeId);
    });

    it('should allow appeal by requester', async function () {
      await expect(
        dispute.connect(requester).appealDispute(disputeId, { value: ethers.parseEther('1') })
      ).to.emit(dispute, 'DisputeAppealed');

      const data = await dispute.getDispute(disputeId);
      expect(data.appealed).to.equal(true);
      expect(data.status).to.equal(3);
    });

    it('should reject appeal with insufficient funds', async function () {
      await expect(
        dispute.connect(requester).appealDispute(disputeId, { value: ethers.parseEther('0.5') })
      ).to.be.reverted;
    });

    it('should reject appeal from non-party', async function () {
      await expect(
        dispute.connect(other).appealDispute(disputeId, { value: ethers.parseEther('1') })
      ).to.be.reverted;
    });
  });

  describe('getter functions', function () {
    it('should return correct dispute data', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-789'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      const disputeId = event?.args[0];

      const data = await dispute.getDispute(disputeId);
      expect(data.escrowId).to.equal(escrowId);
      expect(data.requester).to.equal(requester.address);
      expect(data.executor).to.equal(executor.address);
    });

    it('should return zero votes initially', async function () {
      const escrowId = ethers.keccak256(ethers.toUtf8Bytes('escrow-new'));
      const tx = await dispute
        .connect(owner)
        .openDispute(escrowId, requester.address, executor.address, 'reason');
      const receipt = await tx.wait();
      const event = receipt?.logs.find((log: any) => log.fragment?.name === 'DisputeOpened');
      const disputeId = event?.args[0];

      const count = await dispute.getVoteCount(disputeId);
      expect(count).to.equal(0);
    });
  });
});
