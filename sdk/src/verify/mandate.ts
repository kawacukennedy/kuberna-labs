import type { Mandate, IdScheme } from './omworld-types.js';
import { jcsHash } from './jcs.js';

export class MandateBuilder {
  private specVersion: string;

  constructor(specVersion: string = '0.2.0') {
    this.specVersion = specVersion;
  }

  async build(options: {
    intentId: string;
    agent: string;
    agentScheme?: IdScheme;
    plan: string;
    bond?: string;
    feeQuote?: string;
    toolsDeclared?: string[];
    deadline: string;
    sign?: (hash: string) => Promise<string>;
  }): Promise<Mandate> {
    const planHash = await jcsHash(options.plan);

    const mandate: Mandate = {
      spec_version: this.specVersion,
      intent_id: options.intentId,
      agent: options.agent,
      agent_scheme: options.agentScheme || 'erc-8004',
      plan_hash: planHash,
      bond: options.bond || '0',
      fee_quote: options.feeQuote || '0',
      tools_declared: options.toolsDeclared || [],
      deadline: options.deadline,
      issued_at: new Date().toISOString(),
    };

    if (options.sign) {
      const hash = await mandateSigningPreimage(mandate);
      mandate.signature = await options.sign(hash);
    }

    return mandate;
  }

  async computePlanHash(plan: string): Promise<string> {
    return jcsHash(plan);
  }
}

/**
 * Reports whether a mandate carries a signature.
 *
 * This is a presence check ONLY. Signature material is opaque here (the SDK
 * does not know the agent's key or signature scheme), so this function cannot
 * and does not establish that a mandate is authentic. Callers must verify the
 * signature against the agent's registered public key themselves; treat any
 * caller that assumes this implies validity as vulnerable.
 */
export function hasMandateSignature(mandate: Mandate): boolean {
  return mandate.signature !== undefined && mandate.signature.length > 0;
}

/**
 * Canonical pre-image of a mandate, i.e. the mandate with its signature
 * removed. Exposed so callers can compute the exact bytes an agent must have
 * signed in order to verify a mandate.
 */
export async function mandateSigningPreimage(mandate: Mandate): Promise<string> {
  const { signature: _signature, ...unsigned } = mandate;
  return jcsHash(unsigned);
}
