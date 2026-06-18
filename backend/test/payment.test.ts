import { PaymentService, PaymentServiceConfig } from "../src/services/payment";

jest.mock("ethers", () => {
  const actualEthers = jest.requireActual("ethers");
  const mockProvider = {
    getTransactionReceipt: jest.fn().mockResolvedValue(null),
    getBlockNumber: jest.fn().mockResolvedValue(100),
    getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(1) }),
    destroy: jest.fn(),
    send: jest.fn(),
    detectNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
    getNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
  };

  const mockContract = {
    createEscrow: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x...", logs: [], status: 1, blockNumber: 100 }),
    }),
    createIntent: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x...", logs: [] }),
    }),
    fundEscrow: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x..." }),
    }),
    releaseFunds: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x..." }),
    }),
    raiseDispute: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x..." }),
    }),
    withdraw: jest.fn().mockReturnValue({
      wait: jest.fn().mockResolvedValue({ hash: "0x..." }),
    }),
    getBalance: jest.fn().mockResolvedValue(BigInt(0)),
    getEscrow: jest.fn().mockResolvedValue({ status: BigInt(3), intentId: "intent-123" }),
    getSupportedTokens: jest.fn().mockResolvedValue([]),
    interface: {
      parseLog: jest.fn().mockReturnValue({ name: "EscrowCreated", args: ["escrow-id-123"] }),
    },
    estimateGas: {
      createEscrow: jest.fn().mockResolvedValue(BigInt(100000)),
      fundEscrow: jest.fn().mockResolvedValue(BigInt(50000)),
      releaseFunds: jest.fn().mockResolvedValue(BigInt(30000)),
      withdraw: jest.fn().mockResolvedValue(BigInt(40000)),
    },
    on: jest.fn(),
  };

  return {
    ...actualEthers,
    ethers: {
      ...actualEthers.ethers,
      JsonRpcProvider: jest.fn(() => ({ ...mockProvider })),
      Wallet: jest.fn(() => ({
        getAddress: jest.fn().mockResolvedValue("0x1234567890123456789012345678901234567890"),
        connect: jest.fn().mockReturnThis(),
      })),
      Contract: jest.fn(() => ({ ...mockContract })),
    },
  };
});

import { ethers } from "ethers";

// Mock dependencies
jest.mock("../src/utils/prisma", () => ({
  prisma: {
    intent: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("nats", () => ({
  connect: jest.fn().mockResolvedValue({
    jetstream: jest.fn().mockReturnValue({
      publish: jest.fn().mockResolvedValue(undefined),
    }),
  }),
}));

describe("PaymentService", () => {
  let paymentService: PaymentService;
  let mockConfig: PaymentServiceConfig;

  beforeEach(() => {
    mockConfig = {
      rpcUrls: {
        ethereum: "http://localhost:8545",
        polygon: "http://localhost:8545",
        arbitrum: "http://localhost:8545",
        near: "",
        solana: "",
      },
      contractAddresses: {
        escrow: {
          ethereum: "0x1234567890123456789012345678901234567890",
          polygon: "0x1234567890123456789012345678901234567891",
          arbitrum: "0x1234567890123456789012345678901234567892",
        },
        payment: {
          ethereum: "0x2234567890123456789012345678901234567890",
          polygon: "0x2234567890123456789012345678901234567891",
          arbitrum: "0x2234567890123456789012345678901234567892",
        },
        intent: {
          ethereum: "0x3234567890123456789012345678901234567890",
          polygon: "0x3234567890123456789012345678901234567891",
          arbitrum: "0x3234567890123456789012345678901234567892",
        },
      },
      priceFeedAddresses: {
        ethereum: {
          "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
        },
        polygon: {
          "MATIC/USD": "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
        },
        arbitrum: {},
      },
      natsUrl: "nats://localhost:4222",
      privateKey:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
    };

    paymentService = new PaymentService(mockConfig);
  });

  describe("createPaymentIntent", () => {
    it("should throw error for zero amount", async () => {
      const request = {
        userId: "user-123",
        amount: "0",
        currency: "USD",
        token: ethers.ZeroAddress,
        chain: "ethereum",
      };

      await expect(paymentService.createPaymentIntent(request)).rejects.toThrow(
        "Amount must be greater than zero"
      );
    });

    it("should throw error for negative amount", async () => {
      const request = {
        userId: "user-123",
        amount: "-10",
        currency: "USD",
        token: ethers.ZeroAddress,
        chain: "ethereum",
      };

      await expect(paymentService.createPaymentIntent(request)).rejects.toThrow(
        "Amount must be greater than zero"
      );
    });

    it("should validate token is supported", async () => {
      const request = {
        userId: "user-123",
        amount: "100",
        currency: "USD",
        token: "0x9999999999999999999999999999999999999999",
        chain: "ethereum",
      };

      // Mock getSupportedTokens to return empty array
      jest.spyOn(paymentService, "getSupportedTokens").mockResolvedValue([]);

      await expect(paymentService.createPaymentIntent(request)).rejects.toThrow(
        /not supported/
      );
    });
  });

  describe("fundEscrow", () => {
    it("should throw error for non-existent transaction", async () => {
      const escrowId = ethers.id("test-escrow");
      const txHash = "0x" + "0".repeat(64);

      await expect(
        paymentService.fundEscrow(escrowId, txHash, "ethereum")
      ).rejects.toThrow("Transaction not found");
    });

    it("should throw error for insufficient confirmations", async () => {
      const escrowId = ethers.id("test-escrow");
      const txHash = "0x" + "0".repeat(64);

      const mockReceipt = { status: 1, blockNumber: 100 };
      const mockProvider = {
        getTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt),
        getBlockNumber: jest.fn().mockResolvedValue(101),
        getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(1) }),
        destroy: jest.fn(),
        send: jest.fn(),
        detectNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
        getNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
      };

      jest.spyOn(paymentService as any, "getProvider").mockReturnValue(mockProvider);

      await expect(
        paymentService.fundEscrow(escrowId, txHash, "ethereum")
      ).rejects.toThrow("Insufficient confirmations");
    });
  });

  describe("releasePayment", () => {
    it("should throw error if escrow is not completed", async () => {
      const escrowId = ethers.id("test-escrow");

      const mockContract = {
        getEscrow: jest.fn().mockResolvedValue({ status: BigInt(1), intentId: "intent-123" }),
      };

      jest.spyOn(paymentService as any, "getEscrowContract").mockReturnValue(mockContract);

      await expect(
        paymentService.releasePayment(escrowId, "ethereum")
      ).rejects.toThrow("Escrow is not in completed status");
    });
  });

  describe("processWithdrawal", () => {
    it("should throw error if user has insufficient balance", async () => {
      const userId = "user-123";
      const token = ethers.ZeroAddress;
      const amount = "1000";
      const chain = "ethereum";

      // Mock user address
      const { prisma } = require("../src/utils/prisma");
      prisma.user.findUnique.mockResolvedValue({
        web3Address: "0x1234567890123456789012345678901234567890",
      });

      const mockContract = {
        getBalance: jest.fn().mockResolvedValue(ethers.parseUnits("100", 18)),
      };

      jest.spyOn(paymentService as any, "getPaymentContract").mockReturnValue(mockContract);

      await expect(
        paymentService.processWithdrawal(userId, token, amount, chain)
      ).rejects.toThrow("Insufficient balance");
    });

    it("should throw error if user does not have web3 address", async () => {
      const userId = "user-123";
      const token = ethers.ZeroAddress;
      const amount = "100";
      const chain = "ethereum";

      const { prisma } = require("../src/utils/prisma");
      prisma.user.findUnique.mockResolvedValue({
        web3Address: null,
      });

      await expect(
        paymentService.processWithdrawal(userId, token, amount, chain)
      ).rejects.toThrow("User does not have a web3 address");
    });
  });

  describe("estimateGas", () => {
    it("should throw error for unknown operation", async () => {
      await expect(
        paymentService.estimateGas("ethereum", "unknownOperation", {})
      ).rejects.toThrow("Unknown operation");
    });

    it("should estimate gas for createEscrow operation", async () => {
      const params = {
        intentId: ethers.id("test-intent"),
        token: ethers.ZeroAddress,
        amount: "100",
        durationSeconds: 86400,
      };

      const createEscrowFn = jest.fn() as jest.Mock & { estimateGas: jest.Mock };
      createEscrowFn.mockReturnValue({ wait: jest.fn().mockResolvedValue({}) });
      createEscrowFn.estimateGas = jest.fn().mockResolvedValue(BigInt(100000));

      const mockContract = {
        createEscrow: createEscrowFn,
      };

      jest.spyOn(paymentService as any, "getEscrowContract").mockReturnValue(mockContract);

      const result = await paymentService.estimateGas("ethereum", "createEscrow", params);

      expect(result).toHaveProperty("gasLimit", "100000");
      expect(result).toHaveProperty("gasPrice");
      expect(BigInt(result.gasLimit)).toBeGreaterThan(BigInt(0));
    });
  });

  describe("getSupportedTokens", () => {
    it("should return native token for chain", async () => {
      const mockContract = {
        getSupportedTokens: jest.fn().mockResolvedValue([ethers.ZeroAddress]),
      };

      jest.spyOn(paymentService as any, "getPaymentContract").mockReturnValue(mockContract);

      const tokens = await paymentService.getSupportedTokens("ethereum");
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0].address).toBe(ethers.ZeroAddress);
      expect(tokens[0].symbol).toBe("ETH");
    });

    it("should return empty array on error", async () => {
      // Mock the payment contract to throw an error
      jest
        .spyOn(paymentService as any, "getPaymentContract")
        .mockImplementation(() => {
          throw new Error("Contract not found");
        });

      const tokens = await paymentService.getSupportedTokens("ethereum");
      expect(tokens).toEqual([]);
    });
  });

  describe("getPaymentStatus", () => {
    it("should throw error if intent not found", async () => {
      const { prisma } = require("../src/utils/prisma");
      prisma.intent.findUnique.mockResolvedValue(null);

      await expect(paymentService.getPaymentStatus("invalid-id")).rejects.toThrow(
        "Intent not found"
      );
    });

    it("should return payment status for valid intent", async () => {
      const { prisma } = require("../src/utils/prisma");
      const mockIntent = {
        id: "intent-123",
        escrowId: "escrow-123",
        status: "OPEN",
        sourceAmount: "100",
        sourceToken: ethers.ZeroAddress,
        sourceChain: "ethereum",
        requester: {
          web3Address: "0x1234567890123456789012345678901234567890",
        },
        selectedSolverId: null,
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      prisma.intent.findUnique.mockResolvedValue(mockIntent);

      const status = await paymentService.getPaymentStatus("intent-123");

      expect(status.intentId).toBe("intent-123");
      expect(status.escrowId).toBe("escrow-123");
      expect(status.status).toBe("open");
      expect(status.amount).toBe("100");
    });
  });

  describe("refundPayment", () => {
    it("should raise dispute and update intent status", async () => {
      const escrowId = ethers.id("test-escrow");
      const reason = "Not satisfied with work";
      const chain = "ethereum";
      const mockTxHash = "0x" + "f".repeat(64);

      const mockContract = {
        raiseDispute: jest.fn().mockReturnValue({
          wait: jest.fn().mockResolvedValue({ hash: mockTxHash }),
        }),
        getEscrow: jest.fn().mockResolvedValue({
          status: BigInt(3),
          intentId: "intent-123",
        }),
      };

      jest.spyOn(paymentService as any, "getEscrowContract").mockReturnValue(mockContract);

      const { prisma } = require("../src/utils/prisma");
      prisma.intent.update.mockResolvedValue({
        id: "intent-123",
        status: "DISPUTED",
      });

      const txHash = await paymentService.refundPayment(escrowId, reason, chain);
      expect(txHash).toBe(mockTxHash);
      expect(prisma.intent.update).toHaveBeenCalledWith({
        where: { id: "intent-123" },
        data: { status: "DISPUTED" },
      });
    });
  });

  describe("Gas price spike detection", () => {
    it("should warn when gas price is 2x higher than average", async () => {
      const params = {
        intentId: ethers.id("test-intent"),
        token: ethers.ZeroAddress,
        amount: "100",
        durationSeconds: 86400,
      };

      const createEscrowFn = jest.fn() as jest.Mock & { estimateGas: jest.Mock };
      createEscrowFn.mockReturnValue({ wait: jest.fn().mockResolvedValue({}) });
      createEscrowFn.estimateGas = jest.fn().mockResolvedValue(BigInt(100000));

      const mockContract = {
        createEscrow: createEscrowFn,
      };

      jest.spyOn(paymentService as any, "getEscrowContract").mockReturnValue(mockContract);
      jest.spyOn(paymentService as any, "getAverageGasPrice").mockResolvedValue(BigInt(1));
      jest.spyOn(paymentService as any, "getProvider").mockReturnValue({
        getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(3) }),
        getBlockNumber: jest.fn().mockResolvedValue(100),
        destroy: jest.fn(),
        send: jest.fn(),
        detectNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
        getNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
      });

      const result = await paymentService.estimateGas("ethereum", "createEscrow", params);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain("higher than average");
    });

    it("should not warn when gas price is normal", async () => {
      const params = {
        intentId: ethers.id("test-intent"),
        token: ethers.ZeroAddress,
        amount: "100",
        durationSeconds: 86400,
      };

      const createEscrowFn = jest.fn() as jest.Mock & { estimateGas: jest.Mock };
      createEscrowFn.mockReturnValue({ wait: jest.fn().mockResolvedValue({}) });
      createEscrowFn.estimateGas = jest.fn().mockResolvedValue(BigInt(100000));

      const mockContract = {
        createEscrow: createEscrowFn,
      };

      jest.spyOn(paymentService as any, "getEscrowContract").mockReturnValue(mockContract);
      jest.spyOn(paymentService as any, "getAverageGasPrice").mockResolvedValue(BigInt(100));
      jest.spyOn(paymentService as any, "getProvider").mockReturnValue({
        getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(100) }),
        getBlockNumber: jest.fn().mockResolvedValue(100),
        destroy: jest.fn(),
        send: jest.fn(),
        detectNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
        getNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
      });

      const result = await paymentService.estimateGas("ethereum", "createEscrow", params);
      expect(result.warning).toBeUndefined();
    });
  });

  describe("USD conversion", () => {
    let originalContractMock: jest.Mock;

    beforeEach(() => {
      originalContractMock = ethers.Contract as jest.Mock;
    });

    afterEach(() => {
      (ethers.Contract as jest.Mock).mockImplementation(originalContractMock.getMockImplementation()!);
    });

    it("should convert ETH to USD using Chainlink price feed", async () => {
      const mockProvider = {
        getBlockNumber: jest.fn().mockResolvedValue(100),
        getFeeData: jest.fn().mockResolvedValue({ gasPrice: BigInt(1) }),
        destroy: jest.fn(),
        send: jest.fn(),
        detectNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
        getNetwork: jest.fn().mockResolvedValue({ name: "local", chainId: 1337 }),
      };

      jest.spyOn(paymentService as any, "getProvider").mockReturnValue(mockProvider);

      const mockPriceFeed = {
        latestRoundData: jest.fn().mockResolvedValue({
          roundId: BigInt(1),
          answer: BigInt(200000000000), // $2000 with 8 decimals
          startedAt: BigInt(Date.now() - 3600),
          updatedAt: BigInt(Date.now() - 60),
          answeredInRound: BigInt(1),
        }),
        decimals: jest.fn().mockResolvedValue(8),
      };

      (ethers.Contract as jest.Mock).mockImplementation(() => mockPriceFeed as any);

      const usd = await (paymentService as any).convertToUSD("ethereum", "1.0");
      expect(usd).toBe("2000.00");
    });

    it("should return 0.00 if price feed not available", async () => {
      // Test with chain that has no price feed configured
      const service = new PaymentService({
        ...mockConfig,
        priceFeedAddresses: {
          ethereum: {},
          polygon: {},
          arbitrum: {},
        },
      });

      const usd = await (service as any).convertToUSD("ethereum", "1.0");
      expect(usd).toBe("0.00");
    });
  });
});
