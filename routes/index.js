import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
// create a new user
router.post('/users', UsersController.postNew);

// user authentication
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

// upload files
router.post('/files', FilesController.postUpload);

// Get and list file
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

// File publish/unpublish
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// File data
router.get('/files/:id/data', FilesController.getFile);
export default router;
