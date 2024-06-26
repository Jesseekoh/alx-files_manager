import mongoDBCore from 'mongodb/lib/core';
import { ObjectId } from 'mongodb';
import { tmpdir } from 'os';
import { promisify } from 'util';
import {
  mkdir, writeFile,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { getUserFromXToken } from '../utils/auth';
import Utils from '../utils/utils';
import dbClient from '../utils/db';

const mime = require('mime-types');

const ROOT_FOLDER_ID = 0;
const DEFAULT_ROOT_FOLDER = 'files_manager';
const VALID_FILE_TYPES = {
  file: 'file',
  folder: 'folder',
  image: 'image',
};
const mkDirAsync = promisify(mkdir);
const writeFileAsync = promisify(writeFile);
// const statAsync = promisify(stat);
// const realPathAsync = promisify(realpath);
export default class FilesController {
  static async postUpload(req, res) {
    const user = await getUserFromXToken(req);

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const name = req.body ? req.body.name : null;
    const type = req.body ? req.body.type : null;
    let parentId = req.body && req.body.parentId ? req.body.parentId : ROOT_FOLDER_ID; // Edward
    const isPublic = req.body && req.body.isPublic ? req.body.isPublic : false;
    const data = req.body ? req.body.data : '';
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return null;
    }

    if (!type || !VALID_FILE_TYPES[type]) {
      res.status(400).json({ error: 'Missing type' });
      return null;
    }

    if (!data && type !== VALID_FILE_TYPES.folder) {
      res.status(400).json({ error: 'Missing data' });
      return null;
    }

    if (parentId) {
      const file = await dbClient.client.db().collection('files').findOne({ _id: mongoDBCore.BSON.ObjectId(parentId) });
      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return null;
      }

      if (file.type !== VALID_FILE_TYPES.folder) {
        res.status(400).json({ error: 'Parent is not a folder' });
        return null;
      }
    }
    if (parentId !== 0) {
      parentId = new mongoDBCore.BSON.ObjectId(parentId); // Edward
    }
    const userId = user._id.toString();
    const newFile = {
      userId: new mongoDBCore.BSON.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId, // Edward update this
    };

    const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : join(tmpdir(), DEFAULT_ROOT_FOLDER);
    await mkDirAsync(baseDir, { recursive: true });
    if (type !== VALID_FILE_TYPES.folder) {
      const localPath = join(baseDir, uuidv4());

      await writeFileAsync(localPath, Buffer.from(data, 'base64'));

      newFile.localPath = localPath;
    }

    const insertionInfo = await dbClient.client.db().collection('files').insertOne(newFile);
    const fileId = insertionInfo.insertedId.toString();
    res.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
        ? 0
        : parentId,
    });

    if (type === 'image') {
      Utils.createJob({ userId, fileId });
    }

    return null;
  }

  static async getIndex(req, res) {
    const user = await getUserFromXToken(req);

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const files = await Utils.getDocWithPage(req);

    const data = Utils.parseDoc(files);

    return res.send(data);
  }

  static async getShow(req, res) {
    const user = await getUserFromXToken(req);

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const files = await Utils.getFilesWithId(req);

    if (files.length === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    const data = Utils.parseDoc(files);

    return res.send(data[0]);
  }

  static async putPublish(req, res) {
    const user = await getUserFromXToken(req);
    const { id } = req.params;

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const files = await Utils.getFileCollection();

    await files.updateOne({ _id: ObjectId(id) }, { $set: { isPublic: true } });

    const doc = await Utils.getFilesWithId(req);

    if (doc.length === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    const data = Utils.parseDoc(doc);

    return res.send(data[0]);
  }

  static async putUnpublish(req, res) {
    const user = await getUserFromXToken(req);
    const { id } = req.params;

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const files = await Utils.getFileCollection();

    await files.updateOne({ _id: ObjectId(id) }, { $set: { isPublic: false } });

    const doc = await Utils.getFilesWithId(req);

    if (doc.length === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    const data = Utils.parseDoc(doc);

    return res.send(data[0]);
  }

  static async getFile(req, res) {
    const user = await getUserFromXToken(req);

    const doc = await Utils.getFilesWithId(req);

    if (doc.length === 0) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (!user && !doc[0].isPublic) {
      return res.status(404).send({ error: 'Not found' });
    }

    if (doc.type === 'folder') {
      return res.status(400).send({ error: 'A folder doesn\'t have content' });
    }

    const data = await Utils.readFile(doc[0].localPath, req);

    if (data.error) {
      return res.status(404).send({ error: 'Not found' });
    }

    const mimeType = mime.lookup(doc[0].name);

    res.setHeader('Content-Type', mimeType);

    return res.send(data.data);
  }
}
