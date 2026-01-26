import { Router } from 'express';
import authRoutes from './auth';
import oauthRoutes from './oauth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/oauth', oauthRoutes);

export default router;
