import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaEscrow, KubernaVesting, MockERC20 } from '../typechain-types';

const VESTING_PERIOD = 365 * 24 * 60 * 60;
const CLIFF_PERIOD   =  90 * 24 * 60 * 60;
const LINEAR_PERIOD  = VESTING_PERIOD - CLIFF_PERIOD;
 
function getVestingId(beneficiary: string, timestamp: bigint): string {
  return ethers.keccak256(
    ethers.solidityPacked(['address', 'uint256'], [beneficiary, timestamp])
  );
}
 
describe('KubernaVesting', function () {
  let vesting: KubernaVesting;
  let token: MockERC20;
  let owner: any;
  let beneficiary1: any;
  let beneficiary2: any;
  let stranger: any;
 
  beforeEach(async function () {
    [owner, beneficiary1, beneficiary2, stranger] = await ethers.getSigners();
 
    const Token = await ethers.getContractFactory('MockERC20');
    token = await Token.deploy(18);
    await token.waitForDeployment();
 
    const Vesting = await ethers.getContractFactory('KubernaVesting');
    vesting = await Vesting.deploy(await token.getAddress());
    await vesting.waitForDeployment();
 
    await token.mint(await vesting.getAddress(), ethers.parseEther('500000'));
  });
 
  describe('Deployment', function () {
    it('should set deployer as owner and store token address', async function () {
      expect(await vesting.owner()).to.equal(owner.address);
      expect(await vesting.token()).to.equal(await token.getAddress());
    });
 
    it('should revert if deployed with zero address token', async function () {
      const Vesting = await ethers.getContractFactory('KubernaVesting');
      await expect(Vesting.deploy(ethers.ZeroAddress)).to.be.reverted;
    });
  });
 
  describe('createVesting', function () {
    it('should store schedule fields and emit VestingCreated', async function () {
      const amount    = ethers.parseEther('1000');
      const timestamp = await time.latest();
 
      const tx = await vesting.createVesting(beneficiary1.address, amount, timestamp);
      await tx.wait();
 
      const scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
      const schedule   = await vesting.vestingSchedules(scheduleId);
 
      expect(schedule.beneficiary).to.equal(beneficiary1.address);
      expect(schedule.totalAmount).to.equal(amount);
      expect(schedule.startTime).to.equal(timestamp);
      expect(schedule.revoked).to.equal(0n);
      expect(schedule.released).to.equal(0n);
      expect(await vesting.totalAllocated()).to.equal(amount);
    });
 
    it('should emit VestingCreated', async function () {
      await expect(
        vesting.createVesting(beneficiary1.address, ethers.parseEther('500'), await time.latest())
      ).to.emit(vesting, 'VestingCreated');
    });
 
    it('should revert on zero-address beneficiary, zero amount, or non-owner', async function () {
      const amount = ethers.parseEther('100');
      const now    = await time.latest();
 
      await expect(vesting.createVesting(ethers.ZeroAddress, amount, now)).to.be.reverted;
      await expect(vesting.createVesting(beneficiary1.address, 0, now)).to.be.reverted;
      await expect(
        vesting.connect(stranger).createVesting(beneficiary1.address, amount, now)
      ).to.be.revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount');
    });
  });
 
  describe('Cliff and vesting curve', function () {
    let scheduleId: string;
    const amount = ethers.parseEther('1000');
 
    beforeEach(async function () {
      const timestamp = await time.latest();
      const tx = await vesting.createVesting(beneficiary1.address, amount, timestamp);
      await tx.wait();
      scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
    });
 
    it('should return 0 before cliff and revert release', async function () {
      await time.increase(CLIFF_PERIOD - 2);
      expect(await vesting.computeVested(scheduleId)).to.equal(0n);
      await expect(vesting.connect(beneficiary1).release(scheduleId)).to.be.reverted;
    });
 
    it('should begin vesting at cliff boundary and transfer correct tokens', async function () {
      await time.increase(CLIFF_PERIOD);
 
      const before = await token.balanceOf(beneficiary1.address);
      await vesting.connect(beneficiary1).release(scheduleId);
      const after  = await token.balanceOf(beneficiary1.address);
 
      // At cliff: timeVested = 0, so vested = 0 * amount / LINEAR_PERIOD = 0
      expect(after).to.be.gt(before);
    });
 
    it('should vest linearly at midpoint of linear window', async function () {
      const half = Math.floor(LINEAR_PERIOD / 2);
      await time.increase(CLIFF_PERIOD + half);
 
      const vested   = await vesting.computeVested(scheduleId);
      const expected = (amount * BigInt(half)) / BigInt(LINEAR_PERIOD);
      expect(vested).to.be.closeTo(expected, ethers.parseEther('0.001'));
    });
 
    it('should cap at totalAmount after full vesting period', async function () {
      await time.increase(VESTING_PERIOD);
      expect(await vesting.computeVested(scheduleId)).to.equal(amount);
    });
  });
 
  describe('release', function () {
    let scheduleId: string;
    const amount = ethers.parseEther('1000');
 
    beforeEach(async function () {
      const timestamp = await time.latest();
      const tx = await vesting.createVesting(beneficiary1.address, amount, timestamp);
      await tx.wait();
      scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
      await time.increase(VESTING_PERIOD);
    });
 
    it('should release full amount and emit VestingReleased', async function () {
      const before = await token.balanceOf(beneficiary1.address);
      await expect(vesting.connect(beneficiary1).release(scheduleId))
        .to.emit(vesting, 'VestingReleased')
        .withArgs(scheduleId, amount);
 
      expect(await token.balanceOf(beneficiary1.address) - before).to.equal(amount);
      expect((await vesting.vestingSchedules(scheduleId)).released).to.equal(amount);
    });
 
    it('should revert on second release with nothing left', async function () {
      await vesting.connect(beneficiary1).release(scheduleId);
      await expect(vesting.connect(beneficiary1).release(scheduleId)).to.be.reverted;
    });
 
    it('should revert if called by non-beneficiary', async function () {
      await expect(vesting.connect(stranger).release(scheduleId)).to.be.reverted;
    });
 
    it('should only send the delta on a second partial release', async function () {
      // Reset — create a fresh schedule to test mid-vesting partial releases
      const timestamp = await time.latest();
      const tx = await vesting.createVesting(beneficiary2.address, amount, timestamp - VESTING_PERIOD);
      await tx.wait();
      const id2 = getVestingId(beneficiary2.address, BigInt(timestamp + 1));
 
      // First release: takes everything vested so far
      await vesting.connect(beneficiary2).release(id2);
      const mid = await token.balanceOf(beneficiary2.address);
 
      // Nothing new has vested — should revert
      await expect(vesting.connect(beneficiary2).release(id2)).to.be.reverted;
      expect(await token.balanceOf(beneficiary2.address)).to.equal(mid);
    });
  });
 
  describe('Multiple beneficiaries', function () {
    it('should vest schedules independently', async function () {
      const amount = ethers.parseEther('1000');
      const now    = await time.latest();
 
      let tx = await vesting.createVesting(beneficiary1.address, amount, now);
      await tx.wait();
      const id1 = getVestingId(beneficiary1.address, BigInt(now + 1));
 
      const laterStart = now + 30 * 24 * 60 * 60;
      tx = await vesting.createVesting(beneficiary2.address, amount, laterStart);
      await tx.wait();
      const id2 = getVestingId(beneficiary2.address, BigInt(now + 2));
 
      await time.increase(CLIFF_PERIOD + 1);
 
      await expect(vesting.connect(beneficiary1).release(id1)).to.not.be.reverted;
      await expect(vesting.connect(beneficiary2).release(id2)).to.be.reverted;
    });
 
    it('should accumulate totalAllocated across schedules', async function () {
      const a1 = ethers.parseEther('1000');
      const a2 = ethers.parseEther('500');
      await vesting.createVesting(beneficiary1.address, a1, await time.latest());
      await vesting.createVesting(beneficiary2.address, a2, await time.latest());
      expect(await vesting.totalAllocated()).to.equal(a1 + a2);
    });
  });
 
  describe('revoke', function () {
    let scheduleId: string;
    const amount = ethers.parseEther('1000');
 
    beforeEach(async function () {
      const timestamp = await time.latest();
      const tx = await vesting.createVesting(beneficiary1.address, amount, timestamp);
      await tx.wait();
      scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
    });
 
    it('should mark revoked, emit event, and pay out vested tokens', async function () {
      await time.increase(CLIFF_PERIOD);
 
      const before = await token.balanceOf(beneficiary1.address);
      await expect(vesting.revoke(scheduleId)).to.emit(vesting, 'VestingRevoked').withArgs(scheduleId);
 
      expect((await vesting.vestingSchedules(scheduleId)).revoked).to.equal(1n);
      expect(await token.balanceOf(beneficiary1.address)).to.be.gt(before);
    });
 
    it('should reduce totalAllocated by unvested amount', async function () {
      await vesting.revoke(scheduleId);
      expect(await vesting.totalAllocated()).to.equal(0n);
    });
 
    it('should revert release and double-revoke after revocation', async function () {
      await time.increase(VESTING_PERIOD);
      await vesting.revoke(scheduleId);
 
      await expect(vesting.connect(beneficiary1).release(scheduleId)).to.be.reverted;
      await expect(vesting.revoke(scheduleId)).to.be.reverted;
    });
 
    it('should revert revoke from non-owner', async function () {
      await expect(
        vesting.connect(stranger).revoke(scheduleId)
      ).to.be.revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount');
    });
  });
 
  describe('Edge cases', function () {
    it('should return empty schedule list for unknown address', async function () {
      expect((await vesting.getBeneficiarySchedules(stranger.address)).length).to.equal(0);
    });
 
    it('should show fully vested for a schedule with past startTime', async function () {
      const amount    = ethers.parseEther('100');
      const timestamp = await time.latest();
      const tx = await vesting.createVesting(beneficiary1.address, amount, timestamp - VESTING_PERIOD);
      await tx.wait();
      const scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
 
      expect(await vesting.computeVested(scheduleId)).to.equal(amount);
    });
 
    it('should not vest before cliff when startTime is in the future', async function () {
      const amount      = ethers.parseEther('100');
      const timestamp   = await time.latest();
      const futureStart = timestamp + 30 * 24 * 60 * 60;
 
      const tx = await vesting.createVesting(beneficiary1.address, amount, futureStart);
      await tx.wait();
      const scheduleId = getVestingId(beneficiary1.address, BigInt(timestamp + 1));
 
      await time.increase(CLIFF_PERIOD + 1);
      expect(await vesting.computeVested(scheduleId)).to.equal(0n);
    });
  });
});
