import { v4 as uuidv4 } from 'uuid';
import { getUserFromAuthHeader, getUserFromXToken } from '../utils/auth';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    // if (req.headers['x-token']) {
    //   console.log(req.headers['x-token']);
    // }
    const user = await getUserFromAuthHeader(req);
    if (user) {
      const token = uuidv4();

      console.log(token);

      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }

    // return null
  }

  static async getDisconnect(req, res) {
    const user = await getUserFromXToken(req);
    const token = req.headers['x-token'];

    if (user) {
      await redisClient.del(`auth_${token}`);
      res.status(204).end();
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
