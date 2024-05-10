import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isClienetConnected = true;
    this.client.on('error', (err) => {
      console.log(err);
      this.isClienetConnected = false;
    });
    this.client.on('connect', () => {
      this.isClienetConnected = true;
    });
  }

  isAlive() {
    return this.isClienetConnected;
  }

  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  /**
   * stores a value in redis store
   * @param {*} key
   * @param {*} value value to store
   * @param {*} duration time till expiration of value
   */
  async set(key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  /**
   * deletes a value from redis store
   * @param {*} key
   */
  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
