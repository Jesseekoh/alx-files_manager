import sha1 from 'sha1';
import dbClient from '../utils/db';
import { getUserFromXToken } from '../utils/auth';

export default class UsersController {
  /**
   * Creates a new user
   * @param {*} req request object
   * @param {*} res response object
   * @returns
   */
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await dbClient.client.db().collection('users').findOne({ email });

    if (user) {
      res.status(400).json({ error: 'Already exist' });
    } else {
      const insertDetails = await dbClient.client.db().collection('users').insertOne({ email, password: sha1(password) });
      console.log(insertDetails);
      const userId = insertDetails.insertedId.toString();
      res.status(201).json({ id: userId, email });
    }
  }

  /**
   * Retrieves a particular user based on token in the request header
   * @param {*} req
   * @param {*} res
   */
  static async getMe(req, res) {
    const user = await getUserFromXToken(req);

    if (user) {
      res.status(200).json({ id: user._id, email: user.email });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
