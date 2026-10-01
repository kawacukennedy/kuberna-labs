import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import { time } from '@nomicfoundation/hardhat-network-helpers';
import type { KubernaTreasury } from '../typechain-types';

describe('KubernaTreasury', function () {
  let treasury: KubernaTreasury;
  let owner: any;
  let voter1: any;
  let voter2: any;
  let recipient: any;

  beforeEach(async function () {
    [owner, voter1, voter2, recipient] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory('KubernaTreasury');
    treasury = (await Treasury.deploy()) as unknown as KubernaTreasury;
    await treasury.waitForDeployment();
  });

  describe('deposit-weighted voting power', function () {
    it('should accrue voting power 1:1 with native deposits', async function () {
      await treasury.connect(voter1).deposit(ethers.ZeroAddress, 0, { value: ethers.parseEther('150') });
      expect(await treasury.votingPower(voter1.address)).to.equal(ethers.parseEther('150'));
    });

    it('should credit voting power on plain ETH transfers', async function () {
      const value = ethers.parseEther('50');
      await voter1.sendTransaction({ to: treasury.getAddress(), value });
      expect(await treasury.votingPower(voter1.address)).to.equal(value);
    });

    it('should not expose owner-controlled setVotingPower', async function () {
      // The audit finding: owner could mint arbitrary voting power. The function
      // must no longer exist on the deployed contract.
      expect((treasury as any).setVotingPower).to.equal(undefined);
    });
  });

  describe('proposals', function () {
    const amount = ethers.parseEther('1');

    beforeEach(async function () {
      // voter1 meets quorum via deposits
      await treasury.connect(voter1).deposit(ethers.ZeroAddress, 0, { value: ethers.parseEther('200') });
    });

    it('should create a proposal', async function () {
      await expect(
        treasury
          .connect(owner)
          .createProposal(recipient.address, ethers.ZeroAddress, amount, 'Fund program')
      ).to.emit(treasury, 'ProposalCreated');
    });

    it('should execute with quorum and strict majority', async function () {
      const tx = await treasury
        .connect(owner)
        .createProposal(recipient.address, ethers.ZeroAddress, amount, 'Fund program');
      const receipt = await tx.wait();
      const event = receipt!.logs.find((log: any) => log.fragment?.name === 'ProposalCreated');
      const id = (event as any)?.args?.[0] as bigint;

      await treasury.connect(voter1).castVote(id, true);
      await time.increase(3 * 24 * 60 * 60 + 1);

      const before = await ethers.provider.getBalance(recipient.address);
      await expect(treasury.connect(owner).executeProposal(id)).to.emit(treasury, 'ProposalExecuted');
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(amount);
    });

    it('should reject execution when votesFor does not exceed votesAgainst', async function () {
      await treasury.connect(voter2).deposit(ethers.ZeroAddress, 0, { value: ethers.parseEther('200') });

      const tx = await treasury
        .connect(owner)
        .createProposal(recipient.address, ethers.ZeroAddress, amount, 'Contested');
      const receipt = await tx.wait();
      const event = receipt!.logs.find((log: any) => log.fragment?.name === 'ProposalCreated');
      const id = (event as any)?.args?.[0] as bigint;

      await treasury.connect(voter1).castVote(id, true);
      await treasury.connect(voter2).castVote(id, false);
      await time.increase(3 * 24 * 60 * 60 + 1);

      await expect(treasury.connect(owner).executeProposal(id)).to.be.reverted;
    });

    it('should reject execution before voting period ends', async function () {
      const tx = await treasury
        .connect(owner)
        .createProposal(recipient.address, ethers.ZeroAddress, amount, 'Too soon');
      const receipt = await tx.wait();
      const event = receipt!.logs.find((log: any) => log.fragment?.name === 'ProposalCreated');
      const id = (event as any)?.args?.[0] as bigint;

      await treasury.connect(voter1).castVote(id, true);
      await expect(treasury.connect(owner).executeProposal(id)).to.be.reverted;
    });
  });
});