import sha1 from 'sha1';
import dbClient from '../utils/db';

export default class UsersController {
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
      res.status(400).send({ error: 'Already exist' });
    } else {
      const insertDetails = await dbClient.client.db().collection('users').insertOne({ email, password: sha1(password) });
      console.log(insertDetails);
      const userId = insertDetails.insertedId.toString();
      res.status(200).json({ id: userId, email });
    }
  }
}
