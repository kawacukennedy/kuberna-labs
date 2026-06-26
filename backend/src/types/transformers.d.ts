declare module '@xenova/transformers' {
  export class Pipeline {
    static async task(task: string, model?: string, options?: Record<string, unknown>): Promise<Pipeline>;
    async (inputs: string | string[], options?: Record<string, unknown>): Promise<unknown>;
  }
  export function pipeline(task: string, model?: string, options?: Record<string, unknown>): Promise<Pipeline>;
}
