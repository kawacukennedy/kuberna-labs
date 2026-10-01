import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import type { KubernaFeeManager } from '../typechain-types';

describe('KubernaFeeManager', function () {
  let feeManager: KubernaFeeManager;
  let owner: any;
  let recipient1: any;
  let recipient2: any;
  let other: any;

  beforeEach(async function () {
    [owner, recipient1, recipient2, other] = await ethers.getSigners();

    const FeeManager = await ethers.getContractFactory('KubernaFeeManager');
    feeManager = (await FeeManager.deploy()) as unknown as KubernaFeeManager;
    await feeManager.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with owner and default fee', async function () {
      expect(await feeManager.owner()).to.equal(owner.address);
      expect(await feeManager.platformFee()).to.equal(250n);
    });
  });

  describe('recipients', function () {
    it('should add and remove recipients', async function () {
      await expect(feeManager.addRecipient(recipient1.address, 5000)).to.emit(
        feeManager,
        'RecipientAdded'
      );
      expect(await feeManager.recipientShares(recipient1.address)).to.equal(5000n);

      await expect(feeManager.removeRecipient(recipient1.address)).to.emit(
        feeManager,
        'RecipientRemoved'
      );
      expect(await feeManager.recipientShares(recipient1.address)).to.equal(0n);
    });

    it('should reject total shares above 10000 BPS', async function () {
      await feeManager.addRecipient(recipient1.address, 6000);
      await expect(feeManager.addRecipient(recipient2.address, 5000)).to.be.revertedWith(
        'Total shares exceed 10000 BPS'
      );
    });

    it('should restrict recipient management to owner', async function () {
      await expect(feeManager.connect(other).addRecipient(recipient1.address, 1000)).to.be.reverted;
    });
  });

  describe('distributeFees', function () {
    it('should distribute fees to recipients by share and withhold the platform fee', async function () {
      await feeManager.addRecipient(recipient1.address, 6000);
      await feeManager.addRecipient(recipient2.address, 4000);

      const amount = ethers.parseEther('1'); // 2.5% platform = 0.025
      const platformAmount = (amount * 250n) / 10000n;
      const distributeAmount = amount - platformAmount;

      await owner.sendTransaction({ to: feeManager.getAddress(), value: amount });
      await feeManager.connect(owner).distributeFees(ethers.ZeroAddress, amount);

      expect(await feeManager.pendingPlatformFees(ethers.ZeroAddress)).to.equal(platformAmount);
      const r1 = (distributeAmount * 6000n) / 10000n;
      const r2 = (distributeAmount * 4000n) / 10000n;
      expect(await ethers.provider.getBalance(recipient1.address)).to.be.gte(r1);
      expect(await ethers.provider.getBalance(recipient2.address)).to.be.gte(r2);
    });

    it('should reject distribution by non-owner', async function () {
      await expect(feeManager.connect(other).distributeFees(ethers.ZeroAddress, 1)).to.be.reverted;
    });
  });

  describe('withdrawPlatformFees', function () {
    it('should let the owner withdraw accrued platform fees', async function () {
      await feeManager.addRecipient(recipient1.address, 10000);
      const amount = ethers.parseEther('1');
      const platformAmount = (amount * 250n) / 10000n;

      await owner.sendTransaction({ to: feeManager.getAddress(), value: amount });
      await feeManager.connect(owner).distributeFees(ethers.ZeroAddress, amount);
      await expect(
        feeManager.connect(owner).withdrawPlatformFees(ethers.ZeroAddress, platformAmount)
      ).to.emit(feeManager, 'PlatformFeesWithdrawn');

      expect(await feeManager.pendingPlatformFees(ethers.ZeroAddress)).to.equal(0n);
    });

    it('should reject withdrawing more than accrued', async function () {
      await expect(
        feeManager.connect(owner).withdrawPlatformFees(ethers.ZeroAddress, 1)
      ).to.be.revertedWith('Insufficient pending platform fees');
    });

    it('should reject withdrawal by non-owner', async function () {
      await expect(
        feeManager.connect(other).withdrawPlatformFees(ethers.ZeroAddress, 1)
      ).to.be.reverted;
    });
  });
});