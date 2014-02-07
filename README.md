# Retest

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
