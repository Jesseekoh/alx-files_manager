import mongoDBCore from 'mongodb/lib/core';
import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

export const getUserFromAuthHeader = async (req) => {
  const authorization = req.headers.authorization || null;
  if (!authorization) {
    return null;
  }

  const encodedUserDetails = authorization.split(' ')[1];
  const token = Buffer.from(encodedUserDetails, 'base64').toString();
  const seperatorPosition = token.indexOf('.com') + 4;
  const email = token.substring(0, seperatorPosition);
  const password = token.substring(seperatorPosition + 1);

  const user = await (dbClient.client.db().collection('users').findOne({ email }));

  if (!user || sha1(password) !== user.password) {
    return null;
  }
  return user;
};

export const getUserFromXToken = async (req) => {
  const token = req.headers['x-token'];

  if (token) {
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return null;
    }

    const user = await dbClient.client.db().collection('users').findOne({ _id: mongoDBCore.BSON.ObjectId(userId) });

    return user;
  }

  return null;
};

export const authenticateUser = (req, res) => {
  const user = getUserFromAuthHeader(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
