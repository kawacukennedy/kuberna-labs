import * as anchor from "@coral-xyz/anchor";
import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Kuberna Labs 18 Contracts", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.KubernaSolana as Program;
  const wallet = provider.wallet as anchor.Wallet;

  const ESCROW_SEED = "escrow";
  const INTENT_SEED = "intent";
  const BID_SEED = "bid";
  const CERT_SEED = "cert";
  const PAYMENT_SEED = "payment";
  const AGENT_SEED = "agent";
  const SUB_SEED = "sub";
  const DISPUTE_SEED = "dispute";
  const TREASURY_SEED = "treasury";
  const FEE_SEED = "fee";
  const WORKSHOP_SEED = "workshop";
  const COURSE_SEED = "course";
  const MULTISIG_SEED = "multisig";
  const VESTING_SEED = "vesting";
  const PROPOSAL_SEED = "proposal";
  const ORACLE_SEED = "oracle";
  const ATTESTATION_SEED = "attestation";
  const ROUTER_SEED = "router";
  const GOVERNANCE_SEED = "governance";
  const REPUTATION_SEED = "reputation";

  describe("1. Escrow Contract", () => {
    it("Create Escrow", async () => {
      const intentId = "escrow-test-1";
      const [escrowPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ESCROW_SEED), Buffer.from(intentId)],
        program.programId
      );
      const tx = await program.methods
        .createEscrow(intentId, new BN(1000000), new BN(86400))
        .accounts({
          escrow: escrowPubkey,
          requester: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Escrow created:", tx);
      const escrow = await program.account.escrow.fetch(escrowPubkey);
      assert.equal(escrow.requester.toString(), wallet.publicKey.toString());
      assert.equal(escrow.amount.toNumber(), 1000000);
    });

    it("Assign Executor", async () => {
      const intentId = "escrow-test-1";
      const [escrowPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ESCROW_SEED), Buffer.from(intentId)],
        program.programId
      );
      const executor = Keypair.generate().publicKey;
      const tx = await program.methods
        .assignExecutor(executor)
        .accounts({
          escrow: escrowPubkey,
          requester: wallet.publicKey,
        })
        .rpc();
      console.log("Executor assigned:", tx);
    });

    it("Complete Task", async () => {
      const intentId = "escrow-test-1";
      const [escrowPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ESCROW_SEED), Buffer.from(intentId)],
        program.programId
      );
      const proof = new Uint8Array(32).fill(1);
      const executor = Keypair.generate().publicKey;
      await program.methods
        .assignExecutor(executor)
        .accounts({ escrow: escrowPubkey, requester: wallet.publicKey })
        .rpc();
      const executorWallet = await provider.wallet;
      const executorKeypair = Keypair.generate();
      const tx = await program.methods
        .completeTask(proof)
        .accounts({
          escrow: escrowPubkey,
          executor: executorKeypair.publicKey,
        })
        .signers([executorKeypair])
        .rpc();
      console.log("Task completed:", tx);
    });
  });

  describe("2. Intent Contract", () => {
    it("Create Intent", async () => {
      const intentId = "intent-test-1";
      const [intentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(INTENT_SEED), Buffer.from(intentId)],
        program.programId
      );
      const tx = await program.methods
        .createIntent(intentId, new BN(5000000), "Test intent description")
        .accounts({
          intent: intentPubkey,
          requester: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Intent created:", tx);
      const intent = await program.account.intent.fetch(intentPubkey);
      assert.equal(intent.requester.toString(), wallet.publicKey.toString());
    });

    it("Submit Bid", async () => {
      const intentId = "intent-test-1";
      const [intentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(INTENT_SEED), Buffer.from(intentId)],
        program.programId
      );
      const bidId = "bid-1";
      const [bidPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(BID_SEED), Buffer.from(bidId)],
        program.programId
      );
      const agent = Keypair.generate();
      const tx = await program.methods
        .submitBid(bidId, new BN(4500000), new BN(86400))
        .accounts({
          intent: intentPubkey,
          bid: bidPubkey,
          agent: agent.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent])
        .rpc();
      console.log("Bid submitted:", tx);
    });
  });

  describe("3. Certificate Contract", () => {
    it("Mint Certificate", async () => {
      const recipient = Keypair.generate().publicKey;
      const courseId = "course-101";
      const [certPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(CERT_SEED), recipient.toBuffer(), Buffer.from(courseId)],
        program.programId
      );
      const tx = await program.methods
        .mintCertificate(courseId, recipient, "https://metadata.json")
        .accounts({
          certificate: certPubkey,
          authority: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Certificate minted:", tx);
    });
  });

  describe("4. Payment Contract", () => {
    it("Process Payment", async () => {
      const [paymentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(PAYMENT_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const recipient = Keypair.generate().publicKey;
      const tx = await program.methods
        .processPayment(recipient, new BN(100000), "USDC")
        .accounts({
          payment: paymentPubkey,
          sender: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Payment processed:", tx);
    });
  });

  describe("5. Agent Contract", () => {
    it("Register Agent", async () => {
      const [agentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGENT_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .registerAgent("Test Agent", "AI Agent for testing", "GPT-4")
        .accounts({
          agent: agentPubkey,
          owner: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Agent registered:", tx);
    });

    it("Update Agent Status", async () => {
      const [agentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGENT_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods.updateAgentStatus(1).accounts({
        agent: agentPubkey,
        owner: wallet.publicKey,
      }).rpc();
      console.log("Agent status updated:", tx);
    });
  });

  describe("6. Subscription Contract", () => {
    it("Create Subscription", async () => {
      const [subPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(SUB_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .createSubscription(1, new BN(9999))
        .accounts({
          subscription: subPubkey,
          subscriber: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Subscription created:", tx);
    });

    it("Cancel Subscription", async () => {
      const [subPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(SUB_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods.cancelSubscription().accounts({
        subscription: subPubkey,
        subscriber: wallet.publicKey,
      }).rpc();
      console.log("Subscription cancelled:", tx);
    });
  });

  describe("7. Dispute Contract", () => {
    it("Raise Dispute", async () => {
      const intentId = "dispute-test-1";
      const [intentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(INTENT_SEED), Buffer.from(intentId)],
        program.programId
      );
      await program.methods
        .createIntent(intentId, new BN(5000000), "Dispute test")
        .accounts({
          intent: intentPubkey,
          requester: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const [disputePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(DISPUTE_SEED), intentPubkey.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .raiseDispute("Payment not received")
        .accounts({
          dispute: disputePubkey,
          task: intentPubkey,
          raiser: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Dispute raised:", tx);
    });
  });

  describe("8. Treasury Contract", () => {
    it("Fund Treasury", async () => {
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(TREASURY_SEED)],
        program.programId
      );
      const tx = await program.methods
        .fundTreasury(new BN(10000000))
        .accounts({
          treasury: treasuryPubkey,
          funder: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Treasury funded:", tx);
    });

    it("Withdraw Treasury", async () => {
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(TREASURY_SEED)],
        program.programId
      );
      const recipient = Keypair.generate().publicKey;
      const tx = await program.methods
        .withdrawTreasury(recipient, new BN(1000000))
        .accounts({
          treasury: treasuryPubkey,
          owner: wallet.publicKey,
        })
        .rpc();
      console.log("Treasury withdrawn:", tx);
    });
  });

  describe("9. FeeManager Contract", () => {
    it("Set Fee", async () => {
      const [feePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(FEE_SEED)],
        program.programId
      );
      const tx = await program.methods
        .setFee(0, new BN(250))
        .accounts({
          fee: feePubkey,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Fee set:", tx);
    });

    it("Collect Fee", async () => {
      const [feePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(FEE_SEED)],
        program.programId
      );
      const tx = await program.methods
        .collectFee(new BN(1000000))
        .accounts({
          fee: feePubkey,
        })
        .rpc();
      console.log("Fee collected:", tx);
    });
  });

  describe("10. Workshop Contract", () => {
    it("Create Workshop", async () => {
      const [workshopPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(WORKSHOP_SEED), Buffer.from("Solidity 101")],
        program.programId
      );
      const tx = await program.methods
        .createWorkshop("Solidity 101", 50)
        .accounts({
          workshop: workshopPubkey,
          instructor: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Workshop created:", tx);
    });
  });

  describe("11. CourseNFT Contract", () => {
    it("Mint Course Access", async () => {
      const recipient = Keypair.generate().publicKey;
      const courseId = "advanced-solidity";
      const [coursePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(COURSE_SEED), recipient.toBuffer(), Buffer.from(courseId)],
        program.programId
      );
      const tx = await program.methods
        .mintCourseAccess(courseId, recipient)
        .accounts({
          course: coursePubkey,
          authority: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Course access minted:", tx);
    });
  });

  describe("12. Multisig Contract", () => {
    it("Create Multisig", async () => {
      const [multisigPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(MULTISIG_SEED)],
        program.programId
      );
      const owners = [
        wallet.publicKey,
        Keypair.generate().publicKey,
        Keypair.generate().publicKey,
      ];
      const tx = await program.methods
        .createMultisig(2)
        .accounts({
          multisig: multisigPubkey,
          owners: owners.map((o) => ({ isSigner: false, isWritable: false, key: o })),
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Multisig created:", tx);
    });
  });

  describe("13. Vesting Contract", () => {
    it("Create Vesting", async () => {
      const beneficiary = Keypair.generate().publicKey;
      const [vestingPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(VESTING_SEED), beneficiary.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .createVesting(beneficiary, new BN(100000000), new BN(365 * 86400))
        .accounts({
          vesting: vestingPubkey,
          funder: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Vesting created:", tx);
    });
  });

  describe("14. Governance Contract", () => {
    it("Create Proposal", async () => {
      const [proposalPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(PROPOSAL_SEED), Buffer.from("Update fee structure")],
        program.programId
      );
      const tx = await program.methods
        .createProposal("Update fee structure")
        .accounts({
          proposal: proposalPubkey,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Proposal created:", tx);
    });

    it("Vote on Proposal", async () => {
      const [proposalPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(PROPOSAL_SEED), Buffer.from("Update fee structure")],
        program.programId
      );
      const tx = await program.methods.vote(true).accounts({
        proposal: proposalPubkey,
        voter: wallet.publicKey,
      }).rpc();
      console.log("Vote cast:", tx);
    });
  });

  describe("15. PriceOracle Contract", () => {
    it("Set Price", async () => {
      const [oraclePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ORACLE_SEED)],
        program.programId
      );
      const tx = await program.methods
        .setPrice(new BN(45000))
        .accounts({
          oracle: oraclePubkey,
          updater: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Price set:", tx);
    });

    it("Get Price", async () => {
      const [oraclePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ORACLE_SEED)],
        program.programId
      );
      const price = await program.methods.getPrice().accounts({
        oracle: oraclePubkey,
      }).view();
      console.log("Current price:", price.toString());
      assert(price.toNumber() > 0);
    });
  });

  describe("16. Attestation Contract", () => {
    it("Create Attestation", async () => {
      const [attestationPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ATTESTATION_SEED), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .createAttestation("KYC", '{"verified": true}')
        .accounts({
          attestation: attestationPubkey,
          issuer: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Attestation created:", tx);
    });
  });

  describe("17. CrossChainRouter Contract", () => {
    it("Set Remote Chain", async () => {
      const chainId = 1;
      const [routerPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(ROUTER_SEED), Buffer.from([0, 0, 0, 1])],
        program.programId
      );
      const remoteRouter = Keypair.generate().publicKey;
      const tx = await program.methods
        .setRemoteChain(chainId, remoteRouter)
        .accounts({
          router: routerPubkey,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Remote chain configured:", tx);
    });
  });

  describe("18. GovernanceToken Contract", () => {
    it("Init Governance Token", async () => {
      const [govPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GOVERNANCE_SEED)],
        program.programId
      );
      const mint = Keypair.generate().publicKey;
      const tx = await program.methods
        .initGovernanceToken(mint)
        .accounts({
          governance: govPubkey,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Governance initialized:", tx);
    });

    it("Stake Tokens", async () => {
      const [govPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(GOVERNANCE_SEED)],
        program.programId
      );
      const [stakePubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("stake"), wallet.publicKey.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .stakeTokens(new BN(10000))
        .accounts({
          governance: govPubkey,
          stake: stakePubkey,
          owner: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Tokens staked:", tx);
    });
  });

  describe("19. ReputationNFT Contract", () => {
    it("Register Agent Reputation", async () => {
      const agent = Keypair.generate().publicKey;
      const [repPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
        program.programId
      );
      const tx = await program.methods
        .registerAgentReputation(agent)
        .accounts({
          reputation: repPubkey,
          admin: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Reputation registered:", tx);
    });

    it("Update Agent Reputation", async () => {
      const agent = Keypair.generate().publicKey;
      const [agentPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGENT_SEED), agent.toBuffer()],
        program.programId
      );
      await program.methods
        .registerAgent("Reputation Agent", "Test agent", "GPT-4")
        .accounts({
          agent: agentPubkey,
          owner: agent,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .signers([agent as unknown as anchor.web3.Keypair])
        .rpc();

      const [repPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from(REPUTATION_SEED), agent.toBuffer()],
        program.programId
      );
      await program.methods
        .registerAgentReputation(agent)
        .accounts({
          reputation: repPubkey,
          admin: wallet.publicKey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const tx = await program.methods
        .updateAgentReputation(true, 120)
        .accounts({
          reputation: repPubkey,
          agent: agentPubkey,
          clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        })
        .rpc();
      console.log("Reputation updated:", tx);
    });
  });
});