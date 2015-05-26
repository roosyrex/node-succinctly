// Dependencies.

var _       = require('lodash');
var request = require('supertest');
var utils   = require('./utils');
var status  = require('statuses');

// Defaults.

var defaultTestPattern = 'User: <<name>> ~ <<statusCode>> \'<<statusMsg>>\'';
var defaultNoAuthName  = 'Unauthorized Ursula';

// Exports.

function Suite (options) {

  this.method      = options.method;
  this.urlPrefix   = options.urlPrefix || '';
  this.url         = options.url;
  this.app         = options.app;
  this.fns         = options.fns;
  this.namePattern = options.namePattern || '(Unknown)';
  this.testPattern = options.testPattern || defaultTestPattern;
  this.noAuthName  = options.noAuthName || defaultNoAuthName;
  
  this.tests  = [];
  this.forDoc = {};

}

Suite.prototype.describe = Suite.prototype.to = function (descPattern) {
  this.descPattern = descPattern;
  return this;
};

Suite.prototype.for = function (forDoc) {
  this.forDoc = forDoc;
  return this;
};

Suite.prototype.with = function (user, statusCode) {

  var username = user ?
      utils.buildString(this.namePattern, { for: this.forDoc, user: user, test: {} }) :
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

Suite.prototype.run = function () {

  var self   = this;
  var params = {
    method : self.method
  };

  params.url = utils.buildString(self.urlPrefix + self.url, { for: self.forDoc, user: {}, test: {} });

  if (self.descPattern)
    describe(utils.buildString(self.descPattern, { for: self.forDoc, user: {}, test: params }), tests);
  else
    tests();

  function tests () {

    _.each(self.tests, function (test) {

      var testName = utils.buildString(self.testPattern,
          { for: self.forDoc, user: test.user, test: _.extend(_.omit(test, 'user'), params) });

      it(testName, function (done) {

        var agent = request.agent(self.app);

        self.fns.login(agent, test.user, function (err) {

          if (err) return done(err);

          agent[params.method](params.url)
          .expect(test.statusCode)
          .end(function (err, res) {

            self.fns.logout(agent, test.user, function () { done(err); });

          });

        });

      });

    });

  }

};

module.exports = Suite;
