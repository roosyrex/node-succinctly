var _       = require('lodash');
var request = require('supertest');
var Suite   = require('./lib/suite');

var opts = {
  fns: {}
};

// Exports.

exports.configure = function (options) {

  options = options || {};

  opts.app = options.app;

  var tests = options.tests || {};

  if (tests.urlPrefix)   opts.urlPrefix   = tests.urlPrefix;
  if (tests.testPattern) opts.testPattern = tests.testPattern;

  var users = options.users || {};

  if (users.noAuthName)  opts.noAuthName  = users.noAuthName;
  if (users.namePattern) opts.namePattern = users.namePattern;
  if (users.login)       opts.fns.login   = users.login;
  if (users.logout)      opts.fns.logout  = users.logout;

};

_.each(_.keys(request()), function (method) {

  exports[method] = function (url, body) {
    return new Suite(_.extend({
      method : method,
      url    : url,
      body   : body
    }, opts));
  };

});

exports.use = function (id, fn) { opts.fns[id] = fn; };

exports.fns = opts.fns;
