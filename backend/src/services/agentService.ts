import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { ethers } from 'ethers';

const SILENTVERIFY_BASE_URL = process.env.SILENTVERIFY_BASE_URL || 'https://silentverify.up.railway.app';
const SILENTVERIFY_API_KEY = process.env.SILENTVERIFY_API_KEY || 'sv_dev_test_key';
const REPUTATION_NFT_OWNER_KEY = process.env.REPUTATION_NFT_OWNER_KEY || '';

const REPUTATION_NFT_ABI = [
  'function setAgentMetadataURI(uint256 tokenId, string metadataURI)',
  'function agentAddressToTokenId(address) view returns (uint256)',
  'function agentIdentities(uint256) view returns (address agentAddress, string name, string framework, uint256 registeredAt, uint256 lastActiveAt, uint256 totalEarnings, string metadataURI)',
];

const REPUTATION_NFT_ADDRESSES: Record<number, string> = {
  84532: '0x10aC2c7cAA2d7C5fC8a561F8654d289eeb2E29F4',  // Base Sepolia
  5003: '0x5e42c329Ef517B495261f57054d5844EAabD3dbf',   // Mantle Sepolia
};

interface CertIssueResponse {
  status: string;
  cert: Record<string, unknown>;
  pubkeyFp: string;
}

interface ChainBindingResponse extends CertIssueResponse {
  anchor?: Record<string, unknown>;
}

interface ComposePassportResponse {
  passport: Record<string, unknown>;
  uri: string;
}

interface CrossChainBinding {
  chain: string;
  chain_id: string;
  address: string;
  fingerprint?: string;
}

interface CrossChainEndorsementResponse {
  status: string;
  cert: Record<string, unknown>;
  pubkeyFp: string;
}

class AgentService {
  private svHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': SILENTVERIFY_API_KEY,
    };
  }

  async issueAgentCert(
    agentDid: string,
    params: {
      capabilities?: Record<string, unknown>;
      reputationHash?: string;
      previousCertDigest?: string;
      taskContext?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<CertIssueResponse> {
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/certs/agent/issue`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify({
        agent_did: agentDid,
        capabilities: params.capabilities ?? null,
        reputation_hash: params.reputationHash ?? null,
        previous_cert_digest: params.previousCertDigest ?? null,
        task_context: params.taskContext ?? null,
        expires_in_days: 30,
        metadata: params.metadata ?? {},
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`SilentVerify issueAgentCert failed: ${err}`);
    }
    return resp.json() as Promise<CertIssueResponse>;
  }

  async issueEvmAnchor(evmChainRequest: {
    rpcUrl?: string;
    block?: number | string;
    caip2ChainId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ChainBindingResponse> {
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/chains/evm/issue`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify({
        rpc_url: evmChainRequest.rpcUrl ?? 'https://eth.drpc.org',
        block: evmChainRequest.block ?? 'latest',
        caip2_chain_id: evmChainRequest.caip2ChainId ?? null,
        metadata: evmChainRequest.metadata ?? {},
        timeout: 30,
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`SilentVerify issueEvmAnchor failed: ${err}`);
    }
    return resp.json() as Promise<ChainBindingResponse>;
  }

  async issueCrossChainEndorsement(
    subjectDid: string,
    boundKeys: CrossChainBinding[],
    options?: { previousCertDigest?: string; expiresInDays?: number; metadata?: Record<string, unknown> }
  ): Promise<CrossChainEndorsementResponse> {
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/certs/endorsement/issue`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify({
        subject: { did: subjectDid },
        bound_keys: boundKeys.map(k => ({
          chain: k.chain,
          chain_id: k.chain_id,
          address: k.address,
          fingerprint: k.fingerprint ?? null,
        })),
        previous_cert_digest: options?.previousCertDigest ?? null,
        expires_in_days: options?.expiresInDays ?? 90,
        metadata: options?.metadata ?? {},
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`SilentVerify issueCrossChainEndorsement failed: ${err}`);
    }
    return resp.json() as Promise<CrossChainEndorsementResponse>;
  }

  async composePassport(
    agentWire: Record<string, unknown>,
    stateWire: Record<string, unknown>,
    options?: {
      name?: string;
      description?: string;
      image?: string;
      crossChainBindings?: CrossChainBinding[];
      endorsementCert?: Record<string, unknown>;
    }
  ): Promise<ComposePassportResponse> {
    const body: Record<string, unknown> = {
      agent_cert: agentWire,
      state_cert: stateWire,
      name: options?.name ?? null,
      description: options?.description ?? null,
      image: options?.image ?? null,
    };
    if (options?.crossChainBindings?.length) {
      body.cross_chain_bindings = options.crossChainBindings;
    }
    if (options?.endorsementCert) {
      body.endorsement_cert = options.endorsementCert;
    }
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/certs/compose/passport`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`SilentVerify composePassport failed: ${err}`);
    }
    return resp.json() as Promise<ComposePassportResponse>;
  }

  async verifyCert(cert: Record<string, unknown>): Promise<{ valid: boolean; pubkeyFp?: string }> {
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/certs/verify`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify({ cert }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`SilentVerify verifyCert failed: ${err}`);
    }
    return resp.json() as Promise<{ valid: boolean; pubkeyFp?: string }>;
  }

  async issueCertificatesForTaskCompletion(
    agentId: string,
    agentDid: string,
    escrowId: string,
    chain: string,
    txHash: string,
    taskContext?: Record<string, unknown>,
    crossChainBindings?: CrossChainBinding[]
  ): Promise<{
    agentCert: CertIssueResponse;
    evmAnchor: ChainBindingResponse;
    endorsementCert?: CrossChainEndorsementResponse;
    passportUri?: string;
  }> {
    const latestCert = await prisma.agentCertificate.findFirst({
      where: { agentId, certType: 'agent' },
      orderBy: { issuedAt: 'desc' },
    });

    const agentCert = await this.issueAgentCert(agentDid, {
      reputationHash: ethers.solidityPackedKeccak256(
        ['string', 'string'],
        [agentId, escrowId]
      ),
      previousCertDigest: latestCert?.digest ?? undefined,
      taskContext,
      metadata: {
        agent_id: agentId,
        escrow_id: escrowId,
        chain,
        tx_hash: txHash,
        cert_type: 'agent',
      },
    });

    const evmAnchor = await this.issueEvmAnchor({
      metadata: {
        agent_id: agentId,
        escrow_id: escrowId,
        chain,
        tx_hash: txHash,
        agent_did: agentDid,
        cert_type: 'state',
      },
    });

    await prisma.agentCertificate.create({
      data: {
        agentId,
        agentDid,
        certType: 'agent',
        certJson: agentCert.cert as object,
        pubkeyFp: agentCert.pubkeyFp,
        digest: (agentCert.cert as Record<string, unknown>)?.messageSha256Hex as string | null ?? null,
        previousDigest: latestCert?.digest ?? null,
        chain,
        txHash,
      },
    });

    const agentCertRecord = await prisma.agentCertificate.create({
      data: {
        agentId,
        agentDid,
        certType: 'state',
        certJson: evmAnchor.cert as object,
        pubkeyFp: evmAnchor.pubkeyFp,
        chain,
        txHash,
      },
    });

    let passportUri: string | undefined;
    let endorsementCert: CrossChainEndorsementResponse | undefined;
    try {
      if (crossChainBindings?.length) {
        endorsementCert = await this.issueCrossChainEndorsement(agentDid, crossChainBindings, {
          previousCertDigest: latestCert?.digest ?? undefined,
          metadata: {
            agent_id: agentId,
            escrow_id: escrowId,
            chain,
            tx_hash: txHash,
          },
        });

        await prisma.agentCertificate.create({
          data: {
            agentId,
            agentDid,
            certType: 'endorsement',
            certJson: endorsementCert.cert as object,
            pubkeyFp: endorsementCert.pubkeyFp,
            chain,
            txHash,
          },
        });
      }

      const passport = await this.composePassport(
        agentCert.cert,
        evmAnchor.cert,
        {
          name: `Agent ${agentDid} Passport`,
          crossChainBindings,
          endorsementCert: endorsementCert?.cert,
        }
      );

      await prisma.agentCertificate.update({
        where: { id: agentCertRecord.id },
        data: { passportUri: passport.uri },
      });

      passportUri = passport.uri;
    } catch (composeErr) {
      logger.warn('Passport composition skipped', { agentId, error: String(composeErr) });
    }

    return { agentCert, evmAnchor, endorsementCert, passportUri };
  }

  async getAgentCertificates(agentId: string) {
    return prisma.agentCertificate.findMany({
      where: { agentId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async registerCrossChainIdentity(params: {
    agentId: string;
    solanaAddress?: string;
    evmAddress?: string;
    erc8004TokenId?: bigint;
    erc8004ChainId?: number;
    metadataUri?: string;
  }) {
    const existing = await prisma.crossChainIdentity.findUnique({
      where: { agentId: params.agentId },
    });
    if (existing) {
      return prisma.crossChainIdentity.update({
        where: { agentId: params.agentId },
        data: {
          solanaAddress: params.solanaAddress ?? existing.solanaAddress,
          evmAddress: params.evmAddress ?? existing.evmAddress,
          erc8004TokenId: params.erc8004TokenId ?? existing.erc8004TokenId,
          erc8004ChainId: params.erc8004ChainId ?? existing.erc8004ChainId,
          metadataUri: params.metadataUri ?? existing.metadataUri,
          lastSyncedAt: new Date(),
        },
      });
    }
    return prisma.crossChainIdentity.create({
      data: {
        agentId: params.agentId,
        solanaAddress: params.solanaAddress,
        evmAddress: params.evmAddress,
        erc8004TokenId: params.erc8004TokenId,
        erc8004ChainId: params.erc8004ChainId,
        metadataUri: params.metadataUri,
        lastSyncedAt: new Date(),
      },
    });
  }

  async getCrossChainIdentity(agentId: string) {
    return prisma.crossChainIdentity.findUnique({
      where: { agentId },
    });
  }

  async resolveBySolanaAddress(solanaAddress: string) {
    return prisma.crossChainIdentity.findUnique({
      where: { solanaAddress },
      include: { agent: true },
    });
  }

  async pushMetadataUriToChain(
    tokenId: bigint,
    metadataUri: string,
    rpcUrl?: string
  ): Promise<{ txHash: string; chainId: number; tokenId: string }> {
    if (!REPUTATION_NFT_OWNER_KEY) {
      throw new Error('REPUTATION_NFT_OWNER_KEY env var not set');
    }

    const chainId = rpcUrl?.includes('mantle') ? 5003 : 84532;
    const contractAddress = REPUTATION_NFT_ADDRESSES[chainId];
    if (!contractAddress) {
      throw new Error(`No ReputationNFT deployed on chain ${chainId}`);
    }

    const url = rpcUrl || (chainId === 5003
      ? 'https://rpc.sepolia.mantle.xyz'
      : 'https://sepolia.base.org');

    const provider = new ethers.JsonRpcProvider(url);
    const wallet = new ethers.Wallet(REPUTATION_NFT_OWNER_KEY, provider);
    const contract = new ethers.Contract(contractAddress, REPUTATION_NFT_ABI, wallet);

    const tx = await contract.setAgentMetadataURI(tokenId, metadataUri);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      chainId,
      tokenId: tokenId.toString(),
    };
  }
}

export const agentService = new AgentService();
export { AgentService };
