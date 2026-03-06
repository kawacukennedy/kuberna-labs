import { expect } from "chai";
import { ethers } from "hardhat";
import { PriceOracle, PriceOracle__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("PriceOracle", function () {
  let oracle: PriceOracle;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let mockToken: string;
  let mockAggregator: Contract;

  beforeEach(async function () {
    [owner, nonOwner] = await ethers.getSigners();
    mockToken = ethers.Wallet.createRandom().address;

    // Deploy main Oracle
    const OracleFactory = (await ethers.getContractFactory("PriceOracle")) as PriceOracle__factory;
    oracle = await OracleFactory.deploy(owner.address);

    // Deploy Mock Chainlink Aggregator
    // A simple mock returning 8-decimals price
    const MockAggregatorCode = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      contract MockAggregator {
          int256 public answer;
          uint80 public roundId = 1;
          uint256 public updatedAt;
          constructor(int256 _answer) {
              answer = _answer;
              updatedAt = block.timestamp;
          }
          function setAnswer(int256 _answer) external {
              answer = _answer;
              updatedAt = block.timestamp;
              roundId++;
          }
          function latestRoundData() external view returns (
              uint80 roundId_,
              int256 answer_,
              uint256 startedAt_,
              uint256 updatedAt_,
              uint80 answeredInRound_
          ) {
              return (roundId, answer, updatedAt, updatedAt, roundId);
          }
      }
    `;

    // We will compile the mock contract dynamically or just test the manual logic first to ensure compilation works
  });

  describe("Chainlink Feeds", function () {
    it("Should fallback to manual price if no Chainlink feed is configured", async function () {
      const price = ethers.parseUnits("1.50", 8);
      await oracle.setPendingPrice(mockToken, price);
      // Fast forward time to pass the 1-hour delay
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);
      await oracle.confirmPrice(mockToken);

      const fetchedPrice = await oracle.getPrice(mockToken);
      expect(fetchedPrice).to.equal(price);
    });
  });

  describe("Manual Price Updates", function () {
    it("Should set pending price correctly", async function () {
      const price = ethers.parseUnits("1.50", 8);
      await oracle.setPendingPrice(mockToken, price);

      const pending = await oracle.pendingPrices(mockToken);
      expect(pending).to.equal(price);
    });

    it("Should not allow non-owner to set pending price", async function () {
      const price = ethers.parseUnits("1.50", 8);
      await expect(
        oracle.connect(nonOwner).setPendingPrice(mockToken, price)
      ).to.be.revertedWithCustomError(oracle, "OwnableUnauthorizedAccount");
    });
  });
});
