import crypto from "crypto";
import logger from '../utils/logger.js';

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
  private subscriptions: Map<string, WebhookSubscription> = new Map();

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

  registerSubscription(subscription: WebhookSubscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  removeSubscription(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  getEventSubscriptions(event: WebhookEvent): WebhookSubscription[] {
    const matches: WebhookSubscription[] = [];
    for (const sub of this.subscriptions.values()) {
      if (sub.active && sub.events.includes(event)) {
        matches.push(sub);
      }
    }
    return matches;
  }

  async deliverToEvent(event: WebhookEvent, data: Record<string, unknown>): Promise<WebhookDelivery[]> {
    const payload = this.createPayload(event, data);
    const subscriptions = this.getEventSubscriptions(event);
    const results: WebhookDelivery[] = [];
    for (const sub of subscriptions) {
      const delivery = await this.deliver(sub, payload);
      results.push(delivery);
    }
    return results;
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
      logger.error("Webhook delivery error:", error);
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
    await this.deliverToEvent("intent.created", intent);
  }

  async notifyBidReceived(bid: Record<string, unknown>): Promise<void> {
    await this.deliverToEvent("intent.bid_received", bid);
  }

  async notifyTaskCompleted(task: Record<string, unknown>): Promise<void> {
    await this.deliverToEvent("task.completed", task);
  }

  async notifyPaymentReceived(payment: Record<string, unknown>): Promise<void> {
    await this.deliverToEvent("payment.received", payment);
  }

  async notifyAgentRegistered(agent: Record<string, unknown>): Promise<void> {
    await this.deliverToEvent("agent.registered", agent);
  }

  async notifyCertificateMinted(
    certificate: Record<string, unknown>,
  ): Promise<void> {
    await this.deliverToEvent("certificate.minted", certificate);
  }
}

export const webhookService = new WebhookService();
