export const ESCROW_STATUS = {
  NONE: 0,
  FUNDED: 1,
  ASSIGNED: 2,
  COMPLETED: 3,
  DISPUTED: 4,
  RELEASED: 5,
  REFUNDED: 6,
  EXPIRED: 7,
} as const;

export type EscrowStatusKey = keyof typeof ESCROW_STATUS;
export type EscrowStatusValue = (typeof ESCROW_STATUS)[EscrowStatusKey];

export const ESCROW_STATUS_LABELS: Record<EscrowStatusValue, string> = {
  [ESCROW_STATUS.NONE]: 'None',
  [ESCROW_STATUS.FUNDED]: 'Funded',
  [ESCROW_STATUS.ASSIGNED]: 'Assigned',
  [ESCROW_STATUS.COMPLETED]: 'Completed',
  [ESCROW_STATUS.DISPUTED]: 'Disputed',
  [ESCROW_STATUS.RELEASED]: 'Released',
  [ESCROW_STATUS.REFUNDED]: 'Refunded',
  [ESCROW_STATUS.EXPIRED]: 'Expired',
};

export const INTENT_STATUS = {
  OPEN: 'OPEN',
  BIDDING: 'BIDDING',
  ASSIGNED: 'ASSIGNED',
  EXECUTING: 'EXECUTING',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  DISPUTED: 'DISPUTED',
} as const;

export type IntentStatusKey = keyof typeof INTENT_STATUS;
export type IntentStatusValue = (typeof INTENT_STATUS)[IntentStatusKey];

export const BID_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type BidStatusKey = keyof typeof BID_STATUS;
export type BidStatusValue = (typeof BID_STATUS)[BidStatusKey];
