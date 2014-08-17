# Retest

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gittip][gittip-image]][gittip-url]

Request driven library for testing node.js HTTP servers via [request](https://github.com/mikeal/request).

## Installation

```
npm install retest --save-dev
```

## Usage

You may pass a `http.Server`, function or string to `retest()` - if the server is not listening for connections it will be bound to an ephemeral port so there is no need to keep track of ports.

```javascript
var retest  = require('retest');
var express = require('express');

var app = express();

app.get('/', function (req, res) {
  res.send('hello');
});

retest(app).get('/user', function (err, res) {
  if (err) throw err;
});
```

A retest instance accepts the same arguments as [request](https://github.com/mikeal/request), including the [options object](https://github.com/mikeal/request#requestoptions-callback).

### Callbacks

The callback function is called with two arguments, the `error` and `response`. The response body will be automatically parsed when possible based on the content type (current `application/json` and `application/x-www-form-urlencoded`).

### Agent

Create an instance that will reuse cookies between requests by calling `retest.agent(app)`.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/retest.svg?style=flat
[npm-url]: https://npmjs.org/package/retest
[travis-image]: https://img.shields.io/travis/blakeembrey/retest.svg?style=flat
[travis-url]: https://travis-ci.org/blakeembrey/retest
[coveralls-image]: https://img.shields.io/coveralls/blakeembrey/retest.svg?style=flat
[coveralls-url]: https://coveralls.io/r/blakeembrey/retest?branch=master
[gittip-image]: https://img.shields.io/gittip/blakeembrey.svg?style=flat
[gittip-url]: https://www.gittip.com/blakeembrey
