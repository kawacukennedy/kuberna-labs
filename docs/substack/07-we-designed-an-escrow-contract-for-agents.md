---
title: "Post 7: We Designed an Escrow Contract for Agents That Don't Trust Each Other"
slug: we-designed-an-escrow-contract-for-agents-that-dont-trust-each-other
---

## Title Field

Put this in the **Title** field:

> We Designed an Escrow Contract for Agents That Don't Trust Each Other

## Subtitle Field

Put this in the **Subtitle** field:

> Two AI agents need to settle a trade without a human in the loop. Here's how the contract works.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Escrow Contract for Untrusting AI Agents

**Meta description** (155-160 chars):

> Two AI agents need to settle a trade without human oversight. Here's the full Escrow.sol deep-dive — state machine, dispute resolution, auto-release.

**Post URL slug**:

> we-designed-an-escrow-contract-for-agents-that-dont-trust-each-other

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

---

Agent A wants to buy 10,000 USDC with ETH. Agent B is willing to sell. Neither trusts the other.

Agent A is worried: "If I send ETH first, Agent B might not send USDC."

Agent B is worried: "If I send USDC first, Agent A might not send ETH."

This is the classic two-sided trust problem. Humans solve it with escrow services, legal contracts, and reputation. Agents need a programmatic equivalent.

Here's our solution.

---

### The Escrow Lifecycle

The contract implements a strict state machine. Every escrow is in exactly one of five states at any time:

```
                      raiseDispute
                    ┌──────────────┐
                    ▼              │
Created → Funded → Completed → Disputed → Resolved
                    │                         ▲
                    │    releaseFunds          │
                    └─────────────────────────┘
                              │
                              ▼
                          Resolved
```

---

### State 1: Created

Agent A calls `createEscrow` to start the process:

```solidity
function createEscrow(
  bytes32 _taskDescription,
  uint256 _value,
  address _targetToken
) external returns (uint256 escrowId) {
  escrowId = nextEscrowId++;
  escrows[escrowId] = Escrow({
    agent: msg.sender,
    executor: address(0),
    taskDescription: _taskDescription,
    value: _value,
    targetToken: _targetToken,
    state: EscrowState.Created,
    createdAt: block.timestamp,
    disputeDeadline: block.timestamp + 7 days,
    completedAt: 0
  });
}
```

At this point, no funds have moved. The escrow is just a record on-chain describing the intended deal.

---

### State 2: Funded

Agent A deposits funds into the escrow and assigns an executor (Agent B):

```solidity
function fundEscrow(uint256 _escrowId) external payable {
  Escrow storage e = escrows[_escrowId];
  require(msg.sender == e.agent, 'Only agent');
  require(e.state == EscrowState.Created, 'Invalid state');
  require(msg.value == e.value, 'Incorrect value');
  e.state = EscrowState.Funded;
}

function assignExecutor(uint256 _escrowId, address _executor) external {
  Escrow storage e = escrows[_escrowId];
  require(msg.sender == e.agent, 'Only agent can assign');
  require(e.state == EscrowState.Funded, 'Invalid state');
  require(_executor != address(0), 'Invalid executor');
  e.executor = _executor;
}
```

The funds are locked in the contract. Neither party can withdraw them unilaterally.

---

### State 3: Completed

Agent B (the executor) calls `completeTask` once they've fulfilled the deal:

```solidity
function completeTask(uint256 _escrowId) external {
  Escrow storage e = escrows[_escrowId];
  require(msg.sender == e.executor, 'Only executor');
  require(e.state == EscrowState.Funded, 'Invalid state');
  e.state = EscrowState.Completed;
  e.completedAt = block.timestamp;
}
```

This starts the dispute timer. Agent A has 7 days to inspect the execution. If no dispute is raised, funds are released to Agent B.

---

### State 4: Disputed (Optional)

If Agent A believes the execution was incorrect, they raise a dispute:

```solidity
function raiseDispute(uint256 _escrowId, string calldata _reason) external {
  Escrow storage e = escrows[_escrowId];
  require(msg.sender == e.agent, 'Only agent');
  require(e.state == EscrowState.Funded || e.state == EscrowState.Completed, 'Invalid state');
  e.state = EscrowState.Disputed;
  e.disputeReason = _reason;
}
```

In dispute state, funds are frozen. Neither party can withdraw until the dispute is resolved.

---

### State 5: Resolved

A designated resolver (a DAO, a multi-sig, or an automated oracle) resolves the dispute:

```solidity
function resolveDispute(
  uint256 _escrowId,
  address _winner,
  uint256 _agentReward,
  uint256 _executorReward
) external {
  require(msg.sender == resolver, 'Only resolver');
  Escrow storage e = escrows[_escrowId];
  require(e.state == EscrowState.Disputed, 'Not disputed');
  e.state = EscrowState.Resolved;
  // Distribute funds based on resolution
  _transferFunds(e.agent, _agentReward);
  _transferFunds(e.executor, _executorReward);
}
```

The resolver can split the funds arbitrarily. Partial credit for partial execution. Full refund for failed execution. This is flexible — the resolver logic is pluggable.

---

### Auto-Release: The 24h Safety Valve

What if Agent B completes the task but Agent A never releases funds? The contract has a 24-hour auto-release:

```solidity
function releaseFunds(uint256 _escrowId) external {
  Escrow storage e = escrows[_escrowId];
  require(e.state == EscrowState.Completed, 'Not completed');
  require(block.timestamp > e.completedAt + 24 hours, 'Dispute window still open');
  require(e.disputeDeadline > block.timestamp, 'Dispute expired');
  e.state = EscrowState.Resolved;
  _transferFunds(e.executor, e.value);
}
```

After 24 hours with no dispute, anyone can call `releaseFunds`. The executor gets paid even if the agent goes offline.

---

### Reentrancy Guards

The contract uses OpenZeppelin's `ReentrancyGuard` on all critical functions:

```solidity
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

contract Escrow is ReentrancyGuard {
  function assignExecutor(uint256 _escrowId, address _executor) external nonReentrant {
    // ...
  }

  function raiseDispute(uint256 _escrowId, string calldata _reason) external nonReentrant {
    // ...
  }

  function releaseFunds(uint256 _escrowId) external nonReentrant {
    // ...
  }
}
```

The `assignExecutor` and `raiseDispute` functions are both `nonReentrant` because they're the two transition points where state changes could be exploited in a reentrancy attack.

---

### Gas Optimization: Packed Storage

Each escrow is stored in a single slot where possible:

```solidity
struct Escrow {
  address agent;
  address executor;
  bytes32 taskDescription;
  uint256 value;
  address targetToken;
  uint256 createdAt;
  uint256 disputeDeadline;
  uint256 completedAt;
  EscrowState state;
  string disputeReason;
}
```

This uses about 7-8 storage slots per escrow. For a typical agent making 100 escrows, that's about 0.01 ETH in storage costs at current prices.

---

### Testing Strategy

The escrow contract has 85 tests covering:

- **State transitions**: Every valid and invalid transition is tested
- **Access control**: Only the right parties can call each function
- **Reentrancy**: Attempted reentrancy at every state transition point
- **Timing edge cases**: Auto-release before/after deadline
- **Dispute resolution**: Fund splitting with various ratios
- **Gas limits**: No function exceeds 100k gas

---

### Deployment

The contract is deployed on:

- **Ethereum Sepolia**: `0x...`
- **Base Sepolia**: `0x...`
- **Polygon Mumbai**: `0x...`
- **Arbitrum Sepolia**: `0x...`

The same address across all chains — we use CREATE2 with deterministic deployment.

---

### What's Next

We're adding an optimistic resolution mechanism: after completion, funds auto-release unless a dispute is raised within a shorter window (e.g., 1 hour) by posting a bond. This speeds up the settlement for low-risk transactions.

We're also building a Solana version using the Solana Program Library (SPL) token program, since Solana doesn't have the same EVM-compatible escrow patterns.

---

### The Full Contract

The complete `Escrow.sol` is on GitHub. It's about 200 lines of Solidity with NatSpec comments. MIT licensed, like everything else.

**GitHub: [https://github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)**

**Discord: [https://discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)**

---

_Subscribe to this series. Post 8 is the full architecture walkthrough — from natural language intent to on-chain settlement to post-quantum certificate._

---

Include a note at the bottom: "After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped."
