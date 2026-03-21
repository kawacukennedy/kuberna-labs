import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaEscrow, MockERC20 } from '../typechain-types';

function getEscrowId(intentId: string, requester: string, timestamp: bigint): string {
  return ethers.keccak256(
    ethers.solidityPacked(['string', 'address', 'uint256'], [intentId, requester, timestamp])
  );
}

describe('KubernaEscrow', function () {
  let escrow: KubernaEscrow;
  let mockToken: MockERC20;
  let owner: any;
  let requester: any;
  let executor: any;
  let other: any;

  beforeEach(async function () {
    [owner, requester, executor, other] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory('KubernaEscrow');
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    const MockToken = await ethers.getContractFactory('MockERC20');
    mockToken = await MockToken.deploy(18);
    await mockToken.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it('should have correct fee basis points', async function () {
      expect(await escrow.FEE_BASIS_POINTS()).to.equal(250n);
    });

    it('should have correct minimum deadline', async function () {
      expect(await escrow.MIN_DEADLINE()).to.equal(300n);
    });

    it('should have correct auto release delay', async function () {
      expect(await escrow.AUTO_RELEASE_DELAY()).to.equal(86400n);
    });

    it('should not be paused', async function () {
      expect(await escrow.paused()).to.equal(false);
    });
  });

  describe('createEscrow', function () {
    it('should create an escrow with ETH', async function () {
      const amount = ethers.parseEther('1');
      const duration = 3600;

      const timestamp = await time.latest();
      const tx = await escrow
        .connect(requester)
        .createEscrow('intent-123', ethers.ZeroAddress, amount, duration);
      await tx.wait();

      const escrowId = getEscrowId('intent-123', requester.address, BigInt(timestamp + 1));
      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.requester).to.equal(requester.address);
      expect(escrowData.amount).to.equal(amount);
      expect(escrowData.status).to.equal(0);
    });

    it('should create an escrow with ERC20', async function () {
      const amount = ethers.parseEther('100');
      const duration = 3600;

      const timestamp = await time.latest();
      const tx = await escrow
        .connect(requester)
        .createEscrow('intent-456', await mockToken.getAddress(), amount, duration);
      await tx.wait();

      const escrowId = getEscrowId('intent-456', requester.address, BigInt(timestamp + 1));
      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.requester).to.equal(requester.address);
      expect(escrowData.token).to.equal(await mockToken.getAddress());
    });

    it('should reject zero amount', async function () {
      await expect(
        escrow.connect(requester).createEscrow('intent-789', ethers.ZeroAddress, 0, 3600)
      ).to.be.revertedWith('Amount must be greater than zero');
    });

    it('should reject duration below minimum', async function () {
      await expect(
        escrow
          .connect(requester)
          .createEscrow('intent-abc', ethers.ZeroAddress, ethers.parseEther('1'), 100)
      ).to.be.revertedWith('Duration below minimum deadline');
    });

    it('should calculate fee correctly (2.5%)', async function () {
      const amount = ethers.parseEther('100');
      const duration = 3600;

      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-fee', ethers.ZeroAddress, amount, duration);

      const escrowId = getEscrowId('intent-fee', requester.address, BigInt(timestamp + 1));
      const escrowData = await escrow.escrows(escrowId);
      const expectedFee = (amount * 250n) / 10000n;
      expect(escrowData.fee).to.equal(expectedFee);
    });

    it('should emit EscrowCreated event', async function () {
      const amount = ethers.parseEther('1');
      const duration = 3600;

      await expect(
        escrow.connect(requester).createEscrow('intent-event', ethers.ZeroAddress, amount, duration)
      ).to.emit(escrow, 'EscrowCreated');
    });
  });

  describe('fundEscrow', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-fund', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-fund', requester.address, BigInt(timestamp + 1));
    });

    it('should fund escrow with ETH', async function () {
      const fee = (amount * 250n) / 10000n;
      const totalRequired = amount + fee;

      await escrow.connect(requester).fundEscrow(escrowId, { value: totalRequired });

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(1);
    });

    it('should fund escrow with ERC20', async function () {
      const timestamp = await time.latest();
      const erc20Amount = ethers.parseEther('100');
      const erc20Duration = 3600;

      await escrow
        .connect(requester)
        .createEscrow(
          'intent-fund-erc20',
          await mockToken.getAddress(),
          erc20Amount,
          erc20Duration
        );
      const erc20EscrowId = getEscrowId(
        'intent-fund-erc20',
        requester.address,
        BigInt(timestamp + 1)
      );

      const fee = (erc20Amount * 250n) / 10000n;
      const totalRequired = erc20Amount + fee;

      await mockToken.mint(requester.address, totalRequired);
      await mockToken.connect(requester).approve(escrow.getAddress(), totalRequired);

      await escrow.connect(requester).fundEscrow(erc20EscrowId);

      const escrowData = await escrow.escrows(erc20EscrowId);
      expect(escrowData.status).to.equal(1);
    });

    it('should reject if insufficient ETH', async function () {
      const fee = (amount * 250n) / 10000n;

      await expect(
        escrow.connect(requester).fundEscrow(escrowId, { value: fee })
      ).to.be.revertedWith('Insufficient ETH sent');
    });

    it('should reject if already funded', async function () {
      const fee = (amount * 250n) / 10000n;
      const totalRequired = amount + fee;

      await escrow.connect(requester).fundEscrow(escrowId, { value: totalRequired });

      await expect(
        escrow.connect(requester).fundEscrow(escrowId, { value: totalRequired })
      ).to.be.revertedWith('Escrow already funded');
    });

    it('should reject non-existent escrow', async function () {
      await expect(
        escrow.connect(requester).fundEscrow(ethers.ZeroHash, { value: amount })
      ).to.be.revertedWith('Escrow does not exist');
    });

    it('should emit EscrowFunded event', async function () {
      const fee = (amount * 250n) / 10000n;
      const totalRequired = amount + fee;

      await expect(
        escrow.connect(requester).fundEscrow(escrowId, { value: totalRequired })
      ).to.emit(escrow, 'EscrowFunded');
    });
  });

  describe('assignExecutor', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-assign', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-assign', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      const totalRequired = amount + fee;
      await escrow.connect(requester).fundEscrow(escrowId, { value: totalRequired });
    });

    it('should assign executor', async function () {
      await expect(escrow.connect(requester).assignExecutor(escrowId, executor.address)).to.emit(
        escrow,
        'EscrowAssigned'
      );

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.executor).to.equal(executor.address);
      expect(escrowData.status).to.equal(2);
    });

    it('should reject if not requester', async function () {
      await expect(escrow.connect(other).assignExecutor(escrowId, executor.address)).to.be.reverted;
    });

    it('should reject invalid executor address', async function () {
      await expect(
        escrow.connect(requester).assignExecutor(escrowId, ethers.ZeroAddress)
      ).to.be.revertedWith('Invalid executor address');
    });

    it('should reject if not funded', async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-unfunded', ethers.ZeroAddress, amount, duration);
      const unfundedEscrowId = getEscrowId(
        'intent-unfunded',
        requester.address,
        BigInt(timestamp + 1)
      );

      await expect(escrow.connect(requester).assignExecutor(unfundedEscrowId, executor.address)).to
        .be.reverted;
    });
  });

  describe('submitCompletion', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-complete', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-complete', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(escrowId, executor.address);
    });

    it('should submit completion by executor', async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes('proof'));

      await expect(escrow.connect(executor).submitCompletion(escrowId, proofHash)).to.emit(
        escrow,
        'TaskCompleted'
      );

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(3);
    });

    it('should reject if not executor', async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes('proof'));

      await expect(escrow.connect(other).submitCompletion(escrowId, proofHash)).to.be.revertedWith(
        'Not assigned executor'
      );
    });

    it('should reject if deadline passed', async function () {
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes('proof'));

      await time.increase(duration + 1);

      await expect(
        escrow.connect(executor).submitCompletion(escrowId, proofHash)
      ).to.be.revertedWith('Task deadline passed');
    });
  });

  describe('releaseFunds', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-release', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-release', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(escrowId, executor.address);
      await escrow.connect(executor).submitCompletion(escrowId, ethers.ZeroHash);
    });

    it('should release funds to executor', async function () {
      const fee = (amount * 250n) / 10000n;

      await escrow.connect(requester).releaseFunds(escrowId);

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(5);
    });

    it('should reject if not requester', async function () {
      await expect(escrow.connect(other).releaseFunds(escrowId)).to.be.reverted;
    });

    it('should reject if task not completed', async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-incomplete', ethers.ZeroAddress, amount, duration);
      const incompleteEscrowId = getEscrowId(
        'intent-incomplete',
        requester.address,
        BigInt(timestamp + 1)
      );
      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(incompleteEscrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(incompleteEscrowId, executor.address);

      await expect(escrow.connect(requester).releaseFunds(incompleteEscrowId)).to.be.reverted;
    });
  });

  describe('raiseDispute', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-dispute', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-dispute', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(escrowId, executor.address);
    });

    it('should raise dispute by requester', async function () {
      await expect(
        escrow.connect(requester).raiseDispute(escrowId, 'Task not as described')
      ).to.emit(escrow, 'DisputeRaised');

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(4);
    });

    it('should raise dispute by executor', async function () {
      await expect(
        escrow.connect(executor).raiseDispute(escrowId, 'Requester not cooperating')
      ).to.emit(escrow, 'DisputeRaised');
    });

    it('should reject if not party', async function () {
      await expect(escrow.connect(other).raiseDispute(escrowId, 'Invalid dispute')).to.be.reverted;
    });
  });

  describe('resolveDispute', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-resolve', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-resolve', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(escrowId, executor.address);
      await escrow.connect(executor).submitCompletion(escrowId, ethers.ZeroHash);
      await escrow.connect(requester).raiseDispute(escrowId, 'Dispute reason');
    });

    it('should resolve with refund to requester', async function () {
      await expect(escrow.connect(owner).resolveDispute(escrowId, true)).to.emit(
        escrow,
        'DisputeResolved'
      );

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(6);
    });

    it('should resolve with payment to executor', async function () {
      await expect(escrow.connect(owner).resolveDispute(escrowId, false)).to.emit(
        escrow,
        'DisputeResolved'
      );

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(5);
    });
  });

  describe('pause/unpause', function () {
    it('should pause by owner', async function () {
      await escrow.connect(owner).pause();
      expect(await escrow.paused()).to.equal(true);
    });

    it('should unpause by owner', async function () {
      await escrow.connect(owner).pause();
      await escrow.connect(owner).unpause();
      expect(await escrow.paused()).to.equal(false);
    });

    it('should reject pause by non-owner', async function () {
      await expect(escrow.connect(requester).pause()).to.be.reverted;
    });
  });

  describe('expireAndRefund', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-expire', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-expire', requester.address, BigInt(timestamp + 1));
    });

    it('should expire funded escrow and refund after deadline', async function () {
      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });

      await time.increase(duration + 1);

      await expect(escrow.connect(requester).expireAndRefund(escrowId)).to.not.be.reverted;

      const escrowData = await escrow.escrows(escrowId);
      expect(escrowData.status).to.equal(7);
    });

    it('should reject if deadline not passed', async function () {
      await expect(escrow.connect(requester).expireAndRefund(escrowId)).to.be.revertedWith(
        'Deadline not passed'
      );
    });
  });

  describe('autoRelease', function () {
    let escrowId: string;
    const amount = ethers.parseEther('1');
    const duration = 3600;

    beforeEach(async function () {
      const timestamp = await time.latest();
      await escrow
        .connect(requester)
        .createEscrow('intent-auto', ethers.ZeroAddress, amount, duration);
      escrowId = getEscrowId('intent-auto', requester.address, BigInt(timestamp + 1));

      const fee = (amount * 250n) / 10000n;
      await escrow.connect(requester).fundEscrow(escrowId, { value: amount + fee });
      await escrow.connect(requester).assignExecutor(escrowId, executor.address);
      await escrow.connect(executor).submitCompletion(escrowId, ethers.ZeroHash);
    });

    it('should auto release after 24 hours', async function () {
      await time.increase(86401);

      await expect(escrow.connect(executor).autoRelease(escrowId)).to.not.be.reverted;
    });

    it('should reject before 24 hours', async function () {
      await expect(escrow.connect(executor).autoRelease(escrowId)).to.be.revertedWith(
        '24 hours not passed since completion'
      );
    });
  });

  describe('receive ETH', function () {
    it('should receive ETH via receive function', async function () {
      const value = ethers.parseEther('1');
      await owner.sendTransaction({ to: escrow.getAddress(), value });
      expect(await ethers.provider.getBalance(escrow.getAddress())).to.equal(value);
    });
  });
});
