-- CreateTable
CREATE TABLE "agent_certificates" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentDid" TEXT NOT NULL,
    "certType" TEXT NOT NULL DEFAULT 'agent',
    "certJson" JSONB NOT NULL,
    "pubkeyFp" TEXT NOT NULL,
    "digest" TEXT,
    "previousDigest" TEXT,
    "ipfsHash" TEXT,
    "passportUri" TEXT,
    "chain" TEXT,
    "txHash" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "agent_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_chain_identities" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "solanaAddress" TEXT,
    "evmAddress" TEXT,
    "erc8004TokenId" BIGINT,
    "erc8004ChainId" INTEGER,
    "metadataUri" TEXT,
    "certificateId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cross_chain_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cross_chain_identities_agentId_key" ON "cross_chain_identities"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "cross_chain_identities_solanaAddress_key" ON "cross_chain_identities"("solanaAddress");

-- CreateIndex
CREATE INDEX "agent_certificates_agentId_idx" ON "agent_certificates"("agentId");

-- CreateIndex
CREATE INDEX "agent_certificates_agentDid_idx" ON "agent_certificates"("agentDid");

-- CreateIndex
CREATE INDEX "agent_certificates_pubkeyFp_idx" ON "agent_certificates"("pubkeyFp");

-- CreateIndex
CREATE INDEX "agent_certificates_digest_idx" ON "agent_certificates"("digest");

-- CreateIndex
CREATE INDEX "cross_chain_identities_solanaAddress_idx" ON "cross_chain_identities"("solanaAddress");

-- CreateIndex
CREATE INDEX "cross_chain_identities_evmAddress_idx" ON "cross_chain_identities"("evmAddress");

-- CreateIndex
CREATE INDEX "cross_chain_identities_erc8004TokenId_idx" ON "cross_chain_identities"("erc8004TokenId");

-- AddForeignKey
ALTER TABLE "agent_certificates" ADD CONSTRAINT "agent_certificates_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_chain_identities" ADD CONSTRAINT "cross_chain_identities_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
