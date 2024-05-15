import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import dbClient from './db';

const mime = require('mime-types');
const fs = require('fs');

const readFileAsync = promisify(fs.readFile);

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

  static async readFile(path, fileName) {
    const mimeType = mime.lookup(fileName);

    const encode = mime.charset(mimeType);

    const fileContent = await readFileAsync(path, encode);

    return fileContent;
  }
}

export default Utils;
