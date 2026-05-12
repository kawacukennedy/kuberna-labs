import { Router, Request, Response, NextFunction } from 'express';
import { intentParserService } from '../services/intentParser.js';
import { localMemory } from '../services/localMemory.js';

const router = Router();

router.post('/parse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Description is required', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    await localMemory.initialize();

    const result = await intentParserService.parse(description.trim());

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export const intentParserRouter = router;
