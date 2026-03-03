import { expect } from "chai";
import hre from "hardhat";

describe("Smart Contracts", function () {
  it("Escrow: should deploy", async function () {
    const Escrow = await hre.ethers.getContractFactory("KubernaEscrow");
    const escrow = await Escrow.deploy();
    const addr = await escrow.getAddress();
    console.log("Escrow deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("Intent: should deploy", async function () {
    const Intent = await hre.ethers.getContractFactory("KubernaIntent");
    const intent = await Intent.deploy();
    const addr = await intent.getAddress();
    console.log("Intent deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("AgentRegistry: should deploy", async function () {
    const Registry = await hre.ethers.getContractFactory(
      "KubernaAgentRegistry",
    );
    const registry = await Registry.deploy();
    const addr = await registry.getAddress();
    console.log("AgentRegistry deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("CertificateNFT: should deploy", async function () {
    const Certificate = await hre.ethers.getContractFactory(
      "KubernaCertificateNFT",
    );
    const certificate = await Certificate.deploy();
    const addr = await certificate.getAddress();
    console.log("CertificateNFT deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("ReputationNFT: should deploy", async function () {
    const Reputation = await hre.ethers.getContractFactory("ReputationNFT");
    const reputation = await Reputation.deploy();
    const addr = await reputation.getAddress();
    console.log("ReputationNFT deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("Payment: should deploy", async function () {
    const Payment = await hre.ethers.getContractFactory("KubernaPayment");
    const payment = await Payment.deploy();
    const addr = await payment.getAddress();
    console.log("Payment deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("Subscription: should deploy", async function () {
    const Subscription = await hre.ethers.getContractFactory(
      "KubernaSubscription",
    );
    const subscription = await Subscription.deploy();
    const addr = await subscription.getAddress();
    console.log("Subscription deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });

  it("Dispute: should deploy", async function () {
    const Dispute = await hre.ethers.getContractFactory("KubernaDispute");
    const dispute = await Dispute.deploy();
    const addr = await dispute.getAddress();
    console.log("Dispute deployed to:", addr);
    expect(addr.startsWith("0x")).to.be.true;
  });
});
