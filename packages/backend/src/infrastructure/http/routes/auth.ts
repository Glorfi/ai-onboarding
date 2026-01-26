import { Router } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';

const router = Router();

router.post('/signup', UserController.register);
router.post('/signin', UserController.signIn);
router.post('/refresh', UserController.refreshToken);

export default router;
