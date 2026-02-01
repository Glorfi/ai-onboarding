import { Router } from 'express';
import authRoutes from './auth';
import oauthRoutes from './oauth';
import usersRoutes from './user';
import sitesRoutes from './sites';
import widgetRoutes from './widget';
import { authMiddleware } from '../middlewares';

const router = Router();

router.use('/auth', authRoutes);
router.use('/auth/oauth', oauthRoutes);
router.use('/users', authMiddleware, usersRoutes);
router.use('/sites', authMiddleware, sitesRoutes);
// Widget routes - public API with API key auth (no JWT)
router.use('/widget', widgetRoutes);

export default router;
