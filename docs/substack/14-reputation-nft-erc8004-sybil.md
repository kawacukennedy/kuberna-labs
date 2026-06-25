---
title: 'Post 14: The Reputation NFT — On-Chain Agent Scoring That Fights Sybil Attacks'
slug: reputation-nft-erc8004-sybil
---

## Title Field

Put this in the **Title** field:

> The Reputation NFT: On-Chain Agent Scoring That Fights Sybil Attacks

## Subtitle Field

Put this in the **Subtitle** field:

> Success rate tracking, time-based decay, badge system, stake-weighted scoring — how to make agent reputation hard to game.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> On-Chain Agent Reputation: ERC-8004 & Sybil Resistance

**Meta description** (155-160 chars):

> How Kuberna Labs implements ERC-8004 aligned reputation NFTs with success tracking, time decay, stake-weighted voting, and a badge system for verified agent behavior.

**Post URL slug**:

> reputation-nft-erc8004-sybil

## Body

Put this in the main body editor. Use Substack formatting (headings, bold, code blocks, etc.):

Reputation is the hardest engineering problem in any decentralized system. It's easy to track scores. It's hard to make scores _mean something_ — to make them resistant to Sybil attacks, collusion, and gaming.

Kuberna Labs' reputation system is built around a Reputation NFT (rNFT). Not just a score on a website. An on-chain token that encodes an agent's entire execution history, weighted by time, stake, and verified behavior.

Let's walk through the architecture.

---

### ERC-8004 Alignment

ERC-8004 is a proposed standard for reputation tokens on Ethereum. The core idea: reputation should be non-transferable, have controlled minting, support time-weighted scoring, and provide on-chain verification.

Our rNFT follows ERC-8004 with some modifications for the agent context:

| ERC-8004 Feature      | Kuberna Implementation                              |
| --------------------- | --------------------------------------------------- |
| Non-transferable      | rNFT is soulbound — can't be sold or transferred    |
| Controlled minting    | Only the Kuberna reputation contract can mint/burn  |
| Time-weighted scoring | Score = weighted average over rolling 90-day window |
| Off-chain verifiable  | All scores derivable from on-chain execution events |
| Delegated scoring     | Stake-weighted delegation for solver network        |

The contract inherits from an ERC-8004 reference implementation:

```solidity
contract KubernaReputation is ERC8004, AccessControl {
  using SafeCast for uint256;

  bytes32 public constant SOLVER_ROLE = keccak256('SOLVER_ROLE');

  struct Score {
    uint256 totalExecutions;
    uint256 successfulExecutions;
    uint256 totalVolume;
    uint256 lastUpdate;
    uint256 stakeAmount;
  }

  mapping(address => Score) public scores;

  function currentScore(address agent) public view returns (uint256) {
    Score memory s = scores[agent];
    uint256 successRate = s.totalExecutions == 0
      ? 0
      : (s.successfulExecutions * 1e18) / s.totalExecutions;

    uint256 timeDecay = _timeDecayFactor(s.lastUpdate);
    uint256 stakeBonus = _stakeBonus(s.stakeAmount, s.totalVolume);

    return _weightedScore(successRate, timeDecay, stakeBonus);
  }
}
```

---

### Scoring Mechanics

The final score is a weighted combination of three factors:

#### 1. Success Rate (60% weight)

Simple formula: `successfulExecutions / totalExecutions`.

But "success" isn't binary. It's graded:

- **Complete success** (1.0): Agent executed the intent exactly as quoted
- **Minor slippage** (0.85): Price slipped within tolerance (configurable, default 2%)
- **Partial fill** (0.5): Only part of the intent executed
- **Failure** (0.0): Intent reverted or timed out
- **Fraud** (-1.0): Attestation failed, dispute won against the agent

A single fraud event drops the success rate below zero. It takes roughly 20 perfect executions to recover.

#### 2. Time-Based Decay (25% weight)

Old executions shouldn't matter as much as recent ones. The decay function halves the contribution of an execution every 30 days:

```solidity
function _timeDecayFactor(uint256 lastUpdate) internal view returns (uint256) {
  uint256 daysSinceUpdate = (block.timestamp - lastUpdate) / 1 days;
  // Half-life of 30 days
  uint256 decay = (1e18 * 1e18) / (1e18 + (daysSinceUpdate * 1e18) / 30);
  return decay;
}
```

After 90 days, an execution contributes roughly 12.5% of its original weight. After 180 days, it's negligible. This means agents can't coast on old reputation — they need to keep executing.

#### 3. Percentile Rank (15% weight)

Raw scores are hard to interpret. Is 850 good? What's the mean?

The percentile rank normalizes scores against the entire agent population. A score at the 90th percentile means the agent outperforms 90% of peers.

The contract maintains an ordered list of scores using a balanced tree structure (we use a modified version of Aave's lending pool ordering). Querying rank is O(log n):

```solidity
function percentile(address agent) external view returns (uint256) {
  uint256 total = totalAgents();
  uint256 rank = scoreTree.rank(scores[agent].compositeScore);
  return (rank * 1e18) / total;
}
```

---

### Anti-Sybil Mechanisms

Here's where things get interesting. A naive reputation system can be gamed by creating 1000 agents, having them execute intents for each other, and inflating scores.

Kuberna uses three anti-Sybil layers:

#### 1. Stake-Weighted Voting

When an agent participates in the solver network, scoring isn't just based on execution count. It's weighted by **stake**:

```typescript
const effectiveScore = reputation.getScore(solverId) * Math.log2(solverStake / MIN_STAKE + 1);
```

An agent staking 10 ETH gets a ~4.3x score multiplier vs. an agent staking the minimum. This makes it expensive to run many low-stake Sybils. The math works out: spinning up 100 Sybils with minimum stake gives the same effective score as one agent with 100x minimum stake — but costs roughly the same in capital. There's no advantage to fragmentation.

#### 2. Minimum Bond

To submit execution results, an agent must lock a minimum bond in the escrow contract. The bond amount scales with the intent value:

```solidity
function requiredBond(address agent, uint256 intentValue) public view returns (uint256) {
  uint256 score = currentScore(agent);
  uint256 baseBond = (intentValue * BOND_PERCENT) / 100;
  // High-score agents need smaller bonds
  uint256 discount = (score * baseBond) / MAX_SCORE;
  return baseBond - discount;
}
```

New agents with zero score post a 100% bond. Agents with perfect scores post as little as 10%. This creates a natural incentive to build and maintain reputation — it directly reduces capital requirements.

#### 3. Execution Cooldown

New agents face a cooldown between executions:

```
Agent age < 7 days:   24 hour cooldown between intents
Agent age < 30 days:  6 hour cooldown
Agent age < 90 days:  1 hour cooldown
Agent age > 90 days:  No cooldown (but subject to rate limiting)
```

This prevents Sybil attacks where an attacker spins up thousands of agents and runs them all in one hour. The cooldown is enforced at the contract level.

---

### Badge System

Beyond the raw score, agents can earn **badges** — non-transferable NFTs representing verified behaviors:

| Badge               | Requirement                    | On-Chain           |
| ------------------- | ------------------------------ | ------------------ |
| Genesis             | First successful execution     | ✅                 |
| Iron Solver         | 100 successful intents         | ✅                 |
| Diamond Solver      | 1000 successful intents        | ✅                 |
| TEE Guardian        | All executions TEE-attested    | ✅                 |
| No-Slip Performer   | 50 intents with <0.5% slippage | ✅                 |
| Cross-Chain Pioneer | Executed on 5+ chains          | ✅                 |
| Early Adopter       | Active before 2027             | ✅                 |
| Community Voted     | Nominated by other agents      | Off-chain + oracle |

Badges are displayed in the agent's on-chain profile and used as tiebreakers in solver selection. All else equal, a TEE Guardian badge beats no badge.

---

### On-Chain vs. Off-Chain Reputation

There's a genuine debate in the community about how much reputation data should live on-chain.

**On-chain pros:**

- Fully transparent and verifiable
- No dependency on off-chain databases
- Composability (other contracts can read scores)
- Permanent and censorship-resistant

**On-chain cons:**

- Storage is expensive (each execution update costs gas)
- Hard to update (contract upgrades need governance)
- Limited computation (complex scoring is expensive)
- Privacy concerns (all scores are public)

Kuberna takes a **hybrid approach**:

- Core scores and badges live on-chain
- Detailed execution history (each intent, quotes, timing) lives on IPFS with on-chain hash pointers
- Real-time score derivatives (rolling averages, trends) are computed off-chain and optionally posted

The on-chain score is the source of truth. The off-chain data provides context. If there's a dispute, the off-chain data can be reconstructed from events and verified against the on-chain hash.

---

### Practical Example

Here's how reputation feeds into a real solver selection:

```typescript
const solvers = await network.getAvailableSolvers(intent);

const ranked = solvers
  .map((s) => ({
    ...s,
    reputation: await reputation.currentScore(s.address),
    percentile: await reputation.percentile(s.address),
    badges: await reputation.getBadges(s.address),
  }))
  .sort((a, b) => b.reputation - a.reputation);

// Top 3 solvers by reputation
console.log(ranked.slice(0, 3));

// Agent can also filter by minimum requirements
const qualified = ranked.filter(
  (s) =>
    s.percentile > 0.8 && // top 20%
    s.badges.includes('TEE_GUARDIAN')
);
```

The SDK wraps all of this. Your agent just calls `agent.selectSolver(intent)` and gets back a ranked list with scores and badges attached.

---

The full reputation contract and SDK integration are [on GitHub](https://github.com/kawacukennedy/kuberna-labs) under MIT license. The ERC-8004 reference implementation is in `contracts/reputation/`. We're actively discussing improvements in the [Discord](https://discord.gg/MZvNuhpXu) — the #reputation channel has been debating decay curves and Sybil resistance all month.

**Subscribe to this series** — Post 15 covers circuit breaker patterns for production AI systems: how to keep your agent running when LLMs start failing.

---

After posting, go to **Settings → Publication** and add the series name under 'Series' so all posts are grouped.
