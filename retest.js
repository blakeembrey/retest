var url     = require('url');
var http    = require('http');
var https   = require('https');
var request = require('request');
var copy    = require('request/lib/copy');
var qs      = require('qs');

/**
 * Return the mime type for a given string.
 *
 * @param  {String} str
 * @return {String}
 */
var type = function (str) {
  return (str || '').split(/ *; */)[0];
};

/**
 * Check if the object is a host object, we don't to serialize these.
 *
 * @param  {*}       obj
 * @return {Boolean}
 */
var isHost = function (obj) {
  return typeof obj === 'string' || obj instanceof Buffer;
};

/**
 * Serialize request body based on content type.
 *
 * @type {Object}
 */
var serialize = {
  'application/json': JSON.stringify,
  'application/x-www-form-urlencoded': qs.stringify
};

/**
 * Parse data based on the response content type.
 *
 * @type {Object}
 */
var parse = {
  'application/json': JSON.parse,
  'application/x-www-form-urlencoded': qs.parse
};

/**
 * Return an application url.
 *
 * @param  {Object} app
 * @param  {String} path
 * @return {String}
 */
var serverAddress = function (app, path) {
  // Ensure the passed in path is in string format.
  if (typeof path === 'object') {
    path = url.format(path);
  }

  // If the application url is a string, all direct requests.
  if (typeof app === 'string') {
    return url.resolve(app, path);
  }

  // The application has not been mounted to a port yet, assign a random port.
  if (!app.address()) {
    app.listen(0);
  }

  var port     = app.address().port;
  var protocol = app instanceof https.Server ? 'https' : 'http';

  return url.resolve(protocol + '://localhost:' + port, path);
};

/**
 * Create a request instance for a particular application.
 *
 * @param  {Object}   app
 * @return {Function}
 */
var retest = function (app) {
  /**
   * Returns a function that maps to request expections.
   *
   * @param  {String}   uri
   * @param  {Object}   options
   * @param  {Function} done
   * @return {Object}
   */
  return function (uri, options, done) {
    if (typeof uri === 'undefined') {
      throw new Error('undefined is not a valid uri or options object');
    }

    if (typeof options === 'function' && !done) {
      done = options;
    }

    if (options && typeof options === 'object') {
      options.uri = uri;
    } else if (typeof uri === 'string') {
      options = { uri: uri };
    } else {
      options = uri;
    }

    options = copy(options);

    if (done) {
      // Override request callback options to include additional parsing logic
      // and remove the third response body argument.
      options.callback = function (err, res) {
        var parser = parse[type(res.headers['content-type'])];

        if (res.req.method !== 'HEAD' && parser) {
          res.body = parser(res.body);
        }

        return done(err, res);
      };
    }

    if (options.body && !isHost(options.body)) {
      var contentType;

      // Iterate over headers and find the content type.
      for (var key in options.headers) {
        if (key.toLowerCase() === 'content-type') {
          contentType = type(options.headers[key]);
          break;
        }
      }

      var serializer = serialize[contentType];

      if (serializer) {
        options.body = serializer(options.body);
      }
    }

    // Correct the request uri.
    options.uri = serverAddress(app, options.uri);

    return new request.Request(options);
  };
};

/**
 * Generate an instance of the application for testing with request.
 *
 * @param  {Object}   app
 * @return {Function}
 */
exports = module.exports = function (app) {
  if (typeof app === 'function') {
    app = http.createServer(app);
  }

  var requester = retest(app);
  var fn        = request.defaults({}, requester);

  /**
   * Expose the `defaults` function to retest defaults.
   *
   * @param  {Object}   opts
   * @return {Function}
   */
  fn.defaults = function (opts) {
    return request.defaults(opts, requester);
  };

  /**
   * Expose the `forever` functionality of request to the retest instance.
   *
   * @param  {Object}   agentOptions
   * @param  {Object}   optionsArg
   * @return {Function}
   */
  fn.forever = function (agentOptions, optionsArg) {
    var options = {}

    if (optionsArg) {
      for (var option in optionsArg) {
        options[option] = optionsArg[option];
      }
    }

    if (agentOptions) {
      options.agentOptions = agentOptions;
    }

    options.forever = true;

    return fn.defaults(options);
  };

  return fn;
};

/**
 * Create a retest agent for keeping cookies.
 *
 * @param  {Object}   app
 * @param  {Object}   opts
 * @return {Function}
 */
exports.agent = function (app, opts) {
  var options = opts ? copy(opts) : {};
  options.jar || (options.jar = request.jar());

  return exports(app).defaults(options);
};
