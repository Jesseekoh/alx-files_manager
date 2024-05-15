import { ObjectId } from 'mongodb';
import dbClient from './db';

class Utils {
  static parseDoc(files) {
    return files.map((doc) => {
      const { _id, localpath, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  static async getDocWithPage(req) {
    const { parentId } = req.query;
    const page = parseInt(req.query.page, 10) || 0;
    const files = await dbClient.client.db().collection('files');

    const pipline = [];

    if (parentId) {
      pipline.push({ $match: { parentId: ObjectId(parentId) } });
    }

    pipline.push({ $skip: page * 20 });
    pipline.push({ $limit: 20 });

    const doc = await files.aggregate(pipline);

    return doc.toArray();
  }

  static async getFilesWithUserId(req) {
    const fileId = req.params.id;

    const files = await dbClient.client.db().collection('files');

    const doc = await files.find({ _id: ObjectId(fileId) });

    return doc.toArray();
  }
}

export default Utils;
