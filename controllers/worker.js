const { ObjectId } = require('mongodb');
import dbClient from '../utils/db';
import Utils from '../utils/utils';


const Queue = require('bull');

const fileQueue = new Queue('fileQueue')
  .on('completed', (job) => {
    console.log(`Job ${job.id}: completed!`);
  });

fileQueue.process(async function (job, done) {
  const { data } = job;

  if (!data.fileId) {
    done(new Error('Missing fileId'));
  }

  if (!data.userId) {
    done(new Error('Missing userId'));
  }

  const files = await dbClient.client.db().collection('files');

  const _id = ObjectId(data.fileId);
  const userId = ObjectId(data.userId)

  const doc = await files.find({ _id, userId }).toArray();

  if (doc.length === 0) {
    done(new Error('File not found'));
  }
  
  await Utils.createThumbnail(doc[0].localPath);
  done();
})
