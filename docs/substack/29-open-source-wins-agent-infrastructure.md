---
title: 'Post 29: Why Open Source Wins in Agent Infrastructure (And Closed Protocols Will Fail)'
slug: open-source-wins-agent-infrastructure
---

## Title Field

Put this in the **Title** field:

> Why Open Source Wins in Agent Infrastructure (And Closed Protocols Will Fail)

## Subtitle Field

Put this in the **Subtitle** field:

> Agents need to compose with other agents. That requires shared standards, open contracts, and MIT-licensed primitives.

## SEO Settings

Click "Post settings" → **SEO title** (under 60 chars):

> Open source wins in agent infrastructure — closed protocols fragment and fail

**Meta description** (155-160 chars):

> Agents need to compose with each other. Closed protocols fragment liquidity and kill agent-to-agent interactions. Open contracts, MIT-licensed primitives, shared standards win.

**Post URL slug**:

> open-source-wins-agent-infrastructure

## Body

Put this in the main body editor:

I see a pattern forming that worries me.

Teams are building agent protocols with closed contracts, proprietary relayers, and token-gated access. The pitch is "we capture value through our protocol fee." The reality is they're building walls in a world that needs open roads.

Agent infrastructure is a **composability game**. My agent needs to pay your agent, verify your agent's identity, and trust your agent's execution proof. That requires shared standards. Closed protocols break this.

---

### The Network Effects Argument

Proponents of closed protocols say network effects will protect them. More users → more liquidity → better prices → more users. The classic marketplace flywheel.

This works when the network is the product — Uber, Airbnb, OpenSea. The value is in the matching. The protocol is just the plumbing.

But in agent infrastructure, the plumbing is the product. The protocols for escrow, attestation, identity, and payment are what agents need to interoperate. If those protocols are closed:

- **Agent A** (on Protocol X) cannot verify **Agent B's** (on Protocol Y) identity certificate
- **Agent A** cannot accept payment from **Agent B** unless both use the same payment protocol
- Every agent-to-agent interaction requires both agents to be on the same platform

This is AOL versus the web. Closed networks lose when open networks emerge, because open networks get all the composability benefits for free.

---

### The Historical Precedent

This has happened before. Multiple times. The pattern is clear.

**TCP/IP vs proprietary networking.** In the 80s, IBM, DEC, and others had proprietary networking protocols. TCP/IP was open, barely funded, and technically inferior in some ways. It won because any device could talk to any other device without permission.

**HTTP vs information services.** CompuServe, Prodigy, AOL had walled gardens with curated content, billing systems, and proprietary formats. HTTP was stateless, simple, and open. It won because linking across sites required no permission.

**Ethereum vs EOS.** EOS had a foundation, a corporate structure, and funded development. Ethereum had an open research process, an MIT-licensed client, and anyone could fork it. When EOS needed governance decisions, the foundation became a bottleneck. Ethereum's open model absorbed every innovation.

The pattern: **open protocols win when the value is in interconnection, not in the platform itself.**

---

### Agent Infrastructure Is the Ultimate Interconnection Game

Agents don't exist in isolation. An agent that can only interact with other agents on the same protocol is like an email service that only sends to the same email service.

Consider what an agent actually needs to do:

- **Discover** other agents by their capabilities
- **Verify** their identity and reputation
- **Negotiate** a price for data or execution
- **Execute** a cross-chain action with escrow
- **Prove** the execution was correct
- **Settle** via payment

Every single one of these requires the other agent to be using compatible primitives. If the escrow contract is closed-source and deployed on a private chain, no external agent can interact with it. If the identity certificate format is proprietary, no external verifier can validate it.

The value of the network grows with each compatible agent. Closed protocols limit compatibility by design (that's how they capture value). This caps the network size. Open protocols have no such limit.

---

### The Token Fallacy

Some teams say "we'll make our protocol open but charge fees through a token." I think this is wishful thinking.

If your escrow contract is open source but requires a fee in your token to use, you've created a tax on agent-to-agent interaction. Agents will prefer escrow contracts that don't tax them. Open source means someone will fork it, remove the fee, and deploy it on the same chains.

This isn't hypothetical. It's what happened to every DeFi protocol with a fee switch. When SushiSwap forked Uniswap with lower fees, liquidity migrated. When 0x tried to enforce protocol fees, relayers forked.

Protocol-level tokens work when there's genuine demand for the token itself — governance, staking, security. They don't work as tollbooths on open infrastructure. The market forks around the tollbooth.

---

### MIT License Specifically

We chose MIT for Kuberna deliberately.

Not GPL (which restricts commercial use in some interpretations). Not BUSL (which converts to open after a delay). MIT is the most permissive license. You can fork it, use it in proprietary products, deploy it on any chain, modify it without attribution (though we'd appreciate it).

Why? Because adoption is the goal. If Kuberna's escrow contracts become the default because they're the most battle-tested, that's better than us capturing every user. If the SilentVerify certificate format becomes the standard because multiple verifiers implement it, that's better than us being the only issuer.

Open source + fees on specific services (hosted TEE, high-throughput relaying, SLA-backed verification) is a sustainable model. Open source + token-gating the protocol is not.

---

### What Open Agent Infrastructure Looks Like

Here's the world we're building toward:

- **Open escrow contracts.** Deployed on every major L1 and L2. Anyone can fund an intent. Anyone can dispute. Anyone can arbitrate.
- **Open identity registry.** DIDs anchored on Ethereum. Bound to EVM and Solana addresses. PQ certificates from any issuer, verified on-chain.
- **Open payment protocol.** x402 specification is MIT. Anyone can implement the seller side. Anyone can implement the buyer side. No platform fee.
- **Open attestation format.** TEE quotes normalized across SGX, TDX, Marlin, Phala. Verification contracts that accept any attestation provider.
- **Open strategy marketplace.** Publish a strategy, get paid when agents use it. No platform gatekeeping what strategies are allowed.

This all exists in the Kuberna repo. Not because we're generous — because we need this infrastructure to exist for our own agents to work. We're just building it in the open so everyone benefits.

---

### What Happens Next

I think the next 12 months will be decisive.

Projects building closed protocols will raise money on tokenized network effects. They'll launch with splashy announcements. Early metrics will look good because liquidity is concentrated.

But agent-to-agent interactions will happen across protocols. An agent on LangChain needs to pay an agent on ElizaOS. A Solana agent needs to verify an Ethereum agent's certificate. These cross-protocol interactions will force either standardization or fragmentation.

Standardization favors open protocols. Fragmentation kills the agent-to-agent value proposition entirely.

I know which outcome I'm betting on.

---

### The Repo and the Discord

Kuberna is MIT across all packages — the SDK, the contracts, the tools, the examples. You can deploy your own escrow contracts, run your own relayers, issue your own certificates, and build your own marketplace without asking permission.

The code: [github.com/kawacukennedy/kuberna-labs](https://github.com/kawacukennedy/kuberna-labs)
The conversation: [discord.gg/MZvNuhpXu](https://discord.gg/MZvNuhpXu)

The `#open-standards` channel is where we discuss cross-protocol compatibility. If you're building a closed protocol and thinking about opening it, or an open protocol and thinking about composability, that channel is where the work happens.

_Subscribe below. Last post in this series: the custody contradiction — why your agent should never hold your keys, and what to do instead._
