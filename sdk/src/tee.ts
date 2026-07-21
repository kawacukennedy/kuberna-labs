import { KubernaSDK } from './index.js';
import { KubernaError } from './errors.js';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface TeeConfig {
  /** حجم الذاكرة الافتراضي بالميجابايت */
  defaultMemory?: number;
  /** عدد المعالجات الافتراضي */
  defaultCpu?: number;
  /** مهلة إنشاء البيئة بالمللي ثانية */
  createTimeout?: number;
}

export interface CreateEnclaveParams {
  /** اسم البيئة الموثوقة */
  name: string;
  /** صورة Docker للتشغيل */
  image: string;
  /** حجم الذاكرة بالميجابايت (افتراضي: 512) */
  memory?: number;
  /** عدد وحدات المعالجة (افتراضي: 1) */
  cpu?: number;
  /** متغيرات البيئة */
  environment?: Record<string, string>;
  /** وسوم للتصنيف */
  tags?: string[];
  /** منطقة النشر */
  region?: string;
}

export interface Enclave {
  /** معرف البيئة */
  id: string;
  /** اسم البيئة */
  name: string;
  /** حالة البيئة */
  status: 'creating' | 'running' | 'stopped' | 'failed' | 'destroyed';
  /** صورة Docker */
  image: string;
  /** حجم الذاكرة */
  memory: number;
  /** عدد المعالجات */
  cpu: number;
  /** تقرير التوثيق */
  attestationReport?: string;
  /** تاريخ الإنشاء */
  createdAt: string;
  /** تاريخ آخر تحديث */
  updatedAt?: string;
  /** عنوان الاتصال */
  endpoint?: string;
  /** متغيرات البيئة */
  environment?: Record<string, string>;
}

export interface AttestationReport {
  /** معرف البيئة */
  enclaveId: string;
  /** التقرير الخام */
  report: string;
  /** حالة التحقق */
  verified: boolean;
  /** تاريخ التقرير */
  timestamp: string;
  /** قياسات الأمان */
  measurements: {
    /** قياس البيئة */
    mrEnclave: string;
    /** قياس الموقع */
    mrSigner: string;
    /** معرف المنتج */
    isvProdID: string;
    /** رقم إصدار الأمان */
    isvSVN: string;
  };
  /** تفاصيل إضافية */
  details?: {
    /** توقيع التقرير */
    signature?: string;
    /** شهادة الموثق */
    certificate?: string;
    /** مستوى الأمان */
    securityLevel?: number;
  };
}

export interface EnclaveListOptions {
  /** تصفية حسب الحالة */
  status?: Enclave['status'];
  /** عدد النتائج */
  limit?: number;
  /** مؤشر البداية */
  offset?: number;
  /** ترتيب حسب */
  orderBy?: 'createdAt' | 'name' | 'status';
}

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════

const DEFAULTS = {
  MEMORY: 512,
  CPU: 1,
  CREATE_TIMEOUT: 300000, // 5 دقائق
} as const;

const VALID_STATUSES = ['creating', 'running', 'stopped', 'failed', 'destroyed'] as const;

// ═══════════════════════════════════════════
// TeeManager Class
// ═══════════════════════════════════════════

/**
 * مدير بيئات التنفيذ الموثوقة (TEE)
 * 
 * @class TeeManager
 * @description إدارة بيئات TEE لتنفيذ العمليات الحساسة بشكل آمن
 * 
 * @example
 * ```typescript
 * const sdk = new KubernaSDK({ apiKey: '...' });
 * const tee = new TeeManager(sdk);
 * 
 * // إنشاء بيئة
 * const enclave = await tee.createEnclave({
 *   name: 'my-agent',
 *   image: 'docker.io/ubuntu:latest',
 *   memory: 1024,
 *   cpu: 2
 * });
 * 
 * // التحقق من التوثيق
 * const attestation = await tee.verifyAttestation(enclave.id);
 * console.log(attestation.verified ? 'موثوق' : 'غير موثوق');
 * ```
 */
export class TeeManager {
  private config: TeeConfig;

  constructor(
    private sdk: KubernaSDK,
    config?: TeeConfig
  ) {
    this.config = {
      defaultMemory: DEFAULTS.MEMORY,
      defaultCpu: DEFAULTS.CPU,
      createTimeout: DEFAULTS.CREATE_TIMEOUT,
      ...config,
    };
  }

  // ═══════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════

  /**
   * التحقق من صحة معرف البيئة
   */
  private validateEnclaveId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new KubernaError('معرف البيئة مطلوب', 'VALIDATION_ERROR', 400);
    }
  }

  /**
   * التحقق من صحة معاملات إنشاء البيئة
   */
  private validateCreateParams(params: CreateEnclaveParams): void {
    if (!params.name || params.name.trim().length === 0) {
      throw new KubernaError('اسم البيئة مطلوب', 'VALIDATION_ERROR', 400);
    }

    if (params.name.length < 3 || params.name.length > 64) {
      throw new KubernaError(
        'اسم البيئة يجب أن يكون بين 3 و 64 حرفاً',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!/^[a-zA-Z0-9-]+$/.test(params.name)) {
      throw new KubernaError(
        'اسم البيئة يجب أن يحتوي على أحرف وأرقام وشرطات فقط',
        'VALIDATION_ERROR',
        400
      );
    }

    if (!params.image || params.image.trim().length === 0) {
      throw new KubernaError('صورة البيئة مطلوبة', 'VALIDATION_ERROR', 400);
    }

    if (params.memory !== undefined && (params.memory < 128 || params.memory > 65536)) {
      throw new KubernaError(
        'الذاكرة يجب أن تكون بين 128 و 65536 ميجابايت',
        'VALIDATION_ERROR',
        400
      );
    }

    if (params.cpu !== undefined && (params.cpu < 1 || params.cpu > 64)) {
      throw new KubernaError(
        'عدد المعالجات يجب أن يكون بين 1 و 64',
        'VALIDATION_ERROR',
        400
      );
    }
  }

  /**
   * معالجة خطأ موحد
   */
  private handleError(operation: string, error: unknown): never {
    if (error instanceof KubernaError) throw error;

    const message = error instanceof Error ? error.message : 'خطأ غير معروف';
    throw new KubernaError(
      `فشل ${operation}: ${message}`,
      'TEE_ERROR',
      500
    );
  }

  // ═══════════════════════════════════════════
  // Enclave Management
  // ═══════════════════════════════════════════

  /**
   * إنشاء بيئة تنفيذ موثوقة جديدة
   * 
   * @param params - معاملات إنشاء البيئة
   * @returns البيئة المنشأة
   * 
   * @throws {KubernaError} إذا فشل الإنشاء
   * 
   * @example
   * ```typescript
   * const enclave = await tee.createEnclave({
   *   name: 'secure-agent',
   *   image: 'docker.io/nginx:latest',
   *   memory: 2048,
   *   cpu: 2,
   *   environment: { NODE_ENV: 'production' },
   *   tags: ['production', 'agent']
   * });
   * ```
   */
  async createEnclave(params: CreateEnclaveParams): Promise<Enclave> {
    this.validateCreateParams(params);

    try {
      const response = await this.sdk.request({
        method: 'POST',
        path: '/tee/enclaves',
        data: {
          name: params.name.trim(),
          image: params.image.trim(),
          memory: params.memory ?? this.config.defaultMemory,
          cpu: params.cpu ?? this.config.defaultCpu,
          environment: params.environment || {},
          tags: params.tags || [],
          region: params.region,
        } as unknown as Record<string, unknown>,
      });

      return response.data as Enclave;
    } catch (error) {
      this.handleError('إنشاء البيئة', error);
    }
  }

  /**
   * الحصول على تفاصيل بيئة محددة
   * 
   * @param id - معرف البيئة
   * @returns تفاصيل البيئة
   * 
   * @example
   * ```typescript
   * const enclave = await tee.getEnclave('enclave-123');
   * console.log(enclave.status); // 'running'
   * ```
   */
  async getEnclave(id: string): Promise<Enclave> {
    this.validateEnclaveId(id);

    try {
      const response = await this.sdk.request({
        method: 'GET',
        path: `/tee/enclaves/${id}`,
      });
      return response.data as Enclave;
    } catch (error) {
      this.handleError('الحصول على البيئة', error);
    }
  }

  /**
   * الحصول على قائمة جميع البيئات
   * 
   * @param options - خيارات التصفية والترتيب
   * @returns قائمة البيئات
   * 
   * @example
   * ```typescript
   * // جميع البيئات النشطة
   * const running = await tee.listEnclaves({ status: 'running' });
   * 
   * // أحدث 10 بيئات
   * const recent = await tee.listEnclaves({ limit: 10, orderBy: 'createdAt' });
   * ```
   */
  async listEnclaves(options?: EnclaveListOptions): Promise<Enclave[]> {
    try {
      const response = await this.sdk.request({
        method: 'GET',
        path: '/tee/enclaves',
        params: {
          ...(options?.status && { status: options.status }),
          ...(options?.limit && { limit: options.limit }),
          ...(options?.offset && { offset: options.offset }),
          ...(options?.orderBy && { orderBy: options.orderBy }),
        },
      });
      return (response.data as { enclaves: Enclave[] }).enclaves;
    } catch (error) {
      this.handleError('قائمة البيئات', error);
    }
  }

  /**
   * التحقق من تقرير توثيق البيئة
   * 
   * @param enclaveId - معرف البيئة
   * @returns تقرير التوثيق مع حالة التحقق
   * 
   * @example
   * ```typescript
   * const attestation = await tee.verifyAttestation('enclave-123');
   * 
   * if (attestation.verified) {
   *   console.log('البيئة موثوقة');
   *   console.log('قياس البيئة:', attestation.measurements.mrEnclave);
   * } else {
   *   console.log('تحذير: فشل التحقق من البيئة');
   * }
   * ```
   */
  async verifyAttestation(enclaveId: string): Promise<AttestationReport> {
    this.validateEnclaveId(enclaveId);

    try {
      const response = await this.sdk.request({
        method: 'POST',
        path: `/tee/enclaves/${enclaveId}/verify`,
        data: {},
      });
      return response.data as AttestationReport;
    } catch (error) {
      this.handleError('التحقق من التوثيق', error);
    }
  }

  /**
   * تدمير بيئة تنفيذ موثوقة
   * 
   * @param id - معرف البيئة
   * 
   * @example
   * ```typescript
   * await tee.destroyEnclave('enclave-123');
   * console.log('تم تدمير البيئة بنجاح');
   * ```
   */
  async destroyEnclave(id: string): Promise<void> {
    this.validateEnclaveId(id);

    try {
      await this.sdk.request({
        method: 'DELETE',
        path: `/tee/enclaves/${id}`,
      });
    } catch (error) {
      this.handleError('تدمير البيئة', error);
    }
  }

  // ═══════════════════════════════════════════
  // Convenience Methods
  // ═══════════════════════════════════════════

  /**
   * انتظار حتى تصبح البيئة جاهزة
   * 
   * @param id - معرف البيئة
   * @param timeoutMs - المهلة بالمللي ثانية (افتراضي: 300000)
   * @returns البيئة الجاهزة
   * 
   * @example
   * ```typescript
   * const enclave = await tee.waitForReady('enclave-123');
   * console.log('البيئة جاهزة للاستخدام');
   * ```
   */
  async waitForReady(id: string, timeoutMs?: number): Promise<Enclave> {
    this.validateEnclaveId(id);

    const timeout = timeoutMs ?? this.config.createTimeout;
    const startTime = Date.now();
    const pollInterval = 2000; // ثانيتين

    while (Date.now() - startTime < timeout) {
      const enclave = await this.getEnclave(id);

      if (enclave.status === 'running') {
        return enclave;
      }

      if (enclave.status === 'failed') {
        throw new KubernaError(
          `فشل إنشاء البيئة ${id}`,
          'TEE_CREATE_FAILED',
          500
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new KubernaError(
      `انتهت مهلة انتظار البيئة ${id} بعد ${timeout}ms`,
      'TIMEOUT_ERROR',
      408
    );
  }

  /**
   * التحقق مما إذا كانت البيئة موجودة
   * 
   * @param id - معرف البيئة
   * @returns true إذا كانت البيئة موجودة
   */
  async enclaveExists(id: string): Promise<boolean> {
    try {
      await this.getEnclave(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * الحصول على عدد البيئات
   * 
   * @param status - تصفية حسب الحالة (اختياري)
   * @returns عدد البيئات
   */
  async countEnclaves(status?: Enclave['status']): Promise<number> {
    const enclaves = await this.listEnclaves(status ? { status } : undefined);
    return enclaves.length;
  }
}
