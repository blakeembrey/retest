/* global describe, it */

var assert     = require('assert');
var retest     = require('../');
var fs         = require('fs');
var path       = require('path');
var https      = require('https');
var express    = require('express');
var formidable = require('formidable');

describe('retest(app)', function () {
  it('should fire up the app on an ephemeral port', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send('hello');
    });

    retest(app)('/', function (err, res) {
      assert.equal(res.body, 'hello');
      assert.equal(res.statusCode, 200);
      done(err);
    });
  });

  it('should work with an active server', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send('hello');
    });

    var server = app.listen(4001, function () {
      retest(server).get('/', function (err, res) {
        assert.equal(res.body, 'hello');
        assert.equal(res.statusCode, 200);
        done(err);
      });
    });
  });

  it('should work with a remote server', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send('hello');
    });

    var server = app.listen(4002, function () {
      retest('http://localhost:4002').get('/', function (err, res) {
        assert.equal(res.body, 'hello');
        assert.equal(res.statusCode, 200);
        done(err);
      });
    });
  });

  it.skip('should work with a https server', function (done) {
    var app      = express();
    var fixtures = path.join(__dirname, 'fixtures');

    app.get('/', function (req, res) {
      res.send('hello');
    });

    var server = https.createServer({
      key:  fs.readFileSync(path.join(fixtures, 'key.pem')),
      cert: fs.readFileSync(path.join(fixtures, 'cert.pem'))
    }, app);

    retest(server).get('/', function (err, res) {
      assert.equal(res.body, 'hello');
      assert.equal(res.statusCode, 200);
      done(err);
    });
  });

  it('should parse json response body', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send({ test: 'hello' });
    });

    retest(app).get('/', function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, { test: 'hello' });
      done(err);
    });
  });

  it('should parse url encoded response bodies', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.set('Content-Type', 'application/x-www-form-urlencoded');
      res.send('test=hello');
    });

    retest(app).get('/', function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, { test: 'hello' });
      done(err);
    });
  });

  it('should serialize json request bodies', function (done) {
    var app = express();

    app.use(require('body-parser').json());
    app.post('/', function (req, res) {
      assert.deepEqual(req.body, { test: 'hello' });

      res.send('success');
    });

    retest(app).post('/', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        test: 'hello'
      }
    }, function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, 'success');
      done(err);
    });
  });

  it('should serialize url encoded request bodies', function (done) {
    var app = express();

    app.use(require('body-parser').urlencoded({ extended: false }));
    app.post('/', function (req, res) {
      assert.deepEqual(req.body, { test: 'hello' });

      res.send('success');
    });

    retest(app).post('/', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        test: 'hello'
      }
    }, function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, 'success');
      done(err);
    });
  });

  it('should pipe to the request', function (done) {
    var app = express();

    app.use(require('body-parser').json());
    app.post('/', function (req, res) {
      assert.deepEqual(req.body, { test: 'hello' });

      res.send('success');
    });

    var req = retest(app).post('/', {
      headers: {
        'Content-Type': 'application/json'
      }
    }, function (err, res) {
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, 'success');
      done(err);
    });

    fs.createReadStream(__dirname + '/fixtures/test.txt').pipe(req);
  });
});

describe('retest.agent(app)', function () {
  var app = express();

  app.use(require('cookie-parser')());

  app.get('/', function (req, res) {
    res.cookie('cookie', 'hey');
    res.send();
  });

  app.get('/return', function (req, res) {
    res.send(req.cookies.cookie);
  });

  var agent = retest.agent(app);

  it('should save cookies', function (done) {
    agent.get('/', function (err, res) {
      assert.equal(res.headers['set-cookie'], 'cookie=hey; Path=/');
      return done(err);
    });
  });

  it('should send cookies', function (done) {
    agent.get('/return', function (err, res) {
      assert.equal(res.body, 'hey');
      return done(err);
    });
  });
});

describe('retest.form()', function () {
  var app = express();

  app.post('/', function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields) {
      res.send(fields.username);
    });
  });

  it('should post multipart body', function (done) {
    var form = retest.form();

    form.append('username', 'blakeembrey');

    retest(app).post('/', {
      body: form
    }, function (err, res) {
      assert.equal(res.body, 'blakeembrey');

      return done(err);
    });
  });
});
