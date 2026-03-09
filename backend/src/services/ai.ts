import { z } from "zod";

const intentSchema = z.object({
  sourceChain: z.string(),
  sourceToken: z.string(),
  sourceAmount: z.string(),
  destChain: z.string(),
  destToken: z.string(),
  minDestAmount: z.string(),
  deadline: z.number().optional(),
  constraints: z.record(z.string()).optional(),
});

export interface ParsedIntent {
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  deadline?: number;
  constraints?: Record<string, unknown>;
  confidence: number;
  rawDescription: string;
}

export interface CodeGenerationRequest {
  framework: "elizaos" | "langchain" | "autogen" | "rig";
  template: string;
  config: Record<string, unknown>;
  language?: "typescript" | "python" | "rust";
}

export interface GeneratedCode {
  code: string;
  files: Array<{
    path: string;
    content: string;
  }>;
  dependencies?: string[];
}

export interface CodeAssistantRequest {
  context: string;
  code?: string;
  task: "explain" | "debug" | "optimize" | "complete";
}

export class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AI_API_KEY || "";
    this.baseUrl = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  }

  async parseIntentFromNaturalLanguage(
    description: string,
  ): Promise<ParsedIntent> {
    const prompt = `You are an intent parser for a decentralized task marketplace. 
Parse the following user request and extract structured intent parameters.
Return ONLY valid JSON with these fields:
- sourceChain: blockchain name (e.g., "ethereum", "solana", "near", "polygon", "arbitrum")
- sourceToken: token symbol or address
- sourceAmount: numeric amount as string
- destChain: destination blockchain
- destToken: destination token symbol or address  
- minDestAmount: minimum acceptable output as string
- deadline: optional timeout in seconds (default 600)
- constraints: any other constraints mentioned

User request: "${description}"

Respond with ONLY JSON, no markdown, no explanation.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || "{}";

      const cleaned = content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        ...intentSchema.parse(parsed),
        confidence: 0.85,
        rawDescription: description,
      };
    } catch (error) {
      console.error("Intent parsing failed:", error);
      return {
        sourceChain: "ethereum",
        sourceToken: "ETH",
        sourceAmount: "0",
        destChain: "ethereum",
        destToken: "USDC",
        minDestAmount: "0",
        confidence: 0.0,
        rawDescription: description,
      };
    }
  }

  async generateAgentCode(
    request: CodeGenerationRequest,
  ): Promise<GeneratedCode> {
    const templateConfigs: Record<string, string> = {
      "trading-bot": `Create an autonomous DeFi trading bot using ${request.framework} that:
- Monitors token prices on {sourceChain}
- Executes trades based on configured strategies (arbitrage, yield, liquidity)
- Manages slippage tolerance of {slippage}%
- Supports tokens: {tokens}`,

      "governance-monitor": `Create a DAO governance monitoring agent using ${request.framework} that:
- Watches for new proposals on configured DAOs ({daos})
- Analyzes proposal content
- Votes automatically based on strategy: {votingStrategy}`,

      "data-fetcher": `Create a data fetching agent using ${request.framework} that:
- Pulls data from: {sources}
- Updates at interval: {interval} seconds
- Aggregates and formats data`,

      "cross-chain-swapper": `Create a cross-chain swap agent using ${request.framework} that:
- Swaps from {sourceChain} to {destChain}
- Handles token: {token}
- Maintains slippage tolerance of {slippage}%`,

      "nft-flipper": `Create an NFT flipping agent using ${request.framework} that:
- Monitors marketplaces: {marketplaces}
- Buys under {maxPrice} ETH
- Targets {targetMargin}% profit margin`,

      "price-alert": `Create a price alert agent using ${request.framework} that:
- Monitors tokens: {tokens}
- Triggers alerts at {priceChangeThreshold}% change
- Sends via: {notificationChannels}`,
    };

    const prompt = `You are an expert Web3 agent developer. Generate complete, working code for a ${request.template} agent using ${request.framework} framework.

Configuration:
${JSON.stringify(request.config, null, 2)}

Requirements:
${templateConfigs[request.template] || "Create a generic agent"}

Return a JSON object with:
- code: main entry point code
- files: array of {path, content} for all required files
- dependencies: array of npm package names needed
- language: ${request.language || "typescript"}

Generate production-quality code with proper error handling, logging, and configuration.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || "{}";

      const cleaned = content.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Code generation failed:", error);
      return {
        code: "// Code generation failed",
        files: [],
        dependencies: [],
      };
    }
  }

  async assistWithCode(request: CodeAssistantRequest): Promise<string> {
    const taskPrompts: Record<string, string> = {
      explain: `Explain what this code does in simple terms:\n\n${request.code}`,
      debug: `Find bugs and issues in this code and suggest fixes:\n\n${request.code}`,
      optimize: `Optimize this code for performance and gas efficiency:\n\n${request.code}`,
      complete: `Complete this partially written code:\n\n${request.code}`,
    };

    const prompt = taskPrompts[request.task] || request.code;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful Web3 development assistant. Provide clear, concise answers.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      return data.choices?.[0]?.message?.content || "Unable to assist";
    } catch (error) {
      console.error("AI assistance failed:", error);
      return "Unable to provide assistance at this time";
    }
  }

  async generateTestCases(code: string, language: string): Promise<string[]> {
    const prompt = `Generate test cases for this ${language} code. Return ONLY a JSON array of test case strings, no other text:

${code}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Test generation failed:", error);
      return [];
    }
  }

  async validateAgentCode(code: string): Promise<{
    valid: boolean;
    errors: Array<{ line: number; message: string }>;
    warnings: string[];
  }> {
    const prompt = `Analyze this TypeScript/JavaScript code for errors and issues. Return ONLY valid JSON with this exact structure:
{
  "valid": boolean,
  "errors": [{"line": number, "message": "string"}],
  "warnings": ["string"]
}

Code:
${code}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || "{}";
      const cleaned = content.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (error) {
      return {
        valid: false,
        errors: [],
        warnings: ["Code validation failed"],
      };
    }
  }
}

export const aiService = new AIService();
