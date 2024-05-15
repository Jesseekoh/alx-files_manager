import { ObjectId } from 'mongodb';
import dbClient from './db';

class Utils {
  static parseDoc(files) {
    return files.map((doc) => {
      const { _id, localPath, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  static async getDocWithPage(req) {
    const { parentId } = req.query;
    const page = parseInt(req.query.page, 10) || 0;
    const files = await dbClient.client.db().collection('files');

    const pipeline = [];

    if (parentId) {
      pipeline.push({ $match: { parentId: ObjectId(parentId) } });
    }

    pipeline.push({ $skip: page * 20 });
    pipeline.push({ $limit: 20 });

    const doc = await files.aggregate(pipeline);

    return doc.toArray();
  }

  static async getFilesWithId(req) {
    const fileId = req.params.id;

    const files = await dbClient.client.db().collection('files');

    const doc = await files.find({ _id: ObjectId(fileId) });

    return doc.toArray();
  }

  static async getFileCollection() {
    const files = await dbClient.client.db().collection('files');

    return files;
  }
}

export default Utils;
