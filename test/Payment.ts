import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import type { KubernaPayment, MockERC20 } from '../typechain-types';

describe('KubernaPayment', function () {
  let payment: KubernaPayment;
  let mockToken: MockERC20;
  let owner: any;
  let user: any;
  let other: any;

  beforeEach(async function () {
    [owner, user, other] = await ethers.getSigners();

    const Payment = await ethers.getContractFactory('KubernaPayment');
    payment = (await Payment.deploy()) as unknown as KubernaPayment;
    await payment.waitForDeployment();

    const MockToken = await ethers.getContractFactory('MockERC20');
    mockToken = (await MockToken.deploy(18)) as unknown as MockERC20;
    await mockToken.waitForDeployment();
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await payment.owner()).to.equal(owner.address);
    });

    it('should have 2.5% fee basis points', async function () {
      expect(await payment.FEE_BPS()).to.equal(250n);
    });

    it('should pre-register native ETH as supported', async function () {
      const tokens = await payment.getSupportedTokens();
      expect(tokens).to.include(ethers.ZeroAddress);
      const cfg = await payment.tokenConfigs(ethers.ZeroAddress);
      expect(cfg.enabled).to.equal(true);
    });
  });

  describe('addToken / setTokenConfig / removeToken', function () {
    it('should add a token and persist per-token decimals and minWithdrawal', async function () {
      await expect(payment.addToken(mockToken.getAddress(), ethers.parseEther('1'), ethers.parseEther('100')))
        .to.emit(payment, 'TokenAdded');

      const cfg = await payment.tokenConfigs(mockToken.getAddress());
      expect(cfg.enabled).to.equal(true);
      expect(cfg.minAmount).to.equal(ethers.parseEther('1'));
      expect(cfg.maxAmount).to.equal(ethers.parseEther('100'));
      expect(cfg.decimals).to.equal(18);

      // USDC-style token with 6 decimals
      await expect(payment.setTokenConfig(mockToken.getAddress(), 6, 1_000_000n)).to.emit(
        payment,
        'TokenConfigUpdated'
      );
      const updated = await payment.tokenConfigs(mockToken.getAddress());
      expect(updated.decimals).to.equal(6);
      expect(updated.minWithdrawal).to.equal(1_000_000n);
    });

    it('should reject adding ETH', async function () {
      await expect(payment.addToken(ethers.ZeroAddress, 0, 1)).to.be.revertedWith(
        'ETH is always supported'
      );
    });

    it('should reject adding a duplicate token', async function () {
      await payment.addToken(mockToken.getAddress(), 0, 1);
      await expect(payment.addToken(mockToken.getAddress(), 0, 1)).to.be.revertedWith(
        'Token already enabled'
      );
    });

    it('should reject invalid amount ranges', async function () {
      await expect(payment.addToken(mockToken.getAddress(), 2, 1)).to.be.revertedWith(
        'Invalid amount range'
      );
    });

    it('should only allow owner to add tokens', async function () {
      await expect(payment.connect(user).addToken(mockToken.getAddress(), 0, 1)).to.be.reverted;
    });

    it('should remove a token and prune the supportedTokens array', async function () {
      await payment.addToken(mockToken.getAddress(), 0, 1);
      await expect(payment.removeToken(mockToken.getAddress())).to.emit(payment, 'TokenRemoved');

      const cfg = await payment.tokenConfigs(mockToken.getAddress());
      expect(cfg.enabled).to.equal(false);
      const tokens = await payment.getSupportedTokens();
      expect(tokens).to.not.include(mockToken.getAddress());
    });

    it('should not remove native ETH', async function () {
      await expect(payment.removeToken(ethers.ZeroAddress)).to.be.revertedWith(
        'Cannot remove native token'
      );
    });
  });

  describe('processPayment', function () {
    it('should split the fee: user gets amount - fee, platform gets fee', async function () {
      await payment.addToken(mockToken.getAddress(), 0, ethers.parseEther('1000'));
      await mockToken.mint(user.address, ethers.parseEther('10'));
      await mockToken.connect(user).approve(payment.getAddress(), ethers.parseEther('10'));

      const amount = ethers.parseEther('2'); // fee = 0.05
      await expect(
        payment.connect(user).processPayment(mockToken.getAddress(), amount)
      ).to.emit(payment, 'PaymentReceived');

      const fee = (amount * 250n) / 10000n;
      expect(await payment.getBalance(user.address, mockToken.getAddress())).to.equal(amount - fee);
      expect(await payment.platformBalances(mockToken.getAddress())).to.equal(fee);
    });

    it('should accept native ETH payments with msg.value', async function () {
      const amount = ethers.parseEther('1');
      await payment
        .connect(user)
        .processPayment(ethers.ZeroAddress, amount, { value: amount });

      const fee = (amount * 250n) / 10000n;
      expect(await payment.getBalance(user.address, ethers.ZeroAddress)).to.equal(amount - fee);
    });

    it('should reject incorrect ETH amount', async function () {
      await expect(
        payment.connect(user).processPayment(ethers.ZeroAddress, ethers.parseEther('1'), {
          value: ethers.parseEther('0.5'),
        })
      ).to.be.revertedWith('Incorrect ETH amount');
    });

    it('should reject amounts out of range', async function () {
      await payment.addToken(mockToken.getAddress(), ethers.parseEther('1'), ethers.parseEther('100'));
      await mockToken.mint(user.address, ethers.parseEther('1'));
      await mockToken.connect(user).approve(payment.getAddress(), ethers.parseEther('1'));

      await expect(
        payment.connect(user).processPayment(mockToken.getAddress(), ethers.parseEther('0.5'))
      ).to.be.revertedWith('Amount out of range');
    });

    it('should reject unsupported tokens', async function () {
      await expect(
        payment.connect(user).processPayment(mockToken.getAddress(), 1)
      ).to.be.revertedWith('Token not supported');
    });
  });

  describe('receive', function () {
    it('should credit plain ETH transfers to the sender balance', async function () {
      const value = ethers.parseEther('1');
      await user.sendTransaction({ to: payment.getAddress(), value });

      expect(await payment.getBalance(user.address, ethers.ZeroAddress)).to.equal(value);
    });
  });

  describe('withdraw', function () {
    beforeEach(async function () {
      await payment.addToken(mockToken.getAddress(), 0, ethers.parseEther('1000'));
      await mockToken.mint(user.address, ethers.parseEther('10'));
      await mockToken.connect(user).approve(payment.getAddress(), ethers.parseEther('10'));
    });

    it('should withdraw full user balance', async function () {
      const amount = ethers.parseEther('1');
      await payment.connect(user).processPayment(mockToken.getAddress(), amount);

      const fee = (amount * 250n) / 10000n;
      await payment.connect(user).withdraw(mockToken.getAddress(), amount - fee);

      // The user is credited `amount - fee` while `processPayment` pulls `amount`
      // from their wallet, so they end up with their starting balance minus fee.
      expect(await payment.getBalance(user.address, mockToken.getAddress())).to.equal(0);
      expect(await mockToken.balanceOf(user.address)).to.equal(
        ethers.parseEther('10') - fee
      );
    });

    it('should reject withdrawals below minWithdrawal', async function () {
      const amount = ethers.parseEther('1');
      await payment.connect(user).processPayment(mockToken.getAddress(), amount);
      const fee = (amount * 250n) / 10000n;

      await payment.setTokenConfig(mockToken.getAddress(), 18, ethers.parseEther('10'));
      await expect(payment.connect(user).withdraw(mockToken.getAddress(), amount - fee)).to.be
        .revertedWith('Below minimum withdrawal');
    });

    it('should reject overdraw', async function () {
      await expect(
        payment.connect(user).withdraw(mockToken.getAddress(), ethers.parseEther('5'))
      ).to.be.revertedWith('Insufficient balance');
    });
  });

  describe('withdrawFees', function () {
    it('should withdraw platform fees to the owner', async function () {
      await payment.addToken(mockToken.getAddress(), 0, ethers.parseEther('1000'));
      await mockToken.mint(user.address, ethers.parseEther('1'));
      await mockToken.connect(user).approve(payment.getAddress(), ethers.parseEther('1'));

      const amount = ethers.parseEther('1');
      const fee = (amount * 250n) / 10000n;
      await payment.connect(user).processPayment(mockToken.getAddress(), amount);

      await payment.withdrawFees(mockToken.getAddress(), fee);
      expect(await payment.platformBalances(mockToken.getAddress())).to.equal(0);
      expect(await mockToken.balanceOf(owner.address)).to.equal(fee);
    });

    it('should reject withdrawing more than accumulated fees', async function () {
      await expect(payment.withdrawFees(mockToken.getAddress(), 1)).to.be.revertedWith(
        'Insufficient platform balance'
      );
    });
  });
});