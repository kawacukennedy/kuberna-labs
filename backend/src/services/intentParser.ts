import { localMemory } from './localMemory.js';
import { ragService } from './ragService.js';
import logger from '../utils/logger.js';

export interface StructuredIntent {
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  timeoutSeconds: number;
  budget: number;
  currency: string;
  confidence: number;
  rawDescription: string;
}

const CHAIN_SYNONYMS: Record<string, string> = {
  eth: 'ethereum',
  ethereum: 'ethereum',
  polygon: 'polygon',
  matic: 'polygon',
  arbitrum: 'arbitrum',
  arb: 'arbitrum',
  solana: 'solana',
  sol: 'solana',
  near: 'near',
  base: 'base',
  optimism: 'optimism',
  op: 'optimism',
  avalanche: 'avalanche',
  avax: 'avalanche',
  bsc: 'bsc',
  'binance smart chain': 'bsc',
};

const TOKEN_SYNONYMS: Record<string, string> = {
  eth: 'ETH',
  ethereum: 'ETH',
  weth: 'WETH',
  usdc: 'USDC',
  usdt: 'USDT',
  dai: 'DAI',
  sol: 'SOL',
  solana: 'SOL',
  near: 'NEAR',
  matic: 'MATIC',
  polygon: 'MATIC',
  btc: 'BTC',
  bitcoin: 'BTC',
  wbtc: 'WBTC',
  arb: 'ARB',
  link: 'LINK',
  uni: 'UNI',
  aave: 'AAVE',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: 'USD',
  usdc: 'USDC',
  usdt: 'USDT',
  near: 'NEAR',
  eth: 'ETH',
  sol: 'SOL',
};

interface ParserConfig {
  ruleSet: string;
  minConfidence: number;
}

const config: ParserConfig = {
  ruleSet: process.env.AI_PARSER_RULE_SET || 'default',
  minConfidence: parseFloat(process.env.AI_PARSER_MIN_CONFIDENCE || '0.6'),
};

function resolveChain(name: string): string | null {
  const lower = name.toLowerCase().trim();
  return CHAIN_SYNONYMS[lower] || null;
}

function resolveToken(name: string): string | null {
  const lower = name.toLowerCase().trim();
  return TOKEN_SYNONYMS[lower] || null;
}

function resolveCurrency(name: string): string {
  const lower = name.toLowerCase().trim();
  return CURRENCY_SYMBOLS[lower] || 'USD';
}

interface PatternHandler {
  regex: RegExp;
  extract: (match: RegExpMatchArray) => Partial<StructuredIntent>;
}

const PATTERN_HANDLERS: PatternHandler[] = [
  {
    // swap <amount> <token> for <token> on <chain> optionally to <chain>
    regex: /swap\s+(\d+(?:\.\d+)?)\s*(\w+)\s+(?:for|to|->|=>)\s+(\w+)(?:\s+(?:on|from|via)\s+(\w+))?(?:\s+to\s+(\w+))?/i,
    extract: (m) => ({
      sourceAmount: m[1],
      sourceToken: resolveToken(m[2]) || m[2].toUpperCase(),
      destToken: resolveToken(m[3]) || m[3].toUpperCase(),
      sourceChain: m[4] ? (resolveChain(m[4]) || m[4].toLowerCase()) : undefined,
      destChain: m[5] ? (resolveChain(m[5]) || m[5].toLowerCase()) : undefined,
    }),
  },
  {
    // bridge/send/transfer <amount> <token> from <chain> to <chain>
    regex: /(?:send|bridge|transfer)\s+(\d+(?:\.\d+)?)\s*(\w+)\s+(?:from|on)\s+(\w+)\s+(?:to|on)\s+(\w+)/i,
    extract: (m) => ({
      sourceAmount: m[1],
      sourceToken: resolveToken(m[2]) || m[2].toUpperCase(),
      destToken: resolveToken(m[2]) || m[2].toUpperCase(),
      sourceChain: resolveChain(m[3]) || m[3].toLowerCase(),
      destChain: resolveChain(m[4]) || m[4].toLowerCase(),
    }),
  },
  {
    // <amount> <token> -> <token> on <chain>
    regex: /(\d+(?:\.\d+)?)\s*(\w+)\s+(?:->|=>|to|for)\s+(\w+)\s+(?:on|at)\s+(\w+)/i,
    extract: (m) => ({
      sourceAmount: m[1],
      sourceToken: resolveToken(m[2]) || m[2].toUpperCase(),
      destToken: resolveToken(m[3]) || m[3].toUpperCase(),
      sourceChain: resolveChain(m[4]) || m[4].toLowerCase(),
    }),
  },
  {
    // buy/sell/trade <amount> <token> for <token>
    regex: /(?:buy|sell|trade)\s+(\d+(?:\.\d+)?)\s*(\w+)\s+(?:for|to)\s+(\w+)/i,
    extract: (m) => ({
      sourceAmount: m[1],
      sourceToken: resolveToken(m[2]) || m[2].toUpperCase(),
      destToken: resolveToken(m[3]) || m[3].toUpperCase(),
    }),
  },
  {
    // exchange/convert <amount> <token> to/for <token>
    regex: /(?:exchange|convert)\s+(\d+(?:\.\d+)?)\s*(\w+)\s+(?:to|->|for)\s+(\w+)/i,
    extract: (m) => ({
      sourceAmount: m[1],
      sourceToken: resolveToken(m[2]) || m[2].toUpperCase(),
      destToken: resolveToken(m[3]) || m[3].toUpperCase(),
    }),
  },
];

function extractByRules(text: string): Partial<StructuredIntent> {
  const lower = text.toLowerCase();

  for (const handler of PATTERN_HANDLERS) {
    const match = lower.match(handler.regex);
    if (match) {
      const result = handler.extract(match);
      if (!result.sourceChain) result.sourceChain = 'ethereum';
      if (!result.destChain) result.destChain = result.sourceChain || 'ethereum';
      return result;
    }
  }

  // Fallback: extract chain names from prepositions
  const chains: string[] = [];
  const chainRegex = /(?:on|from|to|via|chain)\s+(\w+)/gi;
  let chainMatch: RegExpExecArray | null;
  while ((chainMatch = chainRegex.exec(lower)) !== null) {
    const resolved = resolveChain(chainMatch[1]);
    if (resolved) chains.push(resolved);
  }

  return {
    sourceChain: chains[0] || 'ethereum',
    destChain: chains[1] || chains[0] || 'ethereum',
  };
}

function extractKeywords(text: string): Partial<StructuredIntent> {
  const result: Partial<StructuredIntent> = {};
  const lower = text.toLowerCase();

  const amountMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*/);
  if (amountMatch) result.sourceAmount = amountMatch[1];

  const chains: string[] = [];
  const chainRegex = /(?:on|from|to|via|chain)\s+(\w+)/gi;
  let match: RegExpExecArray | null;
  while ((match = chainRegex.exec(lower)) !== null) {
    const resolved = resolveChain(match[1]);
    if (resolved) chains.push(resolved);
  }

  const tokenMatch = lower.match(/\b(eth|usdc|usdt|dai|sol|near|btc|wbtc|matic|arb|link|uni|aave)\b/i);
  if (tokenMatch) {
    result.sourceToken = resolveToken(tokenMatch[1]) || tokenMatch[1].toUpperCase();
  }

  const toTokenMatch = lower.match(/(?:for|to|->|=>)\s*(eth|usdc|usdt|dai|sol|near|btc)\b/i);
  if (toTokenMatch) {
    result.destToken = resolveToken(toTokenMatch[1]) || toTokenMatch[1].toUpperCase();
  }

  if (chains.length >= 1) result.sourceChain = chains[0];
  if (chains.length >= 2) result.destChain = chains[1];

  if (!result.sourceChain) result.sourceChain = 'ethereum';
  if (!result.destChain) result.destChain = result.sourceChain;
  if (!result.sourceToken) result.sourceToken = 'ETH';
  if (!result.destToken) result.destToken = 'USDC';
  if (!result.sourceAmount) result.sourceAmount = '0';

  return result;
}

function calculateConfidence(parsed: Partial<StructuredIntent>): number {
  let score = 0.0;
  if (parsed.sourceToken) score += 0.2;
  if (parsed.destToken && parsed.destToken !== parsed.sourceToken) score += 0.2;
  if (parsed.sourceAmount && parsed.sourceAmount !== '0') score += 0.2;
  if (parsed.sourceChain) score += 0.15;
  if (parsed.destChain && parsed.destChain !== parsed.sourceChain) score += 0.15;
  if (parsed.sourceChain && parsed.destChain) score += 0.1;
  return Math.min(score, 1.0);
}

function buildIntent(parsed: Partial<StructuredIntent>, description: string, confidence: number): StructuredIntent {
  return {
    sourceChain: parsed.sourceChain || 'ethereum',
    sourceToken: parsed.sourceToken || 'ETH',
    sourceAmount: parsed.sourceAmount || '0',
    destChain: parsed.destChain || 'ethereum',
    destToken: parsed.destToken || 'USDC',
    minDestAmount: parsed.minDestAmount || '0',
    timeoutSeconds: parsed.timeoutSeconds ?? 600,
    budget: parsed.budget ?? 10,
    currency: parsed.currency || resolveCurrency(description),
    confidence,
    rawDescription: description,
  };
}

export async function parseIntent(description: string, useRAG = true): Promise<StructuredIntent> {
  if (!description || description.trim().length === 0) {
    return buildIntent({}, description, 0);
  }

  const text = description.trim();

  const memoryResult = await localMemory.query(text);
  if (memoryResult) {
    logger.info('Intent parsed from local memory', { description });
    return { ...memoryResult, rawDescription: text };
  }

  let ruleResult = extractByRules(text);
  let confidence = calculateConfidence(ruleResult);

  if (confidence < config.minConfidence) {
    ruleResult = extractKeywords(text);
    confidence = calculateConfidence(ruleResult);
  }

  let intent = buildIntent(ruleResult, description, confidence);

  if (useRAG) {
    const enhanced = await ragService.enhanceIntentWithRAG(description, intent);
    if (enhanced.confidence > intent.confidence) {
      intent = enhanced;
    }
  }

  if (intent.sourceAmount !== '0' && intent.sourceToken && intent.destToken) {
    await localMemory.store(description, intent);
  }

  return intent;
}

export class IntentParserService {
  async parse(description: string): Promise<StructuredIntent> {
    return parseIntent(description);
  }
}

export const intentParserService = new IntentParserService();
