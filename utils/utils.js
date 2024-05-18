import { ObjectId } from 'mongodb';
import dbClient from './db';

const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const Queue = require('bull');

/* const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile); */
const fileQueue = new Queue('fileQueue');

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

  static async readFile(path, req) {
    const { size } = req.query;
    let filePath = `${path}`;

    if (size) {
      filePath += `_${size}`;
    }

    try {
      const fileContent = await fs.readFile(filePath);

      return { error: false, data: fileContent };
    } catch (err) {
      return { error: true };
    }
  }

  static createJob(data) {
    fileQueue.add(data);
  }

  static async createThumbnail(path) {
    const widths = [500, 250, 100];

    // Create an array of promises
    const thumbnailPromises = widths.map(async (size) => {
      try {
        const options = { width: size, responseType: 'buffer' };
        const thumbnail = await imageThumbnail(path, options);

        const filePath = `${path}_${size}`;

        await fs.writeFile(filePath, thumbnail);
      } catch (err) {
        console.error(`Error creating thumbnail for size ${size}:`, err);
      }
    });
    // Wait for all promises to resolve
    await Promise.all(thumbnailPromises);
  }

/*
  static createImage(path) {
    const width = 1200;
    const height = 627;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    context.fillStyle = "#764abc";
    context.fillRect(0, 0, width, height);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path, buffer);
  }
  */
}

export default Utils;
