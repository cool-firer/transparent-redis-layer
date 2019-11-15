'use strict';

const Redis = require("ioredis");
const CacheLayer = require('./index');

describe('', function() {

  let redis = null;

  before(function() {
    redis = new Redis({
      port: 6379,         // Redis port
      host: "127.0.0.1",  // Redis host
      family: 4,          // 4 (IPv4) or 6 (IPv6)
      // password: "auth",
      // db: 0
    });
  });

  after(function() {
    if (redis) redis.disconnect();
  });

  it('dataSource is basic type', async function () {
    const cacheLayer = new CacheLayer();

    await cacheLayer.redisClient(redis)
      .cache('test:basic')
      .from('i am string')
      .exec();

    await cacheLayer
      .cache('test:basic2')
      .from(2234)
      .exec();
  });

  it('dataSource is function', async function () {
    const cacheLayer = new CacheLayer();
    await cacheLayer.redisClient(redis)
      .cache('test:function')
      .actionForGet('lrange', 0, -1)  // lrange test:function 0 -1
      .actionForSet('lpush')          // lpush test:function 0 1 2
      .from(async function(){
        return [0, 1, 2];
      })
      .exec();
  });

  it('dataSource is promise', async function () {
    const cacheLayer = new CacheLayer();
    await cacheLayer.redisClient(redis)
      .cache('test:promise')
      .actionForGet('hget', 'age')  // hget test:promise age
      .actionForSet('hmset')        // hmset test:promise age 456
      .from(new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({age: 456});
        }, 1000);
      }))
      .exec();
  });

  it('parameters', async function () {
    const cacheLayer = new CacheLayer();
    await cacheLayer.redisClient(redis)
      .cache('test:parameters')
      .actionForGet('get')        // get test:parameters
      .actionForSet('set', 'NX')  // set test:parameters 123 NX
      .from(async function() {
        return 123;
      })
      .exec();
  });

  it('assert fn', async function() {
    const cacheLayer = new CacheLayer();
    await cacheLayer.redisClient(redis)
    .cache('test:assertFn')
    .from('123')
    .exec();

    await cacheLayer
      .cache('test:assertFn')
      .actionForGet('get')        // get test:
      .assert(async function(res) {
        return res === '345';   // if test:parameters is not 345, then set test:parameters 345
      })
      .actionForSet('set')  // set test:parameters 123
      .from(async function() {
        return '345';
      })
      .exec();
  });

  it('change another redis client', async function () {
    const cacheLayer = new CacheLayer();
    await cacheLayer.redisClient(redis)
      .cache('test:anotherclient')
      .actionForGet('get')        // get test:parameters
      .actionForSet('set', 'NX')  // set test:parameters 123 NX
      .from(async function() {
        return 123;
      })
      .exec();

    const redis2 = new Redis({
      port: 6379,
      host: "127.0.0.1",
      family: 4,
      db: 1
    });
    const res = await cacheLayer
      .redisClient(redis2)
      .cache('test:anotherclient')
      .from('i am string')
      .exec();
      
    redis2.disconnect();
  });

});

