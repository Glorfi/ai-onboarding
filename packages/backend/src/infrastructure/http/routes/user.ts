import { Router } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';

const router = Router();

router.get('/me', UserController.getCurrentUser);

export default router;
