import { Request, Response, NextFunction } from 'express';

export interface TimeoutOptions {
  timeout: number;
  onTimeout?: (req: Request, res: Response) => void;
}

export const requestTimeout = (options: TimeoutOptions) => {
  const { timeout, onTimeout } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        if (onTimeout) {
          onTimeout(req, res);
        } else {
          res.status(504).json({
            success: false,
            error: {
              message: 'Request timeout',
              code: 'GATEWAY_TIMEOUT',
            },
          });
        }
      }
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timeoutId);
    });

    next();
  };
};

export const defaultTimeout = requestTimeout({
  timeout: 30000,
});
