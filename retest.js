var url     = require('url');
var http    = require('http');
var https   = require('https');
var request = require('request');
var copy    = require('request/lib/copy');

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
      options.callback = done;
    }

    // Correct the request uri.
    options.uri = serverAddress(app, options.uri);

    return new request.Request(options);
  };
};

/**
 * Generate an instance of the application for testing with request. Pass a
 * custom request instance as the second parameter.
 *
 * @param  {Object}   app
 * @param  {Object}   opts
 * @return {Function}
 */
exports = module.exports = function (app, opts) {
  if (typeof app === 'function') {
    app = http.createServer(app);
  }

  return request.defaults(opts || {}, retest(app));
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

  return exports(app, options);
};
