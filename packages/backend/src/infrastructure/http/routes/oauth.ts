import { Router } from 'express';
import { OAuthController } from '@/interfaces/controllers/OAuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Public endpoints
router.get('/:provider', OAuthController.getAuthUrl);
router.get('/:provider/callback', OAuthController.handleCallback);

// Protected endpoints (require auth)
router.get('/accounts', authMiddleware, OAuthController.getLinkedAccounts);
router.post('/:provider/link', authMiddleware, OAuthController.linkAccount);
router.delete('/:provider', authMiddleware, OAuthController.unlinkAccount);

export default router;
