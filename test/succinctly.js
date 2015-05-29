var succinctly = require('..');
var app        = require('express')();

var alfred     = { id: 'ALFRED-AAA', name: { first: 'Alfred', last: 'Astley' } };
var bertie     = { id: 'BERTIE-BBB', name: { first: 'Bertie', last: 'Bowman' } };

var activeUser = null;

// Express server setup.

app.use(function (req, res, next) {
  if (activeUser) req.user = activeUser;
  next();
});

app.get('/api/users/:id', function (req, res) {
  if (!req.user) return res.sendStatus(401);
  else if (req.user.id !== req.params.id) return res.sendStatus(403);
  else return res.status(200).send('Welcome');
});

// Custom login/logout functions.

function login  (agent, user, done) { activeUser = user; done(); }
function logout (agent, user, done) { activeUser = null; done(); }

// Setup Routinely.

succinctly.configure({
  app       : app,
  tests: {
    urlPrefix   : '/api',
    testPattern : '{{test:username}} issued a \'{{test:method}}\' to \'{{test:url}}\' and a {{test:statusCode}} was returned'
  },
  users: {
    noAuthName  : 'Sneaky Sue',
    namePattern : '{{user:name.first}} {{user:name.last}}',
    login       : login
  }
});

succinctly.use('logout', logout);

// Run tests.

describe('Profile access suite', function (test) {

  before(function (done) {
    done();
  });

  succinctly.get('/users/' + alfred.id)
  .to('Fetch Alfred\'s user profile')
  .with(alfred, 200)
  .with(bertie, 403)
  .with(null,   401)
  .run();

  succinctly.get('/users/{{about:id}}')
  .about(bertie)
  .describe('Fetch {{about:name.first}}\'s user profile')
  .with(bertie, 200)
  .with(alfred, 403)
  .with(null,   401)
  .titled('You had better receive a {{test:statusCode}} {{test:username}}')
  .run();

  after(function (done) {
    done();
  });

});
