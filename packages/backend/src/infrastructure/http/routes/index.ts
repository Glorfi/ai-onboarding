import { Router } from 'express';
import authRoutes from './auth';
import oauthRoutes from './oauth';
import usersRoutes from './user';
import sitesRoutes from './sites';
import { authMiddleware } from '../middlewares';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/oauth', oauthRoutes);
router.use('/users', authMiddleware, usersRoutes);
router.use('/sites', authMiddleware, sitesRoutes);

export default router;
