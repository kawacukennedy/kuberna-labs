import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { createError } from '../middleware/errorHandler.js';
import type { AuthRequest } from '../types/express.d.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { agentService } from '../services/agentService.js';

const router = Router();

router.post('/register', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { solanaAddress, evmAddress, agentName } = req.body;

    if (!solanaAddress) {
      throw createError('solanaAddress is required', 400, 'VALIDATION_ERROR');
    }

    const existingAgent = await prisma.agent.findFirst({
      where: {
        ownerId: req.user!.id,
        ...(agentName ? { name: agentName } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingAgent) {
      throw createError('No agent found for this user', 404, 'AGENT_NOT_FOUND');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { web3Address: true },
    });

    const identity = await agentService.registerCrossChainIdentity({
      agentId: existingAgent.id,
      solanaAddress,
      evmAddress: evmAddress ?? user?.web3Address ?? undefined,
    });

    res.status(201).json(identity);
  } catch (error) {
    next(error);
  }
});

router.get('/:agentId', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const identity = await agentService.getCrossChainIdentity(agentId);
    if (!identity) {
      throw createError('Cross-chain identity not found', 404, 'IDENTITY_NOT_FOUND');
    }
    res.json(identity);
  } catch (error) {
    next(error);
  }
});

router.get('/solana/:solanaAddress', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { solanaAddress } = req.params;
    const identity = await agentService.resolveBySolanaAddress(solanaAddress);
    if (!identity) {
      throw createError('No identity found for this Solana address', 404, 'IDENTITY_NOT_FOUND');
    }
    res.json(identity);
  } catch (error) {
    next(error);
  }
});

router.get('/:agentId/certificates', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const certs = await agentService.getAgentCertificates(agentId);
    res.json(certs);
  } catch (error) {
    next(error);
  }
});

router.post('/:agentId/issue-certificates', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { escrowId, chain, txHash, crossChainBindings } = req.body;

    if (!escrowId || !chain || !txHash) {
      throw createError('escrowId, chain, and txHash are required', 400, 'VALIDATION_ERROR');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { owner: { select: { web3Address: true } } },
    });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized', 403, 'FORBIDDEN');
    }

    const agentDid = `did:erc8004:${agent.owner.web3Address || agentId}`;
    const result = await agentService.issueCertificatesForTaskCompletion(
      agentId,
      agentDid,
      escrowId,
      chain,
      txHash,
      {
        agent_name: agent.name,
        agent_framework: agent.framework,
      },
      crossChainBindings
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/verify-cert', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cert } = req.body;
    if (!cert) {
      throw createError('cert is required', 400, 'VALIDATION_ERROR');
    }
    const result = await agentService.verifyCert(cert);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:agentId/passport', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const cert = await prisma.agentCertificate.findFirst({
      where: { agentId, passportUri: { not: null } },
      orderBy: { issuedAt: 'desc' },
    });
    if (!cert?.passportUri) {
      throw createError('No passport found for this agent', 404, 'PASSPORT_NOT_FOUND');
    }
    res.json({ uri: cert.passportUri });
  } catch (error) {
    next(error);
  }
});

router.post('/:agentId/endorse-cross-chain', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { boundKeys } = req.body;

    if (!boundKeys?.length) {
      throw createError('boundKeys array is required', 400, 'VALIDATION_ERROR');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { owner: { select: { web3Address: true } } },
    });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized', 403, 'FORBIDDEN');
    }

    const agentDid = `did:erc8004:${agent.owner.web3Address || agentId}`;
    const latestCert = await prisma.agentCertificate.findFirst({
      where: { agentId, certType: 'endorsement' },
      orderBy: { issuedAt: 'desc' },
    });

    const endorsement = await agentService.issueCrossChainEndorsement(
      agentDid,
      boundKeys,
      {
        previousCertDigest: latestCert?.digest ?? undefined,
        metadata: { agent_id: agentId },
      }
    );

    await prisma.agentCertificate.create({
      data: {
        agentId,
        agentDid,
        certType: 'endorsement',
        certJson: endorsement.cert as object,
        pubkeyFp: endorsement.pubkeyFp,
        digest: (endorsement.cert as Record<string, unknown>)?.messageSha256Hex as string | null ?? null,
        previousDigest: latestCert?.digest ?? null,
      },
    });

    res.status(201).json(endorsement);
  } catch (error) {
    next(error);
  }
});

router.post('/:agentId/push-metadata-uri', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { agentId } = req.params;
    const { rpcUrl } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent) {
      throw createError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }
    if (agent.ownerId !== req.user!.id) {
      throw createError('Not authorized', 403, 'FORBIDDEN');
    }

    const identity = await prisma.crossChainIdentity.findUnique({
      where: { agentId },
    });
    if (!identity?.erc8004TokenId) {
      throw createError('No on-chain identity found — register first', 404, 'NO_CHAIN_IDENTITY');
    }

    const latestPassport = await prisma.agentCertificate.findFirst({
      where: { agentId, passportUri: { not: null } },
      orderBy: { issuedAt: 'desc' },
    });
    if (!latestPassport?.passportUri) {
      throw createError('No passport URI found — issue certificates first', 404, 'NO_PASSPORT');
    }

    const result = await agentService.pushMetadataUriToChain(
      identity.erc8004TokenId,
      latestPassport.passportUri,
      rpcUrl
    );

    await prisma.crossChainIdentity.update({
      where: { agentId },
      data: { metadataUri: latestPassport.passportUri, lastSyncedAt: new Date() },
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export const identityRouter = router;
