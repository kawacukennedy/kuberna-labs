export { Erc8004Adapter } from './erc8004-adapter.js';
export type { Erc8004AdapterConfig } from './erc8004-adapter.js';
export { IdentityResolver } from './identity-resolver.js';
export { VerifierRouterClient } from './verifier-router.js';
export { ExecutionProofBuilder, createStep } from './execution-proof.js';
export { MandateBuilder, hasMandateSignature, mandateSigningPreimage } from './mandate.js';
export { kubernaToOmWorld, structuredToOmWorld, omWorldToKubernaNormalized, computeIntentId, canonicalIntentJson } from './intent-translator.js';
export { jcsCanonicalize, jcsHash } from './jcs.js';

export type {
  OmWorldIntent,
  OmWorldIntentBundle,
  ExecutionProof,
  Mandate,
  StepRecord,
  Artifact,
  SuccessClaim,
  Executor,
  Attestation,
  Constraints,
  SuccessCriteria,
  AgentIdentityRecord,
  VerifierMap,
  IdScheme,
  VerifierType,
  AttestationScheme,
  IntentStatus,
  ToolRegistryEntry,
} from './omworld-types.js';
