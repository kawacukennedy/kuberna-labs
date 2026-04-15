# 0G APAC Hackathon - On-Chain Integration Proof

## Kuberna Labs - 0G Galileo Testnet Deployment

### Project: Kuberna Labs

### Ecosystem: 0G Galileo Testnet (Chain ID: 16602)

### Deployment Date: April 13, 2026

---

## On-Chain Integration Proof

### Verified Contract Deployments on 0G Galileo Testnet

**Network:** 0G Galileo Testnet
**Chain ID:** 16602
**RPC:** https://evmrpc-testnet.0g.ai
**Explorer:** https://chainscan-galileo.0g.ai

---

### Core Smart Contracts

| #   | Contract              | Address                                    | Purpose                                  |
| --- | --------------------- | ------------------------------------------ | ---------------------------------------- |
| 1   | KubernaEscrow         | 0x360ec009ba6967F5f7C53a88FAD0452C6140493d | Secure payment escrow for AI agent tasks |
| 2   | KubernaIntent         | 0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a | Task marketplace intents                 |
| 3   | KubernaCertificateNFT | 0x5e42c329Ef517B495261f57054d5844EAabD3dbf | Course completion certificates           |
| 4   | KubernaPayment        | 0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A | Payment processing                       |
| 5   | KubernaSubscription   | 0x22dF9cBdf45F7874602d3Bf950A2B7EB51314ad1 | Subscription billing                     |
| 6   | ReputationNFT         | 0xb663f2A79Fcc64eD1CB6c6adD7625b443aB1D19C | Agent reputation tracking                |
| 7   | KubernaAgentRegistry  | 0x8f21D43d50266580e21dbCB0BcEa7E073FefA7c0 | AI agent registration                    |
| 8   | KubernaFeeManager     | 0x9be7afE1793ad14F9026d7579cf7c2313184a7E0 | Protocol fee collection                  |
| 9   | Attestation           | 0xCCa946e3E2c2C307Cb2613d5C8107356ddD08c35 | TEE attestations                         |
| 10  | CrossChainRouter      | 0x817fB0D00f033bb2982fF44855Fb6F8AE2D41324 | Cross-chain operations                   |

---

### 0G Components Used

- **0G Chain:** All smart contracts deployed on 0G Galileo Testnet
- **0G Storage:** Agent data, certificates, and credentials stored via contracts
- **0G Compute:** AI agent task execution logic in contracts

---

### Verification Links

View deployed contracts on 0G Explorer:

- https://chainscan-galileo.0g.ai/address/0x360ec009ba6967F5f7C53a88FAD0452C6140493d

---

### Technical Stack

- **Language:** Solidity 0.8.20
- **Framework:** Hardhat + Ethers.js v6
- **Libraries:** OpenZeppelin Contracts
- **Network:** 0G Galileo Testnet (EVM Compatible)

---

### Contract Interaction Example

```solidity
// Example: Creating an intent on 0G
IKubernaIntent intent = IKubernaIntent(0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a);
intent.createIntent(
    "AI-Task-001",
    1000000000000000000, // 1 ETH
    "Train ML model for trading",
    5 // max agents
);
```

---

### GitHub Repository

https://github.com/n3on/kubernalabs

---

### Track

**Excellence Awards - Agentic Infrastructure**

Kuberna Labs demonstrates autonomous AI agent infrastructure on 0G blockchain, enabling:

- AI agent registration and reputation
- Task marketplace with escrow payments
- Certificate and credential management
- Cross-chain interoperability

---

Generated: April 15, 2026
Project: Kuberna Labs - Architecting the Agentic Web3 Enterprise
