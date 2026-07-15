import { config } from 'dotenv';
config({ path: `${__dirname}/../.env` });

const API_KEY = process.env.AI_API_KEY || '';
const BASE_URL = process.env.AI_BASE_URL || 'https://compute.virtuals.io/v1';
const MODEL = process.env.AI_MODEL || 'anthropic-claude-opus-4-7';
const VIRTUAL_API_KEY = process.env.VIRTUAL_API_KEY || API_KEY;

interface ChainAnalysis {
  chain: string;
  liquidity: string;
  activeProtocols: string[];
  gasStatus: string;
  opportunities: string[];
  risk: string;
}

interface CrossChainReport {
  timestamp: string;
  marketOverview: string;
  chains: ChainAnalysis[];
  bestOpportunities: { pair: string; reason: string; confidence: number }[];
  agentRecommendation: string;
  cost: number;
}

async function callVirtuals(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000
): Promise<{ content: string; cost: number }> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Virtuals API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    cost?: { usd?: number };
  };

  const content = data.choices?.[0]?.message?.content || '';
  const cost = data.cost?.usd || 0;

  return { content, cost };
}

async function analyzeCrossChainIntents(): Promise<CrossChainReport> {
  const systemPrompt = `You are a cross-chain intent analysis agent for Kuberna Labs.
You analyze market conditions across blockchain networks and identify optimal cross-chain opportunities.
Your output MUST be valid JSON. No markdown, no explanations outside the JSON.`;

  const userPrompt = `Analyze the current cross-chain landscape. Consider:
1. Major L1/L2 chains (Ethereum, Base, Arbitrum, Polygon, Solana, NEAR)
2. Current DeFi activity patterns
3. Gas price differences across chains
4. Bridging/swap opportunities between chains
5. Emerging trends in intent-based protocols

Return a JSON object with this exact structure:
{
  "marketOverview": "2-3 sentence summary of current cross-chain market conditions",
  "chains": [
    {
      "chain": "chain name",
      "liquidity": "high/medium/low",
      "activeProtocols": ["protocol1", "protocol2"],
      "gasStatus": "low/medium/high",
      "opportunities": ["specific opportunity"],
      "risk": "low/medium/high"
    }
  ],
  "bestOpportunities": [
    {
      "pair": "source->destination chain or token pair",
      "reason": "why this is a good opportunity",
      "confidence": 0.0-1.0
    }
  ],
  "agentRecommendation": "What Kuberna agents should focus on right now"
}

Include 4-6 chains and 2-3 best opportunities.`;

  const { content, cost } = await callVirtuals(systemPrompt, userPrompt, 2500);

  let report: CrossChainReport;
  try {
    const cleaned = content.replace(/```json|```/g, '').trim();
    report = JSON.parse(cleaned);
  } catch {
    report = {
      timestamp: new Date().toISOString(),
      marketOverview: 'Failed to parse structured analysis',
      chains: [],
      bestOpportunities: [],
      agentRecommendation: content.substring(0, 500),
      cost,
    };
  }

  report.timestamp = new Date().toISOString();
  report.cost = cost;

  return report;
}

export { analyzeCrossChainIntents, CrossChainReport, callVirtuals };

if (require.main === module) {
  analyzeCrossChainIntents()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      console.log(`\n--- Analysis complete ---`);
      console.log(`Cost: $${report.cost.toFixed(6)} USD`);
      console.log(`Model: ${MODEL}`);
    })
    .catch((err) => {
      console.error('Analysis failed:', err);
      process.exit(1);
    });
}
