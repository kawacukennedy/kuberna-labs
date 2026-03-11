import { connect, JetStreamClient, NatsConnection, Subscription } from "nats";

export interface IntentMessage {
  intentId: string;
  requesterId: string;
  description: string;
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  budget: string;
  deadline: number;
  createdAt: string;
}

export interface BidMessage {
  intentId: string;
  agentId: string;
  agentOwnerId: string;
  price: string;
  estimatedTime: number;
  routeDetails?: Record<string, unknown>;
  createdAt: string;
}

export interface TaskMessage {
  taskId: string;
  intentId: string;
  agentId: string;
  status: "assigned" | "executing" | "completed" | "failed";
  createdAt: string;
}

export interface AgentMessage {
  agentId: string;
  ownerId: string;
  event: "registered" | "status_changed" | "heartbeat" | "offline";
  status?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class MessageQueueService {
  private nc: NatsConnection | null = null;
  private js: JetStreamClient | null = null;
  private connected: boolean = false;
  private subscribers: Map<string, Subscription> = new Map();

  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      const servers = process.env.NATS_SERVERS?.split(",") || [
        "nats://localhost:4222",
      ];

      this.nc = await connect({
        servers,
        name: "kuberna-backend",
        reconnect: true,
        maxReconnectAttempts: 10,
        user: process.env.NATS_USER,
        pass: process.env.NATS_PASSWORD,
      });

      this.js = this.nc.jetstream();
      this.connected = true;

      console.log("Connected to NATS");
    } catch (error) {
      console.error("Failed to connect to NATS:", error);
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    for (const sub of this.subscribers.values()) {
      sub.unsubscribe();
    }
    this.subscribers.clear();

    if (this.nc) {
      await this.nc.close();
      this.nc = null;
      this.js = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.nc !== null;
  }

  async publish(subject: string, data: unknown): Promise<boolean> {
    if (!this.js) {
      console.warn("NATS not connected, message not published");
      return false;
    }

    try {
      const payload = JSON.stringify(data);
      await this.js.publish(subject, new TextEncoder().encode(payload));
      return true;
    } catch (error) {
      console.error("Failed to publish message:", error);
      return false;
    }
  }

  async publishIntent(intent: IntentMessage): Promise<boolean> {
    return this.publish("intents.new", intent);
  }

  async publishBid(bid: BidMessage): Promise<boolean> {
    return this.publish(`intents.${bid.intentId}.bids.new`, bid);
  }

  async publishTask(task: TaskMessage): Promise<boolean> {
    return this.publish("tasks.status", task);
  }

  async publishAgentEvent(event: AgentMessage): Promise<boolean> {
    return this.publish("agents.events", event);
  }

  async subscribe(
    subject: string,
    callback: (data: unknown) => void,
  ): Promise<string> {
    if (!this.nc) {
      throw new Error("NATS not connected");
    }

    const subscriptionId = `${subject}-${Date.now()}`;
    const sub = this.nc.subscribe(subject, {
      callback: (err, msg) => {
        if (err) {
          console.error("Subscription error:", err);
          return;
        }

        try {
          const data = JSON.parse(new TextDecoder().decode(msg.data));
          callback(data);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      },
    });

    this.subscribers.set(subscriptionId, sub);
    return subscriptionId;
  }

  async subscribeToIntents(
    callback: (intent: IntentMessage) => void,
  ): Promise<string> {
    return this.subscribe("intents.new", (data) =>
      callback(data as IntentMessage),
    );
  }

  async subscribeToBids(
    intentId: string,
    callback: (bid: BidMessage) => void,
  ): Promise<string> {
    return this.subscribe(`intents.${intentId}.bids.new`, (data) =>
      callback(data as BidMessage),
    );
  }

  async subscribeToTaskUpdates(
    callback: (task: TaskMessage) => void,
  ): Promise<string> {
    return this.subscribe("tasks.status", (data) =>
      callback(data as TaskMessage),
    );
  }

  async subscribeToAgentEvents(
    callback: (event: AgentMessage) => void,
  ): Promise<string> {
    return this.subscribe("agents.events", (data) =>
      callback(data as AgentMessage),
    );
  }

  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscribers.get(subscriptionId);
    if (sub) {
      sub.unsubscribe();
      this.subscribers.delete(subscriptionId);
      return true;
    }
    return false;
  }

  async queueSubscribe(
    subject: string,
    queue: string,
    callback: (data: unknown) => void,
  ): Promise<string> {
    if (!this.nc) {
      throw new Error("NATS not connected");
    }

    const subscriptionId = `${subject}-${queue}-${Date.now()}`;
    const sub = this.nc.subscribe(subject, {
      queue,
      callback: (err, msg) => {
        if (err) {
          console.error("Queue subscription error:", err);
          return;
        }

        try {
          const data = JSON.parse(new TextDecoder().decode(msg.data));
          callback(data);
        } catch (error) {
          console.error("Failed to parse message:", error);
        }
      },
    });

    this.subscribers.set(subscriptionId, sub);
    return subscriptionId;
  }

  async getStats(): Promise<{
    connected: boolean;
    subscribers: number;
    serverInfo?: Record<string, unknown>;
  }> {
    return {
      connected: this.isConnected(),
      subscribers: this.subscribers.size,
      serverInfo: this.nc ? { serverId: this.nc.info?.server_id } : undefined,
    };
  }
}

export const messageQueue = new MessageQueueService();
