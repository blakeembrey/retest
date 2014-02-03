# retest

Request driven library for testing node.js HTTP servers. Based on [supertest](https://github.com/visionmedia/supertest).

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

All API methods from [request](https://github.com/mikeal/request) work as usual after calling `retest` with your application.

### Agent

Create an instance that will reuse cookies between requests by calling `retest.agent(app)`.

## License

MIT
