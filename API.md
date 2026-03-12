# Kuberna Labs API Documentation

## Base URL

```
https://api.kuberna.io/v1
```

## Authentication

All API requests require authentication using JWT tokens or API keys.

### JWT Authentication

```http
Authorization: Bearer <your-jwt-token>
```

### API Key Authentication

```http
X-API-Key: <your-api-key>
```

## Rate Limiting

- **Rate Limit**: 100 requests per minute per API key
- **Burst Limit**: 20 requests per second

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Endpoints

### Payment Endpoints

#### Create Payment Intent

```http
POST /api/v1/payments/intents
```

**Request Body:**
```json
{
  "userId": "user-123",
  "amount": "100",
  "currency": "USD",
  "token": "0x0000000000000000000000000000000000000000",
  "chain": "ethereum",
  "metadata": {
    "description": "Task payment",
    "durationSeconds": 86400
  }
}
```

**Response:**
```json
{
  "intentId": "0x...",
  "escrowId": "0x...",
  "status": "created",
  "requiredApproval": {
    "token": "0x...",
    "spender": "0x...",
    "amount": "100"
  }
}
```

#### Fund Escrow

```http
POST /api/v1/payments/escrows/:id/fund
```

**Request Body:**
```json
{
  "txHash": "0x...",
  "chain": "ethereum"
}
```

**Response:**
```json
{
  "success": true,
  "escrowId": "0x...",
  "status": "funded"
}
```

#### Release Funds

```http
POST /api/v1/payments/escrows/:id/release
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "status": "released"
}
```

#### Refund Payment

```http
POST /api/v1/payments/escrows/:id/refund
```

**Request Body:**
```json
{
  "reason": "Task not completed"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "status": "refunded"
}
```

#### Get Payment Status

```http
GET /api/v1/payments/intents/:id
```

**Response:**
```json
{
  "intentId": "0x...",
  "escrowId": "0x...",
  "status": "funded",
  "amount": "100",
  "token": "0x...",
  "chain": "ethereum",
  "requester": "0x...",
  "executor": "0x...",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:05:00Z"
}
```

#### Process Withdrawal

```http
POST /api/v1/payments/withdrawals
```

**Request Body:**
```json
{
  "userId": "user-123",
  "token": "0x...",
  "amount": "50",
  "chain": "ethereum"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x..."
}
```

#### Get Supported Tokens

```http
GET /api/v1/payments/tokens?chain=ethereum
```

**Response:**
```json
{
  "tokens": [
    {
      "address": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "name": "Ethereum",
      "decimals": 18,
      "minAmount": "0",
      "maxAmount": "115792089237316195423570985008687907853269984665640564039457584007913129639935"
    }
  ]
}
```

#### Estimate Gas

```http
POST /api/v1/payments/gas-estimate
```

**Request Body:**
```json
{
  "chain": "ethereum",
  "operation": "createEscrow",
  "params": {
    "intentId": "0x...",
    "token": "0x...",
    "amount": "100",
    "durationSeconds": 86400
  }
}
```

**Response:**
```json
{
  "gasLimit": "150000",
  "gasPrice": "30000000000",
  "totalCost": "4500000000000000",
  "totalCostUSD": "12.50",
  "warning": "Gas price is currently 50% higher than average"
}
```

### TEE Endpoints

#### Deploy Agent to TEE

```http
POST /api/v1/tee/deployments
```

**Request Body:**
```json
{
  "agentId": "agent-123",
  "ownerId": "user-123",
  "code": "base64-encoded-code",
  "config": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "provider": "phala",
  "resources": {
    "cpu": 2,
    "memory": 4096,
    "storage": 10240
  }
}
```

**Response:**
```json
{
  "deploymentId": "phala-1234567890-abc",
  "enclaveId": "enclave-123",
  "endpoint": "https://enclave-123.phala.cloud",
  "attestation": {
    "quote": "0x...",
    "mrenclave": "0x...",
    "mrsigner": "0x...",
    "timestamp": 1640000000,
    "signature": "0x...",
    "isValid": true
  },
  "status": "running"
}
```

#### Get Deployment Status

```http
GET /api/v1/tee/deployments/:id
```

**Response:**
```json
{
  "deploymentId": "phala-1234567890-abc",
  "agentId": "agent-123",
  "provider": "phala",
  "status": "running",
  "endpoint": "https://enclave-123.phala.cloud",
  "createdAt": "2024-01-15T10:00:00Z",
  "health": {
    "cpu": 45.5,
    "memory": 2048,
    "uptime": 3600,
    "requestCount": 1000,
    "errorRate": 0.01,
    "lastPing": "2024-01-15T11:00:00Z"
  }
}
```

#### Stop Deployment

```http
DELETE /api/v1/tee/deployments/:id
```

**Response:**
```json
{
  "success": true,
  "deploymentId": "phala-1234567890-abc",
  "status": "stopped"
}
```

#### Verify Attestation

```http
POST /api/v1/tee/attestations/verify
```

**Request Body:**
```json
{
  "quote": "0x...",
  "mrenclave": "0x...",
  "mrsigner": "0x...",
  "timestamp": 1640000000,
  "signature": "0x...",
  "isValid": true
}
```

**Response:**
```json
{
  "valid": true,
  "details": {
    "signatureValid": true,
    "mrenclaveValid": true,
    "timestampValid": true
  }
}
```

#### Request zkTLS Proof

```http
POST /api/v1/tee/zktls/proofs
```

**Request Body:**
```json
{
  "agentId": "agent-123",
  "provider": "reclaim",
  "dataSource": "https://bank.example.com",
  "claimType": "bank_balance",
  "parameters": {
    "accountId": "12345"
  }
}
```

**Response:**
```json
{
  "proofId": "session-123",
  "claim": {
    "type": "bank_balance",
    "dataSource": "https://bank.example.com",
    "parameters": {
      "accountId": "12345"
    }
  },
  "proof": "0x...",
  "attestationId": "0x...",
  "verified": true
}
```

#### Verify zkTLS Proof

```http
GET /api/v1/tee/zktls/proofs/:id/verify
```

**Response:**
```json
{
  "proofId": "session-123",
  "verified": true,
  "claim": {
    "type": "bank_balance",
    "value": "10000"
  }
}
```

#### Get Enclave Health

```http
GET /api/v1/tee/enclaves/:id/health
```

**Response:**
```json
{
  "enclaveId": "enclave-123",
  "cpu": 45.5,
  "memory": 2048,
  "uptime": 3600,
  "requestCount": 1000,
  "errorRate": 0.01,
  "lastPing": "2024-01-15T11:00:00Z"
}
```

### Intent Endpoints

#### Create Intent

```http
POST /api/v1/intents
```

**Request Body:**
```json
{
  "description": "Swap 1 ETH to USDC",
  "sourceChain": "ethereum",
  "sourceToken": "0x...",
  "sourceAmount": "1000000000000000000",
  "destChain": "ethereum",
  "destToken": "0x...",
  "minDestAmount": "2000000000",
  "budget": "1000000000000000000",
  "durationSeconds": 86400
}
```

**Response:**
```json
{
  "intentId": "0x...",
  "status": "open",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Get Intent Details

```http
GET /api/v1/intents/:id
```

**Response:**
```json
{
  "intentId": "0x...",
  "requester": "0x...",
  "description": "Swap 1 ETH to USDC",
  "status": "bidding",
  "bids": [
    {
      "solver": "0x...",
      "price": "950000000000000000",
      "estimatedTime": 300,
      "status": "pending"
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### List Intents

```http
GET /api/v1/intents?page=1&limit=10&status=open
```

**Response:**
```json
{
  "intents": [
    {
      "intentId": "0x...",
      "description": "Swap 1 ETH to USDC",
      "status": "open",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### Submit Bid

```http
POST /api/v1/intents/:id/bids
```

**Request Body:**
```json
{
  "price": "950000000000000000",
  "estimatedTime": 300,
  "routeDetails": "0x..."
}
```

**Response:**
```json
{
  "bidId": 0,
  "intentId": "0x...",
  "solver": "0x...",
  "status": "pending"
}
```

#### Accept Bid

```http
POST /api/v1/intents/:id/bids/:bidId/accept
```

**Response:**
```json
{
  "success": true,
  "intentId": "0x...",
  "bidId": 0,
  "status": "assigned"
}
```

#### Retract Bid

```http
DELETE /api/v1/intents/:id/bids/:bidId
```

**Response:**
```json
{
  "success": true,
  "bidId": 0,
  "status": "retracted"
}
```

#### Cancel Intent

```http
POST /api/v1/intents/:id/cancel
```

**Response:**
```json
{
  "success": true,
  "intentId": "0x...",
  "status": "cancelled"
}
```

### Certificate Endpoints

#### Mint Certificate

```http
POST /api/v1/certificates
```

**Request Body:**
```json
{
  "recipient": "0x...",
  "recipientName": "John Doe",
  "courseTitle": "Web3 Development",
  "courseId": "course-123",
  "instructorName": "Jane Smith",
  "verificationHash": "0x..."
}
```

**Response:**
```json
{
  "tokenId": 1,
  "recipient": "0x...",
  "txHash": "0x..."
}
```

#### Get Certificate Details

```http
GET /api/v1/certificates/:id
```

**Response:**
```json
{
  "tokenId": 1,
  "recipient": "0x...",
  "recipientName": "John Doe",
  "courseTitle": "Web3 Development",
  "courseId": "course-123",
  "issuedAt": "2024-01-15T10:00:00Z",
  "isValid": true
}
```

#### Verify Certificate

```http
GET /api/v1/certificates/verify/:hash
```

**Response:**
```json
{
  "valid": true,
  "tokenId": 1,
  "recipient": "0x...",
  "courseTitle": "Web3 Development"
}
```

#### Revoke Certificate

```http
POST /api/v1/certificates/:id/revoke
```

**Request Body:**
```json
{
  "reason": "Fraudulent completion"
}
```

**Response:**
```json
{
  "success": true,
  "tokenId": 1,
  "status": "revoked"
}
```

#### Get User Certificates

```http
GET /api/v1/users/:id/certificates
```

**Response:**
```json
{
  "certificates": [
    {
      "tokenId": 1,
      "courseTitle": "Web3 Development",
      "issuedAt": "2024-01-15T10:00:00Z",
      "isValid": true
    }
  ]
}
```

### Wallet Endpoints

#### Connect Wallet

```http
POST /api/v1/wallets/connect
```

**Request Body:**
```json
{
  "address": "0x...",
  "signature": "0x...",
  "message": "Sign this message to authenticate"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "address": "0x..."
}
```

#### Disconnect Wallet

```http
POST /api/v1/wallets/disconnect
```

**Response:**
```json
{
  "success": true
}
```

#### Get Wallet Balance

```http
GET /api/v1/wallets/balance?address=0x...&chain=ethereum
```

**Response:**
```json
{
  "address": "0x...",
  "chain": "ethereum",
  "balances": [
    {
      "token": "0x0000000000000000000000000000000000000000",
      "symbol": "ETH",
      "balance": "1000000000000000000",
      "balanceFormatted": "1.0"
    }
  ]
}
```

#### Sign Message

```http
POST /api/v1/wallets/sign
```

**Request Body:**
```json
{
  "message": "Sign this message",
  "address": "0x..."
}
```

**Response:**
```json
{
  "signature": "0x...",
  "message": "Sign this message"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Webhooks

Configure webhooks to receive real-time notifications for events.

### Webhook Events

- `payment.intent.created`
- `payment.escrow.funded`
- `payment.funds.released`
- `tee.deployment.created`
- `tee.deployment.stopped`
- `intent.created`
- `intent.bid.submitted`
- `intent.bid.accepted`
- `certificate.minted`
- `certificate.revoked`

### Webhook Payload

```json
{
  "event": "payment.escrow.funded",
  "timestamp": "2024-01-15T10:00:00Z",
  "data": {
    "escrowId": "0x...",
    "amount": "100",
    "chain": "ethereum"
  }
}
```

## SDK Usage

For easier integration, use the Kuberna SDK:

```typescript
import { KubernaSDK } from '@kuberna/sdk';

const sdk = new KubernaSDK({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Create payment intent
const intent = await sdk.payments.createIntent({
  amount: '100',
  token: '0x...',
  chain: 'ethereum'
});

// Deploy to TEE
const deployment = await sdk.tee.deploy({
  agentId: 'agent-123',
  provider: 'phala'
});
```
