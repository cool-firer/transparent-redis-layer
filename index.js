'use strict';

const assert = require('assert');

class CacheLayer {

  constructor() {
    this.key = '';
    this.getAction = 'get';
    this.getActionArgs = [];
    this.setAction = 'set';
    this.setActionArgs = [];
    this.client = null;
    this.dataSource = null;
  }

  redisClient(redisClient) {
    this.client = redisClient;
    return this;
  }

  setRedisClient(redisClient) {
    this.client = redisClient;
    return this;
  }

  static isEmpty(value) {
    if (Array.isArray(value)) {
      return value.length === 0;
    } else if (typeof value === 'object') {
      if (value === null) return true;
      return Object.keys(value).length === 0;
    } else if (typeof value === 'string') {
      return value === '';
    } else if (typeof value === 'undefined') {
      return true;
    }
  }

  // cacheLayer.cache(key).actionForGet('lrange', 0, -1).actionForSet('rpush').from()
  cache(key) {
    this.key = key + '';
    return this;
  }

  actionForGet(action, ...args) {
    this.getAction = action || 'get';
    this.getActionArgs = args;
    return this;
  }

  actionForSet(action, ...args) {
    this.setAction = action;
    this.setActionArgs = args;
    return this;
  }

  from(source) {
    this.dataSource = source;
    return this;
  }

  async exec() {
    assert(this.key, 'key cannot be empty string or undefined or null');
    try {
      const res = await this.client[this.getAction](this.key, ...this.getActionArgs);
      if (!CacheLayer.isEmpty(res)) return res;
  
      const type = typeof this.dataSource;
      // normal type
      if(['number', 'string'].includes(type)) {
        await this.client[this.setAction](this.key, this.dataSource, ...this.setActionArgs);
        return this.dataSource;
      }
      // function or async function
      if (type === 'function') {
        const data = await this.dataSource();
        if (CacheLayer.isEmpty(data)) return;
        await this.client[this.setAction](this.key, data, ...this.setActionArgs);
        return data;
      }
      // promise
      if (this.dataSource instanceof Promise) {
        const data = await Promise.resolve(this.dataSource);
        if (CacheLayer.isEmpty(data)) return;
        await this.client[this.setAction](this.key, data, ...this.setActionArgs);
        return data;
      }
      return;
    } catch(err) {
      throw err;
    } finally {
      this.key = '';
      this.getAction = 'get';
      this.getActionArgs = [];
      this.setAction = 'set';
      this.setActionArgs = [];
      this.dataSource = null;
    }
  }
}
module.exports = CacheLayer;
