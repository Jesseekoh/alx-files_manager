import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
// create a new user
router.post('/users', UsersController.postNew);

// user authentication
router.get('/connect', AuthController.getConnect);
router.get('/disconnect');

export default router;
