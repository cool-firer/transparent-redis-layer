
# transparent-redis-layer

## Installation

```js
$ npm install transparent-redis-layer
```

## Usage


try to get redis data, if key not exists, fill the data to the corresponding key.

## Example

```js

const Redis = require("ioredis");
const CacheLayer = require('./index');
const redis = new Redis({
  port: 6379,         // Redis port
  host: "127.0.0.1",  // Redis host
  family: 4,          // 4 (IPv4) or 6 (IPv6)
  // password: "auth",
  // db: 0
});

const cacheLayer = new CacheLayer();

// if actionForGet not set, then default command is "get". default set command is "set"
// this will "get test:basic", if test:basic not exists, then "set test:basic i am string"
const res = await cacheLayer
  .redisClient(redis)
  .cache('test:basic')
  .from('i am string')
  .exec();

// maintain redis clent
const funcRes = await cacheLayer
  .cache('test:function')
  .actionForGet('lrange', 0, -1)  // lrange test:function 0 -1
  .actionForSet('lpush')          // lpush test:function 0 1 2
  .from(function(){
    return [0, 1, 2];
  })
  .exec();

const promiseRes = await cacheLayer
  .cache('test:promise')
  .actionForGet('hget', 'age')  // hget test:promise age
  // use hmset instead of hset
  .actionForSet('hmset')        // hmset test:promise age 456
  .from(new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({age: 456});
    }, 1000);
  }))
  .exec();

const setParameterRes = await cacheLayer
  .cache('test:parameters')
  .actionForGet('get')        // get test:parameters
  .actionForSet('set', 'NX')  // set test:parameters 123 NX
  .from(async function() {
    return 123;
  })
  .exec();

// change to another redis client
const redis2 = new Redis({
  port: 6379,
  host: "127.0.0.1",
  family: 4,
  db: 1
});

const res = await cacheLayer
  .redisClient(redis2)
  .cache('test:basic')
  .from('i am string')
  .exec();

// customize check function
const cacheLayer = new CacheLayer();
await cacheLayer.redisClient(redis)
  .cache('test:assertFn') // first, put a key
  .from('123')
  .exec();

await cacheLayer
  .cache('test:assertFn')
  .actionForGet('get')        // get test:assertFn
  .assert(async function(res) {
   	return res === '345';   // if test:parameters is not 345, then set test:parameters 345
   })
  .actionForSet('set')  // set test:parameters 123
  .from(async function() {
   	return '345';
   })
  .exec();

```

See `test.js` for more examples.

## Updates

**1.0.3**

- Add assert function，customize check function whether to fill data or not.



## License

  MIT