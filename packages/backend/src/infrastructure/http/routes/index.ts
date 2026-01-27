import { Router } from 'express';
import authRoutes from './auth';
import oauthRoutes from './oauth';
import usersRoutes from './user';
import { authMiddleware } from '../middlewares';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/oauth', oauthRoutes);
router.use('/users', authMiddleware, usersRoutes);

export default router;
