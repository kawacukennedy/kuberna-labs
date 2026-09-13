import { MandateBuilder, verifyMandateSignature } from '../src/verify/mandate.js';
import {
  kubernaToOmWorld,
  structuredToOmWorld,
  omWorldToKubernaNormalized,
} from '../src/verify/intent-translator.js';
import { ExecutionProofBuilder, createStep } from '../src/verify/execution-proof.js';
import { IdentityResolver } from '../src/verify/identity-resolver.js';
import type { KubernaNormalizedIntent } from '../src/intent-types.js';
import type { StructuredIntent } from '../src/intent.js';

// ── Fixtures reutilizables ───────────────────────────────────────────────
const baseKubernaIntent: KubernaNormalizedIntent = {
  standard: 'kuberna',
  originalFormat: 'kuberna',
  nonce: 'nonce-1',
  deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  swapper: '0xSwapper',
  originChainId: BigInt(8453),
  destinationChainId: BigInt(1),
  originToken: 'USDC',
  originAmount: BigInt(1000000),
  destinationToken: 'ETH',
  destinationAmount: BigInt(500000000000000),
  destinationRecipient: '0xRecipient',
  signer: '0xSigner',
  fillDeadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  message: '',
  attestationRequired: false,
};

// ── Objetivo 1: Round-trip firma -> verificacion de un mandate ──────────
describe('MandateBuilder round-trip signing', () => {
  it('builds a mandate and populates a signature when sign() is provided', async () => {
    const builder = new MandateBuilder();
    const fakeSign = jest.fn(async (hash: string) => `sig-over-${hash}`);

    const mandate = await builder.build({
      intentId: 'intent-1',
      agent: '0xAgent',
      plan: 'do the thing',
      deadline: new Date(Date.now() + 3600_000).toISOString(),
      sign: fakeSign,
    });

    expect(mandate.signature).toBeDefined();
    expect(fakeSign).toHaveBeenCalledTimes(1);
    expect(verifyMandateSignature(mandate)).toBe(true);
  });

  it('leaves signature undefined when sign() is not provided, and verify correctly reports that', async () => {
    const builder = new MandateBuilder();
    const mandate = await builder.build({
      intentId: 'intent-2',
      agent: '0xAgent',
      plan: 'do another thing',
      deadline: new Date(Date.now() + 3600_000).toISOString(),
    });

    expect(mandate.signature).toBeUndefined();
    expect(verifyMandateSignature(mandate)).toBe(false);
  });

  it('computePlanHash produces the same hash the builder embeds as plan_hash', async () => {
    const builder = new MandateBuilder();
    const plan = 'do the thing';
    const mandate = await builder.build({
      intentId: 'intent-3',
      agent: '0xAgent',
      plan,
      deadline: new Date(Date.now() + 3600_000).toISOString(),
    });
    const recomputed = await builder.computePlanHash(plan);
    expect(mandate.plan_hash).toBe(recomputed);
  });

  // HALLAZGO REAL, no un caso negativo inventado: verifyMandateSignature()
  // solo comprueba que el campo `signature` exista y no este vacio -- NO
  // verifica criptograficamente que la firma corresponda al contenido del
  // mandate, ni que provenga de la clave correcta. Este test documenta el
  // comportamiento REAL y actual (no lo que el nombre de la funcion
  // sugiere), para que quede explicito y visible en la suite en vez de
  // descubrirse por sorpresa despues. Reportado tambien en el PR/comentario
  // -- no se "arreglo" unilateralmente porque implica una decision de
  // diseno criptografico (que esquema de firma, que material de clave)
  // fuera del alcance de "agregar pruebas".
  it('DOCUMENTS a real gap: verifyMandateSignature accepts ANY non-empty string, including an unrelated/tampered one', async () => {
    const builder = new MandateBuilder();
    const mandate = await builder.build({
      intentId: 'intent-4',
      agent: '0xAgent',
      plan: 'do the thing',
      deadline: new Date(Date.now() + 3600_000).toISOString(),
      sign: async () => 'a-real-signature-over-the-correct-hash',
    });

    // Tamper: swap in a signature that was never computed over this
    // mandate's content at all.
    const tampered = { ...mandate, signature: 'totally-unrelated-string' };

    // Current behavior: this still reports as "verified". A real
    // cryptographic check (recompute the hash, verify against a known
    // public key) would reject this. Flagging for the maintainer rather
    // than silently encoding it as "correct".
    expect(verifyMandateSignature(tampered)).toBe(true);
  });
});

// ── Objetivo 2: Traduccion de intents -- conversion valida ──────────────
describe('intent translation: valid conversion', () => {
  it('kubernaToOmWorld produces a well-formed OmWorldIntent from a normalized Kuberna intent', () => {
    const intent = kubernaToOmWorld(baseKubernaIntent);

    expect(intent.principal).toBe(baseKubernaIntent.swapper);
    expect(intent.body).toContain('USDC');
    expect(intent.body).toContain('ETH');
    expect(intent.constraints?.allowed_tools).toContain('cross_chain_swap');
    expect(intent.nonce).toBe(baseKubernaIntent.nonce);
    expect(new Date(intent.expires_at!).getTime()).toBe(Number(baseKubernaIntent.deadline) * 1000);
  });

  it('kubernaToOmWorld generates a nonce when the source intent has none', () => {
    const { nonce, ...withoutNonce } = baseKubernaIntent;
    const intent = kubernaToOmWorld(withoutNonce as KubernaNormalizedIntent);
    expect(intent.nonce).toBeTruthy();
    expect(intent.nonce).not.toBe(nonce);
  });

  it('structuredToOmWorld produces a well-formed OmWorldIntent from a structured intent', () => {
    const structured: StructuredIntent = {
      sourceAmount: '100',
      sourceToken: 'USDC',
      destToken: 'ETH',
      destChain: 'base',
      timeoutSeconds: 600,
      budget: 50,
    } as StructuredIntent;

    const intent = structuredToOmWorld(structured);
    expect(intent.body).toContain('USDC');
    expect(intent.constraints?.budget).toBe('50');
  });

  it('kuberna -> omWorld -> kubernaNormalized round-trip preserves nonce and principal', () => {
    const omWorld = kubernaToOmWorld(baseKubernaIntent);
    const roundTripped = omWorldToKubernaNormalized(omWorld);
    expect(roundTripped.nonce).toBe(baseKubernaIntent.nonce);
    expect(roundTripped.signer).toBe(baseKubernaIntent.swapper);
  });

  // HALLAZGO REAL, corregido tras ejecutar contra el código real (mi
  // primera suposición -- que degradaba en silencio -- era incorrecta):
  // un deadline no numérico SÍ lanza, pero con un RangeError genérico de
  // JavaScript ("Invalid time value", desde .toISOString() sobre una
  // fecha inválida) -- no con un error tipado/de dominio como piden las
  // acceptance criteria del issue #70 ("typed errors, not raw throws").
  it('DOCUMENTS a real gap: a non-numeric deadline throws a raw RangeError, not a typed/domain error', () => {
    const malformed: KubernaNormalizedIntent = {
      ...baseKubernaIntent,
      deadline: undefined as unknown as bigint, // simula un campo de entrada malformado
    };

    // Comportamiento real actual: SÍ lanza (mejor que degradar en
    // silencio), pero es un RangeError crudo de JS, no un error tipado
    // que un caller pueda distinguir de otros fallos por su clase/código.
    expect(() => kubernaToOmWorld(malformed)).toThrow(RangeError);
    expect(() => kubernaToOmWorld(malformed)).toThrow('Invalid time value');
  });
});

// ── Objetivo 3: Integridad de la prueba de ejecucion (cadena de hashes) ──
// NOTA IMPORTANTE, para el PR/comentario: no existe ninguna funcion local
// de "verifyExecutionProof()" en el SDK -- la unica ruta de verificacion
// real (VerifierRouterClient.verify(), via Erc8004Adapter.verifyProof())
// llama a un contrato on-chain, lo cual NO es una prueba sin red como pide
// el issue. Las pruebas de abajo verifican, en cambio, la propiedad real
// que SI existe hoy sin red: que la cadena de hashes (prev_hash) que
// ExecutionProofBuilder construye es internamente consistente, y que
// alterar un paso despues de construido SI se puede detectar recalculando
// el hash con la funcion ya expuesta (computeStepHash) -- sin necesitar
// una funcion de verificacion dedicada que todavia no existe.
describe('execution-proof hash-chain integrity (no dedicated verify function exists yet)', () => {
  it('chains prev_hash correctly across multiple steps', async () => {
    const builder = new ExecutionProofBuilder();
    const steps = [
      createStep({ index: 0, tool: 'fetch', input: { url: 'a' }, output: { ok: true } }),
      createStep({ index: 1, tool: 'transform', input: { ok: true }, output: { result: 42 } }),
    ];
    const records = await builder.buildStepRecords(steps);

    expect(records).toHaveLength(2);
    expect(records[0].prev_hash).toBe('0x' + '0'.repeat(64)); // genesis
    const firstStepHash = await builder.computeStepHash(records[0]);
    expect(records[1].prev_hash).toBe(firstStepHash);
  });

  it('a tampered step is detectable by recomputing its hash (no dedicated verify() needed)', async () => {
    const builder = new ExecutionProofBuilder();
    const steps = [
      createStep({ index: 0, tool: 'fetch', input: { url: 'a' }, output: { ok: true } }),
    ];
    const records = await builder.buildStepRecords(steps);
    const originalHash = await builder.computeStepHash(records[0]);

    // Tamper with the recorded output after the fact.
    const tamperedRecord = { ...records[0], output: { ok: false } };
    const tamperedHash = await builder.computeStepHash(tamperedRecord);

    expect(tamperedHash).not.toBe(originalHash);
  });

  it('DOCUMENTS a real gap: there is no local verifyExecutionProof() -- the only verify path (VerifierRouterClient.verify) requires an on-chain call, so it cannot be unit-tested without network as issue #70 asks', () => {
    // Este test no ejercita codigo -- documenta explicitamente, para quien
    // lea la suite, por que "valid proof accepted / tampered proof
    // rejected" no aparece como una prueba directa de una funcion
    // dedicada: esa funcion no existe todavia sin dependencia de red.
    expect(true).toBe(true);
  });
});

// ── Objetivo 4: Resolvedor de identidad ──────────────────────────────────
// HALLAZGO REAL: el issue pide probar "fallback ordering", pero
// IdentityResolver.resolveAgent() no implementa ningun fallback -- resuelve
// contra una sola cadena (con default 84532) y lanza si no hay un
// despliegue conocido para ese chainId. Las pruebas de abajo cubren el
// comportamiento REAL que si existe: el error explicito por cadena
// desconocida, y que ese error se lanza ANTES de intentar ninguna llamada
// de red (por eso no requiere mockear ethers.Contract).
describe('IdentityResolver (real behavior -- no fallback logic exists yet to test)', () => {
  it('throws a clear, typed-message error for an unknown chain ID before attempting any contract call', async () => {
    const resolver = new IdentityResolver();
    const fakeProvider = {} as any; // nunca deberia usarse -- el throw ocurre antes

    await expect(
      resolver.resolveAgent(1n, fakeProvider, 999999)
    ).rejects.toThrow('No known ERC-8004 deployment for chain ID 999999');
  });

  it('buildExecutor returns the expected shape with and without a commitment', () => {
    const resolver = new IdentityResolver();
    expect(resolver.buildExecutor('agent-1')).toEqual({
      agent_id: 'agent-1',
      id_scheme: 'erc-8004',
      commitment: undefined,
    });
    expect(resolver.buildExecutor('agent-1', '0xcommit')).toEqual({
      agent_id: 'agent-1',
      id_scheme: 'erc-8004',
      commitment: '0xcommit',
    });
  });

  it('DOCUMENTS a real gap: resolveAgent has no fallback ordering -- a single chainId is tried, with no retry against alternate deployments if it fails', () => {
    // No hay una lista de cadenas candidatas ni un orden de intento en el
    // codigo real -- solo un chainId por llamada. Documentado para que el
    // maintainer confirme si esto es alcance futuro o si "fallback
    // ordering" en el issue se referia a otra cosa que no se encontro.
    expect(true).toBe(true);
  });
});
