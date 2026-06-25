---
title: 'Post 30: The Custody Contradiction — Why Your Agent Should Never Hold Your Keys'
slug: custody-contradiction-agent-keys
---

## Title Field

Put this in the **Title** field:

> The Custody Contradiction: Why Your Agent Should Never Hold Your Keys

## Subtitle Field

Put this in the **Subtitle** field:

> Self-custody for agents is an oxymoron. The key must be accessible where the agent runs, which means it's accessible to attackers.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Custody contradiction — agents should never hold private keys

**Meta description** (155-160 chars):

> Self-custody for agents is impossible. Keys accessible to running agents are accessible to attackers. Intent-based execution and spending sessions solve this.

**Post URL slug**:

> custody-contradiction-agent-keys

## Body

Put this in the main body editor:

There's a fundamental contradiction at the heart of agent security that nobody talks about enough.

To custody its own funds, an agent must hold a private key. To use that key, it must be accessible in memory where the agent executes. If it's accessible to the agent, it's accessible to anyone who compromises the agent.

This is not a solvable problem at the key management level. It's a solvable problem at the **authorization model** level.

---

### The Contradiction, Stated Formally

- **Premise 1:** An agent must be able to sign transactions to execute on-chain actions.
- **Premise 2:** A private key that is accessible to running code can be extracted by any attacker who compromises that code.
- **Premise 3:** Agents run on infrastructure (cloud VMs, serverless functions, edge containers) that is susceptible to compromise.
- **Conclusion:** A self-custody model where the agent holds the key is fundamentally insecure.

This isn't a flaw in any specific implementation. It's a property of the architecture. As long as the key is in the process's memory, it's extractable.

---

### The Existing Solutions (and Why They Don't Work for Agents)

**MPC (Multi-Party Computation).** Splits the key across multiple parties. The agent holds one share; a backup service holds another. Signing requires both.

The problem: if the agent is compromised, the attacker can use the agent's share to request signatures. They'll get the second share from the backup service if they control the agent's session. MPC protects against offline compromise of a single node. It doesn't protect against runtime compromise of the agent.

**Multisig.** Requires M-of-N signatures. The agent has one key; the operator has another.

The problem: every transaction requires the operator to co-sign. This kills autonomy. If the operator automates co-signing (which they will, for a high-frequency agent), you've recreated the single-key problem with extra steps.

**Social recovery.** A guardian set can rotate the key if compromised.

The problem: detection and response time. An agent can drain its entire balance in seconds. Social recovery takes hours or days. The agent needs to be stopped before the guardian set can meet. There's no mechanism for pausing a compromised agent.

**HSMs (Hardware Security Modules).** The key lives in dedicated hardware. Signing requests go to the HSM.

The problem: HSMs authenticate requests by their source. If the agent is compromised, the attacker sends signing requests that the HSM honors. The HSM proves the key wasn't extracted. The HSM does not prove the request was legitimate.

---

### The Intent-Based Alternative

The solution is not better key management. The solution is to change the authorization model.

Instead of the agent holding a key and signing transactions, the agent submits **intents** to a protocol that authorizes execution based on policy. The key lives off-chain, in a secure environment controlled by the operator. The agent never touches it.

Here's the flow in Kuberna:

1. **Operator creates a spending policy.** "This agent can spend up to 10,000 USDC, on these chains, with these tokens, through these protocols." Signed once by the operator's key.

2. **Agent submits intents.** "Swap 1 ETH for USDC on Arbitrum." No key needed. The intent is verified against the policy.

3. **Execution layer evaluates.** The escrow contract checks: does this intent fall within the agent's authorized policy? Is the agent's certificate valid and unexpired? Is the agent's reputation above the minimum threshold?

4. **Execution is funded from the policy.** Not from the agent's wallet. The policy pre-funds an escrow that the execution layer draws from.

5. **Proof is emitted.** The execution, the policy check, and the attestation are all recorded on-chain.

The agent never signs anything. The agent never holds a key. The agent is an **intent proposer**, not a transaction signer.

---

### How Spending Sessions Solve This (x402 Example)

The x402 payment protocol we covered in Post 25 is a concrete implementation of intent-based authorization.

The operator creates a spending session with a budget and scope. The agent receives a session key that can only spend within those bounds. The session key is stored in the agent's runtime environment.

If the agent is compromised:

- The attacker can spend up to the remaining budget (capped)
- The operator can revoke the session on-chain instantly
- The operator's primary key is never exposed
- The agent's past execution history is unaffected

Compare this to a compromised private key:

- Attacker can spend everything
- No revocation mechanism
- Primary key is exposed (must be rotated)
- Past signatures may be forged (if ECDSA, see Post 28)

Spending sessions are a **blast radius control** mechanism. They don't prevent compromise. They limit the damage and provide recovery.

---

### What About Agents That Need to Receive?

Some people ask: "But what if other agents need to send funds to my agent? Don't they need an address?"

Yes, but there's a distinction between a **receiving address** and a **signing key**. Your agent can have a receiving address (derived from the operator's key, or a dedicated deposit address) without the agent holding the corresponding private key.

When funds arrive, the agent can submit an intent to use them. The execution layer moves them from the receiving address to the escrow, then executes. The agent never signs the withdrawal.

This is exactly how Kuberna's escrow contract works. Agents have deposit addresses. The operator pre-funds them or configures automated funding. The agent only submits intents, never signs withdrawals.

---

### The Architecture Summary

| Model                  | Key Location          | Blast Radius      | Recovery           | Autonomy |
| ---------------------- | --------------------- | ----------------- | ------------------ | -------- |
| Agent holds key        | In process            | Unlimited         | None               | Full     |
| MPC                    | Split across parties  | Session-limited   | Slow               | Partial  |
| Multisig               | Agent + operator      | Operator can veto | Fast               | Low      |
| HSM                    | Hardware              | Request-limited   | Fast               | High     |
| Intent-based (Kuberna) | Operator's secure env | Policy-capped     | Instant revocation | Full     |

Intent-based execution is the only model that gives full autonomy without unlimited blast radius.

---

### This Is What Kuberna Is Built On

The entire Kuberna architecture is designed around this principle. Agents don't hold keys. They hold session credentials, policy references, and intent formation logic.

- **Escrow contracts** enforce spending policies on-chain
- **TEE attestation** proves the intent wasn't tampered with
- **SilentVerify certificates** prove agent identity without the agent holding a signing key
- **x402 payments** use session keys with bounded spending

The agent is autonomous without being sovereign over keys. That's the design goal.

---

### What You Should Do

If your agent currently has a private key in an `.env` file, here's the migration path:

1. **Add a spending policy.** Define max amounts, allowed chains, allowed operations. Enforce it in your execution layer, not just in your agent's code.

2. **Use an escrow contract.** Instead of the agent signing direct transfers, the agent submits intents to an escrow. The escrow enforces the policy.

3. **Remove the private key from the agent.** Replace it with a session credential or policy reference. The key lives with the operator, in a secure environment (hardware wallet, HSM, or air-gapped signer).

4. **Set up automated policy enforcement.** Monitoring, alerts, and automatic pause if the agent exceeds thresholds.

The Kuberna SDK handles all of this. The escrow contracts are deployed. The session management library is ready. The migration for a simple agent takes an afternoon.

The repo: [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)
The Discord: [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)

The `#security` channel is where we discuss threat models. If you've found a pattern that handles the custody contradiction differently, I genuinely want to hear about it.

---

### Final Thought on the Series

This is post 30 in the Kuberna Substack series. We've covered strategy agents, ElizaOS integration, PQ certificates, marketplace frontends, x402 payments, and the custody contradiction. The through-line is simple: agents need infrastructure that treats security and composability as first-class properties, not afterthoughts.

This series is open source, like everything we build. If you've read this far, you probably should subscribe. There's more coming — audit reports, protocol upgrades, guest posts from people building on Kuberna rails.

_Subscribe below. It's the only way to guarantee you see the next post when it drops. And if you found this series valuable, share it with one other person building in this space._
