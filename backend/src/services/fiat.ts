export type FiatProvider = "moonpay" | "stripe" | "transak";

export interface FiatQuote {
  provider: FiatProvider;
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  rate: number;
  fee: number;
  expiresAt: Date;
}

export interface FiatOrder {
  id: string;
  provider: FiatProvider;
  userId: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  toAmount: number;
  walletAddress: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  redirectUrl?: string;
  txHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateOnRampRequest {
  userId: string;
  fromCurrency: string;
  fromAmount: number;
  toCurrency: string;
  walletAddress: string;
  provider?: FiatProvider;
}

export class FiatOnRampService {
  private moonpayApiKey: string;
  private stripeSecretKey: string;
  private transakApiKey: string;

  constructor() {
    this.moonpayApiKey = process.env.MOONPAY_API_KEY || "";
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
    this.transakApiKey = process.env.TRANSAK_API_KEY || "";
  }

  async getQuote(request: CreateOnRampRequest): Promise<FiatQuote> {
    const provider = request.provider || "moonpay";

    if (provider === "moonpay") {
      return this.getMoonpayQuote(request);
    } else if (provider === "transak") {
      return this.getTransakQuote(request);
    } else {
      return this.getStripeQuote(request);
    }
  }

  private async getMoonpayQuote(
    request: CreateOnRampRequest,
  ): Promise<FiatQuote> {
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      KES: 153,
      NGN: 1550,
    };

    const cryptoRates: Record<string, number> = {
      ETH: 3500,
      USDC: 1,
      USDT: 1,
      NEAR: 5,
      SOL: 180,
    };

    const fromRate = rates[request.fromCurrency] || 1;
    const toRate = cryptoRates[request.toCurrency] || 1;
    const amountInUsd = request.fromAmount / fromRate;
    const toAmount = amountInUsd * toRate;
    const fee = amountInUsd * 0.04;

    return {
      provider: "moonpay",
      fromAmount: request.fromAmount,
      fromCurrency: request.fromCurrency,
      toAmount: toAmount - fee,
      toCurrency: request.toCurrency,
      rate: toRate / fromRate,
      fee,
      expiresAt: new Date(Date.now() + 60000),
    };
  }

  private async getTransakQuote(
    request: CreateOnRampRequest,
  ): Promise<FiatQuote> {
    const rate = 0.96;
    const fee = request.fromAmount * 0.03;

    return {
      provider: "transak",
      fromAmount: request.fromAmount,
      fromCurrency: request.fromCurrency,
      toAmount: (request.fromAmount - fee) * rate,
      toCurrency: request.toCurrency,
      rate,
      fee,
      expiresAt: new Date(Date.now() + 60000),
    };
  }

  private async getStripeQuote(
    request: CreateOnRampRequest,
  ): Promise<FiatQuote> {
    return {
      provider: "stripe",
      fromAmount: request.fromAmount,
      fromCurrency: request.fromCurrency,
      toAmount: request.fromAmount * 0.97,
      toCurrency: request.toCurrency,
      rate: 0.97,
      fee: request.fromAmount * 0.03,
      expiresAt: new Date(Date.now() + 60000),
    };
  }

  async createOrder(request: CreateOnRampRequest): Promise<FiatOrder> {
    const provider = request.provider || "moonpay";

    if (provider === "moonpay") {
      return this.createMoonpayOrder(request);
    } else if (provider === "transak") {
      return this.createTransakOrder(request);
    } else {
      return this.createStripeOrder(request);
    }
  }

  private async createMoonpayOrder(
    request: CreateOnRampRequest,
  ): Promise<FiatOrder> {
    const orderId = `moonpay-${Date.now()}`;
    const redirectUrl = `https://buy.moonpay.com?apiKey=${this.moonpayApiKey}&walletAddress=${request.walletAddress}&currencyCode=${request.toCurrency}&baseCurrencyAmount=${request.fromAmount}&baseCurrencyCode=${request.fromCurrency}`;

    return {
      id: orderId,
      provider: "moonpay",
      userId: request.userId,
      fromCurrency: request.fromCurrency,
      fromAmount: request.fromAmount,
      toCurrency: request.toCurrency,
      toAmount: request.fromAmount * 3500,
      walletAddress: request.walletAddress,
      status: "pending",
      redirectUrl,
      createdAt: new Date(),
    };
  }

  private async createTransakOrder(
    request: CreateOnRampRequest,
  ): Promise<FiatOrder> {
    const orderId = `transak-${Date.now()}`;

    return {
      id: orderId,
      provider: "transak",
      userId: request.userId,
      fromCurrency: request.fromCurrency,
      fromAmount: request.fromAmount,
      toCurrency: request.toCurrency,
      toAmount: request.fromAmount * 0.96,
      walletAddress: request.walletAddress,
      status: "pending",
      redirectUrl: `https://global.transak.com?apiKey=${this.transakApiKey}`,
      createdAt: new Date(),
    };
  }

  private async createStripeOrder(
    request: CreateOnRampRequest,
  ): Promise<FiatOrder> {
    const orderId = `stripe-${Date.now()}`;

    return {
      id: orderId,
      provider: "stripe",
      userId: request.userId,
      fromCurrency: request.fromCurrency,
      fromAmount: request.fromAmount,
      toCurrency: request.toCurrency,
      toAmount: request.fromAmount * 0.97,
      walletAddress: request.walletAddress,
      status: "pending",
      createdAt: new Date(),
    };
  }

  async getOrderStatus(orderId: string): Promise<FiatOrder | null> {
    return {
      id: orderId,
      provider: "moonpay",
      userId: "",
      fromCurrency: "USD",
      fromAmount: 100,
      toCurrency: "ETH",
      toAmount: 0.028,
      walletAddress: "",
      status: "completed",
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    return true;
  }

  getSupportedFiatCurrencies(): string[] {
    return ["USD", "EUR", "GBP", "KES", "NGN"];
  }

  getSupportedCryptoCurrencies(): Array<{
    symbol: string;
    name: string;
    networks: string[];
  }> {
    return [
      {
        symbol: "ETH",
        name: "Ethereum",
        networks: ["ethereum", "polygon", "arbitrum", "optimism"],
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        networks: ["ethereum", "polygon", "arbitrum", "solana"],
      },
      {
        symbol: "USDT",
        name: "Tether",
        networks: ["ethereum", "polygon", "arbitrum"],
      },
      { symbol: "NEAR", name: "NEAR Protocol", networks: ["near"] },
      { symbol: "SOL", name: "Solana", networks: ["solana"] },
      { symbol: "MATIC", name: "Polygon", networks: ["polygon"] },
    ];
  }

  async handleWebhook(event: Record<string, unknown>): Promise<void> {
    const eventType = event.type as string;

    if (eventType === "moonpay.payment_completed") {
      console.log("MoonPay payment completed");
    } else if (eventType === "transak.order.completed") {
      console.log("Transak order completed");
    }
  }
}

export const fiatOnRamp = new FiatOnRampService();
