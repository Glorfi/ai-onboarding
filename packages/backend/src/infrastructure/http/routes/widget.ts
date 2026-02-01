import { Router } from 'express';
import { WidgetController } from '@/interfaces/controllers';
import { apiKeyMiddleware } from '../middlewares';

const router = Router();

// All widget routes require API key validation
router.use(apiKeyMiddleware);

router.post('/chat', WidgetController.chat);
router.post('/unanswered/email', WidgetController.saveEmail);
router.post('/rating', WidgetController.rateResponse);

export default router;
