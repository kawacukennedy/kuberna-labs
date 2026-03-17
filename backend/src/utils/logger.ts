type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta: LogContext = {}): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
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

export const logger = {
  debug: (message: string, meta?: LogContext) => baseLogger.debug(message, meta),
  info: (message: string, meta?: LogContext) => baseLogger.info(message, meta),
  warn: (message: string, meta?: LogContext) => baseLogger.warn(message, meta),
  error: (message: string, meta?: LogContext) => baseLogger.error(message, meta),
  child: (context: LogContext) => baseLogger.child(context),
};

export default logger;
