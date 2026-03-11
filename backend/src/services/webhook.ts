import crypto from "crypto";

export type WebhookEvent =
  | "intent.created"
  | "intent.bid_received"
  | "intent.bid_accepted"
  | "intent.completed"
  | "intent.expired"
  | "intent.disputed"
  | "task.assigned"
  | "task.completed"
  | "task.failed"
  | "payment.received"
  | "payment.completed"
  | "payment.failed"
  | "agent.registered"
  | "agent.status_changed"
  | "certificate.minted"
  | "enrollment.created";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
  webhookId: string;
}

export interface WebhookSubscription {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: string;
  status: "pending" | "delivered" | "failed";
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  lastAttempt?: Date;
  createdAt: Date;
}

export class WebhookService {
  private deliveryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 5;
  private retryDelays: number[] = [1000, 5000, 15000, 60000, 300000];

  generateSecret(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  signPayload(payload: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.signPayload(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  }

  async deliver(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      webhookId: subscription.id,
      event: payload.event,
      payload: JSON.stringify(payload),
      status: "pending",
      attempts: 0,
      createdAt: new Date(),
    };

    const attemptKey = `${subscription.id}-${payload.event}`;
    const attempts = this.deliveryAttempts.get(attemptKey) || 0;

    if (attempts >= this.maxRetries) {
      delivery.status = "failed";
      return delivery;
    }

    this.deliveryAttempts.set(attemptKey, attempts + 1);
    delivery.attempts = attempts + 1;

    try {
      const body = JSON.stringify(payload);
      const signature = this.signPayload(body, subscription.secret);

      const response = await fetch(subscription.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": payload.event,
          "X-Webhook-Id": payload.webhookId,
        },
        body,
        signal: AbortSignal.timeout(30000),
      });

      delivery.responseCode = response.status;
      delivery.responseBody = await response.text().catch(() => undefined);
      delivery.lastAttempt = new Date();
      delivery.status = response.ok ? "delivered" : "failed";

      if (response.ok) {
        this.deliveryAttempts.delete(attemptKey);
      }
    } catch (error) {
      console.error("Webhook delivery error:", error);
      delivery.status = "failed";
      delivery.responseBody =
        error instanceof Error ? error.message : "Unknown error";
      delivery.lastAttempt = new Date();
    }

    return delivery;
  }

  getRetryDelay(attempts: number): number {
    return (
      this.retryDelays[Math.min(attempts - 1, this.retryDelays.length - 1)] || 0
    );
  }

  shouldRetry(delivery: WebhookDelivery): boolean {
    return delivery.status === "failed" && delivery.attempts < this.maxRetries;
  }

  createPayload(
    event: WebhookEvent,
    data: Record<string, unknown>,
  ): WebhookPayload {
    return {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async notifyIntentCreated(intent: Record<string, unknown>): Promise<void> {
    const payload = this.createPayload("intent.created", intent);
  }

  async notifyBidReceived(bid: Record<string, unknown>): Promise<void> {
    const payload = this.createPayload("intent.bid_received", bid);
  }

  async notifyTaskCompleted(task: Record<string, unknown>): Promise<void> {
    const payload = this.createPayload("task.completed", task);
  }

  async notifyPaymentReceived(payment: Record<string, unknown>): Promise<void> {
    const payload = this.createPayload("payment.received", payment);
  }

  async notifyAgentRegistered(agent: Record<string, unknown>): Promise<void> {
    const payload = this.createPayload("agent.registered", agent);
  }

  async notifyCertificateMinted(
    certificate: Record<string, unknown>,
  ): Promise<void> {
    const payload = this.createPayload("certificate.minted", certificate);
  }
}

export const webhookService = new WebhookService();
