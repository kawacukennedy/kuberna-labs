-- CreateEnum
CREATE TYPE "KitePaymentStatus" AS ENUM ('SESSION_CREATED', 'SESSION_APPROVED', 'PAYMENT_AUTHORIZED', 'PAYMENT_SETTLED', 'COMPLETED', 'FAILED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "PaymentType" ADD VALUE 'KITE_X402';

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "kiteAgentDid" TEXT,
ADD COLUMN     "kiteSessionId" TEXT,
ADD COLUMN     "kiteWalletAddress" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kiteWalletAddress" TEXT;

-- CreateTable
CREATE TABLE "kite_payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "agentKiteDid" TEXT,
    "kiteWalletAddr" TEXT,
    "amount" DECIMAL(20,8) NOT NULL,
    "asset" TEXT,
    "network" TEXT NOT NULL DEFAULT 'kite-testnet',
    "status" "KitePaymentStatus" NOT NULL DEFAULT 'SESSION_CREATED',
    "authorization" JSONB,
    "settlementTx" TEXT,
    "facilitatorResp" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "kite_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kite_payments_paymentId_key" ON "kite_payments"("paymentId");

-- CreateIndex
CREATE INDEX "kite_payments_sessionId_idx" ON "kite_payments"("sessionId");

-- CreateIndex
CREATE INDEX "kite_payments_status_idx" ON "kite_payments"("status");

-- CreateIndex
CREATE INDEX "kite_payments_createdAt_idx" ON "kite_payments"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "kite_payments" ADD CONSTRAINT "kite_payments_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
