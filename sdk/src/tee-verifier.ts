// ── TEE Technologies ─────────────────────────────────────────

export type TeeTechnology = 'sgx' | 'tdx' | 'sev-snp' | 'nitro' | 'phala';

// ── Witness / Proof Payloads ─────────────────────────────────

export interface SgxWitness {
  technology: 'sgx';
  quote: string;
  enclaveHeldData: string;
  mrEnclave: string;
  mrSigner: string;
  isvProdId: number;
  isvSvn: number;
  timestamp: number;
}

export interface TdxWitness {
  technology: 'tdx';
  quote: string;
  reportData: string;
  mrTd: string;
  rtmrs: string[];
  timestamp: number;
}

export interface SevSnpWitness {
  technology: 'sev-snp';
  attestation: string;
  reportData: string;
  chipId: string;
  platformVersion: string;
  timestamp: number;
}

export interface NitroWitness {
  technology: 'nitro';
  document: string;
  reportData: string;
  moduleId: string;
  timestamp: number;
}

export interface PhalaWitness {
  technology: 'phala';
  quote: string;
  timestamp: number;
  runtimeData: string;
}

export type AttestationWitness = SgxWitness | TdxWitness | SevSnpWitness | NitroWitness | PhalaWitness;

// ── Binding ──────────────────────────────────────────────────

export interface KeyBinding {
  algorithm: 'ed25519' | 'ecdsa' | 'raw';
  publicKey: string;
  subject: string;
}

export interface IntentBinding {
  intentHash: string;
  intentData?: string;
}

export interface WitnessBinding {
  key: KeyBinding;
  intent?: IntentBinding;
}

// ── Unified Attestation Envelope ─────────────────────────────

export interface AttestationEnvelope {
  witness: AttestationWitness;
  binding: WitnessBinding;
  signature: string;
}

// ── Verifier Adapter ─────────────────────────────────────────

export interface AttestationVerifier<T extends AttestationWitness = AttestationWitness> {
  readonly technology: T['technology'];
  verify(witness: T, binding: WitnessBinding): Promise<VerificationReceipt>;
}

export interface VerificationReceipt {
  verified: boolean;
  timestamp: number;
  measurements: Record<string, string>;
  mrEnclave?: string;
  mrSigner?: string;
  isvProdId?: string;
  isvSvn?: string;
  platform?: string;
  chipId?: string;
  error?: string;
}

// ── Verifier Registry ────────────────────────────────────────

export interface VerifierRegistry {
  register(verifier: AttestationVerifier): void;
  get(technology: string): AttestationVerifier | undefined;
  verify(envelope: AttestationEnvelope): Promise<VerificationReceipt>;
}

export function createVerifierRegistry(): VerifierRegistry {
  const verifiers = new Map<string, AttestationVerifier>();

  return {
    register(verifier: AttestationVerifier): void {
      verifiers.set(verifier.technology, verifier);
    },
    get(technology: string): AttestationVerifier | undefined {
      return verifiers.get(technology);
    },
    async verify(envelope: AttestationEnvelope): Promise<VerificationReceipt> {
      const verifier = verifiers.get(envelope.witness.technology);
      if (!verifier) {
        return {
          verified: false,
          timestamp: Date.now(),
          measurements: {},
          error: `no verifier registered for technology: ${envelope.witness.technology}`,
        };
      }
      return verifier.verify(envelope.witness, envelope.binding);
    },
  };
}

// ── Confirmation Gate ────────────────────────────────────────

export interface ConfirmationPolicy {
  requireAttestation: boolean;
  requiredTechnologies?: TeeTechnology[];
  allowedMeasurements?: Record<string, string[]>;
  allowSelfAttestation: boolean;
}

export interface ConfirmationRequest {
  envelope: AttestationEnvelope;
  policy: ConfirmationPolicy;
  action: string;
  payload: Record<string, unknown>;
}

export interface ConfirmationResponse {
  approved: boolean;
  verificationReceipt?: VerificationReceipt;
  rejectionReason?: string;
}

export function evaluateConfirmation(
  request: ConfirmationRequest,
  receipt: VerificationReceipt,
): ConfirmationResponse {
  if (request.policy.requireAttestation && !receipt.verified) {
    return { approved: false, verificationReceipt: receipt, rejectionReason: 'attestation verification failed' };
  }

  if (request.policy.requiredTechnologies && request.policy.requiredTechnologies.length > 0) {
    if (!request.policy.requiredTechnologies.includes(request.envelope.witness.technology as TeeTechnology)) {
      return {
        approved: false,
        verificationReceipt: receipt,
        rejectionReason: `required technology not met: ${request.envelope.witness.technology}`,
      };
    }
  }

  if (request.policy.allowedMeasurements && !request.policy.allowSelfAttestation) {
    const allowed = request.policy.allowedMeasurements;
    for (const [key] of Object.entries(receipt.measurements)) {
      if (Object.prototype.hasOwnProperty.call(allowed, key) && !allowed[key].includes(receipt.measurements[key])) {
        return {
          approved: false,
          verificationReceipt: receipt,
          rejectionReason: `measurement ${key}=${receipt.measurements[key]} not in allowed set`,
        };
      }
    }
  }

  return { approved: true, verificationReceipt: receipt };
}
