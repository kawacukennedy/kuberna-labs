import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { ethers } from 'ethers';

const SILENTVERIFY_BASE_URL = process.env.SILENTVERIFY_BASE_URL || 'https://silentverify.up.railway.app';
const SILENTVERIFY_API_KEY = process.env.SILENTVERIFY_API_KEY || 'sv_dev_test_key';

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

  async composePassport(
    agentWire: Record<string, unknown>,
    stateWire: Record<string, unknown>,
    options?: { name?: string; description?: string; image?: string }
  ): Promise<ComposePassportResponse> {
    const resp = await fetch(`${SILENTVERIFY_BASE_URL}/api/v1/certs/compose/passport`, {
      method: 'POST',
      headers: this.svHeaders(),
      body: JSON.stringify({
        agent_wire: agentWire,
        state_wire: stateWire,
        name: options?.name ?? null,
        description: options?.description ?? null,
        image: options?.image ?? null,
      }),
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
    taskContext?: Record<string, unknown>
  ): Promise<{
    agentCert: CertIssueResponse;
    evmAnchor: ChainBindingResponse;
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
    try {
      const passport = await this.composePassport(
        agentCert.cert,
        evmAnchor.cert,
        { name: `Agent ${agentDid} Passport` }
      );

      await prisma.agentCertificate.update({
        where: { id: agentCertRecord.id },
        data: { passportUri: passport.uri },
      });

      passportUri = passport.uri;
    } catch (composeErr) {
      logger.warn('Passport composition skipped', { agentId, error: String(composeErr) });
    }

    return { agentCert, evmAnchor, passportUri };
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
}

export const agentService = new AgentService();
export { AgentService };
