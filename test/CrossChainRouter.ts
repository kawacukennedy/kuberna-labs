import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import type { CrossChainRouter, MockERC20 } from '../typechain-types';

describe('CrossChainRouter', function () {
  let router: CrossChainRouter;
  let mockToken: MockERC20;
  let owner: any;
  let sender: any;
  let recipient: any;

  const DEST_CHAIN = 137; // polygon

  beforeEach(async function () {
    [owner, sender, recipient] = await ethers.getSigners();

    const Router = await ethers.getContractFactory('CrossChainRouter');
    router = (await Router.deploy(owner.address)) as unknown as CrossChainRouter;
    await router.waitForDeployment();

    const MockToken = await ethers.getContractFactory('MockERC20');
    mockToken = (await MockToken.deploy(18)) as unknown as MockERC20;
    await mockToken.waitForDeployment();

    await router.setChainSupport(DEST_CHAIN, true);
    await router.setBridgeFee(ethers.parseEther('0.01'));
  });

  describe('initiateTransfer', function () {
    it('should escrow exact native principal and record sender ledger', async function () {
      const amount = ethers.parseEther('1');
      const bridgeFee = ethers.parseEther('0.01');

      await expect(
        router
          .connect(sender)
          .initiateTransfer(DEST_CHAIN, recipient.address, ethers.ZeroAddress, amount, amount, {
            value: amount + bridgeFee,
          })
      ).to.emit(router, 'CrossChainTransferInitiated');

      expect(await router.senderNativeEscrow(sender.address)).to.equal(amount);
      expect(await router.totalNativeEscrowed()).to.equal(amount);
      expect(await ethers.provider.getBalance(router.getAddress())).to.equal(amount + bridgeFee);
    });

    it('should reject native transfers that do not escrow exactly amount + fee', async function () {
      const amount = ethers.parseEther('1');

      // only amount, missing the bridge fee
      await expect(
        router
          .connect(sender)
          .initiateTransfer(DEST_CHAIN, recipient.address, ethers.ZeroAddress, amount, amount, {
            value: amount,
          })
      ).to.be.revertedWith('Native principal must be escrowed');
    });

    it('should accept ERC20 transfers with bridge fee in ETH', async function () {
      const amount = ethers.parseEther('5');
      const bridgeFee = ethers.parseEther('0.01');
      await mockToken.mint(sender.address, amount);
      await mockToken.connect(sender).approve(router.getAddress(), amount);

      await expect(
        router
          .connect(sender)
          .initiateTransfer(DEST_CHAIN, recipient.address, mockToken.getAddress(), amount, amount, {
            value: bridgeFee,
          })
      ).to.emit(router, 'CrossChainTransferInitiated');

      expect(await router.senderTokenEscrow(sender.address, mockToken.getAddress())).to.equal(
        amount
      );
      expect(await router.totalTokenEscrowed(mockToken.getAddress())).to.equal(amount);
    });

    it('should reject unsupported chains', async function () {
      const amount = ethers.parseEther('1');
      await expect(
        router
          .connect(sender)
          .initiateTransfer(1, recipient.address, ethers.ZeroAddress, amount, amount, {
            value: amount + ethers.parseEther('0.01'),
          })
      ).to.be.revertedWith('Unsupported chain');
    });
  });

  describe('executeTransfer', function () {
    async function initiateNative(amount: bigint): Promise<string> {
      const bridgeFee = ethers.parseEther('0.01');
      const tx = await router
        .connect(sender)
        .initiateTransfer(DEST_CHAIN, recipient.address, ethers.ZeroAddress, amount, amount, {
          value: amount + bridgeFee,
        });
      const receipt = await tx.wait();
      const event = receipt!.logs.find((log: any) => log.fragment?.name === 'CrossChainTransferInitiated');
      return (event as any)?.args?.messageId as string;
    }

    it('should pay the recipient out of escrow and settle ledgers', async function () {
      const amount = ethers.parseEther('1');
      const bridgeFee = ethers.parseEther('0.01');
      const realId = await initiateNative(amount);

      await expect(
        router.connect(owner).executeTransfer(realId, recipient.address, ethers.ZeroAddress, amount, amount)
      ).to.emit(router, 'CrossChainTransferExecuted');

      expect(await router.senderNativeEscrow(sender.address)).to.equal(0);
      expect(await router.totalNativeEscrowed()).to.equal(0);
      expect(await router.escrowByMessage(realId)).to.equal(0);
      expect(await ethers.provider.getBalance(recipient.address)).to.be.gte(amount);
    });

    it('should reject with mismatched parameters', async function () {
      const amount = ethers.parseEther('1');
      const realId = await initiateNative(amount);

      await expect(
        router.connect(owner).executeTransfer(realId, recipient.address, ethers.ZeroAddress, amount - 1n, amount)
      ).to.be.revertedWith('Params mismatch');
    });

    it('should reject executing a message twice', async function () {
      const amount = ethers.parseEther('1');
      const realId = await initiateNative(amount);

      await router.connect(owner).executeTransfer(realId, recipient.address, ethers.ZeroAddress, amount, amount);
      await expect(
        router.connect(owner).executeTransfer(realId, recipient.address, ethers.ZeroAddress, amount, amount)
      ).to.be.revertedWith('Already executed');
    });
  });

  describe('withdrawFees / withdrawTokens', function () {
    it('should allow withdrawing fees without touching native escrow', async function () {
      const amount = ethers.parseEther('1');
      const bridgeFee = ethers.parseEther('0.01');
      await router
        .connect(sender)
        .initiateTransfer(DEST_CHAIN, recipient.address, ethers.ZeroAddress, amount, amount, {
          value: amount + bridgeFee,
        });

      // attempt to withdraw the full balance would break escrow -> reject
      await expect(
        router.connect(owner).withdrawFees(owner.address, amount + bridgeFee)
      ).to.be.revertedWith('Cannot withdraw escrowed principal'); // escrow assumption: withdraw would dip below outstanding escrow

      // withdraw only the fee portion on top of escrow is allowed
      const feeOnly = ethers.parseEther('0.01');
      const before = await ethers.provider.getBalance(owner.address);
      await expect(router.connect(owner).withdrawFees(owner.address, feeOnly)).to.not.be.reverted;
      const after = await ethers.provider.getBalance(owner.address);
      expect(after > before).to.equal(true);
    });

    it('should allow withdrawing tokens only above outstanding token escrow', async function () {
      const amount = ethers.parseEther('5');
      const bridgeFee = ethers.parseEther('0.01');
      await mockToken.mint(sender.address, amount);
      await mockToken.connect(sender).approve(router.getAddress(), amount);
      await router
        .connect(sender)
        .initiateTransfer(DEST_CHAIN, recipient.address, mockToken.getAddress(), amount, amount, {
          value: bridgeFee,
        });

      // Trying to pull escrowed principal must fail
      await expect(
        router.connect(owner).withdrawTokens(mockToken.getAddress(), owner.address, amount)
      ).to.be.revertedWith('Cannot withdraw escrowed tokens');
    });
  });

  describe('admin functions', function () {
    it('should restrict chain support changes to owner', async function () {
      await expect(router.connect(sender).setChainSupport(10, true)).to.be.reverted;
    });

    it('should map tokens between chains', async function () {
      await expect(
        router.setTokenMapping(10, mockToken.getAddress(), owner.address)
      ).to.emit(router, 'TokenMappingUpdated');
      expect(await router.chainTokenMapping(10, mockToken.getAddress())).to.equal(owner.address);
    });

    it('should pause and resume', async function () {
      await expect(router.emergencyHalt()).to.emit(router, 'EmergencyHalted');
      await expect(router.resume()).to.emit(router, 'Resumed');

      const amount = ethers.parseEther('1');
      await router.emergencyHalt();
      await expect(
        router
          .connect(sender)
          .initiateTransfer(DEST_CHAIN, recipient.address, ethers.ZeroAddress, amount, amount, {
            value: amount + ethers.parseEther('0.01'),
          })
      ).to.be.reverted;
    });
  });
});