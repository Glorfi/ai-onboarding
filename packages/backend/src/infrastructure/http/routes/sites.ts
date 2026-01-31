import { Router } from 'express';
import { SiteController } from '@/interfaces/controllers';

const router = Router();

router.post('/', SiteController.create);
router.get('/mine', SiteController.getUserSites);
router.get('/:id/crawl-status', SiteController.getCrawlStatus);
router.post('/:id/recrawl', SiteController.recrawl);
router.delete('/:id', SiteController.delete);

export default router;
