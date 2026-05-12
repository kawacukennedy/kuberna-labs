type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogContext = Record<string, any>;

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta: LogContext = {}): void {
    const sanitizedMeta = meta && typeof meta === 'object' ? meta : { value: meta };
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...sanitizedMeta,
    };

    if (process.env.NODE_ENV !== 'test') {
      switch (level) {
        case 'debug':
          console.debug(JSON.stringify(logEntry));
          break;
        case 'info':
          console.info(JSON.stringify(logEntry));
          break;
        case 'warn':
          console.warn(JSON.stringify(logEntry));
          break;
        case 'error':
          console.error(JSON.stringify(logEntry));
          break;
      }
    }
  }

  debug(message: string, meta?: LogContext): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: LogContext): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: LogContext): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: LogContext): void {
    this.log('error', message, meta);
  }

  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

const baseLogger = new Logger({ service: 'kuberna-api' });

function toLogContext(meta: unknown): LogContext | undefined {
  if (meta === null || meta === undefined) return undefined;
  if (typeof meta === 'object' && !Array.isArray(meta)) return meta as LogContext;
  return { value: meta };
}

export const logger = {
  debug: (message: string, meta?: unknown) => baseLogger.debug(message, toLogContext(meta)),
  info: (message: string, meta?: unknown) => baseLogger.info(message, toLogContext(meta)),
  warn: (message: string, meta?: unknown) => baseLogger.warn(message, toLogContext(meta)),
  error: (message: string, meta?: unknown) => baseLogger.error(message, toLogContext(meta)),
  child: (context: LogContext) => baseLogger.child(context),
};

export default logger;
