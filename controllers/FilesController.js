import mongoDBCore from 'mongodb/lib/core';
import { tmpdir } from 'os';
import { promisify } from 'util';
import {
  mkdir, writeFile,
} from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { getUserFromXToken } from '../utils/auth';
import dbClient from '../utils/db';

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
    return null;
  }

  static async getShow(req, res) {
    const user = await getUserFromXToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const userId = user._id.toString();
    const fileId = req.params.id;
    const file = await dbClient.client.db().collection('files').findOne({ userId: new mongoDBCore.BSON.ObjectId(userId), _id: new mongoDBCore.BSON.ObjectId(fileId) });

    if (!file) {
      res.status(404).json({ error: 'Not found' });
    } else {
      res.status(200).json({
        id: fileId,
        userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId === ROOT_FOLDER_ID.toString()
          ? 0
          : file.parentId.toString(),
      });
    }

    return null;
  }

  /**
   * gets files based on user and provided parentIndex
   */
  static async getIndex(req, res) {
    const user = await getUserFromXToken(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const parentId = req.query.parentId || ROOT_FOLDER_ID.toString();
    const page = /\d+/.test((req.query.page || '').toString())
      ? Number.parseInt(req.query.page, 10)
      : 0;
    const filesFilter = {
      userId: user._id,
      parentId: parentId === ROOT_FOLDER_ID.toString()
        ? parentId
        : new mongoDBCore.BSON.ObjectId(parentId),
    };

    const files = await (await (await dbClient.filesCollection())
      .aggregate([
        { $match: filesFilter },
        { $sort: { _id: -1 } },
        { $skip: page * 20 },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            id: '$_id',
            userId: '$userId',
            name: '$name',
            type: '$type',
            isPublic: '$isPublic',
            parentId: {
              $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
            },
          },
        },
      ])).toArray();
    res.status(200).json(files);
    return null;
  }
}
