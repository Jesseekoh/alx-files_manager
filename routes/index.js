import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = Router();

// create a new user
router.post('/users', UsersController.postNew);
router.get('/status', AppController.getStatus);

router.get('/stats', AppController.getStats);

export default router;
