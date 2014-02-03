/* global describe, it */

var assert  = require('assert');
var retest  = require('../');
var fs      = require('fs');
var path    = require('path');
var https   = require('https');
var express = require('express');

describe('retest(app)', function () {
  it('should fire up the app on an ephemeral port', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send('hello');
    });

    retest(app).get('/', function (err, res, body) {
      assert.equal(body, 'hello');
      assert.equal(res.statusCode, 200);
      done(err);
    });
  });

  it('should work with an active server', function (done) {
    var app = express();

    app.get('/', function (req, res) {
      res.send('hello');
    });

    var server = app.listen(4000, function () {
      retest(server).get('/', function (err, res, body) {
        assert.equal(body, 'hello');
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

    var server = app.listen(4001, function () {
      retest('http://localhost:4001').get('/', function (err, res, body) {
        assert.equal(body, 'hello');
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

    retest(server).get('/', function (err, res, body) {
      assert.equal(body, 'hello');
      assert.equal(res.statusCode, 200);
      done(err);
    });
  });
});

describe('retest.agent(app)', function(){
  var app = express();

  app.use(express.cookieParser());

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
