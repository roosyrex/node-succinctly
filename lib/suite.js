// Dependencies.

var _       = require('lodash');
var request = require('supertest');
var utils   = require('./utils');
var status  = require('statuses');

// Defaults.

var defaultTestPattern = 'User: {{test:username}} ~ {{test:statusCode}} \'{{test:statusMsg}}\'';
var defaultNoAuthName  = 'Unauthorised Ursula';

// Exports.

function Suite (options) {

  this.method      = options.method;
  this.urlPrefix   = options.urlPrefix || '';
  this.url         = options.url;
  this.body        = this.aboutDoc = options.body;
  this.app         = options.app;
  this.fns         = options.fns;
  this.namePattern = options.namePattern || '(Unknown)';
  this.testPattern = options.testPattern || defaultTestPattern;
  this.noAuthName  = options.noAuthName || defaultNoAuthName;

  this.tests        = [];
  this.aboutDoc     = this.aboutDoc || {};
  this.additionalFn = function (request, done) { done(); };

}

Suite.prototype.describe = Suite.prototype.to = function (descPattern) {
  this.descPattern = descPattern;
  return this;
};

Suite.prototype.about = function (aboutDoc) {
  this.aboutDoc = aboutDoc;
  return this;
};

Suite.prototype.additionally = function (additional) {
  this.additionalFn = additional;
  return this;
};

Suite.prototype.with = function (user, statusCode) {

  var username = user ?
      utils.buildString(this.namePattern, { about: this.aboutDoc, user: user, test: {} }) :
      this.noAuthName;

  this.tests.push({
    user       : user,
    username   : username,
    statusCode : statusCode,
    statusMsg  : status[statusCode]
  });

  return this;

};

Suite.prototype.titled = function (testPattern) {
  this.testPattern = testPattern;
  return this;
};

Suite.prototype.then = function (then) {
  if (this.tests.length)
    this.tests[this.tests.length - 1].then = then;
  return this;
};

Suite.prototype.run = function () {

  var self      = this;
  var testStack = [];
  var params    = {
    method : self.method
  };

  if (self.descPattern)
    describe(utils.buildString(self.descPattern, { about: self.aboutDoc, user: {}, test: params }), tests);
  else
    describe('', tests);

  function tests () {

    // Before each: login with user of next test.

    beforeEach(function (done) {
      var nextTest = testStack[0];
      nextTest.agent = request.agent(self.app);
      if (nextTest.user)
        self.fns.login(nextTest.agent, nextTest.user, done);
      else
        done();
    });

    // After each: logout with user of the last test.

    afterEach(function (done) {
      var lastTest = testStack[0];
      if (lastTest.user)
        self.fns.logout(lastTest.agent, lastTest.user, done);
      else
        done();
    });

    // After each: run 'then' function if defined.

    afterEach(function (done) {
      var lastTest = testStack[0];
      if (!lastTest.then) return done();
      self.fns[lastTest.then]({
        about : self.aboutDoc,
        res   : lastTest.res,
        err   : lastTest.err
      }, done);
    });

    // After each: shift the last test off the stack.

    afterEach(function () {
      testStack.shift();
    });

    // Iterate through tests and push to the stack for execution.

    _.each(self.tests, function (test) {

      testStack.push(test);

      var testDescription = utils.buildString(self.testPattern,
          { about: self.aboutDoc, user: test.user, test: _.extend(_.omit(test, 'user'), params) });

      it(testDescription, function (done) {

        params.url = utils.buildString(self.urlPrefix + self.url, { about: self.aboutDoc, user: {}, test: {} });

        var requester = test.agent[params.method](params.url);
        if (self.body) {
          if (typeof self.body === 'function') self.body = self.body();
          requester.send(self.body);
        }

        self.additionalFn(requester, function () {
          requester.expect(test.statusCode)
          .end(function (err, res) {
            test.err = err;
            test.res = res;
            done(err);
          });
        });

      });

    });

  }

};

module.exports = Suite;
